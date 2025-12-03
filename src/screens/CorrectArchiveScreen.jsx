import React, { useState, useEffect, useRef } from "react";
import questionsData from "../questions.json";
import FavoriteStar from "../components/FavoriteStar";
import { getCombinedUserAnswers } from "../utils/archiveUtils";
import { useScrollPosition } from "../hooks/useScrollPosition";

const CorrectArchiveScreen = ({ setCurrentScreen }) => {
  const [correctAnswersList, setCorrectAnswersList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const { restoreScrollPosition } = useScrollPosition(
    "correctArchiveScrollPosition",
  );
  const scrollTimeoutRef = useRef(null);
  const lastScrollYRef = useRef(0);

  // Номера вопросов с фото
  const photoQuestionNumbers = [
    53, 138, 143, 275, 278, 280, 281, 318, 319, 321, 382, 386, 387, 474, 482,
    502, 508, 584, 627, 628, 684, 689, 752, 753, 825, 850, 851, 914, 964, 965,
    978, 1093, 1164, 1173, 1256, 1408, 1447, 1448, 1492, 1521, 1551, 1575, 1678,
    1679, 1732, 1764, 1781, 2048, 2071, 2092, 2125, 2175, 2180, 2184, 2206,
    2212,
  ];

  // Стили
  const buttonStyle = {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#333",
    border: "none",
    borderRadius: 25,
    color: "white",
    cursor: "pointer",
    width: "100%",
    fontSize: 16,
    fontFamily: "'Inter', 'Arial', sans-serif",
    fontWeight: "400",
    transition: "all 0.2s ease",
    outline: "none",
  };

  const cardStyle = {
    backgroundColor: "#1e1e1e",
    borderRadius: 25,
    padding: 20,
    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
    marginTop: 15,
  };

  const handleButtonAnimation = (e, isMouseOver) => {
    if (isMouseOver) {
      e.target.style.transform = "scale(1.03)";
      e.target.style.backgroundColor = "#3a3a3a";
    } else {
      e.target.style.transform = "scale(1)";
      e.target.style.backgroundColor = "#333";
    }
  };

  const handleButtonPress = (e, isMouseDown) => {
    if (isMouseDown) {
      e.target.style.transform = "scale(0.98)";
      e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
    } else {
      e.target.style.transform = "scale(1.03)";
      e.target.style.boxShadow = "none";
    }
  };

  // 📜 Ручное сохранение позиции при скролле (с дебаунсом 500ms)
  const handleScroll = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const currentScrollY = window.scrollY;
      // Сохраняем только если позиция значительно изменилась
      if (Math.abs(currentScrollY - lastScrollYRef.current) > 100) {
        lastScrollYRef.current = currentScrollY;
        localStorage.setItem(
          "correctArchiveScrollPosition",
          currentScrollY.toString(),
        );
        console.log(
          `📜 РУЧНОЕ сохранение при скролле (Правильные): ${currentScrollY}px`,
        );
      }
    }, 500);
  };

  // Добавляем обработчик скролла
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 🔙 Сохранение позиции при клике "Назад"
  const handleBackClick = () => {
    const currentScrollY = window.scrollY;
    console.log(
      `🔙 КЛИК НАЗАД (Правильные): сохранение позиции ${currentScrollY}px`,
    );
    localStorage.setItem(
      "correctArchiveScrollPosition",
      currentScrollY.toString(),
    );

    setCurrentScreen("archive");
  };

  // 📄 Сохранение позиции при закрытии страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentScrollY = window.scrollY;
      console.log(
        `📄 СОХРАНЕНИЕ при закрытии (Правильные): ${currentScrollY}px`,
      );
      localStorage.setItem(
        "correctArchiveScrollPosition",
        currentScrollY.toString(),
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Сбрасываем скролл при поиске
  useEffect(() => {
    if (searchText) {
      window.scrollTo(0, 0);
      localStorage.setItem("correctArchiveScrollPosition", "0");
      lastScrollYRef.current = 0;
    }
  }, [searchText]);

  // Загрузка данных при монтировании
  useEffect(() => {
    const savedCorrect = localStorage.getItem("correctAnswersList");
    if (savedCorrect) {
      setCorrectAnswersList(JSON.parse(savedCorrect));
    }
  }, []);

  // Обновление при изменении localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCorrect = localStorage.getItem("correctAnswersList");
      if (savedCorrect) setCorrectAnswersList(JSON.parse(savedCorrect));
    };

    window.addEventListener("storage", handleStorageChange);

    // Проверяем каждые 2 секунды для обновления
    const interval = setInterval(handleStorageChange, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Фильтрация вопросов
  const filteredQuestions = correctAnswersList.filter((questionId) => {
    if (!searchText) return true;

    const question = questionsData[questionId];
    const searchLower = searchText.toLowerCase();

    // Поиск по номеру вопроса
    if (
      searchText.match(/^\d+$/) &&
      String(questionId + 1).includes(searchText)
    ) {
      return true;
    }

    // Поиск по тексту вопроса
    return question.question.toLowerCase().includes(searchLower);
  });

  // Удаление из архива
  const removeFromArchive = (questionId) => {
    const updated = correctAnswersList.filter((id) => id !== questionId);
    setCorrectAnswersList(updated);
    localStorage.setItem("correctAnswersList", JSON.stringify(updated));

    // Также удаляем из userAnswers
    const userAnswers = getCombinedUserAnswers();
    delete userAnswers[questionId];
    localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
  };

  // Очистка архива
  const clearArchive = () => {
    const confirmClear = window.confirm("Очистить архив правильных ответов?");
    if (confirmClear) {
      setCorrectAnswersList([]);
      localStorage.setItem("correctAnswersList", JSON.stringify([]));
    }
  };

  // Загрузка данных в файл
  const downloadArchive = () => {
    const userAnswers = JSON.parse(localStorage.getItem("userAnswers") || "{}");

    const header = `Архив: Правильные ответы\nДата: ${new Date().toLocaleString("ru-RU")}\nВсего: ${correctAnswersList.length}\n\n`;

    const lines = correctAnswersList.map((questionId, index) => {
      const q = questionsData[questionId];
      const userAnswerIndex = userAnswers[questionId];
      const chosen =
        userAnswerIndex !== undefined
          ? `${userAnswerIndex + 1}) ${q.answers[userAnswerIndex]?.text || "—"}`
          : "—";

      const correctAnswer = q.answers.find((a) => a.correct)?.text || "—";

      return `${index + 1}. #${questionId + 1} ${q.question.replace(/^\d+\.\s*/, "")}\n   Ваш ответ: ${chosen}\n   Правильный: ${correctAnswer}\n`;
    });

    const content = header + lines.join("\n");
    downloadTextFile(content, "correct_answers.txt");
  };

  // Функция для скачивания файла
  const downloadTextFile = (text, filename) => {
    try {
      const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);
      const encoder = new TextEncoder();
      const content = encoder.encode(text);
      const blob = new Blob([BOM, content], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("download error", e);
      alert("Ошибка при сохранении файла");
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "700px",
        margin: "0 auto",
        color: "white",
        minHeight: "100vh",
        fontFamily: "'Inter', 'Arial', sans-serif",
      }}
    >
      <button
        style={{
          ...buttonStyle,
          position: "sticky",
          top: "10px",
          zIndex: 1000,
        }}
        onClick={handleBackClick}
        onMouseOver={(e) => handleButtonAnimation(e, true)}
        onMouseOut={(e) => handleButtonAnimation(e, false)}
        onMouseDown={(e) => handleButtonPress(e, true)}
        onMouseUp={(e) => handleButtonPress(e, false)}
      >
        Назад
      </button>

      <h1
        style={{
          textAlign: "center",
          margin: "20px 0",
          fontFamily: "'Inter', 'Arial', sans-serif",
          fontWeight: "400",
        }}
      >
        Правильные ответы
      </h1>

      {/* Строка поиска */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Поиск по номеру или тексту..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 25,
            border: "none",
            fontSize: 16,
            backgroundColor: "#2a2a2a",
            color: "#fff",
            fontFamily: "'Inter', 'Arial', sans-serif",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Кнопки управления */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          style={{ ...buttonStyle, flex: 1, backgroundColor: "#444" }}
          onClick={clearArchive}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          Очистить архив
        </button>

        <button
          style={{ ...buttonStyle, flex: 1, backgroundColor: "#444" }}
          onClick={downloadArchive}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          Загрузить данные
        </button>
      </div>

      {/* Список вопросов */}
      {filteredQuestions.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: "50px", color: "#666" }}>
          {correctAnswersList.length === 0
            ? "Пока нет правильных ответов в архиве"
            : "Вопросы не найдены"}
        </p>
      ) : (
        filteredQuestions.map((questionId) => {
          const q = questionsData[questionId];
          if (!q) return null;

          return (
            <div key={questionId} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "15px",
                }}
              >
                <p
                  style={{
                    fontWeight: "bold",
                    margin: 0,
                    flex: 1,
                    marginRight: "15px",
                    fontSize: "16px",
                    lineHeight: "1.4",
                  }}
                >
                  {questionId + 1}. {q.question.replace(/^\d+\.\s*/, "")}
                </p>
                <FavoriteStar questionId={questionId} />
              </div>

              {/* Картинка, если есть */}
              {photoQuestionNumbers.includes(questionId + 1) && (
                <div style={{ marginTop: 12 }}>
                  <img
                    src={`/images/${questionId + 1}.png`}
                    alt=""
                    style={{
                      width: "100%",
                      maxHeight: 300,
                      objectFit: "contain",
                      borderRadius: 8,
                      display: "block",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              <ul style={{ listStyle: "none", padding: 0, marginTop: 15 }}>
                {q.answers.map((a, j) => (
                  <li
                    key={j}
                    style={{
                      padding: "12px",
                      margin: "8px 0",
                      borderRadius: 25,
                      backgroundColor: a.correct ? "#4caf50" : "#2c2c2c",
                      color: "#ffffff",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    {j + 1}) {a.text}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => removeFromArchive(questionId)}
                style={{
                  ...buttonStyle,
                  backgroundColor: "#444",
                  marginTop: 15,
                }}
                onMouseOver={(e) => handleButtonAnimation(e, true)}
                onMouseOut={(e) => handleButtonAnimation(e, false)}
                onMouseDown={(e) => handleButtonPress(e, true)}
                onMouseUp={(e) => handleButtonPress(e, false)}
              >
                Удалить из архива
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CorrectArchiveScreen;
