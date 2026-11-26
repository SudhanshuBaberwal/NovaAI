import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import router from "./routes/billing.route.js";

dotenv.config();
const port = process.env.PORT || 8004;

const app = express();
app.use(express.json());
// app.use(
//   cors({
//     origin: process.env.AUTH_SERVICE,
//     credentials: true,
//   }),
// );
app.use("/", router);

app.listen(port, () => {
  console.log(`Billing service started on port : ${port}`);
  connectDb();
});
