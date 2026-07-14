# DxFlow

Structured clinical learning for medical students and junior clinicians — guided workups, case-based teaching, OSCE practice, image review, and common scoring tools.

## Features

- **Clinical reasoning** — Structured workflow from demographics and complaints through history, examination, differentials, and review
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
3. Add environment variable: `GROQ_API_KEY` = your key (Production + Preview)
4. Redeploy after adding the variable
5. Verify at `/api/health` — should return `{ "groqConfigured": true }`

## Disclaimer

**For educational use only.** Not a substitute for clinical judgement, senior review, or local protocols. Do not use DxFlow as the basis for patient-care decisions.

## Tech stack

- Next.js 16 · React 19 · Tailwind CSS 4
- Framer Motion · next-themes · Groq SDK
