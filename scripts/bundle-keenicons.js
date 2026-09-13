import fs from 'fs';
import path from 'path';

const baseDir = path.resolve('src/components/keenicons');
const styles = ['duotone', 'filled', 'outline', 'solid'];

let bundledCss = '/* KeenIcons Styles Bundle - Generated */\n\n';

for (const style of styles) {
  const cssPath = path.join(baseDir, 'fonts', style, 'style.css');
  if (!fs.existsSync(cssPath)) {
    console.error('Missing style.css for:', style);
    process.exit(1);
  }
  let content = fs.readFileSync(cssPath, 'utf8');
  // Rewrite url('fonts/... to url('./fonts/{style}/fonts/...
  content = content.replace(/url\((['"]?)fonts\//g, `url($1./fonts/${style}/fonts/`);
  bundledCss += `/* ============================== */\n`;
  bundledCss += `/* KeenIcons Style: ${style} */\n`;
  bundledCss += `/* ============================== */\n\n`;
  bundledCss += content.trim() + '\n\n';
}

const outputPath = path.join(baseDir, 'styles.bundle.css');
fs.writeFileSync(outputPath, bundledCss, 'utf8');
console.log('Successfully bundled to:', outputPath, 'Total size:', fs.statSync(outputPath).size, 'bytes');

