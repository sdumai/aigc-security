#!/bin/bash

# 远程服务器信息
REMOTE_HOST="10.102.32.144"
REMOTE_USER="lab426"
REMOTE_PORT="22"
REMOTE_DIR="~/aigc-security-platform"

echo "🚀 开始部署到远程服务器..."

# 1. 创建远程目录
echo "📁 创建远程目录..."
sshpass -p "426" ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_DIR}"

# 2. 上传dist文件夹
echo "📦 上传构建文件..."
sshpass -p "426" scp -o StrictHostKeyChecking=no -r dist/* ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

# 3. 上传package.json
echo "📦 上传package.json..."
sshpass -p "426" scp -o StrictHostKeyChecking=no package.json ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

# 4. 在远程服务器上启动服务
echo "🔧 配置并启动服务..."
sshpass -p "426" ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd ~/aigc-security-platform

# 检查是否已经安装了http-server
if ! command -v http-server &> /dev/null; then
    echo "安装 http-server..."
    npm install -g http-server
fi

# 杀死已存在的tmux会话
tmux kill-session -t aigc-security 2>/dev/null || true

# 创建新的tmux会话并启动服务
tmux new-session -d -s aigc-security "http-server . -p 53177 -a 0.0.0.0"

echo "✅ 服务已在tmux会话 'aigc-security' 中启动"
echo "📡 访问地址: http://10.102.32.144:53177"
ENDSSH

echo "✅ 部署完成！"
echo "🌐 访问地址: http://10.102.32.144:53177"
echo "📋 查看服务: ssh lab426@10.102.32.144 'tmux attach -t aigc-security'"




