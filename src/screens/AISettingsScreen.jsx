import React, { useState, useEffect } from "react";

const AISettingsScreen = ({ setCurrentScreen }) => {
  const [apiKey, setApiKey] = useState("");
  const [persistence, setPersistence] = useState(50);
  const [temperature, setTemperature] = useState(70);
  const [teachingStyle, setTeachingStyle] = useState("detailed");
  const [autoHelp, setAutoHelp] = useState(true);
  const [voiceInput, setVoiceInput] = useState(false);

  useEffect(() => {
    // Загружаем сохраненные настройки
    const savedApiKey = localStorage.getItem("ai_api_key") || "";
    const savedPersistence = localStorage.getItem("ai_persistence") || "50";
    const savedTemperature = localStorage.getItem("ai_temperature") || "70";
    const savedStyle = localStorage.getItem("ai_teaching_style") || "detailed";
    const savedAutoHelp = localStorage.getItem("ai_auto_help") !== "false";
    const savedVoiceInput = localStorage.getItem("ai_voice_input") === "true";

    setApiKey(savedApiKey);
    setPersistence(parseInt(savedPersistence));
    setTemperature(parseInt(savedTemperature));
    setTeachingStyle(savedStyle);
    setAutoHelp(savedAutoHelp);
    setVoiceInput(savedVoiceInput);
  }, []);

  const saveSettings = () => {
    localStorage.setItem("ai_api_key", apiKey);
    localStorage.setItem("ai_persistence", persistence.toString());
    localStorage.setItem("ai_temperature", temperature.toString());
    localStorage.setItem("ai_teaching_style", teachingStyle);
    localStorage.setItem("ai_auto_help", autoHelp.toString());
    localStorage.setItem("ai_voice_input", voiceInput.toString());

    alert("Настройки сохранены!");
  };

  const resetSettings = () => {
    if (window.confirm("Сбросить все настройки ИИ к значениям по умолчанию?")) {
      localStorage.removeItem("ai_api_key");
      localStorage.removeItem("ai_persistence");
      localStorage.removeItem("ai_temperature");
      localStorage.removeItem("ai_teaching_style");
      localStorage.removeItem("ai_auto_help");
      localStorage.removeItem("ai_voice_input");
      localStorage.removeItem("ai_introduced");

      setApiKey("");
      setPersistence(50);
      setTemperature(70);
      setTeachingStyle("detailed");
      setAutoHelp(true);
      setVoiceInput(false);

      alert("Настройки сброшены!");
    }
  };

  const buttonStyle = {
    margin: "10px 0",
    padding: "15px",
    backgroundColor: "#333",
    border: "none",
    borderRadius: "25px",
    color: "white",
    cursor: "pointer",
    width: "100%",
    fontSize: "16px",
    fontFamily: "'Inter', 'Arial', sans-serif",
    fontWeight: "400",
    transition: "all 0.2s ease",
    outline: "none",
  };

  const cardStyle = {
    backgroundColor: "#1e1e1e",
    borderRadius: "25px",
    padding: "20px",
    marginBottom: "15px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
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
      <button
        style={buttonStyle}
        onClick={() => setCurrentScreen("home")}
        onMouseOver={(e) => handleButtonAnimation(e, true)}
        onMouseOut={(e) => handleButtonAnimation(e, false)}
        onMouseDown={(e) => handleButtonPress(e, true)}
        onMouseUp={(e) => handleButtonPress(e, false)}
      >
        На главный экран
      </button>

      <h1 style={{ textAlign: "center", margin: "20px 0" }}>
        Настройки Гиппократа
      </h1>

      {/* API ключ */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>API ключ Groq</h3>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Введите API ключ от Groq (gsk_...)"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: "#2a2a2a",
            color: "white",
            marginBottom: "10px",
            outline: "none",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            fontSize: "13px",
            color: "#aaa",
            padding: "10px",
            backgroundColor: "#2a2a2a",
            borderRadius: "15px",
            marginTop: "10px",
          }}
        >
          <p style={{ margin: "0 0 8px 0" }}>Чтобы получить API ключ:</p>
          <ol style={{ margin: "0", paddingLeft: "20px" }}>
            <li>
              В любом тесте откройте чат с ИИ (зелёная кнопка в правом нижнем
              углу)
            </li>
            <li>В окне чата нажмите кнопку "Получить ключ"</li>
            <li>Введите ваш API ключ от Groq в появившемся окне</li>
            <li>Ключ автоматически сохранится и будет доступен здесь</li>
          </ol>
        </div>
      </div>

      {/* Настройки поведения */}
      <div style={cardStyle}>
        <h3>Поведение Гиппократа</h3>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Объем памяти (сообщений): {persistence}
          </label>
          <input
            type="range"
            min="20"
            max="100"
            value={persistence}
            onChange={(e) => setPersistence(parseInt(e.target.value))}
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "4px",
              background: "#333",
              outline: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "#666",
              marginTop: "5px",
            }}
          >
            <span>Короткая</span>
            <span>Длинная</span>
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Креативность: {temperature}%
          </label>
          <input
            type="range"
            min="20"
            max="100"
            value={temperature}
            onChange={(e) => setTemperature(parseInt(e.target.value))}
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "4px",
              background: "#333",
              outline: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "#666",
              marginTop: "5px",
            }}
          >
            <span>Точный</span>
            <span>Креативный</span>
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Стиль преподавания
          </label>
          <select
            value={teachingStyle}
            onChange={(e) => setTeachingStyle(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: "#2a2a2a",
              color: "white",
              outline: "none",
              fontSize: "14px",
            }}
          >
            <option value="concise">Краткий и точный</option>
            <option value="detailed">Подробный с примерами</option>
            <option value="socratic">Сократический (через вопросы)</option>
            <option value="clinical">Клинико-ориентированный</option>
          </select>
        </div>
      </div>

      {/* Дополнительные настройки */}
      <div style={cardStyle}>
        <h3>Дополнительные настройки</h3>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <span>Автопредложение помощи</span>
          <label
            style={{
              position: "relative",
              display: "inline-block",
              width: "50px",
              height: "26px",
            }}
          >
            <input
              type="checkbox"
              checked={autoHelp}
              onChange={(e) => setAutoHelp(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: "absolute",
                cursor: "pointer",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: autoHelp ? "#4CAF50" : "#666",
                borderRadius: "34px",
                transition: ".4s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  content: '""',
                  height: "18px",
                  width: "18px",
                  left: "4px",
                  bottom: "4px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  transition: ".4s",
                  transform: autoHelp ? "translateX(24px)" : "translateX(0)",
                }}
              />
            </span>
          </label>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <span>Голосовой ввод</span>
          <label
            style={{
              position: "relative",
              display: "inline-block",
              width: "50px",
              height: "26px",
            }}
          >
            <input
              type="checkbox"
              checked={voiceInput}
              onChange={(e) => setVoiceInput(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: "absolute",
                cursor: "pointer",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: voiceInput ? "#4CAF50" : "#666",
                borderRadius: "34px",
                transition: ".4s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  content: '""',
                  height: "18px",
                  width: "18px",
                  left: "4px",
                  bottom: "4px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  transition: ".4s",
                  transform: voiceInput ? "translateX(24px)" : "translateX(0)",
                }}
              />
            </span>
          </label>
        </div>
      </div>

      {/* Кнопки управления */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          style={{ ...buttonStyle, backgroundColor: "#4CAF50", flex: 2 }}
          onClick={saveSettings}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          Сохранить настройки
        </button>
        <button
          style={{ ...buttonStyle, backgroundColor: "#666", flex: 1 }}
          onClick={resetSettings}
          onMouseOver={(e) => handleButtonAnimation(e, true)}
          onMouseOut={(e) => handleButtonAnimation(e, false)}
          onMouseDown={(e) => handleButtonPress(e, true)}
          onMouseUp={(e) => handleButtonPress(e, false)}
        >
          Сброс
        </button>
      </div>

      {/* Информация */}
      <div
        style={{ ...cardStyle, backgroundColor: "#2a2a2a", fontSize: "13px" }}
      >
        <h4>Информация о Гиппократе</h4>
        <p>
          Гиппократ - ИИ профессор медицины, созданный для помощи
          студентам-медикам в изучении сложных концепций.
        </p>
        <p>Он использует модель Groq Llama 3.3 70B для генерации ответов.</p>
        <p style={{ marginTop: "10px", color: apiKey ? "#4CAF50" : "#ff9800" }}>
          Текущий статус:{" "}
          {apiKey ? "✅ API подключен" : "⚠️ Требуется API ключ"}
        </p>
      </div>
    </div>
  );
};

export default AISettingsScreen;
