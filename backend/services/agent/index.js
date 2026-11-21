import express from "express";
import dotenv, { config } from "dotenv";
import connectDB from "./config/db.js";
import router from "./routes/agent.route.js";

const app = express();
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT;
app.use("/",router)

app.listen(port, () => {
  console.log("Agent Server running on port : " + port);
  connectDB();
});
