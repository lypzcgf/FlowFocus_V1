const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/background.js',
    content: './src/content/content.js',
    sidebar: './src/sidebar/sidebar.js',
    popup: './src/sidebar/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'icons/[name][ext]'
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/sidebar/sidebar.html',
      filename: 'sidebar/sidebar.html',
      chunks: ['sidebar']
    }),
    new HtmlWebpackPlugin({
      template: './src/sidebar/popup.html',
      filename: 'sidebar/popup.html',
      chunks: ['popup']
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'manifest.json',
          to: 'manifest.json'
        },
        {
          from: 'icons',
          to: 'icons'
        },
        {
          from: 'src/sidebar/sidebar.css',
          to: 'sidebar/sidebar.css'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map'
};