## Build & Development Commands
- Install dependencies: `npm install --legacy-peer-deps`
- Start dev server: `npm run dev`
- Build project: `npm run build`
- Lint code: `npm run lint`

## Tech Stack
- Framework: Vite + [React JS]
- State Management: LocalStorage (Offline-first architecture)
- Styling: [Tailwind/CSS Modules/Plain CSS]

## Key Files & Directories
- `src/`: Main application logic
- `config.js`: Global app settings and constants
- `public/`: Static assets (icons, sounds)
- Prefer keeping core logic and UI in App.jsx and config.js unless a module becomes too large to manage. Avoid unnecessary 'component-drilling' or over-engineering the file structure.

## Coding Standards
- Use ES6 modules (import/export).
- Style: Use functional components [if using React] or modular JS.
- Data Persistence: Always ensure state changes are synced to LocalStorage.
- Error Handling: Use try/catch blocks for all JSON.parse operations (for session recovery).

## Layout & UX Invariants (Do Not Alter)
- **Safe Area Bottom Nav:** Always maintain `padding-bottom: 25px` on the `<nav>` to account for the iPhone home bar.
- **Touch Targets:** All buttons and interactive `motion.div` elements must maintain their current `padding` (15px-24px) to ensure they are easy to tap on mobile.
- **Input Geometry:** The `inputStyle` must remain `height: 48px` (effectively via 14px padding + 16px font) to prevent iOS layout shifting.
- **Overlay Architecture:** The "Active Workout" must remain a `fixed` overlay with `inset: 0` to maintain the "full-screen app" feel.
- **Scroll Containment:** The main container must have `paddingBottom: '90px'` to prevent the Bottom Nav from obscuring content.

## Flexible Theme Guidelines
- **Color Logic:** You may suggest new color palettes, but they must be applied via the `theme` object. 
- **Component Styling:** Feel free to experiment with `box-shadow`, `backdrop-filter`, or `border-width` as long as they don't change the element's outer dimensions (use `box-sizing: border-box`).
- **Typography:** You can swap fonts or weights, but keep the `fontSize` for inputs at `16px` to avoid the iOS auto-zoom trigger.

## Logic Rules
- Always use standard 45lb plate increments for the module that calculates plate math.
- When adding new state variables (e.g., userSettings), you must update the useEffect hook and the initialization logic to ensure the new data persists to localStorage immediately.
