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
        // Create profile
        const { error: profileError } = await _supabase
            .from('profiles')
            .upsert({ id: data.user.id, shop_name: shopName });

        if (profileError) {
            console.error("Profile error:", profileError.message);
        }

        // Create license
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);

        const { error: licenseError } = await _supabase
            .from('user_licenses')
            .insert({
                user_id: data.user.id,
                email: email,
                status: 'pending',
                license_type: 'trial',
                trial_start_date: new Date().toISOString(),
                trial_end_date: trialEndDate.toISOString()
            });

        if (licenseError) {
            console.error("License error:", licenseError.message);
        }

        showMsg("Account created! Redirecting to login...", "success");
        
        setTimeout(() => {
            window.location.href = '../login/index.html';
        }, 2000);
    }
}

function showMsg(text, type) {
    const msg = document.getElementById('msg');
    msg.innerText = text;
    msg.className = type;
}
