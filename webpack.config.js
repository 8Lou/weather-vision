const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
require('dotenv').config();

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/main.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'weather-widget.js',
      library: {
        name: 'WeatherWidget',
        type: 'umd',
        export: 'default'
      },
      globalObject: 'this',
      publicPath: isDevelopment ? '/' : '',
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.js', '.vue'],
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            appendTsSuffixTo: [/\.vue$/],
            transpileOnly: isDevelopment
          },
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
                importLoaders: 1
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new VueLoaderPlugin(),
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
        'process.env': JSON.stringify({
          NODE_ENV: isDevelopment ? 'development' : 'production',
          OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || 'demo'
        })
      }),
      new HtmlWebpackPlugin({
        template: isDevelopment ? './example.html' : './index.html',
        inject: 'body',
        minify: isProduction ? {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        } : false
      }),
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'weather-widget.css'
        }),
        new CompressionPlugin({
          filename: '[path][base].gz',
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8
        })
      ] : [])
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      compress: true,
      port: 8081,
      open: true,
      hot: true,
      liveReload: true,
      client: {
        overlay: {
          errors: true,
          warnings: false
        }
      }
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug']
            },
            format: {
              comments: false
            },
            mangle: true
          },
          extractComments: false
        }),
        new CssMinimizerPlugin()
      ],
      splitChunks: false,
      runtimeChunk: false,
      usedExports: true,
      sideEffects: true
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 102400,
      maxAssetSize: 102400
    },
    devtool: isDevelopment ? 'source-map' : 'source-map'
  };
};
