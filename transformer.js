const { getDefaultConfig } = require('@expo/metro-config');
const { FileStore } = require('metro-cache');
const { resolve } = require('path');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Add support for TMJ files as source files
  config.resolver.sourceExts = [...config.resolver.sourceExts, 'tmj'];
  
  // Add custom resolver for TMJ files
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName.endsWith('.tmj')) {
      return {
        filePath: resolve(context.originModulePath, '..', moduleName),
        type: 'sourceFile',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  };

  // Add custom transformer for TMJ files
  config.transformer.babelTransformerPath = require.resolve('./tmj-transformer');
  
  return config;
})();
