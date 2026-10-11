# SpendWise — Responsive Personal Finance Simulator

SpendWise is a responsive React + Vite demo for planning a ₹10,000 budget over 30 days. It is designed for desktop, tablet, and mobile screens.

## Features
- Finance overview: balance, safe-to-spend amount, daily allowance, budget progress, and forecast
- Income and expense transaction tracking
- Spending category and trend charts
- Savings goals and progress tracking
- Subscription management and upcoming commitments
- What-if Decision Lab to preview the impact of spending choices
- Risk and financial-health indicators
- Local storage persistence in the browser
- Export demo data and reset the demo
- Responsive navigation drawer, adaptive cards/grids, small-screen forms, and accessible keyboard focus states

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

The production-ready site is generated in `dist/`. For Netlify, use build command `npm run build` and publish directory `dist`.

## Notes
This is a frontend demo and does not connect to a real bank or server. Transactions, goals, and subscriptions are stored in the current browser using `localStorage`; clearing browser storage resets that saved demo data.
