let allVendors = [];
let saveTimeout = null;

async function initOrders() {
    const user = await checkAuth();
    if(!user) return;

    document.getElementById('disp-date').innerText = new Date().toLocaleDateString('en-GB');

    const { data: vendors } = await _supabase.from('vendors').select('*').eq('user_id', user.id);
    if(vendors) {
        allVendors = vendors;
        const list = document.getElementById('vendor-list');
        list.innerHTML = vendors.map(v => `<option value="${v.name}">`).join('');
    }

    const { data: vegList } = await _supabase.from('vegetable_prices').select('*').eq('user_id', user.id);
    const tbody = document.getElementById('order-body');
    tbody.innerHTML = '';
    
    const defaultVeggies = [
        "ALU", "PYAJ", "ADA", "RASUN", "LANKA", "POTOL", "JHINGE", "KAROLA", 
        "BEGUN", "BANDHAKOPI", "PHULKOPI", "TOMATO", "DHONEPATA", "KUMRO",
        "LAU", "BORBOTI", "SIM", "GAJOR", "BEET", "MULO", "DHENROSH", 
        "PEPE", "KANCHAKOLA", "MOCHA", "THOR", "SAJNE DATA", "UCCHE", "LEBU",
        "PATAL", "CHICHINGA", "BARBATI", "MOTOR SHUTI", "FULKOPI", "OL",
        "KOCHU", "LALKUMRO", "SHALGAM", "PALONGSHAK", "LALSAK", "PUISHAK"
    ];
    const dbVegNames = vegList ? vegList.map(v => v.veg_name) : [];
    const allVeggies = [...new Set([...dbVegNames, ...defaultVeggies])];
    
    allVeggies.forEach((name, i) => createRow(name, i + 1));
    loadDraft();
}

function createRow(name, sl) {
    const tr = document.createElement('tr');
    tr.className = 'veg-row empty-row';
    tr.dataset.name = name;
    tr.innerHTML = `
        <td class="col-sl">${sl}</td>
        <td class="col-desc"><b>${name}</b></td>
        <td class="col-kg"><input type="number" step="0.001" class="qty" placeholder="0.000" oninput="updateRow(this)" onfocus="hideNavOnFocus()" onblur="showNavOnBlur()"></td>
        <td class="col-del no-print"><button onclick="deleteVegRow(this, '${name}')">×</button></td>
    `;
    document.getElementById('order-body').appendChild(tr);
}

function hideNavOnFocus() {
    const actionPanel = document.querySelector('.fixed-action-panel');
    const mobileNav = document.querySelector('.mobile-nav');
    if(actionPanel) actionPanel.style.display = 'none';
    if(mobileNav) mobileNav.style.display = 'none';
}

function showNavOnBlur() {
    setTimeout(() => {
        const actionPanel = document.querySelector('.fixed-action-panel');
        const mobileNav = document.querySelector('.mobile-nav');
        if(actionPanel) actionPanel.style.display = 'block';
        if(mobileNav) mobileNav.style.display = 'flex';
    }, 100);
}

function updateRow(el) {
    const row = el.closest('tr');
    const q = parseFloat(row.querySelector('.qty').value) || 0;
    
    if(q > 0) {
        let displayWeight = q < 1 ? (q * 1000) + " gm" : q + " kg";
        row.querySelector('.qty').title = displayWeight;
        row.classList.remove('empty-row');
    } else {
        row.classList.add('empty-row');
    }

    triggerAutoSave();
}

function handleVendorSelect(val) {
    triggerAutoSave();
}

function triggerAutoSave() {
    document.getElementById('sync-status').innerText = "Saving...";
    const draftData = {
        vName: document.getElementById('v-name').value,
        items: []
    };
    
    document.querySelectorAll('.veg-row').forEach(row => {
        const q = row.querySelector('.qty').value;
        if(q > 0) {
            draftData.items.push({ name: row.dataset.name, q });
        }
    });

    localStorage.setItem('order_draft', JSON.stringify(draftData));

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        document.getElementById('sync-status').innerText = "Saved";
    }, 2000);
}

function loadDraft() {
    const saved = localStorage.getItem('order_draft');
    if(!saved) return;
    const data = JSON.parse(saved);
    document.getElementById('v-name').value = data.vName || "";
    
    data.items.forEach(item => {
        const row = Array.from(document.querySelectorAll('.veg-row')).find(r => r.dataset.name === item.name);
        if(row) {
            row.querySelector('.qty').value = item.q;
            updateRow(row.querySelector('.qty'));
        }
    });
}

async function deleteVegRow(btn, name) {
    if(confirm(`Delete ${name}?`)) {
        const user = await checkAuth();
        if(!user) return;
        await _supabase.from('vegetable_prices').delete().eq('user_id', user.id).eq('veg_name', name);
        btn.closest('tr').remove();
    }
}

async function proceedToBill() {
    const vName = document.getElementById('v-name').value;
    if(!vName) { 
        showToast("Please enter vendor name!", "error"); 
        return; 
    }

    const items = [];
    document.querySelectorAll('.veg-row').forEach(row => {
        const q = parseFloat(row.querySelector('.qty').value) || 0;
        if(q > 0) {
            items.push({
                name: row.dataset.name,
                qty: q
            });
        }
    });

    if(items.length === 0) {
        showToast("Please add at least one item!", "error");
        return;
    }

    localStorage.setItem('order_to_bill', JSON.stringify({ vName, items }));
    window.location.href = '../billing/';
}

