import api from "./api";

// Upload image files to Cloudinary (via our backend) and get back their URLs.
export async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const { data } = await api.post<{ urls: string[] }>("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.urls;
}
