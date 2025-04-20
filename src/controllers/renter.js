import dotenv from "dotenv";
import { databases, users, storage } from "../utils/appwrite.js";
import sdk from "node-appwrite";

dotenv.config();

export const sendVerificationRequest = async (req, res) => {
  try {
    const userId = req.headers["user-id"];
    const user = await users.get(userId);

    if (user.emailVerification || user.phoneVerification) {
      res.status(400).json({ message: "User already verified" });
      return;
    }

    const verificationRequests = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_VERIFY_REQUESTS_COLLECTION_ID,
      [sdk.Query.equal("userId", userId)]
    );

    if (verificationRequests.documents.length > 0) {
      res.status(400).json({ message: "Verification request already sent" });
      return;
    }
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_VERIFY_REQUESTS_COLLECTION_ID,
      sdk.ID.unique(),
      {
        userId: userId,
        verified: false,
      }
    );

    res.status(200).json({ message: "Verification request sent" });
  } catch (error) {
    res.status(500).json("Internal Server Error");
  }
};

export const getVerificationRequest = async (req, res) => {
  try {
    const userId = req.headers["user-id"];

    const verificationRequests = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_VERIFY_REQUESTS_COLLECTION_ID,
      [sdk.Query.equal("userId", userId)]
    );

    if (verificationRequests.total <= 0) {
      return res.status(400).json({ message: "Not found" });
    }

    res.status(200).json(verificationRequests.documents);
  } catch (error) {
    res.status(500).json("Internal Server Error");
  }
};

export const createScooter = async (req, res) => {
  try {
    const { name, price, maxSpeed, rentType, latitude, longitude } = req.body;
    const userId = req.headers["user-id"];
    if (!name || !price || !maxSpeed || !rentType || !userId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    let imageIds = [];
    for (const file of req.files) {
      if (!file.buffer || !file.originalname) {
        continue;
      }
      try {
        const inputFile = sdk.InputFile.fromBuffer(
          file.buffer,
          file.originalname
        );
        const uploaded = await storage.createFile(
          process.env.APPWRITE_SCOOTERS_IMAGES_BUCKET_ID,
          sdk.ID.unique(),
          inputFile
        );
        imageIds.push(uploaded.$id);
      } catch (err) {
        console.error("Image upload failed:", err.message);
      }
    }

    if (imageIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No images were uploaded successfully" });
    }

    const doc = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SCOOTER_COLLECTION_ID,
      sdk.ID.unique(),
      {
        name,
        price: Number(price),
        maxSpeed: Number(maxSpeed),
        rentType: rentType.toLowerCase(),
        images: imageIds,
        battery: 100,
        rented: false,
        latitude: latitude ? Number(latitude) : 0,
        longitude: longitude ? Number(longitude) : 0,
        renterUserId: userId,
      }
    );
    res.status(201).json({
      message: "Scooter created successfully",
      scooterId: doc.$id,
      images: imageIds,
    });
  } catch (error) {
    res.status(500).json({ message: "Create failed", error: error.message });
  }
};

export const getRentingScooters = async (req, res) => {
  try {
    const userId = req.headers["user-id"];
    const scooters = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SCOOTER_COLLECTION_ID,
      [sdk.Query.equal("renterUserId", userId)]
    );
    res.status(200).json(scooters.documents);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
