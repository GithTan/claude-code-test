import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProjectList from './ProjectList'

vi.mock('../../lib/api', () => ({
  getProjects: vi.fn(),
}))

import { getProjects } from '../../lib/api'

describe('ProjectList', () => {
  it('shows projects after loading', async () => {
    getProjects.mockResolvedValue({
      data: [{ id: 'p1', project_name: 'BGC Tower Install', status: 'active', customers: { name: 'Acme Corp' } }],
      error: null,
    })
    render(<MemoryRouter><ProjectList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('BGC Tower Install')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  it('shows New Project button', async () => {
    getProjects.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><ProjectList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /new project/i })).toBeInTheDocument()
    })
  })
})
