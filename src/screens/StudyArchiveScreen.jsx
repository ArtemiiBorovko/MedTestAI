// src/screens/StudyArchiveScreen.jsx
import React, { useState, useEffect, useRef } from "react";
import questionsData from "../questions.json";
import FavoriteStar from "../components/FavoriteStar";
import {
  getStudyQuestions,
  getStudyQuestionCounters,
  getCombinedUserAnswers,
  clearStudyArchive,
  removeQuestionFromStudy,
} from "../utils/archiveUtils";
import { useScrollPosition } from "../hooks/useScrollPosition";

const StudyArchiveScreen = ({ setCurrentScreen }) => {
  const [questions, setQuestions] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const { restoreScrollPosition } = useScrollPosition("study-archive");
  const counters = getStudyQuestionCounters();
  const userAnswers = getCombinedUserAnswers();
  const scrollTimeoutRef = useRef(null);
  const lastScrollYRef = useRef(0);

  // Загрузка вопросов
  useEffect(() => {
    const studyQuestions = getStudyQuestions();
    setQuestions(studyQuestions);
    setFilteredQuestions(studyQuestions);
  }, []);

  // Поиск вопросов (по номеру и тексту)
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredQuestions(questions);
      return;
    }

    const filtered = questions.filter((questionId) => {
      const question = questionsData[questionId];
      const searchLower = searchText.toLowerCase();

      // Поиск по номеру вопроса
      const searchNumber = parseInt(searchText);
      if (!isNaN(searchNumber) && searchNumber === questionId + 1) {
        return true;
      }

      // Поиск по тексту вопроса
      if (question.question.toLowerCase().includes(searchLower)) {
        return true;
      }

      return false;
    });

    setFilteredQuestions(filtered);
  }, [searchText, questions]);

  // Вычисляем статистику на лету
  const getCurrentStats = () => {
    const currentQuestions = searchText ? filteredQuestions : questions;

    let unknownCount = 0;
    let incorrectCount = 0;

    currentQuestions.forEach((questionId) => {
      if (userAnswers[questionId] === null) {
        unknownCount++;
      } else {
        incorrectCount++;
      }
    });

    return {
      total: questions.length,
      found: currentQuestions.length,
      unknown: unknownCount,
      incorrect: incorrectCount,
    };
  };

  const currentStats = getCurrentStats();

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
        localStorage.setItem("study-archive", currentScrollY.toString());
        console.log(
          `📜 РУЧНОЕ сохранение при скролле (Архив "Изучать"): ${currentScrollY}px`,
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
      `🔙 КЛИК НАЗАД (Архив "Изучать"): сохранение позиции ${currentScrollY}px`,
    );
    localStorage.setItem("study-archive", currentScrollY.toString());

    setCurrentScreen("home");
  };

  // 📄 Сохранение позиции при закрытии страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentScrollY = window.scrollY;
      console.log(
        `📄 СОХРАНЕНИЕ при закрытии (Архив "Изучать"): ${currentScrollY}px`,
      );
      localStorage.setItem("study-archive", currentScrollY.toString());
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
      localStorage.setItem("study-archive", "0");
      lastScrollYRef.current = 0;
    }
  }, [searchText]);

  // Очистка архива
  const handleClearArchive = () => {
    if (
      window.confirm(
        "Вы уверены, что хотите очистить архив изучения? Все вопросы и счетчики будут удалены.",
      )
    ) {
      clearStudyArchive();
      setQuestions([]);
      setFilteredQuestions([]);
    }
  };

  // Удаление вопроса из архива
  const handleRemoveQuestion = (questionId) => {
    removeQuestionFromStudy(questionId);
    const updatedQuestions = questions.filter((id) => id !== questionId);
    setQuestions(updatedQuestions);
    setFilteredQuestions(updatedQuestions);
  };

  // Стили с анимацией
  const buttonStyle = {
    margin: "10px 0",
    padding: "12px",
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
    borderRadius: "15px",
    padding: "15px",
    marginBottom: "15px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
  };

  // Обработчики анимации кнопок
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

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "500px",
        margin: "0 auto",
        color: "white",
        minHeight: "100vh",
        fontFamily: "'Inter', 'Arial', sans-serif",
      }}
    >
      {/* Кнопка назад */}
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

      <h1 style={{ textAlign: "center", margin: "20px 0" }}>Архив "Изучать"</h1>

      {/* Поиск */}
      <input
        type="text"
        placeholder="Поиск по номеру или тексту вопроса..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "25px",
          border: "none",
          fontSize: "16px",
          backgroundColor: "#2a2a2a",
          color: "#fff",
          marginBottom: "15px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {/* Статистика */}
      <div style={cardStyle}>
        <p>Всего вопросов: {currentStats.total}</p>
        <p>Найдено: {currentStats.found}</p>
        <p>Не знаю: {currentStats.unknown}</p>
        <p>Не правильно: {currentStats.incorrect}</p>
      </div>

      {/* Кнопки управления - в одну строку */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <button
          style={{ ...buttonStyle, flex: 1, margin: 0 }}
          onClick={() => setCurrentScreen("study")}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          Вернуться к изучению
        </button>
        <button
          style={{
            ...buttonStyle,
            flex: 1,
            margin: 0,
            backgroundColor: "#333",
          }}
          onClick={handleClearArchive}
          disabled={questions.length === 0}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          Очистить архив
        </button>
      </div>

      {/* Список вопросов */}
      <div style={{ marginTop: "20px" }}>
        {filteredQuestions.map((questionId, index) => {
          const question = questionsData[questionId];
          const userAnswer = userAnswers[questionId];
          const counter = counters[questionId] || 0;
          const isUnknown = userAnswer === null;
          const correctAnswerIndex = question.answers.findIndex(
            (a) => a.correct,
          );
          const correctAnswerText =
            correctAnswerIndex >= 0
              ? `${correctAnswerIndex + 1}) ${question.answers[correctAnswerIndex].text}`
              : "—";

          return (
            <div key={questionId} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "10px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    flex: 1,
                    marginRight: "10px",
                    fontSize: "16px",
                    lineHeight: "1.4",
                  }}
                >
                  {questionId + 1}. {question.question.replace(/^\d+\.\s*/, "")}
                </h3>
                <FavoriteStar questionId={questionId} />
              </div>

              {/* Варианты ответов с цветовой маркировкой */}
              <ul style={{ listStyle: "none", padding: 0, margin: "10px 0" }}>
                {question.answers.map((answer, idx) => {
                  let bgColor = "#2c2c2c";
                  if (answer.correct) {
                    bgColor = "#4caf50";
                  } else if (userAnswer === idx) {
                    bgColor = "#f44336";
                  }
                  return (
                    <li
                      key={idx}
                      style={{
                        padding: "8px",
                        margin: "5px 0",
                        borderRadius: "15px",
                        backgroundColor: bgColor,
                        color: "#ffffff",
                        fontSize: "14px",
                      }}
                    >
                      {idx + 1}) {answer.text}
                    </li>
                  );
                })}
              </ul>

              {/* Информация о ответе */}
              <div
                style={{
                  marginBottom: "10px",
                  fontSize: "14px",
                  color: "#ccc",
                }}
              >
                <div>Счетчик: {counter}</div>
                <div>Тип: {isUnknown ? "Не знаю" : "Неправильный"}</div>
                {!isUnknown && userAnswer !== undefined && (
                  <div>
                    Ваш ответ: {userAnswer + 1}){" "}
                    {question.answers[userAnswer]?.text}
                  </div>
                )}
                <div>Правильный: {correctAnswerText}</div>
              </div>

              {/* Кнопка удаления */}
              <button
                onClick={() => handleRemoveQuestion(questionId)}
                style={{
                  ...buttonStyle,
                  backgroundColor: "#333",
                  padding: "8px",
                  fontSize: "14px",
                  marginTop: "10px",
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
        })}

        {filteredQuestions.length === 0 && (
          <div
            style={{ textAlign: "center", color: "#666", marginTop: "50px" }}
          >
            {questions.length === 0
              ? "Архив изучения пуст"
              : "Вопросы не найдены"}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyArchiveScreen;
