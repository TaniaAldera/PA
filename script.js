/* ================= EXISTING DIGITAKSIR ================= */
let selectedProduct = "";
let currentType = "perhiasan";
let currentMode = "taksir";
let currentMerek = "galeri24";
let myChart = null;

const STL_PERHIASAN = 2290196;
const STL_GALERI24  = 2358902;
const STL_ANTAM     = 2290196;
const STL_UBS       = 2290196;

function getSTLBatangan() {
  const merek = document.getElementById("merekBatangan")
    ? document.getElementById("merekBatangan").value
    : currentMerek;
  if (merek === "galeri24") return STL_GALERI24;
  if (merek === "antam")    return STL_ANTAM;
  return STL_UBS;
}

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

function updateCounter() {
  let count = parseInt(localStorage.getItem("digitaksir_usage") || 0);
  count++;
  localStorage.setItem("digitaksir_usage", count);
  const countEl = document.getElementById("countDisplay");
  if (countEl) countEl.innerText = count;
}

function selectProduct(prod) {
  selectedProduct = prod;
  document.getElementById("productSelection").style.display = "none";
  document.getElementById("inputSection").style.display = "block";
  // Inisialisasi item list otomatis saat product dipilih
  const list = document.getElementById("itemList");
  if (list && list.children.length === 0) initItems();
  updateTenor();
}

function goBack() {
  document.getElementById("productSelection").style.display = "block";
  document.getElementById("inputSection").style.display = "none";
  document.getElementById("panelHasil").style.display = "none";
  resetFeedback();
}

function switchMode(mode) {
  currentMode = mode;
  document.getElementById("btnModeTaksir").classList.toggle("active",   mode === "taksir");
  document.getElementById("btnModeInputUP").classList.toggle("active",  mode === "inputUP");
  document.getElementById("sectionTaksir").classList.toggle("hidden",   mode !== "taksir");
  document.getElementById("sectionInputUP").classList.toggle("hidden",  mode !== "inputUP");
}

function switchType(type) {
  currentType = type;
  document.getElementById("btnPerhiasan").classList.toggle("active", type === "perhiasan");
  document.getElementById("btnBatangan").classList.toggle("active",  type === "batangan");
  document.getElementById("formPerhiasan").classList.toggle("hidden", type !== "perhiasan");
  document.getElementById("formBatangan").classList.toggle("hidden",  type !== "batangan");
  if (type === "batangan") updateMerekInfo();
  if (type === "perhiasan") {
    const list = document.getElementById("itemList");
    if (list && list.children.length === 0) initItems();
  }
}

function updateTenor() {
  const tenor = document.getElementById("tenor");
  tenor.innerHTML = "";
  if (selectedProduct === "KCA") {
    tenor.add(new Option("120 Hari", "120"));
  } else if (selectedProduct === "FLEKSI") {
    [15, 30, 60, 180].forEach((d) => tenor.add(new Option(d + " Hari", d)));
  } else if (selectedProduct === "KRASIDA") {
    [6, 12, 18, 24, 36, 48].forEach((m) => tenor.add(new Option(m + " Bulan", m)));
  }
}

function updateChart(up, sewaTotal) {
  const ctx = document.getElementById("loanChart");
  if (!ctx) return;
  if (myChart) { myChart.destroy(); }
  myChart = new Chart(ctx.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Uang Diterima", "Total Sewa"],
      datasets: [{
        data: [up, sewaTotal],
        backgroundColor: ["#008444", "#ffcc00"],
        borderWidth: 2,
        borderColor: "#ffffff"
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: { callbacks: { label: (c) => c.label + ": Rp " + Math.round(c.raw).toLocaleString("id-ID") } },
      },
      cutout: "65%",
    },
  });
}

/* ================= MULTI-ITEM PERHIASAN ================= */
let itemCounter = 0;
let itemsData   = [];

function initItems() {
  itemsData = [];
  document.getElementById("itemList").innerHTML = "";
  itemCounter = 0;
  addItem();
  updateTotalTaksiranDisplay();
}

