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
- 2026-08-14 (sesi 5): Integrasi Resend untuk email reset sandi (kode siap, fallback ke log jika RESEND_API_KEY belum diisi — menunggu kunci dari user), prompt jurnal harian bergilir (14 prompt, prefills judul), landing level Awwwards: lenis smooth scroll, hero kinetik masked line reveal + parallax, marquee editorial sage, nomor bab manifes outline 01/02/03, micro-interaction panah CTA

## Backlog
- P0: Isi RESEND_API_KEY di backend/.env (user sedang buat di resend.com), lalu restart backend
- P2: Hapus/sunting jurnal lama
- P2: Email konfirmasi konsultasi (Resend — pakai fungsi yang sama)
- P2: Statistik dukungan komunitas untuk admin
