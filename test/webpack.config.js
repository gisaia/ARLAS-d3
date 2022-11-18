const { resolve } = require('path');
const path = require('path');

const CONFIG = {
  mode: 'development',
  entry: {
    app: './app.js'
  },
  devServer: {
    historyApiFallback: true,
    static: "./"
  },
  output: {
    filename:'app.js',
    publicPath: 'auto',
    path: path.resolve(__dirname, 'public')
  },
  resolve: {
    alias: {
      'arlas-d3': resolve('dist/index.js')
    }
  }
};

// This line enables bundling against src in this repo rather than installed module
module.exports = CONFIG;