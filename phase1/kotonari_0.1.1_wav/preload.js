
/*
以下では、'electronAPI' という名前の API を作成しており、
その中には saveAudio関数や onStartRecording関数、onStopRecording関数を定義している。

そしてレンダラー側は、electronAPI を通してこれらの関数を使うことができる。
*/

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveAudio: (audioBuffer) => ipcRenderer.invoke('save-audio', audioBuffer),
  onStartRecording: (callback) => ipcRenderer.on('start-recording-from-tray', callback),
  onStopRecording: (callback) => ipcRenderer.on('stop-recording-from-tray', callback)
});

/*
もう少し正しい言い方をすると、
"windos.electronAPI"というグローバルオブジェクトが、レンダラープロセスで使えるようになった。
その中には、以下の３つの関数が expose されている。
・saveAudio()
・onStartRecording()
・onStopRecording()
*/