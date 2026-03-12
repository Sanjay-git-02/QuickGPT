import gemini from "../configs/gemini.js";
import chatModel from "../models/chat.js";
import imagekit from "../configs/imagekit.js";
import userModel from "../models/user.js";
import openai from "../configs/openai.js";
import { generateUnlimitedFreeImage } from "../utils/freeImageGenerator.js";

export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
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

    let reply;

    if (gemini) {
      const response = await gemini.chat.completions.create({
        model: "gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      });

      reply = {
        role: "assistant",
        content: response?.choices?.[0]?.message?.content || "No reply",
        timestamp: Date.now(),
        isImage: false,
      };
    } else if (openai) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      reply = {
        role: "assistant",
        content: completion?.choices?.[0]?.message?.content || "No reply",
        timestamp: Date.now(),
        isImage: false,
      };
    } else {
      reply = {
        role: "assistant",
        content: `Echo: ${prompt}`,
        timestamp: Date.now(),
        isImage: false,
      };
    }

    chat.messages.push(reply);
    await chat.save();

    return res.json({ success: true, reply });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const imageMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId, prompt } = req.body;

    const base64Image = await generateUnlimitedFreeImage(prompt);

    const upload = await imagekit.upload({
      file: `data:image/png;base64,${base64Image}`,
      fileName: `img_${Date.now()}.png`,
      folder: "quickgpt",
    });

    return res.json({
      success: true,
      reply: {
        role: "assistant",
        content: upload.url,
        isImage: true,
      },
    });
  } catch (error) {
    console.error(error);

    return res.json({
      success: false,
      message: "Image generation failed",
    });
  }
};
