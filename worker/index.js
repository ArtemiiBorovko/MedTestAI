export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    };

    // Handle OPTIONS request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Only allow POST requests for chat
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    try {
      const { message, context } = await request.json();

      if (!message) {
        return new Response(JSON.stringify({ error: "Message is required" }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }

      // System prompt для медицинского преподавателя
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

      console.log("Calling Groq API with messages:", messages.length);

      // Call Groq API
      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama2-70b-4096", // Можно поменять на 'mixtral-8x7b-32768'
            messages: messages,
            temperature: 0.7,
            max_tokens: 2048,
            stream: false,
          }),
        },
      );

      if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        console.error("Groq API error:", groqResponse.status, errorText);
        throw new Error(`Groq API error: ${groqResponse.status}`);
      }

      const data = await groqResponse.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from Groq API");
      }

      const responseText = data.choices[0].message.content;

      return new Response(
        JSON.stringify({
          response: responseText,
          usage: data.usage,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          details: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }
  },
};
