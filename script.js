/* ===== NAVIGASI ===== */
const LOGO_HTML = `
  <div class="logo-box">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Danantara_Indonesia_%28no_SW%29.svg/3840px-Danantara_Indonesia_%28no_SW%29.svg.png" alt="Danantara"/>
    <div class="sep"></div>
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Pegadaian_logo_%282013%29.svg/1280px-Pegadaian_logo_%282013%29.svg.png" alt="Pegadaian"/>
  </div>`;

const headers = {
  pageIndex:      `${LOGO_HTML}<div class="header-badge">Selamat Datang 😊</div>`,
  pageDigiTaksir: `${LOGO_HTML}<div class="header-center"><h2>DIGI-<span>TAKSIR</span></h2><p>Digital Appraisal &amp; Education System</p></div><button class="btn-back" onclick="showPage('pageIndex')">← Kembali</button>`,
  pageCicilEmas:  `${LOGO_HTML}<div class="header-center"><h2>CICIL <span>EMAS</span></h2><p>Galeri 24 — Simulasi Angsuran</p></div><button class="btn-back" onclick="showPage('pageIndex')">← Kembali</button>`,
};

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('siteHeader').innerHTML = headers[id] || headers.pageIndex;
  window.scrollTo(0,0);
  if (id === 'pageCicilEmas') renderTable();
  if (id === 'pageDigiTaksir') {
    const countEl = document.getElementById('countDisplay');
    if (countEl) countEl.innerText = localStorage.getItem('digitaksir_usage') || 0;
  }
}

// Inisialisasi header
document.getElementById('siteHeader').innerHTML = headers.pageIndex;

/* ===== DIGI-TAKSIR LOGIC ===== */
let selectedProduct = '';
let currentType  = 'perhiasan';
let currentMode  = 'taksir';
let myChart      = null;
let itemCounter  = 0;
let itemsData    = [];

const STL_PERHIASAN = 2290196;
const STL_GALERI24  = 2358902;
const STL_ANTAM     = 2290196;
const STL_UBS       = 2290196;

function getSTLBatangan() {
  const v = document.getElementById('merekBatangan')?.value || 'galeri24';
  return v === 'galeri24' ? STL_GALERI24 : v === 'antam' ? STL_ANTAM : STL_UBS;
}

function updateCounter() {
  let c = parseInt(localStorage.getItem('digitaksir_usage') || 0) + 1;
  localStorage.setItem('digitaksir_usage', c);
  const el = document.getElementById('countDisplay');
  if (el) el.innerText = c;
}

function selectProduct(prod) {
  selectedProduct = prod;
  document.getElementById('productSelection').style.display = 'none';
  document.getElementById('inputSection').classList.remove('hidden');
  document.getElementById('panelHasil').style.display = 'none';
  const list = document.getElementById('itemList');
  if (list && list.children.length === 0) initItems();
  updateTenor();
}

function goBack() {
  document.getElementById('productSelection').style.display = 'block';
  document.getElementById('inputSection').classList.add('hidden');
  document.getElementById('panelHasil').style.display = 'none';
  resetFeedback();
}

function switchMode(mode) {
  currentMode = mode;
  document.getElementById('btnModeTaksir').classList.toggle('active',  mode === 'taksir');
  document.getElementById('btnModeInputUP').classList.toggle('active', mode === 'inputUP');
  document.getElementById('sectionTaksir').classList.toggle('hidden',  mode === 'inputUP');
  document.getElementById('sectionInputUP').classList.toggle('hidden', mode === 'taksir');
}

function switchType(type) {
  currentType = type;
  document.getElementById('btnPerhiasan').classList.toggle('active', type === 'perhiasan');
  document.getElementById('btnBatangan').classList.toggle('active',  type === 'batangan');
  document.getElementById('formPerhiasan').classList.toggle('hidden', type === 'batangan');
  document.getElementById('formBatangan').classList.toggle('hidden',  type === 'perhiasan');
  if (type === 'batangan')  updateMerekInfo();
  if (type === 'perhiasan') {
    const list = document.getElementById('itemList');
    if (list && list.children.length === 0) initItems();
  }
}

function onMerekChange() { updateMerekInfo(); }

function updateMerekInfo() {
  const el = document.getElementById('infoMerek');
  if (!el) return;
  const merek = document.getElementById('merekBatangan')?.value || 'galeri24';
  const stl   = getSTLBatangan();
  const labels = {galeri24:'Galeri 24 — STL Khusus (lebih tinggi)',antam:'ANTAM — STL mengikuti perhiasan',ubs:'UBS — STL mengikuti perhiasan'};
  el.innerText = labels[merek] + ' | STL: Rp ' + stl.toLocaleString('id-ID') + '/gram';
}

