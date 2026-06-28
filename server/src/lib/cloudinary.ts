import { v2 as cloudinary } from "cloudinary";

// Fail fast at startup if the credential is missing, instead of letting every
// upload fail later with a cryptic SDK error.
if (!process.env.CLOUDINARY_URL) {
  throw new Error("Missing required env var: CLOUDINARY_URL");
}
//override `secure: true` so every URL Cloudinary returns is https:
cloudinary.config({ secure: true });

export default cloudinary;
