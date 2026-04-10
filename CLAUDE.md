# CLAUDE.md
 
## サーバの起動・停止
 
サーバの起動・停止は人間が行う。Claude が勝手に `npm run dev` や `wrangler dev` などのサーバ起動・停止コマンドを実行しないこと。
 
## 環境変数ファイル
 
Cloudflare Workers を使用しているため、環境変数は `.env.*` ファイルではなく `.dev.vars` を使用する。`.env`、`.env.local`、`.env.development` などのファイルは作成しないこと。
 