function updateTenor() {
  const tenor = document.getElementById('tenor');
  tenor.innerHTML = '';
  if (selectedProduct === 'KCA')     tenor.add(new Option('120 Hari','120'));
  else if (selectedProduct === 'FLEKSI') [15,30,60,180].forEach(d=>tenor.add(new Option(d+' Hari',d)));
  else if (selectedProduct === 'KRASIDA') [6,12,18,24,36,48].forEach(m=>tenor.add(new Option(m+' Bulan',m)));
}

/* ---- Multi-Item Perhiasan ---- */
function initItems() {
  itemsData = []; itemCounter = 0;
  document.getElementById('itemList').innerHTML = '';
  addItem();
  updateTotalTaksiranDisplay();
}

function addItem() {
  if (itemCounter >= 10) { alert('Maksimal 10 item.'); return; }
  itemCounter++;
  const id = itemCounter;
  const opts = [6,8,10,12,14,15,16,17,18,19,20,21,22,23]
    .map(k=>`<option value="${k}"${k===18?' selected':''}>${k} Karat</option>`).join('');
  const html = `
  <div class="item-row" id="item-${id}">
    <div class="item-header">
      <span class="item-label">Item ${id}</span>
      ${id>1?`<button class="btn-remove-item" onclick="removeItem(${id})">✕ Hapus</button>`:''}
    </div>
    <div class="item-fields">
      <div class="item-field">
        <label>Kadar</label>
        <select id="kadar-${id}" onchange="recalcItem(${id})">${opts}</select>
      </div>
      <div class="item-field">
        <label>Berat (gr)</label>
        <input type="number" id="berat-${id}" placeholder="0.00" step="0.01" oninput="recalcItem(${id})">
      </div>
      <div class="item-field item-field-full">
        <label>Taksiran</label>
        <div class="item-taksiran" id="taksiran-${id}">Rp —</div>
      </div>
    </div>
  </div>`;
  document.getElementById('itemList').insertAdjacentHTML('beforeend', html);
  itemsData.push({id, taksiran:0});
  updateTotalTaksiranDisplay();
  document.getElementById('btnAddItem').style.display = itemsData.length>=10?'none':'block';
}

function removeItem(id) {
  document.getElementById(`item-${id}`)?.remove();
  itemsData = itemsData.filter(it=>it.id!==id);
  updateTotalTaksiranDisplay();
  document.getElementById('btnAddItem').style.display = itemsData.length>=10?'none':'block';
}

function recalcItem(id) {
  const berat = parseFloat(document.getElementById(`berat-${id}`)?.value)||0;
  const karat = parseFloat(document.getElementById(`kadar-${id}`)?.value);
  const t = berat>0 ? berat*(karat/24)*STL_PERHIASAN : 0;
  const entry = itemsData.find(it=>it.id===id);
  if (entry) entry.taksiran = t;
  const el = document.getElementById(`taksiran-${id}`);
  if (el) el.innerText = t>0?'Rp '+Math.round(t).toLocaleString('id-ID'):'Rp —';
  updateTotalTaksiranDisplay();
}

function updateTotalTaksiranDisplay() {
  const total = itemsData.reduce((s,it)=>s+(it.taksiran||0),0);
  const row = document.getElementById('rowTotalTaksiran');
  const el  = document.getElementById('totalTaksiranDisplay');
  if (!row||!el) return;
  if (total>0){row.style.display='flex';el.innerText='Rp '+Math.round(total).toLocaleString('id-ID');}
  else row.style.display='none';
}

