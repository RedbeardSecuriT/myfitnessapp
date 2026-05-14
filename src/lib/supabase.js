import { createClient } from '@supabase/supabase-js'

export const BACKEND_URL = 'https://japan2026-backend-production.up.railway.app'

export const supabase = createClient(
  'https://qzbhlymownmhbljliqdj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6YmhseW1vd25taGJsamxpcWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzMwMDgsImV4cCI6MjA5Mzg0OTAwOH0.CyikHG8Lo-4u8h6mOxX4d-7fIjq-T1UTD2gwWPdYkb4',
  { auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } }
)
