import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import { Menu, Heart } from 'lucide-react';
import { HiOutlineLogout } from 'react-icons/hi';
import { ImUserPlus } from 'react-icons/im';
import { PiAirplaneTiltFill } from "react-icons/pi";
import { IoIosBed } from "react-icons/io";
import { IoCarSharp } from "react-icons/io5";
import { FaUmbrellaBeach, FaFlag, FaDollarSign } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";
import kayakLogo from "../assets/images/kayak logo.png";
import DarkModeToggle from "./DarkModeToggle";

/**
 * Shared Layout Component
 * Used by all pages for consistent header, sidebar, and user menu
 */
export default function SharedLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await dispatch(logoutUser());
    setIsUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-slate-900 dark:text-white">
      {/* Sidebar Menu */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto pt-16">
            <div className="p-4">
              {/* Categories Section */}
              <div className="mb-6">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Categories
                </div>
                <SidebarMenuItem icon={<PiAirplaneTiltFill />} label="Flights" active={location.pathname === '/'} onClick={() => { navigate('/'); setIsMenuOpen(false); }} />
                <SidebarMenuItem icon={<IoIosBed />} label="Stays" active={location.pathname === '/stays'} onClick={() => { navigate('/stays'); setIsMenuOpen(false); }} />
                <SidebarMenuItem icon={<IoCarSharp />} label="Cars" active={location.pathname === '/cars'} onClick={() => { navigate('/cars'); setIsMenuOpen(false); }} />
                <SidebarMenuItem icon={<FaUmbrellaBeach />} label="Packages" active={location.pathname === '/packages'} onClick={() => { navigate('/packages'); setIsMenuOpen(false); }} />
                <SidebarMenuItem icon={<HiSparkles />} label="AI Mode" isNew active={location.pathname === '/ai-mode'} onClick={() => { navigate('/ai-mode'); setIsMenuOpen(false); }} />
              </div>

              {/* Tools Section */}
              <div className="mb-6">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Tools
                </div>
                <SidebarMenuItem label="Plan your trip" />
                <SidebarMenuItem label="Explore" />
                <SidebarMenuItem label="Flight Tracker" />
                <SidebarMenuItem label="Travel tips" />
                <SidebarMenuItem label="KAYAK for Business" isNew />
              </div>

              {/* Settings Section */}
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Settings
                </div>
                <SidebarMenuItem label="Trips" />
                <SidebarMenuItem icon={<FaFlag />} label="English" />
                <SidebarMenuItem icon={<FaDollarSign />} label="United States dollar" />
                <SidebarMenuItem label="Feedback" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="h-8 md:h-10 w-32 md:w-40 overflow-hidden relative flex items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.href = '/'} title="Reload page">
            <img 
              src={kayakLogo} 
              alt="KAYAK" 
              className="w-full h-full object-contain object-left"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <Heart className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <DarkModeToggle />
          <button 
            className="p-1 relative"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 font-semibold text-sm">
              {user ? user.firstName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() : 'G'}
            </div>
          </button>
          
          {/* User Profile Popup */}
          {isUserMenuOpen && (
            <>
              {/* Overlay to close menu */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              {/* Popup Menu */}
              <div className="absolute right-0 top-12 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
                {/* User Info Section */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
                      {user ? user.firstName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Guest'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        {user ? user.email : 'guest@example.com'}
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Add User Button */}
                  <button className="w-full flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors p-2">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <ImUserPlus className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">Add user</span>
                  </button>
                </div>
                
                {/* Navigation Links */}
                <div className="py-2">
                  <UserMenuItem label="Trips" />
                  <UserMenuItem 
                    label="Billing" 
                    onClick={() => { 
                      navigate('/billing'); 
                      setIsUserMenuOpen(false); 
                    }} 
                  />
                  <UserMenuItem label="Join KAYAK for Business" />
                  <UserMenuItem label="Help/FAQ" />
                  <UserMenuItem label="Your account" />
                </div>
                
                {/* Sign Out Button */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={handleSignOut}
                    className="w-full py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <HiOutlineLogout className="w-5 h-5" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}

// Sidebar Menu Item Component
function SidebarMenuItem({ icon, label, active, isNew, onClick }) {
  return (
    <div 
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors select-none
        ${active ? 'bg-[#FF690F] text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'}
      `}
      onClick={onClick}
    >
      {icon && (
        <div className="text-lg flex items-center justify-center">
          {icon}
        </div>
      )}
      <span className="font-medium text-sm flex-1">{label}</span>
      {isNew && (
        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide">
          NEW
        </span>
      )}
    </div>
  );
}

// User Menu Item Component
function UserMenuItem({ label, onClick }) {
  return (
    <div 
      className="px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
    </div>
  );
}

