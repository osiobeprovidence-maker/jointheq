const workboxBuild = require('workbox-build');
const path = require('path');

async function run() {
  const distDir = path.resolve(__dirname, 'dist');
  const swSrc = path.resolve(__dirname, 'public', 'sw.js');
  const swDest = path.resolve(distDir, 'sw.js');

  try {
    const { count, size, warnings } = await workboxBuild.injectManifest({
      swSrc,
      swDest,
      globDirectory: distDir,
      globPatterns: [
        '**/*.{html,js,css,png,jpg,jpeg,svg,webp,json,ico}'
      ],
    });

    if (warnings && warnings.length) {
      console.warn('Workbox warnings:', warnings);
    }

    console.log(`Injected ${count} files, totaling ${size} bytes into ${swDest}`);
  } catch (err) {
    console.error('Failed to inject Workbox manifest:', err);
    process.exit(1);
  }
}

run();
