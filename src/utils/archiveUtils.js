// src/utils/archiveUtils.js

// Функция для обновления архивов при ответе на вопрос
export const updateAnswerArchives = (
  questionId,
  isCorrect,
  userAnswer,
  testType = "main",
) => {
  // Загружаем текущие архивы
  const correctAnswersList = JSON.parse(
    localStorage.getItem("correctAnswersList") || "[]",
  );
  const incorrectAnswersList = JSON.parse(
    localStorage.getItem("incorrectAnswersList") || "[]",
  );

  // Удаляем вопрос из обоих архивов (если есть)
  const newCorrectList = correctAnswersList.filter((id) => id !== questionId);
  const newIncorrectList = incorrectAnswersList.filter(
    (id) => id !== questionId,
  );

  // Добавляем вопрос в соответствующий архив
  if (isCorrect) {
    newCorrectList.push(questionId);
  } else {
    newIncorrectList.push(questionId);

    // УСТАНАВЛИВАЕМ НАЧАЛЬНЫЕ СЧЕТЧИКИ для вопросов "Изучать"
    if (testType !== "study") {
      const counters = getStudyQuestionCounters();
      if (userAnswer === null) {
        // "Не знаю" - начальный счетчик 2
        counters[questionId] = 2;
      } else {
        // Неправильные - начальный счетчик 1
        counters[questionId] = 1;
      }
      localStorage.setItem("studyQuestionCounters", JSON.stringify(counters));
    }
  }

  // Сохраняем обновленные архивы
  localStorage.setItem("correctAnswersList", JSON.stringify(newCorrectList));
  localStorage.setItem(
    "incorrectAnswersList",
    JSON.stringify(newIncorrectList),
  );

  // Обновляем userAnswers в зависимости от типа теста
  if (testType === "fast") {
    const userAnswersFast = JSON.parse(
      localStorage.getItem("userAnswersFast") || "{}",
    );
    userAnswersFast[questionId] = userAnswer;
    localStorage.setItem("userAnswersFast", JSON.stringify(userAnswersFast));
  } else if (testType === "study") {
    const userAnswersStudy = JSON.parse(
      localStorage.getItem("userAnswersStudy") || "{}",
    );
    userAnswersStudy[questionId] = userAnswer;
    localStorage.setItem("userAnswersStudy", JSON.stringify(userAnswersStudy));
  } else {
    const userAnswers = JSON.parse(localStorage.getItem("userAnswers") || "{}");
    userAnswers[questionId] = userAnswer;
    localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
  }

  return { newCorrectList, newIncorrectList };
};

// Функция для получения объединенных userAnswers (для архивов)
export const getCombinedUserAnswers = () => {
  const userAnswersMain = JSON.parse(
    localStorage.getItem("userAnswers") || "{}",
  );
  const userAnswersFast = JSON.parse(
    localStorage.getItem("userAnswersFast") || "{}",
  );
  const userAnswersStudy = JSON.parse(
    localStorage.getItem("userAnswersStudy") || "{}",
  );

  // Объединяем ответы (приоритет у основных тестов)
  return { ...userAnswersStudy, ...userAnswersFast, ...userAnswersMain };
};

// Функция для получения userAnswers по типу теста
export const getUserAnswersByType = (testType = "main") => {
  if (testType === "fast") {
    return JSON.parse(localStorage.getItem("userAnswersFast") || "{}");
  } else if (testType === "study") {
    return JSON.parse(localStorage.getItem("userAnswersStudy") || "{}");
  } else {
    return JSON.parse(localStorage.getItem("userAnswers") || "{}");
  }
};

