/* ================= EXISTING DIGITAKSIR ================= */
let selectedProduct = "";
let currentType = "perhiasan";
let currentMode = "taksir";
let currentMerek = "galeri24";
let myChart = null;

const STL_PERHIASAN = 2290007;
const STL_GALERI24 = 2358707;
const STL_ANTAM = 2290007;
const STL_UBS = 2290007;

function getSTLBatangan(merek) {
  const m = merek || (document.getElementById("merekBatangan")
    ? document.getElementById("merekBatangan").value
    : currentMerek);
  if (m === "galeri24") return STL_GALERI24;
  if (m === "antam") return STL_ANTAM;
  return STL_UBS;
}

window.onload = function () {
  const countEl = document.getElementById("countDisplay");
  if (countEl) {
    countEl.innerText = localStorage.getItem("digitaksir_usage") || 0;
  }

  // Set tanggal - hanya jika elemennya ada (halaman cicil-emas)
  const dateEl = document.getElementById("date-display");
  if (dateEl) {
    const opts = { day: "numeric", month: "long", year: "numeric" };
    dateEl.innerText = "Last Update: " + new Date().toLocaleDateString("id-ID", opts);
  }

  // Render tabel - hanya jika elemennya ada (halaman cicil-emas)
  if (document.getElementById("simulation-table")) {
    renderTable();
  }

  // Init multi-item - hanya jika ada itemListContainer (halaman digi-taksir)
  if (document.getElementById("itemListContainer")) {
    initMultiItem();
  }
};

/* ================= MULTI-ITEM LOGIC ================= */

let items = []; // array of item objects
const MAX_ITEMS = 10;

/**
 * Generate HTML for a single item card
 */
function buildItemCard(idx) {
  const item = items[idx];
  const num = idx + 1;
  const canDelete = items.length > 1;

  return `
  <div class="item-card" id="itemCard_${idx}">
    <div class="item-card-header">
      <div class="item-number">Barang ${num}</div>
      ${canDelete ? `<button class="btn-remove-item" onclick="removeItem(${idx})" title="Hapus barang ini">✕</button>` : ""}
    </div>

    <div class="type-selector" style="margin-bottom:12px;">
      <div
        id="btnPerhiasan_${idx}"
        class="type-btn ${item.type === 'perhiasan' ? 'active' : ''}"
        onclick="switchItemType(${idx}, 'perhiasan')"
      >Perhiasan</div>
      <div
        id="btnBatangan_${idx}"
        class="type-btn ${item.type === 'batangan' ? 'active' : ''}"
        onclick="switchItemType(${idx}, 'batangan')"
      >Batangan</div>
    </div>

    <!-- PERHIASAN FORM -->
    <div id="formPerhiasan_${idx}" class="${item.type === 'batangan' ? 'hidden' : ''}">
      <label>Kadar (Karat)</label>
      <select id="kadar_${idx}" onchange="saveItemField(${idx})">
        ${[6,8,10,12,14,15,16,17,18,19,20,21,22,23].map(k =>
          `<option value="${k}" ${item.kadar == k ? 'selected' : ''}>${k} Karat</option>`
        ).join('')}
      </select>
      <label>Berat Bersih (Gram)</label>
      <input
        type="number"
        id="berat_${idx}"
        placeholder="0.00"
        step="0.01"
        value="${item.berat || ''}"
        onchange="saveItemField(${idx})"
      />
    </div>

    <!-- BATANGAN FORM -->
    <div id="formBatangan_${idx}" class="${item.type === 'perhiasan' ? 'hidden' : ''}">
      <label>Merek / Jenis Batangan</label>
      <select id="merek_${idx}" onchange="onMerekChangeItem(${idx})">
        <option value="galeri24" ${item.merek === 'galeri24' ? 'selected' : ''}>Galeri 24</option>
        <option value="antam" ${item.merek === 'antam' ? 'selected' : ''}>ANTAM</option>
        <option value="ubs" ${item.merek === 'ubs' ? 'selected' : ''}>UBS</option>
      </select>
      <div id="infoMerek_${idx}" class="merek-info"></div>
      <label>Denominasi Batangan</label>
      <select id="denom_${idx}" onchange="saveItemField(${idx})">
        ${[0.5,1,2,5,10,25,50,100,250,500,1000].map(d =>
          `<option value="${d}" ${item.denom == d ? 'selected' : ''}>${d < 1 ? '0,5' : d} Gram</option>`
        ).join('')}
      </select>
    </div>
  </div>`;
}

function initMultiItem() {
  items = [createDefaultItem()];
  renderAllItems();
  updateItemCount();
}

function createDefaultItem() {
  return {
    type: "perhiasan",
    kadar: 18,
    berat: "",
    merek: "galeri24",
    denom: 1,
  };
}

function renderAllItems() {
  const container = document.getElementById("itemListContainer");
  if (!container) return;
  container.innerHTML = items.map((_, i) => buildItemCard(i)).join("");
  // Re-update merek info for batangan items
  items.forEach((item, i) => {
    if (item.type === "batangan") updateMerekInfoItem(i);
  });
}

function updateItemCount() {
  const el = document.getElementById("itemCountDisplay");
  if (el) el.innerText = items.length;
  const addRow = document.getElementById("addItemRow");
  if (addRow) {
    const btn = addRow.querySelector(".btn-add-item");
    if (btn) btn.disabled = items.length >= MAX_ITEMS;
  }
}

function addItem() {
  if (items.length >= MAX_ITEMS) return;
  items.push(createDefaultItem());
  renderAllItems();
  updateItemCount();
  // Scroll to new item
  const cards = document.querySelectorAll(".item-card");
  if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior: "smooth" });
}

function removeItem(idx) {
  if (items.length <= 1) return;
  items.splice(idx, 1);
  renderAllItems();
  updateItemCount();
}

function switchItemType(idx, type) {
  items[idx].type = type;
  // Update DOM without full re-render
  const perhiasanForm = document.getElementById(`formPerhiasan_${idx}`);
  const batanganForm  = document.getElementById(`formBatangan_${idx}`);
  const btnP = document.getElementById(`btnPerhiasan_${idx}`);
  const btnB = document.getElementById(`btnBatangan_${idx}`);
  if (perhiasanForm) perhiasanForm.classList.toggle("hidden", type === "batangan");
  if (batanganForm)  batanganForm.classList.toggle("hidden", type === "perhiasan");
  if (btnP) btnP.classList.toggle("active", type === "perhiasan");
  if (btnB) btnB.classList.toggle("active", type === "batangan");
  if (type === "batangan") updateMerekInfoItem(idx);
}

function saveItemField(idx) {
  const item = items[idx];
  if (item.type === "perhiasan") {
    const kadarEl = document.getElementById(`kadar_${idx}`);
    const beratEl = document.getElementById(`berat_${idx}`);
    if (kadarEl) item.kadar = parseFloat(kadarEl.value);
    if (beratEl) item.berat = parseFloat(beratEl.value) || "";
  } else {
    const merekEl = document.getElementById(`merek_${idx}`);
    const denomEl = document.getElementById(`denom_${idx}`);
    if (merekEl) item.merek = merekEl.value;
    if (denomEl) item.denom = parseFloat(denomEl.value);
  }
}

function onMerekChangeItem(idx) {
  saveItemField(idx);
  updateMerekInfoItem(idx);
}

function updateMerekInfoItem(idx) {
  const item = items[idx];
  const el = document.getElementById(`infoMerek_${idx}`);
  if (!el) return;
  const stl = getSTLBatangan(item.merek);
  const labels = {
    galeri24: "Galeri 24 — STL Khusus (lebih tinggi)",
    antam: "ANTAM — STL mengikuti perhiasan",
    ubs: "UBS — STL mengikuti perhiasan",
  };
  el.innerText = (labels[item.merek] || "") + " | STL: Rp " + stl.toLocaleString("id-ID") + "/gram";
}

/**
 * Read current field values from DOM for all items and compute
 * Returns { valid, totalTaksiran, totalUP, itemResults }
 */
function computeMultiItem() {
  let totalTaksiran = 0;
  let totalUP = 0;
  const itemResults = [];
  const plafon = selectedProduct === "KRASIDA" ? 0.95 : 0.92;
  const tenorVal = parseInt(document.getElementById("tenor").value);

  for (let i = 0; i < items.length; i++) {
    // Read latest from DOM
    saveItemField(i);
    const item = items[i];
    let taksiran = 0;

    if (item.type === "perhiasan") {
      const berat = parseFloat(item.berat) || 0;
      if (berat <= 0 || berat > 1000) {
        alert(`Barang ${i + 1}: Masukkan berat bersih yang valid (0.01 - 1000 gr)`);
        const el = document.getElementById(`berat_${i}`);
        if (el) el.classList.add("input-error");
        return { valid: false };
      }
      const el = document.getElementById(`berat_${i}`);
      if (el) el.classList.remove("input-error");
      taksiran = berat * (item.kadar / 24) * STL_PERHIASAN;
    } else {
      taksiran = item.denom * getSTLBatangan(item.merek);
    }

    let plafonItem = plafon;
    if (selectedProduct === "FLEKSI" && tenorVal == 15) plafonItem = 0.96;
    const upItem = Math.floor(taksiran * plafonItem / 1000) * 1000;

    totalTaksiran += taksiran;
    totalUP += upItem;

    const label = item.type === "perhiasan"
      ? `Perhiasan ${item.kadar}K · ${item.berat}gr`
      : `Batangan ${item.denom >= 1 ? item.denom : "0,5"}gr (${item.merek})`;

    itemResults.push({ label, taksiran, up: upItem });
  }

  return { valid: true, totalTaksiran, totalUP, itemResults };
}

/* ================= EXISTING FUNCTIONS (preserved, extended) ================= */

function onMerekChange() { updateMerekInfo(); }

function updateMerekInfo() {
  const el = document.getElementById("infoMerek");
  if (!el) return;
  const merekEl = document.getElementById("merekBatangan");
  const merek = merekEl ? merekEl.value : "galeri24";
  const stl = getSTLBatangan(merek);
  const labels = {
    galeri24: "Galeri 24 — STL Khusus (lebih tinggi)",
    antam: "ANTAM — STL mengikuti perhiasan",
    ubs: "UBS — STL mengikuti perhiasan",
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
  document.getElementById("btnModeTaksir").classList.toggle("active", mode === "taksir");
  document.getElementById("btnModeInputUP").classList.toggle("active", mode === "inputUP");

  // Multi-item wrapper: show only in taksir mode
  const multiWrapper = document.getElementById("multiItemWrapper");
  if (multiWrapper) multiWrapper.classList.toggle("hidden", mode === "inputUP");

  // Single UP input: show only in inputUP mode
  const upGlobal = document.getElementById("sectionInputUPGlobal");
  if (upGlobal) upGlobal.classList.toggle("hidden", mode === "taksir");
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
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (c) => c.label + ": Rp " + Math.round(c.raw).toLocaleString("id-ID")
          }
        },
      },
      cutout: "65%",
    },
  });
}

