document.addEventListener("DOMContentLoaded", function() {
    const isRoot = !window.location.pathname.includes('/billing/') && 
                   !window.location.pathname.includes('/orders/') && 
                   !window.location.pathname.includes('/vendors/') && 
                   !window.location.pathname.includes('/admin/') &&
                   !window.location.pathname.includes('/login/');
                   
    const prefix = isRoot ? './' : '../';

    if(window.location.href.includes('login')) return;

    const navbar = `
    <div class="mobile-nav no-print" style="position: fixed; bottom: 0; width: 100%; background: white; border-top: 1px solid #ddd; display: flex; justify-content: space-around; padding: 10px 0; z-index: 1000; box-shadow: 0 -2px 10px rgba(0,0,0,0.05);">
        <a href="${prefix}index.html" style="text-align: center; text-decoration: none; color: var(--secondary); font-size: 12px;">📊<br>Home</a>
        <a href="${prefix}billing/index.html" style="text-align: center; text-decoration: none; color: var(--secondary); font-size: 12px;">📝<br>Bill</a>
        <a href="${prefix}orders/index.html" style="text-align: center; text-decoration: none; color: var(--secondary); font-size: 12px;">📞<br>Order</a>
        <a href="${prefix}admin/index.html" style="text-align: center; text-decoration: none; color: var(--secondary); font-size: 12px;">⚙️<br>Admin</a>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', navbar);
});

async function handleLogout() {
    await _supabase.auth.signOut();
    window.location.href = '../login/index.html';
}
