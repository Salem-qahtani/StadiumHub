// Crop a region out of an image (given a source URL and pixel crop area from
// react-easy-crop) and return it as a JPEG Blob ready to upload.

export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

export async function getCroppedBlob(
  src: string,
  crop: PixelCrop,
): Promise<Blob> {
  const image = await loadImage(src);
  // Round once and use the same size for the canvas and the destination rect so
  // a fractional crop can't leave a transparent strip or clip an edge row.
  const width = Math.round(crop.width);
  const height = Math.round(crop.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    width,
    height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
      "image/jpeg",
      0.9,
    );
  });
}
