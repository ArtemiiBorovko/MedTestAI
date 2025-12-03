// src/hooks/useScrollPosition.js
import { useEffect } from "react";

export const useScrollPosition = (storageKey) => {
  const restoreScrollPosition = () => {
    const savedScroll = localStorage.getItem(storageKey);
    if (savedScroll) {
      const scrollY = parseInt(savedScroll, 10);
      console.log(`🔄 ВОССТАНОВЛЕНИЕ позиции для ${storageKey}: ${scrollY}px`);

      if (scrollY > 0) {
        // Множественные попытки восстановления
        [100, 300, 500, 1000, 2000].forEach((delay, index) => {
          setTimeout(() => {
            window.scrollTo(0, scrollY);
            console.log(`🔄 Попытка ${index + 1}: установка на ${scrollY}px`);
          }, delay);
        });
      }
      return scrollY;
    }
    return 0;
  };

  useEffect(() => {
    console.log(`🎯 Инициализация скролла для ${storageKey}`);
    restoreScrollPosition();
  }, [storageKey]);

  return {
    restoreScrollPosition,
  };
};
