import React from "react";

const HomeScreen = ({ setCurrentScreen }) => {
  const buttonStyle = {
    margin: "10px 0",
    padding: "15px",
    backgroundColor: "#333",
    border: "none",
    borderRadius: "25px", // Полное закругление
    color: "white",
    cursor: "pointer",
    width: "100%",
    fontSize: "16px",
    fontFamily: "'Inter', 'Arial', sans-serif", // Шрифт Inter
    fontWeight: "400", // Regular 400
    transition: "all 0.2s ease",
    outline: "none", // Убираем синюю обводку при фокусе
  };

  const categoryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#2a2a2a",
  };

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
          marginBottom: "30px",
          marginTop: "20px",
          fontFamily: "'Inter', 'Arial', sans-serif",
          fontWeight: "400",
        }}
      >
        Medical Test
      </h1>
      <button
        style={buttonStyle}
        onClick={() => setCurrentScreen("test")}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.backgroundColor = "#3a3a3a";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#333";
        }}
        onMouseDown={(e) => {
          e.target.style.transform = "scale(0.98)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
        }}
        onMouseUp={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.boxShadow = "none";
        }}
      >
        Основной тест
      </button>

      <button
        style={buttonStyle}
        onClick={() => setCurrentScreen("study")}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.backgroundColor = "#3a3a3a";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#333";
        }}
        onMouseDown={(e) => {
          e.target.style.transform = "scale(0.98)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
        }}
        onMouseUp={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.boxShadow = "none";
        }}
      >
        Изучать
      </button>

      <button
        style={buttonStyle}
        onClick={() => setCurrentScreen("study-archive")}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.backgroundColor = "#3a3a3a";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#333";
        }}
        onMouseDown={(e) => {
          e.target.style.transform = "scale(0.98)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
        }}
        onMouseUp={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.boxShadow = "none";
        }}
      >
        Архив "Изучать"
      </button>

      <button
        style={buttonStyle}
        onClick={() => setCurrentScreen("fast-test")}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.backgroundColor = "#3a3a3a";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#333";
        }}
        onMouseDown={(e) => {
          e.target.style.transform = "scale(0.98)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
        }}
        onMouseUp={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.boxShadow = "none";
        }}
      >
        Быстрый тест
      </button>
      <button
        style={buttonStyle}
        onClick={() => setCurrentScreen("favorites")}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.backgroundColor = "#3a3a3a";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#333";
        }}
        onMouseDown={(e) => {
          e.target.style.transform = "scale(0.98)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
        }}
        onMouseUp={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.boxShadow = "none";
        }}
      >
        Избранное
      </button>
      <h3
        style={{
          marginTop: "30px",
          marginBottom: "15px",
          color: "#ccc",
          textAlign: "center", // Выравнивание по центру
          fontFamily: "'Inter', 'Arial', sans-serif",
          fontWeight: "400",
          fontSize: "25px", // Добавляем увеличение размера
        }}
      >
        Категории
      </h3>
      <button
        style={categoryButtonStyle}
        onClick={() => setCurrentScreen("bacteriology")}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.backgroundColor = "#3a3a3a";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#2a2a2a";
        }}
        onMouseDown={(e) => {
          e.target.style.transform = "scale(0.98)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
        }}
        onMouseUp={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.boxShadow = "none";
        }}
      >
        Бактериология
      </button>
      <button
        style={categoryButtonStyle}
        onClick={() => setCurrentScreen("virology")}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.backgroundColor = "#3a3a3a";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#2a2a2a";
        }}
        onMouseDown={(e) => {
          e.target.style.transform = "scale(0.98)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
        }}
        onMouseUp={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.boxShadow = "none";
        }}
      >
        Вирусология
      </button>
      <button
        style={categoryButtonStyle}
        onClick={() => setCurrentScreen("mycology")}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.backgroundColor = "#3a3a3a";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#2a2a2a";
        }}
        onMouseDown={(e) => {
          e.target.style.transform = "scale(0.98)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
        }}
        onMouseUp={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.boxShadow = "none";
        }}
      >
        Микология
      </button>
      <button
        style={categoryButtonStyle}
        onClick={() => setCurrentScreen("parasitology")}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.backgroundColor = "#3a3a3a";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#2a2a2a";
        }}
        onMouseDown={(e) => {
          e.target.style.transform = "scale(0.98)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
        }}
        onMouseUp={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.boxShadow = "none";
        }}
      >
        Паразитология
      </button>
      {/* ДОБАВЛЕНА КНОПКА ДЛЯ КАТЕГОРИИ "ДРУГИЕ" */}
      <button
        style={categoryButtonStyle}
        onClick={() => setCurrentScreen("other")}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.backgroundColor = "#3a3a3a";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#2a2a2a";
        }}
        onMouseDown={(e) => {
          e.target.style.transform = "scale(0.98)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
        }}
        onMouseUp={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.boxShadow = "none";
        }}
      >
        Другие
      </button>
      {/* Отступ между категориями и следующими кнопками */}
      <div style={{ marginTop: "30px" }}></div>
      <button
        style={buttonStyle}
        onClick={() => setCurrentScreen("reminder")}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.backgroundColor = "#3a3a3a";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#333";
        }}
        onMouseDown={(e) => {
          e.target.style.transform = "scale(0.98)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
        }}
        onMouseUp={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.boxShadow = "none";
        }}
      >
        Напоминание
      </button>
      <button
        style={buttonStyle}
        onClick={() => setCurrentScreen("archive")}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.backgroundColor = "#3a3a3a";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#333";
        }}
        onMouseDown={(e) => {
          e.target.style.transform = "scale(0.98)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
        }}
        onMouseUp={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.boxShadow = "none";
        }}
      >
        Архив
      </button>
      <button
        style={buttonStyle}
        onClick={() => setCurrentScreen("ai-settings")}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.backgroundColor = "#3a3a3a";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#333";
        }}
        onMouseDown={(e) => {
          e.target.style.transform = "scale(0.98)";
          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
        }}
        onMouseUp={(e) => {
          e.target.style.transform = "scale(1.03)";
          e.target.style.boxShadow = "none";
        }}
      >
        Настройки ИИ
      </button>
      <div style={{ marginTop: "30px", textAlign: "center", color: "#666" }}>
        <p>Всего вопросов: 2218</p>
      </div>
    </div>
  );
};

export default HomeScreen;
