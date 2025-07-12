const { getDefaultConfig } = require('@expo/metro-config');
const { transform } = require('@babel/core');
const path = require('path');

module.exports = ({
  src,
  filename,
  options,
}) => {
  const ext = path.extname(filename).replace('.', '');
  
  if (ext === 'tmj') {
    // For TMJ files, parse them as JSON and export as a module
    const json = JSON.parse(src);
    const code = `module.exports = ${JSON.stringify(json, null, 2)};`;
    
    // Transform the code with Babel
    return transform(code, {
      filename,
      presets: ['module:metro-react-native-babel-preset'],
      sourceMaps: true,
    });
  }
  
  // For other files, use the default transformer
  return transform(src, {
    filename,
    presets: ['module:metro-react-native-babel-preset'],
    sourceMaps: true,
  });
};
