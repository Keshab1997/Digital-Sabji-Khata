let currentProfile = null;
let allVendors = [];
let saveTimeout = null;

async function initBilling() {
    const user = await checkAuth();
    if(!user) return;

    document.getElementById('disp-date').innerText = new Date().toLocaleDateString('en-GB');

    const { data: profile } = await _supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
        currentProfile = profile;
        document.getElementById('disp-shop-name').innerText = profile.shop_name || "SHOP NAME";
        document.getElementById('disp-slogan').innerText = profile.slogan || "";
        document.getElementById('disp-address').innerText = profile.address || "";
        document.getElementById('disp-mobile').innerText = "Mobile: " + (profile.mobile || "");
        document.getElementById('disp-sig-name').innerText = profile.signature_name || profile.shop_name || "Owner";
    }

    const editBillId = localStorage.getItem('edit_bill_id');
    if (editBillId) {
        await loadBillForEdit(editBillId);
        localStorage.removeItem('edit_bill_id');
        return;
    }

    const orderToBill = localStorage.getItem('order_to_bill');
    if (orderToBill) {
        const { data: vendors } = await _supabase.from('vendors').select('*').eq('user_id', user.id);
        if(vendors) {
            allVendors = vendors;
            const list = document.getElementById('vendor-list');
            list.innerHTML = vendors.map(v => `<option value="${v.name}">`).join('');
        }

        const { data: vegList } = await _supabase.from('vegetable_prices').select('*').eq('user_id', user.id);
        const tbody = document.getElementById('bill-body');
        tbody.innerHTML = '';
        
        const defaultVeggies = [
            "ALU", "PYAJ", "ADA", "RASUN", "LANKA", "POTOL", "JHINGE", "KAROLA", 
            "BEGUN", "BANDHAKOPI", "PHULKOPI", "TOMATO", "DHONEPATA", "KUMRO",
            "LAU", "BORBOTI", "SIM", "GAJOR", "BEET", "MULO", "DHENROSH", 
            "PEPE", "KANCHAKOLA", "MOCHA", "THOR", "SAJNE DATA", "UCCHE", "LEBU",
            "PATAL", "CHICHINGA", "BARBATI", "MOTOR SHUTI", "FULKOPI", "OL",
            "KOCHU", "LALKUMRO", "SHALGAM", "PALONGSHAK", "LALSAK", "PUISHAK"
        ];
        const dbVegNames = vegList ? vegList.map(v => v.veg_name) : [];
        const allVeggies = [...new Set([...dbVegNames, ...defaultVeggies])];
        
        allVeggies.forEach((name, i) => createRow(name, i + 1));
        
        await loadOrderToBill(orderToBill);
        localStorage.removeItem('order_to_bill');
        return;
    }

    const { data: lastBill } = await _supabase.from('bills').select('bill_no').eq('user_id', user.id).order('bill_no', { ascending: false }).limit(1);
    const nextBillNo = (lastBill && lastBill.length > 0) ? lastBill[0].bill_no + 1 : 1;
    document.getElementById('disp-bill-no').innerText = nextBillNo.toString().padStart(5, '0');

    const { data: vendors } = await _supabase.from('vendors').select('*').eq('user_id', user.id);
    if(vendors) {
        allVendors = vendors;
        const list = document.getElementById('vendor-list');
        list.innerHTML = vendors.map(v => `<option value="${v.name}">`).join('');
    }

    const { data: vegList } = await _supabase.from('vegetable_prices').select('*').eq('user_id', user.id);
    const tbody = document.getElementById('bill-body');
    tbody.innerHTML = '';
    
    const defaultVeggies = [
        "ALU", "PYAJ", "ADA", "RASUN", "LANKA", "POTOL", "JHINGE", "KAROLA", 
        "BEGUN", "BANDHAKOPI", "PHULKOPI", "TOMATO", "DHONEPATA", "KUMRO",
        "LAU", "BORBOTI", "SIM", "GAJOR", "BEET", "MULO", "DHENROSH", 
        "PEPE", "KANCHAKOLA", "MOCHA", "THOR", "SAJNE DATA", "UCCHE", "LEBU",
        "PATAL", "CHICHINGA", "BARBATI", "MOTOR SHUTI", "FULKOPI", "OL",
        "KOCHU", "LALKUMRO", "SHALGAM", "PALONGSHAK", "LALSAK", "PUISHAK"
    ];
    const dbVegNames = vegList ? vegList.map(v => v.veg_name) : [];
    const allVeggies = [...new Set([...dbVegNames, ...defaultVeggies])];
    
    allVeggies.forEach((name, i) => createRow(name, i + 1));
    loadDraft();
}

