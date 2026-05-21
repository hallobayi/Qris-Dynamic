# QRIS Dynamic 🚀

Konversi QRIS statis menjadi QRIS dinamis dengan nominal pembayaran terkustomisasi. Dibangun ulang di atas **BHVR**: Bun + Hono + Vite + React, dideploy sebagai single container via Docker Compose.

> Versi Next.js sebelumnya tetap tersedia sebagai referensi di folder [`legacy/`](legacy/).

## ✨ Fitur

- Konversi QRIS statis → dinamis (logika CRC16 + tag 54) di server (Hono) untuk validasi terpusat.
- UI modern: Tailwind v4, shadcn/ui, dark/light mode, animasi floating shapes & gradient.
- QR code di-render di canvas dengan logo overlay (error correction level H).
- Download QR sebagai PNG dan copy string QRIS dinamis.

## 🛠️ Tech stack

- **[Bun](https://bun.sh)** — runtime + package manager + monorepo workspaces.
- **[Hono](https://hono.dev)** — API HTTP super ringan + static file serving.
- **[Vite](https://vitejs.dev)** — bundler/dev-server untuk client.
- **[React 19](https://react.dev)** + **[Tailwind CSS v4](https://tailwindcss.com)** + **[shadcn/ui](https://ui.shadcn.com)** + **[lucide-react](https://lucide.dev)**.
- **[Turborepo](https://turbo.build)** — orchestrate build/lint/dev di tiga workspace.

## 📂 Struktur

```
.
├── client/        # Vite + React UI (port 5173 saat dev)
├── server/        # Hono API + static client (port 3000)
├── shared/        # Type-safe shared logic (QRIS utils + API types)
├── legacy/        # Snapshot Next.js sebelum migrasi (read-only)
├── Dockerfile
├── docker-compose.yml
└── package.json   # workspaces + turbo scripts
```

## 🚀 Development

### Prasyarat

- [Bun](https://bun.sh) ≥ 1.2

### Install & jalankan

```bash
bun install        # menginstall semua workspace + build shared/server
bun run dev        # menjalankan client (5173) dan server (3000) secara paralel
```

Atau jalankan terpisah:

```bash
bun run dev:client   # http://localhost:5173 (Vite, dengan proxy /api → :3000)
bun run dev:server   # http://localhost:3000 (Hono, hot-reload via --watch)
```

### Build production lokal

```bash
bun run build      # build shared + server (tsc) + client (vite build)
bun run start      # menjalankan server prod, melayani API dan client/dist
```

## 🔌 API

### `POST /api/qris/dynamic`

Mengkonversi QRIS statis menjadi dinamis.

**Request**
```json
{
  "qris": "00020101021126670016COM.NOBUBANK.WWW...6304F6C8",
  "amount": 50000
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "qris": "00020101021226670016COM.NOBUBANK.WWW...54050000050802ID...<crc>",
    "amount": 50000
  }
}
```

**Response 4xx**
```json
{ "success": false, "error": "amount must be a positive number" }
```

### `GET /healthz`

Healthcheck untuk Docker / orchestrator. Mengembalikan `{ "ok": true }`.

## 🐳 Deploy ke VPS dengan Docker Compose

`Dockerfile` adalah multi-stage build: stage `builder` install deps & build semua workspace, stage `runner` hanya membawa `node_modules`, artefak build, dan static client. Server Hono menyajikan API dan static client dari port `3000`.

### 1. Sediakan file di VPS

Cara paling praktis adalah clone repo langsung di VPS:

```bash
git clone <repo-url> qris-dynamic
cd qris-dynamic
cp .env.example .env   # opsional, edit PORT bila perlu
```

### 2. Jalankan

```bash
docker compose up -d --build
```

Build akan memakan beberapa menit di run pertama (download base image `oven/bun:1.2-alpine` + install deps). Setelah container running, aplikasi tersedia di `http://<vps-ip>:${PORT:-3000}` dan healthcheck Docker akan ping `/healthz` setiap 30 detik.

### 3. Pasang di belakang reverse proxy

Container hanya mengekspos HTTP polos. Untuk TLS, taruh di belakang Nginx/Caddy/Traefik. Contoh blok Caddyfile:

```caddy
qris.example.com {
  reverse_proxy localhost:3000
}
```

### Operasional

```bash
docker compose logs -f                 # tail log
docker compose restart qris-dynamic    # restart
docker compose pull && docker compose up -d --build  # update setelah git pull
docker compose down                    # stop & remove container
```

### Catatan platform

Image dibangun dengan base `oven/bun:1.2-alpine` di Linux/amd64. Jika VPS Anda ARM, Docker akan otomatis pull varian yang sesuai. `bun install` di builder stage dijalankan tanpa `--frozen-lockfile` karena `bun.lock` dihasilkan di Windows; jika Anda men-commit lockfile dari Linux, tambahkan `--frozen-lockfile` di `Dockerfile` untuk build reproducible.

## 🔧 Environment variables

| Variabel            | Default                  | Keterangan                                                                |
|---------------------|--------------------------|---------------------------------------------------------------------------|
| `PORT`              | `3000`                   | Port HTTP yang didengarkan oleh server Hono.                              |
| `CLIENT_DIST_DIR`   | `./public` (di image)    | Lokasi static client (`client/dist`) yang di-mount oleh server.           |
| `VITE_SERVER_URL`   | _(kosong)_               | Build-time only. Set jika client dideploy terpisah dari server.           |

## 📁 Folder legacy

[`legacy/`](legacy/) menyimpan project Next.js asli (App Router, Heroku/Vercel-ready). Tidak digunakan oleh build BHVR dan aman untuk dihapus jika tidak lagi diperlukan.

## 📝 Lisensi

MIT — lihat [LICENSE](LICENSE).

## 🙏 Acknowledgments

- Project asli: [@AmmarrBN/Qris-Dynamic](https://github.com/AmmarrBN/Qris-Dynamic).
- Template stack: [bhvr.dev](https://bhvr.dev) oleh Steve Simkins.
