const SUPER_ADMIN_EMAIL = 'keshabsarkar2018@gmail.com';
const SOFTWARE_PRICE = 5000;

async function checkLicense() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        const path = window.location.pathname;
        const segments = path.split('/').filter(s => s.length > 0);
        const repoName = 'Digital-Sabji-Khata';
        const repoIndex = segments.indexOf(repoName);
        const depth = segments.length - 1 - repoIndex;
        let prefix = depth <= 0 ? './' : '../'.repeat(depth);
        window.location.href = prefix + 'login/index.html';
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
    const path = window.location.pathname;
    const segments = path.split('/').filter(s => s.length > 0);
    const repoName = 'Digital-Sabji-Khata';
    const repoIndex = segments.indexOf(repoName);
    const depth = segments.length - 1 - repoIndex;
    const prefix = depth <= 0 ? './' : '../'.repeat(depth);
    
    document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px;">
            <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 600px; width: 100%;">
                <div style="text-align: center; font-size: 60px; margin-bottom: 20px;">🔒</div>
                <h2 style="color: #f44336; margin-bottom: 15px; text-align: center;">Access Denied</h2>
                <p style="color: #666; margin-bottom: 25px; text-align: center;">${message}</p>
                
                <div style="background: #f0f7ff; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #2196F3;">
                    <h3 style="margin: 0 0 15px 0; color: #1976D2; font-size: 18px;">📱 Contact for Purchase</h3>
                    <p style="margin: 5px 0; color: #333; font-size: 16px;"><strong>Phone:</strong> <a href="tel:9382284190" style="color: #4CAF50; text-decoration: none;">9382284190</a></p>
                    <p style="margin: 5px 0; color: #333; font-size: 16px;"><strong>Email:</strong> ${SUPER_ADMIN_EMAIL}</p>
                    <p style="margin: 15px 0 5px 0; color: #333; font-size: 18px;"><strong>Price: ₹${SOFTWARE_PRICE}</strong></p>
                </div>

                <div style="background: #fff3e0; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #FF9800;">
                    <h3 style="margin: 0 0 15px 0; color: #F57C00; font-size: 18px;">✨ Software Features</h3>
                    
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 5px 0; color: #555; font-weight: 600;">🇬🇧 English:</p>
                        <p style="margin: 5px 0 5px 15px; color: #666; font-size: 14px;">• Digital billing with PDF & WhatsApp sharing</p>
                        <p style="margin: 5px 0 5px 15px; color: #666; font-size: 14px;">• Vendor management & payment tracking</p>
                        <p style="margin: 5px 0 5px 15px; color: #666; font-size: 14px;">• Bill history with date filters</p>
                        <p style="margin: 5px 0 5px 15px; color: #666; font-size: 14px;">• Dashboard with sales analytics</p>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <p style="margin: 5px 0; color: #555; font-weight: 600;">🇮🇳 हिंदी:</p>
                        <p style="margin: 5px 0 5px 15px; color: #666; font-size: 14px;">• PDF और WhatsApp के साथ डिजिटल बिलिंग</p>
                        <p style="margin: 5px 0 5px 15px; color: #666; font-size: 14px;">• विक्रेता प्रबंधन और भुगतान ट्रैकिंग</p>
                        <p style="margin: 5px 0 5px 15px; color: #666; font-size: 14px;">• तारीख फ़िल्टर के साथ बिल इतिहास</p>
                        <p style="margin: 5px 0 5px 15px; color: #666; font-size: 14px;">• बिक्री विश्लेषण के साथ डैशबोर्ड</p>
                    </div>

                    <div>
                        <p style="margin: 5px 0; color: #555; font-weight: 600;">🇧🇩 বাংলা:</p>
                        <p style="margin: 5px 0 5px 15px; color: #666; font-size: 14px;">• PDF এবং WhatsApp শেয়ারিং সহ ডিজিটাল বিলিং</p>
                        <p style="margin: 5px 0 5px 15px; color: #666; font-size: 14px;">• বিক্রেতা ব্যবস্থাপনা এবং পেমেন্ট ট্র্যাকিং</p>
                        <p style="margin: 5px 0 5px 15px; color: #666; font-size: 14px;">• তারিখ ফিল্টার সহ বিল ইতিহাস</p>
                        <p style="margin: 5px 0 5px 15px; color: #666; font-size: 14px;">• বিক্রয় বিশ্লেষণ সহ ড্যাশবোর্ড</p>
                    </div>
                </div>

                <div style="text-align: center;">
                    <button onclick="location.href='${prefix}login/index.html'" style="padding: 12px 30px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; box-shadow: 0 2px 8px rgba(76,175,80,0.3);">Back to Login</button>
                </div>
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
