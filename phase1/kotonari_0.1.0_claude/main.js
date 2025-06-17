<<<<<<< HEAD

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('public/index.html');
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ローカル時間でタイムスタンプを生成する関数
function getLocalTimestamp() {
  const now = new Date();

  // ユーザーのローカル時間を使用
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

// 音声データを保存するIPC
ipcMain.handle('save-audio', async (event, audioBuffer) => {
  try {
    // audioディレクトリが存在しない場合は作成
    const audioDir = path.join(__dirname, 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // ローカル時間でファイル名を生成
    const timestamp = getLocalTimestamp();
    const filename = `recording-${timestamp}.wav`;
    const filepath = path.join(audioDir, filename);

    // バッファをファイルに書き込み
    const buffer = Buffer.from(audioBuffer);
    fs.writeFileSync(filepath, buffer);

    return { success: true, filename };
  } catch (error) {
    console.error('Error saving audio:', error);
    return { success: false, error: error.message };
  }
});
=======

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('public/index.html');
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ローカル時間でタイムスタンプを生成する関数
function getLocalTimestamp() {
  const now = new Date();

  // ユーザーのローカル時間を使用
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

// 音声データを保存するIPC
ipcMain.handle('save-audio', async (event, audioBuffer) => {
  try {
    // audioディレクトリが存在しない場合は作成
    const audioDir = path.join(__dirname, 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // ローカル時間でファイル名を生成
    const timestamp = getLocalTimestamp();
    const filename = `recording-${timestamp}.wav`;
    const filepath = path.join(audioDir, filename);

    // バッファをファイルに書き込み
    const buffer = Buffer.from(audioBuffer);
    fs.writeFileSync(filepath, buffer);

    return { success: true, filename };
  } catch (error) {
    console.error('Error saving audio:', error);
    return { success: false, error: error.message };
  }
});
>>>>>>> 0c12d86 (first commit from Mac)
