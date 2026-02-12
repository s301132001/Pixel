export interface PixelSettings {
  gridSize: number;
  opacity: number;
  showGrid: boolean;
  contrast: number;
  saturation: number;
}

export interface ImageTransform {
  x: number;
  y: number;
  scale: number;
}

export enum Tab {
  UPLOAD = 'UPLOAD',
  GENERATE = 'GENERATE'
}
