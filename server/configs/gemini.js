import { OpenAI } from "openai";

let gemini = null;
if (process.env.GEMINI_API_KEY) {
  gemini = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
} else {
  console.warn("GEMINI_API_KEY not set — Gemini client disabled");
}

export default gemini;
