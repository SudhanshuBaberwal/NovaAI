import crypto from "crypto";
import { getAuth } from "firebase-admin/auth";
import app from "../config/firebase.js";
import User from "../model/user.model.js";
import redis from "../../../shared/redis/redis.js";

const resolveSessionId = async (userId) => {
  const raw = await redis.get(`user-session-${userId}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.sessionId || raw;
  } catch {
    return raw;
  }
};

export const login = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = await getAuth(app).verifyIdToken(token);
    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture,
      });
    }

    const sessionId = crypto.randomUUID();
    await Promise.all([
      redis.set(`user-session-${user._id}`, sessionId, "EX", 7 * 24 * 60 * 60),
      redis.set(
        `session-${sessionId}`,
        JSON.stringify({
          userId: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          plan: user.plan,
          credits: user.credits,
          totalCredits: user.totalCredits,
          planExpiresAt: user.planExpiresAt,
        }),
        "EX",
        7 * 24 * 60 * 60
      ),
    ]);

    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in Login API", error);
    return res.status(500).json("Server Error on Login Service");
  }
};

export const logout = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;
    if (sessionId) {
      await redis.del(`session-${sessionId}`);
    }
    res.clearCookie("session");
    return res
      .status(200)
      .json({ success: true, message: "Logout Successfully" });
  } catch (error) {
    console.log("Error in Logout API : ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserPayment = async (req, res) => {
  try {
    const { plan, credits, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }

    const addedCredits = Number(credits) || 0;
    user.plan = plan;
    user.credits = (user.credits || 0) + addedCredits;
    user.totalCredits = (user.totalCredits || 0) + addedCredits;
    user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    const sessionId =
      req.cookies?.session || (await resolveSessionId(user._id));
    if (sessionId) {
      await redis.set(
        `session-${sessionId}`,
        JSON.stringify({
          userId: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          plan: user.plan,
          credits: user.credits,
          totalCredits: user.totalCredits,
          planExpiresAt: user.planExpiresAt,
        }),
        "EX",
        7 * 24 * 60 * 60
      );
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: `update user payment error : ${error.message}`,
    });
  }
};

export const deductCredits = async (req, res) => {
  try {
    const { userId, agent } = req.body;
    const COST = {
      chat: 1,
      search: 5,
      coding: 10,
      pdf: 10,
      vision: 10,
      ppt: 10,
    };

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const requiredCredits = COST[agent] || 1;
    if (user.credits < requiredCredits) {
      return res
        .status(400)
        .json({ success: false, message: "Not Enough Credits." });
    }

    user.credits -= requiredCredits;
    await user.save();

    const sessionId = await resolveSessionId(user._id);
    if (sessionId) {
      await redis.set(
        `session-${sessionId}`,
        JSON.stringify({
          userId: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          plan: user.plan,
          credits: user.credits,
          totalCredits: user.totalCredits,
          planExpiresAt: user.planExpiresAt,
        }),
        "EX",
        7 * 24 * 60 * 60
      );
    }

    return res.status(200).json({
      success: true,
      credits: user.credits,
      totalCredits: user.totalCredits,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: `Error in deduct Credits: ${error}` });
  }
};