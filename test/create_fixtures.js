
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

const fixturesDir = path.join(__dirname, 'fixtures');
fs.ensureDirSync(fixturesDir);

const createDummy = async (name, width, height, color) => {
    await sharp({
        create: {
            width,
            height,
            channels: 4,
            background: color
        }
    })
        .png()
        .toFile(path.join(fixturesDir, name));
    console.log(`Created ${name}`);
};

(async () => {
    await createDummy('test_hero.png', 2000, 1000, { r: 255, g: 0, b: 0, alpha: 1 });
    await createDummy('test_card.jpg', 1000, 1000, { r: 0, g: 255, b: 0, alpha: 1 });
    await createDummy('icon_small.png', 512, 512, { r: 0, g: 0, b: 255, alpha: 1 });
})();
