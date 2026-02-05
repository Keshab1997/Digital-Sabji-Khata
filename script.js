document.getElementById('navbar').innerHTML = renderNavbar();
document.getElementById('footer').innerHTML = renderFooter();

async function loadDashboard() {
  await checkAuth();
  
  const { data: orders } = await supabase.from('orders').select('*');
  const { data: vendors } = await supabase.from('vendors').select('*');
  
  const totalSales = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
  
  document.getElementById('stats').innerHTML = `
    <div class="stat-card">
      <p>Total Sales</p>
      <h3>₹${totalSales}</h3>
    </div>
    <div class="stat-card">
      <p>Pending Orders</p>
      <h3>${pendingOrders}</h3>
    </div>
    <div class="stat-card">
      <p>Total Vendors</p>
      <h3>${vendors?.length || 0}</h3>
    </div>
  `;
}

loadDashboard();
