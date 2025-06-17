
---

# 🧠 Kotonari Phase1-2 開発記録（Tray常駐化・バックグラウンド録音アプリ）

---

## ① 目的・実装機能（要件定義）

### 🎯 目的

「Kotonari」は、ユーザーが自然に発する独り言を録音・保存し、その音声をもとに知的支援を行う**常駐型AIエージェント**である。
Phase1-2 では、**ユーザーの視界に入らず自然に動作すること**を目指し、**タスクバー常駐（Tray化）によるバックグラウンド録音体験**の実現を目的とする。

---

### 🛠 実装機能（MVP）

| 機能カテゴリ           | 内容                                                        |
| ---------------- | --------------------------------------------------------- |
| 🆕 Tray常駐化       | アプリ起動時、タスクバー/メニューバーにアイコンとして常駐。UIは非表示状態でバックグラウンド動作         |
| 🆕 アイコンクリックでUI表示 | トレイアイコンをクリックすると録音UI（React）がポップアップ                         |
| 🎙️ 自動録音開始       | アプリ起動と同時に録音を開始（ボタン操作不要）                                   |
| 💾 音声保存          | 5秒以上の録音であれば `audio/` フォルダに `.wav` として保存（ファイル名：ISOタイムスタンプ） |
| 🧠 UX配慮          | ユーザーが録音アプリを「常に意識しない」ことを最優先とし、UIは最小限                       |

---

## ② データの流れとフォルダ構造（アーキテクチャ設計）

### 🔄 データフロー

```shell
[アプリ起動]
↓
[MediaRecorderにより録音自動開始]
↓（録音終了 or 明示停止）
[Blob → ArrayBuffer に変換]
↓
[window.electronAPI.saveAudioFile()]
↓
[preload.js → ipcRenderer → main.js]
↓
[ファイル保存（.wav） → audio/ ディレクトリ]
```

---

### 📁 フォルダ構成と役割（🆕 Tray対応あり）

```shell
kotonari-audio/
├── public/           # index.html（Reactのエントリポイント）
├── src/              # Reactコード（App.jsx / index.jsx）
├── audio/            # 保存された音声ファイル
├── assets/           # 🆕 トレイアイコン用の .png/.ico ファイル
├── main.js           # Electronメインプロセス（ウィンドウ生成 + Tray常駐 + 録音保存）
├── preload.js        # Rendererとの橋渡し（contextBridge）
├── .babelrc          # Babel構成（JSX→JS変換）
├── webpack.config.js # Webpack構成（Reactビルド）
├── package.json      # 依存管理・スクリプト
└── .gitignore        # Git管理から除外するファイル一覧
```

---

## ③ 使用した技術一覧（プログラミング言語・ライブラリ）

### 💻 使用言語

* JavaScript（React, Node.js, Electron）

### 📦 使用ライブラリ・パッケージ

| 区分           | パッケージ名                                                            |
| ------------ | ----------------------------------------------------------------- |
| Electron アプリ | electron                                                          |
| フロントエンド      | react, react-dom                                                  |
| 音声保存         | wav-encoder                                                       |
| バンドル         | webpack, webpack-cli, webpack-dev-server, html-webpack-plugin     |
| JSX変換        | @babel/core, @babel/preset-env, @babel/preset-react, babel-loader |
| 並行処理/環境変数    | concurrently, cross-env                                           |
| 🆕 Tray化     | Electron Tray API, `app.disableHardwareAcceleration()`            |

---

## ④ ユーザーの使い方（起動手順）

### 　🌏　環境構築

```bash
npm install
```

### 🔧 React アプリのビルド

```bash
npm run build
```

### 🚀 アプリ起動

```bash
npm start
```

* 起動するとタスクバー or メニューバーにアイコンが表示されます
* アイコンをクリックすると録音UIがポップアップします（最小ウィンドウ）

---

### 👤 エンドユーザー体験（Phase1-2）

| 操作                     | アクション                                  |
| ---------------------- | -------------------------------------- |
| OS起動 or `npm start` 実行 | アプリがバックグラウンドで起動、録音を開始                  |
| タスクバーアイコンをクリック         | 小さな録音UIが表示される（ON/OFF可能）                |
| UIを閉じる（×）              | アプリは終了せず、Tray に残って録音を継続                |
| `.wav` 保存              | `audio/` フォルダに録音済みファイルがタイムスタンプ形式で保存される |

---

## 🔚 備考

* LLMやWhisperなどのAI認識機能は今後の Phase1-3 以降で実装予定
* 今回の構成は「**無意識に録音が続いていること**」を主眼に設計
* Electronの `app.disableHardwareAcceleration()` を設定して、GPUエラー対策を実施済み
* クロスプラットフォーム（Windows / macOS）対応を維持

---

## ❕補足❕

アプリのアイコンを作成する際、Powershell にてコマンドを実行した。  
参考までに、そのコマンドを以下に記載しておく。

```Powershell
# assetsフォルダがなければ作成
if (!(Test-Path "assets")) {
    New-Item -ItemType Directory -Path "assets"
}

# 16x16のビットマップを作成
Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap 16, 16
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# 背景を透明にする
$graphics.Clear([System.Drawing.Color]::Transparent)

# 赤い円を描画
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Red)
$graphics.FillEllipse($brush, 2, 2, 12, 12)

# PNGとして保存
$bitmap.Save("assets\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# ICOファイルとして保存
$icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
$fs = New-Object System.IO.FileStream("assets\icon.ico", [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()

# リソースを解放
$graphics.Dispose()
$bitmap.Dispose()
$brush.Dispose()

Write-Host "アイコンファイルを生成しました: assets\icon.png, assets\icon.ico"
```
