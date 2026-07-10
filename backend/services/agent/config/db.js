import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Agent database connected successfully");
  } catch (error) {
    console.log(`Agent database error ${error}`);
  }
};

export default connectDB;