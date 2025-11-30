import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BillingList from './pages/BillingList';
import BillingDetail from './pages/BillingDetail';
import CreateBilling from './pages/CreateBilling';
import InvoiceViewerPage from './pages/InvoiceViewerPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/billing" element={<BillingList />} />
          <Route path="/billing/new" element={<CreateBilling />} />
          <Route path="/billing/:id/invoice" element={<InvoiceViewerPage />} />
          <Route path="/billing/:id" element={<BillingDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

