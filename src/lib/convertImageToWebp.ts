const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const MAX_DIMENSION = 512;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image."));
    };

    image.src = url;
  });
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("WebP conversion failed."));
      },
      "image/webp",
      quality
    );
  });
}

/** Converts any browser-supported image file to a WebP blob for storage. */
export async function convertImageFileToWebp(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const image = await loadImageFromFile(file);
  const srcWidth = image.naturalWidth || 512;
  const srcHeight = image.naturalHeight || 512;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(srcWidth, srcHeight));
  const width = Math.max(1, Math.round(srcWidth * scale));
  const height = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image.");

  ctx.drawImage(image, 0, 0, width, height);

  let quality = 0.9;
  let blob = await canvasToWebp(canvas, quality);

  while (blob.size > MAX_OUTPUT_BYTES && quality > 0.4) {
    quality -= 0.1;
    blob = await canvasToWebp(canvas, quality);
  }

  if (blob.size > MAX_OUTPUT_BYTES) {
    throw new Error("Image is too large after conversion. Try a smaller file.");
  }

  return blob;
}
