const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Get the default Metro config
const config = getDefaultConfig(__dirname);

// Add support for TMJ files as JSON
config.resolver.sourceExts = [...config.resolver.sourceExts, 'tmj'];

// Add asset extensions
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
];

// Create a custom transformer that handles TMJ files as JSON
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Clear the asset cache
config.cacheStores = [];
config.resetCache = true;

// Apply Nativewind with minimal configuration
const nativeWindConfig = withNativeWind(config, {
  input: './global.css',
  projectRoot: __dirname,
});

module.exports = nativeWindConfig;
