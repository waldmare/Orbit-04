module.exports = {
  packagerConfig: {
    asar: true,
    name: 'ORBIT-04'
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32', 'linux', 'darwin']
    }
  ]
};
