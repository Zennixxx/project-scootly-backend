import express from "express";
import { loginUser, registerUser } from "../controllers/userController.js";

const router = express.Router();

// /api/users/register
router.post("/register", registerUser);

// /api/users/login
router.post("/login", loginUser);

// /api/users/getMe
// req.headers.authorization
router.get("/getMe", async (req, res) => {
  res.status(200).json(req.headers.authorization);
});

export default router;
