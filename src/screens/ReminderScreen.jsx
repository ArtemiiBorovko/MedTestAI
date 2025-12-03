import React, { useState, useEffect } from "react";
import { getNotificationStatus, testNotification } from "../utils/reminders";

// Функция для определения iOS устройств
const isIOS = () => {
  return (
    [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod",
    ].includes(navigator.platform) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
};

const isAndroid = () => {
  return /Android/.test(navigator.userAgent);
};

const isInStandaloneMode = () => {
  return (
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
};

const ReminderScreen = ({ setCurrentScreen }) => {
  const [times, setTimes] = useState([""]);
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // По умолчанию пн-пт
  const [isReminderActive, setIsReminderActive] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState("default");
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const daysOfWeek = [
    { id: 1, name: "Понедельник", short: "Пн" },
    { id: 2, name: "Вторник", short: "Вт" },
    { id: 3, name: "Среда", short: "Ср" },
    { id: 4, name: "Четверг", short: "Чт" },
    { id: 5, name: "Пятница", short: "Пт" },
    { id: 6, name: "Суббота", short: "Сб" },
    { id: 0, name: "Воскресенье", short: "Вс" },
  ];

  const presetDays = {
    weekdays: [1, 2, 3, 4, 5], // пн-пт
    weekend: [0, 6], // вс, сб
    everyday: [0, 1, 2, 3, 4, 5, 6], // все дни
  };

  useEffect(() => {
    setIsIOSDevice(isIOS());
    setIsAndroidDevice(isAndroid());
    setIsStandalone(isInStandaloneMode());

    // Проверяем статус разрешения уведомлений
    const status = getNotificationStatus();
    setNotificationPermission(status.permission);

    // Загружаем сохраненные настройки напоминания
    const savedSettings = localStorage.getItem("reminderSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.times && settings.times.length > 0) {
        setTimes(settings.times);
      }
      if (settings.days && settings.days.length > 0) {
        setSelectedDays(settings.days);
      }
      setIsReminderActive(settings.isActive || false);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Ваш браузер не поддерживает уведомления");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        alert("✅ Разрешение на уведомления получено!");

        // Тестовое уведомление
        await testNotification();
      } else {
        alert(
          "❌ Разрешение на уведомления отклонено. Напоминания не будут работать.",
        );
      }
    } catch (error) {
      console.error("Ошибка при запросе разрешения:", error);
      alert(
        "❌ Ошибка при запросе разрешения. Проверьте настройки уведомлений.",
      );
    }
  };

  const addTimeField = () => {
    setTimes([...times, ""]);
  };

  const removeTimeField = (index) => {
    if (times.length > 1) {
      const newTimes = times.filter((_, i) => i !== index);
      setTimes(newTimes);
    }
  };

  const updateTime = (index, value) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const toggleDay = (dayId) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const selectPresetDays = (preset) => {
    setSelectedDays([...presetDays[preset]]);
  };

  const scheduleNotification = () => {
    // Фильтруем пустые времена
    const validTimes = times.filter((time) => time !== "");

    if (validTimes.length === 0) {
      alert("⏰ Пожалуйста, укажите хотя бы одно время напоминания");
      return;
    }

    if (selectedDays.length === 0) {
      alert("📅 Пожалуйста, выберите дни для напоминаний");
      return;
    }

    if (notificationPermission !== "granted") {
      alert("🔔 Сначала разрешите уведомления");
      return;
    }

    // Сохраняем настройки
    const settings = {
      isActive: true,
      times: validTimes,
      days: selectedDays,
      lastNotificationDates: {},
    };

    localStorage.setItem("reminderSettings", JSON.stringify(settings));
    setIsReminderActive(true);

    const daysText = selectedDays
      .map((day) => daysOfWeek.find((d) => d.id === day)?.short)
      .join(", ");
    const timesText = validTimes.join(", ");

    alert(
      `✅ Напоминания установлены!\n\nДни: ${daysText}\nВремя: ${timesText}\n\nВы будете получать уведомления в установленное время.`,
    );
  };

  const handleTestNotification = async () => {
    if (notificationPermission !== "granted") {
      alert("🔔 Сначала разрешите уведомления");
      return;
    }

    try {
      await testNotification();
      alert("✅ Тестовое уведомление отправлено!");
    } catch (error) {
      console.error("Ошибка тестового уведомления:", error);
      alert("❌ Ошибка отправки тестового уведомления");
    }
  };

  const cancelReminder = () => {
    localStorage.removeItem("reminderSettings");
    setIsReminderActive(false);
    setTimes([""]);
    setSelectedDays([1, 2, 3, 4, 5]);
    alert("✅ Все напоминания отменены");
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

  const blueButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#1976d2",
  };

  const greenButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#4caf50",
  };

  const redButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#f44336",
  };

  const purpleButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#9c27b0",
  };

  const grayButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#555", // или "#666" - подберите нужный оттенок серого
  };

  const handleColoredButtonAnimation = (e, isMouseOver, baseColor) => {
    if (isMouseOver) {
      e.target.style.transform = "scale(1.03)";
      e.target.style.filter = "brightness(1.1)";
    } else {
      e.target.style.transform = "scale(1)";
      e.target.style.filter = "brightness(1)";
    }
  };

  const handleButtonPress = (e, isMouseDown) => {
    if (isMouseDown) {
      e.target.style.transform = "scale(0.98)";
      e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.5)";
      e.target.style.filter = "brightness(0.9)";
    } else {
      e.target.style.transform = "scale(1.03)";
      e.target.style.boxShadow = "none";
      e.target.style.filter = "brightness(1.1)";
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
        onMouseOver={(e) => handleColoredButtonAnimation(e, true, "#333")}
        onMouseOut={(e) => handleColoredButtonAnimation(e, false, "#333")}
        onMouseDown={(e) => handleButtonPress(e, true)}
        onMouseUp={(e) => handleButtonPress(e, false)}
      >
        На главный экран
      </button>

      <h1
        style={{
          textAlign: "center",
          margin: "20px 0",
          fontFamily: "'Inter', 'Arial', sans-serif",
          fontWeight: "400",
        }}
      >
        Напоминания
      </h1>

      {/* Статус разрешений */}
      <div
        style={{
          backgroundColor: "#1e1e1e",
          borderRadius: 25,
          padding: 20,
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        <h3>Статус уведомлений:</h3>

        <p
          style={{
            color:
              notificationPermission === "granted"
                ? "#4caf50"
                : notificationPermission === "denied"
                  ? "#f44336"
                  : "#ff9800",
            fontWeight: "bold",
          }}
        >
          {notificationPermission === "granted"
            ? "✅ Разрешено"
            : notificationPermission === "denied"
              ? "❌ Заблокировано"
              : "⚠️ Не запрошено"}
        </p>

        {notificationPermission !== "granted" ? (
          <button
            style={blueButtonStyle}
            onClick={requestNotificationPermission}
            onMouseOver={(e) =>
              handleColoredButtonAnimation(e, true, "#1976d2")
            }
            onMouseOut={(e) =>
              handleColoredButtonAnimation(e, false, "#1976d2")
            }
            onMouseDown={(e) => handleButtonPress(e, true)}
            onMouseUp={(e) => handleButtonPress(e, false)}
          >
            Разрешить уведомления
          </button>
        ) : (
          <button
            style={purpleButtonStyle}
            onClick={handleTestNotification}
            onMouseOver={(e) =>
              handleColoredButtonAnimation(e, true, "#9c27b0")
            }
            onMouseOut={(e) =>
              handleColoredButtonAnimation(e, false, "#9c27b0")
            }
            onMouseDown={(e) => handleButtonPress(e, true)}
            onMouseUp={(e) => handleButtonPress(e, false)}
          >
            Тестовое уведомление
          </button>
        )}
      </div>

      {/* Установка напоминания */}
      <div
        style={{
          backgroundColor: "#1e1e1e",
          borderRadius: 25,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <h3>Настройка напоминаний</h3>

        {/* Выбор дней недели */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <strong>Дни недели:</strong>
          </label>

          {/* Быстрый выбор */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "15px",
              flexWrap: "wrap",
            }}
          >
            <button
              style={{
                ...grayButtonStyle,
                padding: "8px 12px",
                fontSize: "14px",
              }}
              onClick={() => selectPresetDays("weekdays")}
              onMouseOver={(e) => handleColoredButtonAnimation(e, true, "#555")}
              onMouseOut={(e) => handleColoredButtonAnimation(e, false, "#555")}
            >
              Будни
            </button>
            <button
              style={{
                ...grayButtonStyle,
                padding: "8px 12px",
                fontSize: "14px",
              }}
              onClick={() => selectPresetDays("weekend")}
              onMouseOver={(e) => handleColoredButtonAnimation(e, true, "#555")}
              onMouseOut={(e) => handleColoredButtonAnimation(e, false, "#555")}
            >
              Выходные
            </button>
            <button
              style={{
                ...grayButtonStyle,
                padding: "8px 12px",
                fontSize: "14px",
              }}
              onClick={() => selectPresetDays("everyday")}
              onMouseOver={(e) => handleColoredButtonAnimation(e, true, "#555")}
              onMouseOut={(e) => handleColoredButtonAnimation(e, false, "#555")}
            >
              Каждый день
            </button>
          </div>

          {/* Выбор конкретных дней */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
            }}
          >
            {daysOfWeek.map((day) => (
              <button
                key={day.id}
                style={{
                  padding: "10px",
                  borderRadius: "20px",
                  border: "none",
                  backgroundColor: selectedDays.includes(day.id)
                    ? "#4caf50"
                    : "#2a2a2a",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                }}
                onClick={() => toggleDay(day.id)}
                onMouseOver={(e) => {
                  if (!selectedDays.includes(day.id)) {
                    e.target.style.backgroundColor = "#3a3a3a";
                  }
                }}
                onMouseOut={(e) => {
                  if (!selectedDays.includes(day.id)) {
                    e.target.style.backgroundColor = "#2a2a2a";
                  }
                }}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>

        {/* Время напоминаний */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <strong>Время напоминаний:</strong>
          </label>

          {times.map((time, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "10px",
                alignItems: "center",
              }}
            >
              <input
                type="time"
                value={time}
                onChange={(e) => updateTime(index, e.target.value)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 25,
                  border: "none",
                  fontSize: 16,
                  backgroundColor: "#2a2a2a",
                  color: "#fff",
                  fontFamily: "'Inter', 'Arial', sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {times.length > 1 && (
                <button
                  onClick={() => removeTimeField(index)}
                  style={{
                    padding: "10px 15px",
                    borderRadius: "20px",
                    border: "none",
                    backgroundColor: "#f44336",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addTimeField}
            style={{
              padding: "10px 15px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: "#2196f3",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              width: "100%",
            }}
          >
            + Добавить время
          </button>
        </div>

        {isReminderActive ? (
          <div>
            <p style={{ color: "#4caf50", textAlign: "center" }}>
              Напоминания активны
            </p>
            <button
              style={redButtonStyle}
              onClick={cancelReminder}
              onMouseOver={(e) =>
                handleColoredButtonAnimation(e, true, "#f44336")
              }
              onMouseOut={(e) =>
                handleColoredButtonAnimation(e, false, "#f44336")
              }
              onMouseDown={(e) => handleButtonPress(e, true)}
              onMouseUp={(e) => handleButtonPress(e, false)}
            >
              Отменить все напоминания
            </button>
          </div>
        ) : (
          <button
            style={greenButtonStyle}
            onClick={scheduleNotification}
            disabled={notificationPermission !== "granted"}
            onMouseOver={(e) =>
              handleColoredButtonAnimation(e, true, "#4caf50")
            }
            onMouseOut={(e) =>
              handleColoredButtonAnimation(e, false, "#4caf50")
            }
            onMouseDown={(e) => handleButtonPress(e, true)}
            onMouseUp={(e) => handleButtonPress(e, false)}
          >
            Установить напоминания
          </button>
        )}
      </div>

      {/* Информация */}
      <div
        style={{
          backgroundColor: "#1e1e1e",
          borderRadius: 25,
          padding: 20,
          color: "#ccc",
          fontSize: "14px",
        }}
      >
        <h4>Как это работает:</h4>
        <ul style={{ paddingLeft: "20px" }}>
          <li>Выберите дни недели для напоминаний</li>
          <li>Добавьте одно или несколько времен напоминаний</li>
          <li>Нажмите "Установить напоминания"</li>
          <li>Вы будете получать уведомления в выбранные дни и время</li>
          <li>Каждое уведомление показывается только один раз в день</li>
          <li>Напоминания работают даже когда приложение закрыто</li>
        </ul>

        {isAndroidDevice && (
          <>
            <h4 style={{ marginTop: "15px" }}>Для Android:</h4>
            <ul style={{ paddingLeft: "20px" }}>
              <li>Убедитесь, что браузер не заблокирован в фоне</li>
              <li>
                Проверьте настройки батареи - отключите оптимизацию для браузера
              </li>
            </ul>
          </>
        )}

        {isIOSDevice && (
          <>
            <h4 style={{ marginTop: "15px" }}>Для iOS:</h4>
            <ul style={{ paddingLeft: "20px" }}>
              <li>
                Уведомления работают только в standalone режиме (добавлено на
                домашний экран)
              </li>
              <li>
                Разрешите уведомления в Настройки → Уведомления → Medical Test
              </li>
            </ul>
          </>
        )}
      </div>
      {/* Карточка с рекомендациями по запоминанию */}
      <div
        style={{
          backgroundColor: "#1e1e1e",
          borderRadius: 25,
          padding: 20,
          marginTop: 20,
          color: "#ccc",
          fontSize: "14px",
        }}
      >
        <h4
          style={{
            color: "#ccc",
            marginBottom: "15px",
            fontFamily: "'Inter', 'Arial', sans-serif",
            //fontWeight: "400",
          }}
        >
          Как лучше запоминать
        </h4>

        <p
          style={{ marginBottom: "15px", color: "#4caf50", fontWeight: "500" }}
        >
          «Система Лейтнера»
        </p>

        <ul style={{ paddingLeft: "20px" }}>
          <li>
            <strong>Первое изучение.</strong> Вы учите новую порцию информации.
          </li>
          <li><strong>Первое повторение:</strong> через 15-60 минут. Закрепляете
            материал сразу после изучения.</li>
          <li><strong>Второе повторение:</strong> через 6-8 часов (в тот же день).</li>
          <li><strong>Третье повторение:</strong> на следующий день.</li>
          <li><strong>Четвертое повторение:</strong> через 1-2 дня.</li>
          <li><strong>Пятое повторение:</strong> через 4-7 дней.</li>
          <li><strong>Шестое повторение:</strong> через 1-2 недели.</li>
          <li><strong>Следующее повторение:</strong> через 1 месяц. И так далее.</li>
        </ul>
        
      </div>
    </div>
  );
};

export default ReminderScreen;
