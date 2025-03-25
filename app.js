import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoute from "./routes/user.js";
import scooterRoute from "./routes/scooter.js";
import adminRouter from "./routes/admin.js";
import renterRouter from "./routes/renter.js";
import { validateRegisterUser } from "./middleware/validation.js";
import { checkAdmin, checkAuth, checkRenter } from "./middleware/checkAuth.js";

const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());

app.use("/api/user/register", validateRegisterUser, userRoute);
app.use("/api/user", userRoute);
app.use("/api/scooter", checkAuth, scooterRoute);
app.use("/api/admin", checkAuth, checkAdmin, adminRouter);
app.use("/api/renter", checkAuth, checkRenter, renterRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
