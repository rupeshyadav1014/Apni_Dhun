# Apni Dhun

A clean corporate/study-focused music player inspired by the simplicity of single-purpose web players.

## Run
Open `index.html` in a browser or deploy the folder to GitHub Pages.

## Current demo
The UI includes four demo audio tracks so the player works immediately.

## Add a real free music API
The API adapter belongs in `script.js`, inside `searchDemo()`. Keep any private API key on a backend/serverless function rather than exposing it in browser JavaScript.

The UI already expects track objects shaped like:
{
  title: "Song name",
  artist: "Artist",
  url: "https://...",
  art: "https://...",
  duration: "3:20"
}

The project intentionally does not scrape Spotify or host copyrighted files.
