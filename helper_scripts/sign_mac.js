import { notarize } from '@electron/notarize';
import path from 'path';

export default async function notarizing(context) {
  console.log(context);
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    console.log('Skipping notarization - not building for macOS:', electronPlatformName);
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`Notarizing ${appPath}...`);

  try {
    await notarize({
      tool: 'notarytool',
      appPath: appPath,
      keychain: process.env.KEYCHAIN_PATH || 'login.keychain-db',
      keychainProfile: 'deepnest-next',
    });
    console.log('Notarization successful');
  } catch (error) {
    console.error('Notarization failed:', error);
    throw error;
  }
}
