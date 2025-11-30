import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Zap, 
  Target, 
  BarChart3 
} from 'lucide-react';

// Types
interface Task {
  id: string;
  title: string;
  due_date: string;
  estimated_hours: number;
  importance: number;
  dependencies: string[];
}

interface PriorityBreakdown {
  urgency: number;
  importance: number;
  effort: number;
  dependencies: number;
}

interface Priority {
  score: number;
  level: 'high' | 'medium' | 'low';
  explanation: string;
  breakdown: PriorityBreakdown;
}

interface AnalyzedTask extends Task {
  priority: Priority;
}

type Strategy = 'smart_balance' | 'fastest_wins' | 'high_impact' | 'deadline_driven';

interface FormData {
  title: string;
  due_date: string;
  estimated_hours: string;
  importance: number;
  dependencies: string;
}

const TaskAnalyzer: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analyzedTasks, setAnalyzedTasks] = useState<AnalyzedTask[]>([]);
  const [sortStrategy, setSortStrategy] = useState<Strategy>('smart_balance');
  const [showAddForm, setShowAddForm] = useState(true);
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    due_date: '',
    estimated_hours: '',
    importance: 5,
    dependencies: ''
  });

  // Priority scoring algorithm
  const calculatePriority = (task: Task, allTasks: Task[], strategy: Strategy = 'smart_balance'): Priority => {
    const now = new Date();
    const dueDate = new Date(task.due_date);
    const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    let urgencyScore = 0;
    if (daysUntilDue < 0) {
      urgencyScore = 10 + Math.abs(daysUntilDue) * 0.5;
    } else if (daysUntilDue <= 1) {
      urgencyScore = 9;
    } else if (daysUntilDue <= 3) {
      urgencyScore = 7;
    } else if (daysUntilDue <= 7) {
      urgencyScore = 5;
    } else if (daysUntilDue <= 14) {
      urgencyScore = 3;
    } else {
      urgencyScore = 1;
    }

    const importanceScore = task.importance || 5;
    const effortScore = 10 - Math.min(task.estimated_hours || 1, 10);
    
    let dependencyScore = 0;
    if (task.dependencies && task.dependencies.length > 0) {
      const blockedTasks = allTasks.filter(t => 
        task.dependencies.includes(t.id)
      );
      dependencyScore = blockedTasks.length * 2;
    }

    let finalScore = 0;
    let explanation = '';

    switch(strategy) {
      case 'fastest_wins':
        finalScore = effortScore * 0.6 + urgencyScore * 0.2 + importanceScore * 0.2;
        explanation = 'Quick wins prioritized';
        break;
      case 'high_impact':
        finalScore = importanceScore * 0.7 + urgencyScore * 0.2 + effortScore * 0.1;
        explanation = 'High importance focus';
        break;
      case 'deadline_driven':
        finalScore = urgencyScore * 0.7 + importanceScore * 0.2 + effortScore * 0.1;
        explanation = 'Deadline focused';
        break;
      default:
        finalScore = (urgencyScore * 0.35) + (importanceScore * 0.35) + 
                    (effortScore * 0.15) + (dependencyScore * 0.15);
        explanation = 'Balanced priority';
    }

    const priorityLevel: 'high' | 'medium' | 'low' = finalScore >= 7 ? 'high' : finalScore >= 4 ? 'medium' : 'low';

    return {
      score: Math.round(finalScore * 10) / 10,
      level: priorityLevel,
      explanation,
      breakdown: {
        urgency: Math.round(urgencyScore * 10) / 10,
        importance: importanceScore,
        effort: Math.round(effortScore * 10) / 10,
        dependencies: dependencyScore
      }
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addTask = () => {
    if (!formData.title || !formData.due_date || !formData.estimated_hours) {
      alert('Please fill in all required fields');
      return;
    }

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: formData.title,
      due_date: formData.due_date,
      estimated_hours: parseFloat(formData.estimated_hours),
      importance: parseInt(formData.importance.toString()),
      dependencies: formData.dependencies ? formData.dependencies.split(',').map(d => d.trim()) : []
    };

    setTasks(prev => [...prev, newTask]);
    setFormData({
      title: '',
      due_date: '',
      estimated_hours: '',
      importance: 5,
      dependencies: ''
    });
  };

  const handleBulkImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const tasksArray: Task[] = Array.isArray(parsed) ? parsed : [parsed];
      
      const validatedTasks: Task[] = tasksArray.map((task, idx) => ({
        id: task.id || `task_${Date.now()}_${idx}`,
        title: task.title || 'Untitled Task',
        due_date: task.due_date || new Date().toISOString().split('T')[0],
        estimated_hours: parseFloat(task.estimated_hours?.toString()) || 1,
        importance: Math.min(Math.max(parseInt(task.importance?.toString()) || 5, 1), 10),
        dependencies: task.dependencies || []
      }));

      setTasks(prev => [...prev, ...validatedTasks]);
      setJsonInput('');
      alert(`${validatedTasks.length} task(s) imported successfully`);
    } catch (error) {
      alert('Invalid JSON format. Please check your input.');
    }
  };

  const analyzeTasks = () => {
    if (tasks.length === 0) {
      alert('Please add some tasks first');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const analyzed: AnalyzedTask[] = tasks.map(task => ({
        ...task,
        priority: calculatePriority(task, tasks, sortStrategy)
      }));

      const sorted = analyzed.sort((a, b) => b.priority.score - a.priority.score);
      setAnalyzedTasks(sorted);
      setLoading(false);
    }, 500);
  };

  const getPriorityColor = (level: 'high' | 'medium' | 'low'): string => {
    switch(level) {
      case 'high': return 'bg-red-100 border-red-500 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-green-100 border-green-500 text-green-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getStrategyIcon = (strategy: Strategy) => {
    switch(strategy) {
      case 'fastest_wins': return <Zap className="w-5 h-5" />;
      case 'high_impact': return <Target className="w-5 h-5" />;
      case 'deadline_driven': return <Calendar className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  const strategies: Array<{ value: Strategy; label: string; desc: string }> = [
    { value: 'smart_balance', label: 'Smart Balance', desc: 'Balances all factors intelligently' },
    { value: 'fastest_wins', label: 'Fastest Wins', desc: 'Prioritize low-effort tasks' },
    { value: 'high_impact', label: 'High Impact', desc: 'Focus on importance over everything' },
    { value: 'deadline_driven', label: 'Deadline Driven', desc: 'Prioritize by due date' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Smart Task Analyzer
            </h1>
          </div>
          <p className="text-gray-600 ml-11">
            Intelligently prioritize your tasks based on multiple factors
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setShowAddForm(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  showAddForm ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Add Task
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  !showAddForm ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Bulk Import
              </button>
            </div>

            {showAddForm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Fix login bug"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Est. Hours *
                    </label>
                    <input
                      type="number"
                      name="estimated_hours"
                      value={formData.estimated_hours}
                      onChange={handleInputChange}
                      min="0.5"
                      step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importance (1-10)
                  </label>
                  <input
                    type="range"
                    name="importance"
                    value={formData.importance}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    className="w-full"
                  />
                  <div className="text-center text-sm font-medium text-indigo-600">
                    {formData.importance}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dependencies (comma-separated IDs)
                  </label>
                  <input
                    type="text"
                    name="dependencies"
                    value={formData.dependencies}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="task_1, task_2"
                  />
                </div>

                <button
                  onClick={addTask}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
                >
                  Add Task
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paste JSON Array
                  </label>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    rows={10}
                    placeholder='[{"title": "Task 1", "due_date": "2025-12-01", "estimated_hours": 3, "importance": 8}]'
                  />
                </div>
                <button
                  onClick={handleBulkImport}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
                >
                  Import Tasks
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Current Tasks: {tasks.length}
                </span>
                {tasks.length > 0 && (
                  <button
                    onClick={() => setTasks([])}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Strategy Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Sorting Strategy
            </h2>

            <div className="space-y-3">
              {strategies.map(strategy => (
                <button
                  key={strategy.value}
                  onClick={() => setSortStrategy(strategy.value)}
                  className={`w-full p-4 rounded-lg border-2 transition text-left ${
                    sortStrategy === strategy.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${sortStrategy === strategy.value ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {getStrategyIcon(strategy.value)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {strategy.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {strategy.desc}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={analyzeTasks}
              disabled={loading || tasks.length === 0}
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Analyze Tasks'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {analyzedTasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Analysis Results
            </h2>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
                Top 3 Tasks to Work On Today
              </h3>
              <div className="space-y-2">
                {analyzedTasks.slice(0, 3).map((task, idx) => (
                  <div key={task.id} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-medium text-gray-800">{task.title}</span>
                      <span className="text-gray-600"> - {task.priority.explanation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {analyzedTasks.map((task, idx) => (
                <div
                  key={task.id}
                  className={`border-l-4 rounded-lg p-4 ${getPriorityColor(task.priority.level)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-white bg-opacity-50">
                          #{idx + 1}
                        </span>
                        <h3 className="text-lg font-bold">{task.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {task.due_date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {task.estimated_hours}h
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Importance: {task.importance}/10
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {task.priority.score}
                      </div>
                      <div className="text-xs uppercase font-medium">
                        {task.priority.level}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <div className="text-sm">
                      <strong>Score Breakdown:</strong> Urgency: {task.priority.breakdown.urgency}, 
                      Importance: {task.priority.breakdown.importance}, 
                      Effort: {task.priority.breakdown.effort}, 
                      Dependencies: {task.priority.breakdown.dependencies}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskAnalyzer;