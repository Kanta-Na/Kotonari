
// Tray 常駐化
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

/* createWindow()関数 ==> Electronアプリにおけるウィンドウ生成と初期イベント処理を担当する中心的な関数。
　 主な機能：１．ウィンドウの作成　　　　　　-> new BrowserWindow({…})
           ２．自動録音の開始
           ３．ウィンドウイベントの処理
           */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,          // <- 起動時はウィンドウを表示しない。
    webPreferences: {             // <- 「どのようにWeb(HTML/JS)を動かすか」を細かく指定。
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,     // <- セキュリティ強化
      nodeIntegration: false,     // <- セキュリティ強化
      // 追加のGPU関連設定
      webgl: false,
      experimentalFeatures: false
    }
  });

  // mainwindow.loadFile()関数 ==> ウィンドウに表示するHTMLファイルを指定。
  mainWindow.loadFile('public/index.html');
  
  // ユーザーがウィンドウを「×」で閉じようとした時の動作を定義
  // この仕組みで、アプリをトレイに常駐化出来るようになる！
  mainWindow.on('close', (event) => {
    // isQuitting ==>「本当に終了する場合のこと。」
    if (!isQuitting) {
      event.preventDefault();     // <-- Electron のデフォルトの「閉じる」動作をキャンセル
      mainWindow.hide();          // <-- ウィンドウを非表示にするだけ（終了はしない）
      return false;
    }
  });
  
  // 'closed' --- ウィンドウが完全に閉じられたとき。
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}


/* Electronアプリに、常駐型の「タスクトレイ（通知領域）アイコン」機能を追加する関数を定義する。
　createTray() の処理構成
　├─ OSに応じたアイコン読み込み
　├─ Trayインスタンスを生成
　├─ ツールチップとメニューを設定
　│   ├─ ウィンドウ表示
　│   ├─ 録音開始 / 停止（イベント送信）
　│   └─ アプリ終了
　└─ アイコンクリックで表示/非表示トグル
　*/
function createTray() {

  // アイコンの読み込み
  // 三項演算子（if 文を一行で書ける構文）==> 条件式 ? 真の場合の値 : 偽の場合の値　 
  const iconPath = process.platform === 'win32' 
    ? path.join(__dirname, 'assets', 'icon.ico')
    : path.join(__dirname, 'assets', 'icon.png');
  
  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    trayIcon = nativeImage.createEmpty();       // <-- アイコン用画像が無ければ、代わりに空のアイコン(透明)を使う。
  }
  
  // トレイアイコンの生成
  tray = new Tray(trayIcon);                       // <-- トレイアイコンの画像を設定
  tray.setToolTip('Kotonari - 音声録音アプリ');     // <-- トレイアイコンにマウスを合わせたときに表示される説明文（ツールチップ）を設定
  
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
      label: '録音開始',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('start-recording-from-tray');     // <-- フロントエンドに'start-recording-from-tray'イベントを送信
        }
      }
    },
    {
      label: '録音停止',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('stop-recording-from-tray');      // <-- フロントエンドに'stop-recoding-from-tray'イベントを送信
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
  
  tray.setContextMenu(contextMenu);     // <-- 上記で定義したコンテキストメニューをトレイアイコンに関連付け。右クリックで表示されるようになる。
  
  // アイコン クリック時の表示
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {     // <- ウィンドウが表示されていれば、
        mainWindow.hide();              // <- 非表示に！
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}


/* Electron アプリのライフサイクル管理に関するもので、
   アプリ起動・終了時の挙動をコントロールしている。 */
app.on('ready', () => {
  createWindow();
  createTray();
});

if (process.platform === 'darwin') {
  app.dock.hide();          // <-- macOS の Dock 表示を抑制（常駐間を出す）
}

app.on('window-all-closed', () => {       // <-- 全てのウィンドウが閉じられた時の挙動を定義
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
});

app.on('activate', () => {          // <-- アプリが Dock やアイコンから再アクティブ化された時の処理
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {       // <-- アプリ終了前に録音を安全に止める処理を差し込む
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


// フロント側から送られてきた録音データを、Node.js 側で .wav ファイルとして保存し、必要なら通知を出す。
/* ipcMain.handle(): Rendererプロセスから非同期リクエスト(invoke)を受け取るための関数
   'save-audio' という名前のチャネルで待機
   audioBuffer はフロント側から送られてきた音声データ（ArrayBuffer や Uint8Array）   */
ipcMain.handle('save-audio', async (event, audioBuffer) => {
  try {
    // 保存フォルダ 'audio' を用意
    const audioDir = path.join(__dirname, 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // タイムスタンプ付きファイル名を生成
    const timestamp = getLocalTimestamp();
    const filename = `recording-${timestamp}.wav`;
    const filepath = path.join(audioDir, filename);

    // バッファからファイルを保存
    const buffer = Buffer.from(audioBuffer);
    fs.writeFileSync(filepath, buffer);

    // Windows ならタスクトレイから通知を出す
    if (tray && process.platform !== 'darwin') {
      tray.displayBalloon({
        title: 'Kotonari',
        content: `録音を保存しました: ${filename}`,
        iconType: 'info'
      });
    }

    // 成否をフロントへ返す
    return { success: true, filename };
  } catch (error) {
    console.error('Error saving audio:', error);
    return { success: false, error: error.message };
  }
});
