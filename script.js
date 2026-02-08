async function init() {
    const licenseCheck = await checkLicense();
    if (!licenseCheck || !licenseCheck.isValid) return;

    const user = licenseCheck.user;
    await loadDashboard(user);
    await logActivity('Dashboard viewed');
}

async function loadDashboard(user) {
    // Load profile
    const { data: profile } = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if(profile) {
        document.getElementById('shopName').innerText = profile.shop_name || 'VegBill Pro';
    }

    // Load all bills
    const { data: bills } = await _supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBills = bills?.filter(b => {
        const billDate = new Date(b.created_at);
        billDate.setHours(0, 0, 0, 0);
        return billDate.getTime() === today.getTime();
    }) || [];

    const todayAmount = todayBills.reduce((sum, b) => sum + b.total_amount, 0);

    // Calculate this month's stats
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthBills = bills?.filter(b => new Date(b.created_at) >= thisMonth) || [];
    const monthAmount = monthBills.reduce((sum, b) => sum + b.total_amount, 0);

    // Load vendors for total due
    const { data: vendors } = await _supabase
        .from('vendors')
        .select('total_due')
        .eq('user_id', user.id);

    const totalDue = vendors?.reduce((sum, v) => sum + (v.total_due || 0), 0) || 0;

    // Update stats
    document.getElementById('todayBills').innerText = todayBills.length;
    document.getElementById('todayAmount').innerText = `₹${todayAmount.toFixed(0)}`;
    document.getElementById('monthAmount').innerText = `₹${monthAmount.toFixed(0)}`;
    document.getElementById('totalDue').innerText = `₹${totalDue.toFixed(0)}`;

    // Display recent bills (last 5)
    displayRecentBills(bills?.slice(0, 5) || []);

    // Display top vendors by due
    await displayTopVendors(user);
}

function displayRecentBills(bills) {
    const container = document.getElementById('recentBills');
    
    if(!bills || bills.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No bills yet</p>';
        return;
    }

    container.innerHTML = bills.map(bill => `
        <div class="bill-item">
            <div class="bill-item-info">
                <h4>Bill #${bill.bill_no}</h4>
                <p>${bill.vendor_name}</p>
            </div>
            <div class="bill-item-amount">
                <div class="bill-amount">₹${bill.total_amount.toFixed(0)}</div>
                <div class="bill-date">${new Date(bill.created_at).toLocaleDateString('en-IN')}</div>
            </div>
        </div>
    `).join('');
}

async function displayTopVendors(user) {
    const { data: vendors } = await _supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .order('total_due', { ascending: false })
        .limit(5);

    const container = document.getElementById('topVendors');
    
    if(!vendors || vendors.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No vendors yet</p>';
        return;
    }

    const topVendors = vendors.filter(v => (v.total_due || 0) > 0);

    if(topVendors.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No pending dues</p>';
        return;
    }

    container.innerHTML = topVendors.map(vendor => `
        <div class="vendor-item">
            <div class="vendor-item-info">
                <h4>${vendor.name}</h4>
                <p>${vendor.address || 'No address'}</p>
            </div>
            <div class="vendor-due">₹${(vendor.total_due || 0).toFixed(0)}</div>
        </div>
    `).join('');
}

window.onload = init;
