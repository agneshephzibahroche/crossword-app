# Letterbeat

Letterbeat is a mobile-friendly daily 5x5 crossword game built with Next.js. It includes a daily puzzle, a small recent archive, light and dark themes, local progress saving, streak tracking, and a polished newspaper-inspired interface.

## Local Development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Production Notes

- The app currently stores progress, stats, and theme in browser `localStorage`.
- Daily puzzles are generated deterministically from the date, so the same day resolves to the same puzzle.
- The recent archive only shows the last 3 puzzles.

## Deploying To Vercel

1. Push this project to GitHub.
2. Sign in to [Vercel](https://vercel.com/).
3. Click `Add New` -> `Project`.
4. Import the GitHub repository.
5. Keep the default Next.js build settings.
6. Click `Deploy`.

For this version, no extra environment variables are required unless you add backend services later.

## Pre-Launch Checklist

- Run `npm run lint`
- Run `npm run build`
- Test mobile layout
- Test dark and light mode
- Test solving, refresh persistence, and the recent archive

