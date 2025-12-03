import questions from "../questions.json";
import { categorizeQuestion } from "./categorizeQuestions";

// Добавляем категории ко всем вопросам
const questionsWithCategories = questions.map((question) => ({
  ...question,
  category: categorizeQuestion(question.question),
}));

// Сохраняем результат (в реальном проекте это будет отдельный файл)
console.log("Questions with categories:", questionsWithCategories);

// Экспортируем обновленные вопросы
export default questionsWithCategories;
