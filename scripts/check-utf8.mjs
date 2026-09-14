import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ignoredDirectories = new Set(['.git', '.next', '.vercel', 'node_modules']);
const textExtensions = new Set([
  '.css',
  '.example',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mdx',
  '.mjs',
  '.scss',
  '.sql',
  '.svg',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yaml',
  '.yml',
]);
const textFileNames = new Set(['.editorconfig', '.gitattributes', '.gitignore']);
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

async function findTextFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findTextFiles(entryPath)));
    } else if (
      entry.isFile() &&
      (textFileNames.has(entry.name) || textExtensions.has(path.extname(entry.name).toLowerCase()))
    ) {
      files.push(entryPath);
    }
  }

  return files;
}

const invalidFiles = [];

for (const file of await findTextFiles(process.cwd())) {
  try {
    utf8Decoder.decode(await readFile(file));
  } catch {
    invalidFiles.push(path.relative(process.cwd(), file));
  }
}

if (invalidFiles.length > 0) {
  console.error('Invalid UTF-8 found in:');
  for (const file of invalidFiles) console.error(`- ${file}`);
  process.exitCode = 1;
} else {
  console.log('All text files are valid UTF-8.');
}
