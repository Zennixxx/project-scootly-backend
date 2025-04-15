import { Router } from "express";
import upload from "../middleware/upload.js";
import {
  getVerificationRequest,
  sendVerificationRequest,
  createScooter,
} from "../controllers/renter.js";

const router = Router();

router.post("/verification", sendVerificationRequest);
router.get("/verification", getVerificationRequest);
router.post("/scooter", upload.array("images"), createScooter);

export default router;
