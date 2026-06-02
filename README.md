# DxFlow

AI clinical reasoning assistant for medical students (Clinical, Classic, and Teaching modes).

## Recover your source code first

This folder must contain the full Next.js app (`package.json`, `src/`, etc.) before you push to GitHub.

If `Projects/dxflow` is empty or only has `scripts/`:

1. **Check Vercel → Project → Git**  
   If the project was ever linked to GitHub, clone that repository.

2. **Check another copy on your Mac**  
   Search for `case-wizard-view.tsx` or `dxflow` in Finder / Time Machine.

3. **Re-open the project in Cursor**  
   If you still have the full project in another window, use **File → Open Folder** and copy files into `~/Projects/dxflow`.

4. **Vercel does not store editable source** for download — only build output. You need the original project files locally.

## Push to GitHub (after source is restored)

### 1. Create a repo on GitHub

- Go to [https://github.com/new](https://github.com/new)
- Name: `dxflow` (or your choice)
- **Do not** add README, .gitignore, or license (we add them locally)
- Create repository

### 2. Initialize and push (terminal)

```bash
cd ~/Projects/dxflow

git init
git add .
git commit -m "Initial commit: DxFlow clinical reasoning app"

git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dxflow.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### 3. Connect Vercel to GitHub (recommended)

- Vercel dashboard → your **dxflow** project → **Settings → Git**
- Connect the new GitHub repository  
- Future deploys happen automatically on every push to `main`

### 4. Environment variables on Vercel

Set in Vercel → **Settings → Environment Variables**:

- `GROQ_API_KEY` — required for AI features

## Local development

```bash
npm install
cp .env.example .env.local   # if .env.example exists
# Add GROQ_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## License

Private / educational use — add a license if you plan to open-source.
