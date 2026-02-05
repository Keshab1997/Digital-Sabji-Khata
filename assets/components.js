function renderNavbar() {
  return `
    <nav style="background: var(--primary); padding: 15px 20px; color: white;">
      <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
        <h2>VegBillPro</h2>
        <div style="display: flex; gap: 20px;">
          <a href="/" style="color: white; text-decoration: none;">Dashboard</a>
          <a href="/billing/" style="color: white; text-decoration: none;">Billing</a>
          <a href="/orders/" style="color: white; text-decoration: none;">Orders</a>
          <a href="/vendors/" style="color: white; text-decoration: none;">Vendors</a>
          <a href="/admin/" style="color: white; text-decoration: none;">Admin</a>
          <button onclick="logout()" class="btn" style="background: var(--danger);">Logout</button>
        </div>
      </div>
    </nav>
  `;
}

function renderFooter() {
  return `
    <footer style="background: var(--dark); color: white; text-align: center; padding: 20px; margin-top: 40px;">
      <p>&copy; 2024 VegBillPro. All rights reserved.</p>
    </footer>
  `;
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/login/';
}
