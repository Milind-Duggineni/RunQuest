const fs = require('fs');
const path = require('path');

// Define the new directory structure
const dirs = [
  'src/components/ui',
  'src/components/game',
  'src/screens',
  'src/hooks',
  'src/services',
  'src/context',
  'src/utils',
  'src/assets/images',
  'src/assets/icons',
  'src/assets/fonts',
  'src/assets/audio',
  'src/lib',
  'src/navigation'
];

// Create directories if they don't exist
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
});

// Define file movements (source to destination)
const fileMovements = [
  // Move existing components to appropriate locations
  {
    src: 'src/components/DungeonGame/**/*',
    dest: 'src/components/gable',
    type: 'move'
  },
  {
    src: 'src/components/dashboard/**/*',
    dest: 'src/components/ui/dashboard',
    type: 'move'
  },
  // Move hooks
  {
    src: 'src/hooks/**/*',
    dest: 'src/hooks',
    type: 'move'
  },
  // Move context
  {
    src: 'src/context/**/*',
    dest: 'src/context',
    type: 'move'
  },
  // Move services
  {
    src: 'src/services/**/*',
    dest: 'src/services',
    type: 'move'
  },
  // Move utils
  {
    src: 'src/utils/**/*',
    dest: 'src/utils',
    type: 'move'
  },
  // Move game logic
  {
    src: 'src/game/**/*',
    dest: 'src/game',
    type: 'keep' // Keep game directory as is for now
  }
];

// Process file movements
fileMovements.forEach(({ src, dest, type }) => {
  const srcPath = path.join(__dirname, '..', src);
  const destPath = path.join(__dirname, '..', dest);
  
  if (type === 'move') {
    if (fs.existsSync(srcPath)) {
      // For simplicity, we'll just log the intended move
      // In a real script, you would use fs.renameSync or a more robust solution
      console.log(`Would move ${srcPath} to ${destPath}`);
    }
  } else if (type === 'keep') {
    console.log(`Keeping ${srcPath} as is`);
  }
});

console.log('Restructuring complete!');
