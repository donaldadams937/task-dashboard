const { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } = require('electron');
const { promises: fs } = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { runAgent } = require('./agent.cjs');

const jobs = new Map();
let mainWindow;

function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function defaultProjectsRoot() {
  return path.join(app.getPath('documents'), 'UnbeltedTech', 'projects');
}

async function loadStoredSettings() {
  try {
    return JSON.parse(await fs.readFile(settingsPath(), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function publicSettings() {
  const stored = await loadStoredSettings();
  return {
    model: stored.model || 'gpt-5-mini',
    projectsRoot: stored.projectsRoot || defaultProjectsRoot(),
    hasApiKey: Boolean(stored.encryptedApiKey),
  };
}

async function apiKey() {
  const stored = await loadStoredSettings();
  if (!stored.encryptedApiKey) {
    throw new Error('Add an OpenAI API key in Settings before starting a build.');
  }
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure credential storage is unavailable on this computer.');
  }
  return safeStorage.decryptString(Buffer.from(stored.encryptedApiKey, 'base64'));
}

function cleanProjectName(prompt) {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 5);
  return words.join('-').slice(0, 48) || 'new-application';
}

function emitAgentEvent(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('agent:event', payload);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 650,
    backgroundColor: '#08111f',
    title: 'UnbeltedTech',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  } else {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('settings:get', publicSettings);

ipcMain.handle('settings:choose-projects-root', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose where UnbeltedTech creates applications',
    properties: ['openDirectory', 'createDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('settings:save', async (_event, input) => {
  const stored = await loadStoredSettings();
  const next = {
    ...stored,
    model: String(input.model || 'gpt-5-mini').trim(),
    projectsRoot: path.resolve(input.projectsRoot || defaultProjectsRoot()),
  };

  if (input.apiKey) {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Secure credential storage is unavailable on this computer.');
    }
    next.encryptedApiKey = safeStorage.encryptString(input.apiKey.trim()).toString('base64');
  }

  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(next, null, 2), 'utf8');
  return publicSettings();
});

ipcMain.handle('agent:start', async (_event, input) => {
  const prompt = String(input.prompt || '').trim();
  if (prompt.length < 20) {
    throw new Error('Describe the application in at least 20 characters.');
  }
  if (jobs.size > 0) {
    throw new Error('Only one build can run at a time.');
  }

  const settings = await publicSettings();
  const key = await apiKey();
  const root = path.resolve(settings.projectsRoot);
  const suffix = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
  const workspace = path.join(root, `${cleanProjectName(prompt)}-${suffix}`);
  await fs.mkdir(workspace, { recursive: true });

  const jobId = crypto.randomUUID();
  const controller = new AbortController();
  jobs.set(jobId, controller);

  runAgent({
    apiKey: key,
    model: settings.model,
    prompt,
    workspace,
    signal: controller.signal,
    onEvent: (payload) => emitAgentEvent({ ...payload, jobId, workspace }),
  }).catch((error) => {
    emitAgentEvent({
      type: error.name === 'AbortError' ? 'stopped' : 'error',
      message: error.name === 'AbortError' ? 'Build stopped.' : error.message,
      jobId,
      workspace,
    });
  }).finally(() => {
    jobs.delete(jobId);
  });

  return { jobId, workspace };
});

ipcMain.handle('agent:stop', (_event, jobId) => {
  const controller = jobs.get(jobId);
  if (!controller) return false;
  controller.abort();
  return true;
});

ipcMain.handle('project:open', async (_event, projectPath) => {
  const settings = await publicSettings();
  const root = path.resolve(settings.projectsRoot);
  const requested = path.resolve(projectPath);
  const relative = path.relative(root, requested);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Cannot open a folder outside the configured projects directory.');
  }
  const error = await shell.openPath(requested);
  if (error) throw new Error(error);
  return true;
});
