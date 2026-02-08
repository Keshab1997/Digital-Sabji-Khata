document.addEventListener("DOMContentLoaded", async function() {
    const isRoot = !window.location.pathname.includes('/billing/') && 
                   !window.location.pathname.includes('/orders/') && 
                   !window.location.pathname.includes('/vendors/') && 
                   !window.location.pathname.includes('/admin/') &&
                   !window.location.pathname.includes('/bill-history/') &&
                   !window.location.pathname.includes('/login/');
                   
    const prefix = isRoot ? './' : '../';

    if(window.location.href.includes('login') || window.location.href.includes('signup')) return;

    // Check if super admin
    const { data: { user } } = await _supabase.auth.getUser();
    const isSuperAdmin = user && user.email === 'keshabsarkar2018@gmail.com';

    const adminLink = isSuperAdmin ? `<a href="${prefix}admin/index.html" style="text-align: center; text-decoration: none; color: var(--secondary); font-size: 12px;">⚙️<br>Admin</a>` : '';

    const navbar = `
    <div class="mobile-nav no-print" style="position: fixed; bottom: 0; width: 100%; background: white; border-top: 1px solid #ddd; display: flex; justify-content: space-around; padding: 10px 0; z-index: 1000; box-shadow: 0 -2px 10px rgba(0,0,0,0.05);">
        <a href="${prefix}index.html" style="text-align: center; text-decoration: none; color: var(--secondary); font-size: 12px;">📊<br>Home</a>
        <a href="${prefix}billing/index.html" style="text-align: center; text-decoration: none; color: var(--secondary); font-size: 12px;">📝<br>Bill</a>
        <a href="${prefix}bill-history/index.html" style="text-align: center; text-decoration: none; color: var(--secondary); font-size: 12px;">📜<br>History</a>
        <a href="${prefix}orders/index.html" style="text-align: center; text-decoration: none; color: var(--secondary); font-size: 12px;">📞<br>Order</a>
        <a href="${prefix}vendors/index.html" style="text-align: center; text-decoration: none; color: var(--secondary); font-size: 12px;">🏪<br>Vendor</a>
        ${adminLink}
        <a href="#" onclick="handleLogout()" style="text-align: center; text-decoration: none; color: #e74c3c; font-size: 12px;">🚪<br>Logout</a>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', navbar);
});

async function handleLogout() {
    if(confirm("Are you sure you want to logout?")) {
        await _supabase.auth.signOut();
        const isRoot = !window.location.pathname.includes('/billing/') && 
                       !window.location.pathname.includes('/orders/') && 
                       !window.location.pathname.includes('/vendors/') && 
                       !window.location.pathname.includes('/bill-history/') && 
                       !window.location.pathname.includes('/admin/');
        const prefix = isRoot ? './' : '../';
        window.location.href = prefix + 'login/index.html';
    }
}
