
import React, { useState } from 'react';
import axios from 'axios';
import Dropzone from './components/Dropzone';
import Gallery from './components/Gallery';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zipUrl, setZipUrl] = useState(null);
  const [error, setError] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleDrop = async (files, type = 'images') => {
    setIsProcessing(true);
    setError(null);
    setResults([]);
    setZipUrl(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append(type, file);
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResults(response.data.results);
      setZipUrl(response.data.zipUrl);
    } catch (err) {
      console.error(err);
      setError('Failed to process images. Ensure the backend server is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-start relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-slate-900 -z-20"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/20 blur-[120px] rounded-full -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full -z-10 animate-pulse delay-1000"></div>

      <header className="mb-12 text-center">
        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
          imgpipe
        </h1>
        <p className="text-slate-400 text-lg">
          High-performance AVIF-only image pipeline
        </p>
      </header>

      <main className="w-full max-w-5xl z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Dropzone onDrop={handleDrop} isProcessing={isProcessing} type="hero" title="Hero" icon="🖼️" />
          <Dropzone onDrop={handleDrop} isProcessing={isProcessing} type="card" title="Card" icon="🎴" />
          <Dropzone onDrop={handleDrop} isProcessing={isProcessing} type="logo" title="Logo" icon="🎯" />
          <Dropzone onDrop={handleDrop} isProcessing={isProcessing} type="icon" title="Icon (.ico)" icon="✨" />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-center"
          >
            {error}
          </motion.div>
        )}

        {isProcessing && (
          <div className="mt-12 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
            <p className="mt-4 text-cyan-400 font-bold animate-pulse">Processing images...</p>
          </div>
        )}

        <AnimatePresence>
          {results.length > 0 && !isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex justify-between items-center mt-12 mb-4 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold text-slate-200">Results ({results.length})</h2>
                {zipUrl && (
                  <a
                    href={`${API_BASE_URL}${zipUrl}`}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-2 px-6 rounded-lg transition-colors shadow-lg shadow-cyan-500/20"
                  >
                    Download ZIP
                  </a>
                )}
              </div>
              <Gallery results={results} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-auto py-8 text-slate-600 text-sm">
        imgpipe web • local processing • no data leaves your machine
      </footer>
    </div>
  );
}

export default App;
