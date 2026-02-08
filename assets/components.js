document.addEventListener("DOMContentLoaded", async function() {
    const isRoot = !window.location.pathname.includes('/billing/') && 
                   !window.location.pathname.includes('/orders/') && 
                   !window.location.pathname.includes('/vendors/') && 
                   !window.location.pathname.includes('/admin/') &&
                   !window.location.pathname.includes('/bill-history/') &&
                   !window.location.pathname.includes('/payment-history/') &&
                   !window.location.pathname.includes('/login/');
                   
    const prefix = isRoot ? './' : '../';

    if(window.location.href.includes('login') || window.location.href.includes('signup')) return;

    const { data: { user } } = await _supabase.auth.getUser();
    const isSuperAdmin = user && user.email === 'keshabsarkar2018@gmail.com';

    const adminLink = isSuperAdmin 
        ? `<a href="${prefix}admin/index.html" class="nav-item"><div class="nav-icon">⚙️</div><div class="nav-label">Admin</div></a>` 
        : `<a href="${prefix}admin/index.html" class="nav-item"><div class="nav-icon">⚙️</div><div class="nav-label">Settings</div></a>`;

    const navbar = `
    <style>
        .mobile-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 4px calc(8px + env(safe-area-inset-bottom));
            z-index: 1000;
            box-shadow: 0 -8px 32px rgba(30, 60, 114, 0.4);
            border-top: 1px solid rgba(255,255,255,0.1);
            overflow-x: auto;
        }
        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: white;
            padding: 6px 4px;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 48px;
            flex: 1;
            max-width: 70px;
            position: relative;
        }
        .nav-item:active {
            transform: translateY(-4px) scale(1.05);
            background: rgba(255,255,255,0.25);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .nav-item::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 16px;
            padding: 1px;
            background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0));
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            opacity: 0;
            transition: opacity 0.3s;
        }
        .nav-item:active::before {
            opacity: 1;
        }
        .nav-icon {
            font-size: 22px;
            margin-bottom: 2px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            transition: transform 0.3s;
        }
        .nav-item:active .nav-icon {
            transform: scale(1.15);
        }
        .nav-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            white-space: nowrap;
        }
        .nav-item.logout {
            color: #ffe0e0;
        }
        .nav-item.logout:active {
            background: rgba(255,100,100,0.3);
        }
    </style>
    <div class="mobile-nav no-print">
        <a href="${prefix}index.html" class="nav-item"><div class="nav-icon">📊</div><div class="nav-label">Home</div></a>
        <a href="${prefix}billing/index.html" class="nav-item"><div class="nav-icon">📝</div><div class="nav-label">Bill</div></a>
        <a href="${prefix}bill-history/index.html" class="nav-item"><div class="nav-icon">📜</div><div class="nav-label">History</div></a>
        <a href="${prefix}orders/index.html" class="nav-item"><div class="nav-icon">📞</div><div class="nav-label">Order</div></a>
        <a href="${prefix}vendors/index.html" class="nav-item"><div class="nav-icon">🏪</div><div class="nav-label">Vendor</div></a>
        ${adminLink}
        <a href="#" onclick="handleLogout()" class="nav-item logout"><div class="nav-icon">🚪</div><div class="nav-label">Logout</div></a>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', navbar);
});

async function handleLogout() {
    if(confirm("Are you sure you want to logout?")) {
        // Clear only app-specific localStorage (not Supabase session yet)
        localStorage.removeItem('veg_bill_draft');
        localStorage.removeItem('order_to_bill');
        localStorage.removeItem('edit_bill_id');
        localStorage.removeItem('last_saved_bill');
        
        // Sign out from Supabase
        await _supabase.auth.signOut();
        
        // Redirect to login
        const isRoot = !window.location.pathname.includes('/billing/') && 
                       !window.location.pathname.includes('/orders/') && 
                       !window.location.pathname.includes('/vendors/') && 
                       !window.location.pathname.includes('/bill-history/') && 
                       !window.location.pathname.includes('/payment-history/') && 
                       !window.location.pathname.includes('/admin/');
        const prefix = isRoot ? './' : '../';
        window.location.href = prefix + 'login/index.html';
    }
}