// Функция для сброса ВСЕХ основных тестов
export const resetAllMainTests = () => {
  // Сбрасываем статистику основных тестов
  localStorage.setItem(
    "stats",
    JSON.stringify({ correct: 0, incorrect: 0, unknown: 0 }),
  );

  // Сбрасываем ответы основных тестов
  localStorage.setItem("userAnswers", "{}");

  // Сбрасываем прогресс всех категорий основных тестов
  const categories = [
    "test",
    "bacteriology",
    "virology",
    "mycology",
    "parasitology",
    "other",
  ];
  categories.forEach((category) => {
    localStorage.setItem(`${category}Progress`, "0");
  });

  // Сбрасываем счетчики отвеченных вопросов для всех категорий
  categories.forEach((category) => {
    localStorage.setItem(
      `answeredCount${category.charAt(0).toUpperCase() + category.slice(1)}`,
      "0",
    );
  });
};

// Функция для получения статистики основных тестов
export const getMainStats = () => {
  return JSON.parse(
    localStorage.getItem("stats") || '{"correct":0,"incorrect":0,"unknown":0}',
  );
};

// Функция для обновления статистики основных тестов
export const updateMainStats = (newStats) => {
  localStorage.setItem("stats", JSON.stringify(newStats));
};

// Функция для получения прогресса по категории
export const getProgressByCategory = (category = "test") => {
  return Number(localStorage.getItem(`${category}Progress`) || "0");
};

// Функция для обновления прогресса по категории
export const updateProgressByCategory = (category, progress) => {
  localStorage.setItem(`${category}Progress`, progress.toString());
};

// Остальные функции остаются без изменений
export const getUniqueQuestions = (questionList) => {
  return [...new Set(questionList)];
};

export const isQuestionInArchive = (questionId) => {
  const correctAnswersList = JSON.parse(
    localStorage.getItem("correctAnswersList") || "[]",
  );
  const incorrectAnswersList = JSON.parse(
    localStorage.getItem("incorrectAnswersList") || "[]",
  );

  return (
    correctAnswersList.includes(questionId) ||
    incorrectAnswersList.includes(questionId)
  );
};

// Функция для поиска последнего отвеченного вопроса в тесте
export const getLastAnsweredQuestion = (questions, userAnswers) => {
  let lastAnswered = -1;

  for (let i = 0; i < questions.length; i++) {
    const questionId = questions[i].id - 1;
    if (userAnswers[questionId] !== undefined) {
      lastAnswered = i;
    }
  }

  return lastAnswered >= 0 ? lastAnswered : 0;
};

// Функция для поиска первого неотвеченного вопроса после указанного индекса
export const getFirstUnansweredAfter = (questions, userAnswers, startIndex) => {
  for (let i = startIndex + 1; i < questions.length; i++) {
    const questionId = questions[i].id - 1;
    if (userAnswers[questionId] === undefined) {
      return i;
    }
  }
  return questions.length - 1; // Если все отвечены, вернуть последний
};

// Функция для поиска границы промежутка (последний отвеченный перед первым неотвеченным)
export const getProgressBoundary = (questions, userAnswers) => {
  let lastAnsweredInFirstSegment = -1;

  for (let i = 0; i < questions.length; i++) {
    const questionId = questions[i].id - 1;
    if (userAnswers[questionId] !== undefined) {
      lastAnsweredInFirstSegment = i;
    } else {
      // Нашли первый неотвеченный - возвращаем последний отвеченный перед ним
      return lastAnsweredInFirstSegment >= 0 ? lastAnsweredInFirstSegment : 0;
    }
  }

  // Если все вопросы отвечены
  return questions.length - 1;
};

// ===== ФУНКЦИИ ДЛЯ АРХИВА "ИЗУЧАТЬ" =====

