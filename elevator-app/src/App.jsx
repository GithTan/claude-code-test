import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import SensitivePageShield from './components/SensitivePageShield'
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
import AmcBillingTracker from './pages/contracts/AmcBillingTracker'
import BreakdownList from './pages/breakdowns/BreakdownList'
import BreakdownForm from './pages/breakdowns/BreakdownForm'
import PipelineList from './pages/pipeline/PipelineList'
import PipelineDetail from './pages/pipeline/PipelineDetail'
import PipelineForm from './pages/pipeline/PipelineForm'
import FinanceDashboard from './pages/finance/FinanceDashboard'
import StartHere from './pages/StartHere'
import OperationsList from './pages/operations/OperationsList'
import OperationsForm from './pages/operations/OperationsForm'
import OpsProjectDetail from './pages/operations/OpsProjectDetail'
import FinishedProjects from './pages/operations/FinishedProjects'
import HandoverSummary from './pages/operations/HandoverSummary'
import ProjectTimeline from './pages/operations/ProjectTimeline'
import AdminAudit from './pages/admin/AdminAudit'

function ProtectedLayout() {
  return (
    <PrivateRoute>
      <Layout>
        <Outlet />
      </Layout>
    </PrivateRoute>
  )
}

function SensitiveAdminPage({ label, pageKey, children }) {
  return (
    <PrivateRoute adminOnly>
      <SensitivePageShield label={label} pageKey={pageKey}>
        {children}
      </SensitivePageShield>
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
        <Route path="/start" element={<StartHere />} />
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
        <Route path="/contracts/billing" element={<SensitiveAdminPage label="AMC billing confidential" pageKey="amc_billing"><AmcBillingTracker /></SensitiveAdminPage>} />
        <Route path="/contracts/new" element={<AmcForm />} />
        <Route path="/contracts/:id" element={<AmcDetail />} />
        <Route path="/contracts/:id/edit" element={<AmcForm />} />
        <Route path="/operations" element={<OperationsList />} />
        <Route path="/operations/finished" element={<FinishedProjects />} />
        <Route path="/operations/timeline" element={<ProjectTimeline />} />
        <Route path="/operations/new" element={<OperationsForm />} />
        <Route path="/operations/:id" element={<OpsProjectDetail />} />
        <Route path="/operations/:id/edit" element={<OperationsForm />} />
        <Route path="/operations/:id/handover" element={<HandoverSummary />} />
        <Route path="/breakdowns" element={<BreakdownList />} />
        <Route path="/breakdowns/new" element={<BreakdownForm />} />
        <Route path="/breakdowns/:id/edit" element={<BreakdownForm />} />
        <Route path="/pipeline" element={<PipelineList />} />
        <Route path="/pipeline/new" element={<PrivateRoute adminOnly><PipelineForm /></PrivateRoute>} />
        <Route path="/pipeline/:id" element={<PipelineDetail />} />
        <Route path="/invoices" element={<SensitiveAdminPage label="Invoices confidential" pageKey="invoices_list"><InvoiceList /></SensitiveAdminPage>} />
        <Route path="/invoices/new" element={<SensitiveAdminPage label="Invoices confidential" pageKey="invoice_new"><InvoiceForm /></SensitiveAdminPage>} />
        <Route path="/invoices/:id" element={<SensitiveAdminPage label="Invoices confidential" pageKey="invoice_detail"><InvoiceDetail /></SensitiveAdminPage>} />
        <Route path="/invoices/:id/edit" element={<SensitiveAdminPage label="Invoices confidential" pageKey="invoice_edit"><InvoiceForm /></SensitiveAdminPage>} />
        <Route path="/projects" element={<SensitiveAdminPage label="Project finance confidential" pageKey="project_finance_list"><ProjectList /></SensitiveAdminPage>} />
        <Route path="/projects/new" element={<SensitiveAdminPage label="Project finance confidential" pageKey="project_finance_new"><ProjectForm /></SensitiveAdminPage>} />
        <Route path="/projects/:id" element={<SensitiveAdminPage label="Project finance confidential" pageKey="project_finance_detail"><ProjectDetail /></SensitiveAdminPage>} />
        <Route path="/projects/:id/edit" element={<SensitiveAdminPage label="Project finance confidential" pageKey="project_finance_edit"><ProjectForm /></SensitiveAdminPage>} />
        <Route path="/reports" element={<SensitiveAdminPage label="Reports confidential" pageKey="reports_confidential"><Reports /></SensitiveAdminPage>} />
        <Route path="/finance" element={<SensitiveAdminPage label="Finance confidential" pageKey="finance_dashboard"><FinanceDashboard /></SensitiveAdminPage>} />
        <Route path="/admin/audit" element={<SensitiveAdminPage label="Admin audit confidential" pageKey="admin_audit"><AdminAudit /></SensitiveAdminPage>} />
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
