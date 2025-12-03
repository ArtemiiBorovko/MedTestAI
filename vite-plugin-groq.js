import fetch from "node-fetch";

export function groqProxyPlugin() {
  return {
    name: "groq-proxy-plugin",
    configureServer(server) {
      server.middlewares.use("/api/groq-proxy", async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Only POST requests allowed" }));
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const { message } = JSON.parse(body);

            console.log(
              "📨 Получен запрос через Vite плагин:",
              message?.substring(0, 50),
            );

            const apiKey = process.env.GROQ_API_KEY;

            if (!apiKey) {
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: "API ключ не настроен",
                  details: "Добавьте GROQ_API_KEY в Secrets Replit",
                }),
              );
              return;
            }

            const response = await fetch(
              "https://api.groq.com/openai/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "llama-3.3-70b-versatile",
                  messages: [
                    {
                      role: "system",
                      content:
                        "Ты - преподаватель медицины. Объясняй понятно и подробно. Отвечай на русском.",
                    },
                    { role: "user", content: message },
                  ],
                  temperature: 0.7,
                  max_tokens: 1024,
                }),
              },
            );

            if (!response.ok) {
              const errorText = await response.text();
              console.error("❌ Ошибка Groq API:", response.status, errorText);

              let errorMessage = "Ошибка API";
              if (response.status === 401) {
                errorMessage = "Неверный API ключ";
              } else if (response.status === 429) {
                errorMessage = "Превышен лимит запросов";
              } else if (response.status === 404) {
                errorMessage = "API endpoint не найден";
              }

              throw new Error(`${errorMessage}: ${response.status}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
              throw new Error("Неверный формат ответа от Groq API");
            }

            console.log("✅ Успешный ответ от Groq API через Vite плагин");

            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                response: data.choices[0].message.content,
                usage: data.usage,
              }),
            );
          } catch (error) {
            console.error("❌ Ошибка в Vite плагине:", error);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: "Ошибка сервера",
                details: error.message,
              }),
            );
          }
        });
      });

      server.middlewares.use("/api/health", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            status: "OK",
            message: "Vite сервер с API работает",
            timestamp: new Date().toISOString(),
            groqKey: process.env.GROQ_API_KEY ? "Настроен" : "Отсутствует",
          }),
        );
      });

      console.log("✅ Vite плагин для Groq API зарегистрирован");
      console.log("📍 API доступен по пути: /api/groq-proxy");
      console.log("🔧 Health check: /api/health");
    },
  };
}
