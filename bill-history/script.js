let currentVendor = null;
let allBills = [];
let currentPage = 0;
const BILLS_PER_PAGE = 10;

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const vendorName = urlParams.get('vendor');
  
  if(vendorName) {
    await loadVendorBills(vendorName);
  } else {
    await loadVendors();
  }
}

async function loadVendors() {
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) {
    window.location.href = '../login/';
    return;
  }

  const { data: bills, error } = await _supabase
    .from('bills')
    .select('id, vendor_name, vendor_address, total_amount, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading bills:', error);
    document.getElementById('vendorList').innerHTML = '<p>Error loading bills</p>';
    return;
  }

  if (!bills || bills.length === 0) {
    document.getElementById('vendorList').innerHTML = '<p>No bills found</p>';
    return;
  }

  const vendorMap = {};
  bills.forEach(bill => {
    if (!vendorMap[bill.vendor_name]) {
      vendorMap[bill.vendor_name] = {
        name: bill.vendor_name,
        address: bill.vendor_address,
        totalBills: 0,
        totalAmount: 0
      };
    }
    vendorMap[bill.vendor_name].totalBills++;
    vendorMap[bill.vendor_name].totalAmount += bill.total_amount;
  });

  const vendorList = document.getElementById('vendorList');
  vendorList.innerHTML = Object.values(vendorMap).map(vendor => `
    <div class="vendor-card" onclick="loadVendorBills('${vendor.name}')">
      <h3>${vendor.name}</h3>
      <p>${vendor.address || ''}</p>
      <p>Total Bills: ${vendor.totalBills} | Amount: ₹${vendor.totalAmount.toFixed(2)}</p>
    </div>
  `).join('');
}

async function loadVendorBills(vendorName) {
  currentVendor = vendorName;
  currentPage = 0;
  allBills = [];
  const { data: { user } } = await _supabase.auth.getUser();

  const { data: bills } = await _supabase
    .from('bills')
    .select('*')
    .eq('user_id', user.id)
    .eq('vendor_name', vendorName)
    .order('bill_no', { ascending: true })
    .range(0, BILLS_PER_PAGE - 1);

  allBills = bills || [];
  displayBills(allBills, true);

  document.getElementById('vendorList').style.display = 'none';
  document.getElementById('billList').style.display = 'block';
}

