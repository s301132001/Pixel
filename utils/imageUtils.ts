import { ImageTransform } from "../types";

/**
 * Processes an image source into a pixelated data URL.
 * @param imgSrc The source image URL/DataURI
 * @param gridSize The target grid size (e.g., 16 for 16x16)
 * @param contrast Contrast adjustment (-100 to 100)
 * @param saturation Saturation adjustment (-100 to 100)
 * @param transform Pan and zoom settings {x, y, scale}
 * @returns Promise resolving to the processed image Data URL
 */
export const pixelateImage = (
  imgSrc: string,
  gridSize: number,
  contrast: number = 0,
  saturation: number = 0,
  transform: ImageTransform = { x: 0, y: 0, scale: 1 }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        // 1. Setup offscreen canvas for downscaling
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
        }

        canvas.width = gridSize;
        canvas.height = gridSize;

        // Apply filters (contrast/saturation)
        const contrastVal = 100 + contrast;
        const saturateVal = 100 + saturation;
        ctx.filter = `contrast(${contrastVal}%) saturate(${saturateVal}%)`;

        // 2. Calculate Source Square (Cropping logic)
        // To prevent distortion (stretching) on non-square images, we must sample a square area 
        // from the source image because the destination (gridSize x gridSize) is square.
        
        // We use the smaller dimension of the image to define the "scale 1" viewport size.
        // This ensures the initial view covers the viewport without transparent bars (Crop to fit).
        const size = Math.min(img.width, img.height) / transform.scale;

        // Calculate center of the image
        const cx = img.width / 2;
        const cy = img.height / 2;

        // Calculate top-left of the source crop area based on center and transform offsets.
        // Subtracting offset makes dragging feel natural.
        const sx = cx - (size / 2) - transform.x;
        const sy = cy - (size / 2) - transform.y;

        // 3. Draw cropped image scaled into gridSize x gridSize
        ctx.drawImage(
            img, 
            sx, sy, size, size,       // Source rectangle (Square crop)
            0, 0, gridSize, gridSize  // Destination rectangle (Square)
        );

        // 4. Get the data URL of the tiny 16x16 image
        const pixelDataUrl = canvas.toDataURL("image/png");
        resolve(pixelDataUrl);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = imgSrc;
  });
};

export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};