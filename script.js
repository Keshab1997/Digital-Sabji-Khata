async function loadDashboard() {
  const user = await checkAuth();
  if(!user) return;
  
  const { data: orders } = await _supabase.from('orders').select('*').eq('user_id', user.id);
  const { data: vendors } = await _supabase.from('vendors').select('*').eq('user_id', user.id);
  
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
