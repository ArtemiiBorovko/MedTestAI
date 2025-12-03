import React, { useState, useEffect, useRef } from "react";
import { getFavorites, removeFromFavorites } from "../utils/favorites";
import questionsData from "../questions.json";
import FavoriteStar from "../components/FavoriteStar";
import { useScrollPosition } from "../hooks/useScrollPosition";

const FavoritesScreen = ({ setCurrentScreen }) => {
  const [favorites, setFavorites] = useState([]);
  const { restoreScrollPosition } = useScrollPosition(
    "favoritesArchiveScrollPosition",
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
    margin: "10px 0",
    padding: "15px",
    backgroundColor: "#333",
    border: "none",
    borderRadius: "25px",
    color: "white",
    cursor: "pointer",
    width: "100%",
    fontSize: "16px",
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
    transition: "all 0.3s ease",
    marginTop: 15,
    position: "relative",
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
          "favoritesArchiveScrollPosition",
          currentScrollY.toString(),
        );
        console.log(
          `📜 РУЧНОЕ сохранение при скролле (Избранное): ${currentScrollY}px`,
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
      `🔙 КЛИК НАЗАД (Избранное): сохранение позиции ${currentScrollY}px`,
    );
    localStorage.setItem(
      "favoritesArchiveScrollPosition",
      currentScrollY.toString(),
    );

    setCurrentScreen("home");
  };

  // 📄 Сохранение позиции при закрытии страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentScrollY = window.scrollY;
      console.log(
        `📄 СОХРАНЕНИЕ при закрытии (Избранное): ${currentScrollY}px`,
      );
      localStorage.setItem(
        "favoritesArchiveScrollPosition",
        currentScrollY.toString(),
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const handleRemoveFavorite = (questionId) => {
    removeFromFavorites(questionId);
    setFavorites(getFavorites());
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
        На главный экран
      </button>

      <h1
        style={{
          textAlign: "center",
          margin: "20px 0",
          fontFamily: "'Inter', 'Arial', sans-serif",
          fontWeight: "400",
        }}
      >
        Избранные вопросы
      </h1>

      {favorites.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: "50px", color: "#666" }}>
          Пока нет избранных вопросов
        </p>
      ) : (
        favorites.map((questionId) => {
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
                  position: "relative",
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
                <div
                  style={{
                    marginTop: "-5px",
                    flexShrink: 0,
                  }}
                >
                  <FavoriteStar questionId={questionId} />
                </div>
              </div>

              {/* Картинка, если есть */}
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
                onClick={() => handleRemoveFavorite(questionId)}
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
                Удалить из избранного
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};

export default FavoritesScreen;
