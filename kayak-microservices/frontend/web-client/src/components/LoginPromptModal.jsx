import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

/**
 * Login Prompt Modal
 * Shows when unauthenticated user tries to book
 */
export default function LoginPromptModal({ isOpen, onClose, returnPath }) {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('LoginPromptModal rendered, isOpen:', isOpen);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = () => {
    navigate('/login', { state: { from: { pathname: returnPath } } });
  };

  const handleSignUp = () => {
    navigate('/signup', { state: { from: { pathname: returnPath } } });
  };

  const modalContent = (
    <div
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999
      }}
    >
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Content */}
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Hey, friend.
            </h2>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Nice seeing you again.
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sign up to get some great benefits you're missing out on right now:
            </p>

            <ul className="text-left text-sm text-gray-700 dark:text-gray-300 mb-8 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Cheaper prices with member-only discounts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Fast and easy booking with saved details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Free trip planning, synced to all your devices</span>
              </li>
            </ul>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSignUp}
                className="w-full py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
              >
                Sign up
              </button>
              
              <button
                onClick={handleSignIn}
                className="w-full py-3 px-6 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
