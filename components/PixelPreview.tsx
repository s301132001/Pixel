import React, { useRef, useEffect, useState } from 'react';
import { Download, Move, ZoomIn } from 'lucide-react';
import { Button } from './Button';
import { downloadImage } from '../utils/imageUtils';
import { ImageTransform } from '../types';

interface PixelPreviewProps {
  src: string;
  gridSize: number;
  showGrid: boolean;
  onTransformChange: (updater: (prev: ImageTransform) => ImageTransform) => void;
}

export const PixelPreview: React.FC<PixelPreviewProps> = ({ 
    src, 
    gridSize, 
    showGrid,
    onTransformChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drawing Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !src) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = src;
    img.onload = () => {
        const size = Math.min(container.clientWidth, 512); 
        canvas.width = size;
        canvas.height = size;
        
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);

        if (showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            const cellSize = size / gridSize;
            
            ctx.beginPath();
            for (let i = 0; i <= gridSize; i++) {
                const x = Math.floor(i * cellSize);
                ctx.moveTo(x, 0);
                ctx.lineTo(x, size);
            }
            for (let i = 0; i <= gridSize; i++) {
                const y = Math.floor(i * cellSize);
                ctx.moveTo(0, y);
                ctx.lineTo(size, y);
            }
            ctx.stroke();
        }
    };
  }, [src, gridSize, showGrid]);

  // Interaction Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    // Zoom Logic
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;

    onTransformChange(prev => ({
        ...prev,
        scale: Math.max(0.1, Math.min(prev.scale + delta * prev.scale * 5, 20))
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    // Pan Logic
    // We need to scale the movement speed inversely to the zoom level
    // so panning feels consistent at different zoom levels.
    // Note: We don't have access to the current scale easily here without props, 
    // but we can adjust sensitivity heuristically or pass scale down if needed.
    // For now, raw pixel movement works reasonably well if handled in imageUtils.
    
    // Since pixelateImage logic subtracts transform.x/y, positive movementX (right)
    // should add to x to move the image right.
    
    // To make it feel like "grabbing the image", moving mouse right should move image right.
    // In our imageUtils logic: sx = center - x.
    // If we increase x, sx decreases, moving the crop window left, which makes the image appear to move right.
    // Perfect.
    
    // We can multiply by a factor to make it faster/slower relative to source image size
    // But since we don't know source image size here, we send raw screen deltas.
    // However, if the source image is huge (4000px), moving 1px might be too slow.
    // Let's apply a multiplier.
    const sensitivity = 2; 

    onTransformChange(prev => ({
        ...prev,
        x: prev.x + e.movementX * sensitivity / prev.scale,
        y: prev.y + e.movementY * sensitivity / prev.scale
    }));
  };

  const handleDownload = (scale: number) => {
    if (!src) return;
    const tempCanvas = document.createElement('canvas');
    const finalSize = gridSize * scale; 
    tempCanvas.width = finalSize;
    tempCanvas.height = finalSize;
    const tCtx = tempCanvas.getContext('2d');
    if (tCtx) {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            tCtx.imageSmoothingEnabled = false;
            tCtx.drawImage(img, 0, 0, finalSize, finalSize);
            downloadImage(tempCanvas.toDataURL('image/png'), `pixel-art-${gridSize}x${gridSize}.png`);
        };
    }
  };

  return (
    <div className="flex flex-col items-center w-full" ref={containerRef}>
      <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
         <Move size={12} /> <span>拖曳移動</span>
         <span className="mx-1">|</span>
         <ZoomIn size={12} /> <span>滾輪縮放</span>
      </div>
      
      <div 
        className={`relative rounded-lg overflow-hidden shadow-2xl shadow-indigo-500/20 bg-[#1a1b26] border border-gray-800 touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
          {/* Checkerboard background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
              style={{
                  backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }} 
          />
          <canvas ref={canvasRef} className="relative z-10 block max-w-full pointer-events-none" style={{ imageRendering: 'pixelated' }} />
      </div>

      <div className="flex gap-3 mt-6">
        <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => handleDownload(1)}
            icon={<Download size={16}/>}
        >
            小圖 (1x)
        </Button>
        <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleDownload(32)}
            icon={<Download size={16}/>}
        >
            高清 (32x)
        </Button>
      </div>
    </div>
  );
};
