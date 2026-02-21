
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const { processImage } = require('./core');
const { ensureDir } = require('./utils');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const sessionId = Date.now().toString();
        const sessionOutputDir = path.join(OUTPUT_DIR, sessionId);
        await ensureDir(sessionOutputDir);

        const results = [];

        // Process options from body or defaults
        const options = {
            quality: req.body.quality,
            effort: req.body.effort,
            cap: req.body.cap,
            dryRun: false
        };

        for (const file of files) {
            const fileResults = await processImage(file.path, sessionOutputDir, options);
            results.push(...fileResults);

            // Clean up uploaded file
            await fs.remove(file.path);
        }

        // Generate ZIP
        const zip = new AdmZip();
        zip.addLocalFolder(sessionOutputDir);
        const zipPath = path.join(sessionOutputDir, 'images.zip');
        zip.writeZip(zipPath);

        res.json({
            sessionId,
            results: results.map(r => ({
                ...r,
                url: `/output/${sessionId}/${r.policy.toLowerCase()}/${r.file}`
            })),
            zipUrl: `/output/${sessionId}/images.zip`
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
