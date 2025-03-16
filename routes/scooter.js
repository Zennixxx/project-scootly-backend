import express from "express";
import {
  getAllByFilters,
  getAllScooters,
  getScooterById,
} from "../controllers/scooter.js";

const router = express.Router();

router.get("/getAll", getAllScooters);
router.get("/getByFilters", getAllByFilters);
router.get("/getById", getScooterById);

export default router;
