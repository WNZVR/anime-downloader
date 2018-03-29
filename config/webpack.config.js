const defaults = require('./defaults')
const webpack = require('webpack')
const autoprefixer = require('autoprefixer')
const chalk = require('chalk')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HTMLPlugin = require('html-webpack-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const { spawn } = require('child_process')

console.info(`\n\rStage: ${chalk.bold.blue(process.env.NODE_ENV.toUpperCase())}`)

const isDevelopment = () => process.env.NODE_ENV === 'development'
const isProduction = (isTrue, isFalse) => (process.env.NODE_ENV === 'production' ? isTrue : isFalse)
const publicPath = `http://${defaults.appDevHostname}:${defaults.appDevPort}`
const defaultEntry = [require.resolve('babel-polyfill'), './app.js']

let electronOpen = false

module.exports = {
  bail: true,
  target: 'electron-renderer',
  devtool: isProduction('cheap-module-source-map', 'source-map'),
  context: defaults.appSrc,
  entry: isProduction(defaultEntry, [
    'webpack/hot/dev-server',
    `webpack-dev-server/client?${publicPath}`,
    ...defaultEntry
  ]),
  output: {
    filename: `${isProduction('[hash:16]', '[name]')}.js`,
    path: defaults.appDist
  },
  devServer: {
    publicPath,
    port: defaults.appDevPort,
    contentBase: defaults.appDist,
    stats: 'errors-only',
    after () {
      spawn('npm', [...'run preview'.split(' ')], { shell: true, stdio: 'inherit' })
        .on('close', process.exit)
        .on('error', spawnError => {
          throw spawnError
        })
    }
  },
  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.js$/,
        loader: require.resolve('babel-loader'),
        options: {
          compact: true,
          babelrc: false,
          presets: [
            [
              require.resolve('babel-preset-env'),
              {
                targets: {
                  ie: 9,
                  uglify: true
                },
                useBuiltIns: false
              }
            ],
            require.resolve('babel-preset-stage-2')
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
        use: require.resolve('raw-loader')
      },
      {
        test: /\.(otf|ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
        loader: require.resolve('file-loader'),
        options: {
          name: `${isProduction('[hash:16]', '[name]')}.[ext]`
        }
      },
      {
        test: /\.(css|scss)$/,
        use: ExtractTextPlugin.extract({
          fallback: require.resolve('style-loader'),
          use: [
            {
              loader: require.resolve('css-loader'),
              options: {
                importLoaders: 1,
                minimize: isProduction({ discardComments: { removeAll: true } }, false)
              }
            },
            require.resolve('sass-loader'),
            {
              loader: require.resolve('postcss-loader'),
              options: {
                plugins: [
                  autoprefixer({
                    browsers: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9'],
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
  stats: 'errors-only',
  plugins: [
    new HTMLPlugin({
      template: defaults.appTemplate,
      inject: true,
      minify: isProduction(
        {
          removeComments: true,
          collapseWhitespace: true,
          minifyURLs: true,
          minifyJS: true,
          minifyCSS: true,
          keepClosingSlash: true,
          removeEmptyAttributes: true
        },
        false
      )
    }),
    new ExtractTextPlugin({
      allChunks: true,
      filename: `${isProduction('bundle.[name].[contenthash:8]', '[name]')}.css`,
      disable: isDevelopment()
    }),
    ...isProduction(
      [
        new webpack.optimize.UglifyJsPlugin({
          compress: { warnings: false },
          warnings: false,
          comments: false
        })
      ],
      [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.LoaderOptionsPlugin({ debug: true }),

        // A small hack that'll launch another instance of
        // webpack-dev-server once the compiling is done on
        // the development stage
        new webpack.ProgressPlugin(percentage => {
          if (percentage === 1 && !electronOpen) {
            electronOpen = true
            spawn('npm', [...'run webpack:server'.split(' ')], { shell: true, stdio: 'inherit' })
              .on('close', process.exit)
              .on('error', spawnError => {
                throw spawnError
              })
          }
        })
      ]
    ),
    new ProgressBarPlugin({
      clear: false,
      renderThrottle: 1,
      format: `[${chalk.green.bold(':percent')}] - (:current/:total) - ${chalk.underline(
        ':elapseds'
      )} - :msg`
    })
  ]
}
