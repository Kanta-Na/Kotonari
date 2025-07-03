#!/bin/bash

# KotoLab統合起動スクリプト（シェル版）

echo "=================================="
echo "KotoLab Integrated System"
echo "=================================="

# スクリプトのディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# プロセスIDを保存する配列
declare -a PIDS

# 終了時の処理
cleanup() {
    echo -e "\n\nShutting down all services..."
    
    # 全プロセスを終了
    for pid in "${PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            echo "Stopping process $pid..."
            kill -TERM $pid 2>/dev/null
        fi
    done
    
    # 少し待機
    sleep 2
    
    # まだ生きているプロセスを強制終了
    for pid in "${PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            echo "Force killing process $pid..."
            kill -KILL $pid 2>/dev/null
        fi
    done
    
    echo "All services stopped."
    exit 0
}

# Ctrl+Cのトラップ設定
trap cleanup INT TERM

# 1. KotoLab01を起動
echo "Starting KotoLab01..."
cd "$SCRIPT_DIR/KotoLab01"
npm start &
PIDS+=($!)
echo "✅ KotoLab01 started (PID: ${PIDS[-1]})"

# 少し待機
sleep 5

# 2. Whisper Transcriberを起動
echo "Starting Whisper Transcriber..."
cd "$SCRIPT_DIR/whisper_transcriber"
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    python transcriber.py &
    PIDS+=($!)
    echo "✅ Whisper Transcriber started (PID: ${PIDS[-1]})"
else
    echo "❌ Whisper Transcriber virtual environment not found. Run setup.sh first."
fi

# 少し待機
sleep 3

# 3. Kotonari Transcriptsを起動
echo "Starting Kotonari Transcripts..."
cd "$SCRIPT_DIR/kotonari_transcripts"
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    python main.py &
    PIDS+=($!)
    echo "✅ Kotonari Transcripts started (PID: ${PIDS[-1]})"
else
    echo "❌ Kotonari Transcripts virtual environment not found. Set up the environment first."
fi

echo ""
echo "=================================="
echo "🚀 All services started!"
echo "=================================="
echo "Access KotoLab01 at: http://localhost:5173"
echo "Press Ctrl+C to stop all services"
echo ""

# プロセスが終了するまで待機
wait