#!/bin/bash

OWNER="vuejs"
REPO="core"
COMMIT_ID="d9bd436b1aad354e06bcc9d0f9138fbb8eedc7cf"
TARGET_DIR="repo-src"


if !command -v pnpm &> /dev/null; then
  echo "❌ pnpm 未安装，请先安装 pnpm"
  exit 1
fi


echo "⬇️ 下载 $OWNER/$REPO 的 commit $COMMIT_ID..."
curl -L "https://github.com/$OWNER/$REPO/tarball/$COMMIT_ID" -o source.tar.gz

if [ $? -ne 0 ]; then
  echo "❌ 下载失败"
  exit 1
fi


mkdir -p "$TARGET_DIR"
tar -xzf source.tar.gz --strip-components=1 -C "$TARGET_DIR"

# === 进入项目目录 ===
cd "$TARGET_DIR" || exit

# === 修改 package.json ===
echo "🛠 正在修改 package.json..."
jq '.scripts.postinstall = "echo Running Custom Test && exit 0"' package.json > package.tmp.json && mv package.tmp.json package.json

node ../pre.mjs || { echo "❌ 修改 vitest.config.ts 失败"; exit 1; }



#cd "$TARGET_DIR" || exit

echo "📦 安装依赖..."
pnpm install || { echo "❌ 安装失败"; exit 1; }

echo "✅ 开始运行测试..."
pnpm test-coverage

node ../report-coverage.js || { echo "❌ 修改 上报失败 失败"; exit 1; }


## === 清理 ===
#echo "🧹 清理临时文件..."
#cd ..
#rm -rf "$TARGET_DIR" "$TARBALL"
#
#echo "✅ 所有操作完成并清理完毕"