const Dotenv = require('dotenv-webpack')

module.exports = {
  publicPath: '',
  outputDir: '../apps/viewer',
  configureWebpack: {
    plugins: [
      new Dotenv()
    ]
  }
}
