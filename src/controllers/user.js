import { databases, users } from "../utils/appwrite.js";
import sdk, { Query } from "node-appwrite";

export const registerUser = async (req, res) => {
  try {
    const { email, password, phone, name } = req.body;
    if (!email || !password || !phone || !name) {
      return res
        .status(400)
        .json({ message: "Email, password, phone, and name are required" });
    }
    const user = await users.create(
      sdk.ID.unique(),
      email,
      phone,
      password,
      name
    );
    res.status(200).json({
      message: "User registered successfully ",
      user: {
        id: user.$id,
        email: user.email,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch (error) {
    if (error.code === 409) {
      return res.status(409).json({ message: "User already exist" });
    } else {
      console.error("Error registering user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const getRentHistory = async (req, res) => {
  try {
    const userId = req.headers["user-id"];
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const history = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_RENT_HISTORY_COLLECTION_ID,
      [Query.equal("userId", userId)]
    );
    if (history.documents.length <= 0) {
      return res.status(400).json({ message: "Rent history not found" });
    }
    res.status(200).json({ history: history.documents });
  } catch (error) {
    console.error(error);
    if (error.code === 404) {
      return res.status(404).json({ message: "Rent history not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};
