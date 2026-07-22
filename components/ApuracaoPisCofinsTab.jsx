"use client";
import { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { formatarValorFinanceiro } from '@/lib/utils';

function BlocoTributo({ nome, debito, credito, resultado, aliquotaDebito, aliquotaCredito }) {
    const aPagar = resultado > 0;
    return (
        <div className="rounded-xl border border-gray-200 dark:border-darkBorder bg-white dark:bg-darkCard overflow-hidden">
            <div className="px-5 py-3.5 bg-gray-50 dark:bg-darkElevated border-b border-gray-200 dark:border-darkBorder">
                <h4 className="font-bold text-[13px] text-gray-800 dark:text-white">{nome}</h4>
            </div>
            <div className="px-5 py-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-darkBorder">
                    <span className="text-[12px] text-gray-600 dark:text-gray-300">Débito ({(aliquotaDebito * 100).toFixed(2).replace('.', ',')}%)</span>
                    <span className="text-[13px] font-semibold text-gray-800 dark:text-white">R$ {formatarValorFinanceiro(debito)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-darkBorder">
                    <span className="text-[12px] text-gray-600 dark:text-gray-300">Crédito ({(aliquotaCredito * 100).toFixed(2).replace('.', ',')}%)</span>
                    <span className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">R$ {formatarValorFinanceiro(credito)}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                    <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200">Resultado</span>
                    <span className={`text-[14px] font-black ${aPagar ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>R$ {formatarValorFinanceiro(Math.abs(resultado))} {aPagar ? '(a pagar)' : '(credor)'}</span>
                </div>
            </div>
        </div>
    );
}

export default function ApuracaoPisCofinsTab() {
    const { periodoAtualId, empresaAtual, apuracaoPisCofins, carregandoApuracao, carregarApuracoes } = useAppContext();

    useEffect(() => { if (periodoAtualId) carregarApuracoes(); }, [periodoAtualId]);

    if (!periodoAtualId) {
        return <div className="p-6 text-center text-[13px] text-gray-500">Selecione uma empresa e um período.</div>;
    }

    if (empresaAtual?.regime_tributario === 'Simples Nacional') {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center">
                <div className="p-6 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5 flex flex-col items-center gap-2">
                    <Icon name="alert-triangle" className="w-6 h-6 text-amber-500" />
                    <p className="text-[13px] text-gray-700 dark:text-gray-300">Empresas no Simples Nacional recolhem PIS/COFINS dentro do DAS unificado — esta apuração em separado não se aplica.</p>
                </div>
            </div>
        );
    }

    if (carregandoApuracao || !apuracaoPisCofins) {
        return <div className="p-6 text-center text-[13px] text-gray-400">Calculando apuração...</div>;
    }

    return (
        <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder px-2.5 py-1 rounded-full">Base Débito: R$ {formatarValorFinanceiro(apuracaoPisCofins.base_debito)}</span>
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder px-2.5 py-1 rounded-full">Base Crédito: R$ {formatarValorFinanceiro(apuracaoPisCofins.base_credito)}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BlocoTributo nome="PIS" debito={apuracaoPisCofins.debito_pis} credito={apuracaoPisCofins.credito_pis} resultado={apuracaoPisCofins.resultado_pis} aliquotaDebito={apuracaoPisCofins.aliquota_pis_debito} aliquotaCredito={apuracaoPisCofins.aliquota_pis_credito} />
                <BlocoTributo nome="COFINS" debito={apuracaoPisCofins.debito_cofins} credito={apuracaoPisCofins.credito_cofins} resultado={apuracaoPisCofins.resultado_cofins} aliquotaDebito={apuracaoPisCofins.aliquota_cofins_debito} aliquotaCredito={apuracaoPisCofins.aliquota_cofins_credito} />
            </div>
            <p className="text-[11px] text-gray-400 text-center">Alíquotas configuradas no cadastro da empresa. Fechar/reabrir o período é feito na aba Apuração ICMS.</p>
        </div>
    );
}
