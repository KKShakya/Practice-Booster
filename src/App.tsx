/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Timer, 
  Target, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  ArrowRight, 
  RotateCcw, 
  BrainCircuit, 
  BookOpen, 
  Calculator, 
  Puzzle,
  ChevronRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { Subject, Question, QuestionResult, PerformanceAnalysis, Phase } from './types';

// --- App Component ---

export default function App() {
  // --- State ---
  const [phase, setPhase] = useState<Phase>('setup');
  const [subject, setSubject] = useState<Subject>('Quants');
  const [rawInput, setRawInput] = useState('');
  const [totalTimeLimit, setTotalTimeLimit] = useState(400); // seconds
  const [targetQuestions, setTargetQuestions] = useState(20);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<number, number>>({});
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  // --- Timer Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      handleFinishPractice();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  // --- Handlers ---

  const handleStartParsing = async () => {
    if (!rawInput.trim()) return;
    setPhase('parsing');
    
    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput, subject }),
      });

      if (!response.ok) throw new Error("Failed to parse questions");

      const parsedQuestions = await response.json();
      setQuestions(parsedQuestions);
      setPhase('practice');
      setTimeLeft(totalTimeLimit);
      setIsTimerActive(true);
      setCurrentIndex(0);
      setQuestionStartTimes({ 0: Date.now() });
    } catch (error) {
      console.error("Parsing error:", error);
      setPhase('setup');
      alert("Failed to parse questions. Please check your input format.");
    }
  };

  const handleAnswerSubmit = (answer: string) => {
    const now = Date.now();
    const startTime = questionStartTimes[currentIndex];
    const timeTaken = Math.round((now - startTime) / 1000);

    const isCorrect = answer.trim().toLowerCase() === questions[currentIndex].correctAnswer.trim().toLowerCase();
    
    const newResult: QuestionResult = {
      questionId: questions[currentIndex].id,
      userAnswer: answer,
      isCorrect,
      timeTaken
    };

    setResults(prev => [...prev, newResult]);
    setUserAnswers(prev => ({ ...prev, [currentIndex]: answer }));

    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setQuestionStartTimes(prev => ({ ...prev, [nextIndex]: Date.now() }));
    } else {
      handleFinishPractice();
    }
  };

  const handleFinishPractice = async () => {
    setIsTimerActive(false);
    setPhase('analyzing');
    
    // Calculate basic stats
    const score = results.filter(r => r.isCorrect).length;
    const total = questions.length;
    const accuracy = total > 0 ? (score / total) * 100 : 0;
    const totalTimeUsed = totalTimeLimit - timeLeft;
    const averageSpeed = total > 0 ? totalTimeUsed / total : 0;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions,
          results,
          subject,
          targetQuestions,
          score,
          total,
          accuracy,
          averageSpeed
        }),
      });

      if (!response.ok) throw new Error("Failed to analyze performance");

      const aiAnalysis = await response.json();
      setAnalysis({
        score,
        total,
        accuracy,
        averageSpeed,
        ...aiAnalysis
      });
      setPhase('results');
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysis({
        score,
        total,
        accuracy,
        averageSpeed,
        detailedNote: "Great effort! Keep practicing to improve your speed and accuracy.",
        mistakesAnalysis: "Analysis unavailable at the moment."
      });
      setPhase('results');
    }
  };

  const resetApp = () => {
    setPhase('setup');
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswers({});
    setResults([]);
    setAnalysis(null);
    setTimeLeft(0);
    setIsTimerActive(false);
  };

  // --- Render Helpers ---

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen flex flex-col">
      {/* Header */}
      <header className="mb-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1 rounded-full glass mb-4"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold tracking-widest uppercase text-cyan-400">Zenith Practice Booster</span>
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter mb-4 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
          Master Your <span className="text-cyan-400 neon-text-cyan">Potential</span>
        </h1>
        <p className="text-white/50 max-w-xl mx-auto text-lg font-light">
          A rigorous future-ready playground to overcome your shortcomings through timed precision and AI analysis.
        </p>
      </header>

      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          {phase === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="glass-card p-8 md:p-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {(['Quants', 'Reasoning', 'English'] as Subject[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={cn(
                      "flex flex-col items-center gap-4 p-6 rounded-2xl transition-all duration-300 border",
                      subject === s 
                        ? "bg-cyan-500/20 border-cyan-500/50 neon-border-cyan" 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {s === 'Quants' && <Calculator className={cn("w-8 h-8", subject === s ? "text-cyan-400" : "text-white/40")} />}
                    {s === 'Reasoning' && <Puzzle className={cn("w-8 h-8", subject === s ? "text-cyan-400" : "text-white/40")} />}
                    {s === 'English' && <BookOpen className={cn("w-8 h-8", subject === s ? "text-cyan-400" : "text-white/40")} />}
                    <span className={cn("font-bold tracking-wide", subject === s ? "text-white" : "text-white/40")}>{s}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Input Question Set (Text Format)</label>
                  <textarea
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    placeholder="Paste your questions here... (e.g. 1. 25*4=? 2. 100/5=?)"
                    className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 focus:outline-none focus:border-cyan-500/50 transition-all font-light text-lg resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Practice Time (Seconds)</label>
                    <div className="relative">
                      <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <input
                        type="number"
                        value={totalTimeLimit}
                        onChange={(e) => setTotalTimeLimit(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-cyan-500/50 transition-all font-bold text-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Target Questions</label>
                    <div className="relative">
                      <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <input
                        type="number"
                        value={targetQuestions}
                        onChange={(e) => setTargetQuestions(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-cyan-500/50 transition-all font-bold text-xl"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStartParsing}
                  disabled={!rawInput.trim()}
                  className="w-full group relative overflow-hidden bg-white text-black font-bold py-6 rounded-2xl hover:bg-cyan-400 transition-all duration-500 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10">INITIALIZE BOOSTER</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {(phase === 'parsing' || phase === 'analyzing') && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24"
            >
              <div className="relative w-24 h-24 mb-8">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full"
                />
                <BrainCircuit className="absolute inset-0 m-auto w-10 h-10 text-cyan-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">
                {phase === 'parsing' ? 'Synthesizing Question Set...' : 'AI Performance Analysis...'}
              </h2>
              <p className="text-white/40 font-light">Harnessing neural networks for precision learning.</p>
            </motion.div>
          )}

          {phase === 'practice' && questions.length > 0 && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* HUD */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-4 rounded-2xl flex items-center gap-3">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Time Left</p>
                    <p className={cn("text-xl font-bold font-mono", timeLeft < 30 ? "text-red-400 animate-pulse" : "text-white")}>
                      {formatTime(timeLeft)}
                    </p>
                  </div>
                </div>
                <div className="glass p-4 rounded-2xl flex items-center gap-3">
                  <Target className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Progress</p>
                    <p className="text-xl font-bold font-mono">{currentIndex + 1} / {questions.length}</p>
                  </div>
                </div>
                <div className="glass p-4 rounded-2xl flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Target Gap</p>
                    <p className="text-xl font-bold font-mono">{Math.max(0, targetQuestions - (currentIndex + 1))}</p>
                  </div>
                </div>
                <div className="glass p-4 rounded-2xl flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Subject</p>
                    <p className="text-xl font-bold">{subject}</p>
                  </div>
                </div>
              </div>

              {/* Question Card */}
              <div className="glass-card p-12 min-h-[400px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-8">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60">
                      Question {currentIndex + 1}
                    </span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-light leading-tight mb-12">
                    {questions[currentIndex].text}
                  </h3>

                  {questions[currentIndex].options ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {questions[currentIndex].options?.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleAnswerSubmit(opt)}
                          className="group flex items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/50 transition-all text-left"
                        >
                          <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-lg font-light">{opt}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="relative max-w-md">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Type your answer..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAnswerSubmit((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="w-full bg-white/5 border-b-2 border-white/10 py-4 text-3xl font-bold focus:outline-none focus:border-cyan-500 transition-all placeholder:text-white/10"
                      />
                      <p className="mt-4 text-xs text-white/20 font-bold uppercase tracking-widest">Press Enter to Submit</p>
                    </div>
                  )}
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
                  <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Focused Mode Active</p>
                  <button 
                    onClick={handleFinishPractice}
                    className="text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                  >
                    End Session Early <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'results' && analysis && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-8 flex flex-col items-center text-center">
                  <BarChart3 className="w-8 h-8 text-cyan-400 mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Total Score</p>
                  <p className="text-5xl font-display font-bold">{analysis.score}<span className="text-2xl text-white/20">/{analysis.total}</span></p>
                </div>
                <div className="glass-card p-8 flex flex-col items-center text-center">
                  <Zap className="w-8 h-8 text-purple-400 mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Accuracy</p>
                  <p className="text-5xl font-display font-bold">{analysis.accuracy.toFixed(1)}<span className="text-2xl text-white/20">%</span></p>
                </div>
                <div className="glass-card p-8 flex flex-col items-center text-center">
                  <Timer className="w-8 h-8 text-yellow-400 mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Avg. Speed</p>
                  <p className="text-5xl font-display font-bold">{analysis.averageSpeed.toFixed(1)}<span className="text-2xl text-white/20">s/q</span></p>
                </div>
              </div>

              {/* Target Analysis */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">Target Tracking</h4>
                    <p className="text-sm text-white/40">Comparison with your set goals</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-bold uppercase tracking-widest">
                    <span>Progress to Target</span>
                    <span>{Math.round((analysis.total / targetQuestions) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (analysis.total / targetQuestions) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                    />
                  </div>
                  <p className="text-sm text-white/60">
                    {analysis.total >= targetQuestions 
                      ? "Target achieved! You've met your rigorous practice goal." 
                      : `You lacked ${targetQuestions - analysis.total} questions to meet your target of ${targetQuestions}.`}
                  </p>
                </div>
              </div>

              {/* AI Analysis Note */}
              <div className="glass-card p-8 border-l-4 border-cyan-500">
                <div className="flex items-center gap-3 mb-4">
                  <BrainCircuit className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-lg font-bold uppercase tracking-widest">AI Performance Note</h4>
                </div>
                <p className="text-xl font-light leading-relaxed text-white/80 italic">
                  "{analysis.detailedNote}"
                </p>
              </div>

              {/* Mistakes Analysis */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h4 className="text-lg font-bold uppercase tracking-widest">Deep Analysis & Shortcomings</h4>
                </div>
                <div className="prose-custom">
                  <ReactMarkdown>{analysis.mistakesAnalysis || ''}</ReactMarkdown>
                </div>
              </div>

              {/* Question Breakdown */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 ml-4">Detailed Question Breakdown</h4>
                {questions.map((q, i) => {
                  const res = results.find(r => r.questionId === q.id);
                  return (
                    <div key={q.id} className="glass p-6 rounded-2xl flex items-start gap-6">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        res?.isCorrect ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {res?.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-lg font-light">{q.text}</p>
                          <span className="text-[10px] font-bold font-mono text-white/20 whitespace-nowrap ml-4">
                            {res?.timeTaken}s
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
                          <span className="text-white/40">Correct: <span className="text-white">{q.correctAnswer}</span></span>
                          <span className="text-white/40">Your Answer: <span className={res?.isCorrect ? "text-green-400" : "text-red-400"}>{res?.userAnswer || 'N/A'}</span></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={resetApp}
                className="w-full glass hover:bg-white/10 font-bold py-6 rounded-2xl transition-all flex items-center justify-center gap-2 border-white/20"
              >
                <RotateCcw className="w-5 h-5" />
                <span>NEW PRACTICE SESSION</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-24 pt-8 border-t border-white/5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
          Neural Architecture &copy; 2030 Zenith Systems
        </p>
      </footer>
    </div>
  );
}
