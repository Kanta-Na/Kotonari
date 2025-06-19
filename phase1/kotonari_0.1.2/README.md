
# 🧠 Kotonari Phase1-3 開発記録（自動チャンク録音・設定可能版）

---

## ① 目的・実装機能（要件定義）

### 🎯 目的

「Kotonari」は、ユーザーが自然に発する独り言を録音・保存し、その音声をもとに知的支援を行う**常駐型AIエージェント**である。
Phase1-3 では、**完全自動化された録音体験**を実現し、**ユーザーが一切の操作をせずに音声が記録される**ことを目的とする。

---

### 🛠 実装機能（MVP）

| 機能カテゴリ | 内容 |
|------------|------|
| 🆕 自動チャンク録音 | アプリ起動と同時に録音開始、指定時間ごとに自動でWAVファイル保存 |
| 🆕 可変録音間隔 | `recording-config.json`で録音間隔をミリ秒単位で設定可能 |
| 🆕 動的設定反映 | トレイメニューから設定を再読み込みし、録音間隔を即座に変更 |
| 🆕 確実な最終保存 | アプリ終了時、録音途中でも最後のチャンクを確実に保存 |
| 🎙️ Tray常駐 | タスクバー/メニューバーに常駐、UIは最小限 |
| 💾 音声保存 | `audio/` フォルダに `.wav` として自動保存（ファイル名：ローカルタイムスタンプ） |

---

## ② データの流れとフォルダ構造（アーキテクチャ設計）

### 🔄 データフロー

```shell
[アプリ起動]
↓
[recording-config.json読み込み]
↓
[MediaRecorder.start(intervalMs)で自動録音開始]
↓（指定時間経過）
[ondataavailableイベント発火]
↓
[Blob → ArrayBuffer → WAVファイル保存]
↓（ループ継続）
[アプリ終了時: 最後のチャンク保存]
```

---

### 📁 フォルダ構成と役割

```shell
kotonari-audio/
├── public/                # index.html（Reactのエントリポイント）
├── src/                   # Reactコード（App.jsx / index.jsx）
├── audio/                 # 保存された音声ファイル
├── assets/                # トレイアイコン用の .png/.ico ファイル
├── main.js                # Electronメインプロセス（Tray + 自動録音制御）
├── preload.js             # Rendererとの橋渡し（contextBridge）
├── recording-config.json  # 🆕 録音間隔設定ファイル
├── .babelrc               # Babel構成（JSX→JS変換）
├── webpack.config.js      # Webpack構成（Reactビルド）
├── package.json           # 依存管理・スクリプト
└── .gitignore             # Git管理から除外するファイル一覧
```

---

## ③ 使用した技術一覧（プログラミング言語・ライブラリ）

### 💻 使用言語

* JavaScript（React, Node.js, Electron）

### 📦 使用ライブラリ・パッケージ

| 区分 | パッケージ名 |
|------|------------|
| Electron アプリ | electron |
| フロントエンド | react, react-dom |
| 音声保存 | wav-encoder |
| バンドル | webpack, webpack-cli, webpack-dev-server, html-webpack-plugin |
| JSX変換 | @babel/core, @babel/preset-env, @babel/preset-react, babel-loader |
| 並行処理/環境変数 | concurrently, cross-env |
| 最適化 | `app.disableHardwareAcceleration()` でGPU無効化 |

### 🔧 主要技術機能

| 技術 | 用途 |
|------|------|
| MediaRecorder API | timeslice機能で指定間隔での自動録音 |
| Electron Tray API | システムトレイ常駐 |
| IPC通信 | メイン/レンダラー間の録音制御 |
| ファイルシステムAPI | 設定ファイル読み込み・音声保存 |

---

## ④ ユーザーの使い方（起動手順）

### 🔧 初期セットアップ

1. **環境構築**
  ```bash
  npm install
  ```

2. **React アプリのビルド**
   ```bash
   npm run build
   ```

3. **録音間隔の設定**
   `recording-config.json` を編集（ミリ秒単位）：
   ```json
   {
     "intervalMs": 300000
   }
   ```

### 🚀 アプリ起動

```bash
npm start
```

* 起動と同時に自動で録音が開始されます
* タスクバー/メニューバーにアイコンが表示されます
* 設定した間隔で自動的にWAVファイルが保存されます

---

### 👤 エンドユーザー体験（Phase1-3）

| 状態 | 動作 |
|------|------|
| アプリ起動時 | 自動的に録音開始（ユーザー操作不要） |
| 録音中 | 設定時間ごとに自動でファイル保存 |
| 設定変更時 | トレイメニューから「設定を再読み込み」で即座に反映 |
| ウィンドウ操作 | トレイアイコンクリックで表示/非表示切り替え |
| アプリ終了時 | 最後の録音チャンクも確実に保存 |

### 📊 録音間隔の設定例

| 用途 | intervalMs値 | 実時間 |
|------|-------------|---------|
| テスト用 | 60000 | 1分 |
| 短時間記録 | 180000 | 3分 |
| **標準（デフォルト）** | **300000** | **5分** |
| 長時間記録 | 600000 | 10分 |
| 会議記録 | 1800000 | 30分 |

---

## ⚙️ 設定ファイル詳細

### recording-config.json

* **場所**: プロジェクトルート（main.jsと同じ階層）
* **形式**: JSON
* **パラメータ**:
  - `intervalMs`: 録音間隔（ミリ秒単位）

**変更手順**:
1. テキストエディタで `recording-config.json` を開く
2. `intervalMs` の値を変更（例: 180000 = 3分）
3. ファイルを保存
4. トレイメニューから「設定を再読み込み」をクリック

---

## 🔚 Phase1-3 まとめ

### 達成事項
- ✅ 完全自動録音（起動即開始）
- ✅ 可変時間チャンク保存
- ✅ 設定ファイルによる柔軟な制御
- ✅ アプリ終了時の確実な保存
- ✅ トレイ常駐による非侵襲的UX

### 今後の展望（Phase2以降）
- 音声認識（Whisper）統合
- LLMによる知的支援
- 音声データの自動整理・分類
- クラウド同期機能
- マルチデバイス対応

---
