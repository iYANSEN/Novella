module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@store': './src/store',
            '@hooks': './src/hooks',
            '@plugins': './src/plugins',
            '@utils': './src/utils',
            '@types': './src/types',
            '@constants': './src/constants',
          },
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
