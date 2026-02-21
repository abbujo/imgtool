
const { Command } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const ora = require('ora');
const chalk = require('chalk');
const boxen = require('boxen');
const { getFiles, log } = require('./utils');
const { processImage } = require('./core');
const { POLICIES } = require('./config');

const program = new Command();

program
    .name('imgpipe')
    .description('Batch convert images to responsive AVIF-only variants')
    .version('1.0.0')
    .argument('<input>', 'Input folder or glob pattern')
    .option('-o, --out <dir>', 'Output directory', './output')
    .option('--dry-run', 'Simulate conversion without generating files')
    .option('--clean', 'Clean output directory before processing')
    .option('--cap <width>', 'Max width override (integer)')
    .option('-q, --quality <n>', 'Override AVIF quality')
    .option('-e, --effort <n>', 'Override AVIF effort')
    .action(async (input, options) => {
        console.log(
            boxen(chalk.blue.bold('imgpipe ') + chalk.gray('v1.0.0'), {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'cyan',
            })
        );

        const spinner = ora('Scanning for images...').start();

        try {
            // Resolve input files
            let pattern = input;
            const stats = await fs.stat(input).catch(() => null);

            if (stats && stats.isDirectory()) {
                pattern = path.join(input, '*.{jpg,jpeg,png,JPG,JPEG,PNG}');
            }

            const files = await getFiles(pattern);

            if (files.length === 0) {
                spinner.fail('No images found.');
                return;
            }

            spinner.succeed(`Found ${files.length} images.`);

            if (options.clean && !options.dryRun) {
                spinner.start('Cleaning output directory...');
                await fs.emptyDir(options.out);
                spinner.succeed('Output directory cleaned.');
            }

            if (options.dryRun) {
                log.warn('DRY RUN MODE: No files will be generated.');
            }

            const summary = {
                totalFiles: 0,
                generatedImages: 0,
                errors: 0,
                bytesSaved: 0, // Hard to calc without before/after, we'll just show total size maybe?
                // Actually prompt asks for "Show progress + summary logs"
            };

            for (const file of files) {
                spinner.start(`Processing ${path.basename(file)}...`);
                const results = await processImage(file, options.out, options);

                const errors = results.filter(r => r.status === 'error');
                if (errors.length > 0) {
                    spinner.fail(`Failed to process ${path.basename(file)}`);
                    errors.forEach(e => log.error(`  - ${e.error}`));
                    summary.errors++;
                } else {
                    spinner.succeed(`Processed ${path.basename(file)} (${results.length} variants)`);
                }

                summary.totalFiles++;
                summary.generatedImages += results.length;
            }

            console.log('\n' + boxen(
                `
${chalk.green.bold('✓ DONE')}

Files processed:   ${chalk.white(summary.totalFiles)}
Images generated:  ${chalk.white(summary.generatedImages)}
Errors:            ${summary.errors > 0 ? chalk.red(summary.errors) : chalk.gray(0)}
        `.trim(),
                {
                    padding: 1,
                    borderStyle: 'classic',
                    borderColor: 'green',
                }
            ));

        } catch (err) {
            spinner.fail('An error occurred.');
            console.error(err);
            process.exit(1);
        }
    });

module.exports = { program };
