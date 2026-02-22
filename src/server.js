/**
 * imgpipe API server (Render-safe)
 * - Returns RELATIVE download URLs (no localhost)
 * - Safe when r.policy is null/undefined (fallback "images")
 * - Trusts proxy (good behind Render/Vercel/NGINX)
 * - Listens on process.env.PORT
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const { processImage } = require('./core');
const { ensureDir } = require('./utils');

const app = express();
app.set('trust proxy', true); // important behind proxies (Render)

const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
}));
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Health check endpoint
app.get('/ping', (req, res) => {
    res.json({ status: 'ok', message: 'imgpipe API is running v2' });
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
        // NOTE: keeping originalname can overwrite files if multiple uploads share names.
        // If you want to avoid collisions, switch to a unique filename.
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Serve output files statically
app.use(
    '/output',
    (req, res, next) => {
        if (req.query.download) {
            res.setHeader('Content-Disposition', 'attachment');
        }
        next();
    },
    express.static(OUTPUT_DIR)
);

app.post(
    '/api/upload',
    upload.fields([
        { name: 'hero' },
        { name: 'card' },
        { name: 'logo' },
        { name: 'icon' },
        { name: 'images' } // fallback
    ]),
    async (req, res) => {
        const startTime = Date.now();
        console.log(`[INFO] Starting upload process for new request`);

        try {
            const fileList = [];

            if (req.files) {
                for (const policyKey of ['hero', 'card', 'logo', 'icon', 'images']) {
                    const bucket = req.files[policyKey];
                    if (!bucket) continue;

                    bucket.forEach((f) => {
                        const mappedPolicy = policyKey === 'images' ? null : policyKey.toUpperCase();
                        fileList.push({ file: f, policy: mappedPolicy });
                    });
                }
            }

            if (fileList.length === 0) {
                console.warn(`[WARN] No files found in request`);
                return res.status(400).json({ error: 'No files uploaded' });
            }

            console.log(`[INFO] Received ${fileList.length} files for processing`);

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

            for (const item of fileList) {
                const { file, policy } = item;

                console.log(
                    `[INFO] Processing file: ${file.originalname} (${file.size} bytes) with policy ${policy}`
                );

                const fileOptions = { ...options, policy };
                const fileResults = await processImage(file.path, sessionOutputDir, fileOptions);
                results.push(...fileResults);

                console.log(`[INFO] Removing temporary upload: ${file.path}`);
                await fs.remove(file.path);
            }

            // Generate ZIP
            console.log(`[INFO] Generating ZIP archive for session: ${sessionId}`);
            const zip = new AdmZip();
            zip.addLocalFolder(sessionOutputDir);

            const zipPath = path.join(sessionOutputDir, 'images.zip');
            zip.writeZip(zipPath);
            console.log(`[INFO] ZIP archive created at: ${zipPath}`);

            // Cleanup session after 10 minutes (ephemeral disk friendly)
            setTimeout(() => {
                console.log(`[INFO] Cleaning up session directory: ${sessionOutputDir}`);
                fs.remove(sessionOutputDir).catch(err =>
                    console.error(`[ERROR] Failed to clean up ${sessionOutputDir}:`, err)
                );
            }, 600000);

            const duration = Date.now() - startTime;
            console.log(`[INFO] Request completed successfully in ${duration}ms`);

            // IMPORTANT: return RELATIVE URLs (no localhost)
            res.json({
                sessionId,
                results: results.map(r => {
                    // r.policy might be null/undefined -> fallback folder name
                    const policyFolder = (r.policy || 'images').toLowerCase();
                    return {
                        ...r,
                        url: `/output/${sessionId}/${policyFolder}/${encodeURIComponent(r.file)}`
                    };
                }),
                zipUrl: `/output/${sessionId}/images.zip?download=1`
            });

        } catch (err) {
            console.error(`[ERROR] Caught exception in /api/upload:`, err);
            console.error(`[ERROR] Stack trace:`, err.stack);
            res.status(500).json({ error: err.message || 'Internal Server Error' });
        }
    }
);

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[FATAL ERROR] Unhandled Exception:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`[INFO] Server listening on port ${PORT}`);
});