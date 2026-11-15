import { mkdir, copyFile, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const file of ['index.html', 'styles.css', 'motion.css', 'app.js', 'engine.js', 'motion.js', 'data.json', 'favicon.svg']) {
  await copyFile(file, `dist/${file}`);
}
console.log('Static site built in dist/');
