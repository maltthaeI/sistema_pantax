"use client";
import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { formatarValorFinanceiro, formatarMoeda } from '@/lib/utils';

function LinhaValor({ label, valor, destaque, editavel, onSalvar, disabled }) {
    const [editando, setEditando] = useState(false);
    const [rascunho, setRascunho] = useState('');

    const iniciarEdicao = () => {
        if (!editavel || disabled) return;
        setRascunho(formatarMoeda(((Number(valor) || 0) * 100).toFixed(0).toString()));
        setEditando(true);
    };

    const confirmar = () => {
        const num = parseFloat(String(rascunho).replace(/\./g, '').replace(',', '.')) || 0;
        onSalvar(num);
        setEditando(false);
    };

    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-darkBorder last:border-0">
            <span className="text-[12px] text-gray-600 dark:text-gray-300">{label}{editavel && !disabled && <span className="text-[10px] text-gray-400 ml-1">(editável)</span>}</span>
            {editando ? (
                <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-gray-400">R$</span>
                    <input autoFocus value={rascunho} onChange={e => setRascunho(formatarMoeda(e.target.value))} onBlur={confirmar} onKeyDown={e => e.key === 'Enter' && confirmar()} className="w-28 bg-white dark:bg-darkElevated border border-brand rounded px-2 py-1 text-[12px] text-right outline-none" />
                </div>
            ) : (
                <span onClick={iniciarEdicao} className={`text-[13px] font-semibold ${destaque || 'text-gray-800 dark:text-white'} ${editavel && !disabled ? 'cursor-pointer hover:underline' : ''}`}>R$ {formatarValorFinanceiro(valor)}</span>
            )}
        </div>
    );
}

export default function ApuracaoIcmsTab() {
    const { periodoAtualId, periodoAtual, apuracaoIcms, carregandoApuracao, carregarApuracoes, salvarCamposPeriodo, fecharPeriodo, reabrirPeriodo, isAdmin } = useAppContext();
    const [processando, setProcessando] = useState(false);

    useEffect(() => { if (periodoAtualId) carregarApuracoes(); }, [periodoAtualId]);

    if (!periodoAtualId) {
        return <div className="p-6 text-center text-[13px] text-gray-500">Selecione uma empresa e um período.</div>;
    }
    if (carregandoApuracao || !apuracaoIcms) {
        return <div className="p-6 text-center text-[13px] text-gray-400">Calculando apuração...</div>;
    }

    const fechado = periodoAtual?.status === 'fechado';
    const resultadoPositivo = apuracaoIcms.resultado > 0;

    async function salvarCampo(campo, valor) {
        await salvarCamposPeriodo({ [campo]: valor });
        await carregarApuracoes();
    }

    async function handleFechar() {
        if (!confirm('Fechar este período grava a apuração como definitiva e bloqueia novas importações/edições. Continuar?')) return;
        setProcessando(true);
        await fecharPeriodo();
        setProcessando(false);
    }

    async function handleReabrir() {
        if (!confirm('Reabrir o período permite novas importações e edições. Continuar?')) return;
        setProcessando(true);
        await reabrirPeriodo();
        setProcessando(false);
    }

    return (
        <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
            <div className="rounded-xl border border-gray-200 dark:border-darkBorder bg-white dark:bg-darkCard overflow-hidden">
                <div className="px-5 py-3.5 bg-gray-50 dark:bg-darkElevated border-b border-gray-200 dark:border-darkBorder flex items-center justify-between">
                    <h4 className="font-bold text-[13px] text-gray-800 dark:text-white flex items-center gap-2"><Icon name="dollar-sign" className="w-4 h-4 text-brand" /> Débitos</h4>
                </div>
                <div className="px-5 py-2">
                    <LinhaValor label="Saídas NF-e (ICMS)" valor={apuracaoIcms.debito_saidas} />
                    <LinhaValor label="Estorno de Débito" valor={apuracaoIcms.debito_estorno} editavel disabled={fechado} onSalvar={v => salvarCampo('estorno_debito_manual', v)} />
                    <div className="flex justify-between items-center py-2.5 mt-1 border-t-2 border-gray-200 dark:border-darkBorder">
                        <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200">Total de Débitos</span>
                        <span className="text-[14px] font-black text-gray-900 dark:text-white">R$ {formatarValorFinanceiro(apuracaoIcms.total_debitos)}</span>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-darkBorder bg-white dark:bg-darkCard overflow-hidden">
                <div className="px-5 py-3.5 bg-gray-50 dark:bg-darkElevated border-b border-gray-200 dark:border-darkBorder flex items-center justify-between">
                    <h4 className="font-bold text-[13px] text-gray-800 dark:text-white flex items-center gap-2"><Icon name="dollar-sign" className="w-4 h-4 text-emerald-500" /> Créditos</h4>
                </div>
                <div className="px-5 py-2">
                    <LinhaValor label="Devoluções (NF-e emitida / Entrada)" valor={apuracaoIcms.credito_devolucoes} />
                    <LinhaValor label="NF-e Entradas (recebidas)" valor={apuracaoIcms.credito_nfe_entradas} />
                    <LinhaValor label="CT-e" valor={apuracaoIcms.credito_cte} />
                    <LinhaValor label="Saldo credor acumulado (mês anterior)" valor={apuracaoIcms.credito_acumulado_anterior} editavel disabled={fechado} onSalvar={v => salvarCampo('credito_icms_acumulado_anterior', v)} />
                    <div className="flex justify-between items-center py-2.5 mt-1 border-t-2 border-gray-200 dark:border-darkBorder">
                        <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200">Total de Créditos</span>
                        <span className="text-[14px] font-black text-gray-900 dark:text-white">R$ {formatarValorFinanceiro(apuracaoIcms.total_creditos)}</span>
                    </div>
                </div>
            </div>

            <div className={`rounded-xl border-2 p-5 flex items-center justify-between ${resultadoPositivo ? 'border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5' : 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5'}`}>
                <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{resultadoPositivo ? 'ICMS a Pagar' : 'Saldo Credor (transporta p/ o próximo período)'}</span>
                    <h2 className={`text-2xl font-black mt-1 ${resultadoPositivo ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>R$ {formatarValorFinanceiro(Math.abs(apuracaoIcms.resultado))}</h2>
                </div>
                {isAdmin && (
                    fechado ? (
                        <button type="button" disabled={processando} onClick={handleReabrir} className="flex items-center gap-1.5 bg-white dark:bg-darkCard border border-gray-300 dark:border-darkBorder hover:bg-gray-50 dark:hover:bg-darkHover text-gray-700 dark:text-white px-4 py-2 rounded-md text-[12px] font-semibold shadow-sm transition disabled:opacity-50">
                            <Icon name="unlock" className="w-3.5 h-3.5" /> Reabrir Período
                        </button>
                    ) : (
                        <button type="button" disabled={processando} onClick={handleFechar} className="flex items-center gap-1.5 bg-brand hover:bg-brandHover text-white px-4 py-2 rounded-md text-[12px] font-semibold shadow-sm transition disabled:opacity-50">
                            <Icon name="lock" className="w-3.5 h-3.5" /> Fechar Período
                        </button>
                    )
                )}
            </div>
        </div>
    );
}
