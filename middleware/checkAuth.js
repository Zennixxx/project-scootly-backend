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
