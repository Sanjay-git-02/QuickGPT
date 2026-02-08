import ImageKit from "imagekit";

let imagekit = null;
if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
} else {
  console.warn('IMAGEKIT keys not set — using fallback uploader');
  imagekit = {
    upload: async ({ file, fileName, folder }) => {
      // Return a placeholder image when ImageKit is not configured
      return { url: `https://picsum.photos/1024/1024?dummy=${Date.now()}` };
    },
  };
}

export default imagekit;