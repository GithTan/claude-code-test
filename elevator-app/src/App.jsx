import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CustomerList from './pages/customers/CustomerList'
import CustomerForm from './pages/customers/CustomerForm'
import CustomerDetail from './pages/customers/CustomerDetail'
import BuildingForm from './pages/buildings/BuildingForm'
import ElevatorList from './pages/elevators/ElevatorList'
import AllElevatorList from './pages/elevators/AllElevatorList'
import ElevatorForm from './pages/elevators/ElevatorForm'
import ElevatorDetail from './pages/elevators/ElevatorDetail'
import MaintenanceList from './pages/maintenance/MaintenanceList'
import MaintenanceForm from './pages/maintenance/MaintenanceForm'
import JobList from './pages/jobs/JobList'
import JobForm from './pages/jobs/JobForm'
import InvoiceList from './pages/invoices/InvoiceList'
import InvoiceForm from './pages/invoices/InvoiceForm'
import InvoiceDetail from './pages/invoices/InvoiceDetail'
import ProjectList from './pages/projects/ProjectList'
import ProjectForm from './pages/projects/ProjectForm'
import ProjectDetail from './pages/projects/ProjectDetail'
import Reports from './pages/reports/Reports'
import AmcList from './pages/contracts/AmcList'
import AmcForm from './pages/contracts/AmcForm'
import AmcDetail from './pages/contracts/AmcDetail'
import BreakdownList from './pages/breakdowns/BreakdownList'
import BreakdownForm from './pages/breakdowns/BreakdownForm'
import PipelineList from './pages/pipeline/PipelineList'
import PipelineDetail from './pages/pipeline/PipelineDetail'
import PipelineForm from './pages/pipeline/PipelineForm'

function ProtectedLayout() {
  return (
    <PrivateRoute>
      <Layout>
        <Outlet />
      </Layout>
    </PrivateRoute>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />
        <Route path="/customers/:customerId/buildings/new" element={<BuildingForm />} />
        <Route path="/elevators" element={<AllElevatorList />} />
        <Route path="/buildings/:buildingId/elevators" element={<ElevatorList />} />
        <Route path="/buildings/:buildingId/elevators/new" element={<ElevatorForm />} />
        <Route path="/elevators/:id" element={<ElevatorDetail />} />
        <Route path="/elevators/:id/edit" element={<ElevatorForm />} />
        <Route path="/elevators/:elevatorId/maintenance/new" element={<MaintenanceForm />} />
        <Route path="/maintenance" element={<MaintenanceList />} />
        <Route path="/maintenance/:scheduleId/edit" element={<MaintenanceForm />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="/jobs/new" element={<JobForm />} />
        <Route path="/jobs/:jobId/edit" element={<JobForm />} />
        <Route path="/contracts" element={<AmcList />} />
        <Route path="/contracts/new" element={<AmcForm />} />
        <Route path="/contracts/:id" element={<AmcDetail />} />
        <Route path="/contracts/:id/edit" element={<AmcForm />} />
        <Route path="/breakdowns" element={<BreakdownList />} />
        <Route path="/breakdowns/new" element={<BreakdownForm />} />
        <Route path="/breakdowns/:id/edit" element={<BreakdownForm />} />
        <Route path="/pipeline" element={<PipelineList />} />
        <Route path="/pipeline/new" element={<PrivateRoute adminOnly><PipelineForm /></PrivateRoute>} />
        <Route path="/pipeline/:id" element={<PipelineDetail />} />
        <Route path="/invoices" element={<PrivateRoute adminOnly><InvoiceList /></PrivateRoute>} />
        <Route path="/invoices/new" element={<PrivateRoute adminOnly><InvoiceForm /></PrivateRoute>} />
        <Route path="/invoices/:id" element={<PrivateRoute adminOnly><InvoiceDetail /></PrivateRoute>} />
        <Route path="/invoices/:id/edit" element={<PrivateRoute adminOnly><InvoiceForm /></PrivateRoute>} />
        <Route path="/projects" element={<PrivateRoute adminOnly><ProjectList /></PrivateRoute>} />
        <Route path="/projects/new" element={<PrivateRoute adminOnly><ProjectForm /></PrivateRoute>} />
        <Route path="/projects/:id" element={<PrivateRoute adminOnly><ProjectDetail /></PrivateRoute>} />
        <Route path="/projects/:id/edit" element={<PrivateRoute adminOnly><ProjectForm /></PrivateRoute>} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
