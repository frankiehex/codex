import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321"
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "public-anon-key"
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "service-role-key"

export const supabase = createClient(url, anonKey)
export const supabaseAdmin = createClient(url, serviceRole)
