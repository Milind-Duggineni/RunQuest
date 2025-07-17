const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

function createConfig() {
  const config = getDefaultConfig(__dirname);
  const { transformer, resolver } = config;

  // Configure SVG transformer
  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  };

  // Configure resolver for SVG and TMJ files
  config.resolver = {
    ...resolver,
    // Remove SVG from asset extensions (handled by transformer)
    assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
    // Add SVG and TMJ to source extensions
    sourceExts: [...resolver.sourceExts, 'svg', 'tmj'],
  };

  return config;
}

// Create and export the final config with NativeWind
const config = createConfig();
module.exports = withNativeWind(config, {
  input: './global.css',
  projectRoot: __dirname,
});

console.log('✅ Metro config loaded with SVG and NativeWind support');
