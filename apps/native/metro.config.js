const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm monorepo: watch the whole repo so Metro can find hoisted packages.
config.watchFolders = [monorepoRoot];

// Resolve from project first, then monorepo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force a single copy of React (and react-native). Without this, hoisted
// packages (e.g. @tanstack/react-query in root node_modules) resolve to
// root node_modules/react (React 18) instead of the app's React 19,
// causing "Invalid hook call" / "useState of null".
const singletonModules = ['react', 'react-native'];
const singletonPrefixes = ['react/', 'react-native/'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    singletonModules.includes(moduleName) ||
    singletonPrefixes.some((p) => moduleName.startsWith(p))
  ) {
    return {
      type: 'sourceFile',
      filePath: require.resolve(moduleName, { paths: [projectRoot] }),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
