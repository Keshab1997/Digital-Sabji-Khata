const SUPABASE_URL = 'https://bemicqizbasldpdwglyu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbWljcWl6YmFzbGRwZHdnbHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDY1ODUsImV4cCI6MjA4NTg4MjU4NX0.PudPE1RG_BW-Z6kxBYn7TtpPalpVAE9osCCQGyqUaeI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session && !window.location.pathname.includes('login')) {
    window.location.href = '/login/';
  }
  return session;
}
