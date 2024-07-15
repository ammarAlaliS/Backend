const asyncHandler = require("express-async-handler");
const QuickCar = require("../../models/quickCarModel");
const StartLocation = require("../../models/StartLocation");
const CurrentQuickCarLocation = require("../../models/QuickcarLocationModel");
const EndLocation = require("../../models/EndLocation");
const { deleteImageFromStorage } = require("../StorageController");
const mongoose = require("mongoose");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { Storage } = require("@google-cloud/storage");
const { format } = require("util");

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
      const publicUrl = format(
        `https://storage.googleapis.com/${bucketName}/${blob.name}`
      );
      resolve({ url: publicUrl, alt: altText });
      console.log(`Imagen subida: ${publicUrl}`);
    });

    blobStream.end(file.buffer);
  });
};

const handleDriverFormData = upload.fields([
  { name: "vehicleModelImage", maxCount: 5 },
  { name: "drivingLicenseImage", maxCount: 2 },
]);

const processImages = async (req, quickCar) => {
  const vehicleModelImages = req.files["vehicleModelImage"] || [];
  const drivingLicenseImages = req.files["drivingLicenseImage"] || [];

  let vehicleModelImageUrls = [];
  let drivingLicenseImageUrls = [];

  for (let i = 0; i < vehicleModelImages.length; i++) {
    const imageUrl = await uploadImageToStorage(
      vehicleModelImages[i],
      req.body.vehicleModelImageAlt || ""
    );
    vehicleModelImageUrls.push(imageUrl);
  }

  for (let i = 0; i < drivingLicenseImages.length; i++) {
    const imageUrl = await uploadImageToStorage(
      drivingLicenseImages[i],
      req.body.drivingLicenseImageAlt || ""
    );
    drivingLicenseImageUrls.push(imageUrl);
  }

  return {
    vehicleModelImageUrls,
    drivingLicenseImageUrls,
  };
};

const createQuickCar = asyncHandler(async (req, res) => {
  let {
    vehicleType,
    vehicleModel,
    drivingLicense,
    startLocationName,
    startLocationLatitude,
    startLocationLongitude,
    endLocationName,
    endLocationLatitude,
    endLocationLongitude,
    startTime,
    endTime,
    regularDays,
    availableSeats,
    pricePerSeat,
    TripFare,
    PricePerKilometer,
    CurrentLatitude,
    CurrentLongitude,
  } = req.body;

  vehicleType = vehicleType.trim();
  regularDays = regularDays.split(",").map((day) => day.trim());

  const existingQuickCar = await QuickCar.findOne({ user: req.user._id });
  if (existingQuickCar) {
    return res
      .status(400)
      .json({ message: "El usuario ya está registrado como conductor" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { vehicleModelImageUrls, drivingLicenseImageUrls } =
      await processImages(req);

    const foundStartLocation = await StartLocation.findOne({
      startLocationName,
    }).session(session);
    const foundEndLocation = await EndLocation.findOne({
      endLocationName,
    }).session(session);

    const foundCurrentQuickcarLocation = await CurrentQuickCarLocation.findOne({
      CurrentLatitude,
      CurrentLongitude,
    }).session(session);

    let newStartLocation, newEndLocation, newCurrentQuickcarLocation;

    if (!foundStartLocation) {
      newStartLocation = new StartLocation({
        startLocationName,
        latitude: startLocationLatitude,
        longitude: startLocationLongitude,
        driverUser: req.user._id,
      });
      await newStartLocation.save({ session });
    }

    if (!foundEndLocation) {
      newEndLocation = new EndLocation({
        endLocationName,
        latitude: endLocationLatitude,
        longitude: endLocationLongitude,
        driverUser: req.user._id,
      });
      await newEndLocation.save({ session });
    }

    if (!foundCurrentQuickcarLocation) {
      newCurrentQuickcarLocation = new CurrentQuickCarLocation({
        CurrentLatitude,
        CurrentLongitude,
      });
      await newCurrentQuickcarLocation.save({ session });
    }

    const starLocationId = foundStartLocation
      ? foundStartLocation._id
      : newStartLocation._id;
    const endLocationId = foundEndLocation
      ? foundEndLocation._id
      : newEndLocation._id;
    const currentQuickcarLocationId = foundCurrentQuickcarLocation
      ? foundCurrentQuickcarLocation._id
      : newCurrentQuickcarLocation._id;

    const newQuickCar = new QuickCar({
      vehicleType,
      vehicleModel,
      vehicleModelImage: vehicleModelImageUrls.map((url) => ({
        url: url.url,
        alt: req.body.vehicleModelImageAlt || "",
      })),
      drivingLicense,
      drivingLicenseImage: drivingLicenseImageUrls.map((url) => ({
        url: url.url,
        alt: req.body.drivingLicenseImageAlt || "",
      })),
      startTime,
      endTime,
      regularDays,
      availableSeats,
      pricePerSeat,
      TripFare,
      PricePerKilometer,
      starLocation: starLocationId,
      endLocation: endLocationId,
      user: req.user._id,
      CurrentQuickCarLocation: currentQuickcarLocationId,
    });
    const savedQuickCar = await newQuickCar.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Poblar el usuario sin los campos sensibles y sin blogs y likes
        const populatedQuickCar = await QuickCar.populate(savedQuickCar, [
            'CurrentQuickCarLocation'
        ]);

        res.status(201).json({
            quickCar: {
                ...populatedQuickCar.toObject(),
              
            },
        });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating QuickCar:", error);
    res
      .status(500)
      .json({ message: "Error creating QuickCar", error: error.message });
  }
});

// Controlador para obtener todos los QuickCars
const getAllQuickCars = asyncHandler(async (req, res) => {
  try {
    const quickCars = await QuickCar.find().populate(
      "starLocation endLocation CurrentQuickCarLocation",
    );
    res.status(200).json(quickCars);
  } catch (error) {
    console.error("Error fetching QuickCars:", error);
    res
      .status(500)
      .json({ message: "Error fetching QuickCars", error: error.message });
  }
});

// Controlador para obtener un QuickCar por ID
const getQuickCarById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const quickCar = await QuickCar.findById(id).populate(
      "starLocation endLocation"
    );
    if (!quickCar) {
      return res.status(404).json({ message: "QuickCar no encontrado" });
    }
    res.status(200).json(quickCar);
  } catch (error) {
    console.error("Error fetching QuickCar:", error);
    res
      .status(500)
      .json({ message: "Error fetching QuickCar", error: error.message });
  }
});

