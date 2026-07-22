"use client";
import React from 'react';
import { AppProvider, useAppContext } from '@/context/AppContext';
import DashboardTab from '@/components/DashboardTab';
import UploadTab from '@/components/UploadTab';
import NotasEmitidasTab from '@/components/NotasEmitidasTab';
import NotasRecebidasTab from '@/components/NotasRecebidasTab';
import CteTab from '@/components/CteTab';
import ApuracaoIcmsTab from '@/components/ApuracaoIcmsTab';
import ApuracaoPisCofinsTab from '@/components/ApuracaoPisCofinsTab';
import EmpresasTab from '@/components/EmpresasTab';
import Modals from '@/components/Modals';
import Navbar from '@/components/Navbar';

function MainContent() {
    const { abaAtual } = useAppContext();

    return (
        <div className="flex flex-col min-h-screen no-print bg-[#EDEFF0] dark:bg-darkBg">
            <Navbar />
            <div className="flex-1 bg-[#EDEFF0] dark:bg-darkBg relative">
                {abaAtual === 'dashboard' && <DashboardTab />}
                {abaAtual === 'upload' && <UploadTab />}
                {abaAtual === 'notas_emitidas' && <NotasEmitidasTab />}
                {abaAtual === 'notas_recebidas' && <NotasRecebidasTab />}
                {abaAtual === 'cte' && <CteTab />}
                {abaAtual === 'apuracao_icms' && <ApuracaoIcmsTab />}
                {abaAtual === 'apuracao_pis_cofins' && <ApuracaoPisCofinsTab />}
                {abaAtual === 'empresas' && <EmpresasTab />}
            </div>
            <Modals />
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
