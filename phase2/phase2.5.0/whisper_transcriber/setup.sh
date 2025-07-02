#!/bin/bash

echo "=== KotoLab01 文字起こしシステム セットアップ ==="

# ベースディレクトリの設定
BASE_DIR=$(pwd)
PARENT_DIR=$(dirname "$BASE_DIR")

# ディレクトリ作成
echo "ディレクトリを作成中..."
mkdir -p "$BASE_DIR/logs"
mkdir -p "$PARENT_DIR/kotonari_transcripts/text"

# 現在のディレクトリを保存
CURRENT_DIR=$(pwd)

# whisper_transcriberディレクトリに移動
cd "$BASE_DIR"

# Python仮想環境の作成
echo "Python仮想環境を作成中..."
python3 -m venv venv

# .envファイルの作成（存在しない場合）
if [ ! -f ".env" ]; then
    echo ".envファイルを作成中..."
    cat > .env << EOF
# KotoLab01 文字起こしシステム 環境設定
# 自動生成された設定ファイル

# パス設定
RECORDINGS_DIR=$PARENT_DIR/KotoLab01/recording
TEXT_OUTPUT_DIR=$PARENT_DIR/kotonari_transcripts/text
LOG_DIR=$BASE_DIR/logs

# Whisper設定
WHISPER_MODEL_SIZE=base
WHISPER_LANGUAGE=ja

# 処理設定
PROCESS_EXISTING_FILES=false
SAVE_SEGMENTS=true

# ログ設定
LOG_LEVEL=INFO
EOF
    echo ".envファイルを作成しました。"
    echo "パス設定："
    echo "  録音ファイル: $PARENT_DIR/KotoLab01/recording"
    echo "  出力先: $PARENT_DIR/kotonari_transcripts/text"
    echo "必要に応じて.envファイルを編集してください。"
fi

# 仮想環境の有効化
source venv/bin/activate

# pipのアップグレード
pip install --upgrade pip

# ffmpegのインストール確認（M4 Pro Mac用）
if ! command -v ffmpeg &> /dev/null; then
    echo "ffmpegがインストールされていません。Homebrewでインストールします..."
    if command -v brew &> /dev/null; then
        brew install ffmpeg
    else
        echo "Homebrewがインストールされていません。"
        echo "先にHomebrewをインストールしてください: https://brew.sh"
        exit 1
    fi
fi

# Pythonパッケージのインストール
echo "必要なPythonパッケージをインストール中..."
pip install -r requirements.txt

# 実行スクリプトの作成
cat > run.sh << 'EOF'
#!/bin/bash
# 文字起こしシステム実行スクリプト

# スクリプトのディレクトリに移動
cd "$(dirname "$0")"

# 仮想環境の有効化
source venv/bin/activate

# Pythonスクリプトの実行
python transcriber.py
EOF

chmod +x run.sh

echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "使用方法:"
echo "1. KotoLab01を起動して録音を開始"
echo "2. 別のターミナルで以下を実行:"
echo "   cd $BASE_DIR"
echo "   ./run.sh"
echo ""
echo "または直接実行:"
echo "   cd $BASE_DIR"
echo "   source venv/bin/activate"
echo "   python transcriber.py"

# 元のディレクトリに戻る
cd "$CURRENT_DIR"
