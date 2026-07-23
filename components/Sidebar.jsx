"use client";
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';

const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { key: 'upload', label: 'Importar', icon: 'upload' },
    { key: 'resumo', label: 'Resumo', icon: 'pie-chart' },
];

export default function Sidebar() {
    const { abaAtual, setAbaAtual, sidebarMobileAberto, setSidebarMobileAberto } = useAppContext();

    const irPara = (key) => {
        setAbaAtual(key);
        setSidebarMobileAberto(false);
    };

    return (
        <>
            {sidebarMobileAberto && (
                <div
                    onClick={() => setSidebarMobileAberto(false)}
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden no-print animate-modal-backdrop"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-slate-900 flex flex-col transition-transform duration-200 ease-out no-print lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${sidebarMobileAberto ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10 shrink-0">
                    <div className="h-8 w-8 rounded-lg bg-brand text-white flex items-center justify-center font-black text-sm shrink-0">P</div>
                    <div className="flex flex-col leading-tight min-w-0">
                        <span className="font-bold text-white truncate">Pantax</span>
                        <span className="text-[10px] text-slate-400 truncate">Apuração Fiscal</span>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                    {NAV_ITEMS.map(item => {
                        const ativo = abaAtual === item.key;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => irPara(item.key)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition text-left ${ativo ? 'bg-brand text-white shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                            >
                                <Icon name={item.icon} className="w-4 h-4 shrink-0" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
