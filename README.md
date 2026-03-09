# 🏥 OptumRx – Team Leou Website

A shared team website with a photo gallery, storyboard, announcements, and recognition wall — hosted FREE on Netlify.

---

## 🚀 Deploy to Netlify (Step-by-Step)

### Option A — Drag & Drop (Easiest, ~3 minutes)

> ⚠️ This method works for the **frontend only** (no backend persistence).  
> Use Option B for the full experience with shared data.

1. Go to [netlify.com](https://netlify.com) and sign up for a free account
2. From your dashboard, drag the **`public/`** folder onto the deploy area
3. Your site is live instantly!

---

### Option B — Full Deploy with Netlify Functions + Blobs (Recommended)

This gives you **shared data** across all team members — photos, stories, announcements, and recognition cards all stored in the cloud.

#### Step 1: Create a GitHub repository

1. Go to [github.com](https://github.com) → **New repository**
2. Name it `team-leou` → **Create repository**
3. Upload all the files from this zip (drag & drop into GitHub)

#### Step 2: Connect to Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**
2. Choose **GitHub** → Select your `team-leou` repo
3. Build settings will be auto-detected from `netlify.toml`:
   - **Publish directory:** `public`
   - **Functions directory:** `netlify/functions`
4. Click **Deploy site**

#### Step 3: Set the Admin Password

1. In Netlify dashboard → **Site configuration** → **Environment variables**
2. Click **Add a variable**:
   - **Key:** `ADMIN_PASSWORD`
   - **Value:** *(choose a strong password for your team)*
3. Click **Save** → then **Trigger deploy** to apply

#### Step 4: Enable Netlify Blobs (automatic)

Netlify Blobs is automatically enabled when you use `@netlify/blobs` in your functions. No extra setup needed — it's part of Netlify's free tier.

#### Step 5: Share with your team!

Copy your Netlify URL (e.g. `https://team-leou.netlify.app`) and share it with everyone!

---

## 🔐 Admin vs. Team Member Access

| Feature | Team Members | Admin |
|---|---|---|
| View photos | ✅ | ✅ |
| View stories | ✅ | ✅ |
| View announcements | ✅ | ✅ |
| View recognitions | ✅ | ✅ |
| Upload photos | ❌ | ✅ |
| Add stories | ❌ | ✅ |
| Post announcements | ❌ | ✅ |
| Give recognition | ❌ | ✅ |
| Delete any content | ❌ | ✅ |

**To log in as admin:** Click the **⚙ Admin** button in the top-right and enter your password.

---

## 📁 Project Structure

```
team-leou/
├── netlify.toml                  # Netlify configuration
├── package.json                  # Dependencies
├── public/
│   └── index.html                # The entire frontend
└── netlify/
    └── functions/
        ├── api.js                # Stories, announcements, recognitions API
        └── photos.js             # Photo upload & retrieval API
```

---

## 🆓 What's Free on Netlify

| Resource | Free Tier Limit |
|---|---|
| Bandwidth | 100 GB/month |
| Function invocations | 125,000/month |
| Blobs storage | 1 GB |
| Sites | Unlimited |
| Custom domain | Supported |

More than enough for a team website! 🎉

---

## 🛠 Local Development (Optional)

```bash
npm install
npx netlify dev
```

Then open http://localhost:8888

---

## ✏️ Customization Tips

- **Change the team name:** Search for "Team Leou" in `public/index.html` and replace
- **Change colors:** Edit the CSS variables at the top of `index.html`
- **Add a custom domain:** Netlify dashboard → Domain management → Add custom domain (free!)
