export const dynamic = "force-dynamic"

import { supabaseAdmin } from "../../lib/supabase"

async function getPositions() {
  const portfolioId = process.env.DEFAULT_PORTFOLIO_ID ?? "11111111-1111-1111-1111-111111111111"
  const { data } = await supabaseAdmin
    .from("positions")
    .select("id,product_name,product_type,currency,notional,issuer,status,opened_at,maturity_at")
    .eq("portfolio_id", portfolioId)
    .order("opened_at", { ascending: false })

  return data ?? []
}

export default async function PositionsPage() {
  const positions = await getPositions()

  return (
    <main style={{ padding: 24 }}>
      <h1>Positions</h1>
      <table cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th align="left">Product Name</th>
            <th align="left">Product Type</th>
            <th align="left">Currency</th>
            <th align="left">Notional</th>
            <th align="left">Issuer</th>
            <th align="left">Status</th>
            <th align="left">Opened At</th>
            <th align="left">Maturity At</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id}>
              <td>{p.product_name}</td>
              <td>{p.product_type}</td>
              <td>{p.currency}</td>
              <td>{p.notional}</td>
              <td>{p.issuer}</td>
              <td>{p.status}</td>
              <td>{p.opened_at}</td>
              <td>{p.maturity_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
