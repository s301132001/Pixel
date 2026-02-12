import React, { useRef, useEffect, useState } from 'react';
import { Download, Move, ZoomIn, Eye, X } from 'lucide-react';
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
  const [showPreview, setShowPreview] = useState(false);

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
    <>
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
              variant="ghost" 
              size="sm" 
              onClick={() => setShowPreview(true)}
              icon={<Eye size={16}/>}
              className="bg-gray-800/50 text-indigo-300 hover:bg-gray-800 hover:text-indigo-200"
          >
              預覽 (1.3")
          </Button>
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

      {/* 1.3 Inch Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setShowPreview(false)}>
            <div 
                className="bg-gray-900 border border-gray-700 rounded-2xl p-8 flex flex-col items-center gap-6 shadow-2xl relative max-w-sm w-full animate-in fade-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={() => setShowPreview(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
                
                <div className="text-center space-y-1">
                    <h3 className="text-xl font-bold text-white font-pixel tracking-wide">實體預覽</h3>
                    <p className="text-gray-400 text-sm">模擬 1.3 吋顯示器效果</p>
                </div>

                {/* Simulation Container */}
                <div className="relative bg-black rounded-lg border-[6px] border-gray-800 shadow-xl flex items-center justify-center">
                    {/* 1.3 inch css display */}
                    <img 
                        src={src} 
                        alt="Preview" 
                        style={{ 
                            width: '1.3in', 
                            height: '1.3in', 
                            imageRendering: 'pixelated' 
                        }} 
                        className="bg-black block"
                    />
                    
                    {/* Screen Glare effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                </div>

                <div className="text-xs text-gray-600 text-center max-w-[200px]">
                    *此大小為 CSS 1.3in，實際物理尺寸可能因螢幕解析度而異。
                </div>

                <Button variant="secondary" onClick={() => setShowPreview(false)} className="w-full">
                    關閉預覽
                </Button>
            </div>
        </div>
      )}
    </>
  );
};