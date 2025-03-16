import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoute from "./routes/user.js";
import scooterRoute from "./routes/scooter.js";
import { validateRegisterUser } from "./middleware/validation.js";
import { checkAuth } from "./middleware/checkAuth.js";

const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());

app.use("/api/user", validateRegisterUser, userRoute);
app.use("/api/scooter", checkAuth, scooterRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
