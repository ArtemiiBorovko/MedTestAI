// src/utils/navigationUtils.js

// Функция для получения последнего отвеченного вопроса в тесте
export const getLastAnsweredQuestion = (questions, userAnswers) => {
  for (let i = questions.length - 1; i >= 0; i--) {
    const originalId = questions[i].id - 1;
    if (userAnswers[originalId] !== undefined) {
      return i;
    }
  }
  return 0; // Если нет отвеченных вопросов, начинаем с первого
};

// Функция для получения следующего неотвеченного вопроса
export const getNextUnansweredQuestion = (questions, userAnswers, currentIndex) => {
  for (let i = currentIndex + 1; i < questions.length; i++) {
    const originalId = questions[i].id - 1;
    if (userAnswers[originalId] === undefined) {
      return i;
    }
  }
  return null; // Нет следующих неотвеченных вопросов
};

// Функция для получения предыдущего неотвеченного вопроса
export const getPrevUnansweredQuestion = (questions, userAnswers, currentIndex) => {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const originalId = questions[i].id - 1;
    if (userAnswers[originalId] === undefined) {
      return i;
    }
  }
  return null; // Нет предыдущих неотвеченных вопросов
};

// Функция для получения индекса, на который нужно перейти при открытии теста
export const getInitialQuestionIndex = (questions, userAnswers, isMainTest = false) => {
  if (isMainTest) {
    // Для основного теста: находим последний отвеченный вопрос перед первым промежутком
    let lastAnsweredBeforeGap = -1;
    for (let i = 0; i < questions.length; i++) {
      const originalId = questions[i].id - 1;
      if (userAnswers[originalId] === undefined) {
        // Нашли первый неотвеченный вопрос
        return lastAnsweredBeforeGap >= 0 ? lastAnsweredBeforeGap : 0;
      } else {
        lastAnsweredBeforeGap = i;
      }
    }
    return questions.length - 1; // Все вопросы отвечены
  } else {
    // Для категорий: переходим на последний отвеченный вопрос
    return getLastAnsweredQuestion(questions, userAnswers);
  }
};

// Функция для проверки, находится ли пользователь в режиме просмотра
export const isInPreviewMode = (currentIndex, initialIndex, userAnswers, questions) => {
  if (currentIndex === initialIndex) return false;

  const currentOriginalId = questions[currentIndex].id - 1;
  return userAnswers[currentOriginalId] !== undefined;
};
