import { Router } from "express";
import {
  getVerificationRequest,
  sendVerificationRequest,
} from "../controllers/renter.js";

const router = Router();

router.post("/verification", sendVerificationRequest);
router.get("/verification", getVerificationRequest);

export default router;
