import express from "express";
import { getRentHistory, registerUser } from "../controllers/user.js";

const route = express.Router();

route.get("/history", getRentHistory);
route.post("/register", registerUser);

export default route;
