# Elevator Admin Dashboard — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the React project, create the Supabase database schema, wire up authentication with role-based routing, and build the navigation shell — so the app opens in a browser with a working login and sidebar.

**Architecture:** Vite + React 18 SPA. Supabase handles the database (PostgreSQL) and authentication. React Router v6 handles client-side routing. Role (admin vs operations_manager) is stored in a `profiles` table and loaded after login. Protected routes check role before rendering.

**Tech Stack:** Node.js 18+, Vite, React 18, React Router v6, Supabase JS v2, Tailwind CSS v3, Vitest, React Testing Library

---

## Pre-Task: One-Time Manual Setup (do this before running any code)

### A. Install Node.js
- Go to https://nodejs.org and download the **LTS** version
- Run the installer — click Next through all steps
- Open PowerShell and run: `node --version`
- Expected output: `v18.x.x` or higher

### B. Create a Supabase project
1. Go to https://supabase.com and create a free account
2. Click **New Project**
3. Name it: `elevator-app`
4. Set a strong database password (save it somewhere safe)
5. Region: **Southeast Asia (Singapore)**
6. Wait for it to finish provisioning (~2 minutes)
7. Go to **Project Settings → API**
8. Copy and save these two values:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / public key** (long string starting with `eyJ...`)

---

## Task 1: Create the Vite + React Project

**Files:**
- Create: `elevator-app/` (entire project directory)
- Create: `elevator-app/package.json` (auto-generated)
- Create: `elevator-app/.env.local`

- [ ] **Step 1: Open PowerShell and navigate to your project folder**

```bash
cd "c:/Users/RICHT/OneDrive/文档/Claude Code Test"
```

- [ ] **Step 2: Create the Vite React project**

```bash
npm create vite@latest elevator-app -- --template react
```

When prompted, confirm with Enter. Expected output ends with:
```
Done. Now run:
  cd elevator-app
  npm install
  npm run dev
```

- [ ] **Step 3: Install dependencies**

```bash
cd elevator-app
npm install
npm install react-router-dom @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: no errors, `node_modules/` folder created.

- [ ] **Step 4: Initialize Tailwind**

```bash
npx tailwindcss init -p
```

Expected output: `Created Tailwind CSS config file: tailwind.config.js`

- [ ] **Step 5: Configure Tailwind — replace `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 6: Replace `src/index.css` with Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Configure Vitest — replace `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 8: Create test setup file**

Create `src/test/setup.js`:

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 9: Create `.env.local` in the `elevator-app/` folder**

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_URL.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

Replace both values with what you saved from Supabase in Pre-Task B.

- [ ] **Step 10: Verify the app runs**

```bash
npm run dev
```

Open browser at `http://localhost:5173` — you should see the default Vite + React page.
Press `Ctrl+C` to stop.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold vite react project with tailwind and supabase deps"
```

---

## Task 2: Supabase Database Schema

**Files:**
- No code files — this task runs SQL directly in Supabase dashboard

- [ ] **Step 1: Open the Supabase SQL Editor**

Go to your Supabase project → **SQL Editor** → **New Query**

- [ ] **Step 2: Run the schema creation SQL**

Paste and run this entire block:

```sql
-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('admin', 'operations_manager')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Customers
create table public.customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  created_at timestamptz default now()
);
alter table public.customers enable row level security;
create policy "Authenticated users can manage customers" on public.customers
  for all using (auth.role() = 'authenticated');

-- Buildings
create table public.buildings (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.customers on delete cascade not null,
  name text not null,
  address text,
  floors integer,
  created_at timestamptz default now()
);
alter table public.buildings enable row level security;
create policy "Authenticated users can manage buildings" on public.buildings
  for all using (auth.role() = 'authenticated');

