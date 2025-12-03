import React, { useState, useEffect } from "react";
import FavoriteStar from "../components/FavoriteStar";
import {
  updateAnswerArchives,
  getUserAnswersByType,
} from "../utils/archiveUtils";
import { toggleFavorite, isFavorite } from "../utils/favorites";
import questions from "../questions.json";

const CategoryTestScreen = ({ setCurrentScreen, category }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [returnToIndex, setReturnToIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Состояния для свайпов
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  // Фильтруем вопросы по категории
  const categoryQuestions = questions.filter((q) => q.category === category);
  const totalQuestions = categoryQuestions.length;

  // Загрузка прогресса
  useEffect(() => {
    const savedProgress = localStorage.getItem(`testProgress_${category}`);
    if (savedProgress !== null) {
      const progress = parseInt(savedProgress);
      if (progress >= 0 && progress < totalQuestions) {
        setCurrentQuestion(progress);
      }
    }
  }, [category, totalQuestions]);

  // Сохранение прогресса
  useEffect(() => {
    localStorage.setItem(
      `testProgress_${category}`,
      currentQuestion.toString(),
    );
  }, [currentQuestion, category]);

  // Загрузка статистики
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    unknown: 0,
  });

  useEffect(() => {
    const savedStats = localStorage.getItem(`stats_${category}`);
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, [category]);

  const saveStats = (newStats) => {
    setStats(newStats);
    localStorage.setItem(`stats_${category}`, JSON.stringify(newStats));
  };

  const currentQ = categoryQuestions[currentQuestion];
  const userAnswers = getUserAnswersByType(`category_${category}`);
  const hasUserAnswer = userAnswers[currentQ?.id];

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
      handleNextQuestion();
    } else if (isRightSwipe) {
      handlePrevQuestion();
    }
  };

  // Обработчик клавиатуры
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        handleNextQuestion();
      } else if (e.key === "ArrowLeft") {
        handlePrevQuestion();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentQuestion, totalQuestions]);

  const handleAnswerSelect = (answerIndex) => {
    if (showAnswer) return;

    if (selectedAnswer === answerIndex) {
      // Двойное нажатие - подтверждение ответа
      handleAnswerConfirm(answerIndex);
    } else {
      // Первое нажатие - предварительный выбор
      setSelectedAnswer(answerIndex);
      setPendingAnswer(answerIndex);
    }
  };

  const handleAnswerConfirm = (answerIndex) => {
    const isCorrect = currentQ.answers[answerIndex].correct;

    // Обновляем архивы
    updateAnswerArchives(
      currentQ.id,
      isCorrect,
      answerIndex,
      `category_${category}`,
    );

    // Обновляем статистику
    const newStats = { ...stats };
    if (isCorrect) {
      newStats.correct += 1;
    } else {
      newStats.incorrect += 1;
    }
    saveStats(newStats);

    setShowAnswer(true);
    setPendingAnswer(null);
  };

  const handleDontKnow = () => {
    updateAnswerArchives(currentQ.id, false, null, `category_${category}`);

    const newStats = { ...stats };
    newStats.unknown += 1;
    saveStats(newStats);

    setShowAnswer(true);
    setPendingAnswer(null);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setPendingAnswer(null);

      if (isPreviewMode) {
        setIsPreviewMode(false);
        setReturnToIndex(null);
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setPendingAnswer(null);
    }
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return;

      const results = categoryQuestions.filter(
        (q) =>
          q.id.toString().includes(term) ||
          q.question.toLowerCase().includes(term),
      );

      setSearchResults(results);
      setShowSearchResults(true);
    }
  };

  const handleSearchResultClick = (questionId) => {
    const index = categoryQuestions.findIndex((q) => q.id === questionId);
    if (index !== -1) {
      setReturnToIndex(currentQuestion);
      setCurrentQuestion(index);
      setIsPreviewMode(true);
      setShowSearchResults(false);
      setSearchTerm("");
      setSelectedAnswer(null);
      setShowAnswer(false);
      setPendingAnswer(null);
    }
  };

  const handleReturnToTest = () => {
    if (returnToIndex !== null) {
      setCurrentQuestion(returnToIndex);
      setReturnToIndex(null);
    }
    setIsPreviewMode(false);
    setShowAnswer(false);
    setSelectedAnswer(null);
  };

  const restartTest = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setPendingAnswer(null);
    setIsPreviewMode(false);
    setReturnToIndex(null);
    saveStats({ correct: 0, incorrect: 0, unknown: 0 });
    localStorage.removeItem(`testProgress_${category}`);
  };

  if (!currentQ) {
    return (
      <div style={{ padding: "20px", color: "white", textAlign: "center" }}>
        <h2>Вопросы не найдены для категории: {category}</h2>
        <button onClick={() => setCurrentScreen("home")} style={buttonStyle}>
          На главную
        </button>
      </div>
    );
  }

  const progressPercentage = ((currentQuestion + 1) / totalQuestions) * 100;

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
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Прогресс бар */}
      <div style={progressBarContainerStyle}>
        <div
          style={{
            ...progressBarStyle,
            width: `${progressPercentage}%`,
          }}
        />
      </div>

      {/* Статистика */}
      <div style={statsStyle}>
        <span style={{ color: "#4CAF50" }}>✓ {stats.correct}</span>
        <span style={{ color: "#f44336" }}>✗ {stats.incorrect}</span>
        <span style={{ color: "#ff9800" }}>? {stats.unknown}</span>
      </div>

      {/* Поиск */}
      <div style={searchContainerStyle}>
        <input
          type="text"
          placeholder="Поиск по номеру или тексту вопроса..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleSearch}
          style={searchInputStyle}
        />
        {showSearchResults && (
          <div style={searchResultsStyle}>
            {searchResults.map((result) => (
              <div
                key={result.id}
                onClick={() => handleSearchResultClick(result.id)}
                style={searchResultItemStyle}
              >
                {result.id}. {result.question.slice(0, 50)}...
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Режим просмотра */}
      {isPreviewMode && (
        <div style={previewModeStyle}>
          <span>Режим просмотра</span>
          <button onClick={handleReturnToTest} style={returnButtonStyle}>
            Вернуться к тесту
          </button>
        </div>
      )}

      {/* Карточка вопроса */}
      <div style={cardStyle}>
        {/* Заголовок с номером и избранным */}
        <div style={headerStyle}>
          <span style={questionNumberStyle}>
            Вопрос {currentQ.id} ({currentQuestion + 1}/{totalQuestions})
          </span>
          <FavoriteStar
            questionId={currentQ.id}
            isFavorite={isFavorite(currentQ.id)}
            onToggle={() => toggleFavorite(currentQ.id)}
          />
        </div>

        {/* Текст вопроса */}
        <div style={questionTextStyle}>{currentQ.question}</div>

        {/* Картинка если есть */}
        {currentQ.hasImage && (
          <img
            src={`/images/${currentQ.id}.png`}
            alt={`Иллюстрация к вопросу ${currentQ.id}`}
            style={imageStyle}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        )}

        {/* Варианты ответов */}
        <div style={answersContainerStyle}>
          {currentQ.answers.map((answer, index) => {
            let answerStyle = { ...answerStyleBase };

            if (showAnswer) {
              if (answer.correct) {
                answerStyle = { ...answerStyle, ...correctAnswerStyle };
              } else if (hasUserAnswer && userAnswers[currentQ.id] === index) {
                answerStyle = { ...answerStyle, ...incorrectAnswerStyle };
              }
            } else if (pendingAnswer === index) {
              answerStyle = { ...answerStyle, ...pendingAnswerStyle };
            }

            return (
              <div
                key={index}
                style={answerStyle}
                onClick={() => handleAnswerSelect(index)}
              >
                {answer.text}
              </div>
            );
          })}
        </div>

        {/* Кнопка "Не знаю" */}
        {!showAnswer && (
          <button onClick={handleDontKnow} style={dontKnowButtonStyle}>
            Не знаю
          </button>
        )}

        {/* Навигация */}
        <div style={navigationStyle}>
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestion === 0}
            style={{
              ...navButtonStyle,
              opacity: currentQuestion === 0 ? 0.3 : 1,
            }}
          >
            ←
          </button>

          {showAnswer && (
            <button onClick={handleNextQuestion} style={nextButtonStyle}>
              Далее →
            </button>
          )}

          <button
            onClick={handleNextQuestion}
            disabled={currentQuestion === totalQuestions - 1}
            style={{
              ...navButtonStyle,
              opacity: currentQuestion === totalQuestions - 1 ? 0.3 : 1,
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Кнопка перезапуска */}
      <div style={restartContainerStyle}>
        <button onClick={restartTest} style={restartButtonStyle}>
          Начать заново
        </button>
      </div>
    </div>
  );
};

// Стили (такие же как в TestScreen)
const progressBarContainerStyle = {
  width: "100%",
  height: "4px",
  backgroundColor: "#333",
  borderRadius: "2px",
  marginBottom: "15px",
  overflow: "hidden",
};

const progressBarStyle = {
  height: "100%",
  backgroundColor: "#4CAF50",
  transition: "width 0.3s ease",
  borderRadius: "2px",
};

const statsStyle = {
  display: "flex",
  justifyContent: "space-around",
  marginBottom: "15px",
  fontSize: "14px",
  fontWeight: "bold",
};

const searchContainerStyle = {
  position: "relative",
  marginBottom: "15px",
};

const searchInputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "25px",
  border: "none",
  backgroundColor: "#333",
  color: "white",
  fontSize: "14px",
  outline: "none",
};

const searchResultsStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  backgroundColor: "#333",
  borderRadius: "10px",
  marginTop: "5px",
  zIndex: 1000,
  maxHeight: "200px",
  overflowY: "auto",
};

