async function doLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('error-msg');

    if(!email || !password) {
        msg.innerText = "Please enter both email and password.";
        return;
    }

    msg.innerText = "Verifying...";

    const { data, error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        msg.innerText = "Invalid email or password!";
    } else {
        // Clear only app-specific localStorage (not Supabase session)
        localStorage.removeItem('veg_bill_draft');
        localStorage.removeItem('order_to_bill');
        localStorage.removeItem('edit_bill_id');
        localStorage.removeItem('last_saved_bill');
        
        window.location.href = '../index.html';
    }
}
