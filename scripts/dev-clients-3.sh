#!/usr/bin/env sh
set -eu

# 一次性启动本机联调客户端 1 + 2 + 3；Ctrl+C 会向本脚本拉起的子进程发退出信号。
SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd "$SCRIPT_DIR/.." && pwd)
cd "$ROOT_DIR"

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  echo "用法：npm run dev:3"
  echo "一次性启动客户端 1 + 2 + 3。只需要两个时用 npm run dev:2。"
  exit 0
fi

PIDS=""

cleanup() {
  if [ -n "$PIDS" ]; then
    kill $PIDS 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

echo "一次性启动茶话间客户端 1 + 2 + 3。按 Ctrl+C 结束。"
sh "$SCRIPT_DIR/dev-client-1.sh" &
PIDS="$PIDS $!"
sleep 1
sh "$SCRIPT_DIR/dev-client-2.sh" &
PIDS="$PIDS $!"
sleep 1
sh "$SCRIPT_DIR/dev-client-3.sh" &
PIDS="$PIDS $!"

wait