function hitungTaksiran() {
  const tenorVal = parseInt(document.getElementById("tenor").value);
  let upFinal = 0, taksiran = 0;

  document.getElementById("sectionDetailKCA").classList.add("hidden");
  document.getElementById("bodyTabelKCA").innerHTML = "";

  if (currentMode === "taksir") {
    // ===== MULTI-ITEM MODE =====
    const result = computeMultiItem();
    if (!result.valid) return;

    upFinal = result.totalUP;
    taksiran = result.totalTaksiran;

    document.getElementById("rowTaksiran").classList.remove("hidden");
    document.getElementById("titleUP").innerText =
      result.itemResults.length > 1 ? "Total Uang Pinjaman (UP)" : "Uang Pinjaman (UP)";

    // Render multi-item summary
    const summarySection = document.getElementById("multiItemSummary");
    const summaryList    = document.getElementById("itemSummaryList");
    if (result.itemResults.length > 1) {
      summarySection.classList.remove("hidden");
      summaryList.innerHTML = result.itemResults.map((r, i) => `
        <div class="summary-item-row">
          <div class="summary-item-label">${i + 1}. ${r.label}</div>
          <div class="summary-item-vals">
            <span class="summary-taksir">Taksiran: Rp ${Math.round(r.taksiran).toLocaleString("id-ID")}</span>
            <span class="summary-up">UP: Rp ${r.up.toLocaleString("id-ID")}</span>
          </div>
        </div>
      `).join("");
    } else {
      summarySection.classList.add("hidden");
    }

  } else {
    // ===== SINGLE INPUT UP MODE =====
    upFinal = parseFloat(document.getElementById("inputNominalUP").value) || 0;
    if (upFinal < 50000) {
      alert("Minimal pinjaman adalah Rp 50.000");
      document.getElementById("inputNominalUP").classList.add("input-error");
      return;
    }
    document.getElementById("inputNominalUP").classList.remove("input-error");
    document.getElementById("rowTaksiran").classList.add("hidden");
    document.getElementById("titleUP").innerText = "Nominal Pinjaman";
    const summarySection = document.getElementById("multiItemSummary");
    if (summarySection) summarySection.classList.add("hidden");
  }

  // ===== CALCULATE SEWA =====
  let sewaDesc = "", estimasiSewa = 0, unitWaktu = "";
  let dt = new Date(), totalSewaUntukGrafik = 0;

  if (selectedProduct === "KCA") {
    let tarifKCA = upFinal > 20100000 ? 0.011 : 0.012;
    sewaDesc = (tarifKCA * 100).toFixed(1) + "% / 15 Hari";
    estimasiSewa = upFinal * tarifKCA;
    unitWaktu = " / 15 Hari";
    dt.setDate(dt.getDate() + 120);
    document.getElementById("lblSewaNominal").innerText = "Estimasi Sewa (Per 15 Hari):";
    totalSewaUntukGrafik = estimasiSewa * 8;
    document.getElementById("sectionDetailKCA").classList.remove("hidden");
    let htmlTabel = "";
    for (let i = 1; i <= 8; i++) {
      let sewaAkumulasi = upFinal * tarifKCA * i;
      htmlTabel += `<tr><td>Ke-${i}</td><td>${i * 15}</td><td>Rp ${Math.round(sewaAkumulasi).toLocaleString("id-ID")}</td></tr>`;
    }
    document.getElementById("bodyTabelKCA").innerHTML = htmlTabel;
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
    else if (tenorVal === 48) tarifKrasida = 0.014;
    sewaDesc = (tarifKrasida * 100).toFixed(2) + "% / Bulan";
    estimasiSewa = upFinal / tenorVal + upFinal * tarifKrasida;
    unitWaktu = " / Bulan";
    dt.setMonth(dt.getMonth() + tenorVal);
    document.getElementById("lblSewaNominal").innerText = "Angsuran Tetap:";
    totalSewaUntukGrafik = upFinal * tarifKrasida * tenorVal;
  }

  document.getElementById("resUP").innerText = "Rp " + upFinal.toLocaleString("id-ID");
  document.getElementById("resTaksiran").innerText = "Rp " + Math.round(taksiran).toLocaleString("id-ID");
  document.getElementById("resSewaDesc").innerText = sewaDesc;
  document.getElementById("resSewaNominal").innerText = "± Rp " + Math.round(estimasiSewa).toLocaleString("id-ID") + unitWaktu;
  document.getElementById("resJatuhTempo").innerText = dt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
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
  0.5: 1488000,
  1: 2836000,
  2: 5603000,
  5: 13906000,
  10: 27736000,
  25: 68968000,
  50: 137826000,
  100: 275516000,
  250: 687099000,
  500: 1374196000,
  1000: 2748391000,
};

let currentMargin = 0.0092;
const adminFee = 50000;
const dpRate = 0.15;
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
  const tbody = document.getElementById("simulation-table");
  if (!tbody) return;
  const infoText = document.getElementById("dp-info-text");
  tbody.innerHTML = "";
  const denoms = [0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000];
  denoms.forEach((d) => {
    const tunai = hargaEmas[d];
    const dpMinimal = tunai * dpRate;
    let dpDipakai = customDPRupiah > dpMinimal ? customDPRupiah : dpMinimal;
    const totalDP = dpDipakai + adminFee;
    const pinjaman = tunai - dpDipakai;
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
  const el = document.getElementById("panelHasil");
  const canvas = await html2canvas(el, { scale: 2, useCORS: true });
  const img = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");
  const width = pdf.internal.pageSize.getWidth();
  pdf.addImage(img, "PNG", 0, 0, width, (canvas.height * width) / canvas.width);
  pdf.save("hasil-digi-taksir.pdf");
}

/* ================= SAVE HISTORY ================= */
function saveHistory() {
  let data = {
    waktu: new Date().toLocaleString("id-ID"),
    produk: selectedProduct,
    totalTaksiran: document.getElementById("resTotalTaksiran")?.innerText,
    up: document.getElementById("resUP")?.innerText,
    tenor: document.getElementById("tenor")?.value,
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
