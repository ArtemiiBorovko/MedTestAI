import React, { useEffect, useState } from "react";
import "./SplashScreen.css";
import logo from "./logo.png";

function SplashScreen({ onFinish }) {
  const [logoVisible, setLogoVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    // Появление логотипа через 100мс
    const logoTimer = setTimeout(() => setLogoVisible(true), 100);

    // Появление текста чуть позже
    const textTimer = setTimeout(() => setTextVisible(true), 500);

    // Через 2.5 сек заканчиваем сплэш
    const finishTimer = setTimeout(() => onFinish(), 2500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className="splash-container">
      <img
        src={logo}
        alt="Логотип"
        className={`splash-logo ${logoVisible ? "visible" : ""}`}
      />
      <h1 className={`splash-text ${textVisible ? "visible" : ""}`}>
        Добро пожаловать!
      </h1>
    </div>
  );
}

export default SplashScreen;