function displayBills(bills, isFirstLoad = false) {
  const billList = document.getElementById('billList');
  
  if (!bills || bills.length === 0) {
    if (isFirstLoad) {
      billList.innerHTML = `
        <div class="bill-header">
          <h2>${currentVendor}</h2>
          <button class="btn" onclick="backToVendors()">Back</button>
        </div>
        <p>No bills found</p>
      `;
    }
    return;
  }

  const billsHTML = bills.map((bill, index) => {
    const isToday = new Date(bill.created_at).toDateString() === new Date().toDateString();
    const isRecent = index === 0 && isFirstLoad;
    return `
      <div class="bill-card ${isToday ? 'bill-today' : ''} ${isRecent ? 'bill-recent' : ''}">
        <div class="bill-info">
          <h4>Bill #${bill.bill_no} ${isToday ? '<span class="today-badge">TODAY</span>' : ''}</h4>
          <p>Date: ${new Date(bill.created_at).toLocaleDateString('en-IN')}</p>
          <p>Amount: ₹${bill.total_amount.toFixed(2)}</p>
        </div>
        <div class="bill-actions">
          <button class="icon-btn btn-image" onclick="viewBillImage(${bill.id})" title="View Bill">
            📄
          </button>
          <button class="icon-btn btn-edit" onclick="editBill(${bill.id})" title="Edit Bill">
            ✏️
          </button>
          <button class="icon-btn btn-delete" onclick="deleteBill(${bill.id})" title="Delete Bill">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (isFirstLoad) {
    billList.innerHTML = `
      <div class="bill-header">
        <h2>${currentVendor}</h2>
        <button class="btn" onclick="backToVendors()">Back</button>
      </div>
      <div id="billCards">${billsHTML}</div>
      <button id="loadMoreBtn" class="btn btn-load-more" onclick="loadMoreBills()" style="width: 100%; margin-top: 10px;">Load More</button>
    `;
  } else {
    document.getElementById('billCards').insertAdjacentHTML('beforeend', billsHTML);
  }
  
  checkLoadMoreButton();
}

async function loadMoreBills() {
  const { data: { user } } = await _supabase.auth.getUser();
  currentPage++;

  const { data: bills } = await _supabase
    .from('bills')
    .select('*')
    .eq('user_id', user.id)
    .eq('vendor_name', currentVendor)
    .order('bill_no', { ascending: true })
    .range(currentPage * BILLS_PER_PAGE, (currentPage + 1) * BILLS_PER_PAGE - 1);

  if (bills && bills.length > 0) {
    allBills = [...allBills, ...bills];
    displayBills(bills, false);
  }
}

function checkLoadMoreButton() {
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn && allBills.length < BILLS_PER_PAGE * (currentPage + 1)) {
    loadMoreBtn.style.display = 'none';
  }
}

function backToVendors() {
  document.getElementById('vendorList').style.display = 'block';
  document.getElementById('billList').style.display = 'none';
  currentVendor = null;
}

async function viewBillImage(billId) {
  const bill = allBills.find(b => b.id === billId);
  if (!bill) return;

  const { data: items } = await _supabase
    .from('bill_items')
    .select('*')
    .eq('bill_id', billId);

  const { data: { user } } = await _supabase.auth.getUser();
  const { data: profile } = await _supabase.from('profiles').select('*').eq('id', user.id).single();

  const billHTML = `
    <div class="bill-paper" style="background: white; color: #003366; border: 1.5px solid #003366; padding: 12px;">
      <div style="text-align: center; border-bottom: 2px solid #003366; padding-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold;">
          <span>Bill No: <b>${bill.bill_no}</b></span>
          <span>Date: <b>${new Date(bill.created_at).toLocaleDateString('en-GB')}</b></span>
        </div>
        <h1 style="font-size: 18px; margin: 4px 0; text-decoration: underline; font-weight: 900;">${profile?.shop_name || 'SHOP NAME'}</h1>
        <p style="font-size: 9px; font-weight: bold; margin: 1px 0;">${profile?.slogan || ''}</p>
        <p style="font-size: 9px; font-weight: bold; margin: 1px 0;">${profile?.address || ''}</p>
        <p style="font-size: 9px; font-weight: bold; margin: 1px 0;">Mobile: ${profile?.mobile || ''}</p>
        <p style="font-size: 14px; margin: 5px 0 0 0; letter-spacing: 5px;">🥕 🥔 🥦 🌶️ 🥒 🍅 🥬 🧅</p>
      </div>
      <div style="margin: 8px 0;">
        <div style="font-size: 11px; font-weight: bold; margin-bottom: 3px;">Name: ${bill.vendor_name}</div>
        <div style="font-size: 11px; font-weight: bold;">Address: ${bill.vendor_address || ''}</div>
      </div>
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #003366;">
        <thead>
          <tr>
            <th style="border: 1px solid #003366; padding: 4px 2px; font-size: 10px; background: #f0f4f8; font-weight: 900; text-align: center;">Sl.</th>
            <th style="border: 1px solid #003366; padding: 4px 2px; font-size: 10px; background: #f0f4f8; font-weight: 900; text-align: center;">Description</th>
            <th style="border: 1px solid #003366; padding: 4px 2px; font-size: 10px; background: #f0f4f8; font-weight: 900; text-align: center;">KG</th>
            <th style="border: 1px solid #003366; padding: 4px 2px; font-size: 10px; background: #f0f4f8; font-weight: 900; text-align: center;">Rate</th>
            <th style="border: 1px solid #003366; padding: 4px 2px; font-size: 10px; background: #f0f4f8; font-weight: 900; text-align: center;">Amt</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, i) => `
            <tr>
              <td style="border: 1px solid #003366; padding: 4px 2px; font-size: 10px; text-align: center;">${i + 1}</td>
              <td style="border: 1px solid #003366; padding: 4px 2px; font-size: 10px; padding-left: 5px; font-weight: bold;">${item.veg_name}</td>
              <td style="border: 1px solid #003366; padding: 4px 2px; font-size: 10px; text-align: center;">${item.qty}</td>
              <td style="border: 1px solid #003366; padding: 4px 2px; font-size: 10px; text-align: center;">${item.rate}</td>
              <td style="border: 1px solid #003366; padding: 4px 2px; font-size: 11px; text-align: right; font-weight: 900; padding-right: 5px;">${item.amount}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="border: 1px solid #003366; padding: 4px 2px; font-size: 11px; text-align: right; font-weight: bold; padding-right: 4px;">TOTAL</td>
            <td style="border: 1px solid #003366; padding: 4px 2px; font-size: 13px; font-weight: 900; text-align: right; background: #f0f4f8; padding-right: 5px;">${bill.total_amount}</td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top: 12px; font-size: 10px;">
        <p><b>Rupees in words:</b> <i>${numberToWords(bill.total_amount)} Rupees Only</i></p>
        <div style="text-align: right; margin-top: 15px;">
          <p style="margin-bottom: 5px;">For, <span>${profile?.shop_name || 'Shop Owner'}</span></p>
          <div style="font-family: 'Brush Script MT', cursive; font-style: italic; font-size: 18px; margin-top: 30px; margin-bottom: 5px;">${profile?.signature_name || profile?.shop_name || 'Owner'}</div>
          <div style="border-top: 1px solid #003366; display: inline-block; width: 110px; text-align: center; padding-top: 2px; font-size: 9px; font-weight: bold;">Signature</div>
        </div>
        <div style="margin-top: 20px; font-size: 8px; text-align: center; color: #888; border-top: 1px solid #eee; padding-top: 5px;">Developed by: Keshab Sarkar</div>
      </div>
    </div>
  `;

  const preview = document.getElementById('billPreview');
  preview.innerHTML = `
    <div class="bill-preview-content">
      <div class="preview-actions">
        <button class="btn-share" onclick="shareBillFromPreview(${billId})">📤 Share</button>
        <button class="btn-close" onclick="closeBillPreview()">✕ Close</button>
      </div>
      <div id="billContent">${billHTML}</div>
    </div>
  `;
  preview.style.display = 'block';
}

function closeBillPreview() {
  document.getElementById('billPreview').style.display = 'none';
}

async function shareBillFromPreview(billId) {
  const bill = allBills.find(b => b.id === billId);
  const billContent = document.getElementById('billContent');
  
  try {
    const canvas = await html2canvas(billContent, { 
      scale: 4,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
    const fileName = `Bill_${bill.vendor_name.replace(/\s+/g, '_')}_${bill.bill_no}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Bill ${bill.bill_no} - ${bill.vendor_name}`
      });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    }
  } catch (err) {
    console.error(err);
    alert('Error sharing bill');
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

async function editBill(billId) {
  const bill = allBills.find(b => b.id === billId);
  if (!bill) return;

  localStorage.setItem('edit_bill_id', billId);
  window.location.href = '../billing/';
}

async function deleteBill(billId) {
  if (!confirm('Are you sure you want to delete this bill?')) return;

  const { error: itemsError } = await _supabase
    .from('bill_items')
    .delete()
    .eq('bill_id', billId);

  if (itemsError) {
    alert('Error deleting bill items');
    return;
  }

  const { error: billError } = await _supabase
    .from('bills')
    .delete()
    .eq('id', billId);

  if (billError) {
    alert('Error deleting bill');
    return;
  }

  await loadVendorBills(currentVendor);
}

function applyFilters() {
  const dateFrom = document.getElementById('dateFrom').value;
  const dateTo = document.getElementById('dateTo').value;

  let filtered = [...allBills];

  if (dateFrom) {
    filtered = filtered.filter(bill => new Date(bill.created_at) >= new Date(dateFrom));
  }

  if (dateTo) {
    filtered = filtered.filter(bill => new Date(bill.created_at) <= new Date(dateTo + 'T23:59:59'));
  }

  filtered.sort((a, b) => a.bill_no - b.bill_no);

  displayBills(filtered, true);
  document.getElementById('loadMoreBtn').style.display = 'none';
}

function hideMobileNav() {
  const mobileNav = document.querySelector('.mobile-nav');
  if(mobileNav) mobileNav.style.display = 'none';
}

function showMobileNav() {
  setTimeout(() => {
    const mobileNav = document.querySelector('.mobile-nav');
    if(mobileNav) mobileNav.style.display = 'flex';
  }, 100);
}

init();
