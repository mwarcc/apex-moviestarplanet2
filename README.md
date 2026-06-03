# Apex | MovieStarPlanet2 Advanced Toolkit

Apex is a high-performance, modular Chrome extension designed to extend the capabilities of the MovieStarPlanet2 web client. Built with a focus on stealth, network efficiency, and deep game-engine integration, Apex transforms the user experience from a standard client into a powerful developer-grade interface.

---

## Why Apex?

Unlike standard scripts, Apex operates at the intersection of the game's network layer and the DOM. It doesn't just automate clicks; it communicates directly with the MSP2 backend using native protocols (BSON, GraphQL, WebSockets).

### Core Pillars

#### 🛡️ Stealth & Anti-Detection
Apex is built to be invisible. It employs several techniques to bypass client-side integrity checks:
- **Function Masking:** Custom `makeNativeToString` implementation to prevent the game from detecting hooked functions via `.toString()`.
- **Native References:** Internal caching of native JavaScript prototypes to prevent "poisoned" environment detection.
- **Isolated Execution:** The core logic runs in a controlled environment, injected via a bootstrap process that minimizes its footprint in the global namespace.

#### ⚡ Network Orchestration
Apex intercepts and modifies traffic in real-time:
- **BSON Integration:** Native handling of Binary JSON (BSON) for seamless communication with the game's REST API.
- **Protocol Hooking:** Real-time WebSocket and XHR interception allows for chat filter bypassing and instant event handling (e.g., StarQuiz auto-solver).
- **JWT Capture:** Automatic extraction and management of authentication tokens for secure, automated requests.

#### 🎨 Professional UI/UX
The most modern MSP2 UI/UX Toolkit.
- **Shadow DOM Encapsulation:** The UI is injected into a Shadow Root, ensuring Apex styles never conflict with game CSS and remain hidden from game-side scripts.
- **Reactive State Management:** A centralized state object ensures the UI stays synchronized with game events (rosters, XP gains, and status updates).

---

## Technical Architecture

The project follows a modular "Service-Oriented" structure:

- **Network Layer:** Handles the heavy lifting of `fetch`, `XHR`, and `WebSocket` interception.
- **API Wrapper:** A clean abstraction layer for MSP2's GraphQL and REST endpoints.
- **Social Engine:** Manages complex social interactions like bulk friend management and "Autographer" logic.
- **Feature Modules:** Self-contained logic for specific enhancements like Glitched Homes, Profile Modding, and Avatar Uploads.

---

## Installation & Deployment

### Prerequisites
- Node.js 16+
- Chrome/Edge/Brave Browser

### Build Process
Apex uses a custom build pipeline to concatenate and minify the source into a production-ready bundle.

```bash
# Install dependencies
npm install

# Build for production
npm run build