async function saveOrder() {
    const user = await checkAuth();
    if(!user) return;
    
    const vName = document.getElementById('v-name').value;
    if(!vName) { 
        showToast("Please enter vendor name!", "error"); 
        return; 
    }

    const items = [];
    document.querySelectorAll('.veg-row').forEach(row => {
        const q = parseFloat(row.querySelector('.qty').value) || 0;
        if(q > 0) {
            items.push({
                veg_name: row.dataset.name,
                qty: q
            });
        }
    });

    if(items.length === 0) {
        showToast("Please add at least one item!", "error");
        return;
    }

    const { data: orderData, error: orderError } = await _supabase.from('orders').insert({
        user_id: user.id,
        vendor_name: vName,
        status: 'pending'
    }).select().single();

    if(orderError) {
        showToast("Error: " + orderError.message, "error");
        return;
    }

    const orderItems = items.map(item => ({
        order_id: orderData.id,
        veg_name: item.veg_name,
        qty: item.qty
    }));

    await _supabase.from('order_items').insert(orderItems);

    showToast(`✅ Order saved for ${vName}!`, "success");
    localStorage.removeItem('order_draft');
    
    setTimeout(() => {
        location.reload();
    }, 1500);
}

async function viewSavedOrders() {
    const user = await checkAuth();
    if(!user) return;

    const { data: orders } = await _supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if(!orders || orders.length === 0) {
        showToast("No saved orders found!", "error");
        return;
    }

    const modal = document.getElementById('orderListModal');
    modal.innerHTML = `
        <div class="order-list-content">
            <div class="order-list-header">
                <h2>Saved Orders</h2>
                <button class="btn btn-danger" onclick="closeOrderList()">✕ Close</button>
            </div>
            ${await Promise.all(orders.map(async order => {
                const { data: items } = await _supabase
                    .from('order_items')
                    .select('*')
                    .eq('order_id', order.id);
                
                const itemsList = items.map(i => `${i.veg_name}: ${i.qty}kg`).join(', ');
                
                return `
                    <div class="order-card">
                        <h4>${order.vendor_name}</h4>
                        <p>Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                        <p>Items: ${itemsList}</p>
                        <div class="order-actions">
                            <button class="btn-load" onclick="loadOrder(${order.id})">Load</button>
                            <button class="btn-delete-order" onclick="deleteOrder(${order.id})">Delete</button>
                        </div>
                    </div>
                `;
            })).then(cards => cards.join(''))}
        </div>
    `;
    modal.style.display = 'block';
}

function closeOrderList() {
    document.getElementById('orderListModal').style.display = 'none';
}

async function loadOrder(orderId) {
    const { data: order } = await _supabase.from('orders').select('*').eq('id', orderId).single();
    const { data: items } = await _supabase.from('order_items').select('*').eq('order_id', orderId);

    document.getElementById('v-name').value = order.vendor_name;

    document.querySelectorAll('.veg-row').forEach(row => {
        row.querySelector('.qty').value = '';
        row.classList.add('empty-row');
    });

    items.forEach(item => {
        const row = Array.from(document.querySelectorAll('.veg-row')).find(r => r.dataset.name === item.veg_name);
        if(row) {
            row.querySelector('.qty').value = item.qty;
            updateRow(row.querySelector('.qty'));
        }
    });

    closeOrderList();
    showToast("Order loaded!", "success");
}

async function deleteOrder(orderId) {
    if(!confirm('Delete this order?')) return;

    await _supabase.from('order_items').delete().eq('order_id', orderId);
    await _supabase.from('orders').delete().eq('id', orderId);

    showToast("Order deleted!", "success");
    await viewSavedOrders();
}

async function addNewVeg() {
    const user = await checkAuth();
    if(!user) return;
    
    const name = prompt("Enter vegetable name:");
    if(name) {
        const upperName = name.toUpperCase();
        
        const { data: existing } = await _supabase
            .from('vegetable_prices')
            .select('*')
            .eq('user_id', user.id)
            .eq('veg_name', upperName)
            .maybeSingle();
        
        if(existing) {
            alert('This vegetable already exists!');
            return;
        }
        
        const { error } = await _supabase.from('vegetable_prices').insert({ 
            user_id: user.id, 
            veg_name: upperName 
        });
        
        if(!error) {
            createRow(upperName, document.querySelectorAll('.veg-row').length + 1);
        } else {
            alert('Error adding vegetable!');
        }
    }
}

function filterVeg() {
    const query = document.getElementById('veg-search').value.toLowerCase();
    document.querySelectorAll('.veg-row').forEach(row => {
        const name = row.dataset.name.toLowerCase();
        row.style.display = name.includes(query) ? "" : "none";
    });
}

function clearOrder() { 
    if(confirm("Clear all entries?")) { 
        localStorage.removeItem('order_draft'); 
        location.reload(); 
    } 
}

function showToast(message, type = "success") {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

window.onload = initOrders;
