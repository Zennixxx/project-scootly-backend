import { users } from "../utils/appwrite.js";

export const checkAuth = async (req, res, next) => {
  try {
    const userId = req.headers["user-id"];
    const user = await users.get(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const checkAdmin = async (req, res, next) => {
  try {
    const userId = req.headers["user-id"];
    const isAdmin = (await users.get(userId)).labels.includes("admin");
    if (isAdmin) {
      next();
    } else {
      return res.status(401).json({ message: "You not admin!" });
    }
  } catch (error) {
    console.error("Authorization error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const checkRenter = async (req, res, next) => {
  try {
    const userId = req.headers["user-id"];
    const isRenter = (await users.get(userId)).labels.includes("renter");
    if (isRenter) {
      next();
    } else {
      return res.status(401).json({ message: "You not renter!" });
    }
  } catch (error) {
    console.error("Authorization error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
