import { databases } from "../utils/appwrite.js";
import { Query } from "node-appwrite";
import dotenv from "dotenv";
import validator from "validator";
import geolib from "geolib";
import cache from "../utils/cache.js";
import sdk from "node-appwrite";
dotenv.config();

export const getAllScooters = async (req, res) => {
  try {
    const cachedScooters = cache.get("scooters");
    if (cachedScooters) {
      return res.status(200).json({ scooters: cachedScooters });
    }

    const scooters = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SCOOTER_COLLECTION_ID
    );
    if (scooters.documents.length <= 0) {
      return res.status(400).json({ message: "Scooters not found" });
    }

    cache.set("scooters", scooters.documents);

    res.status(200).json({ scooters: scooters.documents });
  } catch (error) {
    console.error(error);
    if (error.code === 404) {
      return res.status(404).json({ message: "Scooters not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getScooterById = async (req, res) => {
  try {
    const scooterId = req.body.scooterId;
    const scooter = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SCOOTER_COLLECTION_ID,
      scooterId
    );
    if (!scooter) {
      return res.status(404).json({ message: "Scooter not found" });
    }
    res.status(200).json({ scooter });
  } catch (error) {
    console.error(error);
    if (error.code === 404) {
      return res.status(404).json({ message: "Scooter not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllByFilters = async (req, res) => {
  try {
    const { filters } = req.body;
    if (!filters)
      return res.status(400).json({ message: "Filters are required" });
    // console.log(filters);

    const queryArray = [];
    let locationFilter = null;

    for (const [filter, value] of Object.entries(filters)) {
      if (filter === "rentType" && value && value !== "all") {
        if (value === "hourly" || value === "daily") {
          queryArray.push(Query.equal("rentType", value));
        } else {
          return res.status(400).json({ message: "Rent type is not valid" });
        }
      } else if (filter === "priceRange") {
        const { min, max } = value || {};
        if (
          (min && !validator.isInt(String(min))) ||
          (max && !validator.isInt(String(max)))
        ) {
          return res.status(400).json({ message: "Price range is not valid" });
        }
        if (min) queryArray.push(Query.greaterThanEqual("price", min));
        if (max) queryArray.push(Query.lessThanEqual("price", max));
      } else if (filter === "location") {
        locationFilter = value;
      } else if (filter === "rented") {
        if (value === true || value === false) {
          queryArray.push(Query.equal("rented", value));
        } else {
          return res
            .status(400)
            .json({ message: "Rented filter is not valid" });
        }
      }
    }

    const scooters = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SCOOTER_COLLECTION_ID,
      queryArray
    );
    if (locationFilter) {
      const { searchDistance, userCoords } = locationFilter || {};
      if (!searchDistance || !userCoords) {
        return res.status(400).json({
          message: "Search radius and user coordinates are required",
        });
      }
      scooters.documents = scooters.documents.filter((scooter) => {
        const distance = geolib.getDistance(
          { latitude: userCoords[0], longitude: userCoords[1] },
          { latitude: scooter.latitude, longitude: scooter.longitude }
        );
        return distance <= searchDistance; // in meters
      });
    }

    if (!scooters.documents.length)
      return res.status(400).json({ message: "Scooters not found" });

    return res.status(200).json({ scooters: scooters.documents });
  } catch (error) {
    console.error(error);
    const status = error.code === 404 ? 404 : 500;
    return res.status(status).json({
      message: status === 404 ? "Scooters not found" : "Internal server error",
    });
  }
};

export const rentScooter = async (req, res) => {
  try {
    const { scooterId, startRentTime, endRentTime, totalCost } = req.body;
    const userId = req.headers["user-id"];
    if (!userId || !scooterId || !startRentTime || !endRentTime) {
      return res.status(400).json({
        message: "User ID, scooter ID, start and end rent time are required",
      });
    }
    const scooterRented = await databases
      .getDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_SCOOTER_COLLECTION_ID,
        scooterId
      )
      .then((scooter) => scooter.rented);
    if (scooterRented) {
      return res.status(400).json({ message: "Scooter is already rented" });
    }
    const response = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SCOOTER_COLLECTION_ID,
      scooterId,
      {
        rented: true,
        startRentTime: startRentTime,
        endRentTime: endRentTime,
      }
    );
    const history = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_RENT_HISTORY_COLLECTION_ID,
      sdk.ID.unique(), // generate a unique ID for the rent history
      {
        userId: userId,
        scooterId: scooterId,
        startRentTime: startRentTime,
        endRentTime: endRentTime,
        totalCost: totalCost,
        status: "rented",
      }
    );
    if (!history || !response) {
      return res.status(404).json({ message: "Something went wrong" });
    }
    return res.status(200).json({ response });
  } catch (error) {
    console.error(error);
    if (error.code === 404) {
      return res.status(404).json({ message: "Scooter not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const cancelRent = async (req, res) => {
  try {
    const { scooterId } = req.body;
    const userId = req.headers["user-id"];
    if (!userId || !scooterId) {
      return res.status(400).json({
        message: "User ID and scooter ID are required",
      });
    }
    // Fetch scooter document to check rental status
    const scooter = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SCOOTER_COLLECTION_ID,
      scooterId
    );
    if (!scooter.rented) {
      return res.status(400).json({ message: "Scooter is not rented" });
    }
    // Update scooter document: mark as available
    const response = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SCOOTER_COLLECTION_ID,
      scooterId,
      {
        rented: false,
        startRentTime: null,
        endRentTime: null,
      }
    );
    // Find the active rent history document for this user and scooter (status "rented")
    const rentHistoryResult = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_RENT_HISTORY_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.equal("scooterId", scooterId),
        Query.equal("status", "rented"),
      ]
    );
    if (rentHistoryResult.documents.length === 0) {
      return res.status(404).json({ message: "Rent history not found" });
    }
    // Update the found rent history document to "cancelled"
    const historyDocId = rentHistoryResult.documents[0].$id;
    const updatedHistory = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_RENT_HISTORY_COLLECTION_ID,
      historyDocId,
      { status: "cancelled" }
    );
    return res.status(200).json({ response, updatedHistory });
  } catch (error) {
    console.error(error);
    if (error.code === 404) {
      return res.status(404).json({ message: "Scooter not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};
