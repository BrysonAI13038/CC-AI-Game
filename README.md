# CC-AI-Game — Run & Debug

Quick steps to run and debug the game locally.

Run a local static server (choose one):

- Using Python (no install required on macOS if Python 3 is available):

```bash
python3 -m http.server 8000
```

- Using Live Server extension (VS Code): right-click `index.html` → "Open with Live Server".

Open the game in a browser:

http://localhost:8000/index.html

Debug from VS Code:

1. Start a local server (see above).
2. Open the Run and Debug view and choose **Launch Chrome against localhost**.
3. Set breakpoints in `game.js` or open the browser DevTools → Sources.

Notes:

- `game.js` contains the game code (it was extracted from `index.html`) so breakpoints in VS Code map cleanly.
- If breakpoints show as unverified, ensure the server is running and the `url` in `.vscode/launch.json` matches the address you opened.

Visual improvements added:

- Rim glow and ball trail for nicer visuals.
- HUD rounded panel and subtle background glow.

