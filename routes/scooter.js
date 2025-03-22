import express from "express";
import {
  cancelRent,
  getAllByFilters,
  getAllScooters,
  getScooterById,
  rentScooter,
} from "../controllers/scooter.js";

const router = express.Router();

router.get("/getAll", getAllScooters);
router.post("/getByFilters", getAllByFilters);
router.get("/getById", getScooterById);
router.post("/rent", rentScooter);
router.post("/cancel", cancelRent);

export default router;
