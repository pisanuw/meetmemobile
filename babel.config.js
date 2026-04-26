module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            // @/app/* → ./app/* (expo-router pages at root, must come before '@')
            '@/app': './app',
            // @/* → ./src/* (everything else)
            '@': './src',
          },
        },
      ],
    ],
  };
};
