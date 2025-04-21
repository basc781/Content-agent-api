import { S3Client, PutObjectCommand  } from "@aws-sdk/client-s3";
import { imagePayload, imagePayloadWithUrls } from "../types/types.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export const analyseImageService = {

  generateAuthenticatedUrls: async (imagesToUpload: imagePayload): Promise<imagePayloadWithUrls> => {
    try {
      const bucketName = process.env.R2_BUCKET_NAME;
      const imagesWithUrls: imagePayloadWithUrls = {
        images: []
      };
      // Map through each image in the payload
      for (const image of imagesToUpload.images) {
        // Generate a unique filename with the provided organization ID
        const fileName = `${image.filename.replace(/\s+/g, '')}-${Date.now()}`;
        
        // Generate presigned URL for upload using S3 client
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          ContentType: image.contentType,
        });
        
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        imagesWithUrls.images.push({
          contentType: image.contentType,
          filename: image.filename,
          uniqueFilename: fileName,
          authenticatedUrl: presignedUrl
        });
      }
      
      return imagesWithUrls;
      
    } catch (error) {
      console.error("Error generating upload URLs:", error);
      throw new Error("Failed to generate upload URLs");
    }
  }
};