const { app, BrowserWindow } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const webRoot = path.join(__dirname, "..", ".vercel", "output", "static" );
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

let server;
async function createWindow() {
  if (!fs.existsSync(path.join(webRoot, "index.html"))) {
    throw new Error("Pargar web build is missing. Run npm run build first.");
  }
  server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    const candidate = path.resolve(webRoot, "." + pathname);
    if (!candidate.startsWith(webRoot + path.sep) && candidate !== path.join(webRoot, "index.html")) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const file = fs.existsSync(candidate) && fs.statSync(candidate).isFile()
      ? candidate
      : path.join(webRoot, "index.html");
    res.setHeader("Content-Type", mime[path.extname(file).toLowerCase()] || "application/octet-stream");
    fs.createReadStream(file).on("error", () => res.writeHead(404).end()).pipe(res);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 620,
    autoHideMenuBar: true,
    backgroundColor: "#18263D",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  await win.loadURL(`http://127.0.0.1:${address.port}/`);
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}
app.whenReady().then(createWindow).catch((err) => {
  console.error(err);
  app.quit();
});
app.on("window-all-closed", () => {
  if (server) server.close();
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow();
});
