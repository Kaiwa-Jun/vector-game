import { cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn function', () => {
    it('クラス名を正しく結合する', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('条件付きクラス名を正しく処理する', () => {
      const result = cn('base', true && 'conditional', false && 'hidden')
      expect(result).toBe('base conditional')
    })

    it('undefinedやnullを正しく処理する', () => {
      const result = cn('base', undefined, null, 'valid')
      expect(result).toBe('base valid')
    })

    it('空文字列を正しく処理する', () => {
      const result = cn('base', '', 'valid')
      expect(result).toBe('base valid')
    })
  })
})
