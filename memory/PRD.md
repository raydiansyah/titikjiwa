# PRD — Sintesis: Sanctuaries of Healing & Growth

## Problem Statement (asli)
Aplikasi untuk membantu pengguna memproses dan menyembuhkan trauma: jurnal pribadi, berbagi pengalaman anonim, tips dari penyintas & psikolog gratis. Tech stack TanStack, mobile responsive, UI tanpa gradient/violet/AI slop, ikon modern, animasi scroll halus, hero interaktif dengan CTA kuat (kenapa aplikasi ini, untuk siapa, CTA engagement).

## User Personas
- Penyintas: ingin menulis jurnal privat & membaca cerita serupa secara anonim
- Pendamping: ingin berbagi pengalaman dan memberi dukungan
- Pencari bantuan: ingin panduan psikolog terverifikasi & booking konsultasi
- Admin/Psikolog: menerbitkan artikel terverifikasi

## Arsitektur
- Frontend: React + TanStack Router + TanStack Query + Tailwind + framer-motion
- Backend: FastAPI (prefix /api), MongoDB (motor), JWT httpOnly cookies (access 15 mnt + refresh 7 hari)
- Auth: bcrypt, brute-force lockout (5x → 15 mnt), forgot/reset password via token

## Implemented
- 2026-07 (sesi 1): Setup full-stack, desain Organic & Earthy, jurnal privat CRUD, komunitas anonim (support, komentar, report, sensitive warning), artikel, direktori psikolog + booking konsultasi, landing page interaktif dengan breathing ritual
- 2026-08-14 (sesi 2): Standardisasi auth Email & Password sesuai playbook — refresh token httpOnly, endpoint /auth/refresh, /auth/forgot-password, /auth/reset-password, brute-force protection (x-forwarded-for aware), index MongoDB, frontend murni cookie-based (tanpa localStorage)
- 2026-08-14 (sesi 3): Pencarian komunitas fungsional (filter judul/isi/topik + status kosong), animasi gulir whileInView di semua section landing, dasbor moderasi admin (tinjau laporan, hapus cerita, abaikan laporan, terbitkan artikel; endpoint /api/admin/* dengan guard role admin)
- 2026-08-14 (sesi 4): Grafik rekap suasana hati mingguan di ruang jurnal (stacked bar 4 minggu, murni CSS), filter kategori artikel di ruang Belajar, halaman lupa & atur-ulang kata sandi (/atur-ulang dengan token 1 jam)
- 2026-08-14 (sesi 5): Integrasi Resend untuk email reset sandi (kode siap, fallback ke log jika RESEND_API_KEY belum diisi), prompt jurnal harian bergilir (14 prompt, prefills judul), landing level Awwwards: lenis smooth scroll, hero kinetik masked line reveal + parallax, marquee editorial sage, nomor bab manifes outline 01/02/03, micro-interaction panah CTA
- 2026-08-14 (sesi 6): RESEND_API_KEY dipasang — email lupa sandi sungguhan terkirim (terverifikasi, email ID dari Resend), akun uji raydiansyah@gmail.com dibuat
- 2026-08-14 (sesi 7): Area dasbor berbasis role — member (ruang pulih), psikolog (dasbor praktik, kotak masuk konsultasi dengan konfirmasi/tolak, tulis artikel), admin (dasbor statistik anggota/cerita/laporan/artikel/konsultasi + moderasi). Backend: guard require_roles, GET /consultations, POST /consultations/{id}/status, GET /admin/stats, POST /articles untuk admin+psikolog. Seed akun psikolog maya@sintesis.id
- 2026-08-14 (sesi 8): Kelola psikolog dari dasbor admin (tambah akun+profil sekaligus, nonaktifkan/aktifkan — login terblokir & hilang dari direktori saat nonaktif). Profil psikolog: edit spesialisasi/jadwal/kota/bio, upload foto (base64 ≤500KB tampil di direktori), statistik pengguna didampingi/menunggu/artikel. Backend: /admin/psychologists CRUD+toggle, /psychologists/me/profile & /me/stats, flag disabled pada login & sesi
- 2026-08-14 (sesi 9): Wawancara pengenalan 3 pertanyaan pasca-daftar/masuk (route /wawancara, koleksi profiles, bisa dilewati). Teman AI "Sinta" dengan RAG (gpt-5.4 via EMERGENT_LLM_KEY, emergentintegrations LlmChat streaming): retrieval keyword-overlap dari posts+articles+ai_interactions, dipersonalisasi jawaban wawancara, riwayat tersimpan per user. Jurnal privat dikecualikan dari RAG demi janji privasi
- 2026-08-14 (sesi 10): Chat AI streaming SSE token-per-token (fetch + ReadableStream di frontend, kursor kedip, X-Accel-Buffering: no). Insight mingguan AI di ruang jurnal (rangkum pola mood+judul 7 hari, cache per minggu di weekly_insights). System prompt AI: teks polos tanpa markdown
- 2026-08-14 (sesi 11): Tiga gelembung saran topik di atas kolom chat (tampil saat riwayat kosong, klik langsung mengirim). Arsip insight: GET /ai/weekly-insights + linimasa pertumbuhan di ruang jurnal (minggu berjalan di atas, minggu lalu berderet dengan garis waktu)
- 2026-08-14 (sesi 12): Saran topik personal — GET /ai/suggestions menggenerate 3 kalimat pembuka dari jawaban wawancara via gpt-5.4, dicache di profiles.suggestions; fallback ke saran default jika belum isi wawancara
- 2026-08-14 (sesi 13): Audio chime Web Audio API saat balasan AI selesai & saat komentar terkirim (toggle suara di kolom chat). Linimasa publik: jenis dukungan saat posting (Butuh didengarkan/Butuh saran/Merayakan langkah kecil/Butuh kekuatan) tampil sebagai badge, reaksi tiga jenis (Pelukan/Kekuatan/Aku paham, POST /posts/{id}/react menggantikan support), komentar psikolog berlencana "Psikolog" + tautan "Ajukan konsultasi". Komentar menyimpan role & psychologist_id
- 2026-08-14 (sesi 14): Notifikasi respons — event tersimpan di koleksi notifications saat orang lain mereaksi/membalas cerita; titik merah di menu Linimasa + lonceng Notifikasi dengan panel (polling 30 dtk, buka panel = tandai terbaca). Filter linimasa per jenis dukungan (chip row, gabung dengan pencarian, counter ikut menyesuaikan). Fix: panel notifikasi terbuka ke bawah agar tak menutupi menu
- 2026-08-14 (sesi 15): Halaman publik /fitur, /tutorial, /privasi, /syarat (komponen InfoPage bernomor bab + reveal). Profil Aura: GET /api/me/aura menghitung distribusi mood jurnal → nama puitis + 2-3 warna conic gradient yang berputar pelan; sapaan "terakhir ke sini X" dari prev_seen_at (login menyimpan last_seen); pengguna baru dapat aura "Embun Pagi"
- 2026-08-14 (sesi 16): Riwayat aura — snapshot otomatis per minggu ISO ke koleksi aura_history saat /me/aura dipanggil, linimasa titik aura di ruang jurnal (GET /me/aura/history). Bagikan aura — kartu PNG 1080x1350 digambar via canvas 2D (radial gradient berlapis per warna, nama aura, alias, tanggal) dan terunduh sebagai aura-sintesis-{week}.png
- 2026-08-14 (sesi 17): Titik aura (conic-gradient) menggantikan avatar polos di sidebar dengan tooltip nama aura. Fitur SOS darurat — tombol melayang berdenyut di semua halaman (publik + workspace), modal berisi panggilan cepat tel:112/110/119 dan direktori layanan: SAPA 129 (KemenPPPA), 1500-771 (Kemensos), 1500-567 (Halo Kemenkes), 1500-454 (konsultasi jiwa)
- 2026-08-14 (sesi 18): SOS otomatis — pola kata kunci krisis (CRISIS_PATTERN regex) di pesan Teman AI memicu event "sintesis:open-sos" yang membuka panel SOS proaktif (tanpa false positive pada pesan biasa). Kontak darurat pribadi — POST/GET /api/emergency-contact (disimpan di profiles.emergency_contact), panel SOS menampilkan kartu panggil cepat atau formulir simpan nama+telepon

## Backlog
- P1: Verifikasi domain pengirim di Resend agar email bisa dikirim ke alamat mana pun
- P2: Hapus/sunting jurnal lama
- P2: Email konfirmasi konsultasi (Resend — pakai fungsi yang sama)
- P2: Deteksi krisis juga di balasan AI (dual-side) dan eskalasi ke admin untuk kasus berat
