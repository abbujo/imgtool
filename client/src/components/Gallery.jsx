import React from 'react';
import { motion } from 'framer-motion';

export default function Gallery({ results, apiBaseUrl }) {
    if (!results || results.length === 0) return null;

    const makeAbsolute = (maybeRelativeUrl) => {
        if (!maybeRelativeUrl) return '';
        // If already absolute, keep it.
        if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
        // Otherwise resolve relative to the API base URL.
        return new URL(maybeRelativeUrl, apiBaseUrl).toString();
    };

    return (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item, index) => {
                const imgUrl = makeAbsolute(item.url);
                const downloadUrl = imgUrl ? new URL(imgUrl) : null;
                if (downloadUrl) downloadUrl.searchParams.set('download', '1');

                return (
                    <motion.div
                        key={`${item.file}-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass p-4 flex flex-col items-center"
                    >
                        <div className="relative w-full aspect-video bg-slate-800/50 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                            <img
                                src={imgUrl}
                                alt={item.file}
                                className="object-contain max-h-full"
                                onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Error';
                                }}
                            />
                            <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                                {item.width}w
                            </div>
                            <div className="absolute top-2 left-2 bg-cyan-600/90 px-2 py-1 rounded text-xs text-white uppercase font-bold">
                                {item.policy || 'images'}
                            </div>
                        </div>

                        <div className="w-full text-left">
                            <p className="text-xs text-slate-400 truncate w-full" title={item.file}>
                                {item.file}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs bg-slate-800 px-2 py-1 rounded">
                                    {(item.size / 1024).toFixed(1)} KB
                                </span>

                                {downloadUrl && (
                                    <a
                                        href={downloadUrl.toString()}
                                        download
                                        className="text-cyan-400 text-xs hover:text-cyan-300 font-bold"
                                    >
                                        Download
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}