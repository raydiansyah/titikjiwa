# Here are your Instructions

## CI/CD (GitHub Actions)

Dua workflow di `.github/workflows/`:

- **CI (`ci.yml`)** — jalan di setiap pull request dan push ke `main`:
  1. Validasi judul PR mengikuti conventional commits (`feat:`, `fix:`, `chore:`, dll.) via `amannn/action-semantic-pull-request`
  2. Tes backend: MongoDB service container + uvicorn + `pytest backend/tests` (8 skenario API)
  3. Build frontend: `yarn install --frozen-lockfile && yarn build`
- **Release (`release.yml`)** — jalan saat push ke `main`: semantic-release membaca conventional commits, menaikkan versi di `frontend/package.json`, menulis `CHANGELOG.md`, membuat tag `vX.Y.Z` dan GitHub Release otomatis. Konfigurasi di `.releaserc.json`.

Aturan versi: `fix:` → patch, `feat:` → minor, `BREAKING CHANGE:` di footer commit → major. Commit tanpa tipe konvensional tidak memicu rilis.

Untuk mengaktifkan: hubungkan remote GitHub (`git remote add origin <url>`), push branch `main`, lalu di repo GitHub aktifkan branch protection untuk `main` agar PR wajib lolos CI. Tidak perlu secret tambahan — `GITHUB_TOKEN` bawaan Actions sudah cukup.

