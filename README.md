# 🛡️ RESCUE AI — "Don't Buy. RESCUE."

> **INSPIRE Hackathon 2026** · *Primary Category: Sustainability & Climate · Secondary: AI, Logistics & Supply Chain, Business & Finance*

![RESCUE AI](https://img.shields.io/badge/RESCUE-AI%20Platform-00D9A5?style=for-the-badge)
![Next.js 16](https://img.shields.io/badge/Next.js-16%20App%20Router-black?style=for-the-badge&logo=next.js)
![Gemini 2.0](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash-7C3AED?style=for-the-badge&logo=google)
![SQLite + Prisma](https://img.shields.io/badge/Database-Prisma%20ORM-2563EB?style=for-the-badge&logo=prisma)
![Netlify Ready](https://img.shields.io/badge/Deploy-Netlify-00C7B7?style=for-the-badge&logo=netlify)

---

## 🎯 Core Philosophy
> **"Don't buy what you already have. Don't waste what someone else needs."**

Organizations frequently purchase new resources while identical or compatible resources already sit idle inside another department. **RESCUE AI** is an intelligent resource discovery, matching, and lifecycle allocation platform that intercepts procurement requests, finds hidden assets in real-time, generates step-by-step rescue plans, and measures financial & carbon savings.

---

## ✨ Key Features

1. **🌐 Interactive 3D Visual Engines**:
   - **3D Resource Discovery Globe**: Spherical topology with orbiting rescue satellites on the landing hero.
   - **3D Topology Engine**: High-DPI canvas visualizing inter-departmental resource flows with inertial drag and auto-orbiting.
2. **🧠 Grounded Multi-Tier AI Suite**:
   - **Natural Language Requirement Extraction**: Parses messy unstructured human requests into categorized assets.
   - **AI Procurement Risk Analyzer**: Evaluates real-time inventory risk, purchase probability, and mitigation recommendations.
   - **AI Resource Auto-Fill & Catalog Descriptions**: Generates rich catalog specifications and descriptions in one click.
   - **AI Annual Impact Forecasting**: 12-month financial and carbon avoidance projections with department efficiency scoring.
   - **Grounded Real-Time AI Chat Assistant**: Conversational assistant grounded in live SQLite database numbers.
3. **➕ Interactive Resource Listing & Management**:
   - One-click asset listing with AI auto-fill.
   - Dual View Mode switcher: **Interactive 3D Grid View** vs. **High-Density Table / List View**.
   - Bulk CSV import and instant search/filtering.
4. **📊 Financial & ESG Impact Center**:
   - Real-time cost avoidance tracking in INR (₹).
   - CO₂ carbon offsets and physical e-waste divergence analytics.

---

## 🚀 One-Click Netlify Deployment Guide

### Prerequisites
1. A [GitHub](https://github.com) account
2. A [Netlify](https://www.netlify.com) account

### Step 1: Push to GitHub
```bash
# In your terminal inside the project directory:
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/Rescue-AI.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Netlify
1. Log in to **[Netlify](https://app.netlify.com)**.
2. Click **"Add new site"** $\rightarrow$ **"Import an existing project"** $\rightarrow$ **"GitHub"**.
3. Select your repository: **`Rescue-AI`**.
4. Netlify will auto-detect the configuration from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
6. Click **"Deploy site"**! 🎉

---

## 💻 Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Add GEMINI_API_KEY=your_key_here

# 3. Seed sample data (44+ resources across 7 departments)
npx tsx prisma/seed.ts

# 4. Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🏗️ Architecture & Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Styling**: Vanilla CSS (Tailored Design System, Dark Mode Glassmorphism, 3D Perspective Transforms)
- **Database & ORM**: SQLite (`prisma/dev.db`) + Prisma ORM with `@prisma/adapter-better-sqlite3`
- **AI Intelligence**: Google Generative AI SDK (`gemini-2.0-flash`)
- **Charts & Visuals**: Recharts + HTML5 High-DPI Canvas 3D Particle & Topology Engines
