document.getElementById('navbar').innerHTML = renderNavbar();
document.getElementById('footer').innerHTML = renderFooter();

async function init() {
  await checkAuth();
  loadOrders();
}

async function loadOrders() {
  const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  
  document.getElementById('orderList').innerHTML = data?.map(o => `
    <div class="order-item">
      <h3>Order #${o.id}</h3>
      <p>Total: ₹${o.total}</p>
      <span class="order-status status-${o.status}">${o.status}</span>
    </div>
  `).join('') || '<p>No orders found</p>';
}

init();
