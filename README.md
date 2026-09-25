# MOVIE MAFIA 🎬

A high-animation React + Vite movie discovery UI.

## Features
- Language selector: Tamil, Telugu, Hindi, Malayalam, Kannada, English, Korean, Japanese, Chinese, Spanish, French, Other
- Genre selector
- Search
- Animated hero section
- Movie poster grid
- Watchlist interactions
- Quick-view modal
- Responsive mobile UI
- Optional TMDB API integration

## Run
```bash
npm install
npm run dev
```
Open the localhost URL printed by Vite.

## Optional real movie data
1. Create a TMDB account and request an API key / Read Access Token.
2. Open `src/main.jsx`.
3. Replace:
   `const TMDB_KEY = "";`
   with your TMDB v3 API Read Access Token.
4. The app will then use TMDB's discover endpoint for filtered movie data.

Do not commit your API token to a public repository. For production, put it behind a backend/serverless function.

## Notes
The demo poster URLs are illustrative. With TMDB enabled, posters come from TMDB. TMDB provides movie metadata and image paths through its API.

## TMDB setup for language + genre filters

Create a `.env` file in the project root:

```env
VITE_TMDB_TOKEN=YOUR_TMDB_API_READ_ACCESS_TOKEN
```

Then restart Vite:

```bash
npm run dev
```

The app now converts TMDB language codes (`ta`, `te`, `hi`, etc.) back to the UI language names and converts TMDB `genre_ids` to the selected genre names. Search also uses the TMDB movie search endpoint.
