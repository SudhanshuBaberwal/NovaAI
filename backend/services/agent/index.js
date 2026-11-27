import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import router from "./routes/agent.route.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((err,req,res,next) => {
  if (err.status){
    return res.status(status).json(err.data)
  }
  return res.status(500).json({message:`agent errror : ${error}`})
})

const port = process.env.PORT;
app.use("/", router);

app.listen(port, () => {
  console.log("Agent Server running on port : " + port);
  connectDB();
});