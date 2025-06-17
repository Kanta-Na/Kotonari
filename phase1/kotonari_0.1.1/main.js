<<<<<<< HEAD

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// GPUアクセラレーションを無効化
app.disableHardwareAcceleration();

// または、より詳細な制御が必要な場合は以下のコマンドラインスイッチを使用
// app.commandLine.appendSwitch('disable-gpu');
// app.commandLine.appendSwitch('disable-software-rasterizer');
// app.commandLine.appendSwitch('disable-gpu-sandbox');

let mainWindow;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // 追加のGPU関連設定
      webgl: false,
      experimentalFeatures: false
    }
  });

  mainWindow.loadFile('public/index.html');
  
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
  tray.setToolTip('Kotonari - 音声録音アプリ');
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'ウィンドウを表示',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '録音開始',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('start-recording-from-tray');
        }
      }
    },
    {
      label: '録音停止',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('stop-recording-from-tray');
        }
      }
    },
    { type: 'separator' },
    {
      label: '終了',
      click: () => {
        isQuitting = true;
        app.quit();
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

app.on('ready', () => {
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

app.on('before-quit', () => {
  isQuitting = true;
  if (tray) {
    tray.destroy();
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

    if (tray && process.platform !== 'darwin') {
      tray.displayBalloon({
        title: 'Kotonari',
        content: `録音を保存しました: ${filename}`,
        iconType: 'info'
      });
    }

    return { success: true, filename };
  } catch (error) {
    console.error('Error saving audio:', error);
    return { success: false, error: error.message };
  }
});
=======

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// GPUアクセラレーションを無効化
app.disableHardwareAcceleration();

// または、より詳細な制御が必要な場合は以下のコマンドラインスイッチを使用
// app.commandLine.appendSwitch('disable-gpu');
// app.commandLine.appendSwitch('disable-software-rasterizer');
// app.commandLine.appendSwitch('disable-gpu-sandbox');

let mainWindow;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // 追加のGPU関連設定
      webgl: false,
      experimentalFeatures: false
    }
  });

  mainWindow.loadFile('public/index.html');
  
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
  tray.setToolTip('Kotonari - 音声録音アプリ');
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'ウィンドウを表示',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '録音開始',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('start-recording-from-tray');
        }
      }
    },
    {
      label: '録音停止',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('stop-recording-from-tray');
        }
      }
    },
    { type: 'separator' },
    {
      label: '終了',
      click: () => {
        isQuitting = true;
        app.quit();
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

app.on('ready', () => {
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

app.on('before-quit', () => {
  isQuitting = true;
  if (tray) {
    tray.destroy();
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

    if (tray && process.platform !== 'darwin') {
      tray.displayBalloon({
        title: 'Kotonari',
        content: `録音を保存しました: ${filename}`,
        iconType: 'info'
      });
    }

    return { success: true, filename };
  } catch (error) {
    console.error('Error saving audio:', error);
    return { success: false, error: error.message };
  }
});
>>>>>>> 0c12d86 (first commit from Mac)