// Получить все вопросы для изучения (из неправильных и "не знаю")
export const getStudyQuestions = () => {
  const incorrectAnswersList = JSON.parse(
    localStorage.getItem("incorrectAnswersList") || "[]",
  );

  // Получаем счетчики для вопросов
  const studyCounters = JSON.parse(
    localStorage.getItem("studyQuestionCounters") || "{}",
  );

  console.log(
    `Всего в incorrectAnswersList: ${incorrectAnswersList.length} вопросов`,
  );
  console.log(`Счетчики:`, studyCounters);

  // Фильтруем вопросы, которые есть в incorrectAnswersList и счетчиках
  const availableQuestions = incorrectAnswersList.filter((questionId) => {
    return (
      studyCounters[questionId] !== undefined && studyCounters[questionId] > 0
    );
  });

  console.log(`Доступно для изучения: ${availableQuestions.length} вопросов`);

  // Сортируем: сначала вопросы с "не знаю" (userAnswer = null), затем по счетчикам
  const sortedQuestions = availableQuestions.sort((a, b) => {
    const userAnswers = getCombinedUserAnswers();
    const aIsUnknown = userAnswers[a] === null;
    const bIsUnknown = userAnswers[b] === null;

    // Если оба "не знаю" или оба не "не знаю", сортируем по счетчику
    if (aIsUnknown === bIsUnknown) {
      const aCounter = studyCounters[a] || 0;
      const bCounter = studyCounters[b] || 0;
      return bCounter - aCounter; // По убыванию счетчика
    }

    // "Не знаю" имеют приоритет
    return aIsUnknown ? -1 : 1;
  });

  return sortedQuestions;
};

// Получить счетчики вопросов для изучения
export const getStudyQuestionCounters = () => {
  return JSON.parse(localStorage.getItem("studyQuestionCounters") || "{}");
};

// Обновить счетчик вопроса для изучения
export const updateStudyQuestionCounter = (questionId, change) => {
  const counters = getStudyQuestionCounters();
  const currentCounter = counters[questionId] || 0;
  const newCounter = Math.max(0, currentCounter + change); // Не меньше 0

  if (newCounter === 0) {
    // Если счетчик стал 0, удаляем вопрос из счетчиков
    delete counters[questionId];
  } else {
    counters[questionId] = newCounter;
  }

  localStorage.setItem("studyQuestionCounters", JSON.stringify(counters));
  return newCounter;
};

// Переместить вопрос в правильные ответы при достижении счетчика 0
const moveQuestionToCorrect = (questionId, userAnswer) => {
  // Получаем текущие архивы
  const correctAnswersList = JSON.parse(
    localStorage.getItem("correctAnswersList") || "[]",
  );
  const incorrectAnswersList = JSON.parse(
    localStorage.getItem("incorrectAnswersList") || "[]",
  );

  // Удаляем вопрос из неправильных
  const newIncorrectList = incorrectAnswersList.filter(
    (id) => id !== questionId,
  );

  // Добавляем в правильные (если еще нет)
  const newCorrectList = [...correctAnswersList];
  if (!newCorrectList.includes(questionId)) {
    newCorrectList.push(questionId);
  }

  // Сохраняем обновленные архивы
  localStorage.setItem("correctAnswersList", JSON.stringify(newCorrectList));
  localStorage.setItem(
    "incorrectAnswersList",
    JSON.stringify(newIncorrectList),
  );

  // Обновляем userAnswers для основного теста
  const userAnswers = JSON.parse(localStorage.getItem("userAnswers") || "{}");
  userAnswers[questionId] = userAnswer;
  localStorage.setItem("userAnswers", JSON.stringify(userAnswers));

  console.log(`Вопрос ${questionId} перемещен в правильные ответы`);
};

