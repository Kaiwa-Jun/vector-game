'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, RotateCcw, ArrowRight, Sparkles } from 'lucide-react'
import SimilarityMeter from '@/components/SimilarityMeter'
import ResultScreen from '@/components/ResultScreen'

interface WordHistory {
  word: string
  similarity: number
}

interface VectorMazeGameProps {
  onBack: () => void
}

// モックデータ
const mockMazeData = {
  startWord: '猫',
  goalWord: '宇宙',
  maxAttempts: 5,
}

// 語句の類似度を計算する関数（モック）
const calculateSimilarity = (inputWord: string, attempts: number): number => {
  const similarities: { [key: string]: number } = {
    犬: 0.15,
    動物: 0.25,
    ペット: 0.18,
    生き物: 0.35,
    地球: 0.45,
    惑星: 0.65,
    星: 0.75,
    天体: 0.8,
    宇宙: 1.0,
    空: 0.55,
    夜: 0.48,
    月: 0.62,
    太陽: 0.58,
    光: 0.52,
  }

  return similarities[inputWord] || Math.random() * 0.4 + 0.1
}

export default function VectorMazeGame({ onBack }: VectorMazeGameProps) {
  const [inputWord, setInputWord] = useState('')
  const [wordHistory, setWordHistory] = useState<WordHistory[]>([])
  const [currentSimilarity, setCurrentSimilarity] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>(
    'playing'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wordChain, setWordChain] = useState<string[]>(['', '', '']) // 3つの中間ステップ

  const handleSubmit = async () => {
    if (
      !inputWord.trim() ||
      isSubmitting ||
      attempts >= mockMazeData.maxAttempts
    )
      return

    setIsSubmitting(true)

    // 類似度計算（模擬的な遅延）
    await new Promise(resolve => setTimeout(resolve, 800))

    const similarity = calculateSimilarity(inputWord, attempts)
    setCurrentSimilarity(similarity)

    const newEntry: WordHistory = {
      word: inputWord,
      similarity,
    }

    setWordHistory(prev => [...prev, newEntry])

    // 単語チェーンに追加
    const newChain = [...wordChain]
    newChain[attempts] = inputWord
    setWordChain(newChain)

    setAttempts(prev => prev + 1)

    // ゲーム終了判定
    if (similarity >= 0.95) {
      setGameStatus('won')
    } else if (attempts + 1 >= mockMazeData.maxAttempts) {
      setGameStatus('lost')
    }

    setInputWord('')
    setIsSubmitting(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  const resetGame = () => {
    setInputWord('')
    setWordHistory([])
    setCurrentSimilarity(0)
    setAttempts(0)
    setGameStatus('playing')
    setIsSubmitting(false)
    setWordChain(['', '', ''])
  }

  if (gameStatus !== 'playing') {
    return (
      <ResultScreen
        gameType="vector-maze"
        success={gameStatus === 'won'}
        score={Math.round(currentSimilarity * 100)}
        wordHistory={wordHistory}
        onRestart={resetGame}
        onBack={onBack}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-pink-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 glass-effect rounded-xl px-4 py-2 hover:scale-105 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Button>
          <div className="flex items-center gap-4">
            <Badge
              variant="secondary"
              className="text-sm glass-effect px-4 py-2 rounded-xl font-semibold"
            >
              {attempts} / {mockMazeData.maxAttempts}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={resetGame}
              className="gap-2 glass-effect rounded-xl hover:scale-105 transition-all duration-300"
            >
              <RotateCcw className="w-4 h-4" />
              リセット
            </Button>
          </div>
        </div>

        {/* Word Chain Progress */}
        <Card className="modern-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl mb-4 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              言葉の連鎖
            </CardTitle>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {/* Start Word */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="word-chip"
              >
                {mockMazeData.startWord}
              </motion.div>

              {/* Chain Steps */}
              {wordChain.map((word, index) => (
                <div key={index} className="flex items-center gap-3">
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                    }}
                    transition={{ delay: index * 0.1 }}
                    className={`px-4 py-2 rounded-xl font-semibold text-lg min-w-[100px] text-center transition-all duration-300 ${
                      word ? 'word-chip' : 'word-chip-empty'
                    }`}
                  >
                    {word || '？'}
                  </motion.div>
                </div>
              ))}

              {/* Arrow to Goal */}
              <ArrowRight className="w-5 h-5 text-gray-400" />

              {/* Goal Word */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg modern-shadow"
              >
                {mockMazeData.goalWord}
              </motion.div>
            </div>
            <p className="text-sm text-gray-600 mt-6 font-medium">
              スタート語からゴール語まで、関連する言葉で繋げてください
            </p>
          </CardHeader>
        </Card>

        {/* Current Step Indicator */}
        {attempts < 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge
              variant="outline"
              className="text-sm glass-effect px-4 py-2 rounded-xl font-semibold"
            >
              ステップ {attempts + 1} / 3
            </Badge>
          </motion.div>
        )}

        {/* Similarity Meter */}
        <Card className="modern-card">
          <CardContent className="pt-6">
            <SimilarityMeter
              similarity={currentSimilarity}
              isAnimating={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* Input Section */}
        <Card className="modern-card">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3 font-medium">
                  {attempts < 3
                    ? `${attempts + 1}番目の言葉を入力してください`
                    : '最後の言葉を入力してください'}
                </p>
              </div>
              <div className="flex gap-3">
                <Input
                  value={inputWord}
                  onChange={e => setInputWord(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="関連する言葉を入力してください..."
                  disabled={isSubmitting}
                  className="text-lg modern-input rounded-xl py-3 font-medium"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!inputWord.trim() || isSubmitting}
                  className="px-6 game-gradient-modern rounded-xl modern-shadow hover:scale-105 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Word History */}
        <AnimatePresence>
          {wordHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="text-lg">入力履歴</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {wordHistory.map((entry, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 glass-effect rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="text-xs font-semibold"
                        >
                          {index + 1}
                        </Badge>
                        <span className="font-semibold text-gray-800">
                          {entry.word}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${entry.similarity * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              entry.similarity > 0.8
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                : entry.similarity > 0.5
                                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                  : 'bg-gradient-to-r from-red-400 to-pink-500'
                            }`}
                          />
                        </div>
                        <span className="text-sm font-bold w-12 text-right text-gray-700">
                          {Math.round(entry.similarity * 100)}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
