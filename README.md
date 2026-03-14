# Franklin Investment OS

Franklin Investment OS 是可部署的投資管理 MVP，使用 Next.js + Supabase，提供投資部位、交易、結構型商品與報表 API。

## Setup
1. 複製 `.env.example` 為 `.env.local`
2. 填入 Supabase / OpenAI / Cron 等環境變數
3. 於 Supabase SQL Editor 執行 `supabase/migrations/0001_initial.sql`
4. 執行 `supabase/seed.sql` 匯入測試資料
5. 執行 `pnpm install`
6. 執行 `pnpm dev`

## Environment Variables
請參考 `.env.example`：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_URL`
- `MCP_INTERNAL_TOKEN`
- `OPENAI_API_KEY`
- `VERCEL_CRON_SECRET`
- `DEFAULT_PORTFOLIO_ID`
- `RESEND_API_KEY`
- `REPORT_EMAIL_TO`

## Local Run
```bash
pnpm install
pnpm dev
```

## Deploy (Vercel)
1. 將 repo 匯入 Vercel
2. Build 目標設定 `apps/web`
3. 加入所有 `.env.example` 變數
4. Deploy

## API Test Examples
```bash
curl -X POST http://localhost:3000/api/investments \
  -H 'content-type: application/json' \
  -d '{"portfolio_id":"11111111-1111-1111-1111-111111111111","product_type":"fcn","product_name":"Nomura AI Basket FCN","currency":"USD","notional":500000}'

curl -X POST http://localhost:3000/api/structured-products \
  -H 'content-type: application/json' \
  -d '{"position_id":"22222222-2222-2222-2222-222222222222","structure_type":"fcn","coupon_pa":12,"strike_pct":72.05,"ko_barrier_pct":92,"observation_freq":"monthly","tenor_months":4,"memory_coupon":true,"denomination":500000,"settlement_currency":"USD"}'

curl -X POST http://localhost:3000/api/transactions \
  -H 'content-type: application/json' \
  -d '{"portfolio_id":"11111111-1111-1111-1111-111111111111","position_id":"22222222-2222-2222-2222-222222222222","txn_type":"coupon","amount":20000,"currency":"USD"}'

curl -X POST http://localhost:3000/api/reports/daily \
  -H 'content-type: application/json' \
  -d '{"portfolio_id":"11111111-1111-1111-1111-111111111111","report_date":"2026-03-14"}'
```

## TODO
- MCP server runtime wiring (transport/auth integration)
- OCR parser
- WhatsApp webhook
- Market data integration and FCN risk engine
- Email delivery with Resend
