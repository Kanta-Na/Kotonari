#!/bin/bash
# 文字起こしシステム実行スクリプト

# スクリプトのディレクトリに移動
cd "$(dirname "$0")"

# 仮想環境の有効化
source venv/bin/activate

# Pythonスクリプトの実行
python transcriber.py