-- Elevators
create table public.elevators (
  id uuid default gen_random_uuid() primary key,
  building_id uuid references public.buildings on delete cascade not null,
  unit_number text not null,
  brand text,
  model text,
  serial_number text,
  elevator_type text,
  status text default 'active' check (status in ('active', 'under_warranty', 'under_free_maintenance', 'inactive')),
  turnover_date date,
  warranty_expiry date,
  free_maintenance_end date,
  created_at timestamptz default now()
);
alter table public.elevators enable row level security;
create policy "Authenticated users can manage elevators" on public.elevators
  for all using (auth.role() = 'authenticated');

-- Maintenance Schedules
create table public.maintenance_schedules (
  id uuid default gen_random_uuid() primary key,
  elevator_id uuid references public.elevators on delete cascade not null,
  visit_type text not null check (visit_type in ('monthly', 'quarterly', 'annual', 'adhoc')),
  next_due_date date,
  created_at timestamptz default now()
);
alter table public.maintenance_schedules enable row level security;
create policy "Authenticated users can manage schedules" on public.maintenance_schedules
  for all using (auth.role() = 'authenticated');

-- Jobs
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  schedule_id uuid references public.maintenance_schedules,
  elevator_id uuid references public.elevators on delete cascade not null,
  technician_name text,
  scheduled_date date not null,
  completed_date date,
  status text default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed')),
  notes text,
  created_at timestamptz default now()
);
alter table public.jobs enable row level security;
create policy "Authenticated users can manage jobs" on public.jobs
  for all using (auth.role() = 'authenticated');

-- Invoices (admin only — enforced in app, not RLS for simplicity in Phase 1)
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.customers on delete cascade not null,
  job_id uuid references public.jobs,
  invoice_number text not null unique,
  invoice_type text not null check (invoice_type in ('maintenance', 'installation')),
  issue_date date not null,
  due_date date,
  total_amount numeric(12,2) not null default 0,
  status text default 'unpaid' check (status in ('unpaid', 'partially_paid', 'paid')),
  notes text,
  created_at timestamptz default now()
);
alter table public.invoices enable row level security;
create policy "Authenticated users can manage invoices" on public.invoices
  for all using (auth.role() = 'authenticated');

-- Invoice Items
create table public.invoice_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices on delete cascade not null,
  description text not null,
  amount numeric(12,2) not null
);
alter table public.invoice_items enable row level security;
create policy "Authenticated users can manage invoice items" on public.invoice_items
  for all using (auth.role() = 'authenticated');

-- Payments
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices on delete cascade not null,
  amount numeric(12,2) not null,
  payment_date date not null,
  payment_method text check (payment_method in ('cash', 'cheque', 'bank_transfer')),
  reference text,
  created_at timestamptz default now()
);
alter table public.payments enable row level security;
create policy "Authenticated users can manage payments" on public.payments
  for all using (auth.role() = 'authenticated');

-- Installation Projects
create table public.installation_projects (
  id uuid default gen_random_uuid() primary key,
  elevator_id uuid references public.elevators,
  customer_id uuid references public.customers on delete cascade not null,
  project_name text not null,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz default now()
);
alter table public.installation_projects enable row level security;
create policy "Authenticated users can manage projects" on public.installation_projects
  for all using (auth.role() = 'authenticated');

-- Payment Milestones
create table public.payment_milestones (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.installation_projects on delete cascade not null,
  category text not null check (category in ('equipment', 'installation')),
  description text not null,
  amount numeric(12,2) not null,
  status text default 'unbilled' check (status in ('unbilled', 'billed', 'paid')),
  billed_date date,
  paid_date date,
  created_at timestamptz default now()
);
alter table public.payment_milestones enable row level security;
create policy "Authenticated users can manage milestones" on public.payment_milestones
  for all using (auth.role() = 'authenticated');
