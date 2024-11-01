const express = require("express");
const {
  createDriverUser,
  loginUserCtrl,
  getUsers,
  findUser,
  deleteUser,
  updateUser,
  blockUser,
  unBlockUser,
  handleRefreshToken,
  findDeletedAccounts,
  updateUserRole,
  checkSession
} = require("../controller/userController");
const {
  authMiddleware,
  isAdmin,
  auth
  
} = require("../middleawares/authMiddleWare");
const {
  createTrip,
  joinTrip,
  getAllTrips,
  updateTripStatus,
} = require("../controller/DriverLogic/TripController");
const { upload, createUser } = require("../controller/imageController");
const {
  createBlog,
  handleFormData,
  getAllBlogs,
  deleteBlogById,
} = require("../controller/BlogController");
const {
  getProducts,
  createProduct,
  updateProduct,
} = require("../controller/ProductsController");
const {
  toggleLike,
  getBlogLikes,
  checkUserLike,
} = require("../controller/LikesController");
const {
  addComment,
  getCommentsByBlogId,
  getBlogComment,
} = require("../controller/CommentController");

const {
  handleProductFormData,
  handleDriverFormDataQuickCar,
} = require("../controller/StorageController");

const {
  createQuickCar,
  getAllQuickCars,
  getQuickCarByGlobalUserId,
  updateQuickCar,
  deleteQuickCar,
} = require("../controller/DriverLogic/DriverController");

const {
  getNearbyQuickCars,
  getNearbyLocationQuickCars,
} = require("../controller/DriverLogic/CalculateDriversDistanceInKm");

const {
  sendMessage,
  getConversationWithUser,
  GetUserInformacionToListMyUsersInteraction

} = require("../controller/MessageLogic/MessageController");

const { sendVerificationCode, verifyCode } = require('../controller/AuthVerifyEmail/VerifyControllers'); 


const router = express.Router();

router.post('/send-code', sendVerificationCode);
router.post('/verify-code', verifyCode);

router.post(
  "/driver/register",
  authMiddleware,
  handleDriverFormDataQuickCar,
  createQuickCar
);
router.get("/drivers", getAllQuickCars);
router.get("/driver/:userId", getQuickCarByGlobalUserId);
router.put("/driver/:id", handleDriverFormDataQuickCar, updateQuickCar);
router.delete("/driver/:id", deleteQuickCar);

router.get("/drivers-nearby", getNearbyQuickCars);
router.get("/drivers-nearby-trip-filters", getNearbyLocationQuickCars);

router.post("/send/:receiverId", authMiddleware, sendMessage);
router.get('/user/information/conversations/:userId', authMiddleware, GetUserInformacionToListMyUsersInteraction);
router.get('/conversations/:userId', authMiddleware, getConversationWithUser);


/**
 * @swagger
 * /api/ObbaraMarket/users:
 *   get:
 *     summary: Get users
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       400:
 *         description: Bad request
 */
router.get("/all-users", getUsers);

/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: Blog management
 */

/**
 * @swagger
 * /api/ObbaraMarket/create/blog:
 *   post:
 *     summary: Create a new blog
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Blog created successfully
 *       400:
 *         description: Bad request
 */
router.post(
  "/create/blog",
  authMiddleware,
  isAdmin,
  handleFormData,
  createBlog
);

router.delete("/delete/blog/:blogId", authMiddleware, isAdmin, deleteBlogById);
router.get("/blogs", getAllBlogs);

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Product management
 */

/**
 * @swagger
 * /api/ObbaraMarket/get/products:
 *   get:
 *     summary: Get products
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       400:
 *         description: Bad request
 */
router.get("/get/products", authMiddleware, getProducts);

/**
 * @swagger
 * /api/ObbaraMarket/create/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Bad request
 */
router.post(
  "/create/product",
  authMiddleware,
  handleProductFormData,
  createProduct
);

/**
 * @swagger
 * /api/ObbaraMarket/update/product:
 *   post:
 *     summary: Update a product
 *     tags: [Producto]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Bad request
 */
router.put(
  "/update/product",
  authMiddleware,
  handleProductFormData,
  updateProduct
);

/**
 * @swagger
 * tags:
 *   name: Comentarios
 *   description: Comment management
 */

/**
 * @swagger
 * /api/ObbaraMarket/blogs/{blogId}/comments:
 *   post:
 *     summary: Add a comment to a blog
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blogId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the blog
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Bad request
 */

router.post("/blogs/:blogId/comments", authMiddleware, addComment);
router.get("/blogs/:blogId/comments", getCommentsByBlogId);
router.get("/blogs/:blogId/totalComment", getBlogComment);

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: User management
 */
