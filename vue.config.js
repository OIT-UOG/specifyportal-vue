const Dotenv = require('dotenv-webpack')

module.exports = {
  publicPath: '',
  outputDir: 'build/viewer',
  configureWebpack: {
    plugins: [
      new Dotenv()
    ]
  }
}
