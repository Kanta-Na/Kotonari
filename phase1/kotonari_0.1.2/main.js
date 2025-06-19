
// 5分チャンク自動録音機能 追加
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

// 設定ファイル(recording-config.json)を読み込む関数
function loadConfig() {

  // path.join()：Node.js の標準ライブラリ。OSに依存せずに正しいファイルパスを作ってくれる。
  // __dirname：Node.jsの特殊変数。現在のファイルが存在するディレクトリのパス
  const configPath = path.join(__dirname, 'recording-config.json');

  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      recordingConfig = JSON.parse(configData);
      console.log('recording-config.json ファイルを読み込みます・・・:', recordingConfig);
    } else {
      // 設定ファイルが存在しない場合は作成
      fs.writeFileSync(configPath, JSON.stringify(recordingConfig, null, 2));
      console.log('recording-config.json ファイルを作成します。');
    }
  } catch (error) {
    console.error('※ recording-config.json ファイルを読み込む際にエラーが発生致しました。:', error);
  }
};

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

// 「タスクトレイ（通知領域）アイコン」機能の定義
function createTray() {

  // アイコンの画像設定
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
  

  // コンテキストメニュー（右クリックメニュー）の定義
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
      label: `${recordingConfig.intervalMs / 1000}秒（ ${recordingConfig.intervalMs / 60000}分 ）ごとに録音中…`,
      enabled: false        // <-- クリック不可のラベルに設定している！
    },
    { type: 'separator' },
    {
      label: '録音間隔を更新',
      click: () => {
        loadConfig();       // <-- recording-config.json を直接読み込む関数（上で定義した。）
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('録音間隔が更新されました！', recordingConfig.intervalMs);
        }
        createTray(); // トレイメニューを更新
      }
    },
    { type: 'separator' },
    {
      label: '終了',
      click: () => {
        gracefulShutdown();     // <- 安全で段階的なシャットダウンを行う定義をした関数（下で関数定義）
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
  
  // アイコン クリック時のウィンドウ表示
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

// グレースフルシャットダウン関数（gracefulShutdown()）
/* 録音中や保存中にいきなりアプリを終了すると「音声ファイルが壊れる」「保存されない」などの事故が起きる。
   それを防ぐために、録音を止めて保存を終えてから、安全にアプリを終了する処理をまとめることが大切である。 */
/* async を付けることで、関数ないで await を使って非同期処理（=待ち時間）を扱えるようにしている。 */
async function gracefulShutdown() {
  if (isCleaningUp) return;       // <- すでに gracefulShutdown() が走っていたら、2回実行しないようにブロックする。
  
  console.log('Starting graceful shutdown... / アプリを停止します...');
  isCleaningUp = true;
  isQuitting = true;
  
  // Rendererプロセスに録音停止を通知
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('stop-recording-before-quit');
    
    // 録音停止と保存が完了するまで(3秒)待つ
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // トレイをクリーンアップ（トレイを破棄）
  if (tray) {
    tray.destroy();
  }
  
  // アプリを強制終了（コード0は正常終了）
  app.exit(0);
}


// プロセスシグナルのハンドリング
/* ユーザーが Ctrl+C や kill コマンドなどでアプリを強制終了しようとした時に、
   「gracefulShutdown() を発動させて、安全に録音を終了・保存させる」ためのコードである。  */
process.on('SIGINT', async () => {        // <-- SIGINT: ユーザーが Ctrl+C を押した時にプロセスに送られる「割り込みシグナル」
  console.log('Received SIGINT');
  await gracefulShutdown();
});

process.on('SIGTERM', async () => {       // <-- SIGTERM: ターミナルや他のプロセスから kill コマンドで終了指示が来た時のシグナル
  console.log('Received SIGTERM');
  await gracefulShutdown();
});

// Windowsの場合のCtrl+C対応  <-- SIGINT が通常通り受け取れない場合の処置
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
      const contextMenu = Menu.buildFromTemplate([      // <-- コンテキストメニュー（右クリック）
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
          label: `保存した最新ファイル名: ${filename}`,
          enabled: false
        },
        {
          label: `${recordingConfig.intervalMs / 1000}秒（ ${recordingConfig.intervalMs / 60000}分 ）ごとに録音中…`,
          enabled: false
        },
        { type: 'separator' },
        {
          label: '録音間隔を更新',
          click: () => {
            loadConfig();
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('録音間隔が更新されました！', recordingConfig.intervalMs);
            }
            createTray();
          }
        },
        { type: 'separator' },
        {
          label: '終了',
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
  console.log('最終保存が完了しました。アプリを終了します...');
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
