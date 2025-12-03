// proxy-server.js - исправленная версия без ошибки маршрута
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const app = express();
const PORT = 3000;

// Получаем пути для статических файлов
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Сначала обслуживаем статические файлы из папки dist (если есть)
app.use(express.static(join(__dirname, "dist")));

// Прокси эндпоинт для Groq API
app.post("/api/groq-proxy", async (req, res) => {
  try {
    const { message, context } = req.body;

    console.log(
      "📨 Получен запрос к прокси:",
      message?.substring(0, 50) + "...",
    );

    // Системный промпт для медицинского преподавателя
    const systemPrompt = `Ты - опытный преподаватель медицины, профессор с международным признанием. 
Твоя задача - помогать студентам-медикам понимать сложные концепции через вопросы и ответы.

Твой стиль преподавания:
1. Начинай объяснение с самых основ (школьный уровень)
2. Используй аналогии и реальные примеры из медицинской практики
3. Выявляй пробелы в знаниях студента и заполняй их
4. Будь терпеливым и поддерживающим
5. Задавай наводящие вопросы для проверки понимания
6. Объясняй не только "что", но и "почему"
7. Структурируй ответы: сначала краткий ответ, потом детали
8. Используй медицинскую терминологию, но объясняй сложные термины

Отвечай на русском языке. Будь точным в медицинских фактах.`;

    const messages = [{ role: "system", content: systemPrompt }];

    // Добавляем контекст вопроса если есть
    if (context?.currentQuestion) {
      const questionContext = `Контекст текущего вопроса: 
Вопрос: ${context.currentQuestion.question}
Ответ студента: ${context.currentQuestion.userAnswer === null ? "Не знаю" : `Вариант ${context.currentQuestion.userAnswer + 1}`}
Правильность: ${context.currentQuestion.isCorrect === null ? "Не проверено" : context.currentQuestion.isCorrect ? "Правильно" : "Неправильно"}`;

      messages.push({ role: "system", content: questionContext });
    }

    // Добавляем историю сообщений
    if (context?.history && Array.isArray(context.history)) {
      context.history.forEach((msg) => {
        if (msg.role && msg.content) {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    }

    // Добавляем текущее сообщение пользователя
    messages.push({ role: "user", content: message });

    // Получаем API ключ из переменных окружения
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "API ключ не настроен на сервере",
        details: "Добавьте GROQ_API_KEY в Secrets Replit",
      });
    }

    console.log("🚀 Отправка запроса к Groq API...");

    // Отправляем запрос к Groq API через сервер
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama2-70b-4096",
          messages: messages,
          temperature: 0.7,
          max_tokens: 2048,
          stream: false,
        }),
      },
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("❌ Ошибка Groq API:", groqResponse.status, errorText);

      if (groqResponse.status === 401) {
        throw new Error("Неверный API ключ на сервере");
      } else if (groqResponse.status === 429) {
        throw new Error("Превышен лимит запросов к Groq API");
      } else {
        throw new Error(`Ошибка Groq API: ${groqResponse.status}`);
      }
    }

    const data = await groqResponse.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Неверный формат ответа от Groq API");
    }

    console.log("✅ Успешный ответ от Groq API");

    res.json({
      response: data.choices[0].message.content,
      usage: data.usage,
    });
  } catch (error) {
    console.error("❌ Ошибка прокси сервера:", error);
    res.status(500).json({
      error: "Ошибка сервера",
      details: error.message,
    });
  }
});

// Тестовый эндпоинт
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Объединенный сервер работает",
    timestamp: new Date().toISOString(),
    groqKey: process.env.GROQ_API_KEY ? "Настроен" : "Отсутствует",
  });
});

// Простой маршрут для главной страницы
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Medical Test PWA</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #1e1e1e; color: white; }
            .container { max-width: 800px; margin: 0 auto; }
            .status { background: #2a2a2a; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .success { color: #4CAF50; }
            .error { color: #f44336; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Medical Test PWA Server</h1>
            <div class="status">
                <h2>Статус сервера: <span class="success">✅ Работает</span></h2>
                <p><strong>Порт:</strong> ${PORT}</p>
                <p><strong>GROQ API Key:</strong> ${process.env.GROQ_API_KEY ? "✅ Настроен" : "❌ Отсутствует"}</p>
                <p><strong>Время:</strong> ${new Date().toLocaleString("ru-RU")}</p>
            </div>
            <div class="status">
                <h3>Доступные эндпоинты:</h3>
                <ul>
                    <li><strong>GET</strong> <a href="/api/health" style="color: #4CAF50;">/api/health</a> - Проверка работы API</li>
                    <li><strong>POST</strong> /api/groq-proxy - Прокси для Groq API</li>
                </ul>
            </div>
            <div class="status">
                <h3>Следующие шаги:</h3>
                <p>1. Убедитесь, что React приложение собрано в папку <code>dist</code></p>
                <p>2. Или запустите React dev server отдельно на порту 5173</p>
                <p>3. Тестируйте API через Postman или прямо в приложении</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`🚀 Объединенный сервер запущен на порту ${PORT}`);
  console.log(`📍 Основной URL: http://localhost:${PORT}`);
  console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
  console.log(
    `🔑 GROQ_API_KEY: ${process.env.GROQ_API_KEY ? "✅ Настроен" : "❌ Отсутствует"}`,
  );
});
