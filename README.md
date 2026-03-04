# ✨ Welcome to Your Spark Template!
You've just launched your brand-new Spark Template Codespace — everything’s fired up and ready for you to explore, build, and create with Spark!

This template is your blank canvas. It comes with a minimal setup to help you get started quickly with Spark development.

🚀 What's Inside?
- A clean, minimal Spark environment
- Pre-configured for local development
- Ready to scale with your ideas
  
🧠 What Can You Do?

Right now, this is just a starting point — the perfect place to begin building and testing your Spark applications.

🧹 Just Exploring?
No problem! If you were just checking things out and don’t need to keep this code:

- Simply delete your Spark.
- Everything will be cleaned up — no traces left behind.

📄 License For Spark Template Resources 

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

## 🎸 Ultimate Guitar Chord Provider (local/educational use only)

The app ships with an optional **Ultimate Guitar** chord provider that surfaces chord data in the Discover page. It is **disabled by default** so the production build stays clean.

### Setup

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Set `VITE_ENABLE_ULTIMATE_PROVIDER=true` in `.env.local`.

3. Start a local scraper that exposes `GET /tab?url=<encoded-ug-url>`.  
   Two options:
   - [joncardasis/ultimate-api](https://github.com/joncardasis/ultimate-api)
   - [Pilfer/ultimate-guitar-scraper](https://github.com/Pilfer/ultimate-guitar-scraper)

   By default the provider expects the scraper at `http://localhost:3001`.  
   Override with `VITE_UG_SCRAPER_URL=http://localhost:<port>`.

4. Run the dev server: `npm run dev`

In the **Discover** page you will see an _Ultimate Guitar (local)_ option in the provider dropdown. Use `Details` on any result to fetch chords via the local scraper.

> **Note:** This feature is for educational/local experimentation only. Do not deploy with `VITE_ENABLE_ULTIMATE_PROVIDER=true`.
