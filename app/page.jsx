"use client";
import React from 'react';
import { AppProvider, useAppContext } from '@/context/AppContext';
import DashboardTab from '@/components/DashboardTab';
import UploadTab from '@/components/UploadTab';
import ResumoTab from '@/components/ResumoTab';
import Modals from '@/components/Modals';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

function MainContent() {
    const { abaAtual } = useAppContext();

    return (
        <div className="flex min-h-screen no-print bg-[#EDEFF0] dark:bg-darkBg">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar />
                <div className="flex-1 bg-[#EDEFF0] dark:bg-darkBg relative">
                    {abaAtual === 'dashboard' && <DashboardTab />}
                    {abaAtual === 'upload' && <UploadTab />}
                    {abaAtual === 'resumo' && <ResumoTab />}
                </div>
                <Modals />
            </div>
        </div>
    );
}

export default function App() {
    return (
        <AppProvider>
            <MainContent />
        </AppProvider>
    );
}
