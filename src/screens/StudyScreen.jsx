// src/screens/StudyScreen.jsx
import React, { useState, useEffect, useRef } from "react";
import questionsData from "../questions.json";
import FavoriteStar from "../components/FavoriteStar";
import {
  handleStudyAnswer,
  getStudyTestQuestions,
  getStudyStats,
  getStudyQuestionCounters,
  getCombinedUserAnswers,
} from "../utils/archiveUtils";
import "../App.css";
import AIChat from "../components/AIChat";

const StudyScreen = ({ setCurrentScreen }) => {
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
  const [studyQuestions, setStudyQuestions] = useState([]);
  const [studyStats, setStudyStats] = useState({
    total: 0,
    unknown: 0,
    incorrect: 0,
  });
  const [userAnswers, setUserAnswers] = useState({});
  const [quickSearchInput, setQuickSearchInput] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [returnToIndex, setReturnToIndex] = useState(null);
  const [testResults, setTestResults] = useState({
    correct: 0,
    incorrect: 0,
    unknown: 0,
  });

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

  // Загрузка статистики изучения и установка значения по умолчанию
  useEffect(() => {
    const stats = getStudyStats();
    setStudyStats(stats);

    // Устанавливаем значение по умолчанию: минимум между 10 и общим количеством вопросов
    const defaultCount = Math.min(10, stats.total);
    setQuestionsCount(defaultCount > 0 ? defaultCount.toString() : "0");
  }, [showStartScreen]);

  // Обработчик изменения количества вопросов
  const handleQuestionsCountChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setQuestionsCount(value);
    }
  };

  // Генерация вопросов для изучения с проверкой ввода
  const generateStudyQuestions = () => {
    const count = parseInt(questionsCount);

    if (isNaN(count) || count < 1) {
      alert("Количество вопросов должно быть не менее 1");
      // Устанавливаем корректное значение по умолчанию
      const defaultCount = Math.min(10, studyStats.total);
      setQuestionsCount(defaultCount > 0 ? defaultCount.toString() : "10");
      return;
    }

    const currentStats = getStudyStats();
    if (count > currentStats.total) {
      alert(`Максимальное количество вопросов: ${currentStats.total}`);
      setQuestionsCount(String(currentStats.total));
      return;
    }

    if (currentStats.total === 0) {
      alert("Нет вопросов для изучения");
      return;
    }

    const questions = getStudyTestQuestions(count);
    console.log(`Сгенерировано ${questions.length} вопросов для изучения`);

    if (questions.length === 0) {
      alert("Нет доступных вопросов для изучения");
      return;
    }

    setStudyQuestions(questions);
    setShowStartScreen(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setPendingAnswer(null);
    setUserAnswers({});
    setTestCompleted(false);
    setTestResults({ correct: 0, incorrect: 0, unknown: 0 });
  };

  // Текущий вопрос
  const currentQuestionId = studyQuestions[currentQuestionIndex];
  const questionData =
    currentQuestionId !== undefined ? questionsData[currentQuestionId] : null;

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
  }, [currentQuestionIndex, studyQuestions]);

  // Навигация
  const goToNextQuestion = () => {
    if (currentQuestionIndex + 1 < studyQuestions.length) {
      if (!isPreviewMode && returnToIndex === null) {
        setReturnToIndex(currentQuestionIndex);
      }

      setFade(false);
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowAnswer(false);
        setPendingAnswer(null);

        if (currentQuestionIndex + 1 === returnToIndex) {
          setIsPreviewMode(false);
        } else {
          setIsPreviewMode(true);
        }

        setFade(true);
      }, 200);
    } else {
      setTestCompleted(true);
      console.log("Тест завершен");
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      if (!isPreviewMode && returnToIndex === null) {
        setReturnToIndex(currentQuestionIndex);
      }

      setFade(false);
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev - 1);
        setSelectedAnswer(null);
        setShowAnswer(false);
        setPendingAnswer(null);

        if (currentQuestionIndex - 1 === returnToIndex) {
          setIsPreviewMode(false);
        } else {
          setIsPreviewMode(true);
        }

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

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

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
  }, [currentQuestionIndex, studyQuestions.length]);

  // Обработчики ответов
  const handleAnswerClick = (idx) => {
    if (showAnswer || userAnswers[currentQuestionId] !== undefined) return;

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
    if (userAnswers[currentQuestionId] !== undefined || showAnswer) return;

    setSelectedAnswer(index);
    setAnimateIdx(index);

    const correct = questionData.answers[index].correct;

    // Обновляем через систему изучения
    handleStudyAnswer(currentQuestionId, correct, index);

    // Обновляем локальные ответы
    setUserAnswers((prev) => ({ ...prev, [currentQuestionId]: index }));

    // Обновляем статистику результатов
    if (correct) {
      setTestResults((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setTestResults((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }

    // ОБНОВЛЯЕМ СТАТИСТИКУ АРХИВА В РЕАЛЬНОМ ВРЕМЕНИ
    setTimeout(() => {
      setStudyStats(getStudyStats());
    }, 100);

    setShowAnswer(true);
    setTimeout(() => setAnimateIdx(null), 500);
  };

  const handleUnknown = () => {
    if (userAnswers[currentQuestionId] !== undefined || showAnswer) return;

    // Обновляем через систему изучения
    handleStudyAnswer(currentQuestionId, false, null);

    setShowAnswer(true);
    setSelectedAnswer(null);
    setUserAnswers((prev) => ({ ...prev, [currentQuestionId]: null }));
    setTestResults((prev) => ({ ...prev, unknown: prev.unknown + 1 }));

    // ОБНОВЛЯЕМ СТАТИСТИКУ АРХИВА В РЕАЛЬНОМ ВРЕМЕНИ
    setTimeout(() => {
      setStudyStats(getStudyStats());
    }, 100);
  };

  const nextQuestion = () => {
    setAnimateIdx(null);
    setShowAnswer(false);
    setAnswerAppear(Array(4).fill(false));

    setFade(false);
    setTimeout(() => {
      if (currentQuestionIndex + 1 >= studyQuestions.length) {
        // Если это последний вопрос, завершаем тест
        setTestCompleted(true);
        console.log("Тест завершен");
      } else {
        // Переходим к следующему вопросу
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowAnswer(false);
        setPendingAnswer(null);
        console.log(`Переход к вопросу ${currentQuestionIndex + 2}`);
      }
      setFade(true);
    }, 300);
  };

  // Поиск вопроса
  const handleSearch = () => {
    const val = quickSearchInput.trim();
    if (!val) return;

    const num = Number(val);

    // 🔴 ИСПРАВЛЕНИЕ: Если ищем текущий вопрос и не в режиме просмотра - ничего не делаем
    if (!Number.isNaN(num) && num >= 1 && num <= studyQuestions.length) {
      const newIndex = num - 1;

      // ЕСЛИ НОВЫЙ ИНДЕКС РАВЕН ТЕКУЩЕМУ И МЫ НЕ В РЕЖИМЕ ПРОСМОТРА - ВЫХОДИМ
      if (newIndex === currentQuestionIndex && !isPreviewMode) {
        return;
      }

      if (!isPreviewMode && returnToIndex === null) {
        setReturnToIndex(currentQuestionIndex);
      }

      setCurrentQuestionIndex(newIndex);
      setSelectedAnswer(null);
      setShowAnswer(false);

      if (newIndex === returnToIndex) {
        setIsPreviewMode(false);
      } else {
        setIsPreviewMode(true);
      }
      return;
    }

    const lowered = val.toLowerCase();
    const foundIdx = studyQuestions.findIndex((qId) =>
      questionsData[qId].question.toLowerCase().includes(lowered),
    );

    // 🔴 ИСПРАВЛЕНИЕ: Та же проверка для текстового поиска
    if (foundIdx >= 0) {
      // ЕСЛИ НАЙДЕННЫЙ ИНДЕКС РАВЕН ТЕКУЩЕМУ И МЫ НЕ В РЕЖИМЕ ПРОСМОТРА - ВЫХОДИМ
      if (foundIdx === currentQuestionIndex && !isPreviewMode) {
        return;
      }

      if (!isPreviewMode && returnToIndex === null) {
        setReturnToIndex(currentQuestionIndex);
      }

      setCurrentQuestionIndex(foundIdx);
      setSelectedAnswer(null);
      setShowAnswer(false);

      if (foundIdx === returnToIndex) {
        setIsPreviewMode(false);
      } else {
        setIsPreviewMode(true);
      }
    } else {
      alert("Вопрос не найден");
    }
  };

  const handleReturnToTest = () => {
    if (returnToIndex === null) return;

    setFade(false);
    setTimeout(() => {
      setCurrentQuestionIndex(returnToIndex);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setPendingAnswer(null);
      setIsPreviewMode(false);
      setReturnToIndex(null);
      setFade(true);
    }, 200);
  };

  const backToStartScreen = () => {
    setShowStartScreen(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setPendingAnswer(null);
    setTestCompleted(false);
    setUserAnswers({});
    setTestResults({ correct: 0, incorrect: 0, unknown: 0 });
    // ОБНОВЛЯЕМ СТАТИСТИКУ ПРИ ВОЗВРАТЕ
    setStudyStats(getStudyStats());
  };

  // В StudyScreen.jsx заменяем функцию restartTest:

  const restartTest = () => {
    const confirmRestart = window.confirm(
      "Начать новый тест изучения? Текущие результаты будут потеряны.",
    );
    if (confirmRestart) {
      // ОБНОВЛЯЕМ список вопросов из актуального архива
      const currentStats = getStudyStats();
      const count = Math.min(
        parseInt(questionsCount) || 10,
        currentStats.total,
      );

      if (count < 1) {
        alert("Нет доступных вопросов для изучения");
        backToStartScreen();
        return;
      }

      const questions = getStudyTestQuestions(count);
      console.log(`Новый тест: ${questions.length} вопросов`);

      // ОБНОВЛЯЕМ СТАТИСТИКУ
      setStudyStats(currentStats);

      setStudyQuestions(questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setPendingAnswer(null);
      setTestCompleted(false);
      setUserAnswers({});
      setTestResults({ correct: 0, incorrect: 0, unknown: 0 });
    }
  };

  // Прогресс
  const progressPercent =
    studyQuestions.length > 0
      ? ((currentQuestionIndex + 1) / studyQuestions.length) * 100
      : 0;

  // Если вопросы закончились во время теста
  if (studyQuestions.length === 0 && !showStartScreen && !testCompleted) {
    console.log("Вопросы закончились во время теста");
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

        <h1
          style={{
            textAlign: "center",
            margin: "20px 0",
            fontFamily: "'Inter', 'Arial', sans-serif",
            fontWeight: "400",
          }}
        >
          Вопросы закончились!
        </h1>

        <div style={cardStyle}>
          <p style={{ textAlign: "center" }}>
            Все вопросы из архива изучения были пройдены и удалены.
          </p>
          <p style={{ textAlign: "center", marginTop: "10px" }}>
            Новые вопросы появятся, когда вы ответите "Не знаю" или неправильно
            в других тестах.
          </p>
        </div>

        <button
          style={buttonStyle}
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
          Изучать
        </h1>

        <div style={cardStyle}>
          <p
            style={{ textAlign: "center", marginBottom: "20px", color: "#ccc" }}
          >
            Изучайте вопросы, на которые вы ответили неправильно или не знали
            ответ
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
              Доступно вопросов: {studyStats.total}
            </p>
          </div>

          <button
            style={{
              ...buttonStyle,
              backgroundColor: studyStats.total > 0 ? "#4caf50" : "#666",
            }}
            onClick={generateStudyQuestions}
            disabled={studyStats.total === 0}
            onMouseOver={(e) => handleButtonAnimation(e, true)}
            onMouseOut={(e) => handleButtonAnimation(e, false)}
            onMouseDown={(e) => handleButtonPress(e, true)}
            onMouseUp={(e) => handleButtonPress(e, false)}
          >
            {studyStats.total > 0
              ? "Начать изучение"
              : "Нет вопросов для изучения"}
          </button>
        </div>

        {/* Статистика изучения */}
        <div style={{ ...cardStyle, marginTop: 20 }}>
          <h3>Статистика изучения</h3>
          <p>Всего вопросов: {studyStats.total}</p>
          <p>Не знаю: {studyStats.unknown}</p>
          <p>Неправильные: {studyStats.incorrect}</p>
        </div>

        {/* Инструкция */}
        <div
          style={{
            ...cardStyle,
            marginTop: 20,
            color: "#ccc",
            fontSize: "14px",
          }}
        >
          <h4>Как это работает:</h4>
          <ul style={{ paddingLeft: "20px" }}>
            <li>Выберите количество вопросов (от 1 до {studyStats.total})</li>
            <li>Вам будут показаны вопросы из архива изучения</li>
            <li>Отвечайте на вопросы и следите за своей статистикой</li>
            <li>В конце теста вы увидите подробные результаты</li>
            <li>Вопросы с высоким счетчиком показываются чаще</li>
          </ul>
        </div>

        <button
          style={{ ...buttonStyle, marginTop: 20 }}
          onClick={() => setCurrentScreen("home")}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          На главный экран
        </button>

        <button
          style={buttonStyle}
          onClick={() => setCurrentScreen("study-archive")}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          Архив "Изучать"
        </button>
      </div>
    );
  }

  // Если тест завершен
  if (testCompleted) {
    const totalAnswered =
      testResults.correct + testResults.incorrect + testResults.unknown;
    const score =
      totalAnswered > 0
        ? ((testResults.correct / totalAnswered) * 100).toFixed(1)
        : 0;

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

        <h1
          style={{
            textAlign: "center",
            margin: "20px 0",
            fontFamily: "'Inter', 'Arial', sans-serif",
            fontWeight: "400",
          }}
        >
          Изучение завершено!
        </h1>

        <div style={cardStyle}>
          <h2 style={{ textAlign: "center", color: "#4caf50" }}>Результаты</h2>
          <div
            style={{ textAlign: "center", fontSize: "18px", margin: "20px 0" }}
          >
            <p>Правильных: {testResults.correct}</p>
            <p>Неправильных: {testResults.incorrect}</p>
            <p>Не знаю: {testResults.unknown}</p>
            <p style={{ marginTop: "15px", fontWeight: "bold" }}>
              Оценка: {score}%
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
            Начать новый тест
          </button>
        </div>

        {/* Детализация ответов */}
        <h2 style={{ textAlign: "center", margin: "30px 0 20px 0" }}>
          Детализация ответов
        </h2>

        {studyQuestions.map((questionId, index) => {
          const q = questionsData[questionId];
          const userAnswerIndex = userAnswers[questionId];
          const counters = getStudyQuestionCounters();
          const counter = counters[questionId] || 0;

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
                <p>Счетчик: {counter}</p>
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
          onClick={() => setCurrentScreen("study-archive")}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          Архив "Изучать"
        </button>

        <button
          style={buttonStyle}
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

  // Основной экран вопроса
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

  const counters = getStudyQuestionCounters();
  const currentCounter = counters[currentQuestionId] || 0;
  const userAnswersCombined = getCombinedUserAnswers();
  const wasAnswered = userAnswersCombined[currentQuestionId] !== undefined;
  const prevSelected = userAnswersCombined[currentQuestionId];

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
      {/* Прогресс бар */}
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

      <div
        style={{
          textAlign: "center",
          color: "#4caf50",
          fontSize: "16px",
          marginBottom: "10px",
          fontWeight: "500",
        }}
      >
        Изучать
      </div>

      {/* Быстрый поиск */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Номер или текст вопроса..."
          value={quickSearchInput}
          onChange={(e) => setQuickSearchInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 25,
            border: "none",
            fontSize: 15,
            backgroundColor: "#1b1b1b",
            color: "#fff",
            fontFamily: "'Inter', 'Arial', sans-serif",
            outline: "none",
          }}
        />
        <button
          style={{
            padding: 10,
            borderRadius: 25,
            border: "none",
            backgroundColor: "#333",
            color: "#fff",
            cursor: "pointer",
            minWidth: 90,
            fontFamily: "'Inter', 'Arial', sans-serif",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
          onClick={handleSearch}
        >
          Найти
        </button>
      </div>

      {/* Индикатор режима просмотра */}
      {isPreviewMode && returnToIndex !== null && (
        <div
          style={{
            textAlign: "center",
            color: "#ff9800",
            fontSize: "14px",
            marginBottom: "10px",
          }}
        >
          Режим просмотра • Вернуться к вопросу {returnToIndex + 1}
        </div>
      )}

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
            position: "relative",
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
            {currentQuestionId + 1}.{" "}
            {questionData.question.replace(/^\d+\.\s*/, "")}
          </h2>
          <div
            style={{
              marginTop: "-5px",
              flexShrink: 0,
            }}
          >
            <FavoriteStar questionId={currentQuestionId} />
          </div>
        </div>

        {/* Картинка вопроса */}
        {photoQuestionNumbers.includes(currentQuestionId + 1) && (
          <div style={{ marginTop: 12 }}>
            <img
              src={`/images/${currentQuestionId + 1}.png`}
              alt={`Фото к вопросу ${currentQuestionId + 1}`}
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
            {currentQuestionIndex + 1} / {studyQuestions.length}
          </span>

          <button
            onClick={goToNextQuestion}
            disabled={currentQuestionIndex === studyQuestions.length - 1}
            style={{
              background: "none",
              border: "none",
              cursor:
                currentQuestionIndex === studyQuestions.length - 1
                  ? "default"
                  : "pointer",
              padding: "8px",
              opacity:
                currentQuestionIndex === studyQuestions.length - 1 ? 0.3 : 1,
              transition: "opacity 0.2s ease",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseOver={(e) => {
              if (currentQuestionIndex < studyQuestions.length - 1) {
                e.target.style.opacity = "0.8";
              }
            }}
            onMouseOut={(e) => {
              if (currentQuestionIndex < studyQuestions.length - 1) {
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
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Варианты ответов */}
        <ul style={{ listStyle: "none", padding: 0, marginTop: 15 }}>
          {questionData.answers.map((ans, idx) => {
            let bgColor = "#2c2c2c";
            const canAnswer =
              !isPreviewMode && userAnswers[currentQuestionId] === undefined;

            if (userAnswers[currentQuestionId] !== undefined) {
              const userAns = userAnswers[currentQuestionId];
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
                onClick={() => {
                  if (
                    isPreviewMode ||
                    userAnswers[currentQuestionId] !== undefined
                  )
                    return;
                  handleAnswerClick(idx);
                }}
                style={{
                  padding: 12,
                  margin: "8px 0",
                  borderRadius: 25,
                  backgroundColor: bgColor,
                  cursor:
                    isPreviewMode ||
                    userAnswers[currentQuestionId] !== undefined
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

        {/* Кнопки управления */}
        {!isPreviewMode ? (
          <>
            {userAnswers[currentQuestionId] === undefined && !showAnswer && (
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

            {(userAnswers[currentQuestionId] !== undefined || showAnswer) && (
              <button
                onClick={nextQuestion}
                style={buttonStyle}
                onMouseOver={(e) => handleButtonAnimation(e, true)}
                onMouseOut={(e) => handleButtonAnimation(e, false)}
                onMouseDown={(e) => handleButtonPress(e, true)}
                onMouseUp={(e) => handleButtonPress(e, false)}
              >
                Следующий вопрос
              </button>
            )}
          </>
        ) : (
          returnToIndex !== null &&
          returnToIndex !== currentQuestionIndex && (
            <button
              style={buttonStyle}
              onClick={() => {
                handleReturnToTest();
                setIsPreviewMode(false);
              }}
              onMouseOver={(e) => handleButtonAnimation(e, true)}
              onMouseOut={(e) => handleButtonAnimation(e, false)}
              onMouseDown={(e) => handleButtonPress(e, true)}
              onMouseUp={(e) => handleButtonPress(e, false)}
            >
              Вернуться к тесту
            </button>
          )
        )}

        {/* Счетчик и статистика */}
        <div style={{ marginTop: 20, fontSize: 16 }}>
          <p>Счетчик: {currentCounter}</p>
        </div>
      </div>

      {/* Нижние кнопки */}
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
          onClick={() => setCurrentScreen("study-archive")}
          style={buttonStyle}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          Архив "Изучать"
        </button>
      </div>
      <AIChat
        currentQuestion={questionData}
        userAnswer={selectedAnswer}
        isAnswerCorrect={
          showAnswer
            ? selectedAnswer !== null
              ? questionData.answers[selectedAnswer].correct
              : false
            : null
        }
      />
    </div>
  );
};

export default StudyScreen;
