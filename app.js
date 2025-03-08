import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/user.js";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

app.use("/api/users", userRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
