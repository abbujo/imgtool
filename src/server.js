
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const { processImage } = require('./core');
const { ensureDir } = require('./utils');

const app = express();
const PORT = process.env.PORT || 3001;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Allow Vercel frontend in production
}));
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Health check endpoint
app.get('/ping', (req, res) => {
    res.json({ status: 'ok', message: 'imgpipe API is running' });
});

// Setup storage
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const OUTPUT_DIR = path.join(__dirname, '../output');

fs.ensureDirSync(UPLOADS_DIR);
fs.ensureDirSync(OUTPUT_DIR);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Serve output files statically
app.use('/output', express.static(OUTPUT_DIR));

app.post('/api/upload', upload.array('images'), async (req, res) => {
    const startTime = Date.now();
    console.log(`[INFO] Starting upload process for new request`);

    try {
        const files = req.files;
        if (!files || files.length === 0) {
            console.warn(`[WARN] No files found in request`);
            return res.status(400).json({ error: 'No files uploaded' });
        }

        console.log(`[INFO] Received ${files.length} files for processing`);

        const sessionId = Date.now().toString();
        const sessionOutputDir = path.join(OUTPUT_DIR, sessionId);

        console.log(`[INFO] Creating session output directory: ${sessionOutputDir}`);
        await ensureDir(sessionOutputDir);

        const results = [];

        // Process options from body or defaults
        const options = {
            quality: req.body.quality,
            effort: req.body.effort,
            cap: req.body.cap,
            dryRun: false
        };

        console.log(`[INFO] Processing with options:`, options);

        for (const file of files) {
            console.log(`[INFO] Processing file: ${file.originalname} (${file.size} bytes)`);
            const fileResults = await processImage(file.path, sessionOutputDir, options);
            results.push(...fileResults);

            console.log(`[INFO] Successfully processed ${file.originalname}, removing temporary upload: ${file.path}`);
            // Clean up uploaded file
            await fs.remove(file.path);
        }

        // Generate ZIP
        console.log(`[INFO] Generating ZIP archive for session: ${sessionId}`);
        const zip = new AdmZip();
        zip.addLocalFolder(sessionOutputDir);
        const zipPath = path.join(sessionOutputDir, 'images.zip');
        zip.writeZip(zipPath);
        console.log(`[INFO] ZIP archive created at: ${zipPath}`);

        // Cleanup old session files after 10 minutes to prevent disk space issues
        setTimeout(() => {
            console.log(`[INFO] Cleaning up session directory: ${sessionOutputDir}`);
            fs.remove(sessionOutputDir).catch(err => console.error(`[ERROR] Failed to clean up ${sessionOutputDir}:`, err));
        }, 600000); // 10 minutes

        const duration = Date.now() - startTime;
        console.log(`[INFO] Request completed successfully in ${duration}ms`);

        res.json({
            sessionId,
            results: results.map(r => ({
                ...r,
                url: `${PUBLIC_URL}/output/${sessionId}/${r.policy.toLowerCase()}/${r.file}`
            })),
            zipUrl: `/output/${sessionId}/images.zip` // Keep zipUrl relative for the frontend dynamic binding
        });

    } catch (err) {
        console.error(`[ERROR] Caught exception in /api/upload:`, err);
        console.error(`[ERROR] Stack trace:`, err.stack);
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[FATAL ERROR] Unhandled Exception:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`[INFO] Server running on ${PUBLIC_URL}`);
});
