"use client";
import { useEffect, useState } from 'react';
import { useAppContext, supabase } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { formatarValorFinanceiro, formatarMesAnoAbrev, chaveLinhaCfop, ButtonSpinner } from '@/lib/utils';

// selecionavel=false esconde a coluna de checkbox inteira (Recebidas/CT-e não
// restringem mais o crédito por seleção — ver AppContext.gerarApuracao).
function ColunaCfop({ titulo, icon, cor, linhas, selecionados, onToggle, onToggleTodos, colunas, selecionavel = true }) {
    const somar = (campo) => linhas.reduce((soma, l) => soma + (l[campo] || 0), 0);
    const todosSelecionados = selecionavel && linhas.length > 0 && linhas.every(l => selecionados.has(chaveLinhaCfop(l)));
    const colSpanVazio = colunas.length + 1 + (selecionavel ? 1 : 0);

    return (
        <div className="bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-xl overflow-hidden">
            <div className={`px-4 py-6 flex items-center justify-between border-b border-dashed border-gray-200 dark:border-darkBorder ${cor}`}>
                <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide">
                    <Icon name={icon} className="w-4 h-4" /> {titulo}
                </span>
                <span className="text-[11px] font-semibold opacity-80">{linhas.length} CFOP(s)</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[12px] tabela-listrada">
                    <thead>
                        <tr className="text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {selecionavel && (
                                <th className="pl-8 pr-1 py-3 font-bold w-8 whitespace-nowrap text-center">
                                    <input type="checkbox" checked={todosSelecionados} onChange={e => onToggleTodos(linhas, e.target.checked)} className="accent-brand" />
                                </th>
                            )}
                            <th className={`${selecionavel ? 'pl-1' : 'pl-12'} pr-12 py-3 font-bold whitespace-nowrap text-center`}>CFOP</th>
                            {colunas.map(c => (
                                <th key={c.campo} className="px-12 py-3 font-bold whitespace-nowrap text-center">{c.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.length === 0 ? (
                            <tr><td colSpan={colSpanVazio} className="px-12 py-6 text-center text-gray-400 italic">Nenhum CFOP encontrado.</td></tr>
                        ) : linhas.map(l => {
                            const chave = chaveLinhaCfop(l);
                            const marcada = selecionados.has(chave);
                            return (
                                <tr
                                    key={chave}
                                    onClick={selecionavel ? () => onToggle(chave) : undefined}
                                    className={selecionavel ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition' : ''}
                                >
                                    {selecionavel && (
                                        <td className="pl-8 pr-1 py-3 whitespace-nowrap text-center">
                                            <Icon name="check" className={`w-4 h-4 text-brand mx-auto ${marcada ? '' : 'invisible'}`} />
                                        </td>
                                    )}
                                    <td className={`${selecionavel ? 'pl-1' : 'pl-12'} pr-12 py-3 font-medium text-gray-800 dark:text-white whitespace-nowrap text-center`}>{l.cfop}</td>
                                    {colunas.map(c => (
                                        <td key={c.campo} className="px-12 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap text-center">R$ {formatarValorFinanceiro(l[c.campo])}</td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                    {linhas.length > 0 && (
                        <tfoot>
                            <tr className="font-bold">
                                {selecionavel && <td className="pl-8 pr-1 py-3.5 whitespace-nowrap text-center"></td>}
                                <td className={`${selecionavel ? 'pl-1' : 'pl-12'} pr-12 py-3.5 text-gray-800 dark:text-white whitespace-nowrap text-center`}>Total</td>
                                {colunas.map(c => (
                                    <td key={c.campo} className="px-12 py-3.5 text-gray-900 dark:text-white whitespace-nowrap text-center">R$ {formatarValorFinanceiro(somar(c.campo))}</td>
                                ))}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}

// Colunas exibidas em cada tela — mesmos campos gravados no banco pras 3
// origens, só a ordem/seleção muda (CT-e não usa IPI/ICMS ST/coluna extra).
const COLUNAS_POR_ORIGEM = {
    emitidas: [
        { label: 'Valor Total', campo: 'valor_total' },
        { label: 'Valor do ICMS', campo: 'valor_icms' },
        { label: 'Valor do ICMS ST', campo: 'valor_icms_st' },
        { label: 'Valor do IPI', campo: 'valor_ipi' },
        { label: 'ICMS UF Destino', campo: 'valor_icms_uf_destino' },
    ],
    recebidas: [
        { label: 'Valor Total', campo: 'valor_total' },
        { label: 'Valor do ICMS', campo: 'valor_icms' },
        { label: 'Valor do ICMS ST', campo: 'valor_icms_st' },
        { label: 'Valor do IPI', campo: 'valor_ipi' },
        { label: 'ICMS Simples Nacional', campo: 'valor_icms_simples_nacional' },
    ],
    cte: [
        { label: 'Valor do Frete', campo: 'valor_total' },
        { label: 'Valor do ICMS', campo: 'valor_icms' },
    ],
};

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
    // Só Emitidas tem checkbox de seleção (débito + restringir devolução). Todo
    // CFOP Autorizado de Recebidas/CT-e entra automaticamente no crédito.
    const selecionavel = origem === 'emitidas';
    // Recebidas separa por Categoria da planilha (Revenda x Uso e Consumo);
    // Emitidas separa por cfop_direcao (Entrada x Saída); CT-e é uma tabela
    // única (só CFOPs Autorizados, já filtrado na agregação do import).
    const porCategoria = origem === 'recebidas';
    const tabelaUnica = origem === 'cte';
    const grupoA = porCategoria ? linhas.filter(l => l.categoria === 'revenda') : !tabelaUnica ? linhas.filter(l => l.cfop_direcao === 'entrada') : [];
    const grupoB = porCategoria ? linhas.filter(l => l.categoria === 'uso_consumo') : !tabelaUnica ? linhas.filter(l => l.cfop_direcao === 'saida') : [];
    const semCategoria = porCategoria ? linhas.filter(l => l.categoria !== 'revenda' && l.categoria !== 'uso_consumo') : [];
    const colunas = COLUNAS_POR_ORIGEM[origem];
    const toggle = (chave) => alternarSelecaoCfop(origem, chave);
    const toggleTodos = (linhasGrupo, marcar) => alternarTodosSelecaoCfop(origem, linhasGrupo.map(chaveLinhaCfop), marcar);

    return (
        <div className="p-6 max-w-[1600px] flex flex-col gap-6">
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
                        {gerandoApuracao ? <ButtonSpinner /> : <Icon name="dollar-sign" className="w-3.5 h-3.5" />} {gerandoApuracao ? 'Gerando...' : 'Gerar Apuração'}
                    </button>
                )}
            </div>
            {mostrarGerar && (
                <p className="text-[11px] text-gray-400 -mt-4">Marque os CFOPs de débito aqui em Emitidas antes de gerar — Recebidas e CT-e entram automaticamente com todos os CFOPs Autorizados.</p>
            )}

            {erro && <p className="text-[12px] text-danger">{erro}</p>}
            {carregando ? (
                <p className="text-[12px] text-gray-400 italic">Carregando...</p>
            ) : (
                tabelaUnica ? (
                    <div className="flex flex-col gap-4">
                        <ColunaCfop titulo="CTEs Recebidos" icon="truck" cor="text-info" linhas={linhas} selecionados={selecionados} onToggle={toggle} onToggleTodos={toggleTodos} colunas={colunas} selecionavel={selecionavel} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {porCategoria ? (
                            <>
                                <ColunaCfop titulo="Revenda" icon="trending-down" cor="text-success" linhas={grupoA} selecionados={selecionados} onToggle={toggle} onToggleTodos={toggleTodos} colunas={colunas} selecionavel={selecionavel} />
                                <ColunaCfop titulo="Uso e Consumo" icon="trending-up" cor="text-info" linhas={grupoB} selecionados={selecionados} onToggle={toggle} onToggleTodos={toggleTodos} colunas={colunas} selecionavel={selecionavel} />
                                {semCategoria.length > 0 && (
                                    <ColunaCfop titulo="Sem Categoria" icon="alert-triangle" cor="text-gray-500" linhas={semCategoria} selecionados={selecionados} onToggle={toggle} onToggleTodos={toggleTodos} colunas={colunas} selecionavel={selecionavel} />
                                )}
                            </>
                        ) : (
                            <>
                                <ColunaCfop titulo="Entrada" icon="trending-down" cor="text-success" linhas={grupoA} selecionados={selecionados} onToggle={toggle} onToggleTodos={toggleTodos} colunas={colunas} selecionavel={selecionavel} />
                                <ColunaCfop titulo="Saída" icon="trending-up" cor="text-info" linhas={grupoB} selecionados={selecionados} onToggle={toggle} onToggleTodos={toggleTodos} colunas={colunas} selecionavel={selecionavel} />
                            </>
                        )}
                    </div>
                )
            )}
        </div>
    );
}
