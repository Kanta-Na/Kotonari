
# Kotonari プロジェクト - パーツ2（タスク抽出・通知システム）

## 🎯 プロジェクト概要

Kotonariプロジェクトは、音声入力からタスク管理までを自動化するシステムです。

- **パーツ1**: 音声認識（Whisper）→ テキストファイル出力
- **パーツ2**: テキストファイル → タスク抽出 → LINE/Slack通知（本実装）

本リポジトリは**パーツ2**の実装で、テキストファイルから自動的にタスク・指示を抽出し、可視化する機能を提供します。

## ✨ 主な機能

1. **自動ファイル監視**: `text/`フォルダへの新規`.txt`ファイル追加を自動検出
2. **形態素解析**: 日本語テキストを品詞ごとに色分け表示
3. **AI駆動のタスク抽出**: 
   - Transformerモデル版：高精度な文脈理解
   - 軽量版：ルールベースの高速処理
4. **タスク管理UI**: チェックボックス付きToDoリスト表示
5. **信頼度スコア表示**: 各タスクの確信度を可視化

## 🛠️ 使用技術

### コアライブラリ
- **Streamlit**: Web UI フレームワーク
- **Janome**: 日本語形態素解析器（Pure Python実装）
- **Transformers (Hugging Face)**: 最先端のNLPモデルライブラリ

### 使用モデル（Transformerモデル版）
- **mDeBERTa-v3-base-xnli-multilingual-nli-2mil7**
  - **100言語**対応の多言語Transformerモデル（日本語含む）
  - パラメータ数：約280M（mDeBERTa-v3-baseベース）
  - **273万**の仮説-前提ペアでファインチューニング済み
  - ゼロショット分類に特化（XNLIで平均80%以上の精度）
  - CPU環境でも実用的な速度で動作
  - 月間ダウンロード数：約10万回の人気モデル

## 📦 モデルの保存と読み込み

### 初回実行時の挙動

1. **モデルのダウンロード**
   ```
   HuggingFace Hub → インターネット経由でダウンロード（約700MB）
   ```

2. **保存場所**
   - デフォルト：
     - Linux/Mac: `~/.cache/huggingface/hub/`, `Macintosh HD/ユーザー/<ユーザー名>/.cache/huggingface/hub/models--MoritzLaurer--mDeBERTa-v3-base-xnli-multilingual-nli-2mil7/`
     - Windows: `C:\Users\{ユーザー名}\.cache\huggingface\hub\`
   - カスタム設定可能（`config.py`で指定）

3. **キャッシュ構造**
   ```
   ~/.cache/huggingface/hub/
   └── models--MoritzLaurer--mDeBERTa-v3-base-xnli-multilingual-nli-2mil7/
       ├── blobs/
       ├── refs/
       └── snapshots/
   ```

### 2回目以降の実行

- **ローカルキャッシュから高速読み込み**
- **インターネット接続不要**
- **`@st.cache_resource`により、Streamlit実行中はメモリに保持**

## 🚀 インストールと実行

### 1. 環境構築

```bash
# リポジトリのクローン
git clone https://github.com/your-repo/kotonari-part2.git
cd kotonari-part2

# 仮想環境の作成（推奨）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係のインストール
pip install -r requirements.txt
```

### 2. フォルダ構成の準備

```bash
# textフォルダの作成
mkdir text
```

### 3. 実行

```bash
streamlit run main.py
```

## 📝 使い方

### 基本的な流れ

1. **Streamlitアプリを起動**
   ```bash
   streamlit run main.py
   ```

2. **テキストファイルを追加**
   - `text/`フォルダに`.txt`ファイルを配置
   - ファイルは自動的に検出される

3. **タスクの確認**
   - 抽出されたタスクがチェックボックス付きで表示
   - 完了したタスクにチェックを入れて管理

### `.txt`ファイルに入れるべき内容

#### 良い例（タスクとして抽出されやすい）

```text
明日までに報告書を作成してください。
山田さんに会議の日程を確認する必要があります。
プレゼン資料を15時までに送ってほしい。
サーバーのバックアップを実施すること。
新しいロゴデザインの修正をお願いします。
```

#### 抽出のポイント

1. **明確な指示・依頼表現**
   - 「〜してください」「〜お願いします」
   - 「〜する必要があります」「〜してほしい」

2. **タスク関連の動詞**
   - 作成、確認、送信、連絡、報告、準備、実施など

3. **期限の明示**（将来的に実装予定）
   - 「明日まで」「15時までに」「今週中に」

#### 避けるべき内容

```text
今日は天気がいいですね。（タスクではない）
昨日の会議は有意義でした。（過去の出来事）
ありがとうございました。（お礼）
```

## 🔧 設定のカスタマイズ

### config.py での調整

```python
# モデルの切り替え
MODEL_CONFIG = {
    "transformer": {
        "model_name": "別のモデル名",  # 他のモデルを使用
        "cache_dir": "./my_cache",      # カスタムキャッシュディレクトリ
    }
}

