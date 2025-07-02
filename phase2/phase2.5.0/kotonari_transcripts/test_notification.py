#!/usr/bin/env python3
"""
Kotonari v2.4.0 テストスクリプト
LINE通知機能のテスト
"""

import os
import sys                          # pythonインタプリタ自体をやり取りするためのライブラリ
import logging                      # ログを記録するための仕組み
from pathlib import Path            # ファイルパスの扱いを簡単・安全にするクラス
from dotenv import load_dotenv

# 環境変数の読み込み
load_dotenv()

# 自作モジュール（ローカルモジュール）のインポート
from task_extractor import TaskExtractor    # task_extractor.py ファイルの中の TaskExtractor クラス 
from line_notifier import LineNotifier      # line_notifier.py ファイルの中の LineNotifier クラス

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_line_connection():
    """LINE接続テスト"""
    logger.info("LINE接続をテストしています...")
    
    try:
        notifier = LineNotifier(
            channel_access_token=os.getenv("LINE_CHANNEL_ACCESS_TOKEN"),
            target_user_id=os.getenv("LINE_TARGET_USER_ID")
        )
        
        success = notifier.send_test_message()
        
        if success:
            logger.info("✅ LINE接続テスト成功！")
            return True
        else:
            logger.error("❌ LINE接続テスト失敗")
            return False
            
    except Exception as e:
        logger.error(f"エラー: {e}")
        return False


def test_task_extraction():
    """タスク抽出テスト"""
    logger.info("タスク抽出をテストしています...")
    
    # テスト用テキスト
    test_text = """
    今日の会議の内容をまとめます。

    1. 来週までに報告書を作成してください。
    2. 山田さんに資料を送る必要があります。
    3. 新しいプロジェクトの企画書を準備してほしい。
    4. 明日の会議は14時からです。
    5. サーバーのバックアップを実施すること。

    以上、よろしくお願いします。
    """
    
    try:
        # タスク抽出
        extractor = TaskExtractor()
        tasks = extractor.extract_tasks(test_text, "test.txt")
        
        logger.info(f"✅ {len(tasks)}個のタスクを抽出しました")
        
        for i, task in enumerate(tasks, 1):
            logger.info(f"  タスク{i}: {task.text}")
            logger.info(f"    種別: {task.label}, 信頼度: {task.score:.0%}")
        
        return tasks
        
    except Exception as e:
        logger.error(f"エラー: {e}")
        return []


def test_full_workflow():
    """完全なワークフローのテスト"""
    logger.info("=" * 50)
    logger.info("Kotonari v2.4.0 統合テスト")
    logger.info("=" * 50)
    
    # 1. LINE接続テスト
    if not test_line_connection():
        logger.error("LINE接続に失敗しました")
        return False
    
    # 2. タスク抽出テスト
    tasks = test_task_extraction()
    if not tasks:
        logger.warning("タスクが抽出されませんでした")
    
    # 3. 通知送信テスト
    logger.info("統合テストを実行しています...")
    
    test_text = """
    本日のタスクをお知らせします。

    ・プレゼン資料を15時までに送ってください。
    ・クライアントに進捗報告をお願いします。
    ・新機能の実装を開始してほしい。
    ・ドキュメントの更新が必要です。

    何か質問があれば連絡してください。
    """
    
    try:
        # コンポーネントの初期化
        extractor = TaskExtractor()
        notifier = LineNotifier(
            channel_access_token=os.getenv("LINE_CHANNEL_ACCESS_TOKEN"),
            target_user_id=os.getenv("LINE_TARGET_USER_ID")
        )
        
        # タスク抽出
        tasks = extractor.extract_tasks(test_text, "test_integration.txt")
        
        # LINE通知
        success = notifier.send_notification(
            tasks=tasks,
            full_text=test_text,
            file_name="test_integration.txt"
        )
        
        if success:
            logger.info("✅ 統合テスト成功！")
            logger.info("LINEに通知が送信されました。確認してください。")
            return True
        else:
            logger.error("❌ 統合テスト失敗")
            return False
            
    except Exception as e:
        logger.error(f"エラー: {e}", exc_info=True)
        return False


def create_test_file():
    """テスト用ファイルを作成"""
    text_dir = Path("./text")
    text_dir.mkdir(exist_ok=True)
    
    test_content = """
    テストファイルです。

    以下のタスクを実行してください：
    1. データベースのバックアップを取る必要があります。
    2. 週次レポートを作成してください。
    3. 新しい機能の設計書を準備してほしい。

    よろしくお願いします。
    """
    
    test_file = text_dir / "test_auto.txt"
    with open(test_file, "w", encoding="utf-8") as f:
        f.write(test_content)
    
    logger.info(f"テストファイルを作成しました: {test_file}")
    return test_file


if __name__ == "__main__":
    # 環境変数の確認
    required_vars = ["LINE_CHANNEL_ACCESS_TOKEN", "LINE_TARGET_USER_ID"]
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        logger.error(f"必要な環境変数が設定されていません: {missing}")
        sys.exit(1)
    
    # テストの実行
    if len(sys.argv) > 1:
        if sys.argv[1] == "line":
            test_line_connection()
        elif sys.argv[1] == "extract":
            test_task_extraction()
        elif sys.argv[1] == "file":
            create_test_file()
        elif sys.argv[1] == "full":
            test_full_workflow()
    else:
        # デフォルトは統合テスト
        test_full_workflow()