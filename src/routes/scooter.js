import express from "express";
import {
  cancelRent,
  getByFilters,
  getAllScooters,
  getScooterById,
  rentScooter,
} from "../controllers/scooter.js";

const router = express.Router();

router.get("/getAll", getAllScooters);
router.post("/getByFilters", getByFilters);
router.get("/getById", getScooterById);
router.post("/rent", rentScooter);
router.post("/cancel", cancelRent);

export default router;
