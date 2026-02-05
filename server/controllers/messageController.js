import axios from "axios";
import gemini from "../configs/gemini.js";
import chatModel from "../models/chat.js";
import imagekit from "../configs/imagekit.js";
import userModel from "../models/user.js";
import OpenAI from "openai";
import openai from "../configs/openai.js";
import stability from "../configs/stabilityai.js";
import { Chat } from "openai/resources/index.mjs";

const HF_IMAGE_MODEL =
  "https://api-inference.huggingface.co/models/stabilityai/sdxl-turbo";

export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.credits < 1) {
      return res.json({
        success: false,
        message: "You don't have enough credits to use this feature",
      });
    }

    const { chatId, prompt } = req.body;

    const chat = await chatModel.findOne({ _id: chatId, userId });
    if (!chat) {
      return res.json({ success: false, message: "Chat not found" });
    }

    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    const response = await gemini.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
    });

    if (!response.choices?.length) {
      return res.json({ success: false, message: "AI returned no response" });
    }

    const reply = {
      ...response.choices[0].message,
      timestamp: Date.now(),
      isImage: false,
    };

    chat.messages.push(reply);
    await chat.save();

    await userModel.updateOne({ _id: userId }, { $inc: { credits: -1 } });

    return res.json({ success: true, reply });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Something went wrong, please try again.",
    });
  }
};


export const imageMessageController = async (req, res) => {
  const userId = req.user._id;
  const { chatId, prompt, isPublished = false } = req.body;

  try {
    if (!prompt || prompt.trim().length < 3) {
      return res.json({ success: false, message: "Invalid prompt" });
    }

    const user = await userModel.findOneAndUpdate(
      { _id: userId, credits: { $gte: 2 } },
      { $inc: { credits: -2 } },
      { new: true }
    );

    if (!user) {
      return res.json({ success: false, message: "Not enough credits" });
    }

    const chat = await chatModel.findOne({ _id: chatId, userId });
    if (!chat) {
      await userModel.updateOne({ _id: userId }, { $inc: { credits: 2 } });
      return res.json({ success: false, message: "Chat not found" });
    }

    chat.messages.push({
      role: "user",
      content: prompt,
      isImage: false,
      timestamp: Date.now(),
    });

    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${Date.now()}`;

    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 60000,
    });

    const base64Image = Buffer.from(imageResponse.data).toString("base64");

    const uploadResponse = await imagekit.upload({
      file: `data:image/png;base64,${base64Image}`,
      fileName: `img_${Date.now()}.png`,
      folder: "quickgpt",
    });

    const reply = {
      role: "assistant",
      content: uploadResponse.url,
      isImage: true,
      isPublished,
      timestamp: Date.now(),
    };

    chat.messages.push(reply);
    await chat.save();

    return res.json({ success: true, reply });

  } catch (error) {
    console.error("Image Error:", error.message);

    await userModel.updateOne({ _id: userId }, { $inc: { credits: 2 } });

    return res.json({
      success: false,
      message: "Image generation failed",
    });
  }
};

