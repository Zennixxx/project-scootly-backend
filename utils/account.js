import { users } from "./appwrite";

export const getAccountById = async (req, res) => {
  try {
    const userId = req.headers["user-id"];
    const account = await users.get(userId);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    res.status(200).json({ account });
  } catch (error) {
    console.error(error);
    if (error.code === 404) {
      return res.status(404).json({ message: "Account not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};
