/* ================================================================
   script.js — Pegadaian Mayang Mangurai
   Digunakan oleh: index.html, digi-taksir.html, cicil-emas.html
   ================================================================ */

/* ================= VARIABEL GLOBAL ================= */
let selectedProduct = "";
let currentType     = "perhiasan";
let currentMode     = "taksir";
let currentMerek    = "galeri24";
let myChart         = null;

/* ================= STL (Standar Taksiran Logam) ================= */
const STL_PERHIASAN = 2290007;
const STL_GALERI24  = 2358707;
const STL_ANTAM     = 2290007;
const STL_UBS       = 2290007;

function getSTLBatangan() {
  const merekEl = document.getElementById("merekBatangan");
  const merek   = merekEl ? merekEl.value : currentMerek;
  if (merek === "galeri24") return STL_GALERI24;
  if (merek === "antam")    return STL_ANTAM;
  return STL_UBS;
}

/* ================= INIT ================= */
window.onload = function () {
  const countEl = document.getElementById("countDisplay");
  if (countEl) {
    countEl.innerText = localStorage.getItem("digitaksir_usage") || 0;
  }
  updateMerekInfo();

  const dateEl = document.getElementById("date-display");
  if (dateEl) {
    const opts = { day: "numeric", month: "long", year: "numeric" };
    dateEl.innerText = "Last Update: " + new Date().toLocaleDateString("id-ID", opts);
  }

  if (document.getElementById("simulation-table")) {
    renderTable();
  }
};

/* ================= MEREK INFO ================= */
function onMerekChange() { updateMerekInfo(); }

function updateMerekInfo() {
  const el = document.getElementById("infoMerek");
  if (!el) return;
  const merekEl = document.getElementById("merekBatangan");
  const merek   = merekEl ? merekEl.value : "galeri24";
  const stl     = getSTLBatangan();
  const labels  = {
    galeri24: "Galeri 24 — STL Khusus (lebih tinggi)",
    antam:    "ANTAM — STL mengikuti perhiasan",
    ubs:      "UBS — STL mengikuti perhiasan",
  };
  el.innerText = labels[merek] + " | STL: Rp " + stl.toLocaleString("id-ID") + "/gram";
}

/* ================= COUNTER ================= */
function updateCounter() {
  let count = parseInt(localStorage.getItem("digitaksir_usage") || 0);
  count++;
  localStorage.setItem("digitaksir_usage", count);
  const countEl = document.getElementById("countDisplay");
  if (countEl) countEl.innerText = count;
}

/* ================= NAVIGASI PRODUK ================= */
function selectProduct(prod) {
  selectedProduct = prod;
  document.getElementById("productSelection").style.display = "none";
  document.getElementById("inputSection").style.display     = "block";
  switchType(currentType);
  updateTenor();
  // init multi-item jika belum ada
  const list = document.getElementById("itemList");
  if (list && list.children.length === 0) initItems();
}

function goBack() {
  document.getElementById("productSelection").style.display = "block";
  document.getElementById("inputSection").style.display     = "none";
  document.getElementById("panelHasil").style.display       = "none";
  resetFeedback();
}

/* ================= SWITCH MODE / TYPE ================= */
function switchMode(mode) {
  currentMode = mode;
  document.getElementById("btnModeTaksir").classList.toggle("active", mode === "taksir");
  document.getElementById("btnModeInputUP").classList.toggle("active", mode === "inputUP");
  document.getElementById("sectionTaksir").classList.toggle("hidden",  mode === "inputUP");
  document.getElementById("sectionInputUP").classList.toggle("hidden", mode === "taksir");
}

function switchType(type) {
  currentType = type;
  document.getElementById("btnPerhiasan").classList.toggle("active",  type === "perhiasan");
  document.getElementById("btnBatangan").classList.toggle("active",   type === "batangan");
  document.getElementById("formPerhiasan").classList.toggle("hidden", type === "batangan");
  document.getElementById("formBatangan").classList.toggle("hidden",  type === "perhiasan");
  if (type === "batangan") updateMerekInfo();
  if (type === "perhiasan") {
    const list = document.getElementById("itemList");
    if (list && list.children.length === 0) initItems();
  }
}

