async function initVendors() {
    await checkAuth();
    loadVendors();
}

async function loadVendors() {
    const user = await checkAuth();
    const { data: vendors } = await _supabase.from('vendors').select('*').eq('user_id', user.id);

    const tbody = document.getElementById('vendor-list-body');
    tbody.innerHTML = '';

    vendors.forEach((v, i) => {
        tbody.innerHTML += `
            <tr onclick="viewVendorHistory(${v.id}, '${v.name}')">
                <td>${i+1}</td>
                <td style="font-weight:bold;">${v.name}</td>
                <td style="color:red;">₹${v.total_due}</td>
                <td><span class="status-tag ${v.total_due > 0 ? 'unpaid' : 'paid'}">${v.total_due > 0 ? 'Due' : 'Clear'}</span></td>
                <td><button class="btn" style="padding:4px 8px; background:#ddd;" onclick="toggleStatus(event, ${v.id}, ${v.total_due})">Toggle Payment</button></td>
            </tr>
        `;
    });
}

async function toggleStatus(e, id, currentDue) {
    e.stopPropagation();
    const newDue = currentDue > 0 ? 0 : 100; // Example: setting 0 or 100
    await _supabase.from('vendors').update({ total_due: newDue }).eq('id', id);
    loadVendors();
}

async function viewVendorHistory(vId, vName) {
    const historySection = document.getElementById('vendor-history');
    document.getElementById('v-history-name').innerText = vName + " - Bill History";
    historySection.style.display = 'block';
    
    // Fetch vendor data from bills table
    document.getElementById('history-content').innerHTML = "<p>Loading bill list...</p>";
}

function showAddVendor() {
    const name = prompt("Enter vendor name:");
    if(name) saveVendor(name);
}

async function saveVendor(name) {
    const user = await checkAuth();
    await _supabase.from('vendors').insert({ user_id: user.id, name: name, total_due: 0 });
    loadVendors();
}

window.onload = initVendors;
