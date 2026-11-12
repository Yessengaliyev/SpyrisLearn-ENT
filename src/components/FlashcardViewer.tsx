import React, { useState } from 'react';
import { Flashcard } from '../types';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { RotateCcw, ChevronLeft, ChevronRight, Layers, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils';

interface Props {
  flashcards: Flashcard[];
}

function Card({ 
  card, 
  index, 
  total, 
  isTop, 
  onSwipe 
}: { 
  card: Flashcard; 
  index: number; 
  total: number; 
  isTop: boolean;
  onSwipe: (direction: number) => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? 1 : -1);
    }
  };

  const handleTap = () => {
    if (isTop) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <motion.div
      style={{ 
        x: isTop ? x : 0, 
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 0.4,
        scale: isTop ? 1 : 0.95 - (index * 0.05),
        zIndex: total - index,
        y: isTop ? 0 : index * 12,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className={cn(
        "absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing perspective-1000",
        !isTop && "pointer-events-none"
      )}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        onClick={handleTap}
      >
        {/* Front Side: QUESTION */}
        <div 
          className="absolute inset-0 w-full h-full bg-surge-card border-2 border-surge-purple/20 rounded-[2.5rem] shadow-2xl flex flex-col p-10 backface-hidden overflow-hidden group hover:border-surge-purple/50 transition-colors"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="px-3 py-1 bg-surge-purple/10 rounded-lg border border-surge-purple/20 text-[10px] font-bold text-surge-purple uppercase tracking-widest">
              Question
            </div>
            <div className="text-[10px] font-bold text-surge-ink/20 uppercase tracking-widest">
              #{total - index}
            </div>
          </div>

          <div className="flex-grow flex flex-col justify-center text-center">
            <h3 className="font-display font-bold text-surge-ink text-2xl md:text-3xl leading-tight">
              {card.front}
            </h3>
          </div>

          <div className="absolute bottom-10 left-0 w-full flex justify-center">
            <div className="flex items-center gap-2 text-[10px] font-bold text-surge-purple/40 uppercase tracking-widest animate-pulse">
              <RotateCcw size={14} />
              Tap to flip
            </div>
          </div>
        </div>

        {/* Back Side: ANSWER */}
        <div 
          className="absolute inset-0 w-full h-full bg-surge-purple border-4 border-white/20 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-10 backface-hidden rotate-y-180 overflow-hidden"
        >
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          </div>

          <div className="relative z-10 text-center">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6">Answer</div>
            <p className="text-xl md:text-2xl text-white font-medium leading-relaxed">
              {card.back}
            </p>
          </div>

          <div className="absolute bottom-10 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            Tap to see question
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FlashcardViewer({ flashcards }: Props) {
  const [stack, setStack] = useState(flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="w-full my-6 p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
        <p className="text-red-400 font-medium">Oops! Spyris couldn't generate the flashcards. Please try a different topic or try again later.</p>
      </div>
    );
  }

  const handleSwipe = (direction: number) => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
  };

  return (
    <div className="w-full max-w-xl mx-auto my-12 px-4 flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full flex justify-between items-center mb-8">
        <div className="flex items-center gap-2 px-4 py-2 bg-surge-purple/10 rounded-full border border-surge-purple/20">
          <Layers size={14} className="text-surge-purple" />
          <span className="text-xs font-bold text-surge-purple uppercase tracking-widest">
            {currentIndex + 1} / {flashcards.length} Cards
          </span>
        </div>
        
        <button 
          onClick={handleReset}
          className="text-xs font-bold text-surge-ink/40 hover:text-surge-purple transition-colors flex items-center gap-2"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {/* Card Stack Container */}
      <div className="relative w-full aspect-[4/5] md:aspect-[4/3]">
        <AnimatePresence initial={false}>
          {flashcards.slice(currentIndex, currentIndex + 3).map((card, index) => (
            <Card
              key={card.front + (currentIndex + index)}
              card={card}
              index={index}
              total={flashcards.length}
              isTop={index === 0}
              onSwipe={handleSwipe}
            />
          ))}
        </AnimatePresence>

        {currentIndex === flashcards.length && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-surge-card border-2 border-dashed border-surge-purple/20 rounded-[2.5rem] flex flex-col items-center justify-center p-10 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-surge-purple/10 flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="text-surge-purple" />
            </div>
            <h3 className="text-2xl font-display font-bold text-surge-ink mb-2">Deck Mastered!</h3>
            <button 
              onClick={handleReset}
              className="mt-6 px-8 py-4 bg-surge-purple text-white font-bold rounded-2xl shadow-xl shadow-surge-purple/20 hover:scale-105 active:scale-95 transition-all"
            >
              Study Again
            </button>
          </motion.div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-8 mt-12">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="w-16 h-16 rounded-2xl bg-surge-card border border-surge-border flex items-center justify-center text-surge-ink/40 hover:text-surge-purple hover:border-surge-purple transition-all hover:scale-110 active:scale-95 shadow-xl disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:scale-100"
          title="Previous Card"
        >
          <ChevronLeft size={28} />
        </button>
        
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1.5">
            {flashcards.map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === currentIndex ? "w-8 bg-surge-purple" : "w-1.5 bg-surge-ink/10"
                )}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-surge-ink/20 uppercase tracking-widest mt-2">
            Progress: {Math.round(((currentIndex + 1) / flashcards.length) * 100)}%
          </span>
        </div>

        <button 
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          className="w-16 h-16 rounded-2xl bg-surge-card border border-surge-border flex items-center justify-center text-surge-ink/40 hover:text-surge-purple hover:border-surge-purple transition-all hover:scale-110 active:scale-95 shadow-xl disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:scale-100"
          title="Next Card"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <p className="text-[10px] font-bold text-surge-ink/20 uppercase tracking-[0.2em]">
          Tap to flip • Swipe or use buttons to change card
        </p>
      </div>
    </div>
  );
}
