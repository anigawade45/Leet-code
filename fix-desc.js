import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/components/problem/ProblemDetail/DescriptionPanel.js');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/text-\\[#e6e6e6\\]/g, 'text-foreground');
content = content.replace(/hover:text-white/g, 'hover:text-foreground');
content = content.replace(/text-white/g, 'text-foreground');
content = content.replace(/bg-\\[#2d3035\\]/g, 'bg-muted');
content = content.replace(/hover:bg-\\[#333\\]/g, 'hover:bg-accent');
content = content.replace(/hover:bg-\\[#323232\\]/g, 'hover:bg-accent');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed DescriptionPanel.js');