"use client";
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { CustomSelect, formatarMesAnoAbrev } from '@/lib/utils';

const ABAS = [
    { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { key: 'upload', label: 'Importar', icon: 'upload' },
    { key: 'notas_emitidas', label: 'Notas Emitidas', icon: 'file-text' },
    { key: 'notas_recebidas', label: 'Notas Recebidas', icon: 'file-text' },
    { key: 'cte', label: 'CT-e', icon: 'truck' },
    { key: 'apuracao_icms', label: 'Apuração ICMS', icon: 'dollar-sign' },
    { key: 'apuracao_pis_cofins', label: 'PIS/COFINS', icon: 'percent' },
    { key: 'empresas', label: 'Empresas', icon: 'building-2', adminOnly: true },
];

export default function Navbar() {
    const { abaAtual, setAbaAtual, isAdmin, usuario, logout, darkMode, toggleDarkMode,
        empresas, empresaAtualId, setEmpresaAtualId, periodos, periodoAtualId, setPeriodoAtualId, periodoAtual } = useAppContext();

    const opcoesEmpresa = empresas.map(e => ({ value: e.id, label: e.nome_fantasia || e.razao_social }));
    const opcoesPeriodo = periodos.map(p => ({ value: p.id, label: `${formatarMesAnoAbrev(p.ano, p.mes)}${p.status === 'fechado' ? ' 🔒' : ''}` }));

    return (
        <header className="sticky top-0 z-40 bg-white dark:bg-darkBg no-print">
            <div className="px-6 h-[64px] flex justify-between items-center border-b border-gray-100 dark:border-darkBorder">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-brand text-white flex items-center justify-center font-black text-sm shrink-0">P</div>
                    <span className="font-bold text-gray-900 dark:text-white hidden sm:inline">Pantax</span>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-center max-w-xl">
                    <div className="w-full max-w-[220px]">
                        <CustomSelect
                            value={empresaAtualId}
                            onChange={setEmpresaAtualId}
                            options={opcoesEmpresa}
                            placeholder="Selecione a empresa"
                            className="bg-gray-50 dark:bg-darkElevated border border-gray-200 dark:border-darkBorder rounded-md px-3 py-2 text-[12px] font-semibold outline-none"
                        />
                    </div>
                    <div className="w-full max-w-[160px]">
                        <CustomSelect
                            value={periodoAtualId}
                            onChange={setPeriodoAtualId}
                            options={opcoesPeriodo}
                            placeholder="Período"
                            disabled={opcoesPeriodo.length === 0}
                            className="bg-gray-50 dark:bg-darkElevated border border-gray-200 dark:border-darkBorder rounded-md px-3 py-2 text-[12px] font-semibold outline-none"
                        />
                    </div>
                    {periodoAtual?.status === 'fechado' && (
                        <span className="hidden md:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded shrink-0">
                            <Icon name="lock" className="w-3 h-3" /> Fechado
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={toggleDarkMode} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-darkHover transition text-gray-600 dark:text-[#888888]">
                        <Icon name={darkMode ? 'sun' : 'moon'} className="w-5 h-5" />
                    </button>
                    <div className="hidden sm:block w-[1px] h-8 bg-gray-200 dark:bg-darkBorder mx-1"></div>
                    <span className="hidden sm:inline text-[12px] font-semibold text-gray-700 dark:text-[#EDEDED] mr-1">{usuario?.nome}</span>
                    <button type="button" onClick={() => logout()} aria-label="Sair" className="text-gray-400 hover:text-red-500 transition p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30">
                        <Icon name="log-out" className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <nav className="px-6 flex gap-1 bg-brand overflow-x-auto no-scrollbar-style">
                {ABAS.filter(a => !a.adminOnly || isAdmin).map(aba => (
                    <a key={aba.key} onClick={() => setAbaAtual(aba.key)} className={`px-4 py-2.5 text-[12px] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap rounded-t-lg flex items-center gap-2 tracking-wide uppercase border-t-2 ${abaAtual === aba.key ? 'bg-[#EDEFF0] text-gray-900 dark:bg-darkBg dark:text-white border-white' : 'border-transparent text-white/85 hover:bg-white/10 hover:text-white'}`}>
                        <Icon name={aba.icon} className="w-3.5 h-3.5" /> {aba.label}
                    </a>
                ))}
            </nav>
        </header>
    );
}
