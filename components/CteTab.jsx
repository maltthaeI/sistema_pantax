"use client";
import { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { formatarValorFinanceiro, formatarDataExibicao } from '@/lib/utils';

export default function CteTab() {
    const { periodoAtualId, cteDocumentos, carregarCteDocumentos } = useAppContext();

    useEffect(() => {
        if (periodoAtualId) carregarCteDocumentos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodoAtualId]);

    if (!periodoAtualId) {
        return <div className="p-6 text-center text-[13px] text-gray-500">Selecione uma empresa e um período.</div>;
    }

    const totalFrete = cteDocumentos.reduce((acc, c) => acc + (Number(c.valor_frete) || 0), 0);
    const totalIcms = cteDocumentos.reduce((acc, c) => acc + (Number(c.valor_icms) || 0), 0);

    return (
        <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder px-2.5 py-1 rounded-full">{cteDocumentos.length} CT-e</span>
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder px-2.5 py-1 rounded-full">Frete: R$ {formatarValorFinanceiro(totalFrete)}</span>
                <span className="text-[11px] font-bold text-brand bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder px-2.5 py-1 rounded-full">ICMS: R$ {formatarValorFinanceiro(totalIcms)}</span>
            </div>

            <div className="bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-[12px] min-w-[800px]">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-darkElevated text-gray-500 dark:text-gray-400 text-left">
                            <th className="px-4 py-2.5 font-semibold">Emissão</th>
                            <th className="px-4 py-2.5 font-semibold">Nº CT-e</th>
                            <th className="px-4 py-2.5 font-semibold">CFOP</th>
                            <th className="px-4 py-2.5 font-semibold">Tomador</th>
                            <th className="px-4 py-2.5 font-semibold text-right">Valor Frete</th>
                            <th className="px-4 py-2.5 font-semibold text-right">ICMS</th>
                            <th className="px-4 py-2.5 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cteDocumentos.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 italic">Nenhum CT-e neste período.</td></tr>
                        ) : cteDocumentos.map(c => (
                            <tr key={c.id} className="border-t border-gray-100 dark:border-darkBorder">
                                <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{formatarDataExibicao(c.data_emissao)}</td>
                                <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-white">{c.numero_cte}</td>
                                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{c.cfop}</td>
                                <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 truncate max-w-[220px]">{c.tomador_nome}</td>
                                <td className="px-4 py-2.5 text-right font-semibold text-gray-800 dark:text-white">R$ {formatarValorFinanceiro(c.valor_frete)}</td>
                                <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">R$ {formatarValorFinanceiro(c.valor_icms)}</td>
                                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{c.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
