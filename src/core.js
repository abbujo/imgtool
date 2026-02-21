
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const { POLICIES, DEFAULT_POLICY } = require('./config');
const { log } = require('./utils');

const processImage = async (filePath, outputDir, options = {}) => {
    const filename = path.basename(filePath);
    const ext = path.extname(filename);
    const name = path.basename(filePath, ext);

    // Determine policy
    // Priority: Explicit suffix > Prefix (for icon/logo) > Default
    let policyName = DEFAULT_POLICY;
    const n = name.toLowerCase();

    if (n.endsWith('_hero') || n.includes('_hero_')) policyName = 'HERO';
    else if (n.endsWith('_card') || n.includes('_card_')) policyName = 'CARD';
    else if (n.endsWith('_icon') || n.includes('_icon_') || n.startsWith('icon_')) policyName = 'ICON';
    else if (n.endsWith('_logo') || n.includes('_logo_') || n.startsWith('logo_')) policyName = 'LOGO';
    else if (n.endsWith('_general')) policyName = 'GENERAL';
    else policyName = 'GENERAL';

    const policy = POLICIES[policyName];

    // Prepare output directory
    const typeDir = path.join(outputDir, policyName.toLowerCase());
    if (!options.dryRun) {
        await fs.ensureDir(typeDir);
    }

    const results = [];
    let imageBuffer;
    if (!options.dryRun) {
        imageBuffer = await fs.readFile(filePath);
    }

    for (const width of policy.widths) {
        // Apply cap if provided
        if (options.cap && width > options.cap) continue;

        const outputFilename = `${name}-${width}.avif`;
        const outputPath = path.join(typeDir, outputFilename);

        if (options.dryRun) {
            results.push({ file: outputFilename, width, policy: policyName, status: 'dry-run' });
            continue;
        }

        try {
            const pipeline = sharp(imageBuffer)
                .rotate() // autoRotate
                .resize({ width, withoutEnlargement: true });

            // Merge policy options with CLI overrides
            const avifOptions = {
                ...policy.options,
                quality: options.quality ? parseInt(options.quality) : policy.options.quality,
                effort: options.effort ? parseInt(options.effort) : (policy.options.effort || 4),
            };

            await pipeline
                .avif(avifOptions)
                .toFile(outputPath);

            const info = await fs.stat(outputPath);
            results.push({ file: outputFilename, width, policy: policyName, size: info.size, status: 'generated' });
        } catch (err) {
            log.error(`Error processing ${filename} at width ${width}: ${err.message}`);
            results.push({ file: outputFilename, width, policy: policyName, error: err.message, status: 'error' });
        }
    }
    return results;
};

module.exports = {
    processImage,
};
