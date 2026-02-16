module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Reanimated plugin must be listed last. Helps codegen/native module resolution
    // for gesture-handler and reanimated when building the JS bundle.
    plugins: ['react-native-reanimated/plugin'],
  };
};
