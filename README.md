# VoltSync — Power Plant Equipment Tracking System

VoltSync is a production-ready, highly optimized, and offline-first asset tracking application designed for industrial power plant environments.

## Repository Structure

```
scan/ (Root)
├── backend/          # Node.js + Express + SQLite / PostgreSQL API
├── frontend/         # React (Vite) + Tailwind CSS Admin Dashboard (Netlify)
├── mobile/           # React Native (Expo) Offline-First Mobile App
├── package.json      # Orchestrator configuration
└── README.md         # Master documentation
```

---

## ☁️ Cloud Deployment Guide (Roman Urdu)

Aap poore system ko cloud par **100% Free** host kar sakte hain. Niche diye gaye steps follow karein:

### Step 1: GitHub par Code Push Karein
Apne computer ke terminal se poora code apni GitHub repository par push karein:
```bash
git add .
git commit -m "Setup complete"
git branch -M main
git remote add origin https://github.com/muzzamil-nazir-jutt/database.git
git push -u origin main
```

### Step 2: Supabase (Free Database) Setup
1. [Supabase.com](https://supabase.com) par jayein aur free account banayein.
2. Naya Project create karein (koi bhi password set kar lein).
3. Project banne ke baad, **Project Settings -> Database** mein jayein.
4. Wahan **Connection String -> URI** (ya Transaction Connection string) copy kar lein. Yeh kuch is tarah dikhe gi:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:6543/postgres`

### Step 3: Backend ko Render.com par Host Karein
1. [Render.com](https://render.com) par jayein aur GitHub ke zariye login karein.
2. **New + -> Web Service** par click karein.
3. Apni GitHub repository (`database`) ko connect karein.
4. Settings mein yeh values enter karein:
   * **Name:** `voltsync-api`
   * **Root Directory:** `backend`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
   * **Instance Type:** `Free`
5. **Environment Variables** (Env) ke section mein jayein aur yeh key-value add karein:
   * **Key:** `DATABASE_URL`
   * **Value:** *(Jo Supabase ka database link aap ne Step 2.4 mein copy kiya tha, wo yahan paste kar dein)*
6. **Create Web Service** par click kar dein. Render aap ko ek online link dega (jaise: `https://voltsync-api.onrender.com`).

### Step 4: Frontend ko Netlify par Host Karein
1. [Netlify.com](https://netlify.com) par jayein aur GitHub ke zariye sign up karein.
2. **Add new site -> Import from Git** par click karein.
3. Apni GitHub repository (`database`) ko select karein.
4. Settings mein yeh values set karein:
5. **Base directory:** `frontend`
6. **Build command:** `npm run build`
7. **Publish directory:** `frontend/dist`
8. **Deploy Site** par click kar dein. Netlify aap ke dashboard ko online live kar dega!

---

## Quick Start Guide (Local Development)

### 1. One-Click Dependency Installation
From the root directory:
```bash
npm run install-all
```

### 2. Run Admin Panel & Backend API Locally (Using SQLite)
```bash
npm run dev
```

### 3. Run Mobile App
```bash
npm run mobile
```
*Note: Scan the generated QR code in your terminal using the **Expo Go** app on your phone.*
