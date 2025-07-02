#!/usr/bin/env python3
"""
KotoLab01 自動文字起こしシステム
録音されたWAVファイルを監視し、Whisperで文字起こしを行います。
"""

import os
import sys
import time
import logging
import json
from pathlib import Path
from datetime import datetime
import whisper
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import queue
import threading
from dotenv import load_dotenv

# .envファイルの読み込み
load_dotenv()

# 環境変数から設定を読み込み（相対パスも考慮）
def resolve_path(path_str):
    """パスを解決（相対パス対応）"""
    path = Path(path_str)
    if not path.is_absolute():
        # 相対パスの場合は、このスクリプトのディレクトリからの相対パスとして解決
        script_dir = Path(__file__).parent
        if path_str.startswith('./'):
            # ./で始まる場合はスクリプトディレクトリ基準
            path = (script_dir / path).resolve()
        else:
            # ../で始まる場合は親ディレクトリ基準
            path = (script_dir / path).resolve()
    return path

RECORDINGS_DIR = resolve_path(os.getenv('RECORDINGS_DIR', '../KotoLab01/recordings'))
TEXT_OUTPUT_DIR = resolve_path(os.getenv('TEXT_OUTPUT_DIR', '../kotonari_transcripts/text'))
LOG_DIR = Path(os.getenv('LOG_DIR', './logs'))
if not LOG_DIR.is_absolute():
    LOG_DIR = (Path(__file__).parent / LOG_DIR).resolve()

# Whisper設定
WHISPER_MODEL_SIZE = os.getenv('WHISPER_MODEL_SIZE', 'medium')
WHISPER_LANGUAGE = os.getenv('WHISPER_LANGUAGE', 'ja')

# 処理設定
PROCESS_EXISTING_FILES = os.getenv('PROCESS_EXISTING_FILES', 'false').lower() == 'true'
SAVE_SEGMENTS = os.getenv('SAVE_SEGMENTS', 'true').lower() == 'true'

# ログレベル
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# ディレクトリ作成
TEXT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

# ログ設定
log_file = LOG_DIR / f"transcriber_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# 処理済みファイルの追跡
PROCESSED_FILES_PATH = Path(__file__).parent / '.processed_files.json'

class ProcessedFilesTracker:
    """処理済みファイルを追跡するクラス"""
    
    def __init__(self, filepath):
        self.filepath = filepath
        self.processed_files = self._load()
    
    def _load(self):
        """処理済みファイルリストを読み込む"""
        if self.filepath.exists():
            try:
                with open(self.filepath, 'r') as f:
                    return set(json.load(f))
            except Exception as e:
                logger.error(f"処理済みファイルリストの読み込みエラー: {e}")
        return set()
    
    def _save(self):
        """処理済みファイルリストを保存"""
        try:
            with open(self.filepath, 'w') as f:
                json.dump(list(self.processed_files), f, indent=2)
        except Exception as e:
            logger.error(f"処理済みファイルリストの保存エラー: {e}")
    
    def is_processed(self, filepath):
        """ファイルが処理済みかチェック"""
        return str(filepath) in self.processed_files
    
    def mark_as_processed(self, filepath):
        """ファイルを処理済みとしてマーク"""
        self.processed_files.add(str(filepath))
        self._save()


class AudioTranscriber:
    """Whisperを使用した音声文字起こしクラス"""
    
    def __init__(self, model_size=WHISPER_MODEL_SIZE, device=None):
        """
        初期化
        
        Args:
            model_size: Whisperモデルのサイズ（tiny, base, small, medium, large）
            device: 使用するデバイス（None, cuda, cpu）
        """
        logger.info(f"Whisperモデル（{model_size}）を読み込み中...")
        
        try:
            # M4 Proチップ対応のためdeviceを指定しない（自動検出）
            if device is None:
                self.model = whisper.load_model(model_size)
            else:
                self.model = whisper.load_model(model_size, device=device)
            
            logger.info("Whisperモデルの読み込み完了")
        except Exception as e:
            logger.error(f"Whisperモデルの読み込みに失敗しました: {e}")
            logger.error("whisperがインストールされているか確認してください: pip install openai-whisper")
            sys.exit(1)
        
        # 処理キュー
        self.queue = queue.Queue()
        self.processing_thread = threading.Thread(target=self._process_queue, daemon=True)
        self.processing_thread.start()
        
        # 処理済みファイルトラッカー
        self.tracker = ProcessedFilesTracker(PROCESSED_FILES_PATH)
        
    def _process_queue(self):
        """キューから音声ファイルを取り出して処理"""
        while True:
            try:
                audio_path = self.queue.get(timeout=1)
                if audio_path is None:  # 終了シグナル
                    break
                
                # 既に処理済みかチェック
                if self.tracker.is_processed(audio_path):
                    logger.info(f"既に処理済み: {audio_path.name}")
                    self.queue.task_done()
                    continue
                
                self._transcribe_file(audio_path)
                self.queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"キュー処理中のエラー: {e}")
    
    def add_to_queue(self, audio_path):
        """音声ファイルを処理キューに追加"""
        self.queue.put(audio_path)
        logger.info(f"キューに追加: {audio_path.name}")
    
    def _transcribe_file(self, audio_path):
        """単一の音声ファイルを文字起こし"""
        try:
            logger.info(f"文字起こし開始: {audio_path.name}")
            start_time = time.time()
            
            # Whisperで文字起こし
            result = self.model.transcribe(
                str(audio_path),
                language=WHISPER_LANGUAGE,
                verbose=False,
                fp16=False  # M4 Proでの互換性のため
            )
            
            # テキストファイル名を生成
            text_filename = audio_path.stem + ".txt"
            text_path = TEXT_OUTPUT_DIR / text_filename
            
            # テキストファイルに保存
            with open(text_path, "w", encoding="utf-8") as f:
                # メタデータを含める
                # f.write(f"# 音声ファイル: {audio_path.name}\n")
                # f.write(f"# 文字起こし日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                # f.write(f"# Whisperモデル: {WHISPER_MODEL_SIZE}\n")
                # f.write("\n" + "="*50 + "\n\n")
                f.write(result["text"].strip())
            
            elapsed_time = time.time() - start_time
            logger.info(f"文字起こし完了: {text_filename} (処理時間: {elapsed_time:.2f}秒)")
            
            # # セグメント情報も保存（オプション）
            # if SAVE_SEGMENTS:
            #     segments_filename = audio_path.stem + "_segments.txt"
            #     segments_path = TEXT_OUTPUT_DIR / segments_filename
                
            #     with open(segments_path, "w", encoding="utf-8") as f:
            #         f.write(f"# 音声ファイル: {audio_path.name}\n")
            #         f.write(f"# セグメント情報\n")
            #         f.write("\n" + "="*50 + "\n\n")
                    
            #         for segment in result["segments"]:
            #             f.write(f"[{segment['start']:.2f}s - {segment['end']:.2f}s] {segment['text']}\n")
            
            # 処理済みとしてマーク
            self.tracker.mark_as_processed(audio_path)
            
        except Exception as e:
            logger.error(f"文字起こしエラー ({audio_path.name}): {e}")
    
    def stop(self):
        """処理を停止"""
        self.queue.put(None)
        self.processing_thread.join()


