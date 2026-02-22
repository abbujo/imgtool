
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Dropzone({ onDrop, isProcessing, title = "Drag & drop images here", icon = "🖼️", type = "images" }) {
    const onDropCallback = useCallback(acceptedFiles => {
        if (acceptedFiles?.length > 0) {
            onDrop(acceptedFiles, type);
        }
    }, [onDrop, type]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: onDropCallback,
        accept: {
            'image/png': [],
            'image/jpeg': [],
            'image/jpg': [],
        },
        disabled: isProcessing
    });

    return (
        <div
            {...getRootProps()}
            className={clsx(
                "glass p-6 text-center cursor-pointer transition-all duration-300 border-2 border-dashed h-full flex flex-col justify-center",
                isDragActive ? "border-cyan-400 bg-cyan-400/10 scale-[1.02]" : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50",
                isProcessing && "opacity-50 cursor-not-allowed"
            )}
        >
            <input {...getInputProps()} />
            <motion.div
                initial={{ y: 0 }}
                animate={{ y: isDragActive ? -10 : 0 }}
            >
                <div className="text-5xl mb-3">{icon}</div>
                {isDragActive ? (
                    <p className="text-lg font-bold text-cyan-400">Drop here!</p>
                ) : (
                    <div>
                        <p className="text-lg font-bold text-slate-200">{title}</p>
                        <p className="text-slate-400 text-sm mt-1">or click</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
