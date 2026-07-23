"use client";
import { useEffect, useState } from 'react';
import { useAppContext, supabase } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { formatarValorFinanceiro, formatarMesAnoAbrev } from '@/lib/utils';

function ColunaCfop({ titulo, icon, cor, linhas, selecionados, onToggle, onToggleTodos }) {
    const somar = (campo) => linhas.reduce((soma, l) => soma + (l[campo] || 0), 0);
    const todosSelecionados = linhas.length > 0 && linhas.every(l => selecionados.has(`${l.cfop_direcao}:${l.cfop}`));

    return (
        <div className="bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-xl overflow-hidden">
            <div className={`px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-darkBorder ${cor}`}>
                <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide">
                    <Icon name={icon} className="w-4 h-4" /> {titulo}
                </span>
                <span className="text-[11px] font-semibold opacity-80">{linhas.length} CFOP(s)</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-darkElevated text-gray-500 dark:text-gray-400 text-left">
                            <th className="px-4 py-2 font-semibold w-8">
                                <input type="checkbox" checked={todosSelecionados} onChange={e => onToggleTodos(linhas, e.target.checked)} className="accent-brand" />
                            </th>
                            <th className="px-4 py-2 font-semibold">CFOP</th>
                            <th className="px-4 py-2 font-semibold text-right">Valor Total</th>
                            <th className="px-4 py-2 font-semibold text-right">Valor do IPI</th>
                            <th className="px-4 py-2 font-semibold text-right">Valor do ICMS</th>
                            <th className="px-4 py-2 font-semibold text-right">Valor do ICMS ST</th>
                            <th className="px-4 py-2 font-semibold text-right">ICMS UF Destino</th>
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400 italic">Nenhum CFOP encontrado.</td></tr>
                        ) : linhas.map(l => {
                            const chave = `${l.cfop_direcao}:${l.cfop}`;
                            return (
                                <tr key={chave} className="border-t border-gray-100 dark:border-darkBorder">
                                    <td className="px-4 py-2">
                                        <input type="checkbox" checked={selecionados.has(chave)} onChange={() => onToggle(chave)} className="accent-brand" />
                                    </td>
                                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{l.cfop}</td>
                                    <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">R$ {formatarValorFinanceiro(l.valor_total)}</td>
                                    <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">R$ {formatarValorFinanceiro(l.valor_ipi)}</td>
                                    <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">R$ {formatarValorFinanceiro(l.valor_icms)}</td>
                                    <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">R$ {formatarValorFinanceiro(l.valor_icms_st)}</td>
                                    <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">R$ {formatarValorFinanceiro(l.valor_icms_uf_destino)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    {linhas.length > 0 && (
                        <tfoot>
                            <tr className="border-t border-gray-200 dark:border-darkBorder font-bold">
                                <td className="px-4 py-2"></td>
                                <td className="px-4 py-2 text-gray-800 dark:text-white">Total</td>
                                <td className="px-4 py-2 text-right text-gray-900 dark:text-white">R$ {formatarValorFinanceiro(somar('valor_total'))}</td>
                                <td className="px-4 py-2 text-right text-gray-900 dark:text-white">R$ {formatarValorFinanceiro(somar('valor_ipi'))}</td>
                                <td className="px-4 py-2 text-right text-gray-900 dark:text-white">R$ {formatarValorFinanceiro(somar('valor_icms'))}</td>
                                <td className="px-4 py-2 text-right text-gray-900 dark:text-white">R$ {formatarValorFinanceiro(somar('valor_icms_st'))}</td>
                                <td className="px-4 py-2 text-right text-gray-900 dark:text-white">R$ {formatarValorFinanceiro(somar('valor_icms_uf_destino'))}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}

// origem: 'emitidas' | 'recebidas' | 'cte' — cada tela mostra só os CFOPs
// daquela planilha. Emitidas ganha o botão "Gerar Apuração", que lê a seleção
// (checkbox) das 3 telas e calcula ICMS/PIS-COFINS (ver AppContext.gerarApuracao).
export default function ResumoCfopTab({ origem, titulo, mostrarGerar = false }) {
    const {
        empresaAtualId, empresaAtual, competenciaAtual, setAbaAtual,
        ultimaImportacaoEm, selecoesCfop, alternarSelecaoCfop, alternarTodosSelecaoCfop,
        gerarApuracao, gerandoApuracao,
    } = useAppContext();
    const [linhas, setLinhas] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (!empresaAtualId || !competenciaAtual) { setLinhas([]); return; }
        (async () => {
            setCarregando(true);
            setErro('');
            const { data, error } = await supabase
                .from('nfe_resumo_cfop')
                .select('*')
                .eq('empresa_id', empresaAtualId)
                .eq('ano', competenciaAtual.ano)
                .eq('mes', competenciaAtual.mes)
                .eq('tipo_calculo', competenciaAtual.tipo_calculo)
                .eq('origem', origem)
                .order('cfop');
            if (error) setErro(error.message);
            else setLinhas(data || []);
            setCarregando(false);
        })();
    }, [empresaAtualId, competenciaAtual, ultimaImportacaoEm, origem]);

    if (!empresaAtualId) {
        return <div className="p-6 text-center text-[13px] text-gray-500">Nenhuma empresa importada ainda.</div>;
    }

    if (!competenciaAtual) {
        return (
            <div className="p-6 text-center flex flex-col items-center gap-3">
                <p className="text-[13px] text-gray-500">Nenhuma planilha importada ainda para {empresaAtual?.nome_fantasia || empresaAtual?.razao_social}.</p>
                <button onClick={() => setAbaAtual('upload')} className="text-[12px] font-semibold text-brand hover:underline">Importar planilhas →</button>
            </div>
        );
    }

    const selecionados = selecoesCfop[origem];
    const entrada = linhas.filter(l => l.cfop_direcao === 'entrada');
    const saida = linhas.filter(l => l.cfop_direcao === 'saida');
    const toggle = (chave) => alternarSelecaoCfop(origem, chave);
    const toggleTodos = (linhasGrupo, marcar) => alternarTodosSelecaoCfop(origem, linhasGrupo.map(l => `${l.cfop_direcao}:${l.cfop}`), marcar);
    const nadaSelecionado = selecionados.size === 0;

    return (
        <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-brand rounded-full"></span>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {titulo} — {empresaAtual?.nome_fantasia || empresaAtual?.razao_social} · {formatarMesAnoAbrev(competenciaAtual.ano, competenciaAtual.mes)} · {competenciaAtual.tipo_calculo === 'previa' ? 'Prévia' : 'Fechamento'}
                    </h4>
                </div>
                {mostrarGerar && (
                    <button
                        type="button"
                        disabled={gerandoApuracao}
                        onClick={gerarApuracao}
                        className="px-4 py-2 text-[12px] font-semibold bg-brand hover:bg-brandHover text-white rounded-md shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                    >
                        <Icon name="dollar-sign" className="w-3.5 h-3.5" /> {gerandoApuracao ? 'Gerando...' : 'Gerar Apuração'}
                    </button>
                )}
            </div>
            {mostrarGerar && nadaSelecionado && (
                <p className="text-[11px] text-gray-400 -mt-4">Marque os CFOPs de débito aqui em Emitidas e, se quiser restringir o crédito, marque também em Recebidas/CT-e antes de gerar.</p>
            )}

            {erro && <p className="text-[12px] text-red-500">{erro}</p>}
            {carregando ? (
                <p className="text-[12px] text-gray-400 italic">Carregando...</p>
            ) : (
                <div className="flex flex-col gap-4">
                    <ColunaCfop titulo="Entrada" icon="trending-down" cor="text-emerald-600 dark:text-emerald-400" linhas={entrada} selecionados={selecionados} onToggle={toggle} onToggleTodos={toggleTodos} />
                    <ColunaCfop titulo="Saída" icon="trending-up" cor="text-blue-600 dark:text-blue-400" linhas={saida} selecionados={selecionados} onToggle={toggle} onToggleTodos={toggleTodos} />
                </div>
            )}
        </div>
    );
}
