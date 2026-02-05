// Supabase ক্লায়েন্ট ইনিশিয়ালাইজেশন
const SUPABASE_URL = 'https://bemicqizbasldpdwglyu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbWljcWl6YmFzbGRwZHdnbHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDY1ODUsImV4cCI6MjA4NTg4MjU4NX0.PudPE1RG_BW-Z6kxBYn7TtpPalpVAE9osCCQGyqUaeI';

// CDN থেকে আসা global 'supabase' object ব্যবহার করে client তৈরি করা হচ্ছে
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// অথেন্টিকেশন চেক ফাংশন
async function checkAuth() {
    const { data: { user }, error } = await _supabase.auth.getUser();
    
    if (error || !user) {
        if (!window.location.href.includes('/login/') && !window.location.href.includes('/signup/')) {
            const isRoot = !window.location.pathname.includes('/billing/') && 
                           !window.location.pathname.includes('/orders/') && 
                           !window.location.pathname.includes('/vendors/') && 
                           !window.location.pathname.includes('/admin/');
            const prefix = isRoot ? './' : '../';
            window.location.href = prefix + 'login/index.html';
        }
        return null;
    }
    return user;
}
