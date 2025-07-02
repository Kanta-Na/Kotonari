# KotoLab01 自動文字起こしシステム

KotoLab01で録音されたWAVファイルを自動的に検出し、OpenAI Whisperを使用して文字起こしを行うシステムです。

## 機能

- KotoLab01のrecordingフォルダを監視
- 新しいWAVファイルを自動検出
- Whisperによる高精度な日本語文字起こし
- タイムスタンプ付きセグメント情報の保存
- M4 Pro MacBook Proに最適化

## システム構成

```
Phase2.5.0/                    # プロジェクトルートディレクトリ
├── KotoLab01/
│   └── recording/          # WAVファイル保存場所（監視対象）
├── kotonari_transcripts/
│   └── text/              # 文字起こし結果の保存場所
└── whisper_transcriber/
    ├── transcriber.py      # メインスクリプト
    ├── requirements.txt    # Python依存関係
    ├── setup.sh           # セットアップスクリプト
    ├── run.sh             # 実行スクリプト
    ├── .env.template      # 環境変数テンプレート
    ├── .env              # 環境変数（.gitignore対象）
    ├── .gitignore        # Git除外設定
    └── logs/             # ログファイル
```

## セットアップ

1. **必要なファイルを配置**
   ```bash
   # プロジェクトディレクトリに移動
   cd path/to/phase2.5.0/
   mkdir whisper_transcriber
   cd whisper_transcriber
   ```

2. **ffmpegのインストール**（まだの場合）
   ```bash
   brew install ffmpeg
   ```

3. **セットアップスクリプトの実行**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

## 使用方法

### 初回起動時の注意

初回起動時は、Whisperモデルのダウンロードが行われます（約140MB〜1.5GB）。
インターネット接続が必要です。

### 基本的な使い方

1. **KotoLab01を起動**
   ```bash
   cd ../KotoLab01
   npm start
   ```

2. **別のターミナルで文字起こしシステムを起動**
   ```bash
   cd path/to/whisper_transcriber
   ./run.sh
   ```

3. **KotoLab01で録音を開始**
   - ブラウザで録音を行うと、自動的に文字起こしが実行されます

### 手動実行

```bash
cd path/to/whisper_transcriber
source venv/bin/activate
python transcriber.py
```

## 出力ファイル

録音ファイル: `recording_20240115_143052.wav`

に対して、以下のファイルが生成されます：

- `kotonari_transcripts/text/recording_20240115_143052.txt` - 文字起こし結果
- `kotonari_transcripts/text/recording_20240115_143052_segments.txt` - タイムスタンプ付きセグメント

## 設定のカスタマイズ

`.env`ファイルを編集して、以下の設定を変更できます：

```bash
# Whisperモデルサイズ: tiny, base, small, medium, large
WHISPER_MODEL_SIZE=base

# 言語設定: ja（日本語）, en（英語）など
WHISPER_LANGUAGE=ja

# 既存ファイルの処理: true/false
PROCESS_EXISTING_FILES=false

# セグメント情報の保存: true/false
SAVE_SEGMENTS=true
```

M4 Pro MacBook Proでは`base`または`small`モデルを推奨します。

## トラブルシューティング

### ffmpegエラー
```bash
brew install ffmpeg
```

### メモリ不足エラー
`.env`ファイルでより小さいモデル（`tiny`）を使用：
```bash
WHISPER_MODEL_SIZE=tiny
```

### ファイルが検出されない
- KotoLab01のrecordingフォルダのパスを確認
- ファイル権限を確認

## パフォーマンス

M4 Pro MacBook Proでの目安：
- tinyモデル: 1分の音声を約5秒で処理
- baseモデル: 1分の音声を約10秒で処理
- smallモデル: 1分の音声を約20秒で処理

## ログ

ログファイルは`logs/`ディレクトリに保存されます：
- `transcriber_YYYYMMDD_HHMMSS.log`

## 停止方法

`Ctrl + C`でプログラムを終了できます。

## GitHubでの管理

このプロジェクトはGitHubで管理可能です。`.gitignore`により以下が除外されます：

- `.env`（個人設定）
- `venv/`（Python仮想環境）
- `logs/`（ログファイル）
- `.processed_files.json`（処理済みファイルリスト）

初回のGit設定：
```bash
git init
git add .
git commit -m "Initial commit: KotoLab01 transcriber"
```

**重要**: `.env`ファイルは絶対にGitHubにアップロードしないでください。
個人のパス情報が含まれています。`.env.template`を参考に各自で作成してください。
