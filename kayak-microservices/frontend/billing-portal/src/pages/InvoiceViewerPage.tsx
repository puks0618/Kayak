import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const InvoiceViewerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Build the PDF URL using the same environment variable as the API service
  // Default to port 3001 to match the backend server
  const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BILLING_API_URL || 'http://localhost:3001';
  const pdfUrl = `${API_URL}/api/billing/${id}/invoice`;

  useEffect(() => {
    console.log('Invoice PDF URL:', pdfUrl);
  }, [pdfUrl]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoice for Billing ID {id}</h2>
        </div>
        <button
          onClick={() => navigate('/billing')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-kayak-orange hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kayak-orange"
        >
          Back to Billing Records
        </button>
      </div>
      
      <div className="flex-1 bg-white shadow rounded-lg overflow-hidden">
        <iframe
          src={pdfUrl}
          style={{ width: '100%', height: '80vh', border: 'none' }}
          title="Invoice PDF"
          onError={(e) => {
            console.error('Iframe error:', e);
          }}
        />
        <div className="p-4 text-sm text-gray-500">
          <p>Loading PDF from: {pdfUrl}</p>
          <p className="mt-2">If the PDF doesn't load, check the browser console and network tab for errors.</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewerPage;