/* ---- Hitung ---- */
function hitungTaksiran() {
  const isTaksir    = document.getElementById('btnModeTaksir')?.classList.contains('active');
  const isPerhiasan = document.getElementById('btnPerhiasan')?.classList.contains('active');
  const tenorVal    = parseInt(document.getElementById('tenor').value);
  let upFinal=0, taksiran=0;

  document.getElementById('inputNominalUP')?.classList.remove('input-error');

  if (isTaksir) {
    if (isPerhiasan) {
      let ok=true;
      itemsData.forEach(it=>{
        if ((parseFloat(document.getElementById(`berat-${it.id}`)?.value)||0)<=0){
          alert(`Item ${it.id}: masukkan berat > 0 gram`); ok=false;
        }
      });
      if (!ok) return;
      taksiran = itemsData.reduce((s,it)=>s+(it.taksiran||0),0);
      if (taksiran<=0){alert('Tidak ada item dengan taksiran valid.');return;}
      const rs = document.getElementById('rincianItemSection');
      const rb = document.getElementById('bodyRincianItem');
      if (rs&&rb){
        rs.classList.remove('hidden');
        rb.innerHTML = itemsData.map((it,i)=>{
          const k=document.getElementById(`kadar-${it.id}`)?.value||'-';
          const b=document.getElementById(`berat-${it.id}`)?.value||'-';
          return `<tr><td>Item ${i+1}</td><td>${k} Karat</td><td>${b} gr</td><td>Rp ${Math.round(it.taksiran).toLocaleString('id-ID')}</td></tr>`;
        }).join('');
      }
    } else {
      taksiran = parseFloat(document.getElementById('denominasi').value)*getSTLBatangan();
      document.getElementById('rincianItemSection')?.classList.add('hidden');
    }
    let plafon = selectedProduct==='KRASIDA'?0.95:0.92;
    if (selectedProduct==='FLEKSI'&&tenorVal==15) plafon=0.96;
    upFinal = Math.floor(taksiran*plafon/1000)*1000;
    document.getElementById('rowTaksiran').classList.remove('hidden');
    document.getElementById('titleUP').innerText = 'Uang Pinjaman (UP)';
  } else {
    upFinal = parseFloat(document.getElementById('inputNominalUP').value)||0;
    if (upFinal<50000){alert('Minimal pinjaman Rp 50.000');document.getElementById('inputNominalUP').classList.add('input-error');return;}
    document.getElementById('rowTaksiran').classList.add('hidden');
    document.getElementById('rincianItemSection')?.classList.add('hidden');
    document.getElementById('titleUP').innerText = 'Nominal Pinjaman';
  }

  let sewaDesc='',estimasiSewa=0,unitWaktu='',totalSewaGrafik=0;
  let dt=new Date();
  document.getElementById('sectionDetailKCA').classList.add('hidden');
  document.getElementById('bodyTabelKCA').innerHTML='';

  if (selectedProduct==='KCA'){
    const tarif = upFinal>20100000?0.011:0.012;
    sewaDesc=(tarif*100).toFixed(1)+'% / 15 Hari';
    estimasiSewa=upFinal*tarif; unitWaktu=' / 15 Hari';
    dt.setDate(dt.getDate()+120);
    document.getElementById('lblSewaNominal').innerText='Estimasi Sewa (Per 15 Hari):';
    totalSewaGrafik=estimasiSewa*8;
    document.getElementById('sectionDetailKCA').classList.remove('hidden');
    let rows='';
    for(let i=1;i<=8;i++) rows+=`<tr><td>Ke-${i}</td><td>${i*15}</td><td>Rp ${Math.round(upFinal*tarif*i).toLocaleString('id-ID')}</td></tr>`;
    document.getElementById('bodyTabelKCA').innerHTML=rows;
  } else if (selectedProduct==='FLEKSI'){
    sewaDesc='0.07% / Hari'; estimasiSewa=upFinal*0.0007; unitWaktu=' / Hari';
    dt.setDate(dt.getDate()+tenorVal);
    document.getElementById('lblSewaNominal').innerText='Estimasi Sewa:';
    totalSewaGrafik=estimasiSewa*tenorVal;
  } else if (selectedProduct==='KRASIDA'){
    let tarif=0.0125;
    if(tenorVal===18||tenorVal===36) tarif=0.013;
    else if(tenorVal===48) tarif=0.014;
    sewaDesc=(tarif*100).toFixed(2)+'% / Bulan';
    estimasiSewa=upFinal/tenorVal+upFinal*tarif; unitWaktu=' / Bulan';
    dt.setMonth(dt.getMonth()+tenorVal);
    document.getElementById('lblSewaNominal').innerText='Angsuran Tetap:';
    totalSewaGrafik=upFinal*tarif*tenorVal;
  }

  document.getElementById('resUP').innerText         = 'Rp '+upFinal.toLocaleString('id-ID');
  document.getElementById('resTaksiran').innerText    = 'Rp '+Math.round(taksiran).toLocaleString('id-ID');
  document.getElementById('resSewaDesc').innerText    = sewaDesc;
  document.getElementById('resSewaNominal').innerText = '± Rp '+Math.round(estimasiSewa).toLocaleString('id-ID')+unitWaktu;
  document.getElementById('resJatuhTempo').innerText  = dt.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  document.getElementById('panelHasil').style.display='block';
  document.getElementById('panelHasil').scrollIntoView({behavior:'smooth'});

  const ctx=document.getElementById('loanChart').getContext('2d');
  if (myChart) myChart.destroy();
  myChart=new Chart(ctx,{
    type:'doughnut',
    data:{labels:['Uang Diterima','Total Sewa'],datasets:[{data:[upFinal,totalSewaGrafik],backgroundColor:['#008444','#ffcc00'],borderWidth:2,borderColor:'#fff'}]},
    options:{responsive:true,plugins:{legend:{position:'bottom',labels:{boxWidth:12,font:{size:11}}},tooltip:{callbacks:{label:c=>c.label+': Rp '+Math.round(c.raw).toLocaleString('id-ID')}}},cutout:'65%'}
  });

  updateCounter();
  resetFeedback();

  // Otomatis isi nilai UP ke kolom perbandingan
  const cmpUp = document.getElementById('cmpUP');
  if (cmpUp && !cmpUp.value) cmpUp.value = upFinal;
}

