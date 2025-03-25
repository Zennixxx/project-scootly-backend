import { Query } from "node-appwrite";
import { users, databases } from "../utils/appwrite.js";

export const verifyUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = req.headers["user-id"];
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const user = await users.get(userId);
    const { emailVerification, phoneVerification } = user;

    if (emailVerification || phoneVerification) {
      return res.status(401).json({ message: "User already verified" });
    }

    const request = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_VERIFY_REQUESTS_COLLECTION_ID,
      [Query.equal("userId", userId)]
    );
    await databases.updateDocument(
      request.documents[0].$databaseId,
      request.documents[0].$collectionId,
      request.documents[0].$id,
      { verified: true, adminId: adminId }
    );

    Promise.all([
      await users.updateEmailVerification(userId, true),
      await users.updatePhoneVerification(userId, true),
    ]);

    res.status(200).json({ message: request.documents });
  } catch (error) {
    console.error("Authorization error:", error);
  }
};

export const getVerifyRequests = async (req, res) => {
  try {
    const request = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_VERIFY_REQUESTS_COLLECTION_ID,
      [Query.equal("verified", false)]
    );
    if (request.documents.length === 0) {
      return res.status(404).json({ message: "No requests found" });
    }
    res.status(200).json(request.documents);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
