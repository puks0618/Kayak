import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Calendar, FileText } from 'lucide-react';

const InvoiceViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Direct connection to billing backend (port 4000)
  const pdfUrl = `http://localhost:4000/api/billing/${id}/invoice`;

  useEffect(() => {
    console.log('Invoice PDF URL:', pdfUrl);
  }, [pdfUrl]);

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-4 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Billing ID: {id}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/trips')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF690F] hover:bg-[#E55E0D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF690F]"
          >
            <Calendar className="w-4 h-4 mr-2" />
            View My Trips
          </button>
          <button
            onClick={() => navigate('/billing')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF690F]"
          >
            <FileText className="w-4 h-4 mr-2" />
            All Invoices
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <iframe
          src={pdfUrl}
          style={{ width: '100%', height: '80vh', border: 'none' }}
          title="Invoice PDF"
          onError={(e) => {
            console.error('Iframe error:', e);
          }}
        />
        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
          <p>Loading PDF from: {pdfUrl}</p>
          <p className="mt-2">If the PDF doesn't load, check the browser console and network tab for errors.</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewerPage;
