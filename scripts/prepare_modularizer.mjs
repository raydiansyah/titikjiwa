import fs from 'node:fs';

const path = 'scripts/modularize_app.py';
let source = fs.readFileSync(path, 'utf8');
const start = source.indexOf('def extract_function(name: str) -> str:');
const end = source.indexOf('\ndef export_fn', start);
if (start < 0 || end < 0) throw new Error('extract_function block not found');
const replacement = `def extract_function(name: str) -> str:\n    import json, subprocess\n    script = r'''\nconst fs = require('fs');\nconst parser = require('./frontend/node_modules/@babel/parser');\nconst source = fs.readFileSync('frontend/src/App.js', 'utf8');\nconst ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });\nconst name = process.argv[1];\nconst node = ast.program.body.find((item) => item.type === 'FunctionDeclaration' && item.id && item.id.name === name);\nif (!node) { console.error('Function not found: ' + name); process.exit(2); }\nprocess.stdout.write(JSON.stringify([node.start, node.end]));\n'''\n    result = subprocess.run(['node', '-e', script, name], cwd=ROOT, capture_output=True, text=True, check=True)\n    start, end = json.loads(result.stdout)\n    return source[start:end]\n\n`;
source = source.slice(0, start) + replacement + source.slice(end + 1);
source = source.replace("['scripts/modularize_app.py', '.github/workflows/modularize-app.yml']", "['scripts/modularize_app.py', 'scripts/prepare_modularizer.mjs', '.github/workflows/modularize-app.yml']");
fs.writeFileSync(path, source);
