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
- 2026-08-14 (sesi 4): Grafik rekap suasana hati mingguan di ruang jurnal (stacked bar 4 minggu, murni CSS), filter kategori artikel di ruang Belajar, halaman lupa & atur-ulang kata sandi (/atur-ulang dengan token 1 jam; pengiriman tautan masih via log server — belum email)

## Backlog
- P1: Kirim tautan reset sandi & konfirmasi konsultasi via email (Resend)
- P2: Hapus/sunting jurnal lama
- P2: Statistik dukungan komunitas untuk admin
