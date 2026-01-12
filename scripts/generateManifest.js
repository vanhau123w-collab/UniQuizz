const fs = require('fs');
const path = require('path');

const CHAR_DIR = path.join(__dirname, '../client/public/character');
const OUT_FILE = path.join(__dirname, '../client/src/assets/characterManifest.json');

const manifest = {};

function getRelativePath(fullPath) {
    return '/character/' + path.relative(CHAR_DIR, fullPath);
}

// 1. Process Simple Categories (face, hat, pants, shirts, shoes, bundle)
const simpleCategories = ['face', 'hat', 'pants', 'shirts', 'shoes', 'bundle'];

simpleCategories.forEach(cat => {
    const dir = path.join(CHAR_DIR, cat);
    if (fs.existsSync(dir)) {
        manifest[cat] = fs.readdirSync(dir)
            .filter(f => !f.startsWith('.'))
            .sort() // Ensure deterministic order
            .map(f => ({
                id: f.split('.')[0],
                path: getRelativePath(path.join(dir, f)),
                filename: f
            }));
    } else {
        manifest[cat] = [];
    }
});

// 2. Process Skin (Nested Tints)
const skinDir = path.join(CHAR_DIR, 'skin');
if (fs.existsSync(skinDir)) {
    const tints = fs.readdirSync(skinDir).filter(f => !f.startsWith('.'));
    // Sort Tints naturally (Tint 1, Tint 2...)
    tints.sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.match(/\d+/)?.[0] || 0);
        return numA - numB;
    });

    manifest.skin = tints.map(tintName => {
        const tintDir = path.join(skinDir, tintName);
        const parts = fs.readdirSync(tintDir).filter(f => !f.startsWith('.'));
        
        // Map part names (arm, hand, head, leg, neck)
        const partsMap = {};
        parts.forEach(p => {
            if(p.includes('arm')) partsMap.arm = getRelativePath(path.join(tintDir, p));
            if(p.includes('hand')) partsMap.hand = getRelativePath(path.join(tintDir, p));
            if(p.includes('head')) partsMap.head = getRelativePath(path.join(tintDir, p));
            if(p.includes('leg')) partsMap.leg = getRelativePath(path.join(tintDir, p));
            if(p.includes('neck')) partsMap.neck = getRelativePath(path.join(tintDir, p));
        });

        return {
            id: tintName,
            parts: partsMap
        };
    });
}

// Ensure default 'aohub' starts first in shirts if exists?
// Or handled by UI defaulting.
// Let's verify 'aohub' exists.
const aohub = manifest.shirts.find(s => s.filename === 'aohub.svg');
if (aohub) {
    // Move to front or just key note
}

fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2));
console.log('Manifest generated:', Object.keys(manifest).map(k => `${k}: ${manifest[k].length}`));
