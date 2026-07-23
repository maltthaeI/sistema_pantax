"use client";
import { useEffect, useState } from 'react';
import { useAppContext, supabase } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { formatarValorFinanceiro, formatarMesAnoAbrev } from '@/lib/utils';

export default function DashboardTab() {
    const { empresaAtual, empresaAtualId, competenciaAtual, setAbaAtual } = useAppContext();
    const [resumo, setResumo] = useState({ autorizadas: 0, canceladas: 0, valorTotal: 0 });

    useEffect(() => {
        if (!empresaAtualId || !competenciaAtual) { setResumo({ autorizadas: 0, canceladas: 0, valorTotal: 0 }); return; }
        (async () => {
            const filtroBase = (q) => q.eq('empresa_id', empresaAtualId).eq('ano', competenciaAtual.ano).eq('mes', competenciaAtual.mes).eq('tipo_calculo', competenciaAtual.tipo_calculo);
            const [batch, soma] = await Promise.all([
                filtroBase(supabase.from('import_batches').select('itens_autorizados, itens_cancelados').eq('tipo_arquivo', 'nfe').eq('status', 'concluido')).order('created_at', { ascending: false }).limit(1).maybeSingle(),
                filtroBase(supabase.from('nfe_resumo_cfop').select('valor_total')),
            ]);
            const valorTotal = (soma.data || []).reduce((s, l) => s + (l.valor_total || 0), 0);
            setResumo({ autorizadas: batch.data?.itens_autorizados || 0, canceladas: batch.data?.itens_cancelados || 0, valorTotal });
        })();
    }, [empresaAtualId, competenciaAtual]);

    if (!empresaAtual) {
        return <div className="p-6 text-center text-[13px] text-gray-500">Nenhuma empresa importada ainda.</div>;
    }
    if (!competenciaAtual) {
        return (
            <div className="p-6 text-center flex flex-col items-center gap-3">
                <p className="text-[13px] text-gray-500">Nenhuma planilha importada ainda para {empresaAtual.nome_fantasia || empresaAtual.razao_social}.</p>
                <button onClick={() => setAbaAtual('upload')} className="text-[12px] font-semibold text-brand hover:underline">Importar planilha →</button>
            </div>
        );
    }

    const cards = [
        { label: 'Itens Autorizados', valor: resumo.autorizadas, icon: 'file-text', cor: 'emerald' },
        { label: 'Itens Cancelados', valor: resumo.canceladas, icon: 'x-circle', cor: 'red' },
    ];
    const coresCard = {
        emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        red: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
    };

    return (
        <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{empresaAtual.nome_fantasia || empresaAtual.razao_social}</h2>
                    <p className="text-[12px] text-gray-500">{formatarMesAnoAbrev(competenciaAtual.ano, competenciaAtual.mes)} · {competenciaAtual.tipo_calculo === 'previa' ? 'Prévia' : 'Fechamento'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cards.map(c => (
                    <div key={c.label} className="bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-darkBorder shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{c.label}</span>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white">{c.valor}</h2>
                            </div>
                            <div className={`p-2 rounded-lg shrink-0 ${coresCard[c.cor]}`}><Icon name={c.icon} className="w-4 h-4" /></div>
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={() => setAbaAtual('resumo')} className="text-left bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-darkBorder shadow-sm hover:shadow-md transition">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Valor Total (notas Autorizadas)</span>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">R$ {formatarValorFinanceiro(resumo.valorTotal)}</h2>
                <span className="text-[11px] text-brand font-semibold mt-1 inline-block">Ver resumo por CFOP →</span>
            </button>
        </div>
    );
}
