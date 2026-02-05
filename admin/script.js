async function initAdmin() {
    const user = await checkAuth();
    
    const { data: p } = await _supabase.from('profiles').select('*').eq('id', user.id).single();
    if(p) {
        document.getElementById('shop_name').value = p.shop_name || '';
        document.getElementById('slogan').value = p.slogan || '';
        document.getElementById('address').value = p.address || '';
        document.getElementById('mobile').value = p.mobile || '';
        document.getElementById('trial_date').innerText = p.trial_until ? new Date(p.trial_until).toLocaleDateString() : 'Unending';
    }
}

async function updateProfile() {
    const user = await checkAuth();
    const updates = {
        id: user.id,
        shop_name: document.getElementById('shop_name').value,
        slogan: document.getElementById('slogan').value,
        address: document.getElementById('address').value,
        mobile: document.getElementById('mobile').value,
        updated_at: new Date()
    };

    const { error } = await _supabase.from('profiles').upsert(updates);
    if(error) alert(error.message);
    else alert("Settings saved successfully!");
}

window.onload = initAdmin;
