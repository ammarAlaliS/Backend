const asyncHandler = require("express-async-handler");
const QuickCar = require("../../models/quickCarModel");
const {
  deleteImageFromStorage,
  processImages,
} = require("../StorageController");
const mongoose = require("mongoose");
const { Storage } = require("@google-cloud/storage");

const createQuickCar = asyncHandler(async (req, res) => {
  let {
    vehicleType,
    vehicleModel,
    drivingLicense,
    starLocation,
    endLocation,
    startTime,
    endTime,
    regularDays,
    availableSeats,
    pricePerSeat,
    TripFare,
    PricePerKilometer,
    currentQuickCarLocation,
  } = req.body;

  vehicleType = vehicleType.trim();
  regularDays = regularDays.split(",").map((day) => day.trim());

  const existingQuickCar = await QuickCar.findOne({ user: req.user._id });
  if (existingQuickCar) {
    return res
      .status(400)
      .json({ message: "El usuario ya está registrado como conductor" });
  }

  if (!req.files["vehicleModelImage"]) {
    return res
      .status(400)
      .json({ message: "La imagen del vehiculo es requerida" });
  }

  if (!req.files["drivingLicenseImage"]) {
    return res
      .status(400)
      .json({ message: "La imagen de la licensia es requerida" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const vehicleModelImageUrls = await processImages(
      req.files["vehicleModelImage"]
    );

    const drivingLicenseImageUrls = await processImages(
      req.files["drivingLicenseImage"]
    );

    const newQuickCar = new QuickCar({
      driverIsActiveState: true,
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
      startTime: JSON.parse(startTime),
      endTime: JSON.parse(endTime),
      regularDays,
      availableSeats: parseFloat(availableSeats),
      pricePerSeat: parseFloat(pricePerSeat),
      TripFare: parseFloat(TripFare),
      PricePerKilometer: parseFloat(PricePerKilometer),
      starLocation: JSON.parse(starLocation),
      endLocation: JSON.parse(endLocation),
      user: req.user._id,
      CurrentQuickCarLocation: JSON.parse(currentQuickCarLocation),
    });
    const savedQuickCar = await newQuickCar.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Poblar el usuario sin los campos sensibles y sin blogs y likes
    const populatedQuickCar = await QuickCar.populate(savedQuickCar, []);

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
    const quickCars = await QuickCar.find();
    res.status(200).json(quickCars);
  } catch (error) {
    console.error("Error fetching QuickCars:", error);
    res
      .status(500)
      .json({ message: "Error fetching QuickCars", error: error.message });
  }
});

// Controlador para obtener un QuickCar por ID
const getQuickCarByGlobalUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    const quickCar = await QuickCar.find({
      user: userId,
    });
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
    vehicleModelImageSavedUrl,
    drivingLicenseImageSavedUrl,
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const quickCar = await QuickCar.findById(id).session(session);
    if (!quickCar) {
      return res.status(404).json({ message: "QuickCar no encontrado" });
    }

    let regularDaysSplit = regularDays
      ? regularDays.split(",").map((day) => day.trim())
      : null;
    let vehicleTypeTrim = vehicleType ? vehicleType.trim() : null;

    quickCar.driverIsActiveState =
      driverIsActiveState || quickCar.driverIsActiveState;
    quickCar.vehicleType = vehicleTypeTrim || quickCar.vehicleType;
    quickCar.vehicleModel = vehicleModel || quickCar.vehicleModel;
    quickCar.drivingLicense = drivingLicense || quickCar.drivingLicense;
    quickCar.startTime = startTime || quickCar.startTime;
    quickCar.endTime = endTime || quickCar.endTime;
    quickCar.regularDays = regularDaysSplit || quickCar.regularDays;
    quickCar.availableSeats = availableSeats || quickCar.availableSeats;
    quickCar.pricePerSeat = pricePerSeat || quickCar.pricePerSeat;
    quickCar.TripFare = TripFare || quickCar.TripFare;
    quickCar.PricePerKilometer =
      PricePerKilometer || quickCar.PricePerKilometer;
    quickCar.starLocation =
      startLocationName && startLocationLatitude && startLocationLongitude
        ? {
            startLocationName: startLocationName,
            latitude: startLocationLatitude,
            longitude: startLocationLongitude,
          }
        : quickCar.starLocation;
    quickCar.endLocation =
      endLocationName && endLocationLatitude && endLocationLongitude
        ? {
            endLocationName: endLocationName,
            latitude: endLocationLatitude,
            longitude: endLocationLongitude,
          }
        : quickCar.endLocation;

    for (let i = 0; i < quickCar.vehicleModelImage.length; i++) {
      if (
        vehicleModelImageSavedUrl == null ||
        vehicleModelImageSavedUrl == undefined ||
        vehicleModelImageSavedUrl.split(",").map((day) => day.trim()).length ==
          0 ||
        vehicleModelImageSavedUrl
          .split(",")
          .map((day) => day.trim())
          .indexOf(quickCar.vehicleModelImage[i].url) < 0
      ) {
        await deleteImageFromStorage(quickCar.vehicleModelImage[i].url);
      }
    }

    for (let i = 0; i < quickCar.drivingLicenseImage.length; i++) {
      if (
        drivingLicenseImageSavedUrl == null ||
        drivingLicenseImageSavedUrl == undefined ||
        drivingLicenseImageSavedUrl.split(",").map((day) => day.trim())
          .length == 0 ||
        drivingLicenseImageSavedUrl
          .split(",")
          .map((day) => day.trim())
          .indexOf(quickCar.drivingLicenseImage[i].url) < 0
      ) {
        await deleteImageFromStorage(quickCar.drivingLicenseImage[i].url);
      }
    }

    const vehicleModelImageUrls = await processImages(
      req.files["vehicleModelImage"]
    );

    const drivingLicenseImageUrls = await processImages(
      req.files["drivingLicenseImage"]
    );

    if (vehicleModelImageUrls) {
      let vehicleModelImageData = [];

      for (let i = 0; i < vehicleModelImageUrls.length; i++) {
        vehicleModelImageData.push({
          url: vehicleModelImageUrls[i],
          alt: quickCar.vehicleType + " " + quickCar.vehicleModel,
        });
      }

      for (
        let i = 0;
        i <
        vehicleModelImageSavedUrl.split(",").map((day) => day.trim()).length;
        i++
      ) {
        vehicleModelImageData.push({
          url: vehicleModelImageSavedUrl.split(",").map((day) => day.trim())[i],
          alt: quickCar.vehicleType + " " + quickCar.vehicleModel,
        });
      }

      quickCar.vehicleModelImage = vehicleModelImageData;
    }

    if (drivingLicenseImageUrls) {
      let drivingLicenseImageUrlsData = [];

      for (let i = 0; i < drivingLicenseImageUrls.length; i++) {
        drivingLicenseImageUrlsData.push({
          url: drivingLicenseImageUrls[i],
          alt: "",
        });
      }

      for (
        let i = 0;
        i < drivingLicenseImageUrls.split(",").map((day) => day.trim()).length;
        i++
      ) {
        drivingLicenseImageUrlsData.push({
          url: drivingLicenseImageUrls.split(",").map((day) => day.trim())[i],
          alt: "",
        });
      }

      quickCar.vehicleModelImage = drivingLicenseImageUrlsData;
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
      for (let i = 0; i < quickCar.vehicleModelImage.length; i++) {
        await deleteImageFromStorage(quickCar.vehicleModelImage[i].url);
      }
    }

    if (quickCar.drivingLicenseImage && quickCar.drivingLicenseImage[0]) {
      for (let i = 0; i < quickCar.drivingLicenseImage.length; i++) {
        await deleteImageFromStorage(quickCar.drivingLicenseImage[i].url);
      }
    }

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
  getQuickCarByGlobalUserId,
  updateQuickCar,
  deleteQuickCar,
};
