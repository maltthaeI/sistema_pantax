"use client";
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { CustomSelect, formatarMesAnoAbrev } from '@/lib/utils';

export default function Topbar() {
    const { usuario, logout, sidebarMobileAberto, setSidebarMobileAberto,
        empresas, empresaAtualId, setEmpresaAtualId, competencias, competenciaAtualId, setCompetenciaAtualId } = useAppContext();

    const opcoesEmpresa = empresas.map(e => ({ value: e.id, label: e.nome_fantasia || e.razao_social }));
    const opcoesCompetencia = competencias.map(c => ({
        value: c.key,
        label: `${formatarMesAnoAbrev(c.ano, c.mes)} · ${c.tipo_calculo === 'previa' ? 'Prévia' : 'Fechamento'}`,
    }));

    return (
        <header className="sticky top-0 z-30 bg-darkCard no-print">
            <div className="px-4 sm:px-6 h-16 flex justify-between items-center gap-3 border-b border-white/10">
                <button
                    type="button"
                    onClick={() => setSidebarMobileAberto(!sidebarMobileAberto)}
                    aria-label="Abrir menu"
                    className="lg:hidden p-2 -ml-2 rounded-md hover:bg-white/5 transition text-darkMuted hover:text-white shrink-0"
                >
                    <Icon name="menu" className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 flex-1 justify-start max-w-xl">
                    <div className="w-full max-w-[220px]">
                        <CustomSelect
                            value={empresaAtualId}
                            onChange={setEmpresaAtualId}
                            options={opcoesEmpresa}
                            placeholder="Selecione a empresa"
                            pesquisavel
                            className="bg-darkElevated border border-white/10 text-[12px] font-semibold text-white"
                        />
                    </div>
                    <div className="w-full max-w-[190px]">
                        <CustomSelect
                            value={competenciaAtualId}
                            onChange={setCompetenciaAtualId}
                            options={opcoesCompetencia}
                            placeholder="Competência"
                            disabled={opcoesCompetencia.length === 0}
                            className="bg-darkElevated border border-white/10 rounded-md px-3 py-2 text-[12px] font-semibold text-white outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <span className="hidden sm:inline text-[12px] font-semibold text-darkText mr-1">{usuario?.nome}</span>
                    <button type="button" onClick={() => logout()} aria-label="Sair" className="text-darkMuted hover:text-danger transition p-2 rounded-md hover:bg-danger/15">
                        <Icon name="log-out" className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