function addItem() {
  if (itemCounter >= 10) { alert("Maksimal 10 item perhiasan."); return; }
  itemCounter++;
  const id = itemCounter;
  const karatOptions = [6,8,10,12,14,15,16,17,18,19,20,21,22,23]
    .map(k => `<option value="${k}"${k===18?" selected":""}>${k} Karat</option>`).join("");

  const html = `
  <div class="item-row" id="item-${id}">
    <div class="item-header">
      <span class="item-label">Item ${id}</span>
      ${id > 1 ? `<button class="btn-remove-item" onclick="removeItem(${id})">✕ Hapus</button>` : ""}
    </div>
    <div class="item-fields">
      <div class="item-field">
        <label>Kadar</label>
        <select id="kadar-${id}" onchange="recalcItem(${id})">${karatOptions}</select>
      </div>
      <div class="item-field">
        <label>Berat (gr)</label>
        <input type="number" id="berat-${id}" placeholder="0.00" step="0.01"
          oninput="recalcItem(${id})">
      </div>
      <div class="item-field item-field-full">
        <label>Taksiran</label>
        <div class="item-taksiran" id="taksiran-${id}">Rp —</div>
      </div>
    </div>
  </div>`;

  document.getElementById("itemList").insertAdjacentHTML("beforeend", html);
  itemsData.push({ id, taksiran: 0 });
  updateTotalTaksiranDisplay();
  updateBtnAddItem();
}

function removeItem(id) {
  document.getElementById(`item-${id}`).remove();
  itemsData = itemsData.filter(it => it.id !== id);
  updateTotalTaksiranDisplay();
  updateBtnAddItem();
}

function updateBtnAddItem() {
  const btn = document.getElementById("btnAddItem");
  if (!btn) return;
  btn.style.display = itemsData.length >= 10 ? "none" : "block";
}

function recalcItem(id) {
  const berat  = parseFloat(document.getElementById(`berat-${id}`).value) || 0;
  const karat  = parseFloat(document.getElementById(`kadar-${id}`).value);
  const taksiran = berat > 0 ? berat * (karat / 24) * STL_PERHIASAN : 0;

  const entry = itemsData.find(it => it.id === id);
  if (entry) entry.taksiran = taksiran;

  const el = document.getElementById(`taksiran-${id}`);
  el.innerText = taksiran > 0 ? "Rp " + Math.round(taksiran).toLocaleString("id-ID") : "Rp —";

  updateTotalTaksiranDisplay();
}

function updateTotalTaksiranDisplay() {
  const total = itemsData.reduce((sum, it) => sum + (it.taksiran || 0), 0);
  const row   = document.getElementById("rowTotalTaksiran");
  const el    = document.getElementById("totalTaksiranDisplay");
  if (!row || !el) return;
  if (total > 0) {
    row.style.display = "flex";
    el.innerText = "Rp " + Math.round(total).toLocaleString("id-ID");
  } else {
    row.style.display = "none";
  }
}

function getTotalTaksiranMultiItem() {
  return itemsData.reduce((sum, it) => sum + (it.taksiran || 0), 0);
}

