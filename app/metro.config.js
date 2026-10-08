// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// openpgp.js only publishes a browser build and a Node build. On Android, use the
// browser one (the Node one needs Node's crypto); src/state/webcryptoShim.ts fills in
// the little WebCrypto it needs.
const openpgpBrowser = path.join(__dirname, 'node_modules/openpgp/dist/openpgp.min.mjs');
const resolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'openpgp') return { type: 'sourceFile', filePath: openpgpBrowser };
  return (resolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
