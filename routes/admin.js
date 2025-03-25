import { Router } from "express";
import { getVerifyRequests, verifyUser } from "../controllers/admin.js";

const router = Router();

router.post("/verify", verifyUser);
router.get("/verifyRequests", getVerifyRequests);

export default router;
