async function init() {
    const user = await checkAuth();
    if(!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const vendorId = urlParams.get('vendor');
    const vendorName = urlParams.get('name');

    if(!vendorId) {
        alert('Vendor not found');
        history.back();
        return;
    }

    document.getElementById('vendorName').innerText = `${vendorName} - Payment History`;

    await loadPayments(user.id, vendorId);
}

async function loadPayments(userId, vendorId) {
    const { data: payments } = await _supabase
        .from('vendor_payments')
        .select('*')
        .eq('user_id', userId)
        .eq('vendor_id', vendorId)
        .order('payment_date', { ascending: false });

    if(!payments || payments.length === 0) {
        document.getElementById('paymentList').innerHTML = '<p style="text-align: center; color: #888; padding: 40px;">No payments found</p>';
        return;
    }

    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    document.getElementById('totalPaid').innerText = `₹${totalPaid.toFixed(2)}`;
    document.getElementById('paymentCount').innerText = payments.length;

    const paymentList = document.getElementById('paymentList');
    paymentList.innerHTML = payments.map(payment => `
        <div class="payment-card">
            <div class="payment-header">
                <div class="payment-amount">₹${parseFloat(payment.amount).toFixed(2)}</div>
                <div class="payment-date">${new Date(payment.payment_date).toLocaleDateString('en-IN')}</div>
            </div>
            <div class="payment-details">
                <p><strong>Method:</strong> ${payment.payment_method || 'Cash'}</p>
                ${payment.notes ? `<p><strong>Notes:</strong> ${payment.notes}</p>` : ''}
                <p class="payment-time">${new Date(payment.payment_date).toLocaleTimeString('en-IN')}</p>
            </div>
        </div>
    `).join('');
}

window.onload = init;
