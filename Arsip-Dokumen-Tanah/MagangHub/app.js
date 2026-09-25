/* ==========================================================
   ARSIP DOKUMEN TANAH
   Login > Dashboard > Arsip/Detail Lahan > Dokumen (9 prosedur)
   > Tambah / Detail / Edit / Hapus / Preview / Unduh > Laporan
   Dokumen disimpan di localStorage browser (bukan database).
   ========================================================== */

// Akun demo. Untuk produksi, validasi login harus di server.
const AKUN = [
  { username: "admin", password: "admin123" },
  { username: "budi",  password: "budi2026" },
  { username: "sari",  password: "sari2026" },
];

const TAHAPAN = [
  "Permintaan Lahan",
  "Rencana Akuisisi Lahan",
  "Meeting Koordinasi Akuisisi Lahan",
  "Pengukuran Lahan dan Pengukuran Dokumen",
  "Pengecekan Dokumen Pembebasan Lahan",
  "Negosiasi dengan Pemilik Lahan",
  "Pembayaran Akuisisi Lahan",
  "Kearsipan Penggunaan Lahan",
  "Sertifikasi Lahan Tahunan",
];
const TIPE = ["PDF", "DOCX", "XLSX", "JPG", "PNG"];

const LAHAN = [
  { id: 1, kode: "LHN-001", nama: "Lahan Blok A", lokasi: "Cikarang, Bekasi", pemilik: "Bpk. Suherman", luas: 12500, status: "Proses" },
  { id: 2, kode: "LHN-002", nama: "Lahan Blok B", lokasi: "Karawang, Jawa Barat", pemilik: "Ibu Marlina", luas: 8300, status: "Selesai" },
  { id: 3, kode: "LHN-003", nama: "Lahan Blok C", lokasi: "Purwakarta, Jawa Barat", pemilik: "PT Tani Makmur", luas: 21000, status: "Proses" },
];

// Data contoh awal (tanpa file). Dokumen baru dibuat lewat tombol "Tambah dokumen".
const s = (id, lahanId, tahap, judul, nomor, tanggal, ket = "") =>
  ({ id, lahanId, tahap, judul, nomor, tanggal, ket, tipe: "PDF", file: null });
const SEED = [
  s(1, 1, 0, "Surat Permintaan Lahan", "001/MSM/I/2026", "2026-01-10", "Permintaan lahan area Blok A"),
  s(2, 1, 1, "Rencana Akuisisi Blok A", "002/MSM/I/2026", "2026-01-24"),
  s(3, 1, 2, "Notulen Meeting Koordinasi", "003/MSM/II/2026", "2026-02-03", "Dihadiri tim legal dan lapangan"),
  s(4, 1, 3, "Hasil Pengukuran Lahan", "004/MSM/II/2026", "2026-02-20"),
  s(5, 2, 0, "Surat Permintaan Lahan", "010/MSM/III/2025", "2025-03-02"),
  s(6, 2, 5, "Berita Acara Negosiasi", "011/MSM/V/2025", "2025-05-08"),
  s(7, 2, 6, "Bukti Pembayaran", "012/MSM/V/2025", "2025-05-30"),
  s(8, 2, 8, "Sertifikat 2025", "013/MSM/XII/2025", "2025-12-05"),
  s(9, 3, 0, "Surat Permintaan Lahan", "020/MSM/V/2026", "2026-05-12"),
  s(10, 3, 1, "Rencana Akuisisi Blok C", "021/MSM/V/2026", "2026-05-30"),
  s(11, 2, 4, "Cek Dokumen Pembebasan", "014/MSM/IV/2025", "2025-04-22"),
  s(12, 2, 7, "Arsip Penggunaan Lahan", "015/MSM/VI/2025", "2025-06-15", "Arsip pemanfaatan lahan Blok B"),
];

/* ---------- Penyimpanan ---------- */
const KEY = "arsip_tanah_dokumen";
function muat() {
  try { const v = localStorage.getItem(KEY); if (v) return JSON.parse(v); } catch {}
  return SEED;
}
function simpan() {
  try { localStorage.setItem(KEY, JSON.stringify(DOK)); return true; } catch { return false; }
}
let DOK = muat();

