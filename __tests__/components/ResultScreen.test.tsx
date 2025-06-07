import { render, screen } from '@testing-library/react'
import ResultScreen from '@/components/ResultScreen'

// framer-motionをモック
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

describe('ResultScreen', () => {
  const mockProps = {
    gameType: 'vector-maze' as const,
    success: true,
    score: 100,
    onRestart: jest.fn(),
    onBack: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('成功時の画面が正しく表示される', () => {
    render(<ResultScreen {...mockProps} />)

    expect(screen.getByText('ゲームクリア！')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('失敗時の画面が正しく表示される', () => {
    render(<ResultScreen {...mockProps} success={false} />)

    expect(screen.getByText('ゲーム終了')).toBeInTheDocument()
  })

  it('サバイバルゲームタイプで正しく表示される', () => {
    render(<ResultScreen {...mockProps} gameType="survival" />)

    expect(screen.getByText('ゲームクリア！')).toBeInTheDocument()
  })
})