/* ================= HITUNG TAKSIRAN (UNIFIED) ================= */
function hitungTaksiran() {
  // Deteksi mode aktif dari state, bukan dari classList (lebih reliable)
  const isTaksirMode    = currentMode === "taksir";
  const isPerhiasanType = currentType === "perhiasan";
  const useMultiItem    = isTaksirMode && isPerhiasanType;

  let upFinal   = 0;
  let taksiran  = 0;
  const tenorVal = parseInt(document.getElementById("tenor").value);

  // Hapus error state
  const nominalEl = document.getElementById("inputNominalUP");
  if (nominalEl) nominalEl.classList.remove("input-error");

  if (isTaksirMode) {
    if (useMultiItem) {
      // MULTI-ITEM PERHIASAN
      if (itemsData.length === 0) { alert("Tambahkan minimal 1 item perhiasan."); return; }

      let valid = true;
      itemsData.forEach(it => {
        const berat = parseFloat(document.getElementById(`berat-${it.id}`)?.value) || 0;
        if (berat <= 0) {
          alert(`Item ${it.id}: masukkan berat yang valid (> 0 gram)`);
          valid = false;
        }
      });
      if (!valid) return;

      taksiran = getTotalTaksiranMultiItem();
      if (taksiran <= 0) { alert("Tidak ada item dengan taksiran valid."); return; }

      // Tampilkan rincian item
      const rincianSection = document.getElementById("rincianItemSection");
      const bodyRincian    = document.getElementById("bodyRincianItem");
      if (rincianSection && bodyRincian) {
        rincianSection.classList.remove("hidden");
        bodyRincian.innerHTML = itemsData.map((it, idx) => {
          const karat = document.getElementById(`kadar-${it.id}`)?.value || "-";
          const berat = document.getElementById(`berat-${it.id}`)?.value || "-";
          return `<tr>
            <td>Item ${idx + 1}</td>
            <td>${karat} Karat</td>
            <td>${berat} gr</td>
            <td>Rp ${Math.round(it.taksiran).toLocaleString("id-ID")}</td>
          </tr>`;
        }).join("");
      }

    } else if (currentType === "batangan") {
      // BATANGAN
      taksiran = parseFloat(document.getElementById("denominasi").value) * getSTLBatangan();
      const rincianSection = document.getElementById("rincianItemSection");
      if (rincianSection) rincianSection.classList.add("hidden");
    }

    let plafon = selectedProduct === "KRASIDA" ? 0.95 : 0.92;
    if (selectedProduct === "FLEKSI" && tenorVal == 15) plafon = 0.96;
    upFinal = Math.floor(taksiran * plafon / 1000) * 1000;

    const rowTaksiran = document.getElementById("rowTaksiran");
    if (rowTaksiran) rowTaksiran.classList.remove("hidden");
    document.getElementById("titleUP").innerText = "Uang Pinjaman (UP)";

  } else {
    // MODE INPUT UP
    upFinal = parseFloat(nominalEl ? nominalEl.value : 0) || 0;
    if (upFinal < 50000) {
      alert("Minimal pinjaman adalah Rp 50.000");
      if (nominalEl) nominalEl.classList.add("input-error");
      return;
    }
    const rowTaksiran = document.getElementById("rowTaksiran");
    if (rowTaksiran) rowTaksiran.classList.add("hidden");
    document.getElementById("titleUP").innerText = "Nominal Pinjaman";
    const rincianSection = document.getElementById("rincianItemSection");
    if (rincianSection) rincianSection.classList.add("hidden");
  }

  // ---- Hitung sewa ----
  let sewaDesc = "", estimasiSewa = 0, unitWaktu = "";
  let dt = new Date(), totalSewaUntukGrafik = 0;

  const sectionDetailKCA = document.getElementById("sectionDetailKCA");
  const bodyTabelKCA     = document.getElementById("bodyTabelKCA");
  if (sectionDetailKCA) sectionDetailKCA.classList.add("hidden");
  if (bodyTabelKCA)     bodyTabelKCA.innerHTML = "";

  if (selectedProduct === "KCA") {
    let tarifKCA = upFinal > 20100000 ? 0.011 : 0.012;
    sewaDesc = (tarifKCA * 100).toFixed(1) + "% / 15 Hari";
    estimasiSewa = upFinal * tarifKCA;
    unitWaktu = " / 15 Hari";
    dt.setDate(dt.getDate() + 120);
    document.getElementById("lblSewaNominal").innerText = "Estimasi Sewa (Per 15 Hari):";
    totalSewaUntukGrafik = estimasiSewa * 8;
    if (sectionDetailKCA) sectionDetailKCA.classList.remove("hidden");
    let htmlTabel = "";
    for (let i = 1; i <= 8; i++) {
      let sewaAkumulasi = upFinal * tarifKCA * i;
      htmlTabel += `<tr><td>Ke-${i}</td><td>${i * 15}</td><td>Rp ${Math.round(sewaAkumulasi).toLocaleString("id-ID")}</td></tr>`;
    }
    if (bodyTabelKCA) bodyTabelKCA.innerHTML = htmlTabel;

  } else if (selectedProduct === "FLEKSI") {
    sewaDesc = "0.07% / Hari";
    estimasiSewa = upFinal * 0.0007;
    unitWaktu = " / Hari";
    dt.setDate(dt.getDate() + tenorVal);
    document.getElementById("lblSewaNominal").innerText = "Estimasi Sewa:";
    totalSewaUntukGrafik = estimasiSewa * tenorVal;

  } else if (selectedProduct === "KRASIDA") {
    let tarifKrasida = 0.0125;
    if (tenorVal === 18 || tenorVal === 36) tarifKrasida = 0.013;
    else if (tenorVal === 48)               tarifKrasida = 0.014;
    sewaDesc = (tarifKrasida * 100).toFixed(2) + "% / Bulan";
    estimasiSewa = upFinal / tenorVal + upFinal * tarifKrasida;
    unitWaktu = " / Bulan";
    dt.setMonth(dt.getMonth() + tenorVal);
    document.getElementById("lblSewaNominal").innerText = "Angsuran Tetap:";
    totalSewaUntukGrafik = upFinal * tarifKrasida * tenorVal;
  }

  // ---- Tampilkan hasil ----
  document.getElementById("resUP").innerText        = "Rp " + upFinal.toLocaleString("id-ID");
  document.getElementById("resTaksiran").innerText   = "Rp " + Math.round(taksiran).toLocaleString("id-ID");
  document.getElementById("resSewaDesc").innerText   = sewaDesc;
  document.getElementById("resSewaNominal").innerText = "± Rp " + Math.round(estimasiSewa).toLocaleString("id-ID") + unitWaktu;
  document.getElementById("resJatuhTempo").innerText  = dt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  document.getElementById("panelHasil").style.display = "block";
  document.getElementById("panelHasil").scrollIntoView({ behavior: "smooth" });

  updateChart(upFinal, totalSewaUntukGrafik);
  updateCounter();
  resetFeedback();
}

