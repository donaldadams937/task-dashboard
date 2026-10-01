const { mkdtemp, rm, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  readFile,
  resolveInsideWorkspace,
  runCommand,
  writeFile: writeWorkspaceFile,
} = require('./workspace.cjs');

describe('workspace tools', () => {
  let workspace;

  beforeEach(async () => {
    workspace = await mkdtemp(path.join(os.tmpdir(), 'unbeltedtech-'));
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it('prevents file access outside the workspace', () => {
    expect(() => resolveInsideWorkspace(workspace, '..\\secret.txt')).toThrow(/outside/);
  });

  it('writes and reads project files', async () => {
    await writeWorkspaceFile(workspace, 'src\\app.js', 'export default true;');
    await expect(readFile(workspace, 'src\\app.js')).resolves.toBe('export default true;');
  });

  it('rejects programs outside the allowlist', async () => {
    expect(() => runCommand(workspace, 'powershell', ['Get-ChildItem'])).toThrow(/not allowed/);
  });

  it('rejects oversized files', async () => {
    await writeFile(path.join(workspace, 'large.txt'), 'a'.repeat(500_001));
    await expect(readFile(workspace, 'large.txt')).rejects.toThrow(/too large/);
  });
});
