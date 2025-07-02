
#!/usr/bin/env python3
"""
Kotonari v2.4.0 - ファイル監視とLINE通知システム
"""

import os
import sys
import time
import logging
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

from watchdog.observers import Observer                 # OSネイティブのファイルウォッチ機能
from watchdog.events import FileSystemEventHandler      # ファイルシステム上のイベント処理を行うための基底クラス

from task_extractor import TaskExtractor    # 自然言語推論を行うファイル
from line_notifier import LineNotifier      # LINE の Messaging API 関連 

# 環境変数の読み込み
load_dotenv()

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('kotonari.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# 設定
TEXT_DIR = Path("./text")
PROCESSED_FILES = set()  # 処理済みファイルを記録 => 集合を作る。（重複データは増やさない。）


class TextFileHandler(FileSystemEventHandler):
    """テキストファイルの変更を監視するハンドラー"""
    
    def __init__(self, task_extractor, line_notifier):
        self.task_extractor = task_extractor        # <-- "extract": 抽出する
        self.line_notifier = line_notifier          # <-- "notify": 通知する
        super().__init__()
    
    def on_created(self, event):
        """ファイルが作成された時の処理"""
        if event.is_directory:      # <-- 作られたのがディレクトリなら無視する。
            return
            
        file_path = Path(event.src_path)        # <-- 作成されたファイルのパス文字列(event.src_path)を Path オブジェクトに変換
        
        # .txtファイルのみ処理
        if file_path.suffix != '.txt':
            return
        
        # 少し待機（ファイルの書き込みが完了するまで）
        time.sleep(0.5)
        
        logger.info(f"新しいファイルを検出: {file_path.name}")
        self.process_file(file_path)    # <-- 実施あの処理本体を別メソッド(以下に定義)に渡して実行する。
    
    def on_modified(self, event):
        """ファイルが変更された時の処理"""
        if event.is_directory:
            return
            
        file_path = Path(event.src_path)
        
        # .txtファイルのみ処理
        if file_path.suffix != '.txt':
            return
        
        # 既に処理済みの場合はスキップ
        if file_path.name in PROCESSED_FILES:
            return
        
        # 少し待機
        time.sleep(0.5)
        
        logger.info(f"ファイルの変更を検出: {file_path.name}")
        self.process_file(file_path)
    
    def process_file(self, file_path):
        """ファイルを処理してLINE通知を送信"""
        try:
            # ファイル内容を読み込む
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if not content.strip():
                logger.warning(f"空のファイル: {file_path.name}")
                return
            
            # タスク抽出
            logger.info(f"タスクを抽出中: {file_path.name}")
            tasks = self.task_extractor.extract_tasks(content, file_path.name)
            
            # LINE通知を送信
            logger.info(f"LINE通知を送信中: タスク数 {len(tasks)}")
            success = self.line_notifier.send_notification(
                tasks=tasks,
                full_text=content,
                file_name=file_path.name
            )
            
            if success:
                logger.info("LINE通知を送信しました")
                PROCESSED_FILES.add(file_path.name)
            else:
                logger.error("LINE通知の送信に失敗しました")
                
        except Exception as e:
            logger.error(f"ファイル処理エラー: {e}", exc_info=True)


def main():
    """メイン処理"""
    logger.info("=" * 50)
    logger.info("Kotonari v2.4.0 起動")
    logger.info("=" * 50)
    
    # 環境変数の確認
    required_env_vars = [
        "LINE_CHANNEL_ACCESS_TOKEN",
        "LINE_TARGET_USER_ID"
    ]
    
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    if missing_vars:
        logger.error(f"必要な環境変数が設定されていません: {missing_vars}")
        logger.error(".envファイルを確認してください")
        sys.exit(1)
    
    # textディレクトリの確認・作成
    if not TEXT_DIR.exists():
        TEXT_DIR.mkdir(parents=True)
        logger.info(f"{TEXT_DIR}ディレクトリを作成しました")
    
    # 各コンポーネントの初期化
    try:
        logger.info("タスク抽出器を初期化中...")
        task_extractor = TaskExtractor()
        
        logger.info("LINE通知システムを初期化中...")
        line_notifier = LineNotifier(
            channel_access_token=os.getenv("LINE_CHANNEL_ACCESS_TOKEN"),
            target_user_id=os.getenv("LINE_TARGET_USER_ID")
        )
        
        # ファイル監視の設定
        event_handler = TextFileHandler(task_extractor, line_notifier)
        observer = Observer()
        observer.schedule(event_handler, str(TEXT_DIR), recursive=False)
        
        # 監視開始
        observer.start()
        logger.info(f"ファイル監視を開始しました: {TEXT_DIR}")
        logger.info("Ctrl+C で終了します")
        
        # 既存ファイルの処理（オプション）
        existing_files = list(TEXT_DIR.glob("*.txt"))
        if existing_files:
            logger.info(f"既存のファイルが{len(existing_files)}個見つかりました")
            for file_path in existing_files:
                if file_path.name not in PROCESSED_FILES:
                    logger.info(f"既存ファイルを処理: {file_path.name}")
                    event_handler.process_file(file_path)
        
        # 監視を継続
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("終了シグナルを受信しました")
        observer.stop()
        observer.join()
        logger.info("Kotonari を終了しました")
        
    except Exception as e:
        logger.error(f"エラーが発生しました: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
