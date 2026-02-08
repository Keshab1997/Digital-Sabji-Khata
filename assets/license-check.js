const SUPER_ADMIN_EMAIL = 'keshabsarkar2018@gmail.com';
const SOFTWARE_PRICE = 5000;

async function checkLicense() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        window.location.href = '/login/';
        return null;
    }

    // Super admin bypass
    if (user.email === SUPER_ADMIN_EMAIL) {
        return { isValid: true, isSuperAdmin: true, user };
    }

    // Check license
    const { data: license } = await _supabase
        .from('user_licenses')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!license) {
        showLicenseError('No license found. Please contact admin.');
        return null;
    }

    // Check if pending approval
    if (license.status === 'pending') {
        showLicenseError('Your account is pending approval. Please wait for admin approval.');
        return null;
    }

    // Check if rejected
    if (license.status === 'rejected') {
        showLicenseError('Your account has been rejected. Please contact admin.');
        return null;
    }

    // Check if expired
    if (license.status === 'expired') {
        showLicenseError('Your license has expired. Please renew to continue.');
        return null;
    }

    // Check trial expiry
    if (license.license_type === 'trial' && license.trial_end_date) {
        const trialEnd = new Date(license.trial_end_date);
        if (new Date() > trialEnd) {
            await _supabase
                .from('user_licenses')
                .update({ status: 'expired' })
                .eq('user_id', user.id);
            
            showLicenseError('Your trial period has expired. Please purchase license.');
            return null;
        }
    }

    // Check paid license expiry
    if (license.license_type === 'paid' && license.license_end_date) {
        const licenseEnd = new Date(license.license_end_date);
        if (new Date() > licenseEnd) {
            await _supabase
                .from('user_licenses')
                .update({ status: 'expired' })
                .eq('user_id', user.id);
            
            showLicenseError('Your license has expired. Please renew to continue.');
            return null;
        }
    }

    return { isValid: true, isSuperAdmin: false, user, license };
}

function showLicenseError(message) {
    document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f5f5;">
            <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
                <div style="font-size: 60px; margin-bottom: 20px;">🔒</div>
                <h2 style="color: #f44336; margin-bottom: 15px;">Access Denied</h2>
                <p style="color: #666; margin-bottom: 20px;">${message}</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #333;"><strong>Software Price: ₹${SOFTWARE_PRICE}</strong></p>
                </div>
                <p style="color: #888; font-size: 14px;">Contact: ${SUPER_ADMIN_EMAIL}</p>
                <button onclick="location.href='/login/'" style="margin-top: 20px; padding: 12px 30px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Back to Login</button>
            </div>
        </div>
    `;
}

async function logActivity(action, details = '') {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    await _supabase.from('activity_logs').insert({
        user_id: user.id,
        action,
        details
    });
}
