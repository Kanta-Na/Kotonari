<<<<<<< HEAD

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// GPUアクセラレーションを無効化
app.disableHardwareAcceleration();

let mainWindow;
let tray = null;
let isQuitting = false;
let recordingConfig = { intervalMs: 300000 }; // デフォルト5分
let isCleaningUp = false; // クリーンアップ中フラグ

// 設定ファイルを読み込む関数
function loadConfig() {
  const configPath = path.join(__dirname, 'recording-config.json');
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      recordingConfig = JSON.parse(configData);
      console.log('Loaded recording config:', recordingConfig);
    } else {
      // 設定ファイルが存在しない場合は作成
      fs.writeFileSync(configPath, JSON.stringify(recordingConfig, null, 2));
      console.log('Created default config file');
    }
  } catch (error) {
    console.error('Config file read error:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('public/index.html');
  
  // ウィンドウが準備できたら自動録音を開始
  mainWindow.webContents.once('did-finish-load', () => {
    // 設定を送信してから録音開始
    mainWindow.webContents.send('auto-start-recording', recordingConfig.intervalMs);
  });
  
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = process.platform === 'win32' 
    ? path.join(__dirname, 'assets', 'icon.ico')
    : path.join(__dirname, 'assets', 'icon.png');
  
  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    trayIcon = nativeImage.createEmpty();
  }
  
  tray = new Tray(trayIcon);
  tray.setToolTip('Kotonari - Auto Recording');
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: `Recording Interval: ${recordingConfig.intervalMs / 1000}s`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Reload Config',
      click: () => {
        loadConfig();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-recording-interval', recordingConfig.intervalMs);
        }
        createTray(); // トレイメニューを更新
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        gracefulShutdown();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// グレースフルシャットダウン関数
async function gracefulShutdown() {
  if (isCleaningUp) return;
  
  console.log('Starting graceful shutdown...');
  isCleaningUp = true;
  isQuitting = true;
  
  // Rendererプロセスに録音停止を通知
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('stop-recording-before-quit');
    
    // 録音停止と保存が完了するまで待つ
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // トレイをクリーンアップ
  if (tray) {
    tray.destroy();
  }
  
  // アプリを終了
  app.exit(0);
}

// プロセスシグナルのハンドリング
process.on('SIGINT', async () => {
  console.log('Received SIGINT');
  await gracefulShutdown();
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM');
  await gracefulShutdown();
});

// Windowsの場合のCtrl+C対応
if (process.platform === 'win32') {
  const readline = require('readline');
  readline.createInterface({
    input: process.stdin,
    output: process.stdout
  }).on('SIGINT', async () => {
    console.log('Received SIGINT (Windows)');
    await gracefulShutdown();
  });
}

app.on('ready', () => {
  loadConfig(); // 設定を読み込み
  createWindow();
  createTray();
});

if (process.platform === 'darwin') {
  app.dock.hide();
}

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// アプリ終了前に録音を停止
app.on('before-quit', (event) => {
  if (!isQuitting && !isCleaningUp) {
    event.preventDefault();
    gracefulShutdown();
  }
});

function getLocalTimestamp() {
  const now = new Date();
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

// 音声データを保存するIPC（確認メッセージ追加）
ipcMain.handle('save-audio', async (event, audioBuffer) => {
  try {
    const audioDir = path.join(__dirname, 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const timestamp = getLocalTimestamp();
    const filename = `recording-${timestamp}.wav`;
    const filepath = path.join(audioDir, filename);

    const buffer = Buffer.from(audioBuffer);
    fs.writeFileSync(filepath, buffer);

    console.log('Saved audio file:', filename);

    // 録音状態をトレイメニューに反映
    if (tray && !isCleaningUp) {
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Show Window',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            }
          }
        },
        {
          label: `Latest: ${filename}`,
          enabled: false
        },
        {
          label: `Recording Interval: ${recordingConfig.intervalMs / 1000}s`,
          enabled: false
        },
        { type: 'separator' },
        {
          label: 'Reload Config',
          click: () => {
            loadConfig();
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('update-recording-interval', recordingConfig.intervalMs);
            }
            createTray();
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          click: () => {
            gracefulShutdown();
          }
        }
      ]);
      tray.setContextMenu(contextMenu);
    }

    return { success: true, filename };
  } catch (error) {
    console.error('Error saving audio:', error);
    return { success: false, error: error.message };
  }
});

// 最終保存完了の通知を受信
ipcMain.on('final-save-completed', () => {
  console.log('Final save completed, exiting...');
  if (isCleaningUp) {
    setTimeout(() => {
      app.exit(0);
    }, 500);
  }
});

// 録音状態の更新を受信
ipcMain.on('update-recording-status', (event, status) => {
  if (tray && !isCleaningUp) {
    tray.setToolTip(`Kotonari - ${status}`);
  }
});
=======

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// GPUアクセラレーションを無効化
app.disableHardwareAcceleration();

