// const path = require('path');
const webpack = require('webpack');

/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

/*
 * We've enabled MiniCssExtractPlugin for you. This allows your app to
 * use css modules that will be moved into a separate CSS file instead of inside
 * one of your module entries!
 *
 * https://github.com/webpack-contrib/mini-css-extract-plugin
 *
 */

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

/*
 * We've enabled TerserPlugin for you! This minifies your app
 * in order to load faster and run less javascript.
 *
 * https://github.com/webpack-contrib/terser-webpack-plugin
 *
 */

// const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: ['./src/extension.ts'],
  output: {
    filename: 'extension.js',
    library: 'init',
    libraryTarget: 'var',
    libraryExport: 'default',
  },
  

  plugins: [new webpack.ProgressPlugin(), new MiniCssExtractPlugin({ filename: 'stylesheet.css' })],

  module: {
    rules: [
      {
        test: /.(ts)$/,
        loader: 'ts-loader',
        exclude: [/node_modules/],
      },
      {
        test: /.(json)$/,
        loader: 'file-loader',
        type: 'javascript/auto',
        options: {
          name() {
            return '[name].[ext]';
          },
        },
        exclude: [/node_modules/],
      },
      {
        test: /.(scss|css)$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  optimization: {
    minimize: false
  }
};
