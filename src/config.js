
const path = require('path');

const POLICIES = {
    HERO: {
        widths: [400, 720, 800, 1200, 1440],
        options: { quality: 50, effort: 4 },
    },
    CARD: {
        widths: [320, 480, 640, 960],
        options: { quality: 50 },
    },
    GENERAL: {
        widths: [320, 640, 960, 1200],
        options: { quality: 50 },
    },
    ICON: {
        widths: [16, 32, 48, 64, 128],
        options: { quality: 100 }, // Quality doesn't strictly apply to ICO but kept for consistency
    },
    LOGO: {
        widths: [128, 192, 256, 384, 512],
        options: { quality: 50 },
    },
};

const DEFAULT_POLICY = 'GENERAL';

module.exports = {
    POLICIES,
    DEFAULT_POLICY,
};
