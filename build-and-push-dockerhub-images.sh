#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 || -z "$1" ]]; then
  echo "用法: $0 <版本号>"
  echo "示例: $0 1.2.3"
  exit 1
fi

VERSION="$1"
IMAGE_REPOSITORY="mqh9007/ts6-manager"
PLATFORMS="linux/amd64,linux/arm64"

if [[ ! "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "错误：版本号必须是 x.y.z 格式，例如 1.2.3" >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

build_and_push() {
  local component="$1"
  local dockerfile="$2"

  docker buildx build \
    --platform "${PLATFORMS}" \
    -f "${dockerfile}" \
    --build-arg "APP_VERSION=${VERSION}" \
    -t "${IMAGE_REPOSITORY}:${component}-${VERSION}" \
    -t "${IMAGE_REPOSITORY}:${component}-latest" \
    --push \
    .
}

build_and_push frontend Dockerfile.frontend
build_and_push backend Dockerfile.backend
build_and_push sidecar Dockerfile.sidecar

echo "完成：${IMAGE_REPOSITORY} 的三个版本标签和三个 latest 标签已推送"
