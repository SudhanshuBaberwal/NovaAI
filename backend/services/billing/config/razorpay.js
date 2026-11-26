import RazorPay from "razorpay"
import dotenv from "dotenv"
dotenv.config()

const razorpay = new RazorPay({
    key_id:process.env.ROZAR_KEY_ID,
    key_secret:process.env.ROZAR_KEY_SECRET
})

export default razorpay;