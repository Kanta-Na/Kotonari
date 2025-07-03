# KotoLab 統合システム

音声入力からLINE通知まで、全てのサービスを一つのコマンドで起動できる統合システムです。

## 🚀 クイックスタート

### 1. 初回セットアップ（一度だけ実行）

```bash
# 全サービスを一括セットアップ
chmod +x setup-all.sh
./setup-all.sh
```

### 2. LINE認証情報の設定

`kotonari_transcripts/.env` ファイルを作成し、LINE認証情報を設定：

```env
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_access_token
LINE_TARGET_USER_ID=your_user_id
```

### 3. システム起動

以下のいずれかの方法で起動できます：

#### 方法1: シェルスクリプト（推奨）
```bash
chmod +x start.sh
./start.sh
```

#### 方法2: Pythonスクリプト
```bash
python launcher.py
```

#### 方法3: PM2（プロセス管理）
```bash
# PM2をインストール済みの場合
pm2 start ecosystem.config.js

# ログを見る
pm2 logs

# 停止
pm2 stop all
```

## 📁 ディレクトリ構造

```
kotonari/phase_2.5.0/
├── KotoLab01/              # 音声録音UI
├── whisper_transcriber/    # 音声文字起こし
├── kotonari_transcripts/   # タスク抽出＆LINE通知
├── launcher.py            # Python統合起動スクリプト
├── start.sh              # シェル統合起動スクリプト
├── setup-all.sh          # 一括セットアップ
├── ecosystem.config.js   # PM2設定
└── logs/                 # 統合ログディレクトリ
```

## 🔧 システムフロー

1. **KotoLab01** - ブラウザベースの音声録音UI
   - http://localhost:5173 でアクセス
   - 録音ファイルを `KotoLab01/recording/` に保存

2. **Whisper Transcriber** - 音声ファイルを監視して文字起こし
   - 新しいWAVファイルを自動検出
   - OpenAI Whisperで文字起こし
   - 結果を `kotonari_transcripts/text/` に保存

3. **Kotonari Transcripts** - テキストファイルを監視してタスク抽出
   - 新しいテキストファイルを自動検出
   - NLIモデルでタスクを抽出
   - LINEに通知を送信

## 🛠️ トラブルシューティング

### ポートが使用中の場合
```bash
# KotoLab01のポート（5173）を使用しているプロセスを確認
lsof -i :5173

# プロセスを終了
kill -9 <PID>
```

### サービスが起動しない場合

1. 個別に起動してエラーを確認：
```bash
# KotoLab01
cd KotoLab01 && npm start

# Whisper Transcriber
cd whisper_transcriber && source venv/bin/activate && python transcriber.py

# Kotonari Transcripts
cd kotonari_transcripts && source venv/bin/activate && python main.py
```

2. ログを確認：
```bash
# PM2を使用している場合
pm2 logs

# 通常のログファイル
tail -f logs/*.log
```

### メモリ不足の場合

Whisperのモデルサイズを調整：
```bash
# whisper_transcriber/.env
WHISPER_MODEL_SIZE=tiny  # tiny, base, small, medium, large
```

## 📊 パフォーマンス最適化

### 推奨設定（M4 Pro MacBook Pro）

- Whisperモデル: `base` または `small`
- 同時処理ファイル数: 1-2個
- メモリ使用量: 約2-4GB

### 起動順序の最適化

システムは以下の順序で起動します：
1. KotoLab01（5秒待機）
2. Whisper Transcriber（3秒待機）
3. Kotonari Transcripts

この順序により、依存関係が正しく解決されます。

## 🔄 システムの停止

- **シェルスクリプト/Pythonスクリプト**: `Ctrl+C`
- **PM2**: `pm2 stop all`

## 📝 ログファイル

- 統合ログ: `logs/` ディレクトリ
- 各サービスの個別ログ:
  - KotoLab01: `logs/kotolab01-*.log`
  - Whisper: `logs/whisper-*.log`
  - Kotonari: `logs/kotonari-*.log`

## 🚦 ステータス確認

PM2を使用している場合：
```bash
# プロセスの状態を確認
pm2 status

# CPU/メモリ使用状況をモニタリング
pm2 monit
```

## 🔧 カスタマイズ

### ポート変更
`ecosystem.config.js` または各サービスの設定ファイルで変更可能

### 自動起動設定
```bash
# システム起動時に自動実行（PM2）
pm2 startup
pm2 save
```

## 📚 詳細ドキュメント

各コンポーネントの詳細は以下を参照：
- [KotoLab01 README](./KotoLab01/README.md)
- [Whisper Transcriber README](./whisper_transcriber/README.md)
- [Kotonari Transcripts DEVELOPMENT](./kotonari_transcripts/DEVELOPMENT.md)