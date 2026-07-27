"use client";
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { formatarValorFinanceiro, formatarMoeda, moedaParaNumero } from '@/lib/utils';

const ALIQUOTA_ICMS = 0.15;

// Cor por tipo de campo (débito/crédito), com as variantes já resolvidas —
// evita derivar "border-danger" a partir de "text-danger" em runtime (o
// Tailwind só gera CSS pras classes que aparecem como string literal no
// código, então essa derivação silenciosamente cai no fallback cinza).
const CORES = {
    debito: { texto: 'text-danger', borda: 'border-danger' },
    credito: { texto: 'text-success', borda: 'border-success' },
};

// Estado de feedback (ícone vira check por 1.5s) compartilhado pelos botões
// de copiar do Tile e do TileResultado.
function useCopiar(texto) {
    const [copiado, setCopiado] = useState(false);
    async function copiar() {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1500);
    }
    return [copiado, copiar];
}

function Painel({ titulo, icon, cor, children }) {
    return (
        <div className="bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 flex items-center gap-2 border-b border-dashed border-gray-200 dark:border-darkBorder">
                <span className={`p-1.5 rounded-md ${cor}`}><Icon name={icon} className="w-4 h-4" /></span>
                <h3 className="text-[12px] font-bold text-gray-800 dark:text-white uppercase tracking-wide">{titulo}</h3>
            </div>
            <div className="p-5 flex flex-col gap-5">{children}</div>
        </div>
    );
}

function Subsecao({ titulo, cor, children }) {
    return (
        <div className="flex flex-col gap-3">
            <span className={`text-[12px] font-bold uppercase tracking-wider ${cor}`}>{titulo}</span>
            <div className="grid grid-cols-2 gap-3">{children}</div>
        </div>
    );
}

function Tile({ label, valor, tipo, copiavel = false }) {
    const cor = CORES[tipo];
    const [copiado, copiar] = useCopiar(`R$ ${formatarValorFinanceiro(valor)}`);

    return (
        <div className="relative bg-gray-50 dark:bg-darkElevated rounded-lg p-3.5">
            {copiavel && (
                <button
                    type="button"
                    onClick={copiar}
                    title="Copiar valor"
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
                >
                    <Icon name={copiado ? 'check' : 'copy'} className="w-3.5 h-3.5" />
                </button>
            )}
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 block mb-1">{label}</span>
            <h4 className="text-[15px] font-bold text-gray-800 dark:text-white">
                <span className={cor?.texto || ''}>R$</span> {formatarValorFinanceiro(valor)}
            </h4>
        </div>
    );
}

// Igual ao Tile, mas com um input mascarado em vez do valor — pros ajustes
// manuais (Estorno de Débito / Acumulado) que recalculam o resultado na hora.
function TileEditavel({ label, digitos, onChange, tipo }) {
    const cor = CORES[tipo];
    return (
        <div className={`bg-gray-50 dark:bg-darkElevated rounded-lg p-3.5 border border-dashed ${cor?.borda || 'border-gray-300 dark:border-darkBorder'}`}>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1 mb-1">
                <Icon name="edit-3" className="w-3 h-3" /> {label}
            </span>
            <div className="flex items-center gap-1">
                <span className={`text-[15px] font-bold ${cor?.texto || 'text-gray-400'}`}>R$</span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={formatarMoeda(digitos)}
                    onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
                    placeholder="0,00"
                    className="w-full text-[15px] font-bold text-gray-800 dark:text-white bg-transparent outline-none"
                />
            </div>
        </div>
    );
}

function TileTotal({ label, valor, tipo }) {
    const cor = CORES[tipo];
    return (
        <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-[15px] font-black text-gray-900 dark:text-white">
                <span className={cor?.texto || ''}>R$</span> {formatarValorFinanceiro(valor)}
            </span>
        </div>
    );
}

