const path = require('path');
const webpack = require('webpack');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');

const gitCommit = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();
const gitBranch = require('child_process')
  .execSync('git rev-parse --abbrev-ref HEAD')
  .toString()
  .trim();

const releaseName = `fixtweet-${gitBranch}-${gitCommit}-${new Date()
  .toISOString()
  .substring(0, 19)}`;

require('dotenv').config();

let envVariables = [
  'BRANDING_NAME',
  'BRANDING_NAME_DISCORD',
  'BRANDING_NAME_SEMANTIC',
  'DOMAIN_SEMANTIC',
  'DIRECT_MEDIA_DOMAINS',
  'HOST_URL',
  'REDIRECT_URL',
  'EMBED_URL',
  'MOSAIC_DOMAIN_LIST',
  'API_HOST_LIST',
  'SENTRY_DSN',
  'DEPRECATED_DOMAIN_LIST',
  'DEPRECATED_DOMAIN_EPOCH'
];

let plugins = [
  ...envVariables.map(envVar => {
    return new webpack.DefinePlugin({
      [envVar]: JSON.stringify(process.env[envVar])
    });
  }),
  new webpack.DefinePlugin({
    RELEASE_NAME: `'${releaseName}'`
  })
];

if (process.env.SENTRY_AUTH_TOKEN) {
  plugins.push(
    new SentryWebpackPlugin({
      release: releaseName,
      include: './dist',
      urlPrefix: '~/',
      ignore: ['node_modules', 'webpack.config.js'],
      authToken: process.env.SENTRY_AUTH_TOKEN
    })
  );
}

module.exports = {
  entry: { worker: './src/server.ts' },
  target: 'webworker',
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist')
  },
  mode: 'production',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: { util: false }
  },
  plugins: plugins,
  optimization: { mangleExports: false },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: { transpileOnly: true }
      }
    ]
  }
};
