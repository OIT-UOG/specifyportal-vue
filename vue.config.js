const Dotenv = require('dotenv-webpack')

module.exports = {
  publicPath: '',
  outputDir: 'dist',
  configureWebpack: {
    plugins: [
      new Dotenv()
    ]
  }
}
