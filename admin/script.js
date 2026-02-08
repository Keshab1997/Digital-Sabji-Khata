let allUsers = [];
let currentEditUserId = null;
const SUPER_ADMIN_EMAIL = 'keshabsarkar2018@gmail.com';

async function init() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        window.location.href = '../login/';
        return;
    }

    if (user.email === SUPER_ADMIN_EMAIL) {
        document.getElementById('superAdminPanel').style.display = 'block';
        await loadSuperAdminData();
    } else {
        document.getElementById('regularUserPanel').style.display = 'block';
        await loadUserSettings(user);
    }
}

async function loadSuperAdminData() {
    // Load all users with licenses
    const { data: licenses } = await _supabase
        .from('user_licenses')
        .select('*')
        .order('created_at', { ascending: false });

    allUsers = licenses || [];

    // Calculate stats
    const totalUsers = allUsers.length;
    const pendingUsers = allUsers.filter(u => u.status === 'pending').length;
    const activeUsers = allUsers.filter(u => u.status === 'approved').length;
    
    const { data: payments } = await _supabase
        .from('user_payments')
        .select('amount');
    
    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    document.getElementById('totalUsers').innerText = totalUsers;
    document.getElementById('pendingUsers').innerText = pendingUsers;
    document.getElementById('activeUsers').innerText = activeUsers;
    document.getElementById('totalRevenue').innerText = `₹${totalRevenue.toFixed(0)}`;

    displayUsers(allUsers);
}

function displayUsers(users) {
    const container = document.getElementById('usersList');
    
    if (!users || users.length === 0) {
        container.innerHTML = '<p>No users found</p>';
        return;
    }

    container.innerHTML = users.map(user => {
        const expiryDate = user.license_type === 'trial' ? user.trial_end_date : user.license_end_date;
        const daysLeft = expiryDate ? Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
        
        return `
            <div class="user-card ${user.status}">
                <div class="user-card-header">
                    <h4>${user.email}</h4>
                    <span class="status-badge ${user.status}">${user.status.toUpperCase()}</span>
                </div>
                <div class="user-info">
                    <p><strong>Type:</strong> ${user.license_type}</p>
                    <p><strong>Payment:</strong> ₹${user.amount_paid} / ₹${user.total_amount}</p>
                    ${expiryDate ? `<p><strong>Expires:</strong> ${new Date(expiryDate).toLocaleDateString('en-IN')} (${daysLeft} days)</p>` : ''}
                    <p><strong>Joined:</strong> ${new Date(user.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <div class="user-actions">
                    <button class="btn-manage" onclick="manageUser('${user.user_id}')">Manage</button>
                    ${user.status === 'pending' ? `<button class="btn-approve" onclick="quickApprove('${user.user_id}')">Quick Approve</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterUsers() {
    const status = document.getElementById('statusFilter').value;
    
    if (status === 'all') {
        displayUsers(allUsers);
    } else {
        const filtered = allUsers.filter(u => u.status === status);
        displayUsers(filtered);
    }
}

function manageUser(userId) {
    const user = allUsers.find(u => u.user_id === userId);
    if (!user) return;

    currentEditUserId = userId;
    
    document.getElementById('modalUserName').innerText = user.email;
    document.getElementById('modalEmail').innerText = user.email;
    document.getElementById('modalStatus').innerText = user.status;
    document.getElementById('modalLicenseType').innerText = user.license_type;
    document.getElementById('modalStatusSelect').value = user.status === 'pending' ? 'approved' : user.status;
    document.getElementById('modalLicenseEnd').value = user.license_end_date ? user.license_end_date.split('T')[0] : '';
    document.getElementById('modalPaymentAmount').value = user.amount_paid || 0;
    document.getElementById('modalNotes').value = user.notes || '';
    
    document.getElementById('userModal').style.display = 'flex';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

async function saveUserChanges() {
    const status = document.getElementById('modalStatusSelect').value;
    const licenseEnd = document.getElementById('modalLicenseEnd').value;
    const paymentAmount = parseFloat(document.getElementById('modalPaymentAmount').value) || 0;
    const notes = document.getElementById('modalNotes').value;

    const updates = {
        status,
        notes,
        amount_paid: paymentAmount,
        payment_status: paymentAmount >= 5000 ? 'paid' : paymentAmount > 0 ? 'partial' : 'unpaid',
        approved_by: SUPER_ADMIN_EMAIL,
        approved_at: new Date().toISOString()
    };

    if (status === 'approved') {
        updates.license_type = 'paid';
        if (licenseEnd) {
            updates.license_start_date = new Date().toISOString();
            updates.license_end_date = new Date(licenseEnd).toISOString();
        }
    }

    const { error } = await _supabase
        .from('user_licenses')
        .update(updates)
        .eq('user_id', currentEditUserId);

    if (error) {
        alert('Error updating user');
        return;
    }

    // Add payment record if amount > 0
    if (paymentAmount > 0) {
        await _supabase.from('user_payments').insert({
            user_id: currentEditUserId,
            amount: paymentAmount,
            payment_method: 'manual',
            notes: notes
        });
    }

    closeUserModal();
    await loadSuperAdminData();
}

async function quickApprove(userId) {
    if (!confirm('Approve this user with 1 year license?')) return;

    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    const { error } = await _supabase
        .from('user_licenses')
        .update({
            status: 'approved',
            license_type: 'paid',
            license_start_date: new Date().toISOString(),
            license_end_date: oneYearLater.toISOString(),
            approved_by: SUPER_ADMIN_EMAIL,
            approved_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    if (error) {
        alert('Error approving user');
        return;
    }

    await loadSuperAdminData();
}

async function loadUserSettings(user) {
    const { data: profile } = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile) {
        document.getElementById('shop_name').value = profile.shop_name || '';
        document.getElementById('slogan').value = profile.slogan || '';
        document.getElementById('address').value = profile.address || '';
        document.getElementById('mobile').value = profile.mobile || '';
    }

    const { data: license } = await _supabase
        .from('user_licenses')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (license) {
        document.getElementById('license_status').innerText = license.status.toUpperCase();
        document.getElementById('license_status').style.color = license.status === 'approved' ? '#4CAF50' : '#FF9800';
        document.getElementById('license_type').innerText = license.license_type.toUpperCase();
        
        const expiryDate = license.license_type === 'trial' ? license.trial_end_date : license.license_end_date;
        if (expiryDate) {
            const daysLeft = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            document.getElementById('license_expiry').innerText = `${new Date(expiryDate).toLocaleDateString('en-IN')} (${daysLeft} days left)`;
        } else {
            document.getElementById('license_expiry').innerText = 'Not set';
        }
    }
}

async function updateProfile() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    const shopName = document.getElementById('shop_name').value;
    const slogan = document.getElementById('slogan').value;
    const address = document.getElementById('address').value;
    const mobile = document.getElementById('mobile').value;

    const { error } = await _supabase
        .from('profiles')
        .upsert({
            id: user.id,
            shop_name: shopName,
            slogan,
            address,
            mobile
        });

    if (error) {
        alert('Error updating profile');
        return;
    }

    alert('Profile updated successfully!');
}

window.onload = init;
