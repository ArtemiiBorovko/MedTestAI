// src/utils/testStateManager.js
import {
  getMainStats,
  updateMainStats,
  getUserAnswersByType,
  getProgressByCategory,
  updateProgressByCategory,
  resetAllMainTests,
} from "./archiveUtils";

// Простой менеджер состояния без сложных привязок
let currentState = {
  stats: getMainStats(),
  userAnswers: getUserAnswersByType("main"),
  progress: {
    test: getProgressByCategory("test"),
    bacteriology: getProgressByCategory("bacteriology"),
    virology: getProgressByCategory("virology"),
    mycology: getProgressByCategory("mycology"),
    parasitology: getProgressByCategory("parasitology"),
    other: getProgressByCategory("other"),
  },
};

const listeners = new Set();

const testStateManager = {
  getState() {
    return currentState;
  },

  updateStats(newStats) {
    updateMainStats(newStats);
    currentState.stats = { ...currentState.stats, ...newStats };
    this.notifyListeners();
  },

  updateUserAnswer(questionId, answer) {
    const userAnswers = getUserAnswersByType("main");
    userAnswers[questionId] = answer;
    localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
    currentState.userAnswers = { ...userAnswers };
    this.notifyListeners();
  },

  updateProgress(category, progress) {
    updateProgressByCategory(category, progress);
    currentState.progress[category] = progress;
    this.notifyListeners();
  },

  resetAll() {
    resetAllMainTests();
    currentState = {
      stats: getMainStats(),
      userAnswers: getUserAnswersByType("main"),
      progress: {
        test: getProgressByCategory("test"),
        bacteriology: getProgressByCategory("bacteriology"),
        virology: getProgressByCategory("virology"),
        mycology: getProgressByCategory("mycology"),
        parasitology: getProgressByCategory("parasitology"),
        other: getProgressByCategory("other"),
      },
    };
    this.notifyListeners();
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  notifyListeners() {
    listeners.forEach((listener) => listener(currentState));
  },
};

export default testStateManager;
