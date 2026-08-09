const fs = require('fs');
const path = require('path');

const srcLogo = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\cacb3a60-38e3-44fe-b1c5-a79b62d26dfd\\chavee_logo_full_1784540852179.png';
const srcFavicon = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\cacb3a60-38e3-44fe-b1c5-a79b62d26dfd\\chavee_favicon_1784540868187.png';

const destDir = path.join(__dirname, 'public');
const destLogo = path.join(destDir, 'logo.png');
const destFavicon = path.join(destDir, 'favicon.png');

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  if (fs.existsSync(srcLogo)) {
    fs.copyFileSync(srcLogo, destLogo);
    console.log(`Copied logo to ${destLogo}`);
  } else {
    console.error(`Source logo not found: ${srcLogo}`);
  }

  if (fs.existsSync(srcFavicon)) {
    fs.copyFileSync(srcFavicon, destFavicon);
    console.log(`Copied favicon to ${destFavicon}`);
  } else {
    console.error(`Source favicon not found: ${srcFavicon}`);
  }
} catch (err) {
  console.error('Error copying assets:', err);
}