```

Expected: green checkmark, "Success. No rows returned."

- [ ] **Step 3: Create your admin user in Supabase**

Go to **Authentication → Users → Invite User**
Enter your email address. You will receive an email to set a password.

- [ ] **Step 4: Insert your admin profile**

After confirming your email and setting a password, go back to SQL Editor and run:

```sql
insert into public.profiles (id, full_name, role)
select id, 'Admin', 'admin'
from auth.users
where email = 'YOUR_EMAIL_HERE';
```

Replace `YOUR_EMAIL_HERE` with your actual email.

Expected: `Insert successful. 1 row affected.`

---

## Task 3: Supabase Client

**Files:**
- Create: `src/lib/supabase.js`

- [ ] **Step 1: Write the test**

Create `src/lib/supabase.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { supabase } from './supabase'

describe('supabase client', () => {
  it('is defined', () => {
    expect(supabase).toBeDefined()
  })

  it('has auth property', () => {
    expect(supabase.auth).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/lib/supabase.test.js
```

Expected: FAIL — `Cannot find module './supabase'`

- [ ] **Step 3: Create `src/lib/supabase.js`**

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/lib/supabase.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.js src/lib/supabase.test.js
git commit -m "feat: add supabase client"
```

---

## Task 4: Auth Context

**Files:**
- Create: `src/contexts/AuthContext.jsx`

The auth context holds the current user and their role. It loads the user's profile from the `profiles` table after login.

- [ ] **Step 1: Write the test**

Create `src/contexts/AuthContext.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    }),
  }
}))

function TestComponent() {
  const { user, role, loading } = useAuth()
  if (loading) return <div>loading</div>
  return (
    <div>
      <span data-testid="user">{user ? 'logged-in' : 'logged-out'}</span>
      <span data-testid="role">{role || 'no-role'}</span>
    </div>
  )
}

describe('AuthContext', () => {
  it('shows logged-out state when no session', async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>)
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('logged-out')
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/contexts/AuthContext.test.jsx
```

Expected: FAIL — `Cannot find module './AuthContext'`

- [ ] **Step 3: Create `src/contexts/AuthContext.jsx`**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', userId)
      .single()
    if (data) setRole(data.role)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setRole(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/contexts/AuthContext.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/contexts/AuthContext.jsx src/contexts/AuthContext.test.jsx
git commit -m "feat: add auth context with role loading"
```

---

## Task 5: Login Page

**Files:**
- Create: `src/pages/Login.jsx`

- [ ] **Step 1: Write the test**

Create `src/pages/Login.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from './Login'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null })
    }
  }
}))

