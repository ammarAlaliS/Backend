const asyncHandler = require('express-async-handler');
const Product = require('../models/ProductModel');

// Obtener productos filtrados
const getProducts = asyncHandler(async (req, res) => {
    const { productType, minPrice, maxPrice, search } = req.query;

    let filter = {};

    if (productType) {
        filter.productType = productType;
    }

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = minPrice;
        if (maxPrice) filter.price.$lte = maxPrice;
    }

    if (search) {
        filter.$or = [
            { productName: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    const products = await Product.find(filter).populate('user');
    res.json(products);
});

// Crear un producto
const createProduct = asyncHandler(async (req, res) => {
    const { productName, productType, description, price, image } = req.body;

    // Obtener el ID de usuario del token decodificado
    const userId = req.user.id;

    if (!productName || !productType || !price) {
        res.status(400);
        throw new Error('Por favor, proporciona todos los campos requeridos');
    }

    try {
        // Crear el producto asociado con el usuario
        const product = new Product({
            productName,
            productType,
            productModel,
            description,
            price,
            image,
            user: userId
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500);
        throw new Error('Error al crear el producto');
    }
});

module.exports = {
    getProducts,
    createProduct
};
