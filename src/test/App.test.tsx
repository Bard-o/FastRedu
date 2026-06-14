import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { App } from '../App'

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />)
    // The app renders a root div with the logo text
    expect(container.textContent).toContain('FastRedu')
  })

  it('shows editor view by default', () => {
    const { getByText } = render(<App />)
    expect(getByText('Editor')).toBeInTheDocument()
  })
})