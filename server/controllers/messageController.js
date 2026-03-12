import axios from "axios";
import gemini from "../configs/gemini.js";
import chatModel from "../models/chat.js";
import imagekit from "../configs/imagekit.js";
import userModel from "../models/user.js";
import openai from "../configs/openai.js";
import { generateUnlimitedFreeImage } from "../utils/freeImageGenerator.js";

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

    // Save user message
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    // Last 6 messages for context
    const history = chat.messages.slice(-6).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    let reply;

    if (gemini) {
      try {
        const response = await gemini.models.generateContent({
          model: "gemini-1.5-flash",
          contents: history.map((m) => m.content).join("\n"),
        });

        const text = response.text || "No response";

        reply = {
          role: "assistant",
          content: text,
          timestamp: Date.now(),
          isImage: false,
        };
      } catch (err) {
        console.error("Gemini Error:", err);
      }
    }


    if (!reply && openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: history,
          temperature: 0.7,
        });

        const text =
          completion?.choices?.[0]?.message?.content || "No response";

        reply = {
          role: "assistant",
          content: text,
          timestamp: Date.now(),
          isImage: false,
        };
      } catch (err) {
        console.error("OpenAI Error:", err);
      }
    }

  
    if (!reply) {
      reply = {
        role: "assistant",
        content: "AI service is currently unavailable.",
        timestamp: Date.now(),
        isImage: false,
      };
    }

    // Save reply
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

    // Deduct credits
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

    // Save user prompt
    chat.messages.push({
      role: "user",
      content: prompt,
      isImage: false,
      timestamp: Date.now(),
    });

  

    let uploadResponse;

    try {
      const base64Image = await generateUnlimitedFreeImage(prompt);

      if (!base64Image) throw new Error("All image providers failed");

      uploadResponse = await imagekit.upload({
        file: `data:image/png;base64,${base64Image}`,
        fileName: `img_${Date.now()}.png`,
        folder: "quickgpt",
      });
    } catch (err) {
      console.error("Image generation/upload failed:", err);
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

    // Refund credits if image fails
    try {
      await userModel.updateOne({ _id: userId }, { $inc: { credits: 2 } });
    } catch (uErr) {
      console.error("Refund Error:", uErr);
    }

    return res.json({
      success: false,
      message: "Image generation failed",
    });
  }
};      };
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
      { new: true },
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
      if (!base64Image) throw new Error("All image providers failed");

      uploadResponse = await imagekit.upload({
        file: `data:image/png;base64,${base64Image}`,
        fileName: `img_${Date.now()}.png`,
        folder: "quickgpt",
      });
    } catch (err) {
      console.error("Image generation/upload failed:", err);
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
      console.error("Failed to refund credits after image error:", uErr);
    }

    return res.json({
      success: false,
      message: "Image generation failed",
    });
  }
};
