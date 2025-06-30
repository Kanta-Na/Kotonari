"""
LINE通知モジュール - LINE Messaging APIを使用
"""

import json
import logging
from typing import List, Optional
from datetime import datetime

from linebot import LineBotApi
from linebot.models import (
    TextSendMessage,
    FlexSendMessage,
    QuickReply,
    QuickReplyButton,
    MessageAction
)
from linebot.exceptions import LineBotApiError

from task_extractor import Task

logger = logging.getLogger(__name__)


class LineNotifier:
    """LINE通知クラス"""
    
    def __init__(self, channel_access_token: str, target_user_id: str):
        """
        Args:
            channel_access_token: LINE Channel Access Token
            target_user_id: 送信先のユーザーID
        """
        self.line_bot_api = LineBotApi(channel_access_token)
        self.target_user_id = target_user_id
        logger.info("LINE通知システムを初期化しました")
    
    def send_notification(self, tasks: List[Task], full_text: str, file_name: str) -> bool:
        """
        タスクリストと元テキストをLINEで通知
        
        Args:
            tasks: 抽出されたタスクのリスト
            full_text: 元の完全なテキスト
            file_name: ファイル名
            
        Returns:
            成功時True、失敗時False
        """
        try:
            messages = []
            
            # 1. タスクリストのメッセージ
            if tasks:
                task_message = self._create_task_message(tasks, file_name)
                messages.append(TextSendMessage(text=task_message))
                
                # Flex Messageでリッチな表示（オプション）
                flex_message = self._create_flex_message(tasks, file_name)
                if flex_message:
                    messages.append(flex_message)
            else:
                no_task_message = f"📄 {file_name}\n\nタスクは検出されませんでした。"
                messages.append(TextSendMessage(text=no_task_message))
            
            # 2. 元テキストの全文
            full_text_message = self._create_full_text_message(full_text, file_name)
            messages.append(TextSendMessage(text=full_text_message))
            
            # メッセージ送信
            self.line_bot_api.push_message(
                self.target_user_id,
                messages
            )
            
            logger.info(f"LINE通知を送信しました: {len(messages)}件のメッセージ")
            return True
            
        except LineBotApiError as e:
            logger.error(f"LINE API エラー: {e}")
            return False
        except Exception as e:
            logger.error(f"通知送信エラー: {e}", exc_info=True)
            return False
    
    def _create_task_message(self, tasks: List[Task], file_name: str) -> str:
        """タスクリストのテキストメッセージを作成"""
        message = f"📋 新しいタスクを検出しました\n"
        message += f"📄 ファイル: {file_name}\n"
        message += f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        message += "=" * 30 + "\n\n"
        
        for i, task in enumerate(tasks, 1):
            # 信頼度を星で表現（5段階）
            stars = "⭐" * min(int(task.score * 5), 5)
            
            message += f"【タスク {i}】\n"
            message += f"📌 {task.text}\n"
            message += f"種別: {task.label} {stars}\n"
            message += f"信頼度: {task.score:.0%}\n\n"
        
        message += f"合計: {len(tasks)}件のタスク"
        
        return message
    
    def _create_full_text_message(self, full_text: str, file_name: str) -> str:
        """元テキストの全文メッセージを作成"""
        message = "=" * 30 + "\n"
        message += f"📄 元のテキスト全文\n"
        message += f"ファイル: {file_name}\n"
        message += "=" * 30 + "\n\n"
        message += full_text
        
        # LINEのメッセージ上限（5000文字）を考慮
        if len(message) > 4900:
            message = message[:4900] + "\n...(文字数制限により省略)"
        
        return message
    
    def _create_flex_message(self, tasks: List[Task], file_name: str) -> Optional[FlexSendMessage]:
        """Flex Messageを作成（よりリッチな表示）"""
        try:
            # タスクが多すぎる場合は最初の5件のみ表示
            display_tasks = tasks[:5]
            
            task_bubbles = []
            for task in display_tasks:
                task_bubbles.append({
                    "type": "box",
                    "layout": "vertical",
                    "margin": "md",
                    "contents": [
                        {
                            "type": "text",
                            "text": task.text,
                            "size": "sm",
                            "wrap": True
                        },
                        {
                            "type": "box",
                            "layout": "horizontal",
                            "margin": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": task.label,
                                    "size": "xs",
                                    "color": "#666666",
                                    "flex": 0
                                },
                                {
                                    "type": "text",
                                    "text": f"{task.score:.0%}",
                                    "size": "xs",
                                    "color": "#00AA00",
                                    "align": "end"
                                }
                            ]
                        }
                    ]
                })
            
            # もっとタスクがある場合
            if len(tasks) > 5:
                task_bubbles.append({
                    "type": "text",
                    "text": f"...他 {len(tasks) - 5} 件のタスク",
                    "size": "xs",
                    "color": "#999999",
                    "margin": "md"
                })
            
            flex_content = {
                "type": "bubble",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": "📋 Kotonari タスク通知",
                            "weight": "bold",
                            "size": "lg",
                            "color": "#00AA00"
                        },
                        {
                            "type": "text",
                            "text": file_name,
                            "size": "sm",
                            "color": "#666666"
                        }
                    ]
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": task_bubbles
                },
                "footer": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": datetime.now().strftime("%Y-%m-%d %H:%M"),
                            "size": "xs",
                            "color": "#999999",
                            "align": "center"
                        }
                    ]
                }
            }
            
            return FlexSendMessage(
                alt_text=f"タスク通知: {len(tasks)}件",
                contents=flex_content
            )
            
        except Exception as e:
            logger.error(f"Flex Message作成エラー: {e}")
            return None
    
    def send_test_message(self) -> bool:
        """テストメッセージを送信"""
        try:
            test_message = TextSendMessage(
                text="🎉 Kotonari v2.4.0 が起動しました！\nファイル監視を開始します。"
            )
            
            self.line_bot_api.push_message(
                self.target_user_id,
                test_message
            )
            
            logger.info("テストメッセージを送信しました")
            return True
            
        except Exception as e:
            logger.error(f"テストメッセージ送信エラー: {e}")
            return False