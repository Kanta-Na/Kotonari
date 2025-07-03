#!/bin/bash

# KotoLab全サービスセットアップスクリプト

echo "======================================"
echo "KotoLab Integrated System Setup"
echo "======================================"

# カラー出力の設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# スクリプトのディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# エラーチェック関数
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

# 1. 必要なツールの確認
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

# Node.jsの確認
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js is installed ($NODE_VERSION)${NC}"
else
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Python3の確認
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python is installed ($PYTHON_VERSION)${NC}"
else
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

# ffmpegの確認
if command -v ffmpeg &> /dev/null; then
    echo -e "${GREEN}✅ ffmpeg is installed${NC}"
else
    echo -e "${YELLOW}⚠️  ffmpeg is not installed${NC}"
    echo "Installing ffmpeg..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install ffmpeg
    else
        sudo apt-get update && sudo apt-get install -y ffmpeg
    fi
    check_status "ffmpeg installation"
fi

# 2. ディレクトリ構造の確認
echo -e "\n${YELLOW}Checking directory structure...${NC}"

REQUIRED_DIRS=("KotoLab01" "kotonari_transcripts" "whisper_transcriber")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$SCRIPT_DIR/$dir" ]; then
        echo -e "${GREEN}✅ Found $dir${NC}"
    else
        echo -e "${RED}❌ Directory $dir not found${NC}"
        exit 1
    fi
done

# 3. KotoLab01のセットアップ
echo -e "\n${YELLOW}Setting up KotoLab01...${NC}"
cd "$SCRIPT_DIR/KotoLab01"

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    check_status "KotoLab01 npm install"
else
    echo -e "${GREEN}✅ KotoLab01 dependencies already installed${NC}"
fi

# 4. Whisper Transcriberのセットアップ
echo -e "\n${YELLOW}Setting up Whisper Transcriber...${NC}"
cd "$SCRIPT_DIR/whisper_transcriber"

# セットアップスクリプトがある場合は実行
if [ -f "setup.sh" ]; then
    chmod +x setup.sh
    ./setup.sh
    check_status "Whisper Transcriber setup"
else
    # 手動セットアップ
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        check_status "Whisper Transcriber manual setup"
    else
        echo -e "${GREEN}✅ Whisper Transcriber already set up${NC}"
    fi
fi

# 5. Kotonari Transcriptsのセットアップ
echo -e "\n${YELLOW}Setting up Kotonari Transcripts...${NC}"
cd "$SCRIPT_DIR/kotonari_transcripts"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    check_status "Kotonari Transcripts setup"
else
    echo -e "${GREEN}✅ Kotonari Transcripts already set up${NC}"
fi

# textディレクトリの作成
mkdir -p text
echo -e "${GREEN}✅ Created text directory${NC}"

# 6. 環境変数ファイルの確認
echo -e "\n${YELLOW}Checking environment files...${NC}"

# Kotonari Transcriptsの.env確認
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ kotonari_transcripts/.env not found${NC}"
    echo "Please create .env file with your LINE credentials:"
    echo "  LINE_CHANNEL_ID=your_channel_id"
    echo "  LINE_CHANNEL_SECRET=your_channel_secret"
    echo "  LINE_CHANNEL_ACCESS_TOKEN=your_access_token"
    echo "  LINE_TARGET_USER_ID=your_user_id"
else
    echo -e "${GREEN}✅ Found kotonari_transcripts/.env${NC}"
fi

# 7. 起動スクリプトの実行権限付与
echo -e "\n${YELLOW}Setting up launch scripts...${NC}"
cd "$SCRIPT_DIR"

if [ -f "start.sh" ]; then
    chmod +x start.sh
    echo -e "${GREEN}✅ start.sh is executable${NC}"
fi

if [ -f "launcher.py" ]; then
    chmod +x launcher.py
    echo -e "${GREEN}✅ launcher.py is executable${NC}"
fi

# 8. PM2のインストール（オプション）
echo -e "\n${YELLOW}Optional: Install PM2 for process management?${NC}"
read -p "Install PM2? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install -g pm2
    check_status "PM2 installation"
    
    # PM2設定ファイルの作成
    cat > "$SCRIPT_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: "KotoLab01",
      cwd: "./KotoLab01",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "WhisperTranscriber",
      cwd: "./whisper_transcriber",
      script: "./venv/bin/python",
      args: "transcriber.py",
      interpreter: "none"
    },
    {
      name: "KotonariTranscripts",
      cwd: "./kotonari_transcripts",
      script: "./venv/bin/python",
      args: "main.py",
      interpreter: "none"
    }
  ]
};
EOF
    echo -e "${GREEN}✅ Created PM2 ecosystem.config.js${NC}"
fi

# 完了メッセージ
echo -e "\n${GREEN}======================================"
echo "✨ Setup completed successfully!"
echo "======================================${NC}"
echo ""
echo "To start all services, run one of:"
echo "  1. ./start.sh          (Shell script)"
echo "  2. python launcher.py  (Python script)"
if [ -f "ecosystem.config.js" ]; then
    echo "  3. pm2 start ecosystem.config.js  (PM2)"
fi
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "Make sure to create kotonari_transcripts/.env with your LINE credentials!"
echo ""