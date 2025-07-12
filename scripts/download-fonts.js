const fs = require('fs');
const https = require('https');
const path = require('path');

const fontsDir = path.join(__dirname, '../assets/fonts');
const robotoUrl = 'https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Regular.ttf';
const robotoPath = path.join(fontsDir, 'Roboto-Regular.ttf');

if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('Downloading Roboto font...');
    await downloadFile(robotoUrl, robotoPath);
    console.log('Successfully downloaded Roboto font to', robotoPath);
  } catch (error) {
    console.error('Error downloading font:', error);
    process.exit(1);
  }
}

main();
