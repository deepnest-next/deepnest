// Version information for the application
export const VERSION_INFO = {
  version: '2.0.0',
  buildDate: new Date().toISOString().split('T')[0],
  name: 'DeepNest Next',
  description: 'Advanced nesting software for CNC, laser cutters, and plotters'
};

export const getVersionInfo = () => VERSION_INFO;

export const getVersionString = () => `${VERSION_INFO.name} v${VERSION_INFO.version}`;

export const getBuildInfo = () => `Built on ${VERSION_INFO.buildDate}`;