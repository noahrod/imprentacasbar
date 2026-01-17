# Imprenta CASBAR - Cloudflare Workers Setup

## Overview

Your website stays on **GitHub Pages** while using a **Cloudflare Worker** as a secure serverless proxy to:
- ✅ Hide your Mailgun API key
- ✅ Hide your reCAPTCHA secret key  
- ✅ Verify reCAPTCHA server-side
- ✅ Send emails via Mailgun

**Cost**: 100% FREE (Cloudflare Free tier includes 100,000 requests/day)

---

## Step 1: Create Cloudflare Account

1. Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Create a free account (no credit card required)
3. Verify your email

---

## Step 2: Deploy the Worker

### Option A: Using Cloudflare Dashboard (Easiest)

1. **Login to Cloudflare Dashboard**: [dash.cloudflare.com](https://dash.cloudflare.com)

2. **Navigate to Workers**:
   - Click "Workers & Pages" in the left sidebar
   - Click "Create Application"
   - Click "Create Worker"

3. **Name your Worker**:
   - Name: `imprenta-casbar-contact` (or any name you prefer)
   - Click "Deploy"

4. **Edit the Worker Code**:
   - Click "Edit Code" button
   - Delete all existing code
   - Copy and paste the entire content from [`cloudflare-worker/worker.js`](cloudflare-worker/worker.js)
   - Click "Save and Deploy"

5. **Copy the Worker URL**:
   - You'll see a URL like: `https://imprenta-casbar-contact.YOUR-SUBDOMAIN.workers.dev`
   - **Copy this URL** - you'll need it in Step 4

### Option B: Using Wrangler CLI (Advanced)

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Navigate to worker directory
cd cloudflare-worker

# Deploy the worker
wrangler deploy

# Note the deployed URL
```

---

## Step 3: Configure Environment Variables (Secrets)

After deploying, you need to add your API keys as **secrets**:

1. **Go to your Worker**: Workers & Pages → Select your worker

2. **Click "Settings" tab** → **Variables**

3. **Add the following secrets** (click "Add variable" → "Encrypt"):

   **MAILGUN_API_KEY**
   - Type: Secret (encrypted)
   - Get from: [Mailgun Dashboard](https://app.mailgun.com/) → API Keys
   - Format: `key-xxxxxxxxxxxxxxxxxxxxxxxxxx`

   **MAILGUN_DOMAIN**
   - Type: Secret (encrypted)
   - Your Mailgun domain (e.g., `mg.yourdomain.com`)
   - Or use Mailgun sandbox: `sandboxXXXXX.mailgun.org`
   - Get from: [Mailgun Dashboard](https://app.mailgun.com/) → Domains

   **RECIPIENT_EMAILS**
   - Type: Secret (encrypted)
   - Value: `example1@gmail.com,example2@gmail.com`
   - (Multiple emails separated by commas)

   **RECAPTCHA_SECRET_KEY**
   - Type: Secret (encrypted)
   - Get from: [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
   - Find your site with key 
   - Copy the **Secret Key** (NOT the Site Key)

4. **Click "Save and Deploy"** after adding all 4 secrets

---

## Step 4: Update Your Website

Update [`js/contact_me.js`](js/contact_me.js) with your Worker URL:

```javascript
// Line ~39 in contact_me.js
var workerURL = "YOUR_CLOUDFLARE_WORKER_URL_HERE";
```

Replace `YOUR_CLOUDFLARE_WORKER_URL_HERE` with your actual Worker URL from Step 2, example:

```javascript
var workerURL = "https://WORKER-NAME.YOUR-SUBDOMAIN.workers.dev";
```

**Save the file** and commit your changes.

---

## Step 5: Update reCAPTCHA Domains

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Find your site 
3. Under **Domains**, make sure you have:
   - Your GitHub Pages domain (e.g., `username.github.io`)
   - Any custom domain if you're using one
4. Click **Save**

---

## Step 6: Deploy to GitHub Pages

Your site is ready! Just push to GitHub:

```bash
git add .
git commit -m "Migrate contact form to Cloudflare Workers"
git push origin main
```

GitHub Pages will automatically deploy your updated site.

---

## Step 7: Test the Contact Form

1. Visit your GitHub Pages site
2. Go to the contact form
3. Fill in all fields
4. Complete the reCAPTCHA checkbox
5. Click "Enviar"
6. You should receive an email at both addresses!

---

## Troubleshooting

### Form doesn't submit / No email received

**Check 1: Worker URL**
- Verify you updated `contact_me.js` with the correct Worker URL
- URL should look like: `https://WORKER-NAME.YOUR-SUBDOMAIN.workers.dev`

**Check 2: Worker Logs**
- Go to Cloudflare Dashboard → Your Worker → "Logs" tab
- Click "Begin log stream"
- Submit the form and watch for errors

**Check 3: Environment Variables**
- Go to Worker → Settings → Variables
- Ensure all 4 secrets are set correctly
- Variable names must be EXACTLY:
  - `MAILGUN_API_KEY`
  - `MAILGUN_DOMAIN`
  - `RECIPIENT_EMAILS`
  - `RECAPTCHA_SECRET_KEY`

**Check 4: Mailgun Configuration**
- Verify domain is verified in Mailgun
- Sandbox domains only send to authorized recipients
- Add both email addresses in Mailgun → Sending → Authorized Recipients

**Check 5: reCAPTCHA**
- Verify your GitHub Pages domain is in allowed domains list
- Check the Secret Key is correct

**Check 6: Browser Console**
- Open browser DevTools (F12) → Console tab
- Look for JavaScript errors
- Check Network tab for failed requests

### CORS Errors

If you see CORS errors in the browser console:
- The Worker already includes CORS headers
- Make sure you deployed the complete `worker.js` code
- Check that your Worker URL is correct in `contact_me.js`

### "Worker not found" Error

- Your Worker URL might be incorrect
- Double-check the URL in Cloudflare Dashboard
- Make sure there are no typos in `contact_me.js`

---

## File Structure

```
imprentacasbar/
├── cloudflare-worker/
│   ├── worker.js          # Cloudflare Worker code (deploy this)
│   └── wrangler.toml      # Configuration file (optional, for CLI)
├── js/
│   └── contact_me.js      # Updated to call Cloudflare Worker
├── index.html             # Contact form (no changes needed)
└── CLOUDFLARE_SETUP.md    # This file
```

---

## What Changed?

### Files Created:
- [`cloudflare-worker/worker.js`](cloudflare-worker/worker.js) - The serverless function
- [`cloudflare-worker/wrangler.toml`](cloudflare-worker/wrangler.toml) - Configuration (optional)
- `CLOUDFLARE_SETUP.md` - This setup guide

### Files Modified:
- [`js/contact_me.js`](js/contact_me.js) - Updated to call Cloudflare Worker URL

### Files Removed:
- Netlify-specific files (no longer needed)

---

## Security

✅ **What's Secure**:
- API keys are stored as encrypted secrets in Cloudflare
- Keys are NEVER visible in your GitHub repo
- Keys are NEVER visible in browser/client code
- reCAPTCHA verified server-side (can't be bypassed)
- Worker runs on Cloudflare's edge network (fast & secure)

❌ **What's NOT in your repo**:
- Mailgun API key
- reCAPTCHA secret key
- Any sensitive credentials

---

## Costs

- **Cloudflare Workers**: FREE (100,000 requests/day)
- **GitHub Pages**: FREE
- **Mailgun**: FREE tier (5,000 emails/month for 3 months)
- **Google reCAPTCHA**: FREE

**Total monthly cost**: $0

---

## Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Mailgun API Documentation](https://documentation.mailgun.com/)
- [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
- [GitHub Pages Docs](https://docs.github.com/en/pages)

---

## Need Help?

If you encounter issues:

1. Check the Troubleshooting section above
2. Review Cloudflare Worker logs
3. Verify all environment variables are set correctly
4. Test the Worker directly using a tool like Postman
5. Check browser console for JavaScript errors

Your site will stay on GitHub Pages with no changes needed to your hosting setup!
