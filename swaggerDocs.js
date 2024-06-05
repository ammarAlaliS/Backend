const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swaggerConfig");

const setupSwaggerDocs = (app, port) => {
  // Route-Handler to visit our docs
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    // Configure Swagger UI
    swaggerOptions: {
      // Mostrar modelos por defecto (incluyendo el encabezado de autorización)
      defaultModelsExpandDepth: -1
    }
  }));

  // Make our docs in JSON format available
  app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(`Docs are available on http://localhost:${port}/api/docs`);
};

module.exports = setupSwaggerDocs;
