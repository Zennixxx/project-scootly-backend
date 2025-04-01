import { Router } from "express";
import {
  getScooters,
  getUsers,
  getVerifyRequests,
  verifyUser,
} from "../controllers/admin.js";

const router = Router();

router.post("/verify", verifyUser);
router.get("/verifyRequests", getVerifyRequests);
router.get("/users", getUsers);
router.get("/scooters", getScooters);

export default router;
