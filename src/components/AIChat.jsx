import React, { useState, useRef, useEffect } from "react";

const AIChat = ({
  currentQuestion = null,
  userAnswer = null,
  isAnswerCorrect = null,
  screenType = "main", // Добавили новый пропс для определения типа экрана
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [hasIntroduced, setHasIntroduced] = useState(
    localStorage.getItem("ai_introduced") === "true",
  );
  const [lastHelpedQuestionId, setLastHelpedQuestionId] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatHeaderRef = useRef(null);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  // Загружаем API ключ и проверяем представление
  useEffect(() => {
    const key =
      import.meta.env.VITE_GROQ_API_KEY ||
      localStorage.getItem("ai_api_key") ||
      "";
    if (key) {
      setApiKey(key);
    }

    if (!hasIntroduced && isOpen) {
      setTimeout(() => {
        handleIntroduction();
      }, 1000);
    }
  }, [isOpen, hasIntroduced]);

  // Автоматическое предложение помощи
  useEffect(() => {
    if (
      isAnswerCorrect === false &&
      !isOpen &&
      currentQuestion &&
      lastHelpedQuestionId !== currentQuestion.id
    ) {
      setLastHelpedQuestionId(currentQuestion.id);

      setTimeout(() => {
        if (
          window.confirm(
            "Гиппократ предлагает помощь с этим вопросом. Открыть чат?",
          )
        ) {
          setIsOpen(true);
          setIsMinimized(false);
          handleAutoHelp();
        }
      }, 1500);
    }
  }, [isAnswerCorrect, currentQuestion, isOpen, lastHelpedQuestionId]);

  // Инициализация голосового ввода
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "ru-RU";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Ошибка распознавания:", event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Добавляем обработчики свайпа
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (!chatHeaderRef.current) return;

      const touch = e.touches[0];
      setTouchStartY(touch.clientY);
      setTouchStartX(touch.clientX);
    };

    const handleTouchMove = (e) => {
      if (!chatHeaderRef.current) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartY;
      const deltaX = Math.abs(touch.clientX - touchStartX);

      if (deltaX < 10 && Math.abs(deltaY) > 30) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      if (!chatHeaderRef.current) return;

      const touch = e.changedTouches[0];
      const deltaY = touch.clientY - touchStartY;
      const deltaX = Math.abs(touch.clientX - touchStartX);

      if (deltaX < 10 && Math.abs(deltaY) > 30) {
        if (deltaY > 0) {
          setIsMinimized(true);
        } else {
          setIsMinimized(false);
        }
      }

      setTouchStartY(0);
      setTouchStartX(0);
    };

    const headerElement = chatHeaderRef.current;
    if (headerElement) {
      headerElement.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      headerElement.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      headerElement.addEventListener("touchend", handleTouchEnd, {
        passive: true,
      });
    }

    return () => {
      if (headerElement) {
        headerElement.removeEventListener("touchstart", handleTouchStart);
        headerElement.removeEventListener("touchmove", handleTouchMove);
        headerElement.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [touchStartY, touchStartX]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleIntroduction = () => {
    if (hasIntroduced) return;

    const introduction = `Здравствуйте. Я - Гиппократ, искусственный интеллект профессор медицины с тысячелетним опытом. Готов помочь вам понять сложные медицинские концепции.

Как преподаватель, я буду:
1. Объяснять темы с самых основ
2. Приводить реальные клинические примеры
3. Задавать уточняющие вопросы
4. Проверять ваше понимание`;

    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: introduction,
        timestamp: new Date(),
      },
    ]);

    setHasIntroduced(true);
    localStorage.setItem("ai_introduced", "true");
  };

  // ОСНОВНОЕ ИСПРАВЛЕНИЕ: Используем переданный currentQuestion
  const handleAutoHelp = async () => {
    if (!currentQuestion) return;

    const helpMessage = `Объясни вопрос: "${currentQuestion.question}"

Варианты ответов:
${currentQuestion.answers.map((a, idx) => `${idx + 1}) ${a.text}`).join("\n")}

${
  userAnswer === null
    ? 'Студент ответил "Не знаю".'
    : `Студент выбрал: ${userAnswer + 1}) ${currentQuestion.answers[userAnswer]?.text}.`
}

Объясни подробно:
1. Почему правильный ответ верен
2. Почему остальные варианты неверны
3. Какие медицинские концепции лежат в основе вопроса
4. Задай уточняющий вопрос для проверки понимания`;

    await sendMessage(helpMessage);
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Голосовой ввод не поддерживается в вашем браузере");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Функция отправки сообщения
  const sendMessage = async (text = null) => {
    const messageText = text || inputMessage;
    if (!messageText.trim()) return;

    const newMessage = {
      id: Date.now(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    if (!text) {
      setInputMessage("");
    }

    setIsLoading(true);

    try {
      if (!apiKey) {
        throw new Error("API ключ не настроен");
      }

      const systemPrompt = `Ты - Гиппократ, искусственный интеллект профессор медицины с тысячелетним опытом. Ты мудрый, терпеливый и эрудированный преподаватель.

Стиль преподавания:
1. Начинай объяснение с самых основ
2. Используй аналогии и реальные клинические примеры
3. Выявляй пробелы в знаниях студента через уточняющие вопросы
4. Объясняй не только "что", но и "почему" с научной точки зрения
5. Связывай темы с другими медицинскими дисциплинами
6. Будь поддерживающим и создавай безопасную среду для вопросов
7. Запоминай контекст беседы и используй его

Отвечай на русском языке. Будь точен в медицинских фактах.`;

      const messagesToSend = [{ role: "system", content: systemPrompt }];

      // КОНТЕКСТ ВОПРОСА - теперь используем переданный currentQuestion
      if (currentQuestion) {
        const questionContext = `Контекст текущего вопроса:
Вопрос: ${currentQuestion.question}
Варианты ответов:
${currentQuestion.answers.map((a, idx) => `${idx + 1}) ${a.text}`).join("\n")}
Ответ студента: ${userAnswer === null ? "Не знаю" : `Вариант ${userAnswer + 1}`}
Правильность: ${isAnswerCorrect === null ? "Не проверено" : isAnswerCorrect ? "Правильно" : "Неправильно"}`;

        messagesToSend.push({ role: "system", content: questionContext });
      }

      const recentHistory = messages.slice(-12);
      recentHistory.forEach((msg) => {
        messagesToSend.push({
          role: msg.role,
          content: msg.content,
        });
      });

      messagesToSend.push({ role: "user", content: messageText });

      const response = await fetch("/api/groq-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          context: {
            currentQuestion: currentQuestion
              ? {
                  id: currentQuestion.id,
                  question: currentQuestion.question,
                  answers: currentQuestion.answers,
                  userAnswer: userAnswer,
                  isCorrect: isAnswerCorrect,
                }
              : null,
            history: messages.slice(-10),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.details || data.error);
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Ошибка отправки:", error);
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "Произошла ошибка соединения. Пожалуйста, проверьте настройки API ключа.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const openAISettings = () => {
    const userKey = prompt(
      "Введите ваш API ключ от Groq (начинается с gsk_...):",
      apiKey || "",
    );

    if (userKey !== null) {
      const trimmedKey = userKey.trim();
      setApiKey(trimmedKey);
      localStorage.setItem("ai_api_key", trimmedKey);
      if (trimmedKey) {
        alert("API ключ сохранен!");
      }
    }
  };

  const handleHeaderClick = (e) => {
    const isButtonClick = e.target.closest("button") !== null;

    if (!isButtonClick && e.target !== chatHeaderRef.current) {
      setIsMinimized(!isMinimized);
    }
  };

  // Иконка чата в формате base64 (белый цвет)
  const chatIconSVG = `data:image/svg+xml;base64,${btoa(`
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 4C3.9 4 3 4.9 3 6V15C3 16.1 3.9 17 5 17H14L17 20V6C17 4.9 16.1 4 15 4H5Z"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"/>
    </svg>
  `)}`;

  // Иконка микрофона в формате base64 (белый цвет)
  const microphoneIconSVG = `data:image/svg+xml;base64,${btoa(`
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C10.9 3 10 3.9 10 5V11C10 12.1 10.9 13 12 13C13.1 13 14 12.1 14 11V5C14 3.9 13.1 3 12 3Z"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"/>
      <path d="M19 11C19 14.3 16.3 17 13 17H11C7.7 17 5 14.3 5 11"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"/>
      <path d="M12 17V21"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"/>
      <path d="M9 21H15"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"/>
    </svg>
  `)}`;

  // Стили
  const floatingButtonStyle = {
    position: "fixed",
    bottom: "25px",
    right: "25px",
    width: "65px",
    height: "65px",
    borderRadius: "50%",
    backgroundColor: "#4CAF50",
    border: "none",
    color: "white",
    cursor: "pointer",
    boxShadow: "0 6px 25px rgba(0,0,0,0.5)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    outline: "none",
    backgroundImage: `url("${chatIconSVG}")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "28px 28px",
  };

  const chatWindowStyle = {
    position: "fixed",
    bottom: "100px",
    right: "25px",
    width: "380px",
    maxWidth: "calc(100vw - 50px)",
    height: "600px",
    maxHeight: "calc(100vh - 120px)",
    backgroundColor: "#171717",
    borderRadius: "25px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
    display: "flex",
    flexDirection: "column",
    zIndex: 1001,
    overflow: "hidden",
    transform: isMinimized ? "translateY(calc(100% - 60px))" : "translateY(0)",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const backdropStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 999,
    display: isOpen ? "block" : "none",
  };

  return (
    <>
      {/* Затемненный фон при открытом чате */}
      {isOpen && <div style={backdropStyle} onClick={() => setIsOpen(false)} />}

      {/* Плавающая кнопка */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          style={floatingButtonStyle}
          title="Гиппократ - ИИ профессор медицины"
          onMouseOver={(e) => {
            e.target.style.transform = "scale(1.12)";
            e.target.style.boxShadow = "0 8px 30px rgba(76, 175, 80, 0.4)";
            e.target.style.backgroundColor = "#45a049";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 6px 25px rgba(0,0,0,0.5)";
            e.target.style.backgroundColor = "#4CAF50";
          }}
        />
      )}

      {/* Окно чата */}
      {isOpen && (
        <div style={chatWindowStyle}>
          {/* Заголовок с обработчиком клика и свайпа */}
          <div
            ref={chatHeaderRef}
            onClick={handleHeaderClick}
            style={{
              padding: "18px 20px",
              backgroundColor: "#222",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: apiKey ? "#4CAF50" : "#ff9800",
                  flexShrink: 0,
                }}
              ></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontWeight: "500",
                    color: "white",
                    fontSize: "16px",
                    fontFamily: "'Inter', 'Arial', sans-serif",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Гиппократ
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#aaa",
                    fontStyle: "normal",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  ИИ профессор медицины
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexShrink: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "5px",
                  opacity: 0.8,
                  transition: "opacity 0.2s",
                  outline: "none",
                }}
                onMouseOver={(e) => (e.target.style.opacity = "1")}
                onMouseOut={(e) => (e.target.style.opacity = "0.8")}
                title={isMinimized ? "Развернуть" : "Свернуть"}
              >
                {isMinimized ? "▢" : "–"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "5px",
                  opacity: 0.8,
                  transition: "opacity 0.2s",
                  outline: "none",
                }}
                onMouseOver={(e) => (e.target.style.opacity = "1")}
                onMouseOut={(e) => (e.target.style.opacity = "0.8")}
                title="Закрыть"
              >
                ×
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Сообщения */}
              <div
                style={{
                  flex: 1,
                  padding: "20px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  backgroundColor: "#171717",
                }}
              >
                {messages.length === 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#666",
                      fontSize: "14px",
                      flex: 1,
                      padding: "20px",
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        marginBottom: "15px",
                        opacity: 0.7,
                        backgroundImage: `url("${chatIconSVG}")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        backgroundSize: "contain",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "18px",
                        color: "#ddd",
                        marginBottom: "10px",
                        fontWeight: "500",
                        textAlign: "center",
                      }}
                    >
                      Гиппократ
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#888",
                        marginBottom: "20px",
                        textAlign: "center",
                      }}
                    >
                      ИИ профессор медицины, готов помочь вам
                    </div>
                    {!apiKey && (
                      <button
                        onClick={openAISettings}
                        style={{
                          marginTop: "15px",
                          padding: "10px 20px",
                          borderRadius: "20px",
                          border: "none",
                          backgroundColor: "#2a2a2a",
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: "14px",
                          transition: "all 0.2s",
                          outline: "none",
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = "#333";
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = "#2a2a2a";
                        }}
                      >
                        Настроить API ключ
                      </button>
                    )}
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      alignSelf:
                        message.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      padding: "12px 16px",
                      borderRadius: "20px",
                      backgroundColor:
                        message.role === "user" ? "#2d6b31" : "#2a2a2a",
                      color: "white",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      wordWrap: "break-word",
                      boxShadow:
                        message.role === "user"
                          ? "0 2px 8px rgba(0,0,0,0.3)"
                          : "none",
                    }}
                  >
                    {message.content}
                    <div
                      style={{
                        fontSize: "11px",
                        opacity: 0.6,
                        marginTop: "6px",
                        textAlign: message.role === "user" ? "right" : "left",
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      padding: "12px 16px",
                      borderRadius: "20px",
                      backgroundColor: "#2a2a2a",
                      color: "#ccc",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        border: "2px solid #4CAF50",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    ></div>
                    Гиппократ думает...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input область */}
              <div
                style={{
                  padding: "18px 20px",
                  backgroundColor: "#222",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    gap: "8px",
                    minWidth: 0,
                    alignItems: "center",
                  }}
                >
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={
                      apiKey
                        ? "Задайте вопрос Гиппократу..."
                        : "Сначала настройте API ключ..."
                    }
                    style={{
                      flex: 1,
                      padding: "14px 16px",
                      borderRadius: "20px",
                      border: "none",
                      backgroundColor: "#1a1a1a",
                      color: "white",
                      outline: "none",
                      fontSize: "14px",
                      fontFamily: "'Inter', 'Arial', sans-serif",
                      minWidth: "50px",
                      resize: "none",
                      minHeight: "60px",
                      maxHeight: "120px",
                      lineHeight: "1.4",
                    }}
                    disabled={isLoading || !apiKey}
                    rows={3}
                  />
                  <button
                    onClick={toggleVoiceInput}
                    disabled={!apiKey}
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      border: "none",
                      backgroundColor: isListening ? "#f44336" : "#333",
                      color: "white",
                      cursor: apiKey ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                      outline: "none",
                      flexShrink: 0,
                      backgroundImage: `url("${microphoneIconSVG}")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      backgroundSize: "20px 20px",
                    }}
                    title={isListening ? "Остановить запись" : "Голосовой ввод"}
                    onMouseOver={(e) => {
                      if (apiKey)
                        e.target.style.backgroundColor = isListening
                          ? "#d32f2f"
                          : "#444";
                    }}
                    onMouseOut={(e) => {
                      if (apiKey)
                        e.target.style.backgroundColor = isListening
                          ? "#f44336"
                          : "#333";
                    }}
                  />
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !inputMessage.trim() || !apiKey}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: apiKey ? "#4CAF50" : "#666",
                    color: "white",
                    cursor: apiKey ? "pointer" : "not-allowed",
                    fontWeight: "500",
                    transition: "all 0.2s",
                    outline: "none",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                  title={apiKey ? "Отправить" : "Сначала настройте API ключ"}
                  onMouseOver={(e) => {
                    if (apiKey && !isLoading && inputMessage.trim()) {
                      e.target.style.backgroundColor = "#45a049";
                      e.target.style.transform = "scale(1.05)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (apiKey && !isLoading && inputMessage.trim()) {
                      e.target.style.backgroundColor = "#4CAF50";
                      e.target.style.transform = "scale(1)";
                    }
                  }}
                >
                  ➤
                </button>
              </div>

              {/* Быстрые действия */}
              <div
                style={{
                  padding: "15px 20px",
                  backgroundColor: "#222",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  flexShrink: 0,
                }}
              >
                {currentQuestion && (
                  <button
                    onClick={() => {
                      // ИСПРАВЛЕНИЕ: Используем переданный currentQuestion
                      const fullQuestion = `Объясни вопрос: "${currentQuestion.question}"

Варианты ответов:
${currentQuestion.answers.map((a, idx) => `${idx + 1}) ${a.text}`).join("\n")}

Пожалуйста, объясни:
1. Почему правильный ответ верен
2. Почему остальные варианты неверны
3. Какие медицинские концепции лежат в основе
4. Задай уточняющий вопрос для проверки моего понимания`;
                      sendMessage(fullQuestion);
                    }}
                    disabled={isLoading || !apiKey}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "20px",
                      border: "none",
                      backgroundColor: apiKey ? "#4CAF50" : "#666",
                      color: "white",
                      cursor: apiKey ? "pointer" : "not-allowed",
                      fontSize: "13px",
                      flex: "1 0 auto",
                      minWidth: "140px",
                      fontWeight: "500",
                      transition: "all 0.2s",
                      outline: "none",
                      width: "100%",
                    }}
                    onMouseOver={(e) => {
                      if (apiKey && !isLoading) {
                        e.target.style.backgroundColor = "#45a049";
                        e.target.style.transform = "scale(1.03)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (apiKey && !isLoading) {
                        e.target.style.backgroundColor = "#4CAF50";
                        e.target.style.transform = "scale(1)";
                      }
                    }}
                  >
                    Объяснить вопрос
                  </button>
                )}
                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                  <button
                    onClick={clearChat}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "20px",
                      border: "none",
                      backgroundColor: "#333",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "13px",
                      transition: "all 0.2s",
                      outline: "none",
                      flex: 1,
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = "#444";
                      e.target.style.transform = "scale(1.03)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = "#333";
                      e.target.style.transform = "scale(1)";
                    }}
                  >
                    Очистить чат
                  </button>
                  <button
                    onClick={openAISettings}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "20px",
                      border: "none",
                      backgroundColor: "#333",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "13px",
                      transition: "all 0.2s",
                      outline: "none",
                      flex: 1,
                    }}
                    title="Настройки API"
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = "#444";
                      e.target.style.transform = "scale(1.03)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = "#333";
                      e.target.style.transform = "scale(1)";
                    }}
                  >
                    Получить ключ
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <style>
        {`
          ::-webkit-scrollbar {
            width: 8px;
          }

          ::-webkit-scrollbar-track {
            background: #2a2a2a;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb {
            background: #555;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: '#666';
          }

          ::-webkit-scrollbar-button {
            display: none;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .ai-chat-messages::-webkit-scrollbar {
            width: 6px;
          }

          .ai-chat-messages::-webkit-scrollbar-track {
            background: transparent;
          }

          .ai-chat-messages::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 3px;
          }

          button:focus, input:focus, select:focus, textarea:focus {
            outline: none !important;
            box-shadow: none !important;
          }

          * {
            -webkit-tap-highlight-color: transparent;
          }

          @media (max-width: 768px) {
            .ai-chat-window {
              max-width: calc(100vw - 30px) !important;
              right: 15px !important;
              bottom: 80px !important;
            }

            .ai-chat-floating-button {
              right: 15px !important;
              bottom: 15px !important;
            }
          }

          textarea {
            font-family: inherit;
          }
        `}
      </style>
    </>
  );
};

export default AIChat;
