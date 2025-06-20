<<<<<<< HEAD

# Kotonari Phase1-1 開発記録（音声録音アプリ・最小構成）

---

## ① 目的・実装機能（要件定義）

### 🎯 目的

「Kotonari」はユーザーが自然な形で発する独り言を録音・保存する音声AIエージェントを目指したプロジェクトである。Phase1-1では、その最小構成のデモアプリを構築することを目的とした。

### 🛠 実装機能（MVP）

| 機能カテゴリ | 内容 |
|--------------|------|
| 🎙️ 録音開始 | アプリを起動し、録音ボタンを押すとマイクが有効になり音声録音開始 |
| ⏹️ 録音停止 | 録音停止ボタンを押すと録音が終了し、ローカルフォルダに `.wav` ファイルで保存 |
| 💾 音声保存 | 保存ファイル名は `recording-YYYY-MM-DD_HH-MM-SS.wav` の形式で `audio/` フォルダに格納 |
| 🧠 UX配慮 | 録音が1秒未満の場合は保存をスキップし、無音ファイルを除去 |

---

## ② データの流れとフォルダ構造（アーキテクチャ設計）

### 🔄 データフロー

```shell
[ユーザー操作]
↓
[マイク入力（MediaRecorder）]
↓
[Blob → ArrayBuffer に変換]
↓
[window.electronAPI.saveAudioFile()]
↓
[preload.js → ipcRenderer → main.js]
↓
[ファイル保存（.wav） → audio/ ディレクトリ]
```

### 📁 フォルダ構成と役割

```shell
kotonari-audio/
├── public/ # index.html（Reactのエントリポイント）
├── src/ # Reactコード（App.jsx / index.jsx）
├── recorder/ # 音声保存処理のモジュール（任意）
├── audio/ # 保存された音声ファイル
├── main.js # Electronメインプロセス（ウィンドウ + 保存処理）
├── preload.js # Rendererとの安全な橋渡し
├── .babelrc # Babel構成（JSX→JS変換）
├── webpack.config.js # Webpack構成（Reactビルド）
├── package.json # 依存管理・スクリプト
└── .gitignore # Git管理から除外するファイル一覧
```

---

## ③ 使用した技術一覧（プログラミング言語・ライブラリ）

### 💻 言語

- JavaScript（React, Node.js, Electron）

### 📦 使用ライブラリ・パッケージ

| 区分             | パッケージ名 |
|------------------|--------------|
| Electron アプリ   | electron |
| フロントエンド    | react, react-dom |
| 音声保存          | wav-encoder |
| バンドル          | webpack, webpack-cli, webpack-dev-server, html-webpack-plugin |
| JSX変換           | @babel/core, @babel/preset-env, @babel/preset-react, babel-loader |
| 並行処理/環境変数 | concurrently, cross-env |

---

## ④ ユーザーの使い方（起動手順）

### React アプリのビルド

```bash
# Webpack でビルド（bundle.jsが生成される）
npm run build
```

### アプリ起動

```bash
# Electronアプリを起動
npm start

# または、ビルドと起動を同時に行う場合
npm rum electron
```

### 👤 エンドユーザー体験

| 操作	| アクション |
|-------------|-------------------|
| アプリ起動	| 録音UIが表示される |
| 🎙️ 録音開始	| マイクがONになり音声をキャプチャ |
| ⏹️ 録音停止	| 録音が終了し、ローカルに保存される |
| ファイル確認	| audio/ フォルダ内に .wav ファイル |

### 🔚 備考

- 本バージョンでは LLM・音声認識（Whisper等）は未実装
- 今回の構成はローカル完結を前提としており、セキュリティとオフライン環境も考慮
- クロスプラットフォーム（Windows/Mac）に対応

=======

# Kotonari Phase1-1 開発記録（音声録音アプリ・最小構成）

---

## ① 目的・実装機能（要件定義）

### 🎯 目的

「Kotonari」はユーザーが自然な形で発する独り言を録音・保存する音声AIエージェントを目指したプロジェクトである。Phase1-1では、その最小構成のデモアプリを構築することを目的とした。

### 🛠 実装機能（MVP）

| 機能カテゴリ | 内容 |
|--------------|------|
| 🎙️ 録音開始 | アプリを起動し、録音ボタンを押すとマイクが有効になり音声録音開始 |
| ⏹️ 録音停止 | 録音停止ボタンを押すと録音が終了し、ローカルフォルダに `.wav` ファイルで保存 |
| 💾 音声保存 | 保存ファイル名は `recording-YYYY-MM-DD_HH-MM-SS.wav` の形式で `audio/` フォルダに格納 |
| 🧠 UX配慮 | 録音が1秒未満の場合は保存をスキップし、無音ファイルを除去 |

---

## ② データの流れとフォルダ構造（アーキテクチャ設計）

### 🔄 データフロー

```shell
[ユーザー操作]
↓
[マイク入力（MediaRecorder）]
↓
[Blob → ArrayBuffer に変換]
↓
[window.electronAPI.saveAudioFile()]
↓
[preload.js → ipcRenderer → main.js]
↓
[ファイル保存（.wav） → audio/ ディレクトリ]
```

### 📁 フォルダ構成と役割

```shell
kotonari-audio/
├── public/ # index.html（Reactのエントリポイント）
├── src/ # Reactコード（App.jsx / index.jsx）
├── recorder/ # 音声保存処理のモジュール（任意）
├── audio/ # 保存された音声ファイル
├── main.js # Electronメインプロセス（ウィンドウ + 保存処理）
├── preload.js # Rendererとの安全な橋渡し
├── .babelrc # Babel構成（JSX→JS変換）
├── webpack.config.js # Webpack構成（Reactビルド）
├── package.json # 依存管理・スクリプト
└── .gitignore # Git管理から除外するファイル一覧
```

---

## ③ 使用した技術一覧（プログラミング言語・ライブラリ）

### 💻 言語

- JavaScript（React, Node.js, Electron）

### 📦 使用ライブラリ・パッケージ

| 区分             | パッケージ名 |
|------------------|--------------|
| Electron アプリ   | electron |
| フロントエンド    | react, react-dom |
| 音声保存          | wav-encoder |
| バンドル          | webpack, webpack-cli, webpack-dev-server, html-webpack-plugin |
| JSX変換           | @babel/core, @babel/preset-env, @babel/preset-react, babel-loader |
| 並行処理/環境変数 | concurrently, cross-env |

---

## ④ ユーザーの使い方（起動手順）

### React アプリのビルド

```bash
# Webpack でビルド（bundle.jsが生成される）
npm run build
```

### アプリ起動

```bash
# Electronアプリを起動
npm start

# または、ビルドと起動を同時に行う場合
npm rum electron
```

### 👤 エンドユーザー体験

| 操作	| アクション |
|-------------|-------------------|
| アプリ起動	| 録音UIが表示される |
| 🎙️ 録音開始	| マイクがONになり音声をキャプチャ |
| ⏹️ 録音停止	| 録音が終了し、ローカルに保存される |
| ファイル確認	| audio/ フォルダ内に .wav ファイル |

### 🔚 備考

- 本バージョンでは LLM・音声認識（Whisper等）は未実装
- 今回の構成はローカル完結を前提としており、セキュリティとオフライン環境も考慮
- クロスプラットフォーム（Windows/Mac）に対応

>>>>>>> 0c12d86 (first commit from Mac)