const searchResultItemStyle = {
  padding: "10px",
  borderBottom: "1px solid #444",
  cursor: "pointer",
};

const previewModeStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "#ff9800",
  color: "black",
  padding: "10px",
  borderRadius: "10px",
  marginBottom: "15px",
  fontSize: "14px",
};

const returnButtonStyle = {
  backgroundColor: "rgba(0,0,0,0.2)",
  border: "none",
  color: "black",
  padding: "5px 10px",
  borderRadius: "15px",
  cursor: "pointer",
};

const cardStyle = {
  backgroundColor: "#1E1E1E",
  borderRadius: "25px",
  padding: "20px",
  marginBottom: "20px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "15px",
};

const questionNumberStyle = {
  fontSize: "14px",
  color: "#888",
};

const questionTextStyle = {
  fontSize: "16px",
  lineHeight: "1.4",
  marginBottom: "20px",
};

const imageStyle = {
  width: "100%",
  borderRadius: "15px",
  marginBottom: "20px",
};

const answersContainerStyle = {
  marginBottom: "20px",
};

const answerStyleBase = {
  padding: "12px",
  marginBottom: "10px",
  backgroundColor: "#333",
  borderRadius: "15px",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const correctAnswerStyle = {
  backgroundColor: "#4CAF50",
  color: "white",
};

const incorrectAnswerStyle = {
  backgroundColor: "#f44336",
  color: "white",
};

const pendingAnswerStyle = {
  backgroundColor: "#2196F3",
  color: "white",
};

const dontKnowButtonStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#ff9800",
  color: "white",
  border: "none",
  borderRadius: "15px",
  cursor: "pointer",
  fontSize: "16px",
  marginBottom: "20px",
};

const navigationStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const navButtonStyle = {
  padding: "10px 15px",
  backgroundColor: "#333",
  color: "white",
  border: "none",
  borderRadius: "15px",
  cursor: "pointer",
  fontSize: "16px",
};

const nextButtonStyle = {
  padding: "10px 20px",
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "15px",
  cursor: "pointer",
  fontSize: "16px",
};

const restartContainerStyle = {
  textAlign: "center",
};

const restartButtonStyle = {
  padding: "10px 20px",
  backgroundColor: "#666",
  color: "white",
  border: "none",
  borderRadius: "15px",
  cursor: "pointer",
  fontSize: "14px",
};

const buttonStyle = {
  padding: "10px 20px",
  backgroundColor: "#333",
  color: "white",
  border: "none",
  borderRadius: "15px",
  cursor: "pointer",
  margin: "5px",
};

export default CategoryTestScreen;
