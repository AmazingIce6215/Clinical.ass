# Clincalass

Clinical reasoning companion for medical students — guided workup + case-based teaching.

## Features

- **Clinical Companion** — Fluid step wizard (not chat): demographics → complaints → AI-guided history/exam → differentials & management
- **Teaching Mode** — Amboss-style case vignettes with MCQs and explanations
- **System appearance** — Automatically matches your OS light/dark mode
- **Animations** — Framer Motion transitions with reduced-motion support
- **Groq AI** — Free tier API for clinical reasoning (with offline fallbacks)

## Quick start

```bash
npm install
cp .env.example .env.local
# Add your GROQ_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy free on Vercel

1. Push this repo to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Add environment variable: `GROQ_API_KEY` = your key
4. Deploy

## Disclaimer

**For educational use only.** Not a substitute for clinical judgment, senior review, or local protocols. Do not use as the sole basis for patient care.

## Tech stack

- Next.js 16 · React 19 · Tailwind CSS 4
- Framer Motion · next-themes · Groq SDK
