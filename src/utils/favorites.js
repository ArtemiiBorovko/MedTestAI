// Утилиты для работы с избранными вопросами
export const getFavorites = () => {
  const favorites = localStorage.getItem("favorites");
  return favorites ? JSON.parse(favorites) : [];
};

export const addToFavorites = (questionId) => {
  const favorites = getFavorites();
  if (!favorites.includes(questionId)) {
    favorites.push(questionId);
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }
};

export const removeFromFavorites = (questionId) => {
  const favorites = getFavorites();
  const updatedFavorites = favorites.filter((id) => id !== questionId);
  localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
};

export const isFavorite = (questionId) => {
  const favorites = getFavorites();
  return favorites.includes(questionId);
};

export const toggleFavorite = (questionId) => {
  if (isFavorite(questionId)) {
    removeFromFavorites(questionId);
    return false;
  } else {
    addToFavorites(questionId);
    return true;
  }
};
