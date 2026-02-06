let selectedVendorId = null;

async function initVendors() {
    const user = await checkAuth();
    if(user) loadVendors();
}

async function loadVendors() {
    const user = await checkAuth();
    if(!user) return;
    
    const { data: vendors } = await _supabase.from('vendors').select('*').eq('user_id', user.id).order('name');
    const tbody = document.getElementById('vendor-list-body');
    tbody.innerHTML = '';

    vendors?.forEach(v => {
        tbody.innerHTML += `
            <tr>
                <td style="font-weight:bold;">${v.name}</td>
                <td style="color:${v.total_due > 0 ? 'red' : 'green'}; font-weight:bold;">₹${v.total_due || 0}</td>
                <td><button class="btn btn-secondary" style="padding:5px 10px;" onclick="openVendorDetail(${v.id}, '${v.name}')">History</button></td>
            </tr>
        `;
    });
}

async function openVendorDetail(id, name) {
    selectedVendorId = id;
    document.getElementById('v-detail-name').innerText = name;
    document.getElementById('vendor-detail-modal').style.display = 'flex';
    loadHistory(name, id);
}

async function loadHistory(name, id) {
    const historyDiv = document.getElementById('history-list');
    historyDiv.innerHTML = "Loading...";

    const { data: bills } = await _supabase.from('bills').select('*').eq('vendor_name', name).order('created_at', { ascending: false });
    const { data: payments } = await _supabase.from('payments').select('*').eq('vendor_id', id).order('payment_date', { ascending: false });

    let html = '<table class="mini-table">';
    
    bills?.forEach(b => {
        html += `<tr><td>${new Date(b.created_at).toLocaleDateString()}</td><td>Bill #${b.bill_no}</td><td style="color:red;">+₹${b.total_amount}</td></tr>`;
    });

    payments?.forEach(p => {
        html += `<tr><td>${new Date(p.payment_date).toLocaleDateString()}</td><td>Payment</td><td style="color:green;">-₹${p.amount}</td></tr>`;
    });

    html += '</table>';
    historyDiv.innerHTML = html || '<p>No history found</p>';
}

async function submitPayment() {
    const amount = parseFloat(document.getElementById('pay-amount').value);
    if(!amount || amount <= 0) { alert('Enter valid amount'); return; }

    const user = await checkAuth();
    if(!user) return;
    
    await _supabase.from('payments').insert({
        user_id: user.id,
        vendor_id: selectedVendorId,
        amount: amount
    });

    const { data: v } = await _supabase.from('vendors').select('total_due').eq('id', selectedVendorId).single();
    const newDue = (v.total_due || 0) - amount;
    await _supabase.from('vendors').update({ total_due: newDue }).eq('id', selectedVendorId);

    alert("Payment successful!");
    document.getElementById('pay-amount').value = '';
    loadVendors();
    closeModal();
}

function closeModal() { 
    document.getElementById('vendor-detail-modal').style.display = 'none'; 
}

function showAddVendor() {
    const name = prompt("Enter vendor name:");
    if(!name) return;
    const address = prompt("Enter vendor address:");
    saveVendor(name, address);
}

async function saveVendor(name, address) {
    const user = await checkAuth();
    if(!user) return;
    const { error } = await _supabase.from('vendors').insert({ 
        user_id: user.id, 
        name: name, 
        address: address, 
        total_due: 0 
    });
    
    if(error) alert(error.message);
    else loadVendors();
}

window.onload = initVendors;
