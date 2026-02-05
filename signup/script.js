async function doSignUp() {
    const shopName = document.getElementById('shopName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const msg = document.getElementById('msg');
    const signupBtn = document.getElementById('signupBtn');

    if (!shopName || !email || !password || !confirmPassword) {
        showMsg("Please fill all fields!", "error");
        return;
    }

    if (password.length < 6) {
        showMsg("Password must be at least 6 characters!", "error");
        return;
    }

    if (password !== confirmPassword) {
        showMsg("Passwords do not match!", "error");
        return;
    }

    signupBtn.disabled = true;
    showMsg("Please wait, creating account...", "success");

    const { data, error } = await _supabase.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        showMsg("Error: " + error.message, "error");
        signupBtn.disabled = false;
    } else if (data.user) {
        const { error: profileError } = await _supabase
            .from('profiles')
            .update({ shop_name: shopName })
            .eq('id', data.user.id);

        if (profileError) {
            console.error("Profile update error:", profileError.message);
        }

        showMsg("Account created successfully! Please check your email inbox (if confirmation required) or login.", "success");
        
        setTimeout(() => {
            window.location.href = '../login/index.html';
        }, 3000);
    }
}

function showMsg(text, type) {
    const msg = document.getElementById('msg');
    msg.innerText = text;
    msg.className = type;
}
