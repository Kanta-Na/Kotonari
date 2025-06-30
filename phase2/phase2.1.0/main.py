
import streamlit as st
from janome.tokenizer import Tokenizer      # <-- janome: Pythonの形態素分析ライブラリ

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
        part_of_speech = token.part_of_speech.split(",")[0]
        color = pos_colors.get(part_of_speech, pos_colors["その他"])
        html += f'<span style="background-color:{color}; padding:2px; margin:1px; border-radius:3px;">{word}</span>'
    return html

# Streamlit アプリUI
st.title("📂 テキストファイル解析ビューア（Janome版）")

uploaded_file = st.file_uploader("テキストファイルをドロップしてください (.txt)", type="txt")

if uploaded_file is not None:
    text = uploaded_file.read().decode("utf-8")
    st.success("✅ 入力が確認されました。")
    
    with st.expander("▶ テキストファイルの内容"):
        st.text(text)
    
    st.markdown("### 🔍 品詞ごとに色分けされた表示")
    st.markdown(highlight_pos(text), unsafe_allow_html=True)
