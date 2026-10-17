# FUT Draft (FUTBIN edition)

A FIFA / EA FC Ultimate Team–style **draft** in the browser, built on player data and card images scraped from [FUTBIN](https://www.futbin.com).

## How the draft works

1. Choose **1 of 5 formations**.
2. Choose **1 of 5 captains**.
3. Click each empty position on the pitch and choose **1 of 5 players** for it.
4. Fill **7 substitutes** (GK, CB, FB, MID, MID, WING, ATT) and **5 reserves** (any position), each from 5 options.
5. Click two players to swap them. The team rating and chemistry (0–33, FC-style club / nation / league thresholds, 0 chem when out of position) update live.
6. Press **Play draft** for a 4-match knockout. Your rating and chemistry decide your odds.

A player can only appear once in a squad, even if they have more than one card.

## Get the player database and images from FUTBIN

```bash
npm install
npm run scrape                       # first 10 list pages of players, images downloaded to data/img/
node scraper/scrape-futbin.mjs --pages 40            # more players
node scraper/scrape-futbin.mjs --browser             # use headless Chromium (Playwright) if plain requests get blocked
node scraper/scrape-futbin.mjs --html saved-pages/   # parse list pages you saved from your own browser
node scraper/scrape-futbin.mjs --query "version=gold_rare"   # pass FUTBIN list filters
```

This writes `data/players.json`, `data/players.js` and `data/img/<id>.png`.

## Artifact version

`artifact/fut-draft.html` is a single-file version of the game, published as a Claude artifact. It can't reach FUTBIN itself, so load your data into it:

```bash
node scraper/scrape-futbin.mjs --embed   # writes data/players-embedded.json with pictures packed in
```

Then use **Load FUTBIN data** on its start screen. Until then it runs on made-up demo players, which are clearly labelled.

## Play

Open `index.html` in a browser, or run `npm start` and go to http://localhost:5173.

If an image failed to download, the card falls back to FUTBIN's CDN URL, then to a silhouette.