/* ================= TENOR ================= */
function updateTenor() {
  const tenor = document.getElementById("tenor");
  if (!tenor) return;
  tenor.innerHTML = "";
  if (selectedProduct === "KCA") {
    tenor.add(new Option("120 Hari", "120"));
  } else if (selectedProduct === "FLEKSI") {
    [15, 30, 60, 180].forEach(d => tenor.add(new Option(d + " Hari", d)));
  } else if (selectedProduct === "KRASIDA") {
    [6, 12, 18, 24, 36, 48].forEach(m => tenor.add(new Option(m + " Bulan", m)));
  }
}

/* ================= CHART ================= */
function updateChart(up, sewaTotal) {
  const ctx = document.getElementById("loanChart").getContext("2d");
  if (myChart) { myChart.destroy(); }
  myChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Uang Diterima", "Total Sewa"],
      datasets: [{
        data: [up, sewaTotal],
        backgroundColor: ["#008444", "#ffcc00"],
        borderWidth: 2,
        borderColor: "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: c => c.label + ": Rp " + Math.round(c.raw).toLocaleString("id-ID")
          }
        }
      },
      cutout: "65%"
    }
  });
}

/* ================================================================
   MULTI-ITEM PERHIASAN (max 10 item)
   ================================================================ */
let itemCounter = 0;
let itemsData   = [];
const MAX_ITEMS = 10;

function initItems() {
  itemsData   = [];
  itemCounter = 0;
  const list  = document.getElementById("itemList");
  if (list) list.innerHTML = "";
  addItem();
}

function addItem() {
  if (itemsData.length >= MAX_ITEMS) {
    alert("Maksimal " + MAX_ITEMS + " item perhiasan.");
    return;
  }
  itemCounter++;
  const id = itemCounter;
  const karatOpts = [6,8,10,12,14,15,16,17,18,19,20,21,22,23]
    .map(k => `<option value="${k}"${k === 18 ? " selected" : ""}>${k} Karat</option>`)
    .join("");

  const html = `
  <div class="item-row" id="item-${id}">
    <div class="item-header">
      <span class="item-label">✦ Item ${id}</span>
      ${id > 1 ? `<button class="btn-remove-item" onclick="removeItem(${id})">✕ Hapus</button>` : ""}
    </div>
    <div class="item-fields">
      <div class="item-field">
        <label>Kadar</label>
        <select id="kadar-${id}" onchange="recalcItem(${id})">${karatOpts}</select>
      </div>
      <div class="item-field">
        <label>Berat (gr)</label>
        <input type="number" id="berat-${id}" placeholder="0.00" step="0.01" oninput="recalcItem(${id})"/>
      </div>
      <div class="item-field item-field-full">
        <label>Estimasi Taksiran</label>
        <div class="item-taksiran" id="taksiran-${id}">Rp —</div>
      </div>
    </div>
  </div>`;

  document.getElementById("itemList").insertAdjacentHTML("beforeend", html);
  itemsData.push({ id, taksiran: 0 });
  updateAddButton();
  updateTotalTaksiranDisplay();
}

function removeItem(id) {
  const el = document.getElementById("item-" + id);
  if (el) el.remove();
  itemsData = itemsData.filter(it => it.id !== id);
  updateAddButton();
  updateTotalTaksiranDisplay();
}

function recalcItem(id) {
  const berat  = parseFloat(document.getElementById("berat-"  + id).value) || 0;
  const karat  = parseFloat(document.getElementById("kadar-"  + id).value);
  const result = berat > 0 ? berat * (karat / 24) * STL_PERHIASAN : 0;

  const entry = itemsData.find(it => it.id === id);
  if (entry) entry.taksiran = result;

  const el = document.getElementById("taksiran-" + id);
  if (el) el.innerText = result > 0 ? "Rp " + Math.round(result).toLocaleString("id-ID") : "Rp —";

  updateTotalTaksiranDisplay();
}

function updateAddButton() {
  const btn = document.getElementById("btnAddItem");
  if (!btn) return;
  if (itemsData.length >= MAX_ITEMS) {
    btn.disabled    = true;
    btn.innerText   = "Maksimal " + MAX_ITEMS + " item";
    btn.style.opacity = "0.5";
  } else {
    btn.disabled    = false;
    btn.innerText   = "+ Tambah Item Perhiasan (" + itemsData.length + "/" + MAX_ITEMS + ")";
    btn.style.opacity = "1";
  }
}

