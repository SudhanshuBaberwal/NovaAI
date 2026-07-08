import mongoose from "mongoose"

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Database connected successfully for auth")
    } catch (error) {
        console.log("Database error in auth  : " + error)
    }
}

export default connectDB;