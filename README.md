# Atelier

AR furniture marketplace. Sellers scan pieces in-browser; DG-Mesh reconstructs a 3D model on a GPU worker. Buyers browse listings and place furniture in their room via in-browser AR (`model-viewer` — WebXR, Scene Viewer, AR Quick Look).

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **3D / AR:** Google `model-viewer` (`ar-modes="webxr scene-viewer quick-look"`)
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **3D reconstruction:** DG-Mesh (`DG-Mesh/`) + ffmpeg frame extraction
- **QR codes:** `qrcode` npm package
- **Deploy:** Vercel (HTTPS required for WebXR)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run migrations in order: `001_initial.sql`, `002_google_profiles.sql`, `003_scan_pipeline.sql`.
3. Run `supabase/storage.sql` (creates public `listings` bucket + policies).
4. Enable **Realtime** for table `processing_jobs` (Database → Replication).
5. Copy project URL and keys to `.env.local` (see `.env.example`).

### 2. Environment

```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_APP_URL
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Mesh worker (scan → 3D jobs)

Requires **ffmpeg**, a **GPU machine** with DG-Mesh installed, and env vars from `.env.example`.

```bash
npm run worker
```

The worker polls `processing_jobs` with `job_type = scan` and runs `scripts/mesh/process_scan_job.py`.

For local testing without DG-Mesh, set `MESH_DEV_GLB` to an existing `.glb` file path.

### 5. Production

Deploy the Next.js app to Vercel with the same env vars. Run `npm run worker` on a separate GPU host (DG-Mesh does not run on Vercel serverless).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing + catalogue preview |
| `/catalogue` | Live listings with filters |
| `/product/[id]` | Product detail, 3D preview, QR, contact seller |
| `/ar/[id]` | Direct AR entry (QR / share links) |
| `/auth/login`, `/auth/register` | Seller auth |
| `/dashboard` | Seller listings, QR download, analytics |
| `/dashboard/create` | Scan + front photo → 3D listing |
| `/dashboard/listing/[id]/status` | Mesh reconstruction status |

## Seller flow

1. Register → Dashboard → Create listing
2. Record a walk-around scan + add front catalogue photo
3. Mesh worker reconstructs 3D → listing goes **live**
4. Share `/ar/{id}` or download QR from dashboard

## Buyer flow

1. Browse catalogue or scan QR
2. View 3D preview on product page
3. **Try in Your Room** → `model-viewer` AR (platform-specific handoff)
4. Contact seller (no in-app checkout in v1)

## AR notes

- **Android + ARCore:** WebXR in-browser
- **Android without ARCore:** Scene Viewer (automatic fallback)
- **iOS Safari:** AR Quick Look
- **Desktop:** Orbit 3D preview only
- HTTPS required for WebXR (use Vercel or `ngrok` / `cloudflared` for device testing)

## License

Prototype — demo model assets from Khronos glTF Sample Assets where applicable.
