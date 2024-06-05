const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ObbaraMarket API",
      version: "1.0.0",
      description: "API documentation for ObbaraMarket.",
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
        },
      },
    },
  },
  apis: ["./routes/authRoute.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
