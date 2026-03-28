#!/bin/bash
# 后端独立部署脚本（与 快速部署.sh 完全独立，不修改前端部署流程）
# 将 Node 后端部署到 10.102.32.144:3001，供已部署的前端（5670）请求 API
# 使用：chmod +x deploy-backend.sh && ./deploy-backend.sh

echo "🚀 开始部署 AIGC 安全平台后端..."

if [ ! -f "server/index.cjs" ]; then
    echo "❌ 未找到 server/index.cjs，请在项目根目录执行"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ 未找到 package.json"
    exit 1
fi

if ! command -v expect &> /dev/null; then
    echo "❌ expect 未安装，请先安装: brew install expect"
    exit 1
fi

./deploy-backend.exp

if [ $? -eq 0 ]; then
    echo ""
    echo "📌 若前端尚未用生产 API 地址构建，请重新构建并部署前端一次："
    echo "   npm run build   # 会读取 .env.production 中的 VITE_API_BASE"
    echo "   ./快速部署.sh"
fi
