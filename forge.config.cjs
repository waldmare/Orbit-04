const path = require('node:path');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'ORBIT-04',
    executableName: 'ORBIT-04',
    appBundleId: 'com.waldmare.orbit04',
    appCategoryType: 'public.app-category.games',
    icon: path.join(__dirname, 'assets', 'branding', 'orbit-app-icon.ico'),
    prune: true,
    win32metadata: {
      CompanyName: 'Waldemar',
      FileDescription: 'ORBIT//04 tactical space survival',
      OriginalFilename: 'ORBIT-04.exe',
      ProductName: 'ORBIT//04'
    },
    ignore: [
      /^\/.git(?:\/|$)/,
      /^\/.github(?:\/|$)/,
      /^\/docs(?:\/|$)/,
      /^\/out(?:\/|$)/,
      /^\/steam(?:\/|$)/,
      /^\/tests(?:\/|$)/,
      /^\/tools(?:\/|$)/,
      /^\/START_ORBIT\.cmd$/,
      /^\/CHANGELOG\.md$/,
      /^\/CONTRIBUTING\.md$/,
      /^\/STEAM_RELEASE\.md$/
    ]
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32']
    }
  ]
};
