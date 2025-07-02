# KotoLab01 文字起こしシステム - クイックスタート

## 1. 前提条件の確認

```bash
# Python 3.8以上が必要
python3 --version

# ffmpegが必要（インストールされていない場合）
# macOS
brew install ffmpeg
# Ubuntu/Debian
sudo apt-get install ffmpeg
```

## 2. セットアップ（初回のみ）

```bash
# whisper_transcriberディレクトリに移動
cd path/to/whisper_transcriber

# セットアップスクリプトの実行
chmod +x setup.sh
./setup.sh
```

セットアップスクリプトは自動的に：
- Python仮想環境を作成
- 必要なパッケージをインストール
- 現在のディレクトリ構造に基づいて.envファイルを生成

## 3. 環境設定の確認

`.env`ファイルが自動作成されています。パスが正しいか確認：

```bash
# 確認
cat .env

# 編集（必要な場合）
nano .env  # または好きなエディタで
```

## 4. 起動

**ターミナル1:**
```bash
cd path/to/KotoLab01
npm start
```

**ターミナル2:**
```bash
cd path/to/whisper_transcriber
./run.sh
```

## 5. 使用

1. ブラウザで http://localhost:5173 にアクセス
2. 録音を開始
3. 自動的に文字起こしが実行される
4. 結果は `../kotonari_transcripts/text/` に保存

## 6. 終了

ターミナル2で `Ctrl+C` を押して文字起こしシステムを終了

## ディレクトリ構造の確認

想定するディレクトリ構造：
```
your_project/
├── KotoLab01/
│   └── recording/
├── kotonari_transcripts/
│   └── text/
└── whisper_transcriber/
    └── (このシステム)
```

## トラブルシューティング

- **Whisperのインストールエラー**: `pip install --upgrade pip` を実行後、再度セットアップ
- **メモリ不足**: `.env`で`WHISPER_MODEL_SIZE=tiny`に変更
- **パスエラー**: `.env`ファイルのパスが正しいか確認