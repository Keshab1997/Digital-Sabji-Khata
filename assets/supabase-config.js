// Supabase ক্লায়েন্ট ইনিশিয়ালাইজেশন
const { createClient } = supabase;

// আপনার Supabase ড্যাশবোর্ড থেকে এই দুটি কি (Key) কপি করে বসান
const SUPABASE_URL = 'https://bemicqizbasldpdwglyu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbWljcWl6YmFzbGRwZHdnbHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDY1ODUsImV4cCI6MjA4NTg4MjU4NX0.PudPE1RG_BW-Z6kxBYn7TtpPalpVAE9osCCQGyqUaeI';

const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// অথেন্টিকেশন চেক ফাংশন
async function checkAuth() {
    const { data: { user } } = await _supabase.auth.getUser();
    
    // যদি ইউজার লগইন না থাকে এবং বর্তমান পেজটি লগইন পেজ না হয়
    if (!user && !window.location.href.includes('/login/')) {
        // ডিরেক্টরি অনুযায়ী রিডাইরেক্ট পাথ ঠিক করা
        const path = window.location.pathname.includes('/') ? '../login/index.html' : './login/index.html';
        window.location.href = path;
    }
    return user;
}
