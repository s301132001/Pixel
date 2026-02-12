import React, { useState, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { PixelPreview } from './components/PixelPreview';
import { Slider } from './components/Slider';
import { Button } from './components/Button';
import { PixelSettings, ImageTransform } from './types';
import { pixelateImage } from './utils/imageUtils';
import { 
  DEFAULT_GRID_SIZE, 
  MAX_GRID_SIZE, 
  MIN_GRID_SIZE 
} from './constants';
import { 
  Grid3X3, 
  RefreshCcw,
  Maximize,
  ChevronDown,
  Sliders
} from 'lucide-react';

const App: React.FC = () => {
  // State
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [pixelatedSrc, setPixelatedSrc] = useState<string | null>(null);
  
  // Settings Panel State (Mobile)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [settings, setSettings] = useState<PixelSettings>({
    gridSize: DEFAULT_GRID_SIZE,
    opacity: 100,
    showGrid: false,
    contrast: 10,
    saturation: 20
  });

  const [transform, setTransform] = useState<ImageTransform>({
    x: 0,
    y: 0,
    scale: 1
  });

  // Handle Image Upload
  const handleImageSelected = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setOriginalImage(e.target.result as string);
        setTransform({ x: 0, y: 0, scale: 1 }); // Reset transform
        setIsSettingsOpen(false); // Auto-collapse on mobile when new image loads
      }
    };
    reader.readAsDataURL(file);
  };

  // Process image when settings, source, or transform change
  useEffect(() => {
    const process = async () => {
      if (!originalImage) return;
      
      try {
        const result = await pixelateImage(
          originalImage, 
          settings.gridSize,
          settings.contrast,
          settings.saturation,
          transform
        );
        setPixelatedSrc(result);
      } catch (error) {
        console.error("Failed to pixelate:", error);
      }
    };

    // Small debounce for smoother interaction
    const timeout = setTimeout(process, 16); 
    return () => clearTimeout(timeout);
  }, [originalImage, settings.gridSize, settings.contrast, settings.saturation, transform]);

  const resetTransform = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div className="h-screen w-screen bg-gray-950 text-gray-100 flex flex-col items-center py-4 px-4 sm:px-6 overflow-hidden">
      
      {/* Header */}
      <header className="mb-4 text-center space-y-1 flex-shrink-0">
        <h1 className="text-4xl md:text-5xl font-pixel text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 drop-shadow-lg">
          PIXEL CRAFT
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto text-sm">
          將照片轉換為復古 16 位元精靈圖。
        </p>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-6xl bg-gray-900/50 backdrop-blur-sm rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col md:flex-row flex-1 min-h-0">
        
        {/* Left Sidebar: Controls */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-gray-800 bg-gray-900/80 flex flex-col flex-shrink-0 transition-all duration-300">
            
            {/* Toggle Header (Always visible) */}
            <button 
                className="w-full p-4 flex items-center justify-between md:cursor-default hover:bg-gray-800/50 md:hover:bg-transparent transition-colors outline-none"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                type="button"
            >
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                    <Sliders size={18} className="text-indigo-400" />
                    <span>參數設定</span>
                </div>
                {/* Chevron: Only visible on mobile */}
                <ChevronDown 
                    size={18} 
                    className={`text-gray-400 md:hidden transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {/* Collapsible Content */}
            <div className={`
                flex flex-col gap-5 px-5
                overflow-y-auto
                transition-all duration-300 ease-in-out
                ${isSettingsOpen ? 'max-h-[60vh] pb-5 opacity-100' : 'max-h-0 opacity-0 md:max-h-full md:opacity-100 md:pb-5'}
            `}>
                
                {/* Settings Panel */}
                <div className="space-y-5 pt-1">
                    <Slider 
                        label="網格大小" 
                        value={settings.gridSize} 
                        min={MIN_GRID_SIZE} 
                        max={MAX_GRID_SIZE} 
                        step={2}
                        onChange={(val) => setSettings(s => ({...s, gridSize: val}))}
                        unit="px"
                    />
                    <Slider 
                        label="對比度" 
                        value={settings.contrast} 
                        min={-50} 
                        max={50} 
                        onChange={(val) => setSettings(s => ({...s, contrast: val}))}
                    />
                    <Slider 
                        label="飽和度" 
                        value={settings.saturation} 
                        min={-50} 
                        max={50} 
                        onChange={(val) => setSettings(s => ({...s, saturation: val}))}
                    />

                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Grid3X3 size={16} />
                            顯示網格
                        </span>
                        <button 
                            onClick={() => setSettings(s => ({...s, showGrid: !s.showGrid}))}
                            className={`w-11 h-6 flex items-center rounded-full transition-colors ${settings.showGrid ? 'bg-indigo-600' : 'bg-gray-700'}`}
                        >
                            <span className={`w-4 h-4 bg-white rounded-full transition-transform transform ${settings.showGrid ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Maximize size={16} />
                            縮放比例: {transform.scale.toFixed(1)}x
                        </span>
                        <button 
                            onClick={resetTransform}
                            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                        >
                            重置位置
                        </button>
                    </div>
                </div>

                {originalImage && (
                        <div className="pt-2 border-t border-gray-800">
                            <Button 
                            variant="secondary" 
                            className="w-full"
                            onClick={() => setOriginalImage(null)}
                            icon={<RefreshCcw size={16}/>}
                            >
                            重新開始
                            </Button>
                        </div>
                )}
            </div>
        </div>

        {/* Right Area: Workspace */}
        <div className="flex-1 bg-black/20 relative overflow-y-auto overflow-x-hidden">
            <div className="min-h-full w-full flex flex-col items-center justify-center p-6">
                {originalImage && pixelatedSrc ? (
                    <PixelPreview 
                        src={pixelatedSrc} 
                        gridSize={settings.gridSize} 
                        showGrid={settings.showGrid}
                        scale={transform.scale}
                        onTransformChange={setTransform}
                    />
                ) : (
                    <div className="w-full max-w-md">
                        <UploadZone onImageSelected={handleImageSelected} />
                    </div>
                )}
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;