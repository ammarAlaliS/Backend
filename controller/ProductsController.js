const asyncHandler = require("express-async-handler");
const Product = require("../models/ProductModel");

// Obtener productos filtrados
const getProducts = asyncHandler(async (req, res) => {
  const {
    productCategory,
    minPrice,
    maxPrice,
    search,
    minDate,
    maxDate,
    page = 1,
    limit = 15,
  } = req.query;

  let filter = {};

  if (productCategory) {
    filter.productCategory = productCategory;
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = minPrice;
    if (maxPrice) filter.price.$lte = maxPrice;
  }

  if (search) {
    filter.$or = [
      { productName: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { productCategory: { $regex: search, $options: "i" } },
      { productStatus: { $regex: search, $options: "i" } },
    ];
  }

  if (minDate || maxDate) {
    if (minDate) filter.createdAt.$gte = Date.parse(minDate.toString());
    if (maxDate) filter.createdAt.$lte = Date.parse(minDate.toString());
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    populate: "user",
  };
  try {
    const products = await Product.paginate(filter, options);
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Crear un producto
const createProduct = asyncHandler(async (req, res) => {
  const {
    productName,
    productCategory,
    productStatus,
    productLocation,
    description,
    price,
    image,
    stock,
  } = req.body;
  // Obtener el ID de usuario del token decodificado
  const userId = req.user.id;

  if (
    !productName ||
    !productCategory ||
    !productStatus ||
    !productLocation ||
    !description ||
    !price ||
    !image ||
    !stock
  ) {
    return res
      .status(400)
      .json({ error: "Por favor, proporciona todos los campos requeridos" });
  }

  try {
    // Crear el producto asociado con el usuario
    const product = new Product({
      productName,
      productCategory,
      productStatus,
      productLocation,
      description,
      price,
      image,
      stock,
      user: userId,
    });

    const createdProduct = await product.save();
    return res.status(201).json(createdProduct);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Error al crear el producto" + error.message });
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const {
    id,
    productName,
    description,
    price,
    productCategory,
    productStatus,
    productLocation,
    image,
    stock,
  } = req.body;

  try {
    const product = await Product.findById(id);
    const userId = req.user.id;

    if (userId != product.user._id) {
      return res
        .status(400)
        .json({ error: "No puedes actualizar este producto" });
    }

    if (product) {
      product.productName = productName || product.productName;
      product.description = description || product.description;
      product.price = price || product.price;
      product.productCategory = productCategory || product.productCategory;
      product.productStatus = productStatus || product.productStatus;
      product.productLocation = productLocation || product.productLocation;
      product.image = image || product.image;
      product.stock = stock || product.stock;

      const updatedProduct = await product.save();
      return res.json(updatedProduct);
    } else {
      return res.status(404).json({ error: "No se encotro el producto" });
    }
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
};
