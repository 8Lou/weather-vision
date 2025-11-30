const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

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
            appendTsSuffixTo: [/\.vue$/]
          },
          exclude: /node_modules/
        },
        {
          test: /\.scss$/,
          use: [
            'style-loader',
            'css-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader'
          ]
        }
      ]
    },
    plugins: [
      new VueLoaderPlugin(),
      ...(isDevelopment ? [
        new HtmlWebpackPlugin({
          template: './example.html',
          inject: 'body'
        })
      ] : [])
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      compress: true,
      port: 8080,
      open: true,
      hot: true,
      liveReload: true
    },
    externals: {
      // Don't bundle Vue if it's already available
      // vue: 'Vue'
    },
    optimization: {
      minimize: !isDevelopment
    },
    devtool: isDevelopment ? 'source-map' : false
  };
};
