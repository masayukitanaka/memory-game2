# 作業記録 — 2026-04-13 / 2026-04-21

## プロジェクト概要

神経衰弱を使った言語学習アプリ。Cloudflare Workers (OpenNext) + Next.js + Supabase (REST API) + Durable Objects (WebSocket) で構成。

- **本番URL**: https://memory-game2.ursytsr.workers.dev
- **リポジトリ**: `/Users/mtanaka/Dev/WebProjects/memory-game2`

## アーキテクチャ

### フロントエンド
- Next.js (App Router, `"use client"` 中心)
- Tailwind CSS v4
- WebSocket でリアルタイム同期

### バックエンド
- Cloudflare Workers (OpenNext 経由で Next.js をホスト)
- カスタム Worker エントリ (`workers/index.ts`) — WebSocket を DO にルーティング、その他は OpenNext に委譲
- Durable Object (`workers/game-room.ts`) — ゲームルームの WebSocket ブロードキャスト

### データベース
- Supabase (PostgreSQL) — `memory_game` スキーマ
- `@supabase/supabase-js` (HTTP/REST) で接続（`pg` は Workers 非互換）
- `SUPABASE_ANON_KEY` で認証（`service_role` は使わない）

### DB テーブル
- `memory_game.sessions` — セッション管理 (id, data, expires_at)
- `memory_game.decks` — デッキ定義 (deck_id, title, description, number_of_cards, pairs)
- `memory_game.games` — ゲーム状態 (id, deck_id, cards, players, current_player_index, status)

