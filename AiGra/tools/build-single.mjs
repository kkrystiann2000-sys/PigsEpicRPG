/* Bundles the game into one offline HTML file with a fresh save slot. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const css = ['css/style.css', 'css/ui.css', 'css/juice.css', 'css/tutorial.css', 'css/polish.css'].map(read).join('\n');
const js = ['js/art.js', 'js/tips.js', 'js/data.js', 'js/audio.js', 'js/battle.js', 'js/game.js', 'js/tutorial.js']
  .map((p) => `/* ---- ${p} ---- */\n${read(p)}`)
  .join('\n')
  // separate save slot so a playtest always begins from zero
  .replace("'piggy-epic-save-v2'", "'piggy-epic-playtest-v1'")
  .replace("'piggy-epic-save-v1'", "'piggy-epic-playtest-legacy'")
  .replace('</script>', '<\\/script>');

const html = read('index.html')
  .replace(/<link rel="stylesheet" href="css\/[^"]+" \/>\s*/g, '')
  .replace(/<script src="js\/[^"]+"><\/script>\s*/g, '')
  .replace('</head>', `  <style>\n${css}\n  </style>\n</head>`)
  .replace('</body>', `  <script>\n${js}\n  </script>\n</body>`);

fs.writeFileSync(path.join(root, 'playtest.html'), html);
console.log('playtest.html', (html.length / 1024).toFixed(0) + ' KB');
