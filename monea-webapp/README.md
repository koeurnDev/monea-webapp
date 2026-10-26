# MONEA - មនោសញ្ចេតនានៃក្តីស្រឡាញ់

MONEA is a premium, cinematic digital wedding invitation platform designed to provide couples with a high-end, immersive way to invite their guests and manage their special day.

## ✨ Key Features

- **Cinematic Experience**: High-end entrance animations with music synchronization and smooth parallax transitions.
- **Visual Editor**: Real-time design wizard with image panning, scaling, and instant preview.
- **Smart Color Extraction**: Automatically adapts invitation themes based on the primary colors of the couple's hero image.
- **Multi-step RSVP**: Integrated guest response system with real-time dashboard notifications.
- **QR & Payments**: Seamless integration for gift scanning (KHQR) and location mapping.
- **Production Grade**: Includes typed frontend code, API-backed data, Cloudinary media, and Sentry monitoring.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, React Router, Tailwind CSS, and Framer Motion.
- **Frontend hosting**: Cloudflare Pages.
- **API**: Hono on Cloudflare Workers (maintained in the sibling `monea-api-worker` project).
- **Database**: PostgreSQL on Neon; Prisma is used by the application.
- **Media**: Cloudflare R2, with Cloudinary retained for legacy assets.
- **Monitoring**: Sentry.

## Getting Started

1. **Environment Setup**:
   Copy `.env.example` to `.env` and fill in your Cloudinary and Database credentials.

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

   Apply database migrations only in the intended environment and follow the database deployment process; do not use `prisma db push` as an automatic setup step against a shared or production database.

4. **Launch the frontend**:
   ```bash
   npm run dev
   ```

## R2 Direct Media Uploads

Media uploads use short-lived signed R2 URLs when configured; otherwise the API keeps using its authenticated streaming upload route. To enable direct browser-to-R2 uploads in production:

1. Set the Worker variables `R2_ACCOUNT_ID` and `R2_BUCKET_NAME` (the production bucket is `monea-media`).
2. Add Worker secrets `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` using Cloudflare R2 S3 credentials scoped to the `monea-media` bucket. Never commit these values or add them to frontend environment variables.
3. Configure the `monea-media` bucket CORS policy to allow origin `https://moneoez.com`, method `PUT`, and header `Content-Type`.

Signed upload URLs expire after five minutes and are scoped to one authenticated user's authorized folder and the requested media type. Large or oversized JPEG, PNG, WebP, and AVIF images may be resized to a maximum dimension of 1600 pixels and converted to WebP before upload; audio and video files are uploaded unchanged. Keep the existing Worker upload route enabled as the fallback.

To enable on-demand image derivatives without storing duplicate files:

1. In Cloudflare, open **Images > Transformations**, enable transformations for the `moneoez.com` zone, and add `media.moneoez.com` as an allowed source origin.
2. The web app requests a small set of responsive widths through `moneoez.com/cdn-cgi/image/`; Cloudflare transforms and edge-caches those variants while the original stays in R2.
3. Verify transformed image requests on `https://moneoez.com` before considering the feature active. The image component falls back to the original R2 URL if a transformation fails.

Transformations use `format=auto`, quality 78 for standard web display, and `scale-down` by default (`cover` for explicit fill crops). R2 responsive variants are normalized to 400, 800, 1200, or 1600 pixels to improve cache reuse. Cloudflare may bill unique transformation variants according to the account plan; the finite set keeps variant generation bounded.

## Template Development

To add an invitation design, follow the current [Template Creation Guide](./docs/TEMPLATE_CREATION_GUIDE.md). A template must be added to both the selection catalog and the lazy component registry; the guide also lists the editor, preview, and mobile checks.

## Architecture Overview

```
MONEA
├── monea-webapp
│   ├── React + Vite frontend (Cloudflare Pages)
│   ├── Invitation templates and design wizard
│   └── Prisma client
└── monea-api-worker
    └── Hono API (Cloudflare Workers)
        └── Neon PostgreSQL
```

---
*Created with ❤️ for MONEA Team.*
