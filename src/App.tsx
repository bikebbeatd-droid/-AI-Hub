import React from 'react';
import { HubProvider, useHub } from './context/HubContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ChatView } from './components/ChatView.tsx';
import { FilesView } from './components/FilesView.tsx';
import { AIToolsView } from './components/AIToolsView.tsx';
import { ProjectsView } from './components/ProjectsView.tsx';
import { ModelsView } from './components/ModelsView.tsx';
import { FavoritesView } from './components/FavoritesView.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { AssistantsView } from './components/AssistantsView.tsx';
import { PromptsView } from './components/PromptsView.tsx';
import { ArtifactsView } from './components/ArtifactsView.tsx';
import { ModelSelectorModal } from './components/ModelSelectorModal.tsx';
import { ModelTestModal } from './components/ModelTestModal.tsx';

const AppContent: React.FC = () => {
  const { activeTab } = useHub();

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased font-sans select-none">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main View Area */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden select-text">
        <Header />

        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {activeTab === 'chat' && <ChatView />}
          {activeTab === 'assistants' && <AssistantsView />}
          {activeTab === 'prompts' && <PromptsView />}
          {activeTab === 'artifacts' && <ArtifactsView />}
          {activeTab === 'files' && <FilesView />}
          {activeTab === 'tools' && <AIToolsView />}
          {activeTab === 'projects' && <ProjectsView />}
          {activeTab === 'models' && <ModelsView />}
          {activeTab === 'favorites' && <FavoritesView />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <ModelSelectorModal />
      <ModelTestModal />
    </div>
  );
};

export default function App() {
  return (
    <HubProvider>
      <AppContent />
    </HubProvider>
  );
}
