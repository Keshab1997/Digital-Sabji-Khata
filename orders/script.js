async function initOrders() {
    const user = await checkAuth();
    if(user) loadOrders();
}

async function saveOrder() {
    const user = await checkAuth();
    if(!user) return;
    
    const name = document.getElementById('cust_name').value;
    const phone = document.getElementById('cust_phone').value;
    const details = document.getElementById('order_details').value;

    if(!name || !details) { alert("Please provide name and details"); return; }

    const { error } = await _supabase.from('orders').insert({
        user_id: user.id,
        customer_name: name,
        phone: phone,
        details: details,
        status: 'pending'
    });

    if(error) alert(error.message);
    else {
        alert("Order saved successfully!");
        location.reload();
    }
}

async function loadOrders() {
    const user = await checkAuth();
    if(!user) return;
    
    const { data: orders } = await _supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

    const container = document.getElementById('order-list');
    container.innerHTML = orders.length ? '' : '<p>No orders found.</p>';

    orders.forEach(o => {
        const waLink = `https://wa.me/${o.phone}?text=Hello ${o.customer_name}, Your order: ${o.details}`;
        container.innerHTML += `
            <div class="order-item card">
                <h3>${o.customer_name}</h3>
                <p><strong>Items:</strong> ${o.details}</p>
                <p><strong>Date:</strong> ${new Date(o.created_at).toLocaleDateString()}</p>
                <div class="order-actions">
                    <a href="${waLink}" target="_blank" class="whatsapp-btn">Send WhatsApp</a>
                    <button class="btn btn-secondary" style="padding:5px 10px; font-size:12px;" onclick="deleteOrder(${o.id})">Delete</button>
                </div>
            </div>
        `;
    });
}

async function deleteOrder(id) {
    if(confirm("Do you want to delete this order?")) {
        await _supabase.from('orders').delete().eq('id', id);
        loadOrders();
    }
}

window.onload = initOrders;
