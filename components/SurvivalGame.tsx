'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Heart, Star, X, Zap } from 'lucide-react';
import ResultScreen from '@/components/ResultScreen';

interface SurvivalGameProps {
  onBack: () => void;
}

interface GameData {
  baseWord: string;
  options: string[];
  correctAnswers: number[];
  trapIndex: number;
}

// モックデータ
const mockStages: GameData[] = [
  {
    baseWord: "未来",
    options: ["明日", "希望", "技術", "発展", "進歩", "過去"],
    correctAnswers: [0, 1, 2, 3, 4],
    trapIndex: 5
  },
  {
    baseWord: "海",
    options: ["波", "魚", "青", "塩", "広大", "山"],
    correctAnswers: [0, 1, 2, 3, 4],
    trapIndex: 5
  },
  {
    baseWord: "音楽",
    options: ["メロディ", "リズム", "楽器", "歌", "感情", "沈黙"],
    correctAnswers: [0, 1, 2, 3, 4],
    trapIndex: 5
  }
];

export default function SurvivalGame({ onBack }: SurvivalGameProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastSelection, setLastSelection] = useState<{ index: number; correct: boolean } | null>(null);

  const currentData = mockStages[currentStage];
  const progress = ((currentStage + 1) / mockStages.length) * 100;

  const handleCardClick = (index: number) => {
    if (selectedCards.includes(index) || showFeedback) return;

    const isCorrect = currentData.correctAnswers.includes(index);
    const isTrap = index === currentData.trapIndex;

    setLastSelection({ index, correct: isCorrect });
    setShowFeedback(true);

    if (isCorrect) {
      setSelectedCards(prev => [...prev, index]);
      setScore(prev => prev + 10);
      
      // 全部正解した場合
      if (selectedCards.length + 1 === currentData.correctAnswers.length) {
        setTimeout(() => {
          if (currentStage + 1 >= mockStages.length) {
            setGameStatus('won');
          } else {
            setCurrentStage(prev => prev + 1);
            setSelectedCards([]);
            setShowFeedback(false);
            setLastSelection(null);
          }
        }, 1500);
      } else {
        setTimeout(() => {
          setShowFeedback(false);
          setLastSelection(null);
        }, 1000);
      }
    } else if (isTrap) {
      setLives(prev => prev - 1);
      setTimeout(() => {
        if (lives - 1 <= 0) {
          setGameStatus('lost');
        } else {
          setShowFeedback(false);
          setLastSelection(null);
        }
      }, 1500);
    }
  };

  const resetGame = () => {
    setCurrentStage(0);
    setScore(0);
    setLives(3);
    setSelectedCards([]);
    setGameStatus('playing');
    setShowFeedback(false);
    setLastSelection(null);
  };

  if (gameStatus !== 'playing') {
    return (
      <ResultScreen
        gameType="survival"
        success={gameStatus === 'won'}
        score={score}
        onRestart={resetGame}
        onBack={onBack}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/10 to-teal-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/10 to-cyan-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 glass-effect rounded-xl px-4 py-2 hover:scale-105 transition-all duration-300">
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Button>
          <div className="flex items-center gap-4">
            {/* Lives */}
            <div className="flex items-center gap-1 glass-effect px-3 py-2 rounded-xl">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-5 h-5 transition-all duration-300 ${
                    i < lives ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-300 scale-90'
                  }`}
                />
              ))}
            </div>
            {/* Score */}
            <Badge variant="secondary" className="text-sm glass-effect px-4 py-2 rounded-xl font-semibold">
              <Star className="w-4 h-4 mr-1" />
              {score}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <Card className="modern-card">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-semibold">
                <span>ステージ {currentStage + 1} / {mockStages.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              {/* <Progress value={progress} className="h-3 rounded-full" /> */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Content */}
        <Card className="modern-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-4 flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 text-emerald-600" />
              類似語サバイバル
            </CardTitle>
            <div className="mb-4">
              <span className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-xl modern-shadow">
                {currentData.baseWord}
              </span>
            </div>
            <p className="text-gray-600 font-medium">
              関連する言葉を選んでください（トラップ語が1つ混じっています）
            </p>
          </CardHeader>
          <CardContent>
            {/* Options Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <AnimatePresence>
                {currentData.options.map((option, index) => {
                  const isSelected = selectedCards.includes(index);
                  const isCurrentSelection = lastSelection?.index === index;
                  const showResult = isCurrentSelection && showFeedback;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all duration-300 modern-card relative overflow-hidden ${
                          isSelected 
                            ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300 shadow-lg' 
                            : showResult && lastSelection?.correct
                            ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300'
                            : showResult && !lastSelection?.correct
                            ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300'
                            : 'hover:shadow-lg hover:border-emerald-200'
                        }`}
                        onClick={() => handleCardClick(index)}
                      >
                        <CardContent className="flex items-center justify-center h-24 relative">
                          <span className="font-semibold text-lg text-gray-800">
                            {option}
                          </span>
                          
                          {/* Success/Failure Icons */}
                          <AnimatePresence>
                            {showResult && isCurrentSelection && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                className="absolute top-2 right-2"
                              >
                                {lastSelection?.correct ? (
                                  <div className="w-7 h-7 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center modern-shadow">
                                    <span className="text-white text-sm font-bold">✓</span>
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center modern-shadow">
                                    <X className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Selected Check Mark */}
                          {isSelected && !showResult && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              className="absolute top-2 right-2 w-7 h-7 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center modern-shadow"
                            >
                              <span className="text-white text-sm font-bold">✓</span>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Progress in current stage */}
            {selectedCards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-center"
              >
                <Badge variant="outline" className="text-sm glass-effect px-4 py-2 rounded-xl font-semibold">
                  {selectedCards.length} / {currentData.correctAnswers.length} 正解
                </Badge>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
