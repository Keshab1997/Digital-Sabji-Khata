const defaultVegList = ["ALU", "PYAJ", "ADA", "RASUN", "LANKA", "POTOL", "JHINGE", "KAROLA", "BEGUN", "TOMATO", "KUMRO", "LAU", "BORBOTI", "SIM", "GAJOR", "BEET", "MULO", "DHENROSH", "PEPE", "LEBU"];

async function initBilling() {
    const user = await checkAuth();
    document.getElementById('disp-date').innerText = new Date().toLocaleDateString('en-GB');
    document.getElementById('disp-bill-no').innerText = Date.now().toString().slice(-6);

    const { data: profile } = await _supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
        document.getElementById('disp-shop-name').innerText = profile.shop_name || "SHOP NAME";
        document.getElementById('disp-slogan').innerText = profile.slogan || "";
        document.getElementById('disp-address').innerText = profile.address || "";
        document.getElementById('disp-mobile').innerText = "Mobile: " + (profile.mobile || "");
        document.getElementById('disp-sig-name').innerText = profile.shop_name || "Owner";
    }
    renderVegList();
}

function renderVegList() {
    const tbody = document.getElementById('bill-body');
    tbody.innerHTML = '';
    defaultVegList.forEach((name, i) => createRow(name, i + 1));
}

function createRow(name, sl) {
    const tr = document.createElement('tr');
    tr.className = 'veg-row empty-row';
    tr.dataset.name = name;
    tr.innerHTML = `
        <td style="text-align:center">${sl}</td>
        <td><b>${name}</b></td>
        <td><input type="number" class="qty" placeholder="0" oninput="calc(this)"></td>
        <td><input type="number" class="rate" placeholder="0" oninput="calc(this)"></td>
        <td class="row-total" style="font-weight:bold">0</td>
    `;
    document.getElementById('bill-body').appendChild(tr);
}

function calc(el) {
    const row = el.closest('tr');
    const q = parseFloat(row.querySelector('.qty').value) || 0;
    const r = parseFloat(row.querySelector('.rate').value) || 0;
    const total = q * r;
    row.querySelector('.row-total').innerText = total > 0 ? total : 0;
    
    if(total > 0) row.classList.remove('empty-row');
    else row.classList.add('empty-row');

    updateGrandTotal();
}

function updateGrandTotal() {
    let total = 0;
    document.querySelectorAll('.row-total').forEach(td => total += parseFloat(td.innerText));
    document.getElementById('grand-total').innerText = total;
    document.getElementById('amt-words').innerText = numberToWords(total) + " Rupees Only";
}

async function shareBillAsImage() {
    const billElement = document.getElementById('printable-bill');
    const inputs = billElement.querySelectorAll('input');
    inputs.forEach(i => i.style.border = 'none');

    try {
        const canvas = await html2canvas(billElement, { scale: 2, useCORS: true });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], "bill.png", { type: "image/png" });

        if (navigator.share) {
            await navigator.share({
                files: [file],
                title: 'Vegetable Bill',
                text: 'Your bill is attached.'
            });
        } else {
            alert("Your browser doesn't support direct sharing. Please take a screenshot.");
        }
    } catch (err) {
        console.error("Error sharing:", err);
        alert("Error generating image. Please try print instead.");
    } finally {
        inputs.forEach(i => i.style.borderBottom = '1px dotted #003366');
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

function addNewVeg() {
    const name = prompt("Enter vegetable name:");
    if(name) {
        createRow(name.toUpperCase(), document.querySelectorAll('.veg-row').length + 1);
        const scrollArea = document.querySelector('.scrollable-content');
        scrollArea.scrollTop = scrollArea.scrollHeight;
    }
}

function clearBill() {
    if(confirm("Clear all entries?")) location.reload();
}

window.onload = initBilling;
