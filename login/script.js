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
        window.location.href = '../index.html';
    }
}
