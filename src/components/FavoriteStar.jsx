import React, { useState, useEffect } from "react";
import { isFavorite, toggleFavorite } from "../utils/favorites";

const FavoriteStar = ({ questionId }) => {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(isFavorite(questionId));
  }, [questionId]);

  const handleClick = (e) => {
    e.stopPropagation();
    const newFavoriteState = toggleFavorite(questionId);
    setFavorite(newFavoriteState);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        background: "none",
        border: "none",
        fontSize: "28px",
        cursor: "pointer",
        color: favorite ? "gold" : "#555",
        textShadow: favorite ? "0 0 10px gold, 0 0 20px gold" : "none",
        transition: "all 0.3s ease",
        outline: "none",
        padding: "5px",
        margin: "-5px -5px 0 0",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseOver={(e) => {
        if (!favorite) {
          e.target.style.color = "#888";
        }
      }}
      onMouseOut={(e) => {
        if (!favorite) {
          e.target.style.color = "#555";
        }
      }}
    >
      {favorite ? "★" : "☆"}
    </button>
  );
};

export default FavoriteStar;
