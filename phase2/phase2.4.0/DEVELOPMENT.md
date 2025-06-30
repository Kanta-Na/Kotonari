
# Kotonari v2.4.0 開発手順

## 📱 開発環境
- MacOS
- Python 3.8以上
- Cursor IDE

## 🚀 セットアップ手順

### 1. Cursorでプロジェクトを開く

```bash
# ターミナルで
cd ~/path/to/kotonari_2.4.0
cursor .
```

### 2. ファイル作成（Cursor内で）

以下のファイルを作成してください：

1. `requirements.txt`
2. `main.py`
3. `task_extractor.py`
4. `line_notifier.py`
5. `test_notification.py`

各ファイルの内容は上記のコードをコピー＆ペーストしてください。

### 3. ターミナルでの実行（Cursor内のターミナルを使用）

```bash
# 仮想環境の作成と有効化
python3 -m venv venv
source venv/bin/activate

# 依存関係のインストール
pip install -r requirements.txt

# textフォルダの作成
mkdir -p text
```

### 4. 環境変数の確認

`.env`ファイルが以下の変数を含んでいることを確認：

```env
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_access_token
LINE_TARGET_USER_ID=your_user_id
```

### 5. 動作テスト

#### a. LINE接続テスト
```bash
python test_notification.py line
```

#### b. タスク抽出テスト
```bash
python test_notification.py extract
```

#### c. 統合テスト
```bash
python test_notification.py full
```

#### d. ファイル監視テスト
```bash
# 別のターミナルでメインプログラムを起動
python main.py

# 最初のターミナルでテストファイルを作成
python test_notification.py file
```

### 6. メインプログラムの実行

```bash
# バックグラウンドで実行
python main.py

# または、ログを見ながら実行
python main.py | tee kotonari.log
```

## 📝 使い方

1. **プログラムを起動**
   ```bash
   python main.py
   ```

2. **textフォルダに.txtファイルを追加**
   - ファイルをコピー
   - 新規作成
   - 他のプログラムから出力

3. **LINEで通知を確認**
   - ToDoリストが先に表示される
   - その後、元のテキスト全文が表示される

## 🐛 トラブルシューティング

### モデルのダウンロードが遅い
初回実行時は約280MBのモデルをダウンロードします。
```bash
# キャッシュ場所の確認
ls -la ~/.cache/huggingface/hub/
```

### LINE通知が届かない
1. `.env`の設定を確認
2. LINE Developersコンソールでアクセストークンを再発行
3. ユーザーIDが正しいか確認

### ファイルが検出されない
1. ファイルの拡張子が`.txt`であることを確認
2. `text`フォルダ内に配置されているか確認
3. ファイルのエンコーディングがUTF-8か確認

## 🔄 プログラムの停止

```bash
# Ctrl+C で停止
^C
```

## 📊 ログの確認

```bash
# リアルタイムでログを確認
tail -f kotonari.log

# エラーのみ表示
grep ERROR kotonari.log
```

## 🎯 開発のポイント

1. **デバッグモード**
   `main.py`の冒頭で`logging.DEBUG`に変更すると詳細ログが出力されます

2. **軽量版への切り替え**
   `task_extractor.py`の`extract_tasks_lightweight`メソッドを使用

3. **処理済みファイルのリセット**
   プログラムを再起動すると、処理済みファイルの記録がリセットされます

---

準備ができたら、`python main.py`で起動してください！
