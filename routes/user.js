import express from "express";
import { registerUser } from "../controllers/user.js";

const route = express.Router();

route.post("/register", registerUser);

export default route;
