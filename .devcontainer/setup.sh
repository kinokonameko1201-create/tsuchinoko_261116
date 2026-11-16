#!/usr/bin/env bash
# Codespaces 作成時に一度だけ実行される初期セットアップ
set -euo pipefail

sudo apt-get update -y
sudo apt-get install -y --no-install-recommends unzip xz-utils zip libglu1-mesa

# Flutter SDK（stable）
if [ ! -d "$HOME/flutter" ]; then
  git clone https://github.com/flutter/flutter.git -b stable --depth 1 "$HOME/flutter"
fi
export PATH="$PATH:$HOME/flutter/bin"

flutter config --no-analytics --enable-web
flutter precache --web

# app/ に Flutter の足りない雛形（web/ など）を生成。既存の lib/main.dart 等は上書きしない
cd app
flutter create --platforms web --project-name tsuchinoko_app --org jp.tsuchinoko .
flutter pub get

flutter doctor
