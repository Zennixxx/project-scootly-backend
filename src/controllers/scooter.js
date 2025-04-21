import { databases, users } from "../utils/appwrite.js";
import { Query } from "node-appwrite";
import dotenv from "dotenv";
import validator from "validator";
import geolib from "geolib";
import cache from "../utils/cache.js";
import sdk from "node-appwrite";
import { updateScooterCity } from "../utils/geoapify.js";
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

export const getByFilters = async (req, res) => {
  try {
    const { filters } = req.body;
    if (!filters)
      return res.status(400).json({ message: "Filters are required" });

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

    const filtersCopy = JSON.parse(JSON.stringify(filters));
    if (filtersCopy.location && filtersCopy.location.userCoords) {
      delete filtersCopy.location.userCoords;
    }
    const cacheKey = `scooters_${JSON.stringify(filtersCopy)}`;
    console.log("cacheKey", cacheKey);

    const cachedFilteredScooters = cache.get(cacheKey);

    if (cachedFilteredScooters && locationFilter) {
      const { searchDistance, userCoords } = locationFilter || {};
      if (searchDistance && userCoords) {
        const filteredScooters = cachedFilteredScooters.filter((scooter) => {
          const distance = geolib.getDistance(
            { latitude: userCoords[0], longitude: userCoords[1] },
            { latitude: scooter.latitude, longitude: scooter.longitude }
          );
          return distance <= searchDistance; // in meters
        });

        return res.status(200).json({ scooters: filteredScooters });
      }
    } else if (cachedFilteredScooters) {
      return res.status(200).json({ scooters: cachedFilteredScooters });
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
          message: "Search distance and user coordinates are required",
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

    const cityUpdatePromises = [];

    scooters.documents.forEach((scooter) => {
      cityUpdatePromises.push(updateScooterCity(scooter, databases));
    });

    await Promise.all(cityUpdatePromises);

    cache.set(cacheKey, scooters.documents);

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
        message: "User ID, scooter ID, time are required",
      });
    }

    const existingRentals = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_RENT_HISTORY_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.equal("scooterId", scooterId),
        Query.equal("status", "rented"),
      ]
    );

    if (existingRentals.documents.length > 0) {
      return res.status(400).json({
        message: "You already have an active rental for this scooter",
      });
    }

    const scooter = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SCOOTER_COLLECTION_ID,
      scooterId
    );

    if (scooter.rented) {
      return res.status(400).json({ message: "Scooter is already rented" });
    }

    const response = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SCOOTER_COLLECTION_ID,
      scooterId,
      {
        clientUserId: userId,
        rented: true,
        startRentTime: startRentTime,
        endRentTime: endRentTime,
      }
    );

    const history = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_RENT_HISTORY_COLLECTION_ID,
      sdk.ID.unique(),
      {
        userId: userId,
        scooterId: scooterId,
        startRentTime: startRentTime,
        endRentTime: endRentTime,
        totalCost: totalCost,
        status: "rented",
      }
    );

    if (
      scooter.renterUserId !== userId &&
      scooter.renterUserId !== null &&
      scooter.renterUserId !== " "
    ) {
      const renter = await users.get(scooter.renterUserId);
      if (renter) {
        await users.updatePrefs(scooter.renterUserId, {
          balance: parseFloat(renter.prefs.balance) + parseFloat(totalCost),
        });
      }
    }

    if (!history || !response) {
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_SCOOTER_COLLECTION_ID,
        scooterId,
        {
          clientUserId: null,
          rented: false,
          startRentTime: null,
          endRentTime: null,
        }
      );
      return res
        .status(500)
        .json({ message: "Failed to complete rental process" });
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
    const scooter = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SCOOTER_COLLECTION_ID,
      scooterId
    );
    if (!scooter.rented) {
      return res.status(400).json({ message: "Scooter is not rented" });
    }
    const response = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SCOOTER_COLLECTION_ID,
      scooterId,
      {
        clientUserId: null,
        rented: false,
        startRentTime: null,
        endRentTime: null,
      }
    );
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
