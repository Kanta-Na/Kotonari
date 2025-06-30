"""
タスク抽出モジュール - NLIを使用したゼロショット分類
"""

import re       # 正規表現ライブラリ
import logging  # ログ記録ライブラリ
from dataclasses import dataclass   # データクラスライブラリ（クラス定義を簡略化する。）
from typing import List     # 型ヒント ライブラリ
from datetime import datetime   # 日時（Data and Time）ライブラリ

from transformers import pipeline
import torch

logger = logging.getLogger(__name__)


@dataclass
class Task:
    """抽出されたタスクのデータクラス"""
    text: str
    score: float
    label: str
    file_name: str
    created_at: datetime
    
    def to_dict(self):
        """辞書形式に変換"""
        return {
            'text': self.text,
            'score': self.score,
            'label': self.label,
            'file_name': self.file_name,
            'created_at': self.created_at.isoformat()
        }


class TaskExtractor:
    """タスク抽出クラス"""
    
    def __init__(self, model_name="MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7"):
        """
        Args:
            model_name: 使用するモデル名
        """
        logger.info(f"モデルを読み込み中: {model_name}")
        
        # CPU環境での実行を想定
        self.classifier = pipeline(
            "zero-shot-classification",
            model=model_name,
            device=-1  # CPU使用
        )
        
        # 候補ラベル
        self.candidate_labels = ["指示", "依頼", "要求", "タスク", "その他"]
        self.task_labels = ["指示", "依頼", "要求", "タスク"]
        
        # 設定
        self.min_sentence_length = 5
        self.confidence_threshold = 0.5
        
        logger.info("タスク抽出器の初期化が完了しました")
    
    def split_sentences(self, text: str) -> List[str]:
        """テキストを文単位に分割"""
        # 句点、感嘆符、疑問符、改行で分割
        sentences = re.split(r'[。！？\n]+', text)
        
        # 空文字列を除去し、前後の空白を削除
        sentences = [s.strip() for s in sentences if s.strip()]
        
        return sentences
    
    def extract_tasks(self, text: str, file_name: str) -> List[Task]:
        """
        テキストからタスクを抽出
        
        Args:
            text: 解析するテキスト
            file_name: ソースファイル名
            
        Returns:
            抽出されたタスクのリスト
        """
        tasks = []
        sentences = self.split_sentences(text)
        
        logger.info(f"文を分割しました: {len(sentences)}文")
        
        for sentence in sentences:
            # 短すぎる文はスキップ
            if len(sentence) < self.min_sentence_length:
                continue
            
            try:
                # ゼロショット分類
                result = self.classifier(
                    sentence,
                    candidate_labels=self.candidate_labels,
                    hypothesis_template="この文は{}です。"
                )
                
                # 最も確信度の高いラベルを取得
                top_label = result['labels'][0]
                top_score = result['scores'][0]
                
                # タスクとして判定
                if (top_label in self.task_labels and 
                    top_score >= self.confidence_threshold):
                    
                    task = Task(
                        text=sentence,
                        score=top_score,
                        label=top_label,
                        file_name=file_name,
                        created_at=datetime.now()
                    )
                    tasks.append(task)
                    
                    logger.debug(f"タスクを検出: {sentence[:30]}... ({top_label}: {top_score:.2f})")
                    
            except Exception as e:
                logger.error(f"文の分類中にエラー: {e}")
                continue
        
        logger.info(f"抽出されたタスク数: {len(tasks)}")
        return tasks
    
    def extract_tasks_lightweight(self, text: str, file_name: str) -> List[Task]:
        """
        軽量版：ルールベースのタスク抽出（フォールバック用）
        """
        tasks = []
        sentences = self.split_sentences(text)
        
        # タスクパターン
        task_patterns = [
            "してください", "して下さい", "お願いします", 
            "してほしい", "して欲しい", "していただけますか",
            "してもらえますか", "しなさい", "するように",
            "必要です", "必要があります", "すること"
        ]
        
        for sentence in sentences:
            if len(sentence) < self.min_sentence_length:
                continue
            
            # パターンマッチング
            for pattern in task_patterns:
                if pattern in sentence:
                    task = Task(
                        text=sentence,
                        score=0.8,  # 固定スコア
                        label="タスク",
                        file_name=file_name,
                        created_at=datetime.now()
                    )
                    tasks.append(task)
                    break
        
        return tasks