function updateTotalTaksiranDisplay() {
  const total = itemsData.reduce((s, it) => s + (it.taksiran || 0), 0);
  const row   = document.getElementById("rowTotalTaksiran");
  const el    = document.getElementById("totalTaksiranDisplay");
  if (!row || !el) return;
  if (total > 0) {
    row.style.display = "flex";
    el.innerText      = "Rp " + Math.round(total).toLocaleString("id-ID");
  } else {
    row.style.display = "none";
  }
}

function getTotalTaksiranMultiItem() {
  return itemsData.reduce((s, it) => s + (it.taksiran || 0), 0);
}

/* ================= HITUNG TAKSIRAN (UTAMA) ================= */
function hitungTaksiran() {
  const tenorVal  = parseInt(document.getElementById("tenor").value);
  const isModeTaksir = currentMode === "taksir";
  const isPerhiasan  = currentType === "perhiasan";

  // ── MULTI-ITEM PERHIASAN ──
  if (isModeTaksir && isPerhiasan) {
    // validasi semua item
    let valid = true;
    itemsData.forEach(it => {
      const berat = parseFloat(document.getElementById("berat-" + it.id)?.value) || 0;
      if (berat <= 0 || berat > 1000) {
        alert("Item " + it.id + ": masukkan berat yang valid (0.01–1000 gram).");
        valid = false;
      }
    });
    if (!valid || itemsData.length === 0) return;

    const totalTaksiran = getTotalTaksiranMultiItem();
    if (totalTaksiran <= 0) { alert("Tidak ada item dengan taksiran valid."); return; }

    let plafon = selectedProduct === "KRASIDA" ? 0.95 : 0.92;
    if (selectedProduct === "FLEKSI") {
      if      (tenorVal === 15)  plafon = 0.96;
      else if (tenorVal === 30)  plafon = 0.94;
      else if (tenorVal === 60)  plafon = 0.93;
      else if (tenorVal === 180) plafon = 0.90;
    }

    const upFinal = Math.floor(totalTaksiran * plafon / 1000) * 1000;

    // tampilkan rincian item
    const rincianSection = document.getElementById("rincianItemSection");
    const bodyRincian    = document.getElementById("bodyRincianItem");
    if (rincianSection && bodyRincian) {
      rincianSection.classList.remove("hidden");
      bodyRincian.innerHTML = itemsData.map((it, idx) => {
        const karat = document.getElementById("kadar-" + it.id)?.value || "-";
        const berat = document.getElementById("berat-" + it.id)?.value || "-";
        return `<tr>
          <td>Item ${idx + 1}</td>
          <td>${karat} Karat</td>
          <td>${parseFloat(berat).toFixed(2)} gr</td>
          <td>Rp ${Math.round(it.taksiran).toLocaleString("id-ID")}</td>
        </tr>`;
      }).join("");
    }

    document.getElementById("rowTaksiran").classList.remove("hidden");
    document.getElementById("titleUP").innerText    = "Uang Pinjaman (UP)";
    document.getElementById("resTaksiran").innerText = "Rp " + Math.round(totalTaksiran).toLocaleString("id-ID");

    _tampilkanHasil(upFinal, totalTaksiran, tenorVal);
    return;
  }

  // ── SINGLE INPUT (BATANGAN / INPUT UP) ──
  let upFinal  = 0;
  let taksiran = 0;

  const beratEl = document.getElementById("beratPerhiasan");
  const upEl    = document.getElementById("inputNominalUP");
  if (beratEl) beratEl.classList.remove("input-error");
  if (upEl)    upEl.classList.remove("input-error");

  // sembunyikan rincian item jika mode bukan perhiasan multi
  const rincianSection = document.getElementById("rincianItemSection");
  if (rincianSection) rincianSection.classList.add("hidden");

  if (isModeTaksir) {
    if (isPerhiasan) {
      // fallback single perhiasan (seharusnya tidak tercapai, tapi aman)
      const berat = parseFloat(document.getElementById("beratPerhiasan")?.value) || 0;
      const karat = parseFloat(document.getElementById("kadar-1")?.value || 18);
      if (berat <= 0 || berat > 1000) {
        alert("Masukkan berat bersih yang valid (0.01–1000 gr)");
        return;
      }
      taksiran = berat * (karat / 24) * STL_PERHIASAN;
    } else {
      taksiran = parseFloat(document.getElementById("denominasi").value) * getSTLBatangan();
    }

    let plafon = selectedProduct === "KRASIDA" ? 0.95 : 0.92;
    if (selectedProduct === "FLEKSI") {
      if      (tenorVal === 15)  plafon = 0.96;
      else if (tenorVal === 30)  plafon = 0.94;
      else if (tenorVal === 60)  plafon = 0.93;
      else if (tenorVal === 180) plafon = 0.90;
    }

    upFinal = Math.floor(taksiran * plafon / 1000) * 1000;
    document.getElementById("rowTaksiran").classList.remove("hidden");
    document.getElementById("titleUP").innerText     = "Uang Pinjaman (UP)";
    document.getElementById("resTaksiran").innerText = "Rp " + Math.round(taksiran).toLocaleString("id-ID");

  } else {
    upFinal = parseFloat(document.getElementById("inputNominalUP").value) || 0;
    if (upFinal < 50000) {
      alert("Minimal pinjaman adalah Rp 50.000");
      document.getElementById("inputNominalUP").classList.add("input-error");
      return;
    }
    document.getElementById("rowTaksiran").classList.add("hidden");
    document.getElementById("titleUP").innerText = "Nominal Pinjaman";
  }

  _tampilkanHasil(upFinal, taksiran, tenorVal);
}

/* helper: tampilkan sewa, grafik, dan panel hasil */
function _tampilkanHasil(upFinal, taksiran, tenorVal) {
  let sewaDesc = "", estimasiSewa = 0, unitWaktu = "";
  let dt = new Date(), totalSewaGrafik = 0;

  document.getElementById("sectionDetailKCA").classList.add("hidden");
  document.getElementById("bodyTabelKCA").innerHTML = "";

  if (selectedProduct === "KCA") {
    const tarifKCA = upFinal > 20100000 ? 0.011 : 0.012;
    sewaDesc       = (tarifKCA * 100).toFixed(1) + "% / 15 Hari";
    estimasiSewa   = upFinal * tarifKCA;
    unitWaktu      = " / 15 Hari";
    dt.setDate(dt.getDate() + 120);
    document.getElementById("lblSewaNominal").innerText = "Estimasi Sewa (Per 15 Hari):";
    totalSewaGrafik = estimasiSewa * 8;
    document.getElementById("sectionDetailKCA").classList.remove("hidden");
    let htmlTabel = "";
    for (let i = 1; i <= 8; i++) {
      htmlTabel += `<tr><td>Ke-${i}</td><td>${i * 15}</td><td>Rp ${Math.round(upFinal * tarifKCA * i).toLocaleString("id-ID")}</td></tr>`;
    }
    document.getElementById("bodyTabelKCA").innerHTML = htmlTabel;

  } else if (selectedProduct === "FLEKSI") {
    sewaDesc      = "0.07% / Hari";
    estimasiSewa  = upFinal * 0.0007;
    unitWaktu     = " / Hari";
    dt.setDate(dt.getDate() + tenorVal);
    document.getElementById("lblSewaNominal").innerText = "Estimasi Sewa:";
    totalSewaGrafik = estimasiSewa * tenorVal;

  } else if (selectedProduct === "KRASIDA") {
    let tarifKrasida = 0.0125;
    if (tenorVal === 18 || tenorVal === 36) tarifKrasida = 0.013;
    else if (tenorVal === 48)               tarifKrasida = 0.014;
    sewaDesc      = (tarifKrasida * 100).toFixed(2) + "% / Bulan";
    estimasiSewa  = upFinal / tenorVal + upFinal * tarifKrasida;
    unitWaktu     = " / Bulan";
    dt.setMonth(dt.getMonth() + tenorVal);
    document.getElementById("lblSewaNominal").innerText = "Angsuran Tetap:";
    totalSewaGrafik = upFinal * tarifKrasida * tenorVal;
  }

  document.getElementById("resUP").innerText          = "Rp " + upFinal.toLocaleString("id-ID");
  document.getElementById("resSewaDesc").innerText    = sewaDesc;
  document.getElementById("resSewaNominal").innerText = "± Rp " + Math.round(estimasiSewa).toLocaleString("id-ID") + unitWaktu;
  document.getElementById("resJatuhTempo").innerText  = dt.toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" });

  document.getElementById("panelHasil").style.display = "block";
  document.getElementById("panelHasil").scrollIntoView({ behavior: "smooth" });

  updateChart(upFinal, totalSewaGrafik);
  updateCounter();
  resetFeedback();
}

/* ================= RATING ================= */
function setRating(n) {
  document.querySelectorAll("#starContainer span").forEach((s, i) => s.classList.toggle("selected", i < n));
  alert("Terima kasih! Rating " + n + " bintang Anda telah terekam.");
}

function resetFeedback() {
  document.querySelectorAll("#starContainer span").forEach(s => s.classList.remove("selected"));
}

/* ================================================================
   CICIL EMAS
   ================================================================ */
const hargaEmas = {
  0.5:  1488000,
  1:    2836000,
  2:    5603000,
  5:    13906000,
  10:   27736000,
  25:   68968000,
  50:   137826000,
  100:  275516000,
  250:  687099000,
  500:  1374196000,
  1000: 2748391000,
};

let currentMargin = 0.0092;
const adminFee    = 50000;
const dpRate      = 0.15;
let customDPRupiah = 0;

function formatIDR(num) { return Math.floor(num).toLocaleString("id-ID"); }

function switchMargin(val, btn) {
  currentMargin = val;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderTable();
}

function handleDPInput(val) {
  const cleanVal = val.replace(/\D/g, "");
  const inputEl  = document.getElementById("dp-rupiah-input");
  if (cleanVal && inputEl) inputEl.value = parseInt(cleanVal).toLocaleString("id-ID");
  customDPRupiah = parseInt(cleanVal) || 0;
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById("simulation-table");
  if (!tbody) return;
  const infoText = document.getElementById("dp-info-text");
  tbody.innerHTML = "";
  const denoms = [0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000];

  denoms.forEach(d => {
    const tunai     = hargaEmas[d];
    const dpMinimal = tunai * dpRate;
    const dpDipakai = customDPRupiah > dpMinimal ? customDPRupiah : dpMinimal;
    const totalDP   = dpDipakai + adminFee;
    const pinjaman  = tunai - dpDipakai;
    const bungaBln  = tunai * currentMargin;

    const row = document.createElement("tr");
    let html  = `<td>${d >= 1 ? d : "0,5"} Gram</td><td>${formatIDR(totalDP)}</td><td class="val-pinjaman">${formatIDR(pinjaman)}</td>`;
    [3, 6, 12, 18, 24, 36].forEach(tenor => {
      html += `<td>${formatIDR(pinjaman / tenor + bungaBln)}</td>`;
    });
    row.innerHTML = html;
    tbody.appendChild(row);
  });

  if (infoText) {
    infoText.innerText = customDPRupiah > 0
      ? `Menggunakan DP Rp ${formatIDR(customDPRupiah)} (atau minimal 15% per item)`
      : "Menggunakan standar minimal DP 15% per item";
  }
}

/* ================= EXPORT PDF ================= */
async function exportPDF() {
  const el = document.getElementById("panelHasil");
  if (!el || typeof html2canvas === "undefined") return;
  const canvas = await html2canvas(el, { scale: 2, useCORS: true });
  const img    = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const pdf    = new jsPDF("p", "mm", "a4");
  const width  = pdf.internal.pageSize.getWidth();
  pdf.addImage(img, "PNG", 0, 0, width, (canvas.height * width) / canvas.width);
  pdf.save("hasil-digi-taksir.pdf");
}

/* ================= SAVE HISTORY ================= */
function saveHistory() {
  const data = {
    waktu:  new Date().toLocaleString("id-ID"),
    produk: selectedProduct,
    up:     document.getElementById("resUP")?.innerText,
    tenor:  document.getElementById("tenor")?.value,
  };
  const history = JSON.parse(localStorage.getItem("dg_history") || "[]");
  history.unshift(data);
  localStorage.setItem("dg_history", JSON.stringify(history));
  alert("History berhasil disimpan ✔️");
}

/* ================= TRING ================= */
function openTringApp() {
  window.open("https://play.google.com/store/apps/details?id=com.pegadaiandigital", "_blank");
}
