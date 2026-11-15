import { mkdir, copyFile, rm, cp } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const file of ['index.html', 'styles.css', 'motion.css', 'app.js', 'engine.js', 'motion.js', 'reactions.js', 'game.js', 'mascot.css', 'data.json', 'favicon.svg']) {
  await copyFile(file, `dist/${file}`);
}
await cp('assets', 'dist/assets', { recursive: true });
console.log('Static site built in dist/');
