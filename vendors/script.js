let allVendors = [];
let currentEditId = null;
let currentPaymentVendor = null;

async function init() {
    await loadVendors();
}

async function loadVendors() {
    const user = await checkAuth();
    if(!user) return;

    const { data: vendors } = await _supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id);

    if(!vendors) return;

    // Get bill counts for each vendor
    const { data: bills } = await _supabase
        .from('bills')
        .select('vendor_name, id')
        .eq('user_id', user.id);

    const billCounts = {};
    bills?.forEach(bill => {
        billCounts[bill.vendor_name] = (billCounts[bill.vendor_name] || 0) + 1;
    });

    allVendors = vendors.map(v => ({
        ...v,
        billCount: billCounts[v.name] || 0
    }));

    displayVendors(allVendors);
}

function displayVendors(vendors) {
    const container = document.getElementById('vendor-cards');
    
    if(!vendors || vendors.length === 0) {
        container.innerHTML = '<p>No vendors found</p>';
        return;
    }

    container.innerHTML = vendors.map(vendor => `
        <div class="vendor-card">
            <div class="vendor-card-header">
                <h3>${vendor.name}</h3>
            </div>
            <div class="vendor-info">
                ${vendor.address ? `<p>📍 ${vendor.address}</p>` : ''}
                ${vendor.phone ? `<p>📱 ${vendor.phone}</p>` : ''}
            </div>
            <div class="vendor-stats">
                <div class="stat-item due">
                    <div class="label">Due</div>
                    <div class="value">₹${(vendor.total_due || 0).toFixed(2)}</div>
                </div>
                <div class="stat-item">
                    <div class="label">Bills</div>
                    <div class="value">${vendor.billCount}</div>
                </div>
            </div>
            <div class="vendor-actions">
                <button class="btn-history" onclick="viewHistory('${vendor.name}')">📋 History</button>
                <button class="btn-payment" onclick="showPayment(${vendor.id}, '${vendor.name}', ${vendor.total_due || 0})">💰 Pay</button>
                ${vendor.phone ? `<button class="btn-whatsapp" onclick="openWhatsApp('${vendor.phone}')">💬</button>` : ''}
                <button class="btn-edit" onclick="editVendor(${vendor.id})">✏️</button>
                <button class="btn-delete" onclick="deleteVendor(${vendor.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function filterVendors() {
    const query = document.getElementById('searchVendor').value.toLowerCase();
    const filtered = allVendors.filter(v => 
        v.name.toLowerCase().includes(query) || 
        (v.address && v.address.toLowerCase().includes(query)) ||
        (v.phone && v.phone.includes(query))
    );
    displayVendors(filtered);
}

function sortVendors() {
    const sortBy = document.getElementById('sortBy').value;
    let sorted = [...allVendors];

    if(sortBy === 'name') {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if(sortBy === 'due') {
        sorted.sort((a, b) => (b.total_due || 0) - (a.total_due || 0));
    } else if(sortBy === 'bills') {
        sorted.sort((a, b) => b.billCount - a.billCount);
    }

    displayVendors(sorted);
}

function showAddVendor() {
    currentEditId = null;
    document.getElementById('modalTitle').innerText = 'Add New Vendor';
    document.getElementById('v-name').value = '';
    document.getElementById('v-address').value = '';
    document.getElementById('v-phone').value = '';
    document.getElementById('saveBtn').innerText = 'Save';
    document.getElementById('addVendorModal').style.display = 'flex';
}

function closeAddModal() {
    document.getElementById('addVendorModal').style.display = 'none';
}

async function saveVendor() {
    const user = await checkAuth();
    if(!user) return;

    const name = document.getElementById('v-name').value.trim();
    const address = document.getElementById('v-address').value.trim();
    const phone = document.getElementById('v-phone').value.trim();

    if(!name) {
        alert('Please enter vendor name');
        return;
    }

    if(currentEditId) {
        // Update
        const { error } = await _supabase
            .from('vendors')
            .update({ name, address, phone })
            .eq('id', currentEditId);

        if(error) {
            alert('Error updating vendor');
            return;
        }
    } else {
        // Insert
        const { error } = await _supabase
            .from('vendors')
            .insert({ user_id: user.id, name, address, phone, total_due: 0 });

        if(error) {
            alert('Error adding vendor');
            return;
        }
    }

    closeAddModal();
    await loadVendors();
}

async function editVendor(id) {
    const vendor = allVendors.find(v => v.id === id);
    if(!vendor) return;

    currentEditId = id;
    document.getElementById('modalTitle').innerText = 'Edit Vendor';
    document.getElementById('v-name').value = vendor.name;
    document.getElementById('v-address').value = vendor.address || '';
    document.getElementById('v-phone').value = vendor.phone || '';
    document.getElementById('saveBtn').innerText = 'Update';
    document.getElementById('addVendorModal').style.display = 'flex';
}

async function deleteVendor(id) {
    if(!confirm('Delete this vendor? All bills will remain but vendor info will be removed.')) return;

    const { error } = await _supabase
        .from('vendors')
        .delete()
        .eq('id', id);

    if(error) {
        alert('Error deleting vendor');
        return;
    }

    await loadVendors();
}

function viewHistory(vendorName) {
    window.location.href = `../bill-history/?vendor=${encodeURIComponent(vendorName)}`;
}

function showPayment(vendorId, vendorName, currentDue) {
    currentPaymentVendor = vendorId;
    document.getElementById('payVendorName').innerText = `Payment - ${vendorName}`;
    document.getElementById('currentDue').innerText = `₹${currentDue.toFixed(2)}`;
    document.getElementById('pay-amount').value = '';
    document.getElementById('paymentModal').style.display = 'flex';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

async function submitPayment() {
    const amount = parseFloat(document.getElementById('pay-amount').value);
    
    if(!amount || amount <= 0) {
        alert('Please enter valid amount');
        return;
    }

    const vendor = allVendors.find(v => v.id === currentPaymentVendor);
    if(!vendor) return;

    const newDue = (vendor.total_due || 0) - amount;

    const { error } = await _supabase
        .from('vendors')
        .update({ total_due: Math.max(0, newDue) })
        .eq('id', currentPaymentVendor);

    if(error) {
        alert('Error updating payment');
        return;
    }

    closePaymentModal();
    await loadVendors();
}

function openWhatsApp(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
}

window.onload = init;
