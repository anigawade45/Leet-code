import fs from 'fs';
import path from 'path';

const directoryPath = path.join(process.cwd(), 'src');

const replacements = [
  { search: /bg-\[#1a1a1a\]/g, replace: 'bg-background' },
  { search: /bg-\[#282828\]/g, replace: 'bg-card' },
  { search: /bg-\[#3e424a\]/g, replace: 'bg-muted' },
  { search: /bg-\[#363636\]/g, replace: 'bg-muted' },
  { search: /bg-\[#ffffff14\]/g, replace: 'bg-muted' },
  { search: /bg-\[#ffffff24\]/g, replace: 'bg-accent' },
  { search: /border-\[#282828\]/g, replace: 'border-border' },
  { search: /border-\[#3e424a\]\/30/g, replace: 'border-border/30' },
  { search: /border-\[#3e424a\]\/50/g, replace: 'border-border/50' },
  { search: /border-\[#3e424a\]/g, replace: 'border-border' },
  { search: /text-\[#eff2f699\]/g, replace: 'text-muted-foreground' },
  { search: /text-\[#eff2f650\]/g, replace: 'text-muted-foreground/70' },
  { search: /text-\[#b9bbbe\]/g, replace: 'text-muted-foreground' },
  { search: /text-\[#8a8a8a\]/g, replace: 'text-muted-foreground' },
  { search: /text-\[#eff2f6\]/g, replace: 'text-foreground' }
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      for (const { search, replace } of replacements) {
        if (search.test(content)) {
          content = content.replace(search, replace);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

processDirectory(directoryPath);
console.log('Color replacement complete.');