// webpack.config.js — Salla Twilight build contract.
// Compiles src/assets entries to public/ (which `salla theme preview` serves
// and asset() resolves). Mirrors theme-raed's setup, trimmed to our entries.
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const asset = (file) => path.resolve('src/assets', file || '');
const pub = (file) => path.resolve('public', file || '');

module.exports = {
  entry: {
    // `app` bundles our SCSS entry + JS entry → public/app.css + public/app.js
    app: [asset('styles/app.scss'), asset('js/app.js')],
    home: asset('js/home.js'),
  },
  output: {
    path: pub(),
    clean: true,
    chunkFilename: '[name].[contenthash].js',
  },
  stats: { modules: false, assetsSort: 'size', assetsSpace: 50 },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/(node_modules)/],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [['@babel/plugin-transform-runtime', { regenerator: true }]],
          },
        },
      },
      {
        test: /\.(s(a|c)ss)$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { url: false } },
          'postcss-loader',
          'sass-loader',
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new CopyPlugin({ patterns: [{ from: asset('images'), to: pub('images') }] }),
  ],
  optimization: {
    minimizer: ['...', new CssMinimizerPlugin()],
  },
};
