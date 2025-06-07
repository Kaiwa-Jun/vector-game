import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// サンプルコンポーネント
function SampleComponent() {
  return <div>Hello, Test!</div>
}

describe('Sample Test', () => {
  it('renders hello message', () => {
    render(<SampleComponent />)
    const element = screen.getByText('Hello, Test!')
    expect(element).toBeInTheDocument()
  })

  it('should pass basic math test', () => {
    expect(2 + 2).toBe(4)
  })
})
