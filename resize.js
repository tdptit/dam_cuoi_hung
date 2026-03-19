const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function getAllWebpFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllWebpFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.webp')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const images = getAllWebpFiles(__dirname + '/image');

(async () => {
    for (const img of images) {
        const stats = fs.statSync(img);
        const tempPath = img + '.tmp.webp';
        
        try {
            await sharp(img)
                .resize(1200, 1200, {fit: 'inside', withoutEnlargement: true})
                .webp({ quality: 80, effort: 4 })
                .toFile(tempPath);
                
            fs.renameSync(tempPath, img);
            const newStats = fs.statSync(img);
            console.log(`Resized ${path.basename(img)}: ${(stats.size/1024/1024).toFixed(2)}MB -> ${(newStats.size/1024/1024).toFixed(2)}MB`);
        } catch (e) {
            console.error('Failed to resize', img, e);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
    }
    console.log("All resizing complete!");
})();
