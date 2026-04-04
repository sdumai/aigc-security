#!/bin/bash
cd ~/aigc-security-platform
tmux kill-session -t aigc-security 2>/dev/null || true
tmux new-session -d -s aigc-security
tmux send-keys -t aigc-security "cd ~/aigc-security-platform" C-m
tmux send-keys -t aigc-security "http-server . -p 53177 -a 0.0.0.0" C-m
echo "✅ 服务已启动"
echo "📡 访问地址: http://10.102.32.144:53177"
echo "📋 查看服务: tmux attach -t aigc-security"




