// supabase.js — This connects our app to the Supabase database

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://pxlaghpewiewiezsimpl.supabase.co' // 👈 URL
const SUPABASE_KEY = 'sb_publishable_m8A7OXF5qGE5Onp5ZEubjg_kufawRoy' // 👈publishable key

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)