/* ---------- Bantuan ---------- */
const $ = (q) => document.querySelector(q);
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtLuas = (n) => n.toLocaleString("id-ID") + " m²";
const fmtTgl = (t) => new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const fmtUkuran = (b) => b < 1048576 ? Math.round(b / 1024) + " KB" : (b / 1048576).toFixed(1).replace(".", ",") + " MB";
const namaLahan = (id) => (LAHAN.find((l) => l.id === id) || {}).nama || "-";
const hariIni = () => new Date().toLocaleDateString("sv-SE"); // format YYYY-MM-DD
const F0 = { q: "", lahan: "", tahap: "", tipe: "", dari: "", sampai: "" };
const state = { view: "dashboard", lahanId: null, tahap: 0, q: "", status: "", f: { ...F0 } };

/* ---------- Ikon (SVG) ---------- */
const IKON = {
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
  chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
  go: '<path d="M7 17L17 7M7 7h10v10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};
const ico = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IKON[n]}</svg>`;
document.querySelectorAll("[data-ico]").forEach((el) => el.insertAdjacentHTML("afterbegin", ico(el.dataset.ico)));

/* ---------- Login ---------- */
function masuk() {
  $("#login").hidden = true; $("#app").hidden = false;
  const u = sessionStorage.getItem("login");
  $("#userNama").textContent = u === "1" ? "Pengguna" : u;
  $("#avatar").textContent = u === "1" ? "P" : u[0];
  tampil("dashboard");
}
$("#loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const a = AKUN.find((z) => z.username === $("#user").value.trim() && z.password === $("#pass").value);
  $("#loginErr").hidden = !!a;
  if (a) { sessionStorage.setItem("login", a.username); masuk(); }
});
$("#logout").addEventListener("click", () => {
  sessionStorage.removeItem("login");
  $("#app").hidden = true; $("#login").hidden = false; $("#pass").value = "";
});

$("#cariGlobal").addEventListener("submit", (e) => {
  e.preventDefault();
  state.f = { ...F0, q: $("#cariInput").value.trim() };
  tampil("dokumen");
});

/* ---------- Navigasi ---------- */
const VIEWS = { dashboard: viewDashboard, arsip: viewArsip, detail: viewDetail, dokumen: viewDokumen, laporan: viewLaporan };
function tampil(view, opsi = {}) {
  Object.assign(state, { view }, opsi);
  document.querySelectorAll(".side [data-nav]").forEach((b) =>
    b.classList.toggle("on", b.dataset.nav === (view === "detail" ? "arsip" : view)));
  $("#content").innerHTML = VIEWS[view]();
  window.scrollTo(0, 0);
}

/* ---------- Baris dokumen (dipakai di banyak halaman) ---------- */
const barisDok = (x, lahan = true, aksi = true) => `<div class="doc"><div class="ext">${esc(x.tipe)}</div>
  <div class="name"><b>${esc(x.judul)}</b><span>${lahan ? esc(namaLahan(x.lahanId)) + " · " : ""}${x.nomor ? esc(x.nomor) + " · " : ""}${fmtTgl(x.tanggal)}</span></div>
  ${aksi ? `<div class="acts">
    <button class="btn" data-a="detail" data-id="${x.id}">Detail</button>
    <button class="btn" data-a="lihat" data-id="${x.id}">Preview</button>
    <button class="btn" data-a="unduh" data-id="${x.id}">Unduh</button>
    <button class="btn" data-a="edit" data-id="${x.id}">Edit</button>
    <button class="btn danger" data-a="hapus" data-id="${x.id}">Hapus</button></div>` : ""}</div>`;

/* ---------- Dashboard ---------- */
function statistik() {
  const isi = LAHAN.map((l) => new Set(DOK.filter((x) => x.lahanId === l.id).map((x) => x.tahap)).size);
  const terisi = isi.reduce((a, b) => a + b, 0);
  return { isi, terisi, pct: Math.round(terisi / (LAHAN.length * 9) * 100) };
}
function viewDashboard() {
  const selesai = LAHAN.filter((l) => l.status === "Selesai").length;
  const per = TAHAPAN.map((_, i) => DOK.filter((x) => x.tahap === i).length);
  const max = Math.max(...per, 1), st = statistik(), busur = 251.3;
  const terbaru = [...DOK].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 5);
  const kpi = (judul, angka, ket, nav, hi) => `<div class="card kpi${hi ? " hi" : ""}"><span>${judul}</span>
    <button class="go" data-nav="${nav}" aria-label="Buka ${judul}">${ico("go")}</button><b>${angka}</b><small>${ket}</small></div>`;
  return `
    <div class="head"><div><h1>Dashboard</h1><p class="muted">Pantau, kelola, dan arsipkan dokumen lahan dengan mudah.</p></div>
      <div class="acts"><button class="btn primary" data-a="tambah">${ico("plus")} Tambah Dokumen</button>
        <button class="btn" data-nav="laporan">Laporan Rekapan</button></div></div>
    <div class="dash">
      ${kpi("Total Dokumen", DOK.length, `tersebar di ${per.filter(Boolean).length} dari 9 prosedur`, "dokumen", true)}
      ${kpi("Total Lahan", LAHAN.length, "terdaftar di arsip", "arsip")}
      ${kpi("Lahan Dalam Proses", LAHAN.length - selesai, "akuisisi masih berjalan", "arsip")}
      ${kpi("Lahan Selesai", selesai, "akuisisi telah rampung", "arsip")}
      <div class="card c2"><h3>Dokumen per Prosedur</h3><div class="bars">${per.map((n, i) => `
        <div class="bar" title="${esc(TAHAPAN[i])}: ${n} dokumen">${n ? `<em>${n}</em>` : ""}
          <i class="${!n ? "nol" : n === max ? "max" : ""}" style="height:${n ? 30 + Math.round(110 * n / max) : 30}px"></i><span>P${i + 1}</span></div>`).join("")}</div></div>
      <div class="card"><h3>Kelengkapan Arsip</h3><div class="donut">
        <svg viewBox="0 0 200 110"><path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="#e4e8ea" stroke-width="22" stroke-linecap="round"/>
        <path d="M20 100A80 80 0 0 1 180 100" fill="none" style="stroke:var(--primary)" stroke-width="22" stroke-linecap="round" stroke-dasharray="${busur * st.pct / 100} ${busur}"/></svg>
        <div class="val">${st.pct}%<small>prosedur terisi</small></div></div>
        <div class="leg"><span><i style="background:var(--primary)"></i>Terisi ${st.terisi}</span><span><i style="background:#cdd6da"></i>Kosong ${LAHAN.length * 9 - st.terisi}</span></div></div>
      <div class="card r2"><h3>Dokumen Terbaru</h3>${terbaru.length ? terbaru.map((x) => `
        <button class="mini" data-a="detail" data-id="${x.id}"><span class="pn">P${x.tahap + 1}</span>
          <span><b>${esc(x.judul)}</b><small>${esc(namaLahan(x.lahanId))} · ${fmtTgl(x.tanggal)}</small></span></button>`).join("") : `<div class="empty">Belum ada dokumen.</div>`}</div>
      <div class="card c2"><h3>Kelengkapan per Lahan</h3>${LAHAN.map((l, i) => `
        <div class="lh" data-lahan="${l.id}"><span class="av">${esc(l.nama.slice(-1))}</span>
          <span class="nm"><b>${esc(l.nama)}</b><small>${esc(l.lokasi)} · ${st.isi[i]}/9 prosedur</small>
            <span class="pg"><i style="width:${Math.round(st.isi[i] / 9 * 100)}%"></i></span></span>
          <span class="badge ${l.status === "Proses" ? "amber" : ""}">${l.status}</span></div>`).join("")}</div>
      <div class="card lap"><div><h3>Laporan Rekapan</h3><p>Rekap jumlah dokumen per lahan dan per prosedur. Bisa dicetak atau diunduh.</p></div>
        <button class="btn" data-nav="laporan">Buka laporan</button></div>
    </div>`;
}

/* ---------- Arsip: daftar lahan ---------- */
function barisLahan() {
  const q = state.q.toLowerCase();
  const data = LAHAN.filter((l) => (!state.status || l.status === state.status) &&
    [l.kode, l.nama, l.lokasi, l.pemilik].join(" ").toLowerCase().includes(q));
  if (!data.length) return `<tr><td colspan="6" class="empty">Tidak ada lahan yang cocok. Ubah kata kunci atau filter.</td></tr>`;
  return data.map((l) => `<tr data-lahan="${l.id}">
    <td>${esc(l.kode)}</td><td><b>${esc(l.nama)}</b></td><td>${esc(l.lokasi)}</td><td>${esc(l.pemilik)}</td>
    <td>${new Set(DOK.filter((x) => x.lahanId === l.id).map((x) => x.tahap)).size}/9 prosedur</td>
    <td><span class="badge ${l.status === "Proses" ? "amber" : ""}">${l.status}</span></td></tr>`).join("");
}
function viewArsip() {
  return `
    <div class="head"><div><h1>Arsip Dokumen Tanah</h1><p class="muted">Pilih lahan untuk melihat dokumennya.</p></div></div>
    <div class="tools">
      <input data-s="q" type="search" placeholder="Cari kode, nama, lokasi, atau pemilik" value="${esc(state.q)}">
      <select data-s="status" aria-label="Filter status">
        <option value="">Semua status</option>
        <option ${state.status === "Proses" ? "selected" : ""}>Proses</option>
        <option ${state.status === "Selesai" ? "selected" : ""}>Selesai</option>
      </select>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Kode</th><th>Nama lahan</th><th>Lokasi</th><th>Pemilik</th><th>Kelengkapan</th><th>Status</th></tr></thead>
      <tbody id="hasil">${barisLahan()}</tbody></table></div>`;
}

/* ---------- Detail lahan + 9 prosedur ---------- */
function viewDetail() {
  const l = LAHAN.find((x) => x.id === state.lahanId);
  const milik = DOK.filter((x) => x.lahanId === l.id);
  const dok = milik.filter((x) => x.tahap === state.tahap);
  return `
    <button class="btn back" data-back>Kembali ke arsip</button>
    <div class="head"><div><h1>${esc(l.nama)}</h1><p class="muted">${esc(l.kode)}</p></div>
      <span class="badge ${l.status === "Proses" ? "amber" : ""}">${l.status}</span></div>
    <div class="panel info">
      <div><span>Lokasi</span>${esc(l.lokasi)}</div><div><span>Pemilik</span>${esc(l.pemilik)}</div>
      <div><span>Luas</span>${fmtLuas(l.luas)}</div><div><span>Total dokumen</span>${milik.length} berkas</div>
    </div>
    <div class="head"><h2>Dokumen lahan</h2><button class="btn primary" data-a="tambah">Tambah dokumen</button></div>
    <div class="docs">
      <ol class="stages">${TAHAPAN.map((t, i) => {
        const n = milik.filter((x) => x.tahap === i).length;
        return `<li><button data-tahap="${i}" class="${i === state.tahap ? "on" : ""} ${n ? "filled" : ""}">
          <span class="no">${i + 1}</span>${esc(t)}<small>${n || "kosong"}</small></button></li>`;
      }).join("")}</ol>
      <div class="panel"><h3>${state.tahap + 1}. ${esc(TAHAPAN[state.tahap])}</h3>
        ${dok.length ? dok.map((x) => barisDok(x, false)).join("") : `<div class="empty">Belum ada dokumen di prosedur ini.</div>`}
      </div>
    </div>`;
}

/* ---------- Dokumen: dikelompokkan per 9 prosedur + filter ---------- */
function saring() {
  const f = state.f, q = f.q.toLowerCase();
  return DOK.filter((x) =>
    (!f.lahan || String(x.lahanId) === f.lahan) &&
    (f.tahap === "" || String(x.tahap) === f.tahap) &&
    (!f.tipe || x.tipe === f.tipe) &&
    (!f.dari || x.tanggal >= f.dari) &&
    (!f.sampai || x.tanggal <= f.sampai) &&
    (!q || [x.judul, x.nomor, x.ket, namaLahan(x.lahanId)].join(" ").toLowerCase().includes(q)));
}
// Kesembilan prosedur selalu tampil, termasuk yang belum berisi dokumen
function daftarDokumen() {
  const d = saring(), f = state.f;
  const aktif = f.q || f.lahan || f.tipe || f.dari || f.sampai;
  return TAHAPAN.map((t, i) => {
    if (f.tahap !== "" && String(i) !== f.tahap) return "";
    const g = d.filter((x) => x.tahap === i);
    return `<section class="grup"><h3>${i + 1}. ${esc(t)} <small>${g.length} dokumen</small>
      <button class="btn" data-a="tambah" data-t="${i}">Tambah</button></h3>
      <div class="panel">${g.length ? g.map((x) => barisDok(x)).join("")
        : `<div class="empty">${aktif ? "Tidak ada dokumen yang cocok dengan filter." : "Belum ada dokumen di prosedur ini."}</div>`}</div></section>`;
  }).join("");
}
function viewDokumen() {
  const f = state.f;
  const opt = (arr, val) => arr.map(([v, t]) => `<option value="${v}"${String(val) === String(v) ? " selected" : ""}>${esc(t)}</option>`).join("");
  return `
    <div class="head"><div><h1>Dokumen</h1><p class="muted">Arsip dikelompokkan menurut 9 prosedur dokumen.</p></div>
      <button class="btn primary" data-a="tambah">Tambah dokumen</button></div>
    <div class="tools filter">
      <input data-f="q" type="search" placeholder="Cari judul, nomor, keterangan, atau lahan" value="${esc(f.q)}">
      <select data-f="lahan" aria-label="Lahan"><option value="">Semua lahan</option>${opt(LAHAN.map((l) => [l.id, l.kode + " - " + l.nama]), f.lahan)}</select>
      <select data-f="tahap" aria-label="Prosedur"><option value="">Semua prosedur</option>${opt(TAHAPAN.map((t, i) => [i, (i + 1) + ". " + t]), f.tahap)}</select>
      <select data-f="tipe" aria-label="Tipe file"><option value="">Semua tipe file</option>${opt(TIPE.map((t) => [t, t]), f.tipe)}</select>
      <label>Dari <input data-f="dari" type="date" value="${f.dari}"></label>
      <label>Sampai <input data-f="sampai" type="date" value="${f.sampai}"></label>
      <button class="btn" data-a="reset">Reset</button>
    </div>
    <div id="hasil">${daftarDokumen()}</div>`;
}

/* ---------- Laporan rekapan ---------- */
function rekap() {
  const h = LAHAN.map((l) => {
    const c = TAHAPAN.map((_, i) => DOK.filter((x) => x.lahanId === l.id && x.tahap === i).length);
    return { l, c, t: c.reduce((a, b) => a + b, 0) };
  });
  return { h, tot: TAHAPAN.map((_, i) => DOK.filter((x) => x.tahap === i).length) };
}
function viewLaporan() {
  const r = rekap();
  return `
    <div class="head"><div><h1>Laporan Rekapan Arsip</h1><p class="muted">Per ${fmtTgl(hariIni())} · jumlah dokumen per lahan dan prosedur</p></div>
      <div class="acts no-print"><button class="btn" data-a="csv">Unduh CSV</button><button class="btn primary" data-a="cetak">Cetak / simpan PDF</button></div></div>
    <div class="table-wrap"><table class="rekap"><thead><tr><th>Kode</th><th>Lahan</th><th>Status</th>
      ${TAHAPAN.map((t, i) => `<th title="${esc(t)}">P${i + 1}</th>`).join("")}<th>Total</th></tr></thead><tbody>
      ${r.h.map((o) => `<tr><td>${esc(o.l.kode)}</td><td>${esc(o.l.nama)}</td><td>${o.l.status}</td>
        ${o.c.map((n) => `<td>${n || "-"}</td>`).join("")}<td><b>${o.t}</b></td></tr>`).join("")}
      <tr class="tot"><td colspan="3">Total</td>${r.tot.map((n) => `<td>${n}</td>`).join("")}<td>${DOK.length}</td></tr>
    </tbody></table></div>
    <p class="muted keterangan">${TAHAPAN.map((t, i) => `P${i + 1} = ${esc(t)}`).join(" · ")}</p>`;
}
function unduhCsv() {
  const r = rekap(), q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const baris = [
    ["Kode", "Nama Lahan", "Status", ...TAHAPAN.map((t, i) => `${i + 1}. ${t}`), "Total"],
    ...r.h.map((o) => [o.l.kode, o.l.nama, o.l.status, ...o.c, o.t]),
    ["Total", "", "", ...r.tot, DOK.length],
  ];
  const a = document.createElement("a");
  // Pemisah titik koma agar terbuka rapi di Excel berbahasa Indonesia
  a.href = URL.createObjectURL(new Blob(["\ufeff" + baris.map((b) => b.map(q).join(";")).join("\r\n")], { type: "text/csv" }));
  a.download = "rekap-arsip-tanah.csv";
  a.click();
}

/* ---------- File: preview & unduh ---------- */
const urlFile = async (x) => URL.createObjectURL(await (await fetch(x.file.data)).blob());
async function preview(x) {
  $("#pvTitle").textContent = x.judul;
  $("#pvDownload").dataset.id = x.id;
  let isi = `<div><p><b>${esc(x.judul)}</b></p><p>Dokumen ini belum memiliki file. Klik Edit untuk mengunggah file.</p></div>`;
  if (x.file) {
    const u = await urlFile(x);
    if (x.tipe === "PDF") isi = `<iframe src="${u}" title="${esc(x.judul)}"></iframe>`;
    else if (x.tipe === "JPG" || x.tipe === "PNG") isi = `<img src="${u}" alt="${esc(x.judul)}">`;
    else isi = `<div><p><b>${esc(x.file.nama)}</b></p><p>Preview tidak tersedia untuk file ${esc(x.tipe)}. Silakan unduh.</p></div>`;
  }
  $("#pvBody").innerHTML = `<div class="sheet">${isi}</div>`;
  $("#preview").showModal();
}
async function unduh(x) {
  if (!x.file) return alert("Dokumen ini belum memiliki file. Klik Edit untuk mengunggah file.");
  const a = document.createElement("a");
  a.href = await urlFile(x); a.download = x.file.nama; a.click();
}

/* ---------- Detail dokumen ---------- */
function detail(x) {
  const l = LAHAN.find((z) => z.id === x.lahanId);
  $("#dtTitle").textContent = x.judul;
  $("#dtBody").innerHTML = `<dl class="dl">
    <dt>Lahan</dt><dd>${esc(l.kode)} - ${esc(l.nama)}</dd>
    <dt>Prosedur</dt><dd>${x.tahap + 1}. ${esc(TAHAPAN[x.tahap])}</dd>
    <dt>Nomor dokumen</dt><dd>${esc(x.nomor || "-")}</dd>
    <dt>Tanggal</dt><dd>${fmtTgl(x.tanggal)}</dd>
    <dt>Keterangan</dt><dd>${esc(x.ket || "-")}</dd>
    <dt>File</dt><dd>${x.file ? `${esc(x.file.nama)} (${esc(x.tipe)}, ${fmtUkuran(x.file.ukuran)})` : "Belum ada file"}</dd></dl>`;
  $("#dtAksi").innerHTML = `
    <button class="btn" data-a="lihat" data-id="${x.id}">Preview</button>
    <button class="btn" data-a="unduh" data-id="${x.id}">Unduh</button>
    <button class="btn" data-a="edit" data-id="${x.id}">Edit</button>
    <button class="btn danger" data-a="hapus" data-id="${x.id}">Hapus</button>`;
  $("#detail").showModal();
}

/* ---------- Tambah / edit dokumen ---------- */
let editId = null;
function formDok(x, tahapAwal) {
  editId = x ? x.id : null;
  const dt = state.view === "detail";
  $("#fTitle").textContent = x ? "Edit dokumen" : "Tambah dokumen";
  $("#fLahan").innerHTML = LAHAN.map((l) => `<option value="${l.id}">${esc(l.kode)} - ${esc(l.nama)}</option>`).join("");
  $("#fTahap").innerHTML = TAHAPAN.map((t, i) => `<option value="${i}">${i + 1}. ${esc(t)}</option>`).join("");
  $("#fLahan").value = x ? x.lahanId : dt ? state.lahanId : (state.f.lahan || LAHAN[0].id);
  $("#fTahap").value = x ? x.tahap : tahapAwal !== undefined ? tahapAwal : dt ? state.tahap : (state.f.tahap || 0);
  $("#fJudul").value = x ? x.judul : "";
  $("#fNomor").value = x ? x.nomor : "";
  $("#fTanggal").value = x ? x.tanggal : hariIni();
  $("#fKet").value = x ? x.ket : "";
  $("#fFile").value = "";
  $("#fFileInfo").textContent = x && x.file ? `File saat ini: ${x.file.nama}. Pilih file baru untuk menggantinya.` : "";
  $("#fErr").hidden = true;
  $("#form").showModal();
}
$("#formDok").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = (m) => { $("#fErr").textContent = m; $("#fErr").hidden = false; };
  const judul = $("#fJudul").value.trim();
  if (!judul) return err("Judul dokumen wajib diisi.");
  const lama = editId && DOK.find((z) => z.id === editId);
  let file = lama ? lama.file : null, tipe = lama ? lama.tipe : "—";
  const f = $("#fFile").files[0];
  if (f) {
    const ext = f.name.split(".").pop().toUpperCase().replace("JPEG", "JPG");
    if (!TIPE.includes(ext)) return err("Format file harus PDF, DOCX, XLSX, JPG, atau PNG.");
    if (f.size > 2 * 1024 * 1024) return err("Ukuran file maksimal 2 MB (batas penyimpanan browser).");
    const data = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
    file = { nama: f.name, ukuran: f.size, data }; tipe = ext;
  }
  const d = { id: editId || Date.now(), lahanId: +$("#fLahan").value, tahap: +$("#fTahap").value, judul,
    nomor: $("#fNomor").value.trim(), tanggal: $("#fTanggal").value, ket: $("#fKet").value.trim(), tipe, file };
  const cadangan = DOK;
  DOK = editId ? DOK.map((z) => (z.id === editId ? d : z)) : [...DOK, d];
  if (!simpan()) { DOK = cadangan; return err("Penyimpanan browser penuh. Gunakan file yang lebih kecil atau hapus dokumen lain."); }
  $("#form").close();
  tampil(state.view);
});
$("#fBatal").addEventListener("click", () => $("#form").close());

/* ---------- Hapus dokumen ---------- */
function hapus(x) {
  if (!confirm(`Hapus dokumen "${x.judul}"? Tindakan ini tidak dapat dibatalkan.`)) return;
  DOK = DOK.filter((z) => z.id !== x.id);
  simpan();
  $("#detail").close();
  tampil(state.view);
}

/* ---------- Event global ---------- */
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-a],[data-lahan],[data-tahap],[data-back],[data-nav]");
  if (!t) return;
  const D = t.dataset, x = D.id && DOK.find((z) => String(z.id) === D.id);
  if (t.closest("#detail") && (D.a === "lihat" || D.a === "edit")) $("#detail").close();
  if (D.nav) tampil(D.nav);
  else if (D.lahan) tampil("detail", { lahanId: +D.lahan, tahap: 0 });
  else if (D.tahap !== undefined) tampil("detail", { tahap: +D.tahap });
  else if (t.hasAttribute("data-back")) tampil("arsip");
  else if (D.a === "tambah") formDok(null, D.t === undefined ? undefined : +D.t);
  else if (D.a === "reset") { state.f = { ...F0 }; tampil("dokumen"); }
  else if (D.a === "csv") unduhCsv();
  else if (D.a === "cetak") window.print();
  else if (x && D.a === "detail") detail(x);
  else if (x && D.a === "lihat") preview(x);
  else if (x && D.a === "unduh") unduh(x);
  else if (x && D.a === "edit") formDok(x);
  else if (x && D.a === "hapus") hapus(x);
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.f !== undefined) state.f[t.dataset.f] = t.value;
  else if (t.dataset.s !== undefined) state[t.dataset.s] = t.value;
  else return;
  $("#hasil").innerHTML = state.view === "arsip" ? barisLahan() : daftarDokumen();
});
$("#pvClose").addEventListener("click", () => $("#preview").close());
$("#dtClose").addEventListener("click", () => $("#detail").close());

/* ---------- Mulai ---------- */
if (sessionStorage.getItem("login")) masuk();