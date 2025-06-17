<<<<<<< HEAD

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveAudio: (audioBuffer) => ipcRenderer.invoke('save-audio', audioBuffer),
  onAutoStartRecording: (callback) => ipcRenderer.on('auto-start-recording', callback),
  onStopRecordingBeforeQuit: (callback) => ipcRenderer.on('stop-recording-before-quit', callback),
  onUpdateRecordingInterval: (callback) => ipcRenderer.on('update-recording-interval', callback),
  updateRecordingStatus: (status) => ipcRenderer.send('update-recording-status', status),
  notifyFinalSaveCompleted: () => ipcRenderer.send('final-save-completed')
});
=======

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveAudio: (audioBuffer) => ipcRenderer.invoke('save-audio', audioBuffer),
  onAutoStartRecording: (callback) => ipcRenderer.on('auto-start-recording', callback),
  onStopRecordingBeforeQuit: (callback) => ipcRenderer.on('stop-recording-before-quit', callback),
  onUpdateRecordingInterval: (callback) => ipcRenderer.on('update-recording-interval', callback),
  updateRecordingStatus: (status) => ipcRenderer.send('update-recording-status', status),
  notifyFinalSaveCompleted: () => ipcRenderer.send('final-save-completed')
});
>>>>>>> 0c12d86 (first commit from Mac)
