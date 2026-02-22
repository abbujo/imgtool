
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const pngToIco = require('png-to-ico').default || require('png-to-ico');
const { POLICIES, DEFAULT_POLICY } = require('./config');
const { log } = require('./utils');

const processImage = async (filePath, outputDir, options = {}) => {
    const filename = path.basename(filePath);
    const ext = path.extname(filename);
    const name = path.basename(filePath, ext);

    // Determine policy
    // Priority: Explicit policy > Explicit suffix > Prefix (for icon/logo) > Default
    let policyName = options.policy || DEFAULT_POLICY;
    const n = name.toLowerCase();

    if (!options.policy) {
        if (n.endsWith('_hero') || n.includes('_hero_')) policyName = 'HERO';
        else if (n.endsWith('_card') || n.includes('_card_')) policyName = 'CARD';
        else if (n.endsWith('_icon') || n.includes('_icon_') || n.startsWith('icon_')) policyName = 'ICON';
        else if (n.endsWith('_logo') || n.includes('_logo_') || n.startsWith('logo_')) policyName = 'LOGO';
        else if (n.endsWith('_general')) policyName = 'GENERAL';
        else policyName = 'GENERAL';
    }

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

        if (options.dryRun) {
            results.push({ file: `${name}-${width}.${policyName === 'ICON' ? 'ico' : 'avif'}`, width, policy: policyName, status: 'dry-run' });
            continue;
        }

        try {
            if (policyName === 'ICON') {
                // For ICON, we collect the PNG buffers and generate exactly one standard .ico file at the end
                // We'll process them in a batch outside this loop, but let's gather them here
                // Wait, it is better to just handle ICON as a completely separate block.
            } else {
                const outputFilename = `${name}-${width}.avif`;
                const outputPath = path.join(typeDir, outputFilename);
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
            }
        } catch (err) {
            log.error(`Error processing ${filename} at width ${width}: ${err.message}`);
            results.push({ file: `${name}-${width}.avif`, width, policy: policyName, error: err.message, status: 'error' });
        }
    }

    // ICON handling
    if (policyName === 'ICON' && !options.dryRun) {
        for (const width of policy.widths) {
            if (options.cap && width > options.cap) continue;
            try {
                // Generate a transparent 1:1 format if the user uploaded a non-square icon
                const buf = await sharp(imageBuffer)
                    .rotate()
                    .resize({ width, height: width, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .png()
                    .toBuffer();

                const icoBuffer = await pngToIco([buf]);
                const outputFilename = `${name}-${width}.ico`;
                const outputPath = path.join(typeDir, outputFilename);
                await fs.writeFile(outputPath, icoBuffer);
                const info = await fs.stat(outputPath);
                results.push({ file: outputFilename, width, policy: policyName, size: info.size, status: 'generated' });
            } catch (err) {
                log.error(`Error creating ICO for ${filename} at width ${width}: ${err.message}`);
                results.push({ file: `${name}-${width}.ico`, width, policy: policyName, error: err.message, status: 'error' });
            }
        }
    }

    return results;
};

module.exports = {
    processImage,
};
