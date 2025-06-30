
# Kotonari Phase2 - ユーザー内省支援アシスタント（バックエンド機構）

---
  
## 機能

streamlit でアプリを起動した状態で、textフォルダに新たな .txt ファイルを追加し、  
UI 上の [再度読み込み（クリックで更新）] ボタンを押すと、追加された .txt ファイルの形態素分析を行う。  

---
  
## 展望

- 自動ファイルウォッチの仕組みを入れる。  
- Whisper を取り入れることで、より複雑なこともできないか。  
- 指示・依頼内容を抜き出して、タスクリストとして見える化。  
- Notion や iPhone の ToDo リストなどと連携

---

## 🚀 起動方法

```bash
pip install -r requirements.txt
streamlit run main.py

---

## 📁 ディレクトリ構成（予定）

```bash
Phase2/
├── text/                    # text フォルダ
├── (参照)text/               # 参照 text フォルダ
├── main.py                  # Streamlit アプリ
├── requirements.txt         # ライブラリ
├── .gitignore
└── README.md
```