describe('Login', () => {
  it('renders email and password fields', () => {
    render(<Login />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders sign in button', () => {
    render(<Login />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows error when login fails', async () => {
    const { supabase } = await import('../lib/supabase')
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      error: { message: 'Invalid credentials' }
    })
    const user = userEvent.setup()
    render(<Login />)
    await user.type(screen.getByLabelText(/email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/pages/Login.test.jsx
```

Expected: FAIL — `Cannot find module './Login'`

- [ ] **Step 3: Create `src/pages/Login.jsx`**

```jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Elevator Management</h1>
        <p className="text-gray-500 mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/pages/Login.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Login.jsx src/pages/Login.test.jsx
git commit -m "feat: add login page"
```

---

## Task 6: Navigation Layout

**Files:**
- Create: `src/components/Layout.jsx`

The sidebar shows different menu items depending on role. Finance items (Invoices, Reports → Financial) are hidden from operations_manager.

- [ ] **Step 1: Write the test**

Create `src/components/Layout.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from './Layout'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

import { useAuth } from '../contexts/AuthContext'

describe('Layout', () => {
  it('shows all nav items for admin', () => {
    useAuth.mockReturnValue({ user: { email: 'admin@test.com' }, role: 'admin' })
    render(
      <MemoryRouter>
        <Layout><div>content</div></Layout>
      </MemoryRouter>
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Customers')).toBeInTheDocument()
    expect(screen.getByText('Elevators')).toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
    expect(screen.getByText('Jobs')).toBeInTheDocument()
    expect(screen.getByText('Invoices')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })

  it('hides Invoices for operations_manager', () => {
    useAuth.mockReturnValue({ user: { email: 'ops@test.com' }, role: 'operations_manager' })
    render(
      <MemoryRouter>
        <Layout><div>content</div></Layout>
      </MemoryRouter>
    )
    expect(screen.queryByText('Invoices')).not.toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/components/Layout.test.jsx
```

Expected: FAIL — `Cannot find module './Layout'`

- [ ] **Step 3: Create `src/components/Layout.jsx`**

```jsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const adminNav = [
  { label: 'Dashboard', to: '/' },
  { label: 'Customers', to: '/customers' },
  { label: 'Elevators', to: '/elevators' },
  { label: 'Maintenance', to: '/maintenance' },
  { label: 'Jobs', to: '/jobs' },
  { label: 'Invoices', to: '/invoices', adminOnly: true },
  { label: 'Projects', to: '/projects', adminOnly: true },
  { label: 'Reports', to: '/reports' },
]

export default function Layout({ children }) {
  const { user, role } = useAuth()

  const navItems = adminNav.filter(item =>
    !item.adminOnly || role === 'admin'
  )

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="font-bold text-lg">Elevator App</h1>
          <p className="text-xs text-gray-400 mt-1 capitalize">
            {role?.replace('_', ' ')}
          </p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 truncate mb-2">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/components/Layout.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout.jsx src/components/Layout.test.jsx
git commit -m "feat: add navigation layout with role-based sidebar"
```

---

## Task 7: Router and App Shell

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/main.jsx`
- Create: `src/pages/Dashboard.jsx` (placeholder)
- Create: `src/components/PrivateRoute.jsx`

- [ ] **Step 1: Create placeholder Dashboard page**

Create `src/pages/Dashboard.jsx`:

```jsx
export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
      <p className="text-gray-500">Overview coming in Plan 2.</p>
    </div>
  )
}
```

- [ ] **Step 2: Create PrivateRoute component**

Create `src/components/PrivateRoute.jsx`:

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function PrivateRoute({ children, adminOnly = false }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && role !== 'admin') return <Navigate to="/" replace />

  return children
}
```

- [ ] **Step 3: Replace `src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

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
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                {/* More routes added in Plan 2 */}
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
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
```

- [ ] **Step 4: Replace `src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 6: Start the dev server and verify manually**

```bash
npm run dev
```

Open `http://localhost:5173`:
- Should redirect to `/login`
- Login with your admin email and password
- Should show the dashboard with sidebar
- Sidebar should show: Dashboard, Customers, Elevators, Maintenance, Jobs, Invoices, Projects, Reports
- Sign out should return to login page

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/main.jsx src/pages/Dashboard.jsx src/components/PrivateRoute.jsx
git commit -m "feat: add router, private routes, and app shell"
```

---

## Task 8: Deploy to Vercel

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create `vercel.json` for SPA routing**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

- [ ] **Step 2: Install Vercel CLI**

```bash
npm install -g vercel
```

- [ ] **Step 3: Deploy**

```bash
vercel
```

When prompted:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name: `elevator-app`
- Directory: `./` (press Enter)
- Override settings? **N**

- [ ] **Step 4: Set environment variables in Vercel**

```bash
vercel env add VITE_SUPABASE_URL
```
Paste your Supabase URL when prompted, select all environments.

```bash
vercel env add VITE_SUPABASE_ANON_KEY
```
Paste your Supabase anon key when prompted, select all environments.

- [ ] **Step 5: Redeploy with env vars**

```bash
vercel --prod
```

Expected output includes a URL like `https://elevator-app-xxxx.vercel.app`

- [ ] **Step 6: Verify live app**

Open the Vercel URL in your browser. Login should work. The app is now accessible from any computer or phone.

- [ ] **Step 7: Commit**

```bash
git add vercel.json
git commit -m "feat: add vercel config for spa routing"
git push origin main
```

---

## Plan 1 Complete

At this point you have:
- A live URL accessible from any browser
- Working login with your admin account
- Role-based navigation sidebar
- All database tables created in Supabase
- Full test suite passing

**Next:** Plan 2 adds Customers, Buildings, Elevators, Maintenance Schedule, and Jobs.
