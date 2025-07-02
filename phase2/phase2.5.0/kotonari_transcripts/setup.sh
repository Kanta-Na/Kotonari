#!/bin/bash

# Kotonari v2.4.0 セットアップスクリプト

echo "======================================"
echo "Kotonari v2.4.0 セットアップ"
echo "======================================"

# 現在のディレクトリを確認
echo "📁 現在のディレクトリ: $(pwd)"

# .envファイルの確認
if [ ! -f .env ]; then
    echo "❌ .envファイルが見つかりません"
    exit 1
else
    echo "✅ .envファイルを確認しました"
fi

# Python3の確認
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3がインストールされていません"
    exit 1
else
    echo "✅ Python3: $(python3 --version)"
fi

# 仮想環境の作成
if [ ! -d "venv" ]; then
    echo "🔧 仮想環境を作成しています..."
    python3 -m venv venv
    echo "✅ 仮想環境を作成しました"
else
    echo "✅ 仮想環境は既に存在します"
fi

# 仮想環境の有効化
echo "🔧 仮想環境を有効化しています..."
source venv/bin/activate

# 依存関係のインストール
echo "📦 依存関係をインストールしています..."
pip install --upgrade pip
pip install -r requirements.txt

# textフォルダの作成
if [ ! -d "text" ]; then
    mkdir -p text
    echo "✅ textフォルダを作成しました"
else
    echo "✅ textフォルダは既に存在します"
fi

# 実行権限の付与
chmod +x main.py
chmod +x test_notification.py

echo ""
echo "======================================"
echo "✨ セットアップが完了しました！"
echo "======================================"
echo ""
echo "次のコマンドで起動できます："
echo ""
echo "1. 仮想環境を有効化:"
echo "   source venv/bin/activate"
echo ""
echo "2. テストを実行:"
echo "   python test_notification.py"
echo ""
echo "3. メインプログラムを起動:"
echo "   python main.py"
echo ""
