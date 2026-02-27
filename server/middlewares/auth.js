import jwt from "jsonwebtoken";
import userModel from "../models/user.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized, no token",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET);

    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized, user not found",
      });
    }

    req.user = user;
    return next(); // ✅ explicit return
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not Authorized, token failed",
    });
  }
};

