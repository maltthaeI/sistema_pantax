"use client";
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { CustomSelect, formatarMesAnoAbrev } from '@/lib/utils';

export default function Topbar() {
    const { usuario, logout, darkMode, toggleDarkMode, sidebarMobileAberto, setSidebarMobileAberto,
        empresas, empresaAtualId, setEmpresaAtualId, competencias, competenciaAtualId, setCompetenciaAtualId } = useAppContext();

    const opcoesEmpresa = empresas.map(e => ({ value: e.id, label: e.nome_fantasia || e.razao_social }));
    const opcoesCompetencia = competencias.map(c => ({
        value: c.key,
        label: `${formatarMesAnoAbrev(c.ano, c.mes)} · ${c.tipo_calculo === 'previa' ? 'Prévia' : 'Fechamento'}`,
    }));

    return (
        <header className="sticky top-0 z-30 bg-white dark:bg-darkBg no-print">
            <div className="px-4 sm:px-6 h-16 flex justify-between items-center gap-3 border-b border-gray-100 dark:border-darkBorder">
                <button
                    type="button"
                    onClick={() => setSidebarMobileAberto(!sidebarMobileAberto)}
                    aria-label="Abrir menu"
                    className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-darkHover transition text-gray-600 dark:text-[#888888] shrink-0"
                >
                    <Icon name="menu" className="w-5 h-5" />
                </button>

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
        </header>
    );
}
