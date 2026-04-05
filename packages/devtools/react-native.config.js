module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        sourceDir: './android',
        packageImportPath:
          'import com.radardevtools.nativemodule.RadarPerformancePackage;',
        packageInstance: 'new RadarPerformancePackage()',
      },
    },
  },
};
