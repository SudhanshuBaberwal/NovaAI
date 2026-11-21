import express from "express";
import dotenv, { config } from "dotenv";
import connectDB from "./config/db.js";
import router from "./routes/chat.route.js";

dotenv.config();
const port = process.env.PORT;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/",router)

app.listen(port, () => {
  console.log("Chat Server running on port : " + port);
  connectDB();
});
