# Refuel — fuel expense & mileage tracker (prototype v5.1)

## Run locally
1. Install Node.js 18+ from https://nodejs.org
2. In this folder:
   npm install
   npm run dev
3. Open the URL it prints (usually http://localhost:5173)

Tip: open browser dev tools and toggle the mobile viewport (~390px wide)
to see it as a phone app. `npm run dev -- --host` prints a network URL
you can open on your phone over the same Wi-Fi.

## Data persistence
Vehicles and fill-ups are saved to your browser's localStorage under the
key `refuel-data-v1`, so they survive refreshes and restarts.

- Data is per-browser, per-device (Chrome and Firefox each have their own).
- To reset to the demo data: open dev tools console and run
  localStorage.removeItem('refuel-data-v1')
  then refresh.
