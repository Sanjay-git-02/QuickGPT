import userModel from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET, {
    expiresIn: "2d",
  });
};

//API to register user
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await userModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({ name, email, password: hashedPassword });
    const token = generateToken(user._id);

    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const token = generateToken(user._id);
        return res.json({ success: true, token });
      }
    }
    return res.json({ success: false, message: "Invalid Email or Password" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = req.user;
    return res.json({ success: true, user });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//API to get published community images
export const getCommunityImages = async(req,res)=>{
  try {
    const publishedImages = await Chat.aggregate([
      {$unwind:"$messages"},
      {
        $match:{
          "messages.isImage":"true",
          "messages.isPublished":"true"
        }
      },
      {
        $project:{
          _id:0,
          imageUrl:"$messages.content",
          username:"$userName"
        }
      }
    ])
    return res.json({success:true,images:publishedImages})
  } catch (error) {
      return res.json({success:false,message:error.message})
  }
    
}


