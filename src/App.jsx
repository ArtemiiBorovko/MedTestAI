console.log("BUILD VERSION 89");

import React, { useState, useEffect } from "react";
import SplashScreen from "./SplashScreen";
import HomeScreen from "./components/HomeScreen";
import TestScreen from "./screens/TestScreen";
import ArchiveScreen from "./screens/ArchiveScreen";
import FavoritesScreen from "./screens/FavoritesScreen";
import ReminderScreen from "./screens/ReminderScreen";
import FastTestScreen from "./screens/FastTestScreen";
import CorrectArchiveScreen from "./screens/CorrectArchiveScreen";
import IncorrectArchiveScreen from "./screens/IncorrectArchiveScreen";
import PhotosArchiveScreen from "./screens/PhotosArchiveScreen";
import AllQuestionsArchiveScreen from "./screens/AllQuestionsArchiveScreen";
import StudyScreen from "./screens/StudyScreen";
import StudyArchiveScreen from "./screens/StudyArchiveScreen";

// Импортируем новые экраны категорий
import BacteriologyTestScreen from "./screens/BacteriologyTestScreen";
import VirologyTestScreen from "./screens/VirologyTestScreen";
import MycologyTestScreen from "./screens/MycologyTestScreen";
import ParasitologyTestScreen from "./screens/ParasitologyTestScreen";
import OtherTestScreen from "./screens/OtherTestScreen";
import AISettingsScreen from "./screens/AISettingsScreen";

//import { updateAnswerArchives, getUserAnswersByType } from "../utils/archiveUtils";
import "./App.css";
import "./utils/reminders";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState("home");
  const [screenHistory, setScreenHistory] = useState(["home"]);

  // Обработчик кнопки "Назад"
  useEffect(() => {
    const handleBackButton = (e) => {
      e.preventDefault();

      if (screenHistory.length > 1) {
        const newHistory = [...screenHistory];
        newHistory.pop();
        const previousScreen = newHistory[newHistory.length - 1];
        setScreenHistory(newHistory);
        setCurrentScreen(previousScreen);
      } else {
        if (window.navigator.standalone) {
          window.close();
        } else {
          window.history.back();
        }
      }
    };

    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [screenHistory]);

  // Функция для навигации с сохранением истории
  const navigateToScreen = (screen) => {
    setScreenHistory((prev) => [...prev, screen]);
    setCurrentScreen(screen);
    window.history.pushState({ screen }, "");
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomeScreen setCurrentScreen={navigateToScreen} />;
      case "test":
        return <TestScreen setCurrentScreen={navigateToScreen} />;
      case "archive":
        return <ArchiveScreen setCurrentScreen={navigateToScreen} />;
      case "favorites":
        return <FavoritesScreen setCurrentScreen={navigateToScreen} />;
      case "reminder":
        return <ReminderScreen setCurrentScreen={navigateToScreen} />;
      case "fast-test":
        return <FastTestScreen setCurrentScreen={navigateToScreen} />;
      case "correct-archive":
        return <CorrectArchiveScreen setCurrentScreen={navigateToScreen} />;
      case "incorrect-archive":
        return <IncorrectArchiveScreen setCurrentScreen={navigateToScreen} />;
      case "photos-archive":
        return <PhotosArchiveScreen setCurrentScreen={navigateToScreen} />;
      case "all-questions-archive":
        return (
          <AllQuestionsArchiveScreen setCurrentScreen={navigateToScreen} />
        );
      case "study":
        return <StudyScreen setCurrentScreen={navigateToScreen} />;
      case "study-archive":
        return <StudyArchiveScreen setCurrentScreen={navigateToScreen} />;

      // Новые экраны категорий
      case "bacteriology":
        return <BacteriologyTestScreen setCurrentScreen={navigateToScreen} />;
      case "virology":
        return <VirologyTestScreen setCurrentScreen={navigateToScreen} />;
      case "mycology":
        return <MycologyTestScreen setCurrentScreen={navigateToScreen} />;
      case "parasitology":
        return <ParasitologyTestScreen setCurrentScreen={navigateToScreen} />;
      case "other":
        return <OtherTestScreen setCurrentScreen={navigateToScreen} />;
      // В switch-case добавьте:
      case "ai-settings":
        return <AISettingsScreen setCurrentScreen={navigateToScreen} />;

      default:
        return <HomeScreen setCurrentScreen={navigateToScreen} />;
    }
  };

  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => {
          setShowSplash(false);
        }}
      />
    );
  }

  return (
    <div style={{ backgroundColor: "#121212", minHeight: "100vh" }}>
      {renderScreen()}
    </div>
  );
}

export default App;