function setRating(n){
  document.querySelectorAll('#starContainer span').forEach((s,i)=>s.classList.toggle('selected',i<n));
  alert('Terima kasih! Rating '+n+' bintang Anda telah terekam.');
}
function resetFeedback(){document.querySelectorAll('#starContainer span').forEach(s=>s.classList.remove('selected'));}

/* =====================================================
   [FITUR BARU 1] LOGIKA PERBANDINGAN SEWA MODAL
   ===================================================== */
function toggleCompareSection() {
  const body = document.getElementById('compareBody');
  const icon = document.getElementById('compareToggleIcon');
  const isOpen = body.classList.toggle('open');
  icon.classList.toggle('open', isOpen);
}

function hitungCompare() {
  const upRaw = parseFloat(document.getElementById('cmpUP').value) || 0;
  if (upRaw < 50000) { alert('Masukkan nominal UP minimal Rp 50.000'); return; }

  const fmt = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');

  // — KCA —
  const tarifKCA   = upRaw > 20100000 ? 0.011 : 0.012;
  const sewaKCA15  = upRaw * tarifKCA;                  // per 15 hari
  const sewaKCATot = sewaKCA15 * 8;                     // 8 periode = 120 hari
  const dtKCA      = new Date(); dtKCA.setDate(dtKCA.getDate() + 120);

  // — FLEKSI —
  const tenorFleksi = parseInt(document.getElementById('cmpTenorFleksi').value);
  const sewaFleksi1 = upRaw * 0.0007;                   // per hari
  const sewaFleksiTot = sewaFleksi1 * tenorFleksi;
  const dtFleksi    = new Date(); dtFleksi.setDate(dtFleksi.getDate() + tenorFleksi);

  // — KRASIDA —
  const tenorKrasida = parseInt(document.getElementById('cmpTenorKrasida').value);
  let tarifKrasida   = 0.0125;
  if (tenorKrasida === 18 || tenorKrasida === 36) tarifKrasida = 0.013;
  else if (tenorKrasida === 48) tarifKrasida = 0.014;
  const angsuranKrasida = (upRaw / tenorKrasida) + (upRaw * tarifKrasida);
  const sewaKrasidaTot  = upRaw * tarifKrasida * tenorKrasida;
  const dtKrasida       = new Date(); dtKrasida.setMonth(dtKrasida.getMonth() + tenorKrasida);

  const fmtDate = d => d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});

  document.getElementById('compareResult').innerHTML = `
  <div class="compare-table-wrap">
    <table class="compare-table">
      <thead>
        <tr>
          <th class="th-label">Keterangan</th>
          <th class="th-kca">KCA</th>
          <th class="th-fleksi">Fleksi</th>
          <th class="th-krasida">Krasida</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Tenor</td>
          <td>120 Hari</td>
          <td>${tenorFleksi} Hari</td>
          <td>${tenorKrasida} Bulan</td>
        </tr>
        <tr>
          <td>Tarif Sewa</td>
          <td>${(tarifKCA*100).toFixed(1)}% / 15 hari</td>
          <td>0.07% / hari</td>
          <td>${(tarifKrasida*100).toFixed(2)}% / bulan</td>
        </tr>
        <tr>
          <td>Sewa per Periode</td>
          <td><span class="compare-highlight hl-kca">${fmt(sewaKCA15)}</span><br><small>/15 hari</small></td>
          <td><span class="compare-highlight hl-fleksi">${fmt(sewaFleksi1)}</span><br><small>/hari</small></td>
          <td><span class="compare-highlight hl-krasida">${fmt(angsuranKrasida)}</span><br><small>angsuran/bln</small></td>
        </tr>
        <tr>
          <td>Jatuh Tempo</td>
          <td>${fmtDate(dtKCA)}</td>
          <td>${fmtDate(dtFleksi)}</td>
          <td>${fmtDate(dtKrasida)}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="compare-note">* Semua angka adalah estimasi berdasarkan UP Rp ${upRaw.toLocaleString('id-ID')}. Nilai resmi ditentukan penaksir Pegadaian.</p>`;
}
/* ===== END FITUR BARU 1 ===== */

