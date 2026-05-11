/* ============================================================
   DIGI-TAKSIR CORE LOGIC
   ============================================================ */

// Data Statis (Sesuaikan dengan SE Pegadaian Terbaru)
const HARGA_EMAS_BATANGAN = 1250000;
const STL_BATANGAN = 1180000;
const STL_PERHIASAN_24K = 1100000;
let itemsCount = 0;
let currentMode = 'barang';
let myChart = null;

// 1. Visitor Counter Logic
function updateVisitorCount() {
    let count = localStorage.getItem('visitorCount') || 0;
    count++;
    localStorage.setItem('visitorCount', count);
    const el = document.getElementById('visitorCount');
    if(el) el.innerText = count;
}

// 2. Mode Switcher
function switchMode(mode, btn) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if(mode === 'barang') {
        document.getElementById('sectionBarang').classList.remove('hidden');
        document.getElementById('sectionUP').classList.add('hidden');
    } else {
        document.getElementById('sectionBarang').classList.add('hidden');
        document.getElementById('sectionUP').classList.remove('hidden');
    }
}

// 3. Multi-Item Management
function addItem() {
    itemsCount++;
    const container = document.getElementById('itemsContainer');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.id = `item-${itemsCount}`;
    row.innerHTML = `
        <div class="item-header">
            <span class="item-label">Barang ${itemsCount}</span>
            ${itemsCount > 1 ? `<button class="btn-remove-item" onclick="removeItem(${itemsCount})">Hapus</button>` : ''}
        </div>
        <div class="item-fields">
            <div class="item-field item-field-full">
                <label>Jenis Emas</label>
                <select class="sel-jenis">
                    <option value="batangan">Batangan (ANTAM/G24)</option>
                    <option value="perhiasan">Perhiasan</option>
                </select>
            </div>
            <div class="item-field">
                <label>Karat</label>
                <select class="sel-karat">
                    <option value="24">24K</option>
                    <option value="23">23K</option>
                    <option value="22">22K</option>
                    <option value="18">18K</option>
                </select>
            </div>
            <div class="item-field">
                <label>Berat (Gram)</label>
                <input type="number" class="in-berat" placeholder="0.00" step="0.01">
            </div>
        </div>
    `;
    container.appendChild(row);
}

function removeItem(id) {
    document.getElementById(`item-${id}`).remove();
}

// 4. Kalkulasi Utama
function hitungTaksiran() {
    let totalTaksiran = 0;
    let upDiinginkan = 0;

    if(currentMode === 'barang') {
        const rows = document.querySelectorAll('.item-row');
        rows.forEach(row => {
            const jenis = row.querySelector('.sel-jenis').value;
            const karat = parseInt(row.querySelector('.sel-karat').value);
            const berat = parseFloat(row.querySelector('.in-berat').value) || 0;
            
            let stl = jenis === 'batangan' ? STL_BATANGAN : STL_PERHIASAN_24K;
            let nilai = berat * stl * (karat/24);
            totalTaksiran += nilai;
        });
        upDiinginkan = totalTaksiran * 0.92; // Default LTV 92%
    } else {
        upDiinginkan = parseFloat(document.getElementById('inputNominalUP').value) || 0;
        totalTaksiran = upDiinginkan / 0.92;
    }

    if(upDiinginkan <= 0) {
        alert("Masukkan data dengan benar!");
        return;
    }

    displayResults(totalTaksiran, upDiinginkan);
}

// 5. Display & Visualisasi
function displayResults(taksiran, up) {
    const panel = document.getElementById('resultPanel');
    panel.style.display = 'block';

    const sewaModal = up * 0.012; // Misal tarif 1.2% per 15 hari
    
    document.getElementById('resUP').innerText = formatIDR(up);
    document.getElementById('resTaksiran').innerText = formatIDR(taksiran);
    document.getElementById('resLTV').innerText = ((up/taksiran)*100).toFixed(1) + "%";
    document.getElementById('resSewa').innerText = formatIDR(sewaModal);

    // Build Table KCA
    let tableHtml = "";
    for(let i=1; i<=8; i++) {
        let sewaAkumulasi = sewaModal * i;
        tableHtml += `
            <tr>
                <td>${i * 15}</td>
                <td>${formatIDR(sewaAkumulasi)}</td>
                <td>${formatIDR(up + sewaAkumulasi)}</td>
            </tr>
        `;
    }
    document.getElementById('resTabelKCA').innerHTML = tableHtml;

    updateChart(up, sewaModal);
}

function updateChart(up, sewa) {
    const ctx = document.getElementById('resultChart').getContext('2d');
    if(myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pinjaman (UP)', 'Sewa Modal'],
            datasets: [{
                data: [up, sewa],
                backgroundColor: ['#008444', '#ffcc00']
            }]
        },
        options: {
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function formatIDR(num) {
    return "Rp " + Math.round(num).toLocaleString('id-ID');
}

// 6. Export PDF
async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const element = document.getElementById('resultPanel');
    
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    doc.text("Simulasi Digi-Taksir Pegadaian", 10, 10);
    doc.addImage(imgData, 'PNG', 10, 20, 180, 0);
    doc.save("Simulasi-Gadai.pdf");
}

// 7. Rating Simple
function setRating(val) {
    const stars = document.querySelectorAll('.star-rating span');
    stars.forEach((s, idx) => {
        s.style.color = idx < val ? '#ffcc00' : '#ccc';
    });
    alert("Terima kasih atas rating " + val + " Anda!");
}
