
import streamlit as st
from janome.tokenizer import Tokenizer
import os
import time

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

st.title("📂 自動テキスト表示ビューア（Phase2.1.1）")
st.markdown("### `text/` フォルダに新しい `.txt` ファイルを追加してください。")

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

        with st.expander(f"▶ {file_name} の内容"):
            st.text(text)

        st.markdown("#### 🔍 品詞ごとに色分けされた表示")
        st.markdown(highlight_pos(text), unsafe_allow_html=True)

    # 新しいファイルも含めて更新
    st.session_state.last_seen_files.update(new_files)
else:
    st.info("現在、新しいファイルはありません。")

# 自動リロードボタン
st.button("🔄 再読み込み（クリックで更新）")
