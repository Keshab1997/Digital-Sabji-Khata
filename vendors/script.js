document.getElementById('navbar').innerHTML = renderNavbar();
document.getElementById('footer').innerHTML = renderFooter();

async function init() {
  await checkAuth();
  loadVendors();
}

document.getElementById('vendorForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const { error } = await supabase.from('vendors').insert({
    name: document.getElementById('vendorName').value,
    due_amount: document.getElementById('dueAmount').value
  });
  
  if (!error) {
    e.target.reset();
    loadVendors();
  }
});

async function loadVendors() {
  const { data } = await supabase.from('vendors').select('*');
  
  document.getElementById('vendorList').innerHTML = data?.map(v => `
    <div class="vendor-item">
      <span>${v.name}</span>
      <span class="due-amount">Due: ₹${v.due_amount}</span>
    </div>
  `).join('') || '';
}

init();
