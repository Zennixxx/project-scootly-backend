import { users } from "../utils/appwrite.js";
import sdk from "node-appwrite";

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
