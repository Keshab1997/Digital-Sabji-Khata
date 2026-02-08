// Supabase ক্লায়েন্ট ইনিশিয়ালাইজেশন
const SUPABASE_URL = 'https://bemicqizbasldpdwglyu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbWljcWl6YmFzbGRwZHdnbHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDY1ODUsImV4cCI6MjA4NTg4MjU4NX0.PudPE1RG_BW-Z6kxBYn7TtpPalpVAE9osCCQGyqUaeI';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAuth() {
    const { data: { user }, error } = await _supabase.auth.getUser();
    
    if (error || !user) {
        const path = window.location.pathname;
        if (!path.includes('/login/') && !path.includes('/signup/')) {
            const segments = path.split('/').filter(s => s.length > 0);
            const repoName = 'Digital-Sabji-Khata';
            const repoIndex = segments.indexOf(repoName);
            const depth = segments.length - 1 - repoIndex;
            
            let prefix = '';
            if (depth <= 0) {
                prefix = './';
            } else {
                for (let i = 0; i < depth; i++) prefix += '../';
            }
            
            window.location.href = prefix + 'login/index.html';
        }
        return null;
    }
    return user;
}