let mainWindow;
let tray = null;
let isQuitting = false;
let recordingConfig = { intervalMs: 300000 }; // デフォルト5分
let isCleaningUp = false; // クリーンアップ中フラグ

// 設定ファイルを読み込む関数
function loadConfig() {
  const configPath = path.join(__dirname, 'recording-config.json');
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      recordingConfig = JSON.parse(configData);
      console.log('Loaded recording config:', recordingConfig);
    } else {
      // 設定ファイルが存在しない場合は作成
      fs.writeFileSync(configPath, JSON.stringify(recordingConfig, null, 2));
      console.log('Created default config file');
    }
  } catch (error) {
    console.error('Config file read error:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('public/index.html');
  
  // ウィンドウが準備できたら自動録音を開始
  mainWindow.webContents.once('did-finish-load', () => {
    // 設定を送信してから録音開始
    mainWindow.webContents.send('auto-start-recording', recordingConfig.intervalMs);
  });
  
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = process.platform === 'win32' 
    ? path.join(__dirname, 'assets', 'icon.ico')
    : path.join(__dirname, 'assets', 'icon.png');
  
  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    trayIcon = nativeImage.createEmpty();
  }
  
  tray = new Tray(trayIcon);
  tray.setToolTip('Kotonari - Auto Recording');
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: `Recording Interval: ${recordingConfig.intervalMs / 1000}s`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Reload Config',
      click: () => {
        loadConfig();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-recording-interval', recordingConfig.intervalMs);
        }
        createTray(); // トレイメニューを更新
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        gracefulShutdown();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// グレースフルシャットダウン関数
async function gracefulShutdown() {
  if (isCleaningUp) return;
  
  console.log('Starting graceful shutdown...');
  isCleaningUp = true;
  isQuitting = true;
  
  // Rendererプロセスに録音停止を通知
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('stop-recording-before-quit');
    
    // 録音停止と保存が完了するまで待つ
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // トレイをクリーンアップ
  if (tray) {
    tray.destroy();
  }
  
  // アプリを終了
  app.exit(0);
}

// プロセスシグナルのハンドリング
process.on('SIGINT', async () => {
  console.log('Received SIGINT');
  await gracefulShutdown();
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM');
  await gracefulShutdown();
});

// Windowsの場合のCtrl+C対応
if (process.platform === 'win32') {
  const readline = require('readline');
  readline.createInterface({
    input: process.stdin,
    output: process.stdout
  }).on('SIGINT', async () => {
    console.log('Received SIGINT (Windows)');
    await gracefulShutdown();
  });
}

app.on('ready', () => {
  loadConfig(); // 設定を読み込み
  createWindow();
  createTray();
});

if (process.platform === 'darwin') {
  app.dock.hide();
}

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// アプリ終了前に録音を停止
app.on('before-quit', (event) => {
  if (!isQuitting && !isCleaningUp) {
    event.preventDefault();
    gracefulShutdown();
  }
});

function getLocalTimestamp() {
  const now = new Date();
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

// 音声データを保存するIPC（確認メッセージ追加）
ipcMain.handle('save-audio', async (event, audioBuffer) => {
  try {
    const audioDir = path.join(__dirname, 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const timestamp = getLocalTimestamp();
    const filename = `recording-${timestamp}.wav`;
    const filepath = path.join(audioDir, filename);

    const buffer = Buffer.from(audioBuffer);
    fs.writeFileSync(filepath, buffer);

    console.log('Saved audio file:', filename);

    // 録音状態をトレイメニューに反映
    if (tray && !isCleaningUp) {
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Show Window',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            }
          }
        },
        {
          label: `Latest: ${filename}`,
          enabled: false
        },
        {
          label: `Recording Interval: ${recordingConfig.intervalMs / 1000}s`,
          enabled: false
        },
        { type: 'separator' },
        {
          label: 'Reload Config',
          click: () => {
            loadConfig();
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('update-recording-interval', recordingConfig.intervalMs);
            }
            createTray();
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          click: () => {
            gracefulShutdown();
          }
        }
      ]);
      tray.setContextMenu(contextMenu);
    }

    return { success: true, filename };
  } catch (error) {
    console.error('Error saving audio:', error);
    return { success: false, error: error.message };
  }
});

// 最終保存完了の通知を受信
ipcMain.on('final-save-completed', () => {
  console.log('Final save completed, exiting...');
  if (isCleaningUp) {
    setTimeout(() => {
      app.exit(0);
    }, 500);
  }
});

// 録音状態の更新を受信
ipcMain.on('update-recording-status', (event, status) => {
  if (tray && !isCleaningUp) {
    tray.setToolTip(`Kotonari - ${status}`);
  }
});
>>>>>>> 0c12d86 (first commit from Mac)
