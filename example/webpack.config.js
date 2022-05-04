const { DependencyCheckPlugin } = require('dependency-check-plugin');

module.exports = {
  mode: 'production',
  entry: {
    main: './src/main.js',
    api: './src/api.js',
  },
  plugins: [new DependencyCheckPlugin()],
};
