let currentProfile = null;

async function initBilling() {
    const user = await checkAuth();
    document.getElementById('disp-date').innerText = new Date().toLocaleDateString('en-GB');

    const { data: profile } = await _supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
        currentProfile = profile;
        document.getElementById('disp-shop-name').innerText = profile.shop_name || "SHOP NAME";
        document.getElementById('disp-slogan').innerText = profile.slogan || "";
        document.getElementById('disp-address').innerText = profile.address || "";
        document.getElementById('disp-mobile').innerText = "Mobile: " + (profile.mobile || "");
        document.getElementById('disp-sig-name').innerText = profile.shop_name || "Owner";
        
        let nextBillNo = (profile.last_bill_no || 0) + 1;
        document.getElementById('disp-bill-no').innerText = nextBillNo.toString().padStart(5, '0');
    }

    const { data: vegList } = await _supabase.from('vegetable_prices').select('veg_name').eq('user_id', user.id);
    
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
    
    if (vegList && vegList.length > 0) {
        const dbVegNames = vegList.map(v => v.veg_name);
        const allVeggies = [...new Set([...dbVegNames, ...defaultVeggies])];
        allVeggies.forEach((name, i) => createRow(name, i + 1));
    } else {
        defaultVeggies.forEach((name, i) => createRow(name, i + 1));
    }
}

function createRow(name, sl) {
    const tr = document.createElement('tr');
    tr.className = 'veg-row empty-row';
    tr.dataset.name = name;
    tr.innerHTML = `
        <td class="col-sl">${sl}</td>
        <td class="col-desc"><b>${name}</b></td>
        <td class="col-kg"><input type="number" class="qty" placeholder="0" oninput="calc(this)"></td>
        <td class="col-rate"><input type="number" class="rate" placeholder="0" oninput="calc(this)"></td>
        <td class="col-amt row-total" style="font-weight:bold; text-align:center;">0</td>
    `;
    document.getElementById('bill-body').appendChild(tr);
}

function calc(el) {
    const row = el.closest('tr');
    const q = parseFloat(row.querySelector('.qty').value) || 0;
    const r = parseFloat(row.querySelector('.rate').value) || 0;
    const total = q * r;
    row.querySelector('.row-total').innerText = total > 0 ? Math.round(total) : 0;
    
    if(total > 0) row.classList.remove('empty-row');
    else row.classList.add('empty-row');

    updateGrandTotal();
}

function updateGrandTotal() {
    let total = 0;
    document.querySelectorAll('.row-total').forEach(td => total += parseFloat(td.innerText));
    document.getElementById('grand-total').innerText = Math.round(total);
    document.getElementById('amt-words').innerText = numberToWords(Math.round(total)) + " Rupees Only";
}

async function finalizeAndPrint() {
    const user = await checkAuth();
    const total = parseFloat(document.getElementById('grand-total').innerText);
    if(total <= 0) { alert("Bill is empty!"); return; }

    const nextBillNo = (currentProfile.last_bill_no || 0) + 1;
    await _supabase.from('profiles').update({ last_bill_no: nextBillNo }).eq('id', user.id);
    
    window.print();
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
            alert("Sharing not supported on this browser.");
        }
    } catch (err) { console.error(err); }
    finally { inputs.forEach(i => i.style.borderBottom = '1px dotted #003366'); }
}

async function addNewVeg() {
    const user = await checkAuth();
    const name = prompt("Enter vegetable name:");
    if(name) {
        const upperName = name.toUpperCase();
        const { error } = await _supabase.from('vegetable_prices').upsert({ user_id: user.id, veg_name: upperName });
        
        if(!error) {
            createRow(upperName, document.querySelectorAll('.veg-row').length + 1);
            const scrollArea = document.querySelector('.scrollable-content');
            scrollArea.scrollTop = scrollArea.scrollHeight;
        } else {
            alert("Error saving vegetable!");
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

function clearBill() { if(confirm("Clear all entries?")) location.reload(); }

window.onload = initBilling;