# タスク抽出の閾値調整
TASK_EXTRACTION = {
    "confidence_threshold": 0.7,  # より厳密に（デフォルト: 0.5）
}
```

### 軽量版への切り替え

サイドバーの「軽量版を使用」にチェックを入れると、ルールベースの高速処理に切り替わります。

## 📊 パフォーマンス比較

| 項目 | Transformerモデル版 | 軽量版 |
|------|-------------------|---------|
| 初回起動時間 | 約1-3分（DL含む） | 即座 |
| 2回目以降 | 約5秒 | 即座 |
| メモリ使用量 | 約1GB | 約100MB |
| 抽出精度 | 高（文脈理解） | 中（パターンマッチ） |
| カスタマイズ性 | 低（再学習必要） | 高（ルール追加可能） |

### モデルの言語サポート
mDeBERTa-v3は**27言語**でNLIファインチューニングされており、日本語（ja）も含まれています：
- アジア言語：日本語(ja)、中国語(zh)、韓国語(ko)、ヒンディー語(hi)、ベンガル語(bn)など
- ヨーロッパ言語：英語(en)、ドイツ語(de)、フランス語(fr)、スペイン語(es)など
- その他：アラビア語(ar)、トルコ語(tr)、スワヒリ語(sw)など

## 🗂️ プロジェクト構成

```
kotonari-part2/
├── main.py                 # メインアプリケーション
├── config.py              # 設定ファイル
├── requirements.txt       # 依存関係
├── README.md             # このファイル
├── text/                 # 入力テキストファイル置き場
│   └── *.txt
├── model_cache/          # モデルキャッシュ（オプション）
└── .gitignore           # Git除外設定
```

## 🔜 今後の実装予定

1. **LINE/Slack連携**
   - 抽出したタスクを自動通知
   - 完了状況の同期

2. **期限抽出機能**
   - 「明日まで」などの時間表現を解析
   - カレンダー連携

3. **優先度判定**
   - 緊急度・重要度の自動分類
   - スマート通知

4. **バッチ処理対応**
   - 複数ファイルの一括処理
   - 定期実行スケジューラー

## 🔍 モデルの詳細情報

より詳しい情報は以下を参照：
- [HuggingFace Model Card](https://huggingface.co/MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7)
- 論文：[DeBERTa-v3](https://arxiv.org/pdf/2111.09543.pdf)
- 学習データ：[multilingual-NLI-26lang-2mil7](https://huggingface.co/datasets/MoritzLaurer/multilingual-NLI-26lang-2mil7)

## ⚠️ 注意事項

- 初回実行時は約700MBのモデルダウンロードが発生します
- CPU環境での動作を想定していますが、GPUがあればより高速に動作します
- mDeBERTa-v3は日本語を含む27言語でファインチューニングされているため、日本語のタスク抽出に高い精度を発揮します
- FP16（半精度）はサポートされていないため、CPU環境でも問題なく動作します

## 📄 ライセンス

[プロジェクトのライセンスを記載]

## 🤝 貢献

Issue や Pull Request は歓迎します。大きな変更を行う場合は、事前に Issue で議論をお願いします。

---

**Kotonari Project - Part 2** | Making voice tasks actionable 🎯
