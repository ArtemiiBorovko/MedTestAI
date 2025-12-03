import React, { useState, useEffect, useRef } from "react";
import questionsData from "../questions.json";
import FavoriteStar from "../components/FavoriteStar";
import { useScrollPosition } from "../hooks/useScrollPosition";

const PhotosArchiveScreen = ({ setCurrentScreen }) => {
  const [searchText, setSearchText] = useState("");
  const { restoreScrollPosition } = useScrollPosition(
    "photosArchiveScrollPosition",
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
          "photosArchiveScrollPosition",
          currentScrollY.toString(),
        );
        console.log(
          `📜 РУЧНОЕ сохранение при скролле (Фото): ${currentScrollY}px`,
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
    console.log(`🔙 КЛИК НАЗАД (Фото): сохранение позиции ${currentScrollY}px`);
    localStorage.setItem(
      "photosArchiveScrollPosition",
      currentScrollY.toString(),
    );

    setCurrentScreen("archive");
  };

  // 📄 Сохранение позиции при закрытии страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentScrollY = window.scrollY;
      console.log(`📄 СОХРАНЕНИЕ при закрытии (Фото): ${currentScrollY}px`);
      localStorage.setItem(
        "photosArchiveScrollPosition",
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
      localStorage.setItem("photosArchiveScrollPosition", "0");
      lastScrollYRef.current = 0;
    }
  }, [searchText]);

  // Фильтрация вопросов с фото
  const filteredQuestions = photoQuestionNumbers.filter((questionNumber) => {
    if (!searchText) return true;

    const questionId = questionNumber - 1;
    const question = questionsData[questionId];
    const searchLower = searchText.toLowerCase();

    // Поиск по номеру вопроса
    if (
      searchText.match(/^\d+$/) &&
      String(questionNumber).includes(searchText)
    ) {
      return true;
    }

    // Поиск по тексту вопроса
    return question.question.toLowerCase().includes(searchLower);
  });

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
        Вопросы с фото ({photoQuestionNumbers.length})
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

      {/* Список вопросов с фото */}
      {filteredQuestions.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: "50px", color: "#666" }}>
          Вопросы с фото не найдены
        </p>
      ) : (
        filteredQuestions.map((questionNumber) => {
          const questionId = questionNumber - 1;
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
                  {questionNumber}. {q.question.replace(/^\d+\.\s*/, "")}
                </p>
                <FavoriteStar questionId={questionId} />
              </div>

              {/* Картинка */}
              <div style={{ marginTop: 12 }}>
                <img
                  src={`/images/${questionNumber}.png`}
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
            </div>
          );
        })
      )}
    </div>
  );
};

export default PhotosArchiveScreen;
