"use client";
import { useEffect, useState } from 'react';
import { useAppContext, supabase } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { formatarValorFinanceiro, formatarMesAno } from '@/lib/utils';

export default function DashboardTab() {
    const { empresaAtual, periodoAtualId, periodoAtual, apuracaoIcms, apuracaoPisCofins, setAbaAtual } = useAppContext();
    const [contagens, setContagens] = useState({ emitidas: 0, recebidas: 0, cte: 0 });

    useEffect(() => {
        if (!periodoAtualId) { setContagens({ emitidas: 0, recebidas: 0, cte: 0 }); return; }
        (async () => {
            const [emitidas, recebidas, cte] = await Promise.all([
                supabase.from('notas_fiscais').select('id', { count: 'exact', head: true }).eq('periodo_id', periodoAtualId).eq('direcao', 'emitida'),
                supabase.from('notas_fiscais').select('id', { count: 'exact', head: true }).eq('periodo_id', periodoAtualId).eq('direcao', 'recebida'),
                supabase.from('cte_documentos').select('id', { count: 'exact', head: true }).eq('periodo_id', periodoAtualId),
            ]);
            setContagens({ emitidas: emitidas.count || 0, recebidas: recebidas.count || 0, cte: cte.count || 0 });
        })();
    }, [periodoAtualId]);

    if (!empresaAtual) {
        return <div className="p-6 text-center text-[13px] text-gray-500">Cadastre e selecione uma empresa para começar.</div>;
    }
    if (!periodoAtualId) {
        return (
            <div className="p-6 text-center flex flex-col items-center gap-3">
                <p className="text-[13px] text-gray-500">Nenhum período de apuração ainda para {empresaAtual.nome_fantasia || empresaAtual.razao_social}.</p>
                <button onClick={() => setAbaAtual('upload')} className="text-[12px] font-semibold text-brand hover:underline">Importar planilhas →</button>
            </div>
        );
    }

    const cards = [
        { label: 'Notas Emitidas', valor: contagens.emitidas, icon: 'file-text', cor: 'blue', aba: 'notas_emitidas' },
        { label: 'Notas Recebidas', valor: contagens.recebidas, icon: 'file-text', cor: 'emerald', aba: 'notas_recebidas' },
        { label: 'CT-e', valor: contagens.cte, icon: 'truck', cor: 'orange', aba: 'cte' },
    ];
    const coresCard = {
        blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400',
    };

    return (
        <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{empresaAtual.nome_fantasia || empresaAtual.razao_social}</h2>
                    <p className="text-[12px] text-gray-500">{periodoAtual && formatarMesAno(periodoAtual.ano, periodoAtual.mes)} {periodoAtual?.status === 'fechado' && <span className="text-amber-600 font-semibold">(fechado)</span>}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {cards.map(c => (
                    <button key={c.label} onClick={() => setAbaAtual(c.aba)} className="text-left bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-darkBorder shadow-sm hover:shadow-md transition">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{c.label}</span>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white">{c.valor}</h2>
                            </div>
                            <div className={`p-2 rounded-lg shrink-0 ${coresCard[c.cor]}`}><Icon name={c.icon} className="w-4 h-4" /></div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => setAbaAtual('apuracao_icms')} className="text-left bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-darkBorder shadow-sm hover:shadow-md transition">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Resultado ICMS</span>
                    {apuracaoIcms ? (
                        <h2 className={`text-xl font-black ${apuracaoIcms.resultado > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>R$ {formatarValorFinanceiro(Math.abs(apuracaoIcms.resultado))} {apuracaoIcms.resultado > 0 ? '(a pagar)' : '(credor)'}</h2>
                    ) : <span className="text-[12px] text-gray-400">Calculando...</span>}
                </button>
                <button onClick={() => setAbaAtual('apuracao_pis_cofins')} className="text-left bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-darkBorder shadow-sm hover:shadow-md transition">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Resultado PIS + COFINS</span>
                    {empresaAtual.regime_tributario === 'Simples Nacional' ? (
                        <span className="text-[12px] text-gray-400">Não aplicável (Simples Nacional)</span>
                    ) : apuracaoPisCofins ? (
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">R$ {formatarValorFinanceiro((apuracaoPisCofins.resultado_pis || 0) + (apuracaoPisCofins.resultado_cofins || 0))}</h2>
                    ) : <span className="text-[12px] text-gray-400">Calculando...</span>}
                </button>
            </div>
        </div>
    );
}
