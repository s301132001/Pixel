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

        // 2. Calculate Source Rectangle (Cropping logic)
        // The logic here essentially creates a "camera" view into the original image.
        
        // sWidth/sHeight is the size of the area in the source image we want to see.
        // If scale is 2, we only see half the width/height of the original.
        const sWidth = img.width / transform.scale;
        const sHeight = img.height / transform.scale;

        // sx/sy is the top-left coordinate of the source rectangle.
        // We start centered ((img.width - sWidth) / 2) and subtract the offset (x, y).
        // Subtracting offset makes dragging feel natural (drag mouse right -> image moves right, which means camera moves left)
        const sx = (img.width - sWidth) / 2 - transform.x;
        const sy = (img.height - sHeight) / 2 - transform.y;

        // 3. Draw cropped image scaled into gridSize x gridSize
        ctx.drawImage(
            img, 
            sx, sy, sWidth, sHeight,  // Source rectangle (crop)
            0, 0, gridSize, gridSize  // Destination rectangle (output)
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
