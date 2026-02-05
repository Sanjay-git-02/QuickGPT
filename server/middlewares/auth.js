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


// import jwt from "jsonwebtoken";
// import userModel from "../models/user.js";

// export const protect = async (req, res, next) => {
//   let token;

//   if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
//     token = req.headers.authorization.split(" ")[1];
//   }

//   if (!token) {
//     return res.status(401).json({ success: false, message: "Not Authorized, no token" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.SECRET);

//     // Adjust depending on how you signed the token
//     const userId = decoded.id || decoded._id;

//     const user = await userModel.findById(userId);
//     if (!user) {
//       return res.status(401).json({ success: false, message: "Not Authorized, user not found" });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     return res.status(401).json({ success: false, message: "Not Authorized, token failed" });
//   }
// };