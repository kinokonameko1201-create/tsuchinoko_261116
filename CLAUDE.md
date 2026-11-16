# tsuchinoko（大根 収穫適期判定アプリ）

## 目的
Figma で作った UI デザインを、Flutter Web + Material 3 で実装する。

## 構成
- `app/` … Flutter プロジェクト（Web のみ）。テーマは `app/lib/theme.dart`（シード色 #4D6B30、フォント Noto Sans JP）
- `index.html` / `app.js` / `styles.css` / `data.js` … 以前の HTML プロトタイプ（画面構成・配色の参考。編集しない）
- `.devcontainer/` … Codespaces 用。初回作成時に `setup.sh` が Flutter を `~/flutter` に入れる

## 開発環境の前提
- 作業は GitHub Codespaces 上で行う。ユーザーの Windows PC は組織の Device Guard が dart.exe をブロックするため、ローカルでは Flutter を実行できない
- 起動: `cd app && flutter run -d web-server --web-port 8080 --web-hostname 0.0.0.0`（ポート 8080 が転送される）
- ユーザーは Git / ターミナル操作に不慣れ。コマンドは極力こちらで実行し、ユーザーにはクリック操作だけを案内する

## 進め方
- Figma のフレーム URL を受け取ったら、Figma MCP（figma-design-to-code スキル）で読み取り、既存テーマ・M3 コンポーネントに合わせて実装する
- 実装後はビルドして画面を確認してから報告する
