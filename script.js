async function loadDashboard() {
  const user = await checkAuth();
  if(!user) return;
  
  const today = new Date().toISOString().split('T')[0];

  const { data: orders } = await _supabase.from('orders').select('*').eq('user_id', user.id);
  const { data: vendors } = await _supabase.from('vendors').select('*').eq('user_id', user.id);
  const { data: bills } = await _supabase.from('bills').select('*').eq('user_id', user.id);
  
  const totalSales = bills?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
  const todaySales = bills?.filter(b => b.created_at.startsWith(today))
                          .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
  const totalDue = vendors?.reduce((sum, v) => sum + (v.total_due || 0), 0) || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
  
  document.getElementById('stats').innerHTML = `
    <div class="stat-card">
      <p>Today's Sales</p>
      <h3>₹${todaySales}</h3>
    </div>
    <div class="stat-card">
      <p>Total Due</p>
      <h3 style="color: #e74c3c;">₹${totalDue}</h3>
    </div>
    <div class="stat-card">
      <p>Total Vendors</p>
      <h3>${vendors?.length || 0}</h3>
    </div>
    <div class="stat-card">
      <p>Pending Orders</p>
      <h3>${pendingOrders}</h3>
    </div>
  `;
}

loadDashboard();
