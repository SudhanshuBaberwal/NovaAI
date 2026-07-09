import express from "express";
import dotenv, { config } from "dotenv";
import connectDB from "./config/db.js";
import router from "./routes/chat.route.js";

dotenv.config();
const port = process.env.PORT;
const app = express();
app.get("/",router)
app.get("/", (req, res) => {
  return res.status(200).json({ message: "Hello from chat" });
});

app.listen(port, () => {
  console.log("Chat Server running on port : " + port);
  connectDB();
});
