const axios = require("axios");
const FormData = require("form-data");

const CLOUDINARY_CLOUD_NAME = "dbtsrjssc"; // Replace with your Cloudinary name
const UPLOAD_PRESET = "ml_default"; // Check and replace if needed

async function uploadToCloudinary(file) {
  //   console.log("Starting Cloudinary upload");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  // Detect file type and set resource type & folder
  let resourceType = "image";
  let folder = "LadduBuyBot/Media";

  if (typeof file === "string" && file.endsWith(".mp4")) {
    resourceType = "video";
    folder = "LadduBuyBot/Videos";
  } else if (typeof file === "string" && file.endsWith(".gif")) {
    resourceType = "image";
    folder = "LadduBuyBot/Gifs";
  } else if (typeof file === "string" && file.endsWith(".mp3")) {
    resourceType = "raw";
    folder = "LadduBuyBot/Audio";
  }

  formData.append("folder", folder);

  // Generate a unique public ID
  const uniquePublicId = `LadduBuyBot_${Date.now()}`;
  formData.append("public_id", uniquePublicId);

  // Correct Cloudinary API URL
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  try {
    const response = await axios.post(uploadUrl, formData, {
      headers: formData.getHeaders(),
    });

    // console.log("Finished Cloudinary upload");
    return response.data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error.response?.data || error);
    throw error;
  }
}

module.exports = { uploadToCloudinary };
