const cloudinary = require('cloudinary').v2;

let configured = false;

function configureCloudinary() {
  if (configured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary configuration. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  configured = true;
}

function toUploadSource(imageData) {
  if (!imageData || typeof imageData !== 'string') {
    throw new Error('Invalid image data received for upload.');
  }

  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    return imageData;
  }

  if (imageData.startsWith('data:image/')) {
    return imageData;
  }

  return `data:image/png;base64,${imageData}`;
}

async function uploadImage({ imageData, folder, publicId }) {
  configureCloudinary();
  const uploadSource = toUploadSource(imageData);

  return cloudinary.uploader.upload(uploadSource, {
    folder,
    public_id: publicId,
    overwrite: true,
    resource_type: 'image'
  });
}

module.exports = {
  uploadImage
};
