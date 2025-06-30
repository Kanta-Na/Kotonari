
import streamlit as st
from janome.tokenizer import Tokenizer
import os
import re
from transformers import pipeline
import torch

TEXT_DIR = "text"

# 品詞ごとの色指定
pos_colors = {
    "名詞": "#ffadad",
    "動詞": "#ffd6a5",
    "形容詞": "#caffbf",
    "副詞": "#9bf6ff",
    "助詞": "#bdb2ff",
    "記号": "#ffffff",
    "その他": "#d3d3d3"
}

tokenizer = Tokenizer()

@st.cache_resource
def load_classifier():
    local_path = "/Users/nknt/.cache/huggingface/hub/models--MoritzLaurer--mDeBERTa-v3-base-xnli-multilingual-nli-2mil7"
    if not os.path.exists(local_path):
        classifier = pipeline(
            "zero-shot-classification",
            model="MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7",
            device=-1
        )
    else:
        classifier = pipeline(
            "zero-shot-classification",
            model=local_path,
            device=-1
        )
    return classifier



# # タスク抽出用の軽量モデルを初期化
# @st.cache_resource
# def load_classifier():
#     # CPU環境でも動作する日本語BERTベースの軽量モデル
#     # tohoku-nlp/bert-base-japanese-v3 は比較的軽量で性能も良い
#     classifier = pipeline(
#         "zero-shot-classification",
#         model="MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7",
#         device=-1  # CPU使用
#     )
#     return classifier


def split_sentences(text):
    """テキストを文単位に分割"""
    # 日本語の文末表現で分割
    sentences = re.split(r'[。！？\n]+', text)
    # 空文字列を除去
    sentences = [s.strip() for s in sentences if s.strip()]
    return sentences

def extract_tasks(text, classifier):
    """テキストから指示・依頼文を抽出"""
    sentences = split_sentences(text)
    tasks = []
    
    # 指示・依頼を示すラベル
    candidate_labels = ["指示", "依頼", "要求", "タスク", "その他"]
    
    for sentence in sentences:
        if len(sentence) < 5:  # 短すぎる文は除外
            continue
            
        # ゼロショット分類
        result = classifier(
            sentence,
            candidate_labels=candidate_labels,
            hypothesis_template="この文は{}です。"
        )
        
        # スコアが高く、指示・依頼系のラベルが上位の場合
        if result['labels'][0] in ["指示", "依頼", "要求", "タスク"] and result['scores'][0] > 0.5:
            tasks.append({
                'text': sentence,
                'score': result['scores'][0],
                'label': result['labels'][0]
            })
    
    return tasks

def highlight_pos(text):
    html = ""
    for token in tokenizer.tokenize(text):
        word = token.surface
        pos = token.part_of_speech.split(",")[0]
        color = pos_colors.get(pos, pos_colors["その他"])
        html += f'<span style="background-color:{color}; padding:2px; margin:1px; border-radius:3px;">{word}</span>'
    return html

# 初期化
if "last_seen_files" not in st.session_state:
    st.session_state.last_seen_files = set()
if "all_tasks" not in st.session_state:
    st.session_state.all_tasks = {}

st.title("📂 自動テキスト表示ビューア with タスク抽出")
st.markdown("### `text/` フォルダに新しい `.txt` ファイルを追加してください。")

# モデルのロード（初回のみ）
with st.spinner("モデルを読み込んでいます..."):
    classifier = load_classifier()

# 現在のファイル一覧を取得
current_files = {f for f in os.listdir(TEXT_DIR) if f.endswith(".txt")}
new_files = current_files - st.session_state.last_seen_files

# 新ファイルがあれば処理
if new_files:
    for file_name in sorted(new_files):
        file_path = os.path.join(TEXT_DIR, file_name)
        st.success(f"✅ 新しいファイルを検出: {file_name}")

        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()

        # タスク抽出
        with st.spinner("タスクを抽出しています..."):
            tasks = extract_tasks(text, classifier)
            if tasks:
                st.session_state.all_tasks[file_name] = tasks

        with st.expander(f"▶ {file_name} の内容"):
            st.text(text)

        st.markdown("#### 🔍 品詞ごとに色分けされた表示")
        st.markdown(highlight_pos(text), unsafe_allow_html=True)

        # 抽出されたタスクを表示
        if tasks:
            st.markdown("#### 📋 抽出されたタスク・指示")
            for i, task in enumerate(tasks):
                col1, col2 = st.columns([4, 1])
                with col1:
                    done = st.checkbox(
                        task['text'], 
                        key=f"{file_name}_task_{i}",
                        help=f"信頼度: {task['score']:.2f} ({task['label']})"
                    )
                with col2:
                    st.caption(f"信頼度: {task['score']:.1%}")

    # 新しいファイルも含めて更新
    st.session_state.last_seen_files.update(new_files)
else:
    st.info("現在、新しいファイルはありません。")

# 全体のタスクリスト表示
if st.session_state.all_tasks:
    st.markdown("---")
    st.markdown("### 📌 全体のタスクリスト")
    for file_name, tasks in st.session_state.all_tasks.items():
        with st.expander(f"📄 {file_name} のタスク"):
            for i, task in enumerate(tasks):
                st.checkbox(
                    task['text'], 
                    key=f"all_{file_name}_task_{i}",
                    help=f"信頼度: {task['score']:.2f}"
                )

# 自動リロードボタン
st.button("🔄 再読み込み（クリックで更新）")
