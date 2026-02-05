document.getElementById('navbar').innerHTML = renderNavbar();
document.getElementById('footer').innerHTML = renderFooter();

async function init() {
  await checkAuth();
  loadBills();
}

document.getElementById('billForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const { error } = await supabase.from('bills').insert({
    customer_name: document.getElementById('customerName').value,
    amount: document.getElementById('amount').value
  });
  
  if (!error) {
    e.target.reset();
    loadBills();
  }
});

async function loadBills() {
  const { data } = await supabase.from('bills').select('*').order('created_at', { ascending: false });
  
  document.getElementById('billList').innerHTML = data?.map(b => `
    <div class="bill-item card">
      <span>${b.customer_name}</span>
      <span>₹${b.amount}</span>
    </div>
  `).join('') || '';
}

init();
