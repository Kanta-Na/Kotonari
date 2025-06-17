<<<<<<< HEAD

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveAudio: (audioBuffer) => ipcRenderer.invoke('save-audio', audioBuffer)
});
=======

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveAudio: (audioBuffer) => ipcRenderer.invoke('save-audio', audioBuffer)
});
>>>>>>> 0c12d86 (first commit from Mac)
