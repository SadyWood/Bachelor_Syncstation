// packages/timeline/scripts/copy-css.js
import { readdirSync, cpSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = join(__dirname, '..', 'src');
const distDir = join(__dirname, '..', 'dist');

// Find and copy all CSS files recursively
function copyCssFiles(srcPath, distPath) {
  const entries = readdirSync(srcPath, { withFileTypes: true });

  for (const entry of entries) {
    const srcFile = join(srcPath, entry.name);
    const distFile = join(distPath, entry.name);

    if (entry.isDirectory()) {
      if (!existsSync(distFile)) {
        mkdirSync(distFile, { recursive: true });
      }
      copyCssFiles(srcFile, distFile);
    } else if (entry.name.endsWith('.css')) {
      cpSync(srcFile, distFile);
      console.log(`Copied: ${entry.name}`);
    }
  }
}

console.log('Copying CSS files...');
copyCssFiles(srcDir, distDir);
console.log('Done!');