class AudioFileHandler(FileSystemEventHandler):
    """音声ファイルの作成を監視するハンドラー"""
    
    def __init__(self, transcriber):
        self.transcriber = transcriber
        self.processing_files = set()  # 処理中のファイルを追跡
        
    def on_created(self, event):
        """ファイル作成イベントの処理"""
        if event.is_directory:
            return
            
        file_path = Path(event.src_path)
        
        # WAVファイルのみ処理
        if file_path.suffix.lower() == ".wav":
            # ファイルが完全に書き込まれるまで待機
            self._wait_for_file_ready(file_path)
            
            # 重複処理を防ぐ
            if file_path not in self.processing_files:
                self.processing_files.add(file_path)
                logger.info(f"新しいWAVファイルを検出: {file_path.name}")
                self.transcriber.add_to_queue(file_path)
    
    def _wait_for_file_ready(self, file_path, timeout=30):
        """ファイルが完全に書き込まれるまで待機"""
        last_size = -1
        stable_count = 0
        
        for _ in range(timeout * 10):  # 0.1秒ごとにチェック
            try:
                current_size = file_path.stat().st_size
                if current_size == last_size and current_size > 0:
                    stable_count += 1
                    if stable_count >= 5:  # 0.5秒間サイズが変わらない
                        return True
                else:
                    stable_count = 0
                    last_size = current_size
                time.sleep(0.1)
            except OSError:
                time.sleep(0.1)
        
        logger.warning(f"ファイルの準備完了を待機中にタイムアウト: {file_path.name}")
        return False


def main():
    """メイン処理"""
    logger.info("=== KotoLab01 自動文字起こしシステム起動 ===")
    logger.info(f"監視ディレクトリ: {RECORDINGS_DIR}")
    logger.info(f"出力ディレクトリ: {TEXT_OUTPUT_DIR}")
    logger.info(f"Whisperモデル: {WHISPER_MODEL_SIZE}")
    
    # ディレクトリの存在確認
    if not RECORDINGS_DIR.exists():
        logger.error(f"録音ディレクトリが存在しません: {RECORDINGS_DIR}")
        logger.error("KotoLab01がインストールされているか確認してください")
        sys.exit(1)
    
    # Whisperモデルの初期化
    transcriber = AudioTranscriber(model_size=WHISPER_MODEL_SIZE)
    
    # 既存のWAVファイルを処理（環境変数で制御）
    if PROCESS_EXISTING_FILES:
        existing_files = list(RECORDINGS_DIR.glob("*.wav"))
        unprocessed_files = [f for f in existing_files if not transcriber.tracker.is_processed(f)]
        
        if unprocessed_files:
            logger.info(f"{len(unprocessed_files)}個の未処理ファイルを処理します")
            for wav_file in unprocessed_files:
                transcriber.add_to_queue(wav_file)
        else:
            logger.info("未処理のファイルはありません")
    
    # ファイル監視の設定
    event_handler = AudioFileHandler(transcriber)
    observer = Observer()
    observer.schedule(event_handler, str(RECORDINGS_DIR), recursive=False)
    
    # 監視開始
    observer.start()
    logger.info("ファイル監視を開始しました。終了するにはCtrl+Cを押してください。")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("終了シグナルを受信しました")
    finally:
        observer.stop()
        observer.join()
        transcriber.stop()
        logger.info("システムを終了しました")


if __name__ == "__main__":
    main()
    