import axios from "axios";

export async function generateUnlimitedFreeImage(prompt) {
  const encoded = encodeURIComponent(prompt);

  // 1️⃣ Pollinations (best quality)
  try {
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${Date.now()}`;
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 20000,
    });
    return Buffer.from(res.data).toString("base64");
  } catch (e) {
    console.warn("Pollinations failed");
  }

  // 2️⃣ Craiyon (backup)
  try {
    const res = await axios.post(
      "https://backend.craiyon.com/generate",
      { prompt },
      { timeout: 20000 }
    );

    const img = res.data?.images?.[0];
    if (img) return img;
  } catch (e) {
    console.warn("Craiyon failed");
  }

  // 3️⃣ Placeholder (never fails)
  try {
    const res = await axios.get("https://picsum.photos/1024/1024", {
      responseType: "arraybuffer",
    });
    return Buffer.from(res.data).toString("base64");
  } catch (e) {
    return null;
  }
}