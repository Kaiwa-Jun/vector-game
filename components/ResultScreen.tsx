'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, RotateCcw, Home, Share, Star, Target, Sparkles } from 'lucide-react';

interface WordHistory {
  word: string;
  similarity: number;
}

interface ResultScreenProps {
  gameType: 'vector-maze' | 'survival';
  success: boolean;
  score: number;
  wordHistory?: WordHistory[];
  onRestart: () => void;
  onBack: () => void;
}

export default function ResultScreen({ 
  gameType, 
  success, 
  score, 
  wordHistory = [], 
  onRestart, 
  onBack 
}: ResultScreenProps) {
  const shareText = `ベクトル連想ゲームで${score}点を獲得しました！`;
  const shareUrl = window.location.origin;

  const handleShare = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-pink-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Result Icon and Title */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-6 modern-shadow-lg ${
            success ? 'bg-gradient-to-br from-emerald-400 to-green-500' : 'bg-gradient-to-br from-red-400 to-pink-500'
          }`}>
            {success ? (
              <Trophy className="w-12 h-12 text-white" />
            ) : (
              <Target className="w-12 h-12 text-white" />
            )}
          </div>
          <h1 className={`text-4xl font-bold mb-3 ${
            success ? 'bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent'
          }`}>
            {success ? 'ゲームクリア！' : 'ゲーム終了'}
          </h1>
          <p className="text-gray-600 font-medium">
            {success ? '素晴らしい結果です！' : '次回頑張りましょう！'}
          </p>
        </motion.div>

        {/* Score */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
        >
          <Card className="modern-card">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <span className="text-lg font-semibold">最終スコア</span>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                {score}
                {gameType === 'vector-maze' && '%'}
                {gameType === 'survival' && '点'}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Word History (Vector Maze only) */}
        {gameType === 'vector-maze' && wordHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-lg">振り返り</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {wordHistory.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex items-center justify-between p-3 glass-effect rounded-xl"
                  >
                    <span className="font-semibold text-gray-800">{entry.word}</span>
                    <Badge variant={entry.similarity > 0.7 ? "default" : "secondary"} className="font-semibold">
                      {Math.round(entry.similarity * 100)}%
                    </Badge>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="space-y-3"
        >
          <Button 
            onClick={handleShare}
            className="w-full success-gradient text-white font-semibold py-3 rounded-xl modern-shadow hover:scale-[1.02] transition-all duration-300"
          >
            <Share className="w-4 h-4 mr-2" />
            結果をシェア
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={onRestart} className="glass-effect rounded-xl hover:scale-105 transition-all duration-300 font-semibold">
              <RotateCcw className="w-4 h-4 mr-2" />
              もう一度
            </Button>
            <Button variant="outline" onClick={onBack} className="glass-effect rounded-xl hover:scale-105 transition-all duration-300 font-semibold">
              <Home className="w-4 h-4 mr-2" />
              メニュー
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}