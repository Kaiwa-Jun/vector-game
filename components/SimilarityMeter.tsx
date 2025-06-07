'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SimilarityMeterProps {
  similarity: number;
  isAnimating?: boolean;
}

export default function SimilarityMeter({ similarity, isAnimating = false }: SimilarityMeterProps) {
  const [displaySimilarity, setDisplaySimilarity] = useState(0);

  useEffect(() => {
    if (!isAnimating) {
      setDisplaySimilarity(similarity);
    }
  }, [similarity, isAnimating]);

  // 類似度に基づく色の計算
  const getColor = (value: number) => {
    if (value > 0.8) return '#10b981'; // 緑
    if (value > 0.5) return '#f59e0b'; // 黄
    if (value > 0.3) return '#f97316'; // オレンジ
    return '#ef4444'; // 赤
  };

  const getGradientColor = (value: number) => {
    if (value > 0.8) return 'from-emerald-400 to-green-500';
    if (value > 0.5) return 'from-yellow-400 to-orange-500';
    if (value > 0.3) return 'from-orange-400 to-red-500';
    return 'from-red-400 to-pink-500';
  };

  // 角度の計算（0度から180度）
  const angle = displaySimilarity * 180;
  const needleColor = getColor(displaySimilarity);
  const gradientClass = getGradientColor(displaySimilarity);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* 分度器メーター */}
      <div className="relative w-72 h-36">
        <svg
          width="288"
          height="144"
          viewBox="0 0 288 144"
          className="overflow-visible drop-shadow-lg"
        >
          {/* 外側の装飾リング */}
          <path
            d="M 24 124 A 120 120 0 0 1 264 124"
            fill="none"
            stroke="url(#outerGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          
          {/* 背景の半円 */}
          <path
            d="M 32 116 A 112 112 0 0 1 256 116"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* 進捗の半円 */}
          <motion.path
            d="M 32 116 A 112 112 0 0 1 256 116"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="351.858" // 半円の全周
            initial={{ strokeDashoffset: 351.858 }}
            animate={{ 
              strokeDashoffset: isAnimating ? 351.858 : 351.858 - (displaySimilarity * 351.858)
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* 目盛り */}
          {[0, 0.25, 0.5, 0.75, 1].map((value, index) => {
            const tickAngle = value * 180;
            const x1 = 144 + 100 * Math.cos((tickAngle - 90) * Math.PI / 180);
            const y1 = 116 + 100 * Math.sin((tickAngle - 90) * Math.PI / 180);
            const x2 = 144 + 112 * Math.cos((tickAngle - 90) * Math.PI / 180);
            const y2 = 116 + 112 * Math.sin((tickAngle - 90) * Math.PI / 180);
            
            return (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#64748b"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}

          {/* 針 */}
          <motion.g
            initial={{ rotate: 0 }}
            animate={{ 
              rotate: isAnimating ? 0 : angle
            }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: "144px 116px" }}
          >
            <line
              x1="144"
              y1="116"
              x2="144"
              y2="36"
              stroke="url(#needleGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#dropShadow)"
            />
            <circle
              cx="144"
              cy="116"
              r="8"
              fill="url(#centerGradient)"
              filter="url(#dropShadow)"
            />
          </motion.g>

          {/* ラベル */}
          <text x="32" y="135" textAnchor="middle" className="text-sm fill-gray-600 font-semibold">
            0%
          </text>
          <text x="144" y="30" textAnchor="middle" className="text-sm fill-gray-600 font-semibold">
            50%
          </text>
          <text x="256" y="135" textAnchor="middle" className="text-sm fill-gray-600 font-semibold">
            100%
          </text>

          {/* グラデーション定義 */}
          <defs>
            <linearGradient id="outerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={getColor(displaySimilarity)} />
              <stop offset="100%" stopColor={getColor(displaySimilarity)} />
            </linearGradient>
            <linearGradient id="needleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1f2937" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>
            <radialGradient id="centerGradient">
              <stop offset="0%" stopColor="#f9fafb" />
              <stop offset="100%" stopColor="#e5e7eb" />
            </radialGradient>
            <filter id="dropShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>
        </svg>
      </div>

      {/* スコア表示 */}
      <div className="text-center">
        <motion.div
          className={`text-4xl font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}
          animate={{ scale: isAnimating ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          {Math.round(displaySimilarity * 100)}%
        </motion.div>
        <p className="text-sm text-gray-600 font-semibold mt-1">類似度</p>
      </div>

      {/* 類似度の評価 */}
      <div className="text-center">
        {displaySimilarity > 0.9 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-6 py-3 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 rounded-2xl text-sm font-semibold modern-shadow"
          >
            🎯 完璧！
          </motion.div>
        )}
        {displaySimilarity > 0.7 && displaySimilarity <= 0.9 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-6 py-3 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-2xl text-sm font-semibold modern-shadow"
          >
            ⭐ いい感じ！
          </motion.div>
        )}
        {displaySimilarity > 0.4 && displaySimilarity <= 0.7 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-6 py-3 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 rounded-2xl text-sm font-semibold modern-shadow"
          >
            💭 もう少し！
          </motion.div>
        )}
        {displaySimilarity <= 0.4 && displaySimilarity > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-6 py-3 bg-gradient-to-r from-red-100 to-pink-100 text-red-800 rounded-2xl text-sm font-semibold modern-shadow"
          >
            🤔 再挑戦！
          </motion.div>
        )}
      </div>
    </div>
  );
}