import dotenv from "dotenv";
import { databases, users } from "../utils/appwrite.js";
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
