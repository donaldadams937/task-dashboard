const { promises: fs } = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ALLOWED_PROGRAMS = new Set(['git', 'node', 'npm', 'npx']);
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage']);
const MAX_FILE_BYTES = 500_000;
const MAX_OUTPUT_LENGTH = 20_000;

function resolveInsideWorkspace(workspace, requestedPath = '.') {
  const root = path.resolve(workspace);
  const resolved = path.resolve(root, requestedPath);
  const relative = path.relative(root, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('The requested path is outside the project workspace.');
  }

  return resolved;
}

function executableName(program) {
  if (process.platform === 'win32' && ['npm', 'npx'].includes(program)) {
    return `${program}.cmd`;
  }
  return program;
}

async function readFile(workspace, requestedPath) {
  const filePath = resolveInsideWorkspace(workspace, requestedPath);
  const stats = await fs.stat(filePath);
  if (stats.size > MAX_FILE_BYTES) {
    throw new Error(`File is too large to read (${stats.size} bytes).`);
  }
  return fs.readFile(filePath, 'utf8');
}

async function writeFile(workspace, requestedPath, content) {
  if (Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES) {
    throw new Error('File content exceeds the 500 KB limit.');
  }

  const filePath = resolveInsideWorkspace(workspace, requestedPath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
  return `Wrote ${Buffer.byteLength(content, 'utf8')} bytes to ${requestedPath}`;
}

async function listFiles(workspace, requestedPath = '.') {
  const root = resolveInsideWorkspace(workspace, requestedPath);
  const results = [];

  async function visit(currentPath) {
    if (results.length >= 300) return;
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (results.length >= 300) break;
      if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;

      const absolutePath = path.join(currentPath, entry.name);
      const relativePath = path.relative(workspace, absolutePath);
      if (entry.isDirectory()) {
        await visit(absolutePath);
      } else {
        results.push(relativePath);
      }
    }
  }

  await visit(root);
  return results.join('\n') || '(empty project)';
}

function runCommand(workspace, program, args = [], signal) {
  if (!ALLOWED_PROGRAMS.has(program)) {
    throw new Error(`Program "${program}" is not allowed. Use git, node, npm, or npx.`);
  }
  if (!Array.isArray(args) || args.some((argument) => typeof argument !== 'string')) {
    throw new Error('Command arguments must be an array of strings.');
  }

  return new Promise((resolve, reject) => {
    const child = spawn(executableName(program), args, {
      cwd: workspace,
      env: { ...process.env, CI: 'true', NO_COLOR: '1' },
      shell: false,
      windowsHide: true,
      signal,
    });
    let output = '';
    let timedOut = false;

    const appendOutput = (chunk) => {
      output += chunk.toString();
      if (output.length > MAX_OUTPUT_LENGTH) {
        output = output.slice(-MAX_OUTPUT_LENGTH);
      }
    };

    child.stdout.on('data', appendOutput);
    child.stderr.on('data', appendOutput);

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 120_000);

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (timedOut) {
        reject(new Error(`Command timed out after 120 seconds.\n${output}`));
        return;
      }
      resolve(`Exit code: ${code}\n${output || '(no output)'}`);
    });
  });
}

module.exports = {
  ALLOWED_PROGRAMS,
  listFiles,
  readFile,
  resolveInsideWorkspace,
  runCommand,
  writeFile,
};
