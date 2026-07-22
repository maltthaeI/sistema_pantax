"use client";
import React, { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { formatarValorFinanceiro, formatarDataExibicao } from '@/lib/utils';

export default function NotasFiscaisTable({ direcao }) {
    const { periodoAtualId, notasFiscais, carregarNotasFiscais, notaFiscalExpandidaId, itensNotaFiscal, carregarItensNotaFiscal } = useAppContext();

    useEffect(() => {
        if (periodoAtualId) carregarNotasFiscais(direcao);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodoAtualId, direcao]);

    const totalContabil = notasFiscais.reduce((acc, n) => acc + (Number(n.valor_contabil) || 0), 0);
    const totalIcms = notasFiscais.reduce((acc, n) => acc + (Number(n.valor_icms) || 0), 0);

    if (!periodoAtualId) {
        return <div className="p-6 text-center text-[13px] text-gray-500">Selecione uma empresa e um período.</div>;
    }

    return (
        <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder px-2.5 py-1 rounded-full">{notasFiscais.length} nota(s)</span>
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder px-2.5 py-1 rounded-full">Valor contábil: R$ {formatarValorFinanceiro(totalContabil)}</span>
                <span className="text-[11px] font-bold text-brand bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder px-2.5 py-1 rounded-full">ICMS: R$ {formatarValorFinanceiro(totalIcms)}</span>
            </div>

            <div className="bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-[12px] min-w-[900px]">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-darkElevated text-gray-500 dark:text-gray-400 text-left">
                            <th className="px-4 py-2.5 font-semibold w-8"></th>
                            <th className="px-4 py-2.5 font-semibold">Emissão</th>
                            <th className="px-4 py-2.5 font-semibold">Nota / Série</th>
                            <th className="px-4 py-2.5 font-semibold">Operação</th>
                            <th className="px-4 py-2.5 font-semibold">{direcao === 'emitida' ? 'Destinatário' : 'Emitente'}</th>
                            <th className="px-4 py-2.5 font-semibold text-right">Valor Contábil</th>
                            <th className="px-4 py-2.5 font-semibold text-right">ICMS</th>
                            <th className="px-4 py-2.5 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {notasFiscais.length === 0 ? (
                            <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 italic">Nenhuma nota neste período.</td></tr>
                        ) : notasFiscais.map(n => (
                            <React.Fragment key={n.id}>
                                <tr onClick={() => carregarItensNotaFiscal(n.id)} className="border-t border-gray-100 dark:border-darkBorder hover:bg-gray-50 dark:hover:bg-darkHover cursor-pointer transition">
                                    <td className="px-4 py-2.5 text-gray-400"><Icon name={notaFiscalExpandidaId === n.id ? 'chevron-down' : 'chevron-right'} className="w-3.5 h-3.5" /></td>
                                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{formatarDataExibicao(n.data_emissao)}</td>
                                    <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-white">{n.numero_nota}{n.serie ? `/${n.serie}` : ''}</td>
                                    <td className="px-4 py-2.5">
                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${n.tipo_operacao === 'Saida' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'}`}>{n.tipo_operacao || '—'}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 truncate max-w-[220px]">{direcao === 'emitida' ? n.destinatario_nome : n.emitente_nome}</td>
                                    <td className="px-4 py-2.5 text-right font-semibold text-gray-800 dark:text-white">R$ {formatarValorFinanceiro(n.valor_contabil)}</td>
                                    <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">R$ {formatarValorFinanceiro(n.valor_icms)}</td>
                                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{n.status}</td>
                                </tr>
                                {notaFiscalExpandidaId === n.id && (
                                    <tr className="bg-gray-50/60 dark:bg-darkElevated/60">
                                        <td colSpan={8} className="px-4 py-3">
                                            {itensNotaFiscal.length === 0 ? (
                                                <p className="text-[11px] text-gray-400 italic">Sem itens.</p>
                                            ) : (
                                                <table className="w-full text-[11px]">
                                                    <thead>
                                                        <tr className="text-gray-500 dark:text-gray-400 text-left">
                                                            <th className="py-1.5 pr-3 font-semibold">Produto</th>
                                                            <th className="py-1.5 pr-3 font-semibold">CFOP</th>
                                                            <th className="py-1.5 pr-3 font-semibold text-right">Qtd</th>
                                                            <th className="py-1.5 pr-3 font-semibold text-right">Valor Total</th>
                                                            <th className="py-1.5 pr-3 font-semibold text-right">ICMS</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {itensNotaFiscal.map(it => (
                                                            <tr key={it.id} className="border-t border-gray-100 dark:border-darkBorder">
                                                                <td className="py-1.5 pr-3 text-gray-700 dark:text-gray-300">{it.descricao}</td>
                                                                <td className="py-1.5 pr-3 text-gray-500">{it.cfop}</td>
                                                                <td className="py-1.5 pr-3 text-right text-gray-500">{it.quantidade}</td>
                                                                <td className="py-1.5 pr-3 text-right font-medium text-gray-800 dark:text-white">R$ {formatarValorFinanceiro(it.valor_total)}</td>
                                                                <td className="py-1.5 pr-3 text-right text-gray-500">R$ {formatarValorFinanceiro(it.valor_icms)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
