import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';

const ASPECT_RATIOS = [
    { label: 'Free', value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '3:2', value: 3 / 2 },
    { label: '3:4', value: 3 / 4 },
    { label: '4:5', value: 4 / 5 },
    { label: '9:16', value: 9 / 16 },
];

export default function BulkCropper({ files, onComplete, onCancel }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [crops, setCrops] = useState({}); // { [fileName]: { crop, zoom, aspect, pixelCrop } }
    const [currentImage, setCurrentImage] = useState(null);
    const [aspect, setAspect] = useState(ASPECT_RATIOS[0].value);
    
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [pixelCrop, setPixelCrop] = useState(null);

    const file = files[currentIndex];

    useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setCurrentImage(reader.result);
            reader.readAsDataURL(file);

            // Load saved crop for this file if exists
            const saved = crops[file.name];
            if (saved) {
                setCrop(saved.crop);
                setZoom(saved.zoom);
                setAspect(saved.aspect);
                setPixelCrop(saved.pixelCrop);
            } else {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                // Keep current aspect or default to first
            }
        }
    }, [currentIndex, file, crops]);

    const onCropComplete = useCallback((reachedCrop, reachedPixelCrop) => {
        setPixelCrop(reachedPixelCrop);
    }, []);

    const saveCurrentAndNext = () => {
        const updatedCrops = {
            ...crops,
            [file.name]: { crop, zoom, aspect, pixelCrop }
        };
        setCrops(updatedCrops);

        if (currentIndex < files.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onComplete(updatedCrops);
        }
    };

    const prevImage = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    if (!file || !currentImage) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-950/80 backdrop-blur-xl"
        >
            <div className="glass w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden relative border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            Crop Image <span className="text-cyan-400">{currentIndex + 1}</span> of <span className="text-purple-400">{files.length}</span>
                        </h2>
                        <p className="text-slate-400 text-sm truncate max-w-md">{file.name}</p>
                    </div>
                    <button 
                        onClick={onCancel}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ✕ Cancel
                    </button>
                </div>

                {/* Main Cropper Area */}
                <div className="flex-1 relative bg-black/40">
                    <Cropper
                        image={currentImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                    />
                </div>

                {/* Controls */}
                <div className="p-6 bg-slate-900/80 border-t border-white/10">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                        {/* Aspect Ratios */}
                        <div className="flex flex-wrap gap-2 justify-center">
                            {ASPECT_RATIOS.map((ar) => (
                                <button
                                    key={ar.label}
                                    onClick={() => setAspect(ar.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        aspect === ar.value 
                                        ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20' 
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                                >
                                    {ar.label}
                                </button>
                            ))}
                        </div>

                        {/* Zoom Slider */}
                        <div className="flex items-center gap-4 w-full md:w-64">
                            <span className="text-slate-400 text-xs">Zoom</span>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(e.target.value)}
                                className="flex-1 accent-cyan-400"
                            />
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-4">
                            <button
                                onClick={prevImage}
                                disabled={currentIndex === 0}
                                className="px-6 py-2 rounded-lg font-bold border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={saveCurrentAndNext}
                                className="px-8 py-2 rounded-lg font-bold bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-cyan-500/20 transition-all"
                            >
                                {currentIndex === files.length - 1 ? 'Finish & Process' : 'Next Image'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
