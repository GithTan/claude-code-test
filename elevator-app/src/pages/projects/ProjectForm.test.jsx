import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProjectForm from './ProjectForm'

vi.mock('../../lib/api', () => ({
  createProject: vi.fn(),
  getProject: vi.fn(),
  updateProject: vi.fn(),
  createMilestone: vi.fn(),
  deleteMilestone: vi.fn(),
  getCustomers: vi.fn(),
}))

import { createProject, getCustomers } from '../../lib/api'

describe('ProjectForm (new)', () => {
  it('renders project name and customer fields', async () => {
    getCustomers.mockResolvedValue({ data: [{ id: 'c1', name: 'Acme Corp' }], error: null })
    render(
      <MemoryRouter initialEntries={['/projects/new']}>
        <Routes>
          <Route path="/projects/new" element={<ProjectForm />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/customer/i)).toBeInTheDocument()
    })
  })

  it('calls createProject on submit', async () => {
    getCustomers.mockResolvedValue({ data: [{ id: 'c1', name: 'Acme Corp' }], error: null })
    createProject.mockResolvedValue({ data: { id: 'p1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/projects/new']}>
        <Routes>
          <Route path="/projects/new" element={<ProjectForm />} />
          <Route path="/projects/:id" element={<div>detail</div>} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => screen.getByLabelText(/project name/i))
    await user.type(screen.getByLabelText(/project name/i), 'BGC Tower Install')
    await user.selectOptions(screen.getByLabelText(/customer/i), 'c1')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith(expect.objectContaining({ project_name: 'BGC Tower Install' }))
    })
  })
})
