const { createTransformer } = require('nativewind/transformer');

module.exports = createTransformer({
  // Your custom config here
  config: require.resolve('./tailwind.config.js'),
  // Enable debugging
  debug: true,
  // The folder where the config is located
  configPath: __dirname,
  // The extensions that should be processed
  input: './global.css',
});
