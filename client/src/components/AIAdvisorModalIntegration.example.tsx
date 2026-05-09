// ============================================================================
// FILE: AIAdvisorModalIntegration.example.tsx
// LOCATION: This is an example showing how to integrate AIAdvisorModal
// PURPOSE: Demonstrates how to manage modal state and trigger it from your layout
// ============================================================================

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { AIAdvisorModal } from '../components/AIAdvisorModal';

// ============================================================================
// EXAMPLE: How to use in your NewDashboard or main layout component
// ============================================================================

export const DashboardWithAIModal: React.FC = () => {
  // State management for the modal
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Example data (replace with your actual data)
  const alerts = [];
  const resourceCount = 42;
  const totalCost = 12450.50;

  return (
    <>
      {/* Your existing dashboard content */}
      <div className="flex h-screen bg-[#0a0e18]">
        {/* Sidebar or Header */}
        <header className="w-full bg-[#13141b] border-b border-[#242732] flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-white">AWS Dashboard</h1>

          {/* AI Advisor Button - Place anywhere in your header/nav */}
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            <MessageSquare size={20} />
            AI Advisor
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Your dashboard content here */}
          <div className="p-8">
            <h2 className="text-xl text-slate-100 mb-6">Welcome to CloudOpti</h2>
            {/* Add your dashboard components */}
          </div>
        </main>
      </div>

      {/* AI Advisor Modal */}
      <AIAdvisorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        alerts={alerts}
        resourceCount={resourceCount}
        totalCost={totalCost}
        infrastructureContext="AWS environment with EC2, RDS, and S3 resources"
      />
    </>
  );
};

// ============================================================================
// ALTERNATIVE: Using as a Context Provider for global access
// ============================================================================

import { createContext, useContext } from 'react';

interface AIAdvisorContextType {
  isOpen: boolean;
  openAIAdvisor: () => void;
  closeAIAdvisor: () => void;
}

const AIAdvisorContext = createContext<AIAdvisorContextType | undefined>(undefined);

export const AIAdvisorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AIAdvisorContext.Provider
      value={{
        isOpen,
        openAIAdvisor: () => setIsOpen(true),
        closeAIAdvisor: () => setIsOpen(false),
      }}
    >
      {children}
      <AIAdvisorModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </AIAdvisorContext.Provider>
  );
};

export const useAIAdvisor = () => {
  const context = useContext(AIAdvisorContext);
  if (!context) {
    throw new Error('useAIAdvisor must be used within AIAdvisorProvider');
  }
  return context;
};

// ============================================================================
// EXAMPLE: Using the context in any component
// ============================================================================

export const NavBar: React.FC = () => {
  const { openAIAdvisor } = useAIAdvisor();

  return (
    <button onClick={openAIAdvisor} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
      <MessageSquare size={18} />
      Chat with AI
    </button>
  );
};

// ============================================================================
// INTEGRATION STEPS:
// ============================================================================
/*

1. SIMPLE INTEGRATION (useState approach):
   
   In your main layout file (e.g., NewDashboard.tsx):
   
   ```tsx
   import { AIAdvisorModal } from '../components/AIAdvisorModal';
   
   export const NewDashboard: React.FC = () => {
     const [isAIModalOpen, setIsAIModalOpen] = useState(false);
   
     return (
       <>
         {/* Your layout */}
         <button onClick={() => setIsAIModalOpen(true)}>
           AI Advisor
         </button>
   
         {/* Modal */}
         <AIAdvisorModal
           isOpen={isAIModalOpen}
           onClose={() => setIsAIModalOpen(false)}
         />
       </>
     );
   };
   ```

2. CONTEXT PROVIDER APPROACH (Global access):
   
   In your main App.tsx or root file:
   
   ```tsx
   import { AIAdvisorProvider } from './components/AIAdvisorModalIntegration.example';
   
   function App() {
     return (
       <AIAdvisorProvider>
         <YourAppContent />
       </AIAdvisorProvider>
     );
   }
   ```
   
   Then in any component:
   
   ```tsx
   import { useAIAdvisor } from '../components/AIAdvisorModalIntegration.example';
   
   export const SomeComponent = () => {
     const { openAIAdvisor } = useAIAdvisor();
     
     return (
       <button onClick={openAIAdvisor}>
         Chat with AI
       </button>
     );
   };
   ```

3. KEYBOARD SHORTCUT (Optional enhancement):
   
   Add this to your layout:
   
   ```tsx
   useEffect(() => {
     const handleKeyPress = (e: KeyboardEvent) => {
       // Cmd/Ctrl + K to open AI Advisor
       if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
         e.preventDefault();
         setIsAIModalOpen(true);
       }
       // Esc to close
       if (e.key === 'Escape') {
         setIsAIModalOpen(false);
       }
     };
     
     window.addEventListener('keydown', handleKeyPress);
     return () => window.removeEventListener('keydown', handleKeyPress);
   }, []);
   ```

4. STYLING NOTES:
   - All colors use your existing dark theme palette
   - Modal is 80% of viewport width (max-w-4xl) and 85vh height
   - Backdrop blur effect: backdrop-blur-sm bg-black/50
   - Smooth animations: fadeIn (300ms) and slideUp (300ms)
   - Uses Lucide React icons (ensure it's installed)

5. API INTEGRATION:
   - The component posts to /api/ai-advisor endpoint
   - Include your own Groq API integration in the backend
   - Messages are stored in localStorage with key: 'ai-advisor-chats'

*/
