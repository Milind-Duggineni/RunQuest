const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Add support for TMJ files
  config.resolver.assetExts = [
    ...config.resolver.assetExts.filter(ext => ext !== 'tmj'),
    'tmj',
  ];

  config.transformer.babelTransformerPath = require.resolve('./transformer');
  
  return config;
})();
