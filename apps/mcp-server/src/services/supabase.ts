import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_PROJECT_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321"
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "service-role-key"

export const supabaseAdmin = createClient(url, serviceRole)
