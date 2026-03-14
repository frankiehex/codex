import { z } from "zod"

export const addInvestmentSchema = z.object({
  portfolio_id: z.string().uuid(),
  product_type: z.string(),
  product_name: z.string(),
  currency: z.string(),
  notional: z.number(),
  issuer: z.string().optional(),
  opened_at: z.string(),
  maturity_at: z.string(),
  notes: z.string().optional()
})

export const updatePositionStatusSchema = z.object({
  position_id: z.string().uuid(),
  status: z.string(),
  notes: z.string().optional()
})
