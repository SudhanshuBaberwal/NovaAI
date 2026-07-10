import express from "express";
import dotenv, { config } from "dotenv";
import connectDB from "./config/db.js";
import router from "./routes/agent.route.js";

dotenv.config();
const port = process.env.PORT;
const app = express();
app.use("/",router)
// app.get("/", (req, res) => {
//   return res.status(200).json({ message: "Hello from Agent" });
// });

app.listen(port, () => {
  console.log("Agent Server running on port : " + port);
  connectDB();
});
