// src/utils/reminders.js
// Утилиты для работы с напоминаниями

// Улучшенная проверка напоминаний
export const checkReminder = () => {
  if (!("Notification" in window)) {
    console.log("Браузер не поддерживает уведомления");
    return;
  }

  const reminderSettings = localStorage.getItem("reminderSettings");
  if (!reminderSettings) return;

  const settings = JSON.parse(reminderSettings);
  const { isActive, times, days, lastNotificationDates = {} } = settings;

  if (!isActive || !times || times.length === 0 || !days || days.length === 0) {
    console.log("🔔 Напоминание не активно или настройки неполные");
    return;
  }

  const now = new Date();
  const today = now.toDateString();
  const currentDay = now.getDay(); // 0 - воскресенье, 1 - понедельник, ..., 6 - суббота

  // Проверяем, сегодня ли выбранный день
  if (!days.includes(currentDay)) {
    console.log("🔔 Сегодня не выбранный день для напоминания");
    return;
  }

  // Проверяем каждое установленное время
  times.forEach((time, index) => {
    const [hours, minutes] = time.split(":");
    const reminderDate = new Date();
    reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Вычисляем разницу во времени в миллисекундах
    const timeDiff = reminderDate - now;

    console.log(`🔔 Проверка напоминания ${time}: 
      Сейчас: ${now.toLocaleTimeString()}
      Напоминание на: ${time}
      Разница: ${Math.round(timeDiff / 1000 / 60)} минут`);

    // Ключ для хранения последнего уведомления (день + время)
    const notificationKey = `${today}_${time}`;

    // Если уведомление уже показывали сегодня для этого времени - пропускаем
    if (lastNotificationDates[notificationKey]) {
      console.log(`🔔 Уведомление для ${time} уже показывали сегодня`);
      return;
    }

    // Уведомление приходит В установленное время или в течение 1 минуты после
    if (timeDiff <= 0 && timeDiff >= -60 * 1000) {
      console.log(`🔔 Показываем уведомление для ${time}!`);
      showReminderNotification(time);

      // Обновляем даты последних уведомлений
      const updatedSettings = {
        ...settings,
        lastNotificationDates: {
          ...lastNotificationDates,
          [notificationKey]: new Date().toISOString(),
        },
      };
      localStorage.setItem("reminderSettings", JSON.stringify(updatedSettings));
    }
  });
};

// Очистка старых записей о уведомлениях (вызывается при загрузке)
export const cleanupOldNotifications = () => {
  const reminderSettings = localStorage.getItem("reminderSettings");
  if (!reminderSettings) return;

  const settings = JSON.parse(reminderSettings);
  const { lastNotificationDates = {} } = settings;

  const today = new Date().toDateString();
  const updatedDates = {};

  // Оставляем только сегодняшние уведомления
  Object.keys(lastNotificationDates).forEach((key) => {
    if (key.startsWith(today)) {
      updatedDates[key] = lastNotificationDates[key];
    }
  });

  // Если есть изменения - сохраняем
  if (
    Object.keys(updatedDates).length !==
    Object.keys(lastNotificationDates).length
  ) {
    const updatedSettings = {
      ...settings,
      lastNotificationDates: updatedDates,
    };
    localStorage.setItem("reminderSettings", JSON.stringify(updatedSettings));
    console.log("🧹 Очищены старые записи уведомлений");
  }
};

// Показ уведомления через Service Worker
export const showReminderNotification = async (time = "") => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      const body = time
        ? `Не забудьте пройти тесты для повторения материала. (Напоминание на ${time})`
        : "Не забудьте пройти тесты для повторения материала.";

      // Пытаемся показать уведомление через Service Worker
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SHOW_NOTIFICATION",
          title: "Medical Test - Время заниматься!",
          body: body,
        });
        console.log("Уведомление отправлено через Service Worker");
      } else {
        // Фолбэк на стандартные уведомления
        new Notification("Medical Test - Время заниматься!", {
          body: body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
        });
        console.log("Уведомление показано через стандартный API");
      }
    } catch (error) {
      console.error("Ошибка показа уведомления:", error);

      // Фолбэк на стандартные уведомления
      new Notification("Medical Test - Время заниматься!", {
        body: "Не забудьте пройти тесты для повторения материала.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      });
    }
  }
};

// Тестовое уведомление (только по явному запросу)
export const testNotification = async () => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SHOW_NOTIFICATION",
          title: "Medical Test - Тестовое уведомление",
          body: "Это тестовое уведомление. Напоминания будут приходить в установленное время.",
        });
      } else {
        new Notification("Medical Test - Тестовое уведомление", {
          body: "Это тестовое уведомление. Напоминания будут приходить в установленное время.",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
        });
      }
    } catch (error) {
      console.error("Ошибка тестового уведомления:", error);
      new Notification("Medical Test - Тестовое уведомление", {
        body: "Это тестовое уведомление. Напоминания будут приходить в установленное время.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      });
    }
  }
};

// Проверка статуса уведомлений
export const getNotificationStatus = () => {
  if (!("Notification" in window)) {
    return {
      supported: false,
      permission: "unsupported",
    };
  }

  return {
    supported: true,
    permission: Notification.permission,
  };
};

// Запускаем проверку каждую минуту
setInterval(checkReminder, 60 * 1000);

// Очищаем старые уведомления при загрузке
cleanupOldNotifications();

// Проверяем сразу при загрузке
checkReminder();