// Обработка ответа в режиме "Изучать" - ИСПРАВЛЕННАЯ ЛОГИКА
export const handleStudyAnswer = (questionId, isCorrect, userAnswer) => {
  const counters = getStudyQuestionCounters();
  const currentCounter = counters[questionId] || 0;

  console.log(
    `Обработка ответа: вопрос ${questionId}, правильный: ${isCorrect}, текущий счетчик: ${currentCounter}`,
  );

  if (isCorrect) {
    // Правильный ответ - уменьшаем счетчик
    const newCounter = currentCounter - 1;

    console.log(`Правильный ответ! Новый счетчик: ${newCounter}`);

    // Удаляем вопрос ТОЛЬКО когда счетчик становится 0
    if (newCounter === 0) {
      console.log(
        `Счетчик стал 0! Удаляем вопрос ${questionId} из архива изучения и перемещаем в правильные ответы`,
      );

      // Перемещаем вопрос в правильные ответы
      moveQuestionToCorrect(questionId, userAnswer);

      // Удаляем из архива изучения
      removeQuestionFromStudy(questionId);
    } else {
      // Обновляем счетчик
      counters[questionId] = newCounter;
      localStorage.setItem("studyQuestionCounters", JSON.stringify(counters));
      console.log(`Счетчик обновлен: ${newCounter}`);
    }

    // Сохраняем ответ пользователя для режима изучения
    const userAnswersStudy = JSON.parse(
      localStorage.getItem("userAnswersStudy") || "{}",
    );
    userAnswersStudy[questionId] = userAnswer;
    localStorage.setItem("userAnswersStudy", JSON.stringify(userAnswersStudy));
  } else {
    // Неправильный ответ или "не знаю" - увеличиваем счетчик
    const newCounter = currentCounter + 1;
    counters[questionId] = newCounter;
    localStorage.setItem("studyQuestionCounters", JSON.stringify(counters));

    // Сохраняем ответ пользователя для режима изучения
    const userAnswersStudy = JSON.parse(
      localStorage.getItem("userAnswersStudy") || "{}",
    );
    userAnswersStudy[questionId] = userAnswer;
    localStorage.setItem("userAnswersStudy", JSON.stringify(userAnswersStudy));

    console.log(`Неправильный ответ! Счетчик увеличен: ${newCounter}`);
  }
};

// Удалить вопрос из архива изучения
export const removeQuestionFromStudy = (questionId) => {
  // Удаляем из счетчиков
  const counters = getStudyQuestionCounters();
  delete counters[questionId];
  localStorage.setItem("studyQuestionCounters", JSON.stringify(counters));

  // Удаляем из userAnswersStudy
  const userAnswersStudy = JSON.parse(
    localStorage.getItem("userAnswersStudy") || "{}",
  );
  delete userAnswersStudy[questionId];
  localStorage.setItem("userAnswersStudy", JSON.stringify(userAnswersStudy));

  console.log(`Вопрос ${questionId} полностью удален из архивов изучения`);
};

// Очистить архив "Изучать"
export const clearStudyArchive = () => {
  // Получаем все вопросы из архива изучения
  const studyQuestions = getStudyQuestions();

  // Удаляем их из неправильных ответов
  const incorrectAnswersList = JSON.parse(
    localStorage.getItem("incorrectAnswersList") || "[]",
  );

  const newIncorrectList = incorrectAnswersList.filter(
    (id) => !studyQuestions.includes(id),
  );

  localStorage.setItem(
    "incorrectAnswersList",
    JSON.stringify(newIncorrectList),
  );

  // Очищаем счетчики
  localStorage.setItem("studyQuestionCounters", JSON.stringify({}));
};

// Получить вопросы для теста "Изучать" (с ограничением по количеству)
export const getStudyTestQuestions = (count) => {
  const allStudyQuestions = getStudyQuestions();
  return allStudyQuestions.slice(0, Math.min(count, allStudyQuestions.length));
};

// Получить статистику архива "Изучать"
export const getStudyStats = () => {
  const studyQuestions = getStudyQuestions();
  const counters = getStudyQuestionCounters();

  let unknownCount = 0;
  let incorrectCount = 0;

  const userAnswers = getCombinedUserAnswers();
  studyQuestions.forEach((questionId) => {
    if (userAnswers[questionId] === null) {
      unknownCount++;
    } else {
      incorrectCount++;
    }
  });

  return {
    total: studyQuestions.length,
    unknown: unknownCount,
    incorrect: incorrectCount,
    counters: counters,
  };
};