/**
 * @swagger
 * /api/ObbaraMarket/register:
 *   post:
 *     summary: Registrar a un nuevo usuario
 *     tags:
 *       - Usuarios
 *     description: Registrar un nuevo usuario con la información proporcionada.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 description: El primer nombre del usuario.
 *               last_name:
 *                 type: string
 *                 description: El apellido del usuario.
 *               email:
 *                 type: string
 *                 format: email
 *                 description: El correo del usuario.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: La contraña del usuario.
 *               profile_img_url:
 *                 type: file
 *                 format: binary
 *                 description: La imagen del usuario.
 *     responses:
 *       '201':
 *         description: User registered successfully
 *       '400':
 *         description: Bad request. Some required fields are missing or invalid.
 */

router.post("/register", upload, createUser);

/**
 * @swagger
 * /api/ObbaraMarket/driver/register:
 *   post:
 *     summary: Registro de conductor en la aplicación
 *     description: Permite a un usuario registrarse como conductor en la aplicación.
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 enum: [Coche, Moto]
 *                 description: Tipo de vehículo (Coche o Moto).
 *                 example: Coche
 *               vehicleModel:
 *                 type: string
 *                 description: Modelo del vehículo.
 *                 example: Toyota Corolla
 *               startLocation:
 *                 type: string
 *                 description: Ubicación de inicio del viaje.
 *                 example: Calle Principal 123
 *               endLocation:
 *                 type: string
 *                 description: Ubicación de destino del viaje.
 *                 example: Avenida Central 456
 *               startTime:
 *                 type: object
 *                 properties:
 *                   hour:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 23
 *                     description: Hora de inicio del viaje (hora).
 *                     example: 8
 *                   minute:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 59
 *                     description: Hora de inicio del viaje (minuto).
 *                     example: 30
 *               endTime:
 *                 type: object
 *                 properties:
 *                   hour:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 23
 *                     description: Hora de finalización del viaje (hora).
 *                     example: 10
 *                   minute:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 59
 *                     description: Hora de finalización del viaje (minuto).
 *                     example: 15
 *               regularDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo]
 *                 description: Días regulares disponibles para el viaje.
 *                 example: [Lunes, Miércoles, Viernes]
 *               availableSeats:
 *                 type: number
 *                 minimum: 1
 *                 description: Asientos disponibles en el vehículo.
 *                 example: 3
 *               pricePerSeat:
 *                 type: number
 *                 description: Precio por asiento.
 *                 example: 15.5
 *               image:
 *                 type: string
 *                 description: URL de la imagen del vehículo.
 *                 example: https://example.com/car-image.jpg
 *               drivingLicense:
 *                 type: string
 *                 description: Licencia de conducir del conductor.
 *                 example: A12345678
 *               fare:
 *                 type: number
 *                 description: Tarifa del viaje.
 *                 example: 25.75
 *             required:
 *               - vehicleType
 *               - vehicleModel
 *               - startLocation
 *               - endLocation
 *               - startTime
 *               - endTime
 *               - regularDays
 *               - availableSeats
 *               - pricePerSeat
 *               - fare
 *     responses:
 *       201:
 *         description: Conductor registrado con éxito.
 *       400:
 *         description: Solicitud incorrecta. Puede faltar información obligatoria o tener un formato incorrecto.
 *     security:
 *       - BearerAuth: []
 *
 *   securityDefinitions:
 *     BearerAuth:
 *       type: apiKey
 *       name: Authorization
 *       in: header
 */

router.post("/login", loginUserCtrl);
router.post ("/refresh-token", authMiddleware, handleRefreshToken)
router.get('/check-session', checkSession);




router.get("/user/:id", authMiddleware, findUser);

/**
 * @swagger
 * /api/ObbaraMarket/users:
 *   get:
 *     summary: Get users
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       400:
 *         description: Bad request
 */
router.put("/user/role", authMiddleware, updateUserRole);

/**
 * @swagger
 * /api/ObbaraMarket/user/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/ObbaraMarket/create-trip:
 *   post:
 *     summary: Create a new trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Trip created successfully
 *       400:
 *         description: Bad request
 */
router.post("/create-trip", authMiddleware, createTrip);
router.get("/trips", getAllTrips);
router.put("/update/trip-status", updateTripStatus);

/**
 * @swagger
 * /api/ObbaraMarket/subscribeToTrip/{tripId}:
 *   post:
 *     summary: Subscribe to a trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         schema:
 *           type: string
 *         required: true
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Subscribed to trip successfully
 *       400:
 *         description: Bad request
 */
router.post("/subscribeToTrip/:tripId", authMiddleware, joinTrip);

// Ruta para manejar los likes (toggle)
router.post("/like/:blogId", authMiddleware, toggleLike);
router.get("/blogs/:blogId/likes", getBlogLikes);
router.get("/like/check/:blogId", authMiddleware, checkUserLike);
router.post("/blogs/:blogId/comments", authMiddleware, addComment);

module.exports = router;
