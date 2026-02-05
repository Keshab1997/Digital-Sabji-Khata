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
        document.getElementById('disp-sig-name').innerText = profile.shop_name || "Owner";
    }

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
        <td class="col-kg"><input type="number" step="0.001" class="qty" placeholder="0.000" oninput="calc(this)"></td>
        <td class="col-rate"><input type="number" class="rate" placeholder="0" oninput="calc(this)"></td>
        <td class="col-amt row-total">0</td>
        <td class="col-del no-print"><button onclick="deleteVegRow(this, '${name}')">×</button></td>
    `;
    document.getElementById('bill-body').appendChild(tr);
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

async function finalizeAndPrint() {
    const user = await checkAuth();
    if(!user) return;
    
    const total = parseFloat(document.getElementById('grand-total').innerText);
    const vName = document.getElementById('v-name').value;
    const billNo = parseInt(document.getElementById('disp-bill-no').innerText);

    if(total <= 0 || !vName) { alert("Please enter vendor name and items!"); return; }

    await _supabase.from('bills').insert({
        user_id: user.id,
        vendor_name: vName,
        bill_no: billNo,
        total_amount: total,
        created_at: new Date()
    });

    window.print();
    localStorage.removeItem('veg_bill_draft');
}

async function shareBillAsImage() {
    const billElement = document.getElementById('printable-bill');
    const inputs = billElement.querySelectorAll('input');
    inputs.forEach(i => i.style.border = 'none');

    try {
        const canvas = await html2canvas(billElement, { scale: 2 });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], "bill.png", { type: "image/png" });

        if (navigator.share) {
            await navigator.share({ files: [file], title: 'Veg Bill' });
        } else {
            const url = URL.createObjectURL(blob);
            window.open(url);
        }
    } catch (err) { console.error(err); }
    finally { inputs.forEach(i => i.style.borderBottom = '1px dotted #003366'); }
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
