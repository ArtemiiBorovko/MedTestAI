// src/hooks/useTestState.js
import { useState, useEffect } from "react";
import testStateManager from "../utils/testStateManager";

export const useTestState = () => {
  const [state, setState] = useState(testStateManager.getState());

  useEffect(() => {
    const unsubscribe = testStateManager.subscribe(setState);
    return unsubscribe;
  }, []);

  // Возвращаем методы напрямую, без .bind
  return {
    state,
    updateStats: (newStats) => testStateManager.updateStats(newStats),
    updateUserAnswer: (questionId, answer) =>
      testStateManager.updateUserAnswer(questionId, answer),
    updateProgress: (category, progress) =>
      testStateManager.updateProgress(category, progress),
    resetAll: () => testStateManager.resetAll(),
  };
};