function setRating(n) {
  document.querySelectorAll("#starContainer span").forEach((s, i) => s.classList.toggle("selected", i < n));
  alert("Terima kasih! Rating " + n + " bintang Anda telah terekam.");
}

function resetFeedback() {
  document.querySelectorAll("#starContainer span").forEach((s) => s.classList.remove("selected"));
}

/* ================= CICIL EMAS ================= */
const hargaEmas = {
  0.5: 1486000,    1: 2833000,    2: 5597000,    5: 13889000,
  10:  27704000,   25: 68889000,  50: 137668000, 100: 275200000,
  250: 686310000,  500: 1372618000, 1000: 2745235000,
};

let currentMargin  = 0.0092;
const adminFee     = 50000;
const dpRate       = 0.15;
let customDPRupiah = 0;

function formatIDR(num) { return Math.floor(num).toLocaleString("id-ID"); }

function switchMargin(val, btn) {
  currentMargin = val;
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderTable();
}

function handleDPInput(val) {
  let cleanVal = val.replace(/\D/g, "");
  if (cleanVal) document.getElementById("dp-rupiah-input").value = parseInt(cleanVal).toLocaleString("id-ID");
  customDPRupiah = parseInt(cleanVal) || 0;
  renderTable();
}

function renderTable() {
  const tbody    = document.getElementById("simulation-table");
  if (!tbody) return;
  const infoText = document.getElementById("dp-info-text");
  tbody.innerHTML = "";

  const denoms = [0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000];
  denoms.forEach((d) => {
    const tunai     = hargaEmas[d];
    const dpMinimal = tunai * dpRate;
    let   dpDipakai = customDPRupiah > dpMinimal ? customDPRupiah : dpMinimal;
    const totalDP   = dpDipakai + adminFee;
    const pinjaman  = tunai - dpDipakai;
    const bungaBulan = tunai * currentMargin;
    const row = document.createElement("tr");
    let html = `<td>${d >= 1 ? d : "0,5"} Gram</td><td>${formatIDR(totalDP)}</td><td class="val-pinjaman">${formatIDR(pinjaman)}</td>`;
    [3, 6, 12, 18, 24, 36].forEach((tenor) => {
      html += `<td>${formatIDR(pinjaman / tenor + bungaBulan)}</td>`;
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
  const el     = document.getElementById("panelHasil");
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
  let data = {
    waktu:         new Date().toLocaleString("id-ID"),
    produk:        selectedProduct,
    totalTaksiran: document.getElementById("resTaksiran")?.innerText,
    up:            document.getElementById("resUP")?.innerText,
    tenor:         document.getElementById("tenor")?.value,
  };
  let history = JSON.parse(localStorage.getItem("dg_history") || "[]");
  history.unshift(data);
  localStorage.setItem("dg_history", JSON.stringify(history));
  alert("History berhasil disimpan ✔️");
}

/* ================= TRING ================= */
function openTringApp() {
  window.open("https://play.google.com/store/apps/details?id=com.pegadaiandigital", "_blank");
}
