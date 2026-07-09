import redis from "../../shared/redis/redis.js";

const protect = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.session;
    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "Unauthorized Access" });
    }
    const session = await redis.get(`session-${sessionId}`);
    if (!session) {
      return res
        .status(400)
        .json({ success: false, message: "Session Expired" });
    }
    req.user = JSON.parse(session);
    next();
  } catch (error) {
    console.log("Error in auth middleware");
    return res.status(500).json({ success: false, message: error.message });
  }
};


export default protect;