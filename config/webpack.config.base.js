const { join } = require('path')
const webpack = require('webpack')
const HtmlPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const { appSrc, appDist, appEnv } = require('./defaults')
const autoprefixer = require('autoprefixer')

const compress = appEnv === 'production'

module.exports = {
  bail: true,
  target: 'electron-renderer',
  devtool: 'cheap-source-map',
  context: appSrc,
  entry: [require.resolve('babel-polyfill'), './app.js'],
  output: {
    filename: `${compress ? '[hash:16]' : '[name]'}.js`,
    path: appDist
  },
  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.js$/,
        loader: require.resolve('babel-loader'),
        options: {
          babelrc: false,
          compact: true,
          presets: [
            [
              require('babel-preset-env').default,
              {
                targets: {
                  ie: 9,
                  uglify: true
                },
                useBuiltIns: false,
                modules: false
              }
            ],
            'stage-2'
          ],
          plugins: [
            [
              require.resolve('babel-plugin-transform-runtime'),
              {
                helpers: false,
                polyfill: false,
                regenerator: true
              }
            ]
          ]
        }
      },
      {
        test: /\.html$/,
        loader: require.resolve('raw-loader')
      },
      {
        test: /\.(otf|ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
        loader: require.resolve('file-loader'),
        options: {
          name: `${compress ? '[hash:16]' : '[name]'}.[ext]`
        }
      },
      {
        test: /\.(css|scss|sass)$/,
        loader: ExtractTextPlugin.extract({
          fallback: require.resolve('style-loader'),
          use: [
            {
              loader: require.resolve('css-loader'),
              options: {
                importLoaders: 1,
                minimize: compress
                  ? { discardComments: { removeAll: true } }
                  : false
              }
            },
            require.resolve('sass-loader'),
            {
              loader: require.resolve('postcss-loader'),
              options: {
                plugins: [
                  autoprefixer({
                    browsers: [
                      '>1%',
                      'last 4 versions',
                      'Firefox ESR',
                      'not ie < 9'
                    ],
                    flexbox: 'no-2009'
                  })
                ]
              }
            }
          ]
        })
      }
    ]
  },
  plugins: [
    new HtmlPlugin({
      template: join(appSrc, 'assets', 'index.ejs'),
      inject: true,
      minify: compress
        ? {
          removeComments: true,
          collapseWhitespace: true,
          minifyURLs: true,
          minifyJS: true,
          minifyCSS: true,
          keepClosingSlash: true,
          removeEmptyAttributes: true
        }
        : false
    }),
    new ExtractTextPlugin({
      allChunks: true,
      filename: `${compress ? '[contenthash:16]' : '[name]'}.css`
    }),
    !compress
      ? () => {}
      : new webpack.optimize.UglifyJsPlugin({
        compress: { warnings: false },
        warnings: false,
        comments: false
      })
  ]
}
