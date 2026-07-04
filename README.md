# 📶 VeriFi — Verified WiFi Speed & Reliability Map

VeriFi is a professional, enterprise-grade crowdsourced platform designed to verify, catalog, and map internet speeds and reliability in cafes, hotels, and coworking spaces. Built with a sleek dark-cyber aesthetic and interactive geolocation tools.

---

## 🚀 Key Features

* **Global Overview Dashboard**: Real-time analytics tracking total spots registered, average download bandwidth, and the fastest verified local connections.
* **Dynamic Performance Badges**: Automated classification of WiFi speeds using intuitive status badges:
  * `Gigabit+` (>= 250 Mbps) — Enterprise/10G ready.
  * `Excellent` (>= 100 Mbps) — Zoom/HD conferencing ready.
  * `Good` (>= 50 Mbps) — Multi-user multitasking ready.
  * `Basic` (>= 15 Mbps) — Standard browsing and text check-in.
  * `Slow` (< 15 Mbps) — Buffering-prone.
* **Animated SVG Speedometer**: High-fidelity animated speed dial measuring real-time connection telemetry (ping latencies, downloads, uploads).
* **Interactive Night-Theme Map**: Custom Leaflet configuration utilizing tile color inversion filters to blend into dark layout aesthetics, featuring dynamic place type color-coded marker pins.
* **Zero-Configuration Fallback DB Mode**: Features a self-healing backend. If no MongoDB Atlas or local database URI is supplied, the backend seamlessly routes operations (logins, registrations, spot creation, speed logs) to a shared in-memory Javascript database.

---

## 🛠️ Technology Stack

* **Frontend**: React (Vite SPA), Vanilla CSS, Lucide icons, Leaflet.
* **Backend**: Node.js, Express, Mongoose (MongoDB / Atlas), JSON Web Tokens (JWT), Bcrypt.js.

---

## ⚙️ Quick Start (Local Run)

You can orchestrate operations directly from the root folder using helper scripts:

### 1. Install all dependencies
```bash
npm run install-all
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/verifyfi?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```
*Note: If `MONGODB_URI` is omitted or offline, the server will automatically start in mock database fallback mode so you can preview the app immediately.*

### 3. Run Development Servers
Open two terminal windows:

* **Start Backend**:
  ```bash
  npm run dev-backend
  ```
* **Start Frontend**:
  ```bash
  npm run dev-frontend
  ```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🌐 Production Deployment

VeriFi is structured to compile and deploy on a single unified instance (e.g. Render, Heroku, or digital VPS nodes):

1. **Build Static Assets**:
   Run the build script at root to compile Vite frontend code into `frontend/dist`:
   ```bash
   npm run build
   ```
2. **Serve via Express**:
   Set `NODE_ENV=production`. The Express backend will automatically serve the static build index at `frontend/dist` and mount API endpoints, allowing the entire full-stack app to run on a single port.
3. **Start Production Server**:
   ```bash
   npm start
   ```