// Controlador para actualizar un QuickCar
const updateQuickCar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    driverIsActiveState,
    vehicleType,
    vehicleModel,
    drivingLicense,
    startLocationName,
    startLocationLatitude,
    startLocationLongitude,
    endLocationName,
    endLocationLatitude,
    endLocationLongitude,
    startTime,
    endTime,
    regularDays,
    availableSeats,
    pricePerSeat,
    TripFare,
    PricePerKilometer,
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const quickCar = await QuickCar.findById(id).session(session);
    if (!quickCar) {
      return res.status(404).json({ message: "QuickCar no encontrado" });
    }
    quickCar.driverIsActiveState = driverIsActiveState;
    quickCar.vehicleType = vehicleType.trim();
    quickCar.vehicleModel = vehicleModel;
    quickCar.drivingLicense = drivingLicense;
    quickCar.startTime = startTime;
    quickCar.endTime = endTime;
    quickCar.regularDays = regularDays.split(",").map((day) => day.trim());
    quickCar.availableSeats = availableSeats;
    quickCar.pricePerSeat = pricePerSeat;
    quickCar.TripFare = TripFare;
    quickCar.PricePerKilometer = PricePerKilometer;

    const { vehicleModelImageUrl, drivingLicenseImageUrl } =
      await processImages(req, quickCar);

    if (vehicleModelImageUrl) {
      quickCar.vehicleModelImage = [
        { url: vehicleModelImageUrl, alt: req.body.vehicleModelImageAlt || "" },
      ];
    }

    if (drivingLicenseImageUrl) {
      quickCar.drivingLicenseImage = [
        {
          url: drivingLicenseImageUrl,
          alt: req.body.drivingLicenseImageAlt || "",
        },
      ];
    }
    const startLocation = await StartLocation.findById(
      quickCar.starLocation
    ).session(session);
    if (startLocation) {
      startLocation.startLocationName = startLocationName;
      startLocation.latitude = startLocationLatitude;
      startLocation.longitude = startLocationLongitude;
      await startLocation.save({ session });
    }

    const endLocation = await EndLocation.findById(
      quickCar.endLocation
    ).session(session);
    if (endLocation) {
      endLocation.endLocationName = endLocationName;
      endLocation.latitude = endLocationLatitude;
      endLocation.longitude = endLocationLongitude;
      await endLocation.save({ session });
    }

    await quickCar.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json(quickCar);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating QuickCar:", error);
    res
      .status(500)
      .json({ message: "Error updating QuickCar", error: error.message });
  }
});

// Controlador para eliminar un QuickCar
const deleteQuickCar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const quickCar = await QuickCar.findById(id).session(session);
    if (!quickCar) {
      return res.status(404).json({ message: "QuickCar no encontrado" });
    }
    if (quickCar.vehicleModelImage && quickCar.vehicleModelImage[0]) {
      await deleteImageFromStorage(quickCar.vehicleModelImage[0].url);
    }

    if (quickCar.drivingLicenseImage && quickCar.drivingLicenseImage[0]) {
      await deleteImageFromStorage(quickCar.drivingLicenseImage[0].url);
    }
    await StartLocation.findByIdAndDelete(quickCar.starLocation).session(
      session
    );
    await EndLocation.findByIdAndDelete(quickCar.endLocation).session(session);
    await QuickCar.findByIdAndDelete(id).session(session);
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "QuickCar eliminado exitosamente" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error deleting QuickCar:", error);
    res
      .status(500)
      .json({ message: "Error deleting QuickCar", error: error.message });
  }
});

module.exports = {
  createQuickCar,
  getAllQuickCars,
  getQuickCarById,
  updateQuickCar,
  deleteQuickCar,
  handleDriverFormData,
};