/* ===== CICIL EMAS LOGIC ===== */
const hargaEmas={
  0.5:1486000,1:2833000,2:5597000,5:13889000,
  10:27704000,25:68889000,50:137668000,100:275200000,
  250:686310000,500:1372618000,1000:2745235000
};
let currentMargin=0.0092, customDPRupiah=0;
const adminFee=50000, dpRate=0.15;

function formatIDR(n){return Math.floor(n).toLocaleString('id-ID');}

function switchMargin(val,btn){
  currentMargin=val;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderTable();
}

function handleDPInput(val){
  const clean=val.replace(/\D/g,'');
  if(clean) document.getElementById('dp-rupiah-input').value=parseInt(clean).toLocaleString('id-ID');
  customDPRupiah=parseInt(clean)||0;
  renderTable();
}

function renderTable(){
  const tbody=document.getElementById('simulation-table');
  if(!tbody) return;
  const info=document.getElementById('dp-info-text');
  tbody.innerHTML='';
  [0.5,1,2,5,10,25,50,100,250,500,1000].forEach(d=>{
    const tunai=hargaEmas[d];
    const dpMin=tunai*dpRate;
    const dpPakai=customDPRupiah>dpMin?customDPRupiah:dpMin;
    const totalDP=dpPakai+adminFee;
    const pinjaman=tunai-dpPakai;
    const bunga=tunai*currentMargin;
    const row=document.createElement('tr');
    let html=`<td>${d>=1?d:'0,5'} Gram</td><td>${formatIDR(totalDP)}</td><td class="val-pinjaman">${formatIDR(pinjaman)}</td>`;
    [3,6,12,18,24,36].forEach(t=>{html+=`<td>${formatIDR(pinjaman/t+bunga)}</td>`;});
    row.innerHTML=html;
    tbody.appendChild(row);
  });
  if(info) info.innerText=customDPRupiah>0?`Menggunakan DP Rp ${formatIDR(customDPRupiah)} (atau minimal 15% per item)`:'Menggunakan standar minimal DP 15% per item';
}

/* =====================================================
   [FITUR BARU 2] LOGIKA SHARE WHATSAPP — CICIL EMAS
   ===================================================== */
function shareWACicilEmas() {
  const marginPct  = (currentMargin * 100).toFixed(2);
  const dpInfo     = customDPRupiah > 0
    ? 'Rp ' + formatIDR(customDPRupiah) + ' (custom)'
    : 'Minimal 15% dari harga emas';

  // Ambil contoh 3 denominasi populer untuk pesan WA
  const contohDenoms = [1, 5, 10];
  let tabelWA = '';
  contohDenoms.forEach(d => {
    const tunai   = hargaEmas[d];
    const dpMin   = tunai * dpRate;
    const dpPakai = customDPRupiah > dpMin ? customDPRupiah : dpMin;
    const pinjaman = tunai - dpPakai;
    const bunga   = tunai * currentMargin;
    const a12     = Math.floor(pinjaman / 12 + bunga);
    const a24     = Math.floor(pinjaman / 24 + bunga);
    tabelWA += `\n• *${d} gram*: 12 bln → Rp ${a12.toLocaleString('id-ID')}/bln | 24 bln → Rp ${a24.toLocaleString('id-ID')}/bln`;
  });

  const teks =
    `💰 *Simulasi Cicil Emas — Pegadaian Cabang Mayang Mangurai*\n\n` +
    `📊 Tarif Margin : ${marginPct}% / bulan\n` +
    `💳 Uang Muka   : ${dpInfo}\n` +
    `\n*Estimasi Cicilan (contoh):*${tabelWA}\n\n` +
    `_*Catatan:* Angka di atas bersifat estimasi. Harga emas dan cicilan resmi dikonfirmasi langsung di outlet._\n` +
    `📍 Pegadaian Cabang Mayang Mangurai, Kota Jambi`;

  window.open('https://wa.me/?text=' + encodeURIComponent(teks), '_blank');
}
/* ===== END FITUR BARU 2 ===== */

// Tanggal
window.addEventListener('load',()=>{
  const dateEl=document.getElementById('date-display');
  if(dateEl) dateEl.innerText='Last Update: '+new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
});
