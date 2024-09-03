const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
    {
      blog_image_url: [
        {
          url: {
            type: String,
            required: [true, "La URL de la imagen del blog es requerida"],
          },
          alt: {
            type: String,
            required: false,
            trim: true,
          },
        },
      ],
      title: {
        type: String,
        required: [true, "El título del blog es requerido"],
        minlength: [5, "El título debe tener al menos 5 caracteres"],
        maxlength: [100, "El título no puede tener más de 100 caracteres"],
      },
      tags: {
        type: [String],
      },
      blog_category: {
        type: String,
        enum: ["Todos", "Coches", "Motocicletas", "Variados", "Noticias"],
        default: "Todos",
      },
      blog_description: {
        type: String,
        required: [true, "La descripción del blog es requerida"],
        minlength: [10, "La descripción debe tener al menos 10 caracteres"],
      },
      sections: [
        {
          section_imgs: [
            {
              url: {
                type: String,
                required: [true, "La URL de la imagen de la sección es requerida"],
              },
              alt: {
                type: String,
                required: false,
                trim: true,
              },
            },
          ],
          title: {
            type: String,
          },
          content: [
            {
              text: {
                type: String,
                required: [true, "El texto del contenido es requerido"],
              },
              links: [
                {
                  title: {
                    type: String,
                    trim: true,
                  },
                  url: {
                    type: String,
                  },
                },
              ],
            },
          ],
          list: {
            type: [String],
          },
        },
      ],
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "El usuario del blog es requerido"],
      },
      comments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Comment",
        },
      ],
      likes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Like",
        },
      ],
    },
    {
      timestamps: true,
    }
  );
  
  // Índices para búsqueda de texto
  blogSchema.index({
    title: "text",
    blog_description: "text",
    "sections.title": "text",
    "sections.content.text": "text",
  });
  
  module.exports = mongoose.model("Blog", blogSchema);
  