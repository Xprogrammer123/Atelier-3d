# Atelier

AR furniture ecommerce platform. Sellers upload four photos per item; a Blender pipeline generates a GLB model. Buyers browse listings and place furniture in their room via in-browser AR (`model-viewer` — WebXR, Scene Viewer, AR Quick Look).

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **3D / AR:** Google `model-viewer` (`ar-modes="webxr scene-viewer quick-look"`)
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **3D generation:** Blender headless Python (`scripts/blender/generate.py`)
- **QR codes:** `qrcode` npm package
- **Deploy:** Vercel (HTTPS required for WebXR)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/001_initial.sql` in the SQL editor.
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

### 4. Background worker (3D jobs)

Blender must be installed (`blender` on PATH, or set `BLENDER_PATH`).

```bash
npm run worker
```

The API also queues jobs on listing creation; the worker polls `processing_jobs` with status `queued`.

### 5. Production

Deploy to Vercel with the same env vars. Run the worker on a separate host (Blender does not run on Vercel serverless).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Catalogue with filters |
| `/product/[id]` | Product detail, 3D preview, QR, contact seller |
| `/ar/[id]` | Direct AR entry (QR / share links) |
| `/auth/login`, `/auth/register` | Seller auth |
| `/dashboard` | Seller listings, QR download, analytics |
| `/dashboard/create` | Create listing (4 photos) |
| `/dashboard/listing/[id]/status` | 3D processing status |

## Seller flow

1. Register → Dashboard → Create listing
2. Upload front, back, left, right photos
3. Job queued → Blender generates GLB → listing goes **live**
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

Prototype — model assets from Khronos glTF Sample Assets where applicable (see original catalog attribution).