function TileResultado({ resultado, aPagar, tamanho = 'text-2xl', copiavel = false }) {
    const valorFormatado = `R$ ${formatarValorFinanceiro(Math.abs(resultado))}`;
    const [copiado, copiar] = useCopiar(valorFormatado);

    return (
        <div className={`relative rounded-lg p-4 flex items-center justify-between gap-3 h-full ${aPagar ? 'bg-danger/10' : 'bg-success/10'}`}>
            {copiavel && (
                <button
                    type="button"
                    onClick={copiar}
                    title="Copiar valor"
                    className={`absolute top-2 right-2 transition ${aPagar ? 'text-danger/70 hover:text-danger' : 'text-success/70 hover:text-success'}`}
                >
                    <Icon name={copiado ? 'check' : 'copy'} className="w-3.5 h-3.5" />
                </button>
            )}
            <div>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">Resultado</span>
                <h2 className={`${tamanho} font-black ${aPagar ? 'text-danger' : 'text-success'}`}>
                    {valorFormatado}
                </h2>
            </div>
            <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${aPagar ? 'text-danger' : 'text-success'}`}>
                <Icon name={aPagar ? 'alert-triangle' : 'check-circle'} className="w-4 h-4" />
                {aPagar ? 'A pagar' : 'Credor'}
            </span>
        </div>
    );
}

function BlocoIcms() {
    const { apuracaoIcms, estornoDebitoIcms, setEstornoDebitoIcms, acumuladoCreditoIcms, setAcumuladoCreditoIcms } = useAppContext();
    const { saidasNfe, devolucoes, nfeEntrada, cte } = apuracaoIcms;

    const estorno = moedaParaNumero(estornoDebitoIcms);
    const acumulado = moedaParaNumero(acumuladoCreditoIcms);
    const totalDebito = saidasNfe + estorno;
    const totalCredito = devolucoes + nfeEntrada + cte + acumulado;
    const resultado = totalCredito - totalDebito;
    const emDebito = resultado < 0;
    const resultadoParaFicarCredor = Math.abs(resultado) / ALIQUOTA_ICMS;

    return (
        <Painel titulo="ICMS" icon="dollar-sign" cor="bg-brand/10 text-brand">
            <Subsecao titulo="Débito" cor="text-danger">
                <Tile label="Saídas NF-e" valor={saidasNfe} tipo="debito" />
                <TileEditavel label="Estorno de Débito" digitos={estornoDebitoIcms} onChange={setEstornoDebitoIcms} tipo="debito" />
            </Subsecao>
            <TileTotal label="Total Débito" valor={totalDebito} tipo="debito" />

            <div className="border-t border-gray-100 dark:border-darkBorder" />

            <Subsecao titulo="Crédito" cor="text-success">
                <Tile label="Devoluções" valor={devolucoes} tipo="credito" />
                <Tile label="NF-e Entrada" valor={nfeEntrada} tipo="credito" />
                <Tile label="CT-e" valor={cte} tipo="credito" />
                <TileEditavel label="Acumulado" digitos={acumuladoCreditoIcms} onChange={setAcumuladoCreditoIcms} tipo="credito" />
            </Subsecao>
            <TileTotal label="Total Crédito" valor={totalCredito} tipo="credito" />

            {emDebito ? (
                <div className="grid grid-cols-3 gap-3 items-stretch">
                    <div className="col-span-2">
                        <TileResultado resultado={resultado} aPagar={emDebito} copiavel />
                    </div>
                    <Tile label="Para ficar credor (÷ 15%)" valor={resultadoParaFicarCredor} tipo="credito" />
                </div>
            ) : (
                <TileResultado resultado={resultado} aPagar={emDebito} copiavel />
            )}
        </Painel>
    );
}

// Só faz sentido mostrar "quanto falta comprar pra ficar credor" quando o PIS
// está a pagar (resultadoPis > 0) — se já é credor, some.
function BlocoCompraParaFicarCredor() {
    const { apuracaoPisCofins } = useAppContext();
    const { compraParaZerar, mediaVenda, faturamento, totalCompraParaFicarCredor } = apuracaoPisCofins;

    return (
        <>
            <div className="border-t border-gray-100 dark:border-darkBorder" />
            <div className="flex flex-col gap-3">
                <span className="text-[12px] font-bold text-success uppercase tracking-wider">Compra para ficar credor</span>
                <div className="grid grid-cols-2 gap-3">
                    <Tile label="Compra para zerar" valor={compraParaZerar} tipo="credito" copiavel />
                    <Tile label="Média de venda" valor={mediaVenda} tipo="credito" copiavel />
                    <Tile label="Faturamento" valor={faturamento} tipo="credito" />
                    <Tile label="Total de compra para ficar credor" valor={totalCompraParaFicarCredor} tipo="credito" copiavel />
                </div>
            </div>
        </>
    );
}

function BlocoPisCofinsResultado({ titulo, aliquota, resultado }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{titulo} <span className="font-normal normal-case text-gray-400">(alíquota {aliquota}%)</span></span>
            <TileResultado resultado={resultado} aPagar={resultado > 0} tamanho="text-lg" />
        </div>
    );
}

function BlocoPisCofins() {
    const { apuracaoPisCofins } = useAppContext();
    const {
        debitoSaida, debitoIcms, baseDebito,
        compraRevenda, icmsStIpiRevenda, frete, icmsCte, devolucaoRevenda, icmsStIpiEntrada, baseCredito,
        debitoPis, creditoPis, resultadoPis, debitoCofins, creditoCofins, resultadoCofins,
    } = apuracaoPisCofins;

    return (
        <Painel titulo="PIS/COFINS" icon="percent" cor="bg-secondary/10 text-secondary">
            <Subsecao titulo="Débito" cor="text-danger">
                <Tile label="Saída" valor={debitoSaida} tipo="debito" />
                <Tile label="ICMS" valor={debitoIcms} tipo="debito" />
            </Subsecao>
            <TileTotal label="Base de Débito" valor={baseDebito} tipo="debito" />
            <div className="grid grid-cols-2 gap-3">
                <Tile label="Débito PIS" valor={debitoPis} tipo="debito" />
                <Tile label="Débito COFINS" valor={debitoCofins} tipo="debito" />
            </div>

            <div className="border-t border-gray-100 dark:border-darkBorder" />

            <Subsecao titulo="Crédito" cor="text-success">
                <Tile label="Compra Revenda" valor={compraRevenda} tipo="credito" />
                <Tile label="ICMS/ST/IPI" valor={icmsStIpiRevenda} tipo="credito" />
                <Tile label="Frete" valor={frete} tipo="credito" />
                <Tile label="ICMS" valor={icmsCte} tipo="credito" />
                <Tile label="Devolução Revenda" valor={devolucaoRevenda} tipo="credito" />
                <Tile label="ICMS/ST/IPI" valor={icmsStIpiEntrada} tipo="credito" />
            </Subsecao>
            <TileTotal label="Base de Crédito" valor={baseCredito} tipo="credito" />
            <div className="grid grid-cols-2 gap-3">
                <Tile label="Crédito PIS" valor={creditoPis} tipo="credito" />
                <Tile label="Crédito COFINS" valor={creditoCofins} tipo="credito" />
            </div>

            <div className="border-t border-gray-100 dark:border-darkBorder" />

            <div className="grid grid-cols-2 gap-3">
                <BlocoPisCofinsResultado titulo="PIS" aliquota="1,65" resultado={resultadoPis} />
                <BlocoPisCofinsResultado titulo="COFINS" aliquota="7,6" resultado={resultadoCofins} />
            </div>

            {resultadoPis > 0 && <BlocoCompraParaFicarCredor />}
        </Painel>
    );
}

export default function PreviaTab() {
    const { apuracaoIcms, apuracaoPisCofins, setResumoSubAba } = useAppContext();

    if (!apuracaoIcms || !apuracaoPisCofins) {
        return (
            <div className="p-6 text-center flex flex-col items-center gap-3">
                <p className="text-[13px] text-gray-500">Nenhuma apuração gerada ainda.</p>
                <button onClick={() => setResumoSubAba('emitidas')} className="text-[12px] font-semibold text-brand hover:underline">Ir para Emitidas e gerar →</button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1400px] flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <span className="w-1 h-3.5 bg-brand rounded-full"></span>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Prévia</h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                <BlocoIcms />
                <BlocoPisCofins />
            </div>
        </div>
    );
}