### RLS ポリシー
- `sessions` — `anon` ロールに全操作許可
- `decks` — `anon` ロールに SELECT 許可
- `games` — `anon` ロールに全操作許可
- `GRANT USAGE ON SCHEMA memory_game TO anon` が必要

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/decks` | デッキ一覧（DB から取得） |
| POST | `/api/games` | ゲーム作成（デッキからカード生成・シャッフル・DB保存） |
| GET | `/api/games/{game_id}` | ゲームデータ取得（カード・プレーヤー・deck_title/description含む） |
| PATCH | `/api/games/{game_id}` | ゲーム状態更新（マッチ・ターン変更・リセット） |
| POST | `/api/games/{game_id}/players` | ゲームに参加（新規追加 or 名前更新） |
| DELETE | `/api/games/{game_id}/players` | プレーヤーを退場させる |
| GET | `/api/session` | セッション情報取得 |
| PATCH | `/api/session` | セッションデータ更新（playerName等を Cookie に保存） |

## WebSocket プロトコル

DO (`GameRoom`) は以下のメッセージを全クライアントにブロードキャスト:

| メッセージ | 方向 | 内容 |
|-----------|------|------|
| `player-joined` | Client → DO → All | プレーヤー参加 / 名前変更 |
| `card-flipped` | Client → DO → All | カードをめくった |
| `cards-matched` | Client → DO → All | 2枚がマッチ (scorerSessionId付き) |
| `cards-unmatched` | Client → DO → All | マッチ失敗 (nextPlayerIndex付き) |
| `game-reset` | Client → DO → All | ゲームリセット → 全員ページ再読み込み |
| `player-removed` | Client → DO → All | プレーヤー強制退場 |
| `player-disconnected` | DO → Others | WebSocket 切断通知 |

## セッション管理

- **session_id** — Cookie で管理。middleware が `/play/*` アクセス時に発行
- **session_data** — Cookie (JSON) で playerName 等を保存
- **playerName** — `localStorage` (即時表示) + session Cookie (永続化) + DB games.players の3箇所

## 今回のセッション (2026-04-13 〜 2026-04-21) で行ったこと

### 1. プレーヤー名の編集機能
- プレーヤーバーに `"no name (You)"` 表示、名前クリックでインライン編集
- `localStorage` + session Cookie + games.players DB に保存

### 2. Supabase 接続方式の変更
- `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_ANON_KEY` に変更
- `src/lib/db.ts` を再作成（anon キー使用）
- RLS ポリシーを `anon` ロール許可に変更

### 3. セッション管理の簡素化
- DB セッション → Cookie ベースに変更（DB は使わなくなった）
- middleware から Supabase 依存を除去
- `session_data` Cookie に JSON でデータ保存
- `PATCH /api/session` で Cookie 更新 + DB にも upsert

### 4. デッキ選択（トップページ）
- `/api/decks` — DB の `memory_game.decks` テーブルから取得
- ハードコードのモックデータを削除
- タイルクリック → 確認ダイアログ → `POST /api/games` でゲーム作成 → 遷移

### 5. ゲーム作成 API
- `POST /api/games` — デッキからカード生成・シャッフル・DB保存
- カード構造: `{ id, content, pairId, side, position, isMatched }`

### 6. マルチプレイ同期 (WebSocket)
- DO (`GameRoom`) を汎用ブロードキャストに書き換え
- カードクリック → WS 送信のみ（ローカル state 直接変更しない）
- WS メッセージ受信で状態更新（唯一の真のソース）
- ターン管理: 自分のターンでないとクリック不可

### 7. プレーヤー管理
- `POST /api/games/{game_id}/players` — ゲーム参加、DB の games.players を更新
- `DELETE /api/games/{game_id}/players` — プレーヤー強制退場
- 他プレーヤー名の右に × ボタン → 確認ダイアログ → 退場

### 8. ゲーム状態の永続化
- マッチ時 / ターン変更時に `PATCH /api/games/{game_id}` で DB 更新
- リロード時に DB からカード状態・スコア・ターンを復元
- ページ読み込み2秒後に DB と同期（race condition 対策）

### 9. ゲームリセット
- トップバーに "Reset" ボタン → 確認ダイアログ
- DB でカード全 facedown + シャッフル + プレーヤーリスト空 + status "active"
- WS で `game-reset` → 全員 `window.location.reload()`
- "Play Again" も同じリセットフローを使用

### 10. UI / ブランディング
- アプリ名を「Tactile Mind」→「Memory Game」に変更
- `public/logo.png` をナビバーに表示
- `public/logo_transparent.png` から `favicon.ico` 生成 (16/32/48px)
- `npm run dev` をポート 8787 に変更
- `npm run typecheck:watch` スクリプト追加
- デッキ表示に `decks.title` カラムを使用（deck_id の replace をやめた）
- ゲーム画面にデッキ title（大きめ）と description を表示
- 「Share this URL to invite others to play!」表示 + 🔗 クリックで URL コピー + "Copied!" トースト

### 11. デプロイ
- `wrangler.jsonc` の `new_classes` → `new_sqlite_classes` に変更（Free プラン対応）
- `https://memory-game2.ursytsr.workers.dev` にデプロイ成功
- 本番シークレット: `wrangler secret put SUPABASE_URL` / `wrangler secret put SUPABASE_ANON_KEY`

## ファイル構成（主要ファイル）

```
src/
├── app/
│   ├── page.tsx                              — トップページ（デッキ選択）
│   ├── layout.tsx                            — ルートレイアウト
│   ├── globals.css                           — グローバルCSS
│   ├── api/
│   │   ├── decks/route.ts                    — GET /api/decks
│   │   ├── games/
│   │   │   ├── route.ts                      — POST /api/games
│   │   │   └── [game_id]/
│   │   │       ├── route.ts                  — GET/PATCH /api/games/{id}
│   │   │       └── players/route.ts          — POST/DELETE /api/games/{id}/players
│   │   └── session/route.ts                  — GET/PATCH /api/session
│   └── play/[deck_id]/[game_id]/
│       ├── layout.tsx                        — セッション ID を data 属性で公開
│       └── page.tsx                          — ゲーム画面（メインUI）
├── lib/
│   ├── db.ts                                 — Supabase クライアント (anon key)
│   └── session.ts                            — セッション Cookie 読み取り
└── middleware.ts                              — /play/* でセッション Cookie 発行

workers/
├── index.ts                                  — カスタム Worker エントリ
└── game-room.ts                              — Durable Object (WebSocket ブロードキャスト)

database/
├── create_tables.sql                         — テーブル定義 (sessions, decks, games)
└── nihongo_decks.sql                         — デッキ初期データ

public/
├── logo.png                                  — アプリロゴ
├── logo_transparent.png                      — 透過ロゴ
└── favicon.ico                               — ファビコン
```

## 環境変数 (.dev.vars)

```
NEXTJS_ENV=development
DATABASE_URL=...          # 未使用（将来のマイグレーション用）
DIRECT_URL=...            # 未使用（将来のマイグレーション用）
SUPABASE_URL=https://lzjwwreojnkencgmfmap.supabase.co
SUPABASE_ANON_KEY=...     # Supabase anon (public) key
```

## 技術的な注意点

- **Cloudflare Workers では `pg` が使えない** — TCP ソケット非対応。`@supabase/supabase-js`（HTTP/REST）を使用
- **`workers/` は tsconfig.json で exclude** — Next.js ビルドは exclude を無視する場合がある。`@ts-ignore` で対処
- **Durable Object のローカル開発** — `wrangler dev` では internal DO に警告が出るが動作はする。`next dev` 単体では WebSocket は動作しない
- **Free プランの DO** — `new_sqlite_classes` マイグレーションが必須
- **DB スキーマ変更は手動** — `database/*.sql` を Supabase SQL Editor で実行
- **Supabase `memory_game` スキーマ** — API (PostgREST) の Exposed schemas に追加が必要

## 残っている課題・今後やること

### 機能改善
- Supabase の型生成（`npx supabase gen types`）で `@ts-ignore` を解消
- WebSocket 切断時の再接続ロジック
- ゲーム完了時に games.status を DB に反映（現在 PATCH で対応済みだが、全マッチ判定の確認）
- モバイル対応の調整（カードグリッドのレスポンシブ）

### インフラ
- `DATABASE_URL` / `DIRECT_URL` は現在未使用。将来マイグレーションツール導入時に使用予定
- `data/decks.json` はもう使われていない（DB に移行済み）。削除可能
