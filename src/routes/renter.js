import { Router } from "express";
import upload from "../middleware/upload.js";
import {
  getVerificationRequest,
  sendVerificationRequest,
  createScooter,
  getRentingScooters,
  deleteScooter,
  getBalance,
} from "../controllers/renter.js";

const router = Router();

router.post("/verification", sendVerificationRequest);
router.get("/verification", getVerificationRequest);
router.post("/scooter", upload.array("images"), createScooter);
router.get("/renting", getRentingScooters);
router.delete("/deleteScooter", deleteScooter);
router.get("/balance", getBalance);

export default router;
