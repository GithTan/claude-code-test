import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProjectDetail from './ProjectDetail'

vi.mock('../../lib/api', () => ({
  getProject: vi.fn(),
  updateMilestone: vi.fn(),
}))

import { getProject } from '../../lib/api'

describe('ProjectDetail', () => {
  it('shows project name and milestones', async () => {
    getProject.mockResolvedValue({
      data: {
        id: 'p1',
        project_name: 'BGC Tower Install',
        status: 'active',
        customers: { name: 'Acme Corp' },
        payment_milestones: [
          { id: 'm1', category: 'equipment', description: '30% upon order', amount: 300000, status: 'unbilled' },
        ],
      },
      error: null,
    })
    render(
      <MemoryRouter initialEntries={['/projects/p1']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectDetail />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('BGC Tower Install')).toBeInTheDocument()
      expect(screen.getByText('30% upon order')).toBeInTheDocument()
    })
  })
})
