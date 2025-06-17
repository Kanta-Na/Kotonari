<<<<<<< HEAD

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveAudio: (audioBuffer) => ipcRenderer.invoke('save-audio', audioBuffer),
  onStartRecording: (callback) => ipcRenderer.on('start-recording-from-tray', callback),
  onStopRecording: (callback) => ipcRenderer.on('stop-recording-from-tray', callback)
});
=======

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveAudio: (audioBuffer) => ipcRenderer.invoke('save-audio', audioBuffer),
  onStartRecording: (callback) => ipcRenderer.on('start-recording-from-tray', callback),
  onStopRecording: (callback) => ipcRenderer.on('stop-recording-from-tray', callback)
});
>>>>>>> 0c12d86 (first commit from Mac)
