import React, { useState } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Zap,
  Target,
  BarChart3
} from "lucide-react";

// ✅ TYPES
interface PriorityResult {
  score: number;
  level: "high" | "medium" | "low";
  explanation: string;
  breakdown: {
    urgency: number;
    importance: number;
    effort: number;
    dependencies: number;
  };
}

interface Task {
  id: string;
  title: string;
  due_date: string;
  estimated_hours: number;
  importance: number;
  dependencies: string[];
  priority?: PriorityResult;
}

const TaskAnalyzer: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analyzedTasks, setAnalyzedTasks] = useState<Task[]>([]);
  const [sortStrategy, setSortStrategy] = useState<string>("smart_balance");
  const [showAddForm, setShowAddForm] = useState<boolean>(true);
  const [jsonInput, setJsonInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: "",
    due_date: "",
    estimated_hours: "",
    importance: 5,
    dependencies: ""
  });

  // ✅ SAFE INPUT HANDLER
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: name === "importance" ? Number(value) : value
    }));
  };

  // ✅ SAFE PRIORITY FUNCTION
  const calculatePriority = (
    task: Task,
    allTasks: Task[],
    strategy: string
  ): PriorityResult => {
    const now = Date.now();
    const dueDate = new Date(task.due_date).getTime();
    const daysUntilDue =
      (dueDate - now) / (1000 * 60 * 60 * 24);

    let urgencyScore = 0;
    if (daysUntilDue < 0) urgencyScore = 10 + Math.abs(daysUntilDue) * 0.5;
    else if (daysUntilDue <= 1) urgencyScore = 9;
    else if (daysUntilDue <= 3) urgencyScore = 7;
    else if (daysUntilDue <= 7) urgencyScore = 5;
    else if (daysUntilDue <= 14) urgencyScore = 3;
    else urgencyScore = 1;

    const importanceScore = task.importance ?? 5;
    const effortScore = 10 - Math.min(task.estimated_hours ?? 1, 10);

    let dependencyScore = 0;
    if (Array.isArray(task.dependencies)) {
      const blocked = allTasks.filter(t =>
        task.dependencies.includes(t.id)
      );
      dependencyScore = blocked.length * 2;
    }

    let finalScore = 0;
    let explanation = "";

    switch (strategy) {
      case "fastest_wins":
        finalScore =
          effortScore * 0.6 +
          urgencyScore * 0.2 +
          importanceScore * 0.2;
        explanation = "Quick wins prioritized";
        break;

      case "high_impact":
        finalScore =
          importanceScore * 0.7 +
          urgencyScore * 0.2 +
          effortScore * 0.1;
        explanation = "High importance focus";
        break;

      case "deadline_driven":
        finalScore =
          urgencyScore * 0.7 +
          importanceScore * 0.2 +
          effortScore * 0.1;
        explanation = "Deadline focused";
        break;

      default:
        finalScore =
          urgencyScore * 0.35 +
          importanceScore * 0.35 +
          effortScore * 0.15 +
          dependencyScore * 0.15;
        explanation = "Balanced priority";
    }

    return {
      score: Math.round(finalScore * 10) / 10,
      level:
        finalScore >= 7
          ? "high"
          : finalScore >= 4
          ? "medium"
          : "low",
      explanation,
      breakdown: {
        urgency: Math.round(urgencyScore * 10) / 10,
        importance: importanceScore,
        effort: Math.round(effortScore * 10) / 10,
        dependencies: dependencyScore
      }
    };
  };

  // ✅ ADD TASK SAFE
  const addTask = () => {
    if (!formData.title || !formData.due_date || !formData.estimated_hours) {
      alert("Please fill in all required fields");
      return;
    }

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: formData.title,
      due_date: formData.due_date,
      estimated_hours: Number(formData.estimated_hours),
      importance: Number(formData.importance),
      dependencies: formData.dependencies
        ? formData.dependencies.split(",").map(d => d.trim())
        : []
    };

    setTasks(prev => [...prev, newTask]);

    setFormData({
      title: "",
      due_date: "",
      estimated_hours: "",
      importance: 5,
      dependencies: ""
    });
  };

  // ✅ ANALYZE LOCALLY (NO BACKEND REQUIRED)
  const analyzeTasks = () => {
    if (tasks.length === 0) {
      alert("Please add tasks first");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const analyzed = tasks.map(task => ({
        ...task,
        priority: calculatePriority(task, tasks, sortStrategy)
      }));

      analyzed.sort(
        (a, b) =>
          (b.priority?.score ?? 0) -
          (a.priority?.score ?? 0)
      );

      setAnalyzedTasks(analyzed);
      setLoading(false);
    }, 500);
  };

  // ✅ UI HELPERS
  const getPriorityColor = (level: string): string => {
    switch (level) {
      case "high":
        return "bg-red-100 border-red-500 text-red-800";
      case "medium":
        return "bg-yellow-100 border-yellow-500 text-yellow-800";
      case "low":
        return "bg-green-100 border-green-500 text-green-800";
      default:
        return "bg-gray-100 border-gray-500 text-gray-800";
    }
  };

  const getStrategyIcon = (strategy: string): React.ReactNode => {
    switch (strategy) {
      case "fastest_wins":
        return <Zap className="w-5 h-5" />;
      case "high_impact":
        return <Target className="w-5 h-5" />;
      case "d
