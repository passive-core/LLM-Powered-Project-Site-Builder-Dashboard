import { createClient } from '@supabase/supabase-js'

// Supabase client - expects SUPABASE_URL and SUPABASE_KEY to be set in env/secrets
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase