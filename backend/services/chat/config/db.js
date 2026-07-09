import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("chat database connected successfully");
  } catch (error) {
    console.log(`chat database error ${error}`);
  }
};

export default connectDB;