# CLAUDE.md
 
# 本アプリ

Cloudflare の Nextjs テンプレートで作成しました。
神経衰弱を使った言語学習アプリを目指します。

## サーバの起動・停止
 
サーバの起動・停止は人間が行う。Claude が勝手に `npm run dev` や `wrangler dev` などのサーバ起動・停止コマンドを実行しないこと。
 
## 環境変数ファイル
 
Cloudflare Workers を使用しているため、環境変数は `.env.*` ファイルではなく `.dev.vars` を使用する。`.env`、`.env.local`、`.env.development` などのファイルは作成しないこと。

## ターゲット

全世界の日本語学習者。初心者も分かるようにUIは英語で統一する。

