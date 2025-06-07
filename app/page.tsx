'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, HelpCircle, Zap, Target, Sparkles } from 'lucide-react';
import { useState } from 'react';
import VectorMazeGame from '@/components/VectorMazeGame';
import SurvivalGame from '@/components/SurvivalGame';
import SettingsScreen from '@/components/SettingsScreen';

type GameMode = 'title' | 'vector-maze' | 'survival' | 'settings';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<GameMode>('title');

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'vector-maze':
        return <VectorMazeGame onBack={() => setCurrentScreen('title')} />;
      case 'survival':
        return <SurvivalGame onBack={() => setCurrentScreen('title')} />;
      case 'settings':
        return <SettingsScreen onBack={() => setCurrentScreen('title')} />;
      default:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden"
          >
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md space-y-8 relative z-10">
              {/* App Title */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center space-y-6"
              >
                <div className="relative">
                  <motion.div 
                    className="w-24 h-24 mx-auto game-gradient-modern rounded-3xl flex items-center justify-center modern-shadow-lg floating-animation"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Sparkles className="w-12 h-12 text-white" />
                  </motion.div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent text-shadow-lg mb-2">
                    ベクトル連想ゲーム
                  </h1>
                  <p className="text-gray-600 text-base font-medium">
                    言葉の関連性を探る新感覚パズルゲーム
                  </p>
                </div>
              </motion.div>

              {/* Game Mode Cards */}
              <div className="space-y-4">
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Card className="modern-card cursor-pointer group" 
                        onClick={() => setCurrentScreen('vector-maze')}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-semibold text-gray-800">ベクトル迷路</CardTitle>
                          <CardDescription className="text-sm text-gray-600 font-medium">
                            目標語に向かって言葉を繋げよう
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        分度器メーターで類似度を確認しながら、スタート語からゴール語まで辿り着こう！
                      </p>
                      <Button className="w-full game-gradient-modern text-white font-semibold py-3 rounded-xl modern-shadow hover:scale-[1.02] transition-all duration-300">
                        ゲームを始める
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Card className="modern-card cursor-pointer group" 
                        onClick={() => setCurrentScreen('survival')}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-semibold text-gray-800">類似語サバイバル</CardTitle>
                          <CardDescription className="text-sm text-gray-600 font-medium">
                            関連語を素早く見つけよう
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        6つの選択肢から類似語を選択！トラップ語に注意してスコアを稼ごう。
                      </p>
                      <Button className="w-full success-gradient text-white font-semibold py-3 rounded-xl modern-shadow hover:scale-[1.02] transition-all duration-300">
                        ゲームを始める
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Settings and Help */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="flex justify-center space-x-4"
              >
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setCurrentScreen('settings')}
                  className="w-14 h-14 rounded-2xl hover:bg-white/50 glass-effect hover:scale-110 transition-all duration-300"
                >
                  <Settings className="w-6 h-6" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="w-14 h-14 rounded-2xl hover:bg-white/50 glass-effect hover:scale-110 transition-all duration-300"
                >
                  <HelpCircle className="w-6 h-6" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      {renderScreen()}
    </div>
  );
}