function createRow(name, sl) {
    const tr = document.createElement('tr');
    tr.className = 'veg-row empty-row';
    tr.dataset.name = name;
    tr.innerHTML = `
        <td class="col-sl">${sl}</td>
        <td class="col-desc"><b>${name}</b></td>
        <td class="col-kg"><input type="number" step="0.001" class="qty" placeholder="0.000" oninput="calc(this)" onfocus="hideNavOnFocus()" onblur="showNavOnBlur()"></td>
        <td class="col-rate"><input type="number" class="rate" placeholder="0" oninput="calc(this)" onfocus="hideNavOnFocus()" onblur="showNavOnBlur()"></td>
        <td class="col-amt row-total">0</td>
        <td class="col-del no-print"><button onclick="deleteVegRow(this, '${name}')">×</button></td>
    `;
    document.getElementById('bill-body').appendChild(tr);
}

function hideNavOnFocus() {
    const actionPanel = document.querySelector('.fixed-action-panel');
    const mobileNav = document.querySelector('.mobile-nav');
    if(actionPanel) actionPanel.style.display = 'none';
    if(mobileNav) mobileNav.style.display = 'none';
}

function showNavOnBlur() {
    setTimeout(() => {
        const actionPanel = document.querySelector('.fixed-action-panel');
        const mobileNav = document.querySelector('.mobile-nav');
        if(actionPanel) actionPanel.style.display = 'block';
        if(mobileNav) mobileNav.style.display = 'flex';
    }, 100);
}

function calc(el) {
    const row = el.closest('tr');
    const q = parseFloat(row.querySelector('.qty').value) || 0;
    const r = parseFloat(row.querySelector('.rate').value) || 0;
    
    if(q > 0) {
        let displayWeight = q < 1 ? (q * 1000) + " gm" : q + " kg";
        row.querySelector('.qty').title = displayWeight; 
    }

    const total = q * r;
    row.querySelector('.row-total').innerText = total > 0 ? Math.round(total) : 0;
    
    if(total > 0) row.classList.remove('empty-row');
    else row.classList.add('empty-row');

    updateGrandTotal();
    triggerAutoSave();
}

function updateGrandTotal() {
    let total = 0;
    document.querySelectorAll('.row-total').forEach(td => total += parseFloat(td.innerText));
    document.getElementById('grand-total').innerText = Math.round(total);
    document.getElementById('amt-words').innerText = numberToWords(Math.round(total)) + " Rupees Only";
}

async function handleVendorSelect(val) {
    const vendor = allVendors.find(v => v.name.trim().toLowerCase() === val.trim().toLowerCase());
    if(vendor) {
        document.getElementById('v-addr').value = vendor.address || "";
        
        const { data: lastBill } = await _supabase
            .from('bills')
            .select('bill_no')
            .eq('vendor_name', vendor.name)
            .order('bill_no', { ascending: false })
            .limit(1);
        
        let nextNo = (lastBill && lastBill.length > 0) ? lastBill[0].bill_no + 1 : 1;
        document.getElementById('disp-bill-no').innerText = nextNo.toString().padStart(5, '0');
    } else {
        document.getElementById('disp-bill-no').innerText = "00001";
    }
    triggerAutoSave();
}

