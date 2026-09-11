import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { UpgradeModal } from '../ui/UpgradeModal';
import { sampleDataService } from '../../services/sampleDataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const { success, error } = useToast();
  const { refreshUser } = useAuth();

  const handleLoadSampleData = async () => {
    setIsLoadingSample(true);
    try {
      const result = await sampleDataService.loadSampleData();
      success(result.message || 'Sample clients, projects, tasks, time logs, and invoices populated!');
      await refreshUser();
      // Reload current page state smoothly
      window.dispatchEvent(new CustomEvent('freelanceflow:data-updated'));
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to populate sample data');
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar
          onOpenUpgrade={() => setUpgradeModalOpen(true)}
          onLoadSampleData={handleLoadSampleData}
          isLoadingSample={isLoadingSample}
        />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative z-10 w-64 h-full"
            >
              <Sidebar
                onClose={() => setMobileSidebarOpen(false)}
                onOpenUpgrade={() => {
                  setMobileSidebarOpen(false);
                  setUpgradeModalOpen(true);
                }}
                onLoadSampleData={() => {
                  setMobileSidebarOpen(false);
                  handleLoadSampleData();
                }}
                isLoadingSample={isLoadingSample}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Navbar
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenUpgrade={() => setUpgradeModalOpen(true)}
          onLoadSampleData={handleLoadSampleData}
          isLoadingSample={isLoadingSample}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Upgrade / Plan Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </div>
  );
};
