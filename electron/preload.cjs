const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('unbeltedTech', {
  chooseProjectsRoot: () => ipcRenderer.invoke('settings:choose-projects-root'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  startBuild: (request) => ipcRenderer.invoke('agent:start', request),
  stopBuild: (jobId) => ipcRenderer.invoke('agent:stop', jobId),
  openProject: (projectPath) => ipcRenderer.invoke('project:open', projectPath),
  onAgentEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('agent:event', listener);
    return () => ipcRenderer.removeListener('agent:event', listener);
  },
});
