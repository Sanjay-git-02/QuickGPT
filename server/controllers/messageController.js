import axios from "axios";
import gemini from "../configs/gemini.js";
import chatModel from "../models/chat.js";
import imagekit from "../configs/imagekit.js";
import userModel from "../models/user.js";
import openai from "../configs/openai.js";
import stability from "../configs/stabilityai.js";
import { generateUnlimitedFreeImage } from "../utils/freeImageGenerator.js";

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

    let reply;
    if (gemini) {
      const response = await gemini.chat.completions.create({
        model: "gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      });

      if (!response.choices?.length) {
        return res.json({ success: false, message: "AI returned no response" });
      }

      reply = {
        ...response.choices[0].message,
        timestamp: Date.now(),
        isImage: false,
      };
    } else if (openai) {
      // Fallback to a basic OpenAI completion if configured
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
      const messageText = completion?.choices?.[0]?.message?.content || 'No reply';
      reply = { role: 'assistant', content: messageText, timestamp: Date.now(), isImage: false };
    } else {
      // Last-resort fallback: echo the user's prompt
      reply = { role: 'assistant', content: `Echo: ${prompt}`, timestamp: Date.now(), isImage: false };
    }

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

    // Use the multi-source free image generator util which tries several providers
    let uploadResponse;
    try {
      const base64Image = await generateUnlimitedFreeImage(prompt);
      if (!base64Image) throw new Error('All image providers failed');

      uploadResponse = await imagekit.upload({
        file: `data:image/png;base64,${base64Image}`,
        fileName: `img_${Date.now()}.png`,
        folder: 'quickgpt',
      });
    } catch (err) {
      console.error('Image generation/upload failed:', err);
      throw err;
    }

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
    console.error("Image Error:", error);

    try {
      await userModel.updateOne({ _id: userId }, { $inc: { credits: 2 } });
    } catch (uErr) {
      console.error('Failed to refund credits after image error:', uErr);
    }

    return res.json({
      success: false,
      message: "Image generation failed",
    });
  }
};

