#!/usr/bin/env python3
"""
KotoLab統合起動スクリプト
全てのサービスを一括で起動・管理します
"""

import os
import sys
import subprocess
import signal
import time
import threading
from pathlib import Path
import logging
from typing import List, Dict

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ServiceManager:
    """サービス管理クラス"""
    
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.processes: Dict[str, subprocess.Popen] = {}
        self.running = False
        
    def start_service(self, name: str, command: List[str], cwd: Path):
        """個別サービスを起動"""
        try:
            logger.info(f"Starting {name}...")
            process = subprocess.Popen(
                command,
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            self.processes[name] = process
            
            # ログ出力スレッドを開始
            threading.Thread(
                target=self._log_output,
                args=(name, process.stdout, "INFO"),
                daemon=True
            ).start()
            
            threading.Thread(
                target=self._log_output,
                args=(name, process.stderr, "ERROR"),
                daemon=True
            ).start()
            
            logger.info(f"✅ {name} started successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to start {name}: {e}")
            return False
    
    def _log_output(self, service_name: str, stream, level: str):
        """サービスの出力をログに記録"""
        try:
            for line in stream:
                if line.strip():
                    logger.info(f"[{service_name}] {line.strip()}")
        except Exception as e:
            logger.error(f"Error reading {service_name} output: {e}")
    
    def check_prerequisites(self):
        """必要なディレクトリと依存関係を確認"""
        logger.info("Checking prerequisites...")
        
        # ディレクトリの確認
        required_dirs = {
            "KotoLab01": self.base_dir / "KotoLab01",
            "kotonari_transcripts": self.base_dir / "kotonari_transcripts",
            "whisper_transcriber": self.base_dir / "whisper_transcriber"
        }
        
        for name, path in required_dirs.items():
            if not path.exists():
                logger.error(f"❌ Directory not found: {path}")
                return False
            logger.info(f"✅ Found {name} at {path}")
        
        # Node.jsの確認
        try:
            subprocess.run(["node", "--version"], capture_output=True, check=True)
            logger.info("✅ Node.js is installed")
        except:
            logger.error("❌ Node.js is not installed")
            return False
        
        # Pythonの確認
        if sys.version_info < (3, 8):
            logger.error("❌ Python 3.8 or higher is required")
            return False
        logger.info("✅ Python version is compatible")
        
        return True
    
    def setup_services(self):
        """必要に応じて各サービスのセットアップを実行"""
        logger.info("Setting up services...")
        
        # whisper_transcriberのセットアップ確認
        whisper_dir = self.base_dir / "whisper_transcriber"
        if not (whisper_dir / "venv").exists():
            logger.info("Setting up whisper_transcriber...")
            setup_script = whisper_dir / "setup.sh"
            if setup_script.exists():
                subprocess.run(["chmod", "+x", str(setup_script)])
                subprocess.run([str(setup_script)], cwd=whisper_dir)
        
        # kotonari_transcriptsの仮想環境確認
        kotonari_dir = self.base_dir / "kotonari_transcripts"
        if not (kotonari_dir / "venv").exists():
            logger.info("Setting up kotonari_transcripts virtual environment...")
            subprocess.run([sys.executable, "-m", "venv", "venv"], cwd=kotonari_dir)
            
            # 依存関係のインストール
            pip_path = kotonari_dir / "venv" / "bin" / "pip"
            if not pip_path.exists():
                pip_path = kotonari_dir / "venv" / "Scripts" / "pip"
            
            subprocess.run([str(pip_path), "install", "-r", "requirements.txt"], cwd=kotonari_dir)
    
    def start_all(self):
        """全サービスを起動"""
        self.running = True
        
        # 1. KotoLab01を起動
        kotolab_dir = self.base_dir / "KotoLab01"
        self.start_service(
            "KotoLab01",
            ["npm", "start"],
            kotolab_dir
        )
        
        # 少し待機してからWhisperを起動
        time.sleep(3)
        
        # 2. Whisper Transcriberを起動
        whisper_dir = self.base_dir / "whisper_transcriber"
        whisper_python = whisper_dir / "venv" / "bin" / "python"
        if not whisper_python.exists():
            whisper_python = whisper_dir / "venv" / "Scripts" / "python"
        
        self.start_service(
            "WhisperTranscriber",
            [str(whisper_python), "transcriber.py"],
            whisper_dir
        )
        
        # 少し待機してからKotonariを起動
        time.sleep(2)
        
        # 3. Kotonari Transcriptsを起動
        kotonari_dir = self.base_dir / "kotonari_transcripts"
        kotonari_python = kotonari_dir / "venv" / "bin" / "python"
        if not kotonari_python.exists():
            kotonari_python = kotonari_dir / "venv" / "Scripts" / "python"
        
        self.start_service(
            "KotonariTranscripts",
            [str(kotonari_python), "main.py"],
            kotonari_dir
        )
        
        logger.info("=" * 50)
        logger.info("🚀 All services started successfully!")
        logger.info("=" * 50)
        logger.info("Access KotoLab01 at: http://localhost:5173")
        logger.info("Press Ctrl+C to stop all services")
        
    def stop_all(self):
        """全サービスを停止"""
        logger.info("Stopping all services...")
        self.running = False
        
        for name, process in self.processes.items():
            if process.poll() is None:
                logger.info(f"Stopping {name}...")
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    logger.warning(f"Force killing {name}...")
                    process.kill()
                logger.info(f"✅ {name} stopped")
        
        self.processes.clear()
    
    def monitor_services(self):
        """サービスの状態を監視"""
        while self.running:
            time.sleep(5)
            for name, process in list(self.processes.items()):
                if process.poll() is not None:
                    logger.warning(f"⚠️  {name} has stopped unexpectedly!")
                    # 必要に応じて再起動ロジックを追加


def signal_handler(signum, frame):
    """シグナルハンドラー"""
    logger.info("\nReceived interrupt signal")
    if 'manager' in globals():
        manager.stop_all()
    sys.exit(0)


def main():
    """メイン関数"""
    # 基本ディレクトリの設定
    base_dir = Path(__file__).parent
    
    logger.info("=" * 50)
    logger.info("KotoLab Integrated Launcher")
    logger.info("=" * 50)
    
    # サービスマネージャーの初期化
    global manager
    manager = ServiceManager(base_dir)
    
    # 前提条件の確認
    if not manager.check_prerequisites():
        logger.error("Prerequisites check failed. Please install missing dependencies.")
        sys.exit(1)
    
    # セットアップの実行
    manager.setup_services()
    
    # シグナルハンドラーの設定
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # 全サービスを起動
        manager.start_all()
        
        # サービスを監視
        manager.monitor_services()
        
    except Exception as e:
        logger.error(f"Error: {e}")
        manager.stop_all()
        sys.exit(1)


if __name__ == "__main__":
    main()