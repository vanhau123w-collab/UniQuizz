const fs = require('fs');
const path = require('path');

const CHAR_DIR = path.join(__dirname, '../client/public/character');
const OUT_FILE = path.join(__dirname, '../client/src/assets/characterAssets.json');

// Ensure assets directory exists
const assetDir = path.dirname(OUT_FILE);
if (!fs.existsSync(assetDir)) {
    fs.mkdirSync(assetDir, { recursive: true });
}

function processAsset(filename) {
    const content = fs.readFileSync(path.join(CHAR_DIR, filename), 'utf8');
    
    // Extract paths with their fill/stroke attributes
    // Regex to match <path ... />
    // We capture the entire attributes string
    const pathRegex = /<path\s+([^>]+?)\s*\/?>/g;
    const paths = [];
    
    let match;
    while ((match = pathRegex.exec(content)) !== null) {
        const attrs = match[1];
        const dMatch = /d="([^"]+)"/.exec(attrs);
        if (dMatch) {
            const d = dMatch[1];
            // Calculate pseudo-centroid
            const numbers = d.match(/-?[\d.]+/g).map(Number);
            let sumX = 0, count = 0;
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            
            for (let i = 0; i < numbers.length; i += 2) {
                if (i + 1 < numbers.length) {
                    const x = numbers[i];
                    const y = numbers[i+1];
                    // Filter out likely control points if simple avg needed, but raw avg is fine for clustering
                    sumX += x;
                    count++;
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
            
            p = {
                d,
                attrs: attrs.replace(/d="[^"]+"\s*/, ''), // Remove d from attrs to avoid dup
                centerX: sumX / count,
                minX, maxX, minY, maxY
            };
            paths.push(p);
        }
    }

    // Cluster paths by X
    // Sort by centerX
    paths.sort((a, b) => a.centerX - b.centerX);
    
    const groups = [];
    if (paths.length === 0) return [];
    
    let currentGroup = [paths[0]];
    for (let i = 1; i < paths.length; i++) {
        const prev = currentGroup[currentGroup.length - 1];
        const curr = paths[i];
        
        // If overlapping or close in X
        // Distance threshold: 50
        if (curr.minX < prev.maxX + 20) {
            currentGroup.push(curr);
        } else {
            groups.push(currentGroup);
            currentGroup = [curr];
        }
    }
    groups.push(currentGroup);
    
    // Normalize groups
    return groups.map((group, idx) => {
        // Find group bounding box
        let gMinX = Infinity, gMinY = Infinity, gMaxX = -Infinity, gMaxY = -Infinity;
        group.forEach(p => {
            gMinX = Math.min(gMinX, p.minX);
            gMinY = Math.min(gMinY, p.minY);
            gMaxX = Math.max(gMaxX, p.maxX);
            gMaxY = Math.max(gMaxY, p.maxY);
        });
        
        const width = gMaxX - gMinX;
        const height = gMaxY - gMinY;
        
        // Normalize: Move to (0,0) based on top-center or top-left?
        // Let's maximize consistency: Center X at 50, Top Y at 0?
        // Standard ViewBox for Avatar is typically 0 0 100 100.
        // Let's center them around X=50.
        
        const targetX = 50 - (width / 2);
        const offsetX = targetX - gMinX;
        const offsetY = -gMinY + 10; // Add a bit of padding top? Or just 0.
        
        // Actually, for easy layering, we should keep relative offsets if "pants" vs "shirt".
        // But these are sprite sheets, so "Shirt 1" and "Shirt 2" are likely at different Ys?
        // No, usually horizontal.
        
        // Simplest: Just subtract minX to bring to 0, then we can center in component.
        // Or better: Re-write the path data? That's hard with regex.
        // Easier: Return the original path data but wrap in a <g transform="...">.
        
        // We need the translation vector.
        // We will output: { paths: [{d, attrs}], tx: -gMinX, ty: -gMinY, width, height }
        
        return {
            id: idx,
            width,
            height,
            viewBox: `${gMinX} ${gMinY} ${width} ${height}`,
            paths: group.map(p => ({
                d: p.d,
                attrs: p.attrs
            }))
        };
    });
}

const assets = {};
const files = fs.readdirSync(CHAR_DIR);
files.forEach(file => {
    if (file.endsWith('.svg')) {
        const type = file.replace('vector_', '').replace('.svg', '');
        console.log(`Processing ${type}...`);
        assets[type] = processAsset(file);
    }
});

fs.writeFileSync(OUT_FILE, JSON.stringify(assets, null, 2));
console.log('Done!');
