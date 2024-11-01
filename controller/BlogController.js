const asyncHandler = require("express-async-handler");
const Blog = require("../models/Blog");
const { Storage } = require("@google-cloud/storage");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { deleteImageFromStorage } = require("./StorageController.js");

//==================================================================================================================================
// Configuración de Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: {
    private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
  },
});

const bucketName = "quickcar-storage";

const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });

const uploadImageToStorage = async (file, altText) => {
  const blob = storage
    .bucket(bucketName)
    .file(uuidv4() + "_" + file.originalname);
  const blobStream = blob.createWriteStream({ resumable: false });

  return new Promise((resolve, reject) => {
    blobStream.on("error", (err) => {
      reject(err);
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
      resolve(publicUrl); 
      console.log(`Imagen subida: ${publicUrl}`);
    });

    blobStream.end(file.buffer);
  });
};

const handleFormData = (req, res, next) => {
  upload.fields([
    { name: "blog_image_url", maxCount: 5 },
    { name: "section_imgs", maxCount: 10 }
  ])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: "Error uploading images", error: err });
    } else if (err) {
      return res.status(500).json({ message: "Internal server error", error: err });
    }
    next();
  });
};

// Función para procesar las imágenes de un campo específico
const processImages = async (files) => {
  let imageUrls = [];
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const imageUrl = await uploadImageToStorage(file, file.originalname);
        console.log(`URL de imagen subida: ${imageUrl}`);
        imageUrls.push(imageUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }1
  }
  return imageUrls;
};


const createBlog = async (req, res) => {
  const { title, tags, blog_description, sections, blog_category } = req.body;

 
  if (!title || !blog_description || !sections || sections.length === 0 || !blog_category) {
    return res.status(400).json({
      message: "Title, blog description, at least one section, and category are required",
    });
  }

  try {
    const blogImageFiles = req.files["blog_image_url"] || [];
    const blogImageUrls = await processImages(blogImageFiles);

    const sectionImageFiles = req.files["section_imgs"] || [];
    const sectionImageUrls = await processImages(sectionImageFiles);

    console.log("Section Image URLs:", sectionImageUrls);


    const processedSections = sections.map((section, index) => ({
      title: section.title || "",
      content: section.content.map(contentItem => ({
        text: contentItem.text || "",
        links: contentItem.links || []
      })),
      list: section.list || [],
      section_imgs: sectionImageUrls.slice(index * 10, (index + 1) * 10).map(url => ({
        url,
        alt: ""
      })),
    }));

    console.log("Processed Sections:", processedSections);
    const tagsArray = tags ? tags.split(",").map((tag) => tag.trim()) : [];

    const newBlog = new Blog({
      blog_image_url: blogImageUrls.map(url => ({ url })), 
      title,
      blog_description,
      sections: processedSections,
      user: req.user._id,
      tags: tagsArray,
      blog_category  
    });

    await newBlog.save();

    req.user.Blog.push(newBlog._id);
    await req.user.save();

    res.status(201).json(newBlog);
  } catch (error) {
    if (error.name === "ValidationError") {
      const validationErrors = {};
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });
      return res.status(400).json({ message: "Validation error", errors: validationErrors });
    }

    console.error("Error creating blog:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};


// ============================================================================================================================================

// Controlador para obtener todos los blogs
const getAllBlogs = asyncHandler(async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    // Asegurarse de que el valor de page y limit sea al menos 1
    page = Math.max(page, 1);
    limit = Math.max(limit, 1);

    const skip = (page - 1) * limit;

    const totalBlogs = await Blog.countDocuments();

    const blogs = await Blog.find()
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'user',  
        select: 'global_user.first_name global_user.last_name',
      });

    const totalPages = Math.ceil(totalBlogs / limit);

    res.status(200).json({
      blogs,
      currentPage: page,
      totalPages,
      totalBlogs
    });
  } catch (error) {
    console.error("Error fetching blogs:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});



// ==============================================================================================================================================

// Controlador para obtener un blog por su ID
const getBlogById = asyncHandler(async (req, res) => {
  const blogId = req.params.id;

  const blog = await Blog.findById(blogId)
    .populate("User", "first_name last_name")
    .populate("comments");

  if (!blog) {
    return res.status(404).json({ error: "Blog not found" });
  }

  res.status(200).json(blog);
});

// Controlador para actualizar un blog por su ID
const updateBlogById = asyncHandler(async (req, res) => {
  const blogId = req.params.id;
  const { blog_image_url, title, blog_description, tags } = req.body;

  const updatedBlog = await Blog.findByIdAndUpdate(
    blogId,
    {
      blog_image_url,
      title,
      blog_description,
      tags,
    },
    { new: true }
  );

  if (!updatedBlog) {
    return res.status(404).json({ error: "Blog not found" });
  }

  res.status(200).json(updatedBlog);
});
// =========================================================================================================================================

// Controlador para eliminar un blog por su ID
const deleteBlogById = asyncHandler(async (req, res) => {
  const blogId = req.params.blogId;
  try {
    const findBlogById = await Blog.findById(blogId);

    if (!findBlogById) {
      return res.status(404).json({ error: "Blog not found" });
    }
    if (findBlogById.blog_image_url && findBlogById.blog_image_url.length > 0) {
      const file = findBlogById.blog_image_url;
      await deleteImageFromStorage(file.url);
    }
    const deletedBlog = await Blog.findByIdAndDelete(blogId);
    if (!deletedBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlogById,
  deleteBlogById,
  uploadImageToStorage,
  handleFormData,
};
