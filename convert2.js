const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
}

const images = getAllFiles(__dirname + '/image').filter(file => file.match(/\.(jpg|jpeg|png)$/i));

Promise.all(images.map(img => {
    const ext = path.extname(img);
    const newPath = img.replace(ext, '.webp');
    return sharp(img)
        .resize(1200, 1200, {fit: 'inside', withoutEnlargement: true})
        .webp({ quality: 75, effort: 4 })
        .toFile(newPath + '.tmp')
        .then(() => {
            fs.renameSync(newPath + '.tmp', newPath);
            console.log('Successfully super-compressed:', newPath);
        })
        .catch(err => console.error('Error with', img, err));
})).then(() => {
    console.log("All images re-converted and super-compressed.");
});
