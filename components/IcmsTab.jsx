"use client";
import { useAppContext } from '@/context/AppContext';
import { formatarValorFinanceiro } from '@/lib/utils';

export default function IcmsTab() {
    const { apuracaoIcms, setResumoSubAba } = useAppContext();

    if (!apuracaoIcms) {
        return (
            <div className="p-6 text-center flex flex-col items-center gap-3">
                <p className="text-[13px] text-gray-500">Nenhuma apuração gerada ainda.</p>
                <button onClick={() => setResumoSubAba('emitidas')} className="text-[12px] font-semibold text-brand hover:underline">Ir para Emitidas e gerar →</button>
            </div>
        );
    }

    const { debito, credito, resultado } = apuracaoIcms;
    const aPagar = resultado > 0;

    return (
        <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <span className="w-1 h-3.5 bg-brand rounded-full"></span>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Apuração de ICMS</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-darkBorder shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Débito (Emitidas selecionadas)</span>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">R$ {formatarValorFinanceiro(debito)}</h2>
                </div>
                <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-darkBorder shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Crédito (Recebidas + CT-e selecionadas)</span>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">R$ {formatarValorFinanceiro(credito)}</h2>
                </div>
            </div>

            <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-darkBorder shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Resultado (Débito − Crédito)</span>
                <h2 className={`text-2xl font-black ${aPagar ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    R$ {formatarValorFinanceiro(Math.abs(resultado))} {aPagar ? '(a pagar)' : '(credor)'}
                </h2>
            </div>
        </div>
    );
}
