import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import si from "systeminformation";

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  const PORT = 3000;

  // Store connected clients
  const clients = new Map<string, WebSocket>();

  // Broadcast system stats every 2 seconds
  setInterval(async () => {
    try {
      const [cpu, mem, battery] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.battery()
      ]);

      const stats = {
        type: 'SYSTEM_STATS',
        payload: {
          cpu: Math.round(cpu.currentLoad),
          ram: Math.round((mem.active / mem.total) * 100),
          battery: battery.hasBattery ? battery.percent : 100,
          isCharging: battery.isCharging
        }
      };

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(stats));
        }
      });
    } catch (e) {
      // Silent fail for stats
    }
  }, 2000);

  wss.on("connection", (ws) => {
    const id = Math.random().toString(36).substring(7);
    clients.set(id, ws);
    console.log(`Client connected: ${id}`);

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        // Broadcast to all other clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
          }
        });
      } catch (e) {
        console.error("Failed to parse message", e);
      }
    });

    ws.on("close", () => {
      clients.delete(id);
      console.log(`Client disconnected: ${id}`);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
