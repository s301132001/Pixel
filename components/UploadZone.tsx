import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface UploadZoneProps {
  onImageSelected: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelected }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelected(file);
      }
    }
  }, [onImageSelected]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  }, [onImageSelected]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full h-80 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-8 transition-all duration-300
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' 
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800/80'}
      `}
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      
      <div className={`p-4 rounded-full bg-gray-800 mb-4 transition-transform duration-300 ${isDragging ? 'scale-110 text-indigo-400' : 'text-gray-400'}`}>
        <Upload size={48} strokeWidth={1.5} />
      </div>
      
      <h3 className="text-xl font-bold text-gray-200 mb-2 font-pixel tracking-wider text-2xl">
        拖放圖片至此
      </h3>
      <p className="text-gray-400 mb-6 max-w-xs mx-auto">
        或點擊瀏覽電腦中的檔案。支援 JPG, PNG, WEBP。
      </p>
      
      <label className="cursor-pointer">
        <span className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20">
          瀏覽檔案
        </span>
        <input 
          type="file" 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};