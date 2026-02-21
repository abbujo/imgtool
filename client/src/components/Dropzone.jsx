
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Dropzone({ onDrop, isProcessing }) {
    const onDropCallback = useCallback(acceptedFiles => {
        if (acceptedFiles?.length > 0) {
            onDrop(acceptedFiles);
        }
    }, [onDrop]);

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
                "glass p-10 mt-8 text-center cursor-pointer transition-all duration-300 border-2 border-dashed",
                isDragActive ? "border-cyan-400 bg-cyan-400/10 scale-105" : "border-slate-700 hover:border-slate-500",
                isProcessing && "opacity-50 cursor-not-allowed"
            )}
        >
            <input {...getInputProps()} />
            <motion.div
                initial={{ y: 0 }}
                animate={{ y: isDragActive ? -10 : 0 }}
            >
                <div className="text-6xl mb-4">🖼️</div>
                {isDragActive ? (
                    <p className="text-xl font-bold text-cyan-400">Drop files here!</p>
                ) : (
                    <div>
                        <p className="text-xl font-bold text-slate-200">Drag & drop images here</p>
                        <p className="text-slate-400 text-sm mt-2">or click to select files</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