function triggerAutoSave() {
    document.getElementById('sync-status').innerText = "Saving...";
    const draftData = {
        vName: document.getElementById('v-name').value,
        vAddr: document.getElementById('v-addr').value,
        items: []
    };
    
    document.querySelectorAll('.veg-row').forEach(row => {
        const q = row.querySelector('.qty').value;
        const r = row.querySelector('.rate').value;
        if(q > 0) {
            draftData.items.push({ name: row.dataset.name, q, r });
        }
    });

    localStorage.setItem('veg_bill_draft', JSON.stringify(draftData));

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        document.getElementById('sync-status').innerText = "Saved";
    }, 2000);
}

function loadDraft() {
    const saved = localStorage.getItem('veg_bill_draft');
    if(!saved) return;
    const data = JSON.parse(saved);
    document.getElementById('v-name').value = data.vName || "";
    document.getElementById('v-addr').value = data.vAddr || "";
    
    data.items.forEach(item => {
        const row = Array.from(document.querySelectorAll('.veg-row')).find(r => r.dataset.name === item.name);
        if(row) {
            row.querySelector('.qty').value = item.q;
            row.querySelector('.rate').value = item.r;
            calc(row.querySelector('.qty'));
        }
    });
}

async function deleteVegRow(btn, name) {
    if(confirm(`Delete ${name}?`)) {
        const user = await checkAuth();
        if(!user) return;
        await _supabase.from('vegetable_prices').delete().eq('user_id', user.id).eq('veg_name', name);
        btn.closest('tr').remove();
        updateGrandTotal();
    }
}

