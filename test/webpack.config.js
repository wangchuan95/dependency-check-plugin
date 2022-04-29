const fs = require('fs');
const path = require('path');
const { DependencyCheckPlugin } = require('../index');

module.exports = {
  mode: 'production',
  entry: {
    main: path.resolve(__dirname, './src/main.js'),
    api: path.resolve(__dirname, './src/api.js'),
  },
  output: {
    path: path.resolve(__dirname, './dist'),
  },
  plugins: [new DependencyCheckPlugin()],
};
