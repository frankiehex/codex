export const dynamic = "force-dynamic"

import { supabaseAdmin } from "../../lib/supabase"

async function getFcnList() {
  const portfolioId = process.env.DEFAULT_PORTFOLIO_ID ?? "11111111-1111-1111-1111-111111111111"
  const { data } = await supabaseAdmin
    .from("positions")
    .select("id,product_name,structured_products(coupon_pa,strike_pct,ko_barrier_pct,observation_freq),underlyings(ticker)")
    .eq("portfolio_id", portfolioId)
    .eq("product_type", "fcn")

  return data ?? []
}

export default async function FcnPage() {
  const rows = await getFcnList()

  return (
    <main style={{ padding: 24 }}>
      <h1>FCN Monitor</h1>
      <table cellPadding={8}>
        <thead>
          <tr>
            <th>Product Name</th><th>Coupon</th><th>Strike</th><th>KO</th><th>Observation Frequency</th><th>Worst Of</th><th>Risk Level</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.id}>
              <td>{r.product_name}</td>
              <td>{r.structured_products?.coupon_pa ?? "-"}</td>
              <td>{r.structured_products?.strike_pct ?? "-"}</td>
              <td>{r.structured_products?.ko_barrier_pct ?? "-"}</td>
              <td>{r.structured_products?.observation_freq ?? "-"}</td>
              <td>{(r.underlyings ?? []).map((u: any) => u.ticker).join(", ") || "-"}</td>
              <td>TODO</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
