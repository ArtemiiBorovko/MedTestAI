import React, { useState, useEffect, useRef } from "react";
import questionsData from "../questions.json";
import FavoriteStar from "../components/FavoriteStar";
import {
  updateAnswerArchives,
  getUserAnswersByType,
} from "../utils/archiveUtils";
import "../App.css";

const FastTestScreen = ({ setCurrentScreen }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [fade, setFade] = useState(true);
  const [answerAppear, setAnswerAppear] = useState(Array(4).fill(false));
  const [animateIdx, setAnimateIdx] = useState(null);
  const [testCompleted, setTestCompleted] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [questionsCount, setQuestionsCount] = useState("10");

  // Статистика для быстрого теста
  const [fastTestStats, setFastTestStats] = useState({
    correct: 0,
    incorrect: 0,
    unknown: 0,
  });

  // Ответы пользователя в быстром тесте (используем отдельное хранилище)
  const [userAnswers, setUserAnswers] = useState(getUserAnswersByType("fast"));

  // Случайные вопросы для быстрого теста
  const [randomQuestions, setRandomQuestions] = useState([]);

  // Состояния для свайпов и навигации
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

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
    transition: "all 0.3s ease",
    opacity: fade ? 1 : 0,
    transform: fade ? "translateY(0)" : "translateY(20px)",
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

  // Генерация случайных вопросов
  const generateRandomQuestions = () => {
    const totalQuestions = questionsData.length;
    const count = Math.min(
      Math.max(1, parseInt(questionsCount) || 10),
      totalQuestions,
    );

    const selectedIndices = new Set();

    // Выбираем случайные неповторяющиеся вопросы
    while (
      selectedIndices.size < count &&
      selectedIndices.size < totalQuestions
    ) {
      const randomIndex = Math.floor(Math.random() * totalQuestions);
      selectedIndices.add(randomIndex);
    }

    setRandomQuestions(Array.from(selectedIndices));
  };

  // Начало теста
  const startTest = () => {
    const count = parseInt(questionsCount);

    if (isNaN(count) || count < 1) {
      alert("Количество вопросов должно быть не менее 1");
      setQuestionsCount("10");
      return;
    }

    if (count > questionsData.length) {
      alert(`Максимальное количество вопросов: ${questionsData.length}`);
      setQuestionsCount(String(questionsData.length));
      return;
    }

    // ОЧИСТКА ПРЕДЫДУЩИХ ОТВЕТОВ БЫСТРОГО ТЕСТА
    localStorage.setItem("userAnswersFast", "{}");

    generateRandomQuestions();
    setShowStartScreen(false);
  };

  // Обработчик изменения количества вопросов
  const handleQuestionsCountChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setQuestionsCount(value);
    }
  };

  // Текущий вопрос
  const currentQuestion = randomQuestions[currentQuestionIndex];
  const questionData =
    currentQuestion !== undefined ? questionsData[currentQuestion] : null;

  // Анимация появления вариантов ответа
  useEffect(() => {
    if (questionData) {
      setAnswerAppear(Array(4).fill(false));
      questionData.answers.forEach((_, idx) => {
        setTimeout(() => {
          setAnswerAppear((prev) => {
            const arr = [...prev];
            arr[idx] = true;
            return arr;
          });
        }, idx * 150);
      });
    }
  }, [currentQuestionIndex, randomQuestions]);

  // Навигация
  const goToNextQuestion = () => {
    if (currentQuestionIndex + 1 < randomQuestions.length) {
      setFade(false);
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowAnswer(false);
        setPendingAnswer(null);
        setFade(true);
      }, 200);
    } else {
      setTestCompleted(true);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setFade(false);
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev - 1);
        setSelectedAnswer(null);
        setShowAnswer(false);
        setPendingAnswer(null);
        setFade(true);
      }, 200);
    }
  };

  // Обработчики свайпов
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNextQuestion();
    } else if (isRightSwipe) {
      goToPrevQuestion();
    }
  };

  // Обработчик клавиатуры
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        goToNextQuestion();
      } else if (e.key === "ArrowLeft") {
        goToPrevQuestion();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentQuestionIndex, randomQuestions.length]);

  // Обработка ответов
  const handleAnswerClick = (idx) => {
    if (showAnswer || userAnswers[currentQuestion] !== undefined) return;

    if (pendingAnswer === null) {
      setPendingAnswer(idx);
      setAnimateIdx(idx);
    } else if (pendingAnswer !== idx) {
      setPendingAnswer(idx);
      setAnimateIdx(idx);
    } else {
      setPendingAnswer(null);
      handleAnswer(idx);
    }
  };

  const handleAnswer = (index) => {
    if (userAnswers[currentQuestion] !== undefined || showAnswer) return;

    setSelectedAnswer(index);
    setAnimateIdx(index);

    const correct = questionData.answers[index].correct;
    const newUserAnswers = { ...userAnswers, [currentQuestion]: index };
    setUserAnswers(newUserAnswers);

    // ОБНОВЛЯЕМ АРХИВЫ С УКАЗАНИЕМ ТИПА ТЕСТА 'fast'
    updateAnswerArchives(currentQuestion, correct, index, "fast");

    if (correct) {
      setFastTestStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setFastTestStats((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }

    setShowAnswer(true);
    setTimeout(() => setAnimateIdx(null), 500);
  };

  const handleUnknown = () => {
    if (userAnswers[currentQuestion] !== undefined || showAnswer) return;

    const newUserAnswers = { ...userAnswers, [currentQuestion]: null };
    setUserAnswers(newUserAnswers);

    // ОБНОВЛЯЕМ АРХИВЫ С УКАЗАНИЕМ ТИПА ТЕСТА 'fast'
    updateAnswerArchives(currentQuestion, false, null, "fast");

    setFastTestStats((prev) => ({ ...prev, unknown: prev.unknown + 1 }));
    setShowAnswer(true);
    setSelectedAnswer(null);
  };

  const nextQuestion = () => {
    setAnimateIdx(null);
    setShowAnswer(false);
    setAnswerAppear(Array(4).fill(false));

    setFade(false);
    setTimeout(() => {
      if (currentQuestionIndex + 1 >= randomQuestions.length) {
        setTestCompleted(true);
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowAnswer(false);
        setPendingAnswer(null);
      }
      setFade(true);
    }, 300);
  };

  const restartTest = () => {
    const confirmRestart = window.confirm(
      "Начать новый быстрый тест? Текущие результаты будут потеряны.",
    );
    if (confirmRestart) {
      // ОЧИСТКА ПРЕДЫДУЩИХ ОТВЕТОВ БЫСТРОГО ТЕСТА
      localStorage.setItem("userAnswersFast", "{}");

      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setPendingAnswer(null);
      setTestCompleted(false);
      setFastTestStats({ correct: 0, incorrect: 0, unknown: 0 });
      setUserAnswers({});
      setShowStartScreen(true);
    }
  };

  const backToStartScreen = () => {
    setShowStartScreen(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setPendingAnswer(null);
    setTestCompleted(false);
    setFastTestStats({ correct: 0, incorrect: 0, unknown: 0 });
    setUserAnswers({});
  };

  // Прогресс
  const progressPercent =
    randomQuestions.length > 0
      ? ((currentQuestionIndex + 1) / randomQuestions.length) * 100
      : 0;

  // Экран начала теста
  if (showStartScreen) {
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
        <h1
          style={{
            textAlign: "center",
            margin: "20px 0",
            fontFamily: "'Inter', 'Arial', sans-serif",
            fontWeight: "400",
          }}
        >
          Быстрый тест
        </h1>

        <div style={cardStyle}>
          <p
            style={{ textAlign: "center", marginBottom: "20px", color: "#ccc" }}
          >
            Выберите количество вопросов для быстрого тестирования
          </p>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>
              Количество вопросов:
            </label>
            <input
              type="text"
              value={questionsCount}
              onChange={handleQuestionsCountChange}
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
            <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
              Доступно вопросов: {questionsData.length}
            </p>
          </div>

          <button
            style={{ ...buttonStyle, backgroundColor: "#4caf50" }}
            onClick={startTest}
            onMouseOver={(e) => handleButtonAnimation(e, true)}
            onMouseOut={(e) => handleButtonAnimation(e, false)}
            onMouseDown={(e) => handleButtonPress(e, true)}
            onMouseUp={(e) => handleButtonPress(e, false)}
          >
            Начать тест
          </button>
        </div>

        <div
          style={{
            backgroundColor: "#1e1e1e",
            borderRadius: 25,
            padding: 20,
            marginTop: 20,
            color: "#ccc",
            fontSize: "14px",
          }}
        >
          <h4>Как это работает:</h4>
          <ul style={{ paddingLeft: "20px" }}>
            <li>
              Выберите количество вопросов (от 1 до {questionsData.length})
            </li>
            <li>Вам будут показаны случайные вопросы из базы</li>
            <li>Отвечайте на вопросы и следите за своей статистикой</li>
            <li>В конце теста вы увидите подробные результаты</li>
          </ul>
        </div>

        {/* Кнопка "На главный экран" перемещена вниз */}
        <button
          style={{ ...buttonStyle, marginTop: "20px" }}
          onClick={() => setCurrentScreen("home")}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          На главный экран
        </button>
      </div>
    );
  }

  // Если тест завершен
  if (testCompleted) {
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
          style={buttonStyle}
          onClick={backToStartScreen}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          К выбору количества вопросов
        </button>

        <h1 style={{ textAlign: "center", margin: "20px 0" }}>
          Быстрый тест завершен!
        </h1>

        <div style={cardStyle}>
          <h2 style={{ textAlign: "center", color: "#4caf50" }}>Результаты</h2>
          <div
            style={{ textAlign: "center", fontSize: "18px", margin: "20px 0" }}
          >
            <p>Правильных: {fastTestStats.correct}</p>
            <p>Неправильных: {fastTestStats.incorrect}</p>
            <p>Не знаю: {fastTestStats.unknown}</p>
            <p style={{ marginTop: "15px", fontWeight: "bold" }}>
              Оценка:{" "}
              {((fastTestStats.correct / randomQuestions.length) * 100).toFixed(
                1,
              )}
              %
            </p>
          </div>

          <button
            style={buttonStyle}
            onClick={restartTest}
            onMouseOver={(e) => handleButtonAnimation(e, true)}
            onMouseOut={(e) => handleButtonAnimation(e, false)}
            onMouseDown={(e) => handleButtonPress(e, true)}
            onMouseUp={(e) => handleButtonPress(e, false)}
          >
            Начать новый быстрый тест
          </button>
        </div>

        {/* Показываем все вопросы с ответами */}
        <h2 style={{ textAlign: "center", margin: "30px 0 20px 0" }}>
          Детализация ответов
        </h2>

        {randomQuestions.map((questionId, index) => {
          const q = questionsData[questionId];
          const userAnswerIndex = userAnswers[questionId];

          return (
            <div key={index} style={{ ...cardStyle, marginTop: 15 }}>
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
                  {index + 1}. {q.question.replace(/^\d+\.\s*/, "")}
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
                {q.answers.map((a, j) => {
                  let bgColor = "#2c2c2c";
                  let textColor = "#ffffff";

                  if (a.correct) {
                    bgColor = "#4caf50";
                  } else if (userAnswerIndex === j && !a.correct) {
                    bgColor = "#f44336";
                  }

                  return (
                    <li
                      key={j}
                      style={{
                        padding: "12px",
                        margin: "8px 0",
                        borderRadius: 25,
                        backgroundColor: bgColor,
                        color: textColor,
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      {j + 1}) {a.text}
                    </li>
                  );
                })}
              </ul>

              <div style={{ marginTop: 10, color: "#ccc", fontSize: "14px" }}>
                {userAnswerIndex === undefined ? (
                  <p>Вы не ответили на этот вопрос</p>
                ) : userAnswerIndex === null ? (
                  <p>Вы выбрали: Не знаю</p>
                ) : (
                  <p>
                    Вы выбрали: {userAnswerIndex + 1}){" "}
                    {q.answers[userAnswerIndex].text}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        <button
          style={{ ...buttonStyle, marginTop: "20px" }}
          onClick={() => setCurrentScreen("home")}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          На главный экран
        </button>
      </div>
    );
  }

  // Основной экран теста
  if (!questionData) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "white",
          minHeight: "100vh",
          fontFamily: "'Inter', 'Arial', sans-serif",
        }}
      >
        <p>Загрузка вопросов...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "'Inter', 'Arial', sans-serif",
        maxWidth: 500,
        margin: "auto",
        backgroundColor: "#121212",
        color: "#ffffff",
        minHeight: "100vh",
      }}
    >
      {/* Прогрессбар */}
      <div
        style={{
          height: 12,
          backgroundColor: "#2c2c2c",
          borderRadius: 6,
          marginBottom: 20,
          overflow: "hidden",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: "100%",
            background: "linear-gradient(90deg, #4caf50, #81c784)",
            borderRadius: 6,
            transition: "width 0.6s ease, background 0.3s ease",
            boxShadow: "0 0 8px #4caf50",
          }}
        />
      </div>

      {/* Карточка вопроса */}
      <div
        style={cardStyle}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "15px",
          }}
        >
          <h2
            style={{
              fontSize: 18,
              margin: 0,
              flex: 1,
              marginRight: "15px",
              lineHeight: "1.4",
            }}
          >
            {currentQuestionIndex + 1}.{" "}
            {questionData.question.replace(/^\d+\.\s*/, "")}
          </h2>
          <FavoriteStar questionId={currentQuestion} />
        </div>

        {/* Картинка, если есть */}
        {photoQuestionNumbers.includes(currentQuestion + 1) && (
          <div style={{ marginTop: 12 }}>
            <img
              src={`/images/${currentQuestion + 1}.png`}
              alt={`Фото к вопросу ${currentQuestion + 1}`}
              loading="lazy"
              style={{
                width: "100%",
                maxHeight: 280,
                objectFit: "contain",
                borderRadius: 8,
                display: "block",
                boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
                marginTop: 8,
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Навигационные стрелки */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <button
            className="nav-button"
            onClick={goToPrevQuestion}
            disabled={currentQuestionIndex === 0}
            style={{
              background: "none",
              border: "none",
              cursor: currentQuestionIndex === 0 ? "default" : "pointer",
              padding: "8px",
              opacity: currentQuestionIndex === 0 ? 0.3 : 1,
              transition: "opacity 0.2s ease",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseOver={(e) => {
              if (currentQuestionIndex > 0) {
                e.target.style.opacity = "0.8";
              }
            }}
            onMouseOut={(e) => {
              if (currentQuestionIndex > 0) {
                e.target.style.opacity = "1";
              }
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <span style={{ color: "#666", fontSize: "14px" }}>
            {currentQuestionIndex + 1} / {randomQuestions.length}
          </span>

          <button
            className="nav-button"
            onClick={goToNextQuestion}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              opacity: 1,
              transition: "opacity 0.2s ease",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseOver={(e) => {
              e.target.style.opacity = "0.8";
            }}
            onMouseOut={(e) => {
              e.target.style.opacity = "1";
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Варианты ответов */}
        <ul style={{ listStyle: "none", padding: 0, marginTop: 15 }}>
          {questionData.answers.map((ans, idx) => {
            let bgColor = "#2c2c2c";

            if (userAnswers[currentQuestion] !== undefined) {
              const userAns = userAnswers[currentQuestion];
              if (ans.correct) {
                bgColor = "#4caf50";
              } else if (userAns !== null && userAns === idx && !ans.correct) {
                bgColor = "#f44336";
              } else {
                bgColor = "#2c2c2c";
              }
            } else if (showAnswer) {
              if (ans.correct) {
                bgColor = "#4caf50";
              } else if (selectedAnswer === idx && !ans.correct) {
                bgColor = "#f44336";
              } else {
                bgColor = "#2c2c2c";
              }
            } else {
              if (pendingAnswer === idx) {
                bgColor = "#64B5F6";
              } else {
                bgColor = "#2c2c2c";
              }
            }

            return (
              <li
                key={idx}
                onClick={() => handleAnswerClick(idx)}
                style={{
                  padding: 12,
                  margin: "8px 0",
                  borderRadius: 25,
                  backgroundColor: bgColor,
                  cursor:
                    userAnswers[currentQuestion] !== undefined
                      ? "not-allowed"
                      : "pointer",
                  color: "#ffffff",
                  transition: "background-color 0.2s ease, opacity 0.2s ease",
                  opacity: answerAppear[idx] ? 1 : 0,
                  transform: answerAppear[idx]
                    ? "translateY(0)"
                    : "translateY(15px)",
                }}
              >
                {ans.text}
              </li>
            );
          })}
        </ul>

        {/* Кнопки "Не знаю" и "Следующий вопрос" */}
        {userAnswers[currentQuestion] === undefined && !showAnswer && (
          <button
            onClick={handleUnknown}
            style={buttonStyle}
            onMouseOver={(e) => handleButtonAnimation(e, true)}
            onMouseOut={(e) => handleButtonAnimation(e, false)}
            onMouseDown={(e) => handleButtonPress(e, true)}
            onMouseUp={(e) => handleButtonPress(e, false)}
          >
            НЕ ЗНАЮ
          </button>
        )}

        {(userAnswers[currentQuestion] !== undefined || showAnswer) && (
          <button
            onClick={nextQuestion}
            style={buttonStyle}
            onMouseOver={(e) => handleButtonAnimation(e, true)}
            onMouseOut={(e) => handleButtonAnimation(e, false)}
            onMouseDown={(e) => handleButtonPress(e, true)}
            onMouseUp={(e) => handleButtonPress(e, false)}
          >
            {currentQuestionIndex + 1 === randomQuestions.length
              ? "Завершить тест"
              : "Следующий вопрос"}
          </button>
        )}

        {/* Статистика */}
        <div style={{ marginTop: 20, fontSize: 16 }}>
          <p>Правильных: {fastTestStats.correct}</p>
          <p>Неправильных: {fastTestStats.incorrect}</p>
          <p>Не знаю: {fastTestStats.unknown}</p>
        </div>
      </div>

      {/* Кнопки управления */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={backToStartScreen}
          style={buttonStyle}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          К выбору количества вопросов
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => setCurrentScreen("home")}
          style={buttonStyle}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          На главный экран
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <button
          onClick={restartTest}
          style={buttonStyle}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          Начать сначала
        </button>
      </div>
    </div>
  );
};

export default FastTestScreen;
