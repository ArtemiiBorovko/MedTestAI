import React, { useState, useEffect, useRef } from "react";
import questionsData from "../questions.json";
import FavoriteStar from "../components/FavoriteStar";
import {
  updateAnswerArchives,
  getUserAnswersByType,
} from "../utils/archiveUtils";
import { useTestState } from "../hooks/useTestState";
import "../App.css";
import AIChat from "../components/AIChat";

const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
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

function BacteriologyTestScreen({ setCurrentScreen }) {
  const { state, updateStats, updateUserAnswer, resetAll } = useTestState();
  const { stats, userAnswers } = state;

  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [quickSearchInput, setQuickSearchInput] = useState("");
  const [returnToIndex, setReturnToIndex] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [fade, setFade] = useState(true);
  const [answerAppear, setAnswerAppear] = useState(Array(4).fill(false));
  const [animateIdx, setAnimateIdx] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;
  const initializedRef = useRef(false);

  // Фильтруем вопросы только по бактериологии
  const categoryQuestions = questionsData.filter(
    (q) => q.category === "bacteriology",
  );
  const totalQuestions = categoryQuestions.length;

  // Получаем оригинальный ID вопроса для картинок и архива
  const getOriginalQuestionId = () => {
    if (currentQuestion < categoryQuestions.length) {
      return categoryQuestions[currentQuestion].id - 1;
    }
    return 0;
  };

  // НАЙТИ ГРАНИЦУ ПРОГРЕССА В КАТЕГОРИИ
  const findProgressBoundary = () => {
    let lastAnsweredBeforeGap = -1;

    for (let i = 0; i < categoryQuestions.length; i++) {
      const originalId = categoryQuestions[i].id - 1;
      if (userAnswers[originalId] !== undefined) {
        lastAnsweredBeforeGap = i;
      } else {
        // Нашли первый неотвеченный - возвращаем последний отвеченный перед ним
        return lastAnsweredBeforeGap >= 0 ? lastAnsweredBeforeGap : 0;
      }
    }

    // Если все вопросы отвечены, возвращаем последний
    return categoryQuestions.length - 1;
  };

  // НАЙТИ СЛЕДУЮЩИЙ НЕОТВЕЧЕННЫЙ ВОПРОС В КАТЕГОРИИ
  const findNextUnansweredQuestion = (startFrom = 0) => {
    for (let i = startFrom; i < categoryQuestions.length; i++) {
      const originalId = categoryQuestions[i].id - 1;
      if (userAnswers[originalId] === undefined) {
        return i;
      }
    }
    return categoryQuestions.length; // Все вопросы отвечены
  };

  const photoQuestionNumbers = [
    53, 138, 143, 275, 278, 280, 281, 318, 319, 321, 382, 386, 387, 474, 482,
    502, 508, 584, 627, 628, 684, 689, 752, 753, 825, 850, 851, 914, 964, 965,
    978, 1093, 1164, 1173, 1256, 1408, 1447, 1448, 1492, 1521, 1551, 1575, 1678,
    1679, 1732, 1764, 1781, 2048, 2071, 2092, 2125, 2175, 2180, 2184, 2206,
    2212,
  ];

  // Навигация
  const goToNextQuestion = () => {
    if (currentQuestion + 1 < categoryQuestions.length) {
      if (!isPreviewMode && returnToIndex === null) {
        setReturnToIndex(currentQuestion);
      }

      setFade(false);
      setTimeout(() => {
        const newIndex = currentQuestion + 1;
        setCurrentQuestion(newIndex);
        setSelectedAnswer(null);
        setShowAnswer(false);
        setPendingAnswer(null);

        if (newIndex === returnToIndex) {
          setIsPreviewMode(false);
        } else {
          setIsPreviewMode(true);
        }

        setFade(true);
      }, 200);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestion > 0) {
      if (!isPreviewMode && returnToIndex === null) {
        setReturnToIndex(currentQuestion);
      }

      setFade(false);
      setTimeout(() => {
        const newIndex = currentQuestion - 1;
        setCurrentQuestion(newIndex);
        setSelectedAnswer(null);
        setShowAnswer(false);
        setPendingAnswer(null);

        if (newIndex === returnToIndex) {
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
  }, [currentQuestion, categoryQuestions.length]);

  // ИНИЦИАЛИЗАЦИЯ: установить текущий вопрос на границу прогресса в категории
  useEffect(() => {
    if (!initializedRef.current) {
      const progressBoundary = findProgressBoundary();
      //console.log(
      // "Initializing BacteriologyTestScreen at boundary:",
      //  progressBoundary,
      //);
      setCurrentQuestion(progressBoundary);
      initializedRef.current = true;
    }

    setReturnToIndex(null);
    setIsPreviewMode(false);
    document.title = "Бактериология - Medical Test";
  }, [userAnswers]);

  // Анимация ответов
  useEffect(() => {
    if (currentQuestion < categoryQuestions.length) {
      setAnswerAppear(Array(4).fill(false));
      categoryQuestions[currentQuestion].answers.forEach((_, idx) => {
        setTimeout(() => {
          setAnswerAppear((prev) => {
            const arr = [...prev];
            arr[idx] = true;
            return arr;
          });
        }, idx * 150);
      });
    }
  }, [currentQuestion]);

  // Предзагрузка картинок
  useEffect(() => {
    if (currentQuestion + 1 < categoryQuestions.length) {
      const nextQuestion = categoryQuestions[currentQuestion + 1];
      if (nextQuestion) {
        const nextOriginalId = nextQuestion.id;
        const nextSrc = `/images/${nextOriginalId}.png`;
        preloadImage(nextSrc).catch(() => {
          //  console.log(`Image not found: ${nextSrc}`);
        });
      }
    }
  }, [currentQuestion]);

  // Обработчик клика с двойным нажатием
  const handleAnswerClick = (idx) => {
    if (showAnswer) return;

    const originalQuestionId = getOriginalQuestionId();

    if (userAnswers[originalQuestionId] !== undefined) return;

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

  // Обработка ответа
  const handleAnswer = (index) => {
    const originalQuestionId = getOriginalQuestionId();

    if (userAnswers[originalQuestionId] !== undefined) return;
    if (showAnswer) return;

    setSelectedAnswer(index);
    setAnimateIdx(index);

    const correct = categoryQuestions[currentQuestion].answers[index].correct;

    // Используем оригинальный ID для архивации
    updateAnswerArchives(originalQuestionId, correct, index, "main");

    // Обновляем ЕДИНУЮ статистику через useTestState
    if (correct) {
      updateStats({ correct: stats.correct + 1 });
    } else {
      updateStats({ incorrect: stats.incorrect + 1 });
    }

    // Обновляем ЕДИНЫЕ userAnswers через useTestState
    updateUserAnswer(originalQuestionId, index);

    setShowAnswer(true);

    setTimeout(() => setAnimateIdx(null), 500);
  };

  // Обработчик "Не знаю"
  const handleUnknown = () => {
    const originalQuestionId = getOriginalQuestionId();

    if (userAnswers[originalQuestionId] !== undefined) return;
    if (showAnswer) return;

    // Обновляем архивы
    updateAnswerArchives(originalQuestionId, false, null, "main");

    // Обновляем ЕДИНУЮ статистику через useTestState
    updateStats({ unknown: stats.unknown + 1 });

    // Обновляем ЕДИНЫЕ userAnswers через useTestState
    updateUserAnswer(originalQuestionId, null);

    setShowAnswer(true);
    setSelectedAnswer(null);

    setTimeout(() => setAnimateIdx(null), 500);
  };

  // Следующий вопрос ведет к следующему неотвеченному в категории
  const nextQuestion = () => {
    setAnimateIdx(null);
    setShowAnswer(false);
    setAnswerAppear(Array(4).fill(false));

    setFade(false);
    setTimeout(() => {
      const nextUnanswered = findNextUnansweredQuestion(currentQuestion + 1);

      if (nextUnanswered >= categoryQuestions.length) {
        setCurrentQuestion(categoryQuestions.length);
      } else {
        setCurrentQuestion(nextUnanswered);
        setSelectedAnswer(null);
        setShowAnswer(false);
        setPendingAnswer(null);
      }
      setFade(true);
      setIsPreviewMode(false);
      setReturnToIndex(null);
    }, 300);
  };

  // Перезапуск теста
  const restartTest = () => {
    const confirmRestart = window.confirm(
      "Если вы нажмёте продолжить, вы начнете ВСЕ основные тесты сначала и ваша статистика сбросится, но архив сохранится.",
    );
    if (confirmRestart) {
      resetAll();
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setPendingAnswer(null);
      setReturnToIndex(null);
      setIsPreviewMode(false);
      initializedRef.current = false;
    }
  };

  const handleSearch = () => {
    const val = quickSearchInput.trim();
    if (!val) return;

    const num = Number(val);

    // 🔴 ИСПРАВЛЕНИЕ: Если ищем текущий вопрос и не в режиме просмотра - ничего не делаем
    if (!Number.isNaN(num) && num >= 1 && num <= totalQuestions) {
      const newIndex = num - 1;

      // ЕСЛИ НОВЫЙ ИНДЕКС РАВЕН ТЕКУЩЕМУ И МЫ НЕ В РЕЖИМЕ ПРОСМОТРА - ВЫХОДИМ
      if (newIndex === currentQuestion && !isPreviewMode) {
        return;
      }

      if (!isPreviewMode && returnToIndex === null) {
        setReturnToIndex(currentQuestion);
      }

      setCurrentQuestion(newIndex);
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
    const foundIdx = categoryQuestions.findIndex((q) =>
      q.question.toLowerCase().includes(lowered),
    );

    // 🔴 ИСПРАВЛЕНИЕ: Та же проверка для текстового поиска
    if (foundIdx >= 0) {
      // ЕСЛИ НАЙДЕННЫЙ ИНДЕКС РАВЕН ТЕКУЩЕМУ И МЫ НЕ В РЕЖИМЕ ПРОСМОТРА - ВЫХОДИМ
      if (foundIdx === currentQuestion && !isPreviewMode) {
        return;
      }

      if (!isPreviewMode && returnToIndex === null) {
        setReturnToIndex(currentQuestion);
      }

      setCurrentQuestion(foundIdx);
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
      setCurrentQuestion(returnToIndex);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setPendingAnswer(null);
      setIsPreviewMode(false);
      setReturnToIndex(null);
      setFade(true);
    }, 200);
  };

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

  const progressPercent =
    currentQuestion < totalQuestions
      ? ((currentQuestion / totalQuestions) * 100).toFixed(1)
      : 100;

  const originalQuestionId = getOriginalQuestionId();
  const wasAnswered = userAnswers[originalQuestionId] !== undefined;

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
      {currentQuestion < totalQuestions && (
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
      )}

      <div
        style={{
          textAlign: "center",
          color: "#4caf50",
          fontSize: "16px",
          marginBottom: "10px",
          fontWeight: "500",
        }}
      >
        Бактериология
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

      {/* Карточка вопроса */}
      {currentQuestion < totalQuestions ? (
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
              {currentQuestion + 1}.{" "}
              {categoryQuestions[currentQuestion].question.replace(
                /^\d+\.\s*/,
                "",
              )}
            </h2>
            <div
              style={{
                marginTop: "-5px",
                flexShrink: 0,
              }}
            >
              <FavoriteStar questionId={originalQuestionId} />
            </div>
          </div>

          {/* Картинка вопроса */}
          {photoQuestionNumbers.includes(originalQuestionId + 1) && (
            <div style={{ marginTop: 12 }}>
              <img
                key={originalQuestionId}
                src={`/images/${originalQuestionId + 1}.png`}
                alt={`Фото к вопросу ${originalQuestionId + 1}`}
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
                  //console.log(`Image not found: /images/${originalQuestionId + 1}.png`);
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
              disabled={currentQuestion === 0}
              style={{
                background: "none",
                border: "none",
                cursor: currentQuestion === 0 ? "default" : "pointer",
                padding: "8px",
                opacity: currentQuestion === 0 ? 0.3 : 1,
                transition: "opacity 0.2s ease",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) => {
                if (currentQuestion > 0) {
                  e.target.style.opacity = "0.8";
                }
              }}
              onMouseOut={(e) => {
                if (currentQuestion > 0) {
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
              {currentQuestion + 1} / {totalQuestions}
            </span>

            <button
              onClick={goToNextQuestion}
              disabled={currentQuestion === totalQuestions - 1}
              style={{
                background: "none",
                border: "none",
                cursor:
                  currentQuestion === totalQuestions - 1
                    ? "default"
                    : "pointer",
                padding: "8px",
                opacity: currentQuestion === totalQuestions - 1 ? 0.3 : 1,
                transition: "opacity 0.2s ease",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) => {
                if (currentQuestion < totalQuestions - 1) {
                  e.target.style.opacity = "0.8";
                }
              }}
              onMouseOut={(e) => {
                if (currentQuestion < totalQuestions - 1) {
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
            {categoryQuestions[currentQuestion].answers.map((ans, idx) => {
              let bgColor = "#2c2c2c";

              if (wasAnswered) {
                const userAns = userAnswers[originalQuestionId];
                if (ans.correct) {
                  bgColor = "#4caf50";
                } else if (
                  userAns !== null &&
                  userAns === idx &&
                  !ans.correct
                ) {
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
                    if (isPreviewMode || wasAnswered) return;
                    handleAnswerClick(idx);
                  }}
                  style={{
                    padding: 12,
                    margin: "8px 0",
                    borderRadius: 25,
                    backgroundColor: bgColor,
                    cursor:
                      isPreviewMode || wasAnswered ? "not-allowed" : "pointer",
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
              {!wasAnswered && !showAnswer && (
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

              {(wasAnswered || showAnswer) && (
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
            returnToIndex !== currentQuestion && (
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

          {/* Статистика */}
          <div style={{ marginTop: 20, fontSize: 16 }}>
            <p>Правильных: {stats.correct}</p>
            <p>Неправильных: {stats.incorrect}</p>
            <p>Не знаю: {stats.unknown}</p>
          </div>
        </div>
      ) : (
        <>
          <h1 style={{ textAlign: "center", marginTop: 50 }}>
            Вы прошли тест по Бактериологии
          </h1>
          <div style={{ marginTop: 30, fontSize: 18 }}>
            <p>Правильных: {stats.correct}</p>
            <p>Неправильных: {stats.incorrect}</p>
            <p>Не знаю: {stats.unknown}</p>
          </div>
        </>
      )}

      {/* Нижние кнопки */}
      <div style={{ marginTop: 20 }}>
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

      <div style={{ marginTop: 30 }}>
        <button
          onClick={() => setCurrentScreen("archive")}
          style={buttonStyle}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          Архив
        </button>
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
      <AIChat
        currentQuestion={
          currentQuestion < questionsData.length
            ? questionsData[currentQuestion]
            : null
        }
        userAnswer={selectedAnswer}
        isAnswerCorrect={
          showAnswer && currentQuestion < questionsData.length
            ? selectedAnswer !== null
              ? questionsData[currentQuestion].answers[selectedAnswer].correct
              : false
            : null
        }
      />
    </div>
  );
}

export default BacteriologyTestScreen;
