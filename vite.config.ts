import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function apiAssistantDevPlugin(): Plugin {
  return {
    name: "api-assistant-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0];
        if (url !== "/api/assistant") {
          return next();
        }

        try {
          const rawBody = await new Promise<string>((resolve) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof (req as any).body === "object" && (req as any).body !== null) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return resolve(JSON.stringify((req as any).body));
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((req as any).readableEnded || req.readable === false) {
              return resolve("");
            }
            let data = "";
            const timer = setTimeout(() => resolve(data), 1000);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            req.on("data", (chunk: any) => {
              data += chunk;
            });
            req.on("end", () => {
              clearTimeout(timer);
              resolve(data);
            });
            req.on("error", () => {
              clearTimeout(timer);
              resolve("");
            });
          });

          let parsedBody: unknown = {};
          if (rawBody.trim()) {
            try {
              parsedBody = JSON.parse(rawBody);
            } catch {
              parsedBody = rawBody;
            }
          }

          let statusCode = 200;
          const resObj = {
            status(code: number) {
              statusCode = code;
              res.statusCode = code;
              return resObj;
            },
            json(data: unknown) {
              res.statusCode = statusCode;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            },
          };

          const { default: handler } = await import("./api/assistant.ts");
          await handler({ method: req.method, body: parsedBody }, resObj);
        } catch (err: unknown) {
          console.error("Vite API Dev Server error:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: err instanceof Error ? err.message : "Internal Server Error",
            })
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load environment variables (including .env.local) for local server execution
  const env = loadEnv(mode, process.cwd(), "");
  const serverKeys = [
    "GEMINI_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
  ];
  for (const key of serverKeys) {
    if (env[key] && !process.env[key]) {
      process.env[key] = env[key];
    }
  }

  return {
    plugins: [react(), apiAssistantDevPlugin()],
    envPrefix: "VITE_",
  };
});
