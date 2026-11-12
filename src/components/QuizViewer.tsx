import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle2, XCircle, RotateCcw, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

interface Props {
  quiz: QuizQuestion[];
  onComplete?: () => void;
}

export function QuizViewer({ quiz, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(quiz.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [hasNotifiedCompletion, setHasNotifiedCompletion] = useState(false);

  if (!quiz || quiz.length === 0) {
    return (
      <div className="w-full my-6 p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
        <p className="text-red-400 font-medium">Oops! Spyris couldn't generate the quiz. Please try a different topic or try again later.</p>
      </div>
    );
  }

  const handleSelect = (optionIndex: number) => {
    if (showResults) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
      if (onComplete && !hasNotifiedCompletion) {
        onComplete();
        setHasNotifiedCompletion(true);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const calculateScore = () => {
    return answers.reduce((score, answer, idx) => {
      return score + (answer === quiz[idx].correctAnswerIndex ? 1 : 0);
    }, 0);
  };

  const handleRestart = () => {
    setAnswers(new Array(quiz.length).fill(null));
    setShowResults(false);
    setCurrentIndex(0);
  };

  const currentQuestion = quiz[currentIndex];
  const isLastQuestion = currentIndex === quiz.length - 1;
  const hasAnsweredCurrent = answers[currentIndex] !== null;

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="w-full max-w-3xl mx-auto space-y-8 my-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surge-card border-2 border-surge-purple/20 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-surge-purple to-transparent opacity-50" />
          <div className="w-20 h-20 bg-surge-purple/10 rounded-2xl flex items-center justify-center text-surge-purple mx-auto mb-6">
            <Trophy size={40} />
          </div>
          <h3 className="text-4xl font-display font-bold text-surge-ink mb-2">Quiz Complete!</h3>
          <div className="flex items-center justify-center gap-4 my-8">
            <div className="text-7xl font-black text-surge-purple">{score}</div>
            <div className="text-3xl font-bold text-surge-ink/20">/</div>
            <div className="text-5xl font-bold text-surge-ink/40">{quiz.length}</div>
          </div>
          <p className="text-xl text-surge-ink/60 font-medium mb-10">
            {score === quiz.length ? "Legendary! You mastered this topic." : 
             score >= quiz.length * 0.8 ? "Excellent work! Almost perfect." : 
             score >= quiz.length * 0.5 ? "Good job! You have a solid grasp." : 
             "Keep practicing! You'll get better."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleRestart}
              className="flex items-center justify-center gap-3 px-10 py-5 bg-surge-purple text-white font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-surge-purple/20"
            >
              <RotateCcw size={22} />
              Retake Quiz
            </button>
          </div>
        </motion.div>

        <div className="space-y-6">
          {quiz.map((q, qIdx) => (
            <div key={qIdx} className="bg-surge-card border border-surge-border rounded-3xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-bold text-surge-ink/30 uppercase tracking-widest">Question {qIdx + 1}</span>
                {answers[qIdx] === q.correctAnswerIndex ? (
                  <CheckCircle2 size={20} className="text-emerald-500" />
                ) : (
                  <XCircle size={20} className="text-rose-500" />
                )}
              </div>
              <h4 className="text-base font-bold text-surge-ink mb-4">{q.question}</h4>
              <div className="space-y-2 mb-4">
                {q.options.map((opt, oIdx) => {
                  const isCorrect = oIdx === q.correctAnswerIndex;
                  const isSelected = oIdx === answers[qIdx];
                  return (
                    <div 
                      key={oIdx}
                      className={cn(
                        "p-3 rounded-xl text-sm border",
                        isCorrect ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" :
                        isSelected ? "bg-rose-500/10 border-rose-500/50 text-rose-400" :
                        "bg-surge-ink/5 border-transparent text-surge-ink/40"
                      )}
                    >
                      {opt}
                    </div>
                  );
                })}
              </div>
              <div className="p-3 bg-surge-purple/5 rounded-xl">
                <p className="text-xs text-surge-ink/60 leading-relaxed">
                  <span className="font-bold text-surge-purple mr-1">Explanation:</span>
                  {q.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-surge-purple uppercase tracking-widest">
            Question {currentIndex + 1} of {quiz.length}
          </span>
          <span className="text-xs font-bold text-surge-ink/30 uppercase tracking-widest">
            {Math.round(((currentIndex + 1) / quiz.length) * 100)}% Complete
          </span>
        </div>
        <div className="h-2 bg-surge-ink/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-surge-purple"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / quiz.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-surge-card border-2 border-surge-purple/10 rounded-[2.5rem] p-10 shadow-2xl"
        >
          <h3 className="text-xl md:text-2xl font-bold text-surge-ink mb-10 leading-relaxed">
            {currentQuestion.question}
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((option, oIdx) => {
              const isSelected = answers[currentIndex] === oIdx;
              return (
                <button 
                  key={oIdx}
                  onClick={() => handleSelect(oIdx)}
                  className={cn(
                    "w-full text-left p-5 rounded-2xl border-2 transition-all font-medium relative group overflow-hidden",
                    isSelected 
                      ? "border-surge-purple bg-surge-purple/10 text-surge-ink shadow-lg shadow-surge-purple/10" 
                      : "border-surge-ink/5 bg-surge-ink/5 hover:border-surge-purple/30 hover:bg-surge-purple/5 text-surge-ink/60 hover:text-surge-ink"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold border transition-all",
                      isSelected ? "bg-surge-purple border-surge-purple text-white" : "bg-surge-ink/10 border-surge-ink/10 text-surge-ink/40 group-hover:border-surge-purple/50 group-hover:text-surge-purple"
                    )}>
                      {String.fromCharCode(65 + oIdx)}
                    </div>
                    <span className="text-base">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={cn(
            "flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all",
            currentIndex === 0 
              ? "text-surge-ink/10 cursor-not-allowed" 
              : "text-surge-ink/40 hover:text-surge-purple hover:bg-surge-purple/5"
          )}
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        <button 
          onClick={handleNext}
          disabled={!hasAnsweredCurrent}
          className={cn(
            "flex items-center gap-2 px-10 py-4 rounded-2xl font-bold transition-all shadow-xl",
            hasAnsweredCurrent 
              ? "bg-surge-purple text-white shadow-surge-purple/20 hover:scale-105 active:scale-95" 
              : "bg-surge-ink/10 text-surge-ink/20 cursor-not-allowed"
          )}
        >
          {isLastQuestion ? "Finish Quiz" : "Next Question"}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
