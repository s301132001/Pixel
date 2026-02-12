import React, { useState, useEffect, useCallback } from 'react';
import { UploadZone } from './components/UploadZone';
import { PixelPreview } from './components/PixelPreview';
import { Slider } from './components/Slider';
import { Button } from './components/Button';
import { Tab, PixelSettings, ImageTransform } from './types';
import { pixelateImage } from './utils/imageUtils';
import { generatePixelArtImage } from './services/geminiService';
import { 
  DEFAULT_GRID_SIZE, 
  MAX_GRID_SIZE, 
  MIN_GRID_SIZE 
} from './constants';
import { 
  Layout, 
  Image as ImageIcon, 
  Sparkles, 
  Grid3X3, 
  RefreshCcw,
  Wand2,
  Maximize
} from 'lucide-react';

const App: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<Tab>(Tab.UPLOAD);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [pixelatedSrc, setPixelatedSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prompt, setPrompt] = useState("");
  
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
        setActiveTab(Tab.UPLOAD);
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

  // Handle Gemini Generation
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    try {
      const generatedImageBase64 = await generatePixelArtImage(prompt);
      setOriginalImage(generatedImageBase64);
      setTransform({ x: 0, y: 0, scale: 1 }); // Reset transform
      setActiveTab(Tab.UPLOAD);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知錯誤";
      alert(`生成圖片失敗: ${errorMessage}。請檢查 API 金鑰設定或稍後再試。`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTransform = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center py-10 px-4 sm:px-6">
      
      {/* Header */}
      <header className="mb-10 text-center space-y-2">
        <h1 className="text-5xl md:text-6xl font-pixel text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 drop-shadow-lg">
          PIXEL CRAFT AI
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          將照片轉換為復古 16 位元精靈圖，或使用 AI 生成新素材。
        </p>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-6xl bg-gray-900/50 backdrop-blur-sm rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Sidebar: Controls */}
        <div className="w-full md:w-80 lg:w-96 p-6 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col gap-6 bg-gray-900/80">
            
            {/* Tabs */}
            <div className="flex p-1 bg-gray-800 rounded-xl">
                <button
                    onClick={() => setActiveTab(Tab.UPLOAD)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        activeTab === Tab.UPLOAD 
                        ? 'bg-gray-700 text-white shadow-sm' 
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <ImageIcon size={16} />
                        <span>編輯</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab(Tab.GENERATE)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        activeTab === Tab.GENERATE 
                        ? 'bg-indigo-600/20 text-indigo-300 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Sparkles size={16} />
                        <span>生成</span>
                    </div>
                </button>
            </div>

            {/* Content based on Tab */}
            {activeTab === Tab.GENERATE ? (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">AI 提示詞 (Prompt)</label>
                        <textarea 
                            className="w-full h-32 bg-gray-800 border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500 resize-none"
                            placeholder="例如：紅色藥水瓶、傳說之劍、賽博龐克偵探..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={handleGenerate} 
                        isLoading={isProcessing}
                        disabled={!prompt.trim()}
                        className="w-full"
                        icon={<Wand2 size={18}/>}
                    >
                        生成精靈圖
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                        由 Gemini 2.5 Flash 驅動。生成像素藝術風格的圖像，然後由我們的引擎進行處理。
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* Settings Panel */}
                    <div className="space-y-6">
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
                         <div className="pt-4 border-t border-gray-800">
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
            )}
        </div>

        {/* Right Area: Workspace */}
        <div className="flex-1 p-6 md:p-10 bg-black/20 flex flex-col items-center justify-center relative min-h-[500px]">
            {originalImage && pixelatedSrc ? (
                 <PixelPreview 
                    src={pixelatedSrc} 
                    gridSize={settings.gridSize} 
                    showGrid={settings.showGrid}
                    onTransformChange={setTransform}
                />
            ) : (
                <div className="w-full max-w-md">
                     <UploadZone onImageSelected={handleImageSelected} />
                </div>
            )}
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-12 text-gray-600 text-sm">
        <p>&copy; 2024 PixelCraft AI. 使用 React & Gemini 建置。</p>
      </footer>
    </div>
  );
};

export default App;
