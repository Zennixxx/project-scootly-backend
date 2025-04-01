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
      return res.status(400).json({ message: "User already verified" });
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
    console.error("Verify error:", error);
  }
};

export const getVerifyRequests = async (req, res) => {
  try {
    const requests = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_VERIFY_REQUESTS_COLLECTION_ID
    );
    if (requests.documents.length === 0) {
      return res.status(404).json({ message: "No requests found" });
    }

    const usersData = await users.list();
    const currentAdminId = req.headers["user-id"];

    const userIds = requests.documents.map((request) => request.userId);
    const filteredUsers = usersData.users.filter((user) =>
      userIds.includes(user.$id)
    );

    const validRequests = [];

    for (const request of requests.documents) {
      const user = filteredUsers.find((user) => user.$id === request.userId);

      if (request.verified && request.adminId === currentAdminId) {
        request.verifiedByMe = true;
      }

      if (user) {
        request.user = {
          name: user.name,
          email: user.email,
          phone: user.phone,
        };
      }

      if (
        user &&
        (user.emailVerification || user.phoneVerification) &&
        !request.verifiedByMe
      ) {
        continue;
      }

      if (!request.verified || request.verifiedByMe) {
        validRequests.push(request);
      }
    }

    validRequests.sort((a, b) => b.createdAt - a.createdAt);
    res.status(200).json(validRequests);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const usersData = await users.list();
    const userList = usersData.users
      .map((user) => {
        if (user.labels.includes("user") || user.labels.length === 0) {
          return {
            id: user.$id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            emailVerification: user.emailVerification,
            phoneVerification: user.phoneVerification,
            labels: user.labels,
            prefs: user.prefs,
          };
        }
        return null;
      })
      .filter((user) => user !== null);

    res.status(200).json(userList);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getScooters = async (req, res) => {
  try {
    const scootersData = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SCOOTER_COLLECTION_ID
    );
    const scooterList = scootersData.documents;

    res.status(200).json(scooterList);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
