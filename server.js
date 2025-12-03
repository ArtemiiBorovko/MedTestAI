import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());

// Serve static files from dist
app.use(express.static(path.join(__dirname, "dist")));

// API endpoint
app.post("/api/groq-proxy", async (req, res) => {
  try {
    console.log("📨 API request received");

    const { message } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.log("❌ API key not found");
      return res.status(500).json({
        error: "API ключ не настроен",
        details: "Добавьте GROQ_API_KEY в Secrets Replit",
      });
    }

    console.log("🔑 API key found, sending to Groq...");

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
                "Ты - Гиппократ, искусственный интеллект профессор медицины с тысячелетним опытом. Ты мудрый, терпеливый и эрудированный преподаватель. Объясняй понятно и подробно. Отвечай на русском.",
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
      console.error("❌ Groq API error:", response.status, errorText);
      return res.status(response.status).json({
        error: `Ошибка API: ${response.status}`,
        details: errorText.substring(0, 200),
      });
    }

    const data = await response.json();
    console.log("✅ Groq response received");

    res.json({
      response: data.choices[0].message.content,
    });
  } catch (error) {
    console.error("💥 Server error:", error);
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
      details: error.message,
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Сервер работает",
    timestamp: new Date().toISOString(),
  });
});

// All other routes serve React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📁 Отдает статические файлы из dist/`);
  console.log(`🔧 API доступен по: /api/groq-proxy`);
});
