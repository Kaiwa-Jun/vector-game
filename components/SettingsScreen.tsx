'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  ArrowLeft,
  Volume2,
  Clock,
  AlertTriangle,
  Settings,
} from 'lucide-react'

interface SettingsScreenProps {
  onBack: () => void
}

interface Settings {
  timeLimit: number
  soundEnabled: boolean
  difficulty: 'easy' | 'normal' | 'hard'
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [settings, setSettings] = useState<Settings>({
    timeLimit: 30,
    soundEnabled: true,
    difficulty: 'normal',
  })

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    const savedSettings = localStorage.getItem('vectorGameSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // 設定が変更されたときにローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('vectorGameSettings', JSON.stringify(settings))
  }, [settings])

  const handleTimeLimitChange = (value: number[]) => {
    setSettings(prev => ({ ...prev, timeLimit: value[0] || 60 }))
  }

  const handleSoundToggle = (checked: boolean) => {
    setSettings(prev => ({ ...prev, soundEnabled: checked }))
  }

  const handleDifficultyChange = (difficulty: 'easy' | 'normal' | 'hard') => {
    setSettings(prev => ({ ...prev, difficulty }))
  }

  const handleResetData = () => {
    if (
      confirm('すべてのデータをリセットしますか？この操作は取り消せません。')
    ) {
      localStorage.clear()
      alert('データがリセットされました。')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-gray-400/10 to-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 glass-effect rounded-xl px-4 py-2 hover:scale-105 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-gray-600 rounded-2xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-600 to-gray-700 bg-clip-text text-transparent">
              設定
            </h1>
          </div>
        </div>

        {/* Time Limit Setting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                制限時間
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 font-medium">
                    制限時間
                  </span>
                  <span className="font-bold text-lg">
                    {settings.timeLimit}秒
                  </span>
                </div>
                <Slider
                  value={[settings.timeLimit]}
                  onValueChange={handleTimeLimitChange}
                  max={120}
                  min={10}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>10秒</span>
                  <span>120秒</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sound Setting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-white" />
                </div>
                音声設定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">効果音</p>
                  <p className="text-sm text-gray-600 font-medium">
                    ゲーム中の効果音のオン/オフ
                  </p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={handleSoundToggle}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Difficulty Setting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">難</span>
                </div>
                難易度設定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {(['easy', 'normal', 'hard'] as const).map(difficulty => (
                  <Button
                    key={difficulty}
                    variant={
                      settings.difficulty === difficulty ? 'default' : 'outline'
                    }
                    onClick={() => handleDifficultyChange(difficulty)}
                    className={`h-20 flex flex-col rounded-xl font-semibold transition-all duration-300 ${
                      settings.difficulty === difficulty
                        ? 'game-gradient-modern text-white modern-shadow scale-105'
                        : 'glass-effect hover:scale-105'
                    }`}
                  >
                    <span className="font-bold text-lg">
                      {difficulty === 'easy' && 'やさしい'}
                      {difficulty === 'normal' && '普通'}
                      {difficulty === 'hard' && '難しい'}
                    </span>
                    <span className="text-xs opacity-80 font-medium">
                      {difficulty === 'easy' && '初心者向け'}
                      {difficulty === 'normal' && 'バランス型'}
                      {difficulty === 'hard' && '上級者向け'}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Reset */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="modern-card border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                データリセット
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  すべてのゲームデータ、スコア、設定がリセットされます。
                  この操作は取り消すことができません。
                </p>
                <Button
                  variant="destructive"
                  onClick={handleResetData}
                  className="w-full error-gradient font-semibold py-3 rounded-xl modern-shadow hover:scale-[1.02] transition-all duration-300"
                >
                  すべてのデータをリセット
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
