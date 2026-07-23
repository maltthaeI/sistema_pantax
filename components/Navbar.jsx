"use client";
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { CustomSelect, formatarMesAnoAbrev } from '@/lib/utils';

const ABAS = [
    { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { key: 'upload', label: 'Importar', icon: 'upload' },
    { key: 'resumo', label: 'Resumo', icon: 'pie-chart' },
];

export default function Navbar() {
    const { abaAtual, setAbaAtual, usuario, logout, darkMode, toggleDarkMode,
        empresas, empresaAtualId, setEmpresaAtualId, competencias, competenciaAtualId, setCompetenciaAtualId } = useAppContext();

    const opcoesEmpresa = empresas.map(e => ({ value: e.id, label: e.nome_fantasia || e.razao_social }));
    const opcoesCompetencia = competencias.map(c => ({
        value: c.key,
        label: `${formatarMesAnoAbrev(c.ano, c.mes)} · ${c.tipo_calculo === 'previa' ? 'Prévia' : 'Fechamento'}`,
    }));

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
                    <div className="w-full max-w-[190px]">
                        <CustomSelect
                            value={competenciaAtualId}
                            onChange={setCompetenciaAtualId}
                            options={opcoesCompetencia}
                            placeholder="Competência"
                            disabled={opcoesCompetencia.length === 0}
                            className="bg-gray-50 dark:bg-darkElevated border border-gray-200 dark:border-darkBorder rounded-md px-3 py-2 text-[12px] font-semibold outline-none"
                        />
                    </div>
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
                {ABAS.map(aba => (
                    <a key={aba.key} onClick={() => setAbaAtual(aba.key)} className={`px-4 py-2.5 text-[12px] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap rounded-t-lg flex items-center gap-2 tracking-wide uppercase border-t-2 ${abaAtual === aba.key ? 'bg-[#EDEFF0] text-gray-900 dark:bg-darkBg dark:text-white border-white' : 'border-transparent text-white/85 hover:bg-white/10 hover:text-white'}`}>
                        <Icon name={aba.icon} className="w-3.5 h-3.5" /> {aba.label}
                    </a>
                ))}
            </nav>
        </header>
    );
}
