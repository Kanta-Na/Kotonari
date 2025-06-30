## 2025-0626-2030：Test Connection
```bash
source venv/bin/activate
python test_notification.py full
```

以下、出力ログ
```出力
・・・
A module that was compiled using NumPy 1.x cannot be run in
NumPy 2.0.2 as it may crash. To support both 1.x and 2.x
versions of NumPy, modules must be compiled with NumPy 2.0.
Some module may need to rebuild instead e.g. with 'pybind11>=2.12'.

If you are a user of the module, the easiest solution will be to
downgrade to 'numpy<2' or try to upgrade the affected module.
We expect that some modules will need time to support NumPy 2.
・・・

<< test_full_workflor() >>
INFO:__main__:==================================================
INFO:__main__:Kotonari v2.4.0 統合テスト
INFO:__main__:==================================================
INFO:__main__:LINE接続をテストしています...
INFO:line_notifier:LINE通知システムを初期化しました
INFO:line_notifier:テストメッセージを送信しました

<< test_line_connection() >>
INFO:__main__:✅ LINE接続テスト成功！
INFO:__main__:タスク抽出をテストしています...
INFO:task_extractor:モデルを読み込み中: ・・・
・・・
INFO:task_extractor:タスク抽出器の初期化が完了しました
INFO:task_extractor:文を分割しました: 7文
ERROR:task_extractor:文の分類中にエラー: Numpy is not available
ERROR:task_extractor:文の分類中にエラー: Numpy is not available
ERROR:task_extractor:文の分類中にエラー: Numpy is not available
ERROR:task_extractor:文の分類中にエラー: Numpy is not available
ERROR:task_extractor:文の分類中にエラー: Numpy is not available
ERROR:task_extractor:文の分類中にエラー: Numpy is not available
ERROR:task_extractor:文の分類中にエラー: Numpy is not available
INFO:task_extractor:抽出されたタスク数: 0
INFO:__main__:✅ 0個のタスクを抽出しました
WARNING:__main__:タスクが抽出されませんでした
INFO:__main__:統合テストを実行しています...
INFO:task_extractor:モデルを読み込み中:・・・
・・・
INFO:task_extractor:タスク抽出器の初期化が完了しました
INFO:line_notifier:LINE通知システムを初期化しました
INFO:task_extractor:文を分割しました: 6文
ERROR:task_extractor:文の分類中にエラー: Numpy is not available
ERROR:task_extractor:文の分類中にエラー: Numpy is not available
ERROR:task_extractor:文の分類中にエラー: Numpy is not available
ERROR:task_extractor:文の分類中にエラー: Numpy is not available
ERROR:task_extractor:文の分類中にエラー: Numpy is not available
ERROR:task_extractor:文の分類中にエラー: Numpy is not available
INFO:task_extractor:抽出されたタスク数: 0
INFO:line_notifier:LINE通知を送信しました: 2件のメッセージ
INFO:__main__:✅ 統合テスト成功！
INFO:__main__:LINEに通知が送信されました。確認してください。
```

**==>結果、タスクは出力されず・・・**

**==>Numpy がインストールされていなかっただけだった・・・**

---
---

## 2025-0627-0740:今後の方針  

- タスクに応じた出力を強化
    - タスクの種類
    - 出力の仕方（NLI か Prompt Enginnearing か、etc）
- LINE の UI