async function generatePDF() {
    const vName = document.getElementById('v-name').value;
    const billNo = document.getElementById('disp-bill-no').innerText;
    const total = parseFloat(document.getElementById('grand-total').innerText);

    if(total <= 0 || !vName) { 
        showToast("Please enter vendor name and items!", "error"); 
        return; 
    }

    const billElement = document.getElementById('printable-bill');
    billElement.classList.add('is-sharing');

    try {
        const canvas = await html2canvas(billElement, { 
            scale: 4,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = 210;
        const pdfHeight = 297;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        
        const fileName = `Bill_${vName.replace(/\s+/g, '_')}_${billNo}.pdf`;
        
        const pdfBlob = pdf.output('blob');
        
        if (navigator.share && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
            await navigator.share({
                files: [file],
                title: `Bill ${billNo} - ${vName}`
            });
        } else {
            pdf.save(fileName);
            showToast("✅ PDF downloaded!", "success");
        }
    } catch (err) { 
        console.error(err);
        showToast("Error generating PDF", "error");
    } finally {
        billElement.classList.remove('is-sharing');
    }
}

async function finalizeAndPrint() {
    const user = await checkAuth();
    if(!user) return;
    
    const total = parseFloat(document.getElementById('grand-total').innerText);
    const vName = document.getElementById('v-name').value;

    if(total <= 0 || !vName) { 
        showToast("Please enter vendor name and items!", "error"); 
        return; 
    }

    window.print();
}

async function saveBill() {
    const user = await checkAuth();
    if(!user) return;
    
    const total = parseFloat(document.getElementById('grand-total').innerText);
    const vName = document.getElementById('v-name').value;
    const vAddr = document.getElementById('v-addr').value;
    const billNo = parseInt(document.getElementById('disp-bill-no').innerText);

    if(total <= 0 || !vName) { 
        showToast("Please enter vendor name and items!", "error"); 
        return; 
    }

    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.innerText = "Saving...";

    const { data: existing } = await _supabase.from('bills').select('id').eq('user_id', user.id).eq('bill_no', billNo).maybeSingle();
    if(existing) {
        showToast("Bill number already exists!", "error");
        btn.disabled = false;
        btn.innerText = "💾 Save Bill";
        return;
    }

    const { data: billData, error: billError } = await _supabase.from('bills').insert({
        user_id: user.id,
        vendor_name: vName,
        vendor_address: vAddr,
        bill_no: billNo,
        total_amount: total
    }).select().single();

    if(billError) {
        showToast("Error: " + billError.message, "error");
        btn.disabled = false;
        btn.innerText = "💾 Save Bill";
        return;
    }

    const items = [];
    document.querySelectorAll('.veg-row').forEach(row => {
        const q = parseFloat(row.querySelector('.qty').value) || 0;
        const r = parseFloat(row.querySelector('.rate').value) || 0;
        if(q > 0) {
            items.push({
                bill_id: billData.id,
                veg_name: row.dataset.name,
                qty: q,
                rate: r,
                amount: Math.round(q * r)
            });
        }
    });
    if(items.length > 0) await _supabase.from('bill_items').insert(items);

    const vendor = allVendors.find(v => v.name.toLowerCase() === vName.toLowerCase());
    if(vendor) {
        const newDue = (vendor.total_due || 0) + total;
        await _supabase.from('vendors').update({ total_due: newDue }).eq('id', vendor.id);
    }

    showToast(`✅ Bill #${billNo} for ${vName} is ready!`, "success");
    localStorage.setItem('last_saved_bill', billNo);
    localStorage.removeItem('veg_bill_draft');
    
    setTimeout(() => {
        const nextBillNo = billNo + 1;
        document.getElementById('disp-bill-no').innerText = nextBillNo.toString().padStart(5, '0');
        btn.disabled = false;
        btn.innerText = "💾 Save Bill";
    }, 1500);
}

async function viewSavedBill() {
    window.location.href = '../bill-history/';
}

async function loadBillForEdit(billId) {
    const user = await checkAuth();
    if(!user) return;

    const { data: vendors } = await _supabase.from('vendors').select('*').eq('user_id', user.id);
    if(vendors) {
        allVendors = vendors;
        const list = document.getElementById('vendor-list');
        list.innerHTML = vendors.map(v => `<option value="${v.name}">`).join('');
    }

    const { data: vegList } = await _supabase.from('vegetable_prices').select('*').eq('user_id', user.id);
    const tbody = document.getElementById('bill-body');
    tbody.innerHTML = '';
    
    const defaultVeggies = [
        "ALU", "PYAJ", "ADA", "RASUN", "LANKA", "POTOL", "JHINGE", "KAROLA", 
        "BEGUN", "BANDHAKOPI", "PHULKOPI", "TOMATO", "DHONEPATA", "KUMRO",
        "LAU", "BORBOTI", "SIM", "GAJOR", "BEET", "MULO", "DHENROSH", 
        "PEPE", "KANCHAKOLA", "MOCHA", "THOR", "SAJNE DATA", "UCCHE", "LEBU",
        "PATAL", "CHICHINGA", "BARBATI", "MOTOR SHUTI", "FULKOPI", "OL",
        "KOCHU", "LALKUMRO", "SHALGAM", "PALONGSHAK", "LALSAK", "PUISHAK"
    ];
    const dbVegNames = vegList ? vegList.map(v => v.veg_name) : [];
    const allVeggies = [...new Set([...dbVegNames, ...defaultVeggies])];
    
    allVeggies.forEach((name, i) => createRow(name, i + 1));

    const { data: bill } = await _supabase.from('bills').select('*').eq('id', billId).single();
    if (!bill) return;

    const { data: items } = await _supabase.from('bill_items').select('*').eq('bill_id', billId);

    document.getElementById('v-name').value = bill.vendor_name;
    document.getElementById('v-addr').value = bill.vendor_address || '';
    document.getElementById('disp-bill-no').innerText = bill.bill_no.toString().padStart(5, '0');

    items?.forEach(item => {
        const row = Array.from(document.querySelectorAll('.veg-row')).find(r => r.dataset.name === item.veg_name);
        if(row) {
            row.querySelector('.qty').value = item.qty;
            row.querySelector('.rate').value = item.rate;
            calc(row.querySelector('.qty'));
        }
    });

    document.getElementById('save-btn').innerText = '✏️ Update Bill';
    document.getElementById('save-btn').onclick = () => updateBill(billId);
}

async function updateBill(billId) {
    const user = await checkAuth();
    if(!user) return;
    
    const total = parseFloat(document.getElementById('grand-total').innerText);
    const vName = document.getElementById('v-name').value;
    const vAddr = document.getElementById('v-addr').value;

    if(total <= 0 || !vName) { 
        showToast("Please enter vendor name and items!", "error"); 
        return; 
    }

    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.innerText = "Updating...";

    const { error: billError } = await _supabase.from('bills').update({
        vendor_name: vName,
        vendor_address: vAddr,
        total_amount: total
    }).eq('id', billId);

    if(billError) {
        showToast("Error: " + billError.message, "error");
        btn.disabled = false;
        btn.innerText = "✏️ Update Bill";
        return;
    }

    await _supabase.from('bill_items').delete().eq('bill_id', billId);

    const items = [];
    document.querySelectorAll('.veg-row').forEach(row => {
        const q = parseFloat(row.querySelector('.qty').value) || 0;
        const r = parseFloat(row.querySelector('.rate').value) || 0;
        if(q > 0) {
            items.push({
                bill_id: billId,
                veg_name: row.dataset.name,
                qty: q,
                rate: r,
                amount: Math.round(q * r)
            });
        }
    });
    if(items.length > 0) await _supabase.from('bill_items').insert(items);

    showToast(`✅ Bill updated successfully!`, "success");
    
    setTimeout(() => {
        window.location.href = '../bill-history/';
    }, 1500);
}

async function loadOrderToBill(orderJson) {
    const orderData = JSON.parse(orderJson);
    document.getElementById('v-name').value = orderData.vName;
    
    // Trigger vendor select to load address and bill number
    await handleVendorSelect(orderData.vName);
    
    orderData.items.forEach(item => {
        const row = Array.from(document.querySelectorAll('.veg-row')).find(r => r.dataset.name === item.name);
        if(row) {
            row.querySelector('.qty').value = item.qty;
            calc(row.querySelector('.qty'));
        }
    });
    
    showToast("Order loaded! Add rates and save bill.", "success");
}


function showToast(message, type = "success") {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

async function shareBillAsImage() {
    const billElement = document.getElementById('printable-bill');
    billElement.classList.add('is-sharing');
    
    try {
        const canvas = await html2canvas(billElement, { 
            scale: 4,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        const file = new File([blob], "bill.png", { type: "image/png" });

        if (navigator.share) {
            await navigator.share({ files: [file], title: 'Veg Bill' });
        } else {
            const url = URL.createObjectURL(blob);
            window.open(url);
        }
    } catch (err) { 
        console.error(err); 
    } finally {
        billElement.classList.remove('is-sharing');
    }
}

async function addNewVeg() {
    const user = await checkAuth();
    if(!user) return;
    
    const name = prompt("Enter vegetable name:");
    if(name) {
        const upperName = name.toUpperCase();
        
        const { data: existing } = await _supabase
            .from('vegetable_prices')
            .select('*')
            .eq('user_id', user.id)
            .eq('veg_name', upperName)
            .maybeSingle();
        
        if(existing) {
            alert('This vegetable already exists!');
            return;
        }
        
        const { error } = await _supabase.from('vegetable_prices').insert({ 
            user_id: user.id, 
            veg_name: upperName 
        });
        
        if(!error) {
            createRow(upperName, document.querySelectorAll('.veg-row').length + 1);
        } else {
            alert('Error adding vegetable!');
        }
    }
}

function numberToWords(num) {
    const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str || 'Zero';
}

function filterVeg() {
    const query = document.getElementById('veg-search').value.toLowerCase();
    document.querySelectorAll('.veg-row').forEach(row => {
        const name = row.dataset.name.toLowerCase();
        row.style.display = name.includes(query) ? "" : "none";
    });
}

function clearBill() { 
    if(confirm("Clear all entries?")) { 
        localStorage.removeItem('veg_bill_draft'); 
        location.reload(); 
    } 
}

window.onload = initBilling;
