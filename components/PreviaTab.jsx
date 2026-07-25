"use client";
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { formatarValorFinanceiro, formatarMoeda, moedaParaNumero } from '@/lib/utils';

function Painel({ titulo, icon, cor, children }) {
    return (
        <div className="bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 flex items-center gap-2 border-b border-gray-100 dark:border-darkBorder">
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
            <span className={`text-[10px] font-bold uppercase tracking-wider ${cor}`}>{titulo}</span>
            <div className="grid grid-cols-2 gap-3">{children}</div>
        </div>
    );
}

function Tile({ label, valor }) {
    return (
        <div className="bg-gray-50 dark:bg-darkElevated rounded-lg p-3.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">{label}</span>
            <h4 className="text-[15px] font-bold text-gray-800 dark:text-white">R$ {formatarValorFinanceiro(valor)}</h4>
        </div>
    );
}

// Igual ao Tile, mas com um input mascarado em vez do valor — pros ajustes
// manuais (Estorno de Débito / Acumulado) que recalculam o resultado na hora.
function TileEditavel({ label, digitos, onChange }) {
    return (
        <div className="bg-gray-50 dark:bg-darkElevated rounded-lg p-3.5 border border-dashed border-gray-300 dark:border-darkBorder">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                <Icon name="edit-3" className="w-3 h-3" /> {label}
            </span>
            <div className="flex items-center gap-1">
                <span className="text-[15px] font-bold text-gray-400">R$</span>
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

function TileTotal({ label, valor }) {
    return (
        <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
            <span className="text-[15px] font-black text-gray-900 dark:text-white">R$ {formatarValorFinanceiro(valor)}</span>
        </div>
    );
}

function TileResultado({ resultado, aPagar, tamanho = 'text-2xl' }) {
    return (
        <div className={`rounded-lg p-4 flex items-center justify-between gap-3 ${aPagar ? 'bg-danger/10' : 'bg-success/10'}`}>
            <div>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">Resultado</span>
                <h2 className={`${tamanho} font-black ${aPagar ? 'text-danger' : 'text-success'}`}>
                    R$ {formatarValorFinanceiro(Math.abs(resultado))}
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

    return (
        <Painel titulo="ICMS" icon="dollar-sign" cor="bg-brand/10 text-brand">
            <Subsecao titulo="Débito" cor="text-danger">
                <Tile label="Saídas NF-e" valor={saidasNfe} />
                <TileEditavel label="Estorno de Débito" digitos={estornoDebitoIcms} onChange={setEstornoDebitoIcms} />
            </Subsecao>
            <TileTotal label="Total Débito" valor={totalDebito} />

            <div className="border-t border-gray-100 dark:border-darkBorder" />

            <Subsecao titulo="Crédito" cor="text-success">
                <Tile label="Devoluções" valor={devolucoes} />
                <Tile label="NF-e Entrada" valor={nfeEntrada} />
                <Tile label="CT-e" valor={cte} />
                <TileEditavel label="Acumulado" digitos={acumuladoCreditoIcms} onChange={setAcumuladoCreditoIcms} />
            </Subsecao>
            <TileTotal label="Total Crédito" valor={totalCredito} />

            <TileResultado resultado={resultado} aPagar={resultado < 0} />
        </Painel>
    );
}

function BlocoPisCofinsItem({ titulo, aliquota, debito, credito, resultado }) {
    return (
        <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{titulo} <span className="font-normal normal-case text-gray-400">(alíquota {aliquota}%)</span></span>
            <div className="grid grid-cols-2 gap-3">
                <Tile label="Débito" valor={debito} />
                <Tile label="Crédito" valor={credito} />
            </div>
            <TileResultado resultado={resultado} aPagar={resultado > 0} tamanho="text-lg" />
        </div>
    );
}

function BlocoPisCofins() {
    const { apuracaoPisCofins } = useAppContext();
    const { baseDebito, baseCredito, debitoPis, creditoPis, resultadoPis, debitoCofins, creditoCofins, resultadoCofins } = apuracaoPisCofins;

    return (
        <Painel titulo="PIS/COFINS" icon="percent" cor="bg-secondary/10 text-secondary">
            <div className="grid grid-cols-2 gap-3">
                <Tile label="Base de Débito (saída − ICMS)" valor={baseDebito} />
                <Tile label="Base de Crédito (compras − impostos)" valor={baseCredito} />
            </div>

            <div className="border-t border-gray-100 dark:border-darkBorder" />
            <BlocoPisCofinsItem titulo="PIS" aliquota="1,65" debito={debitoPis} credito={creditoPis} resultado={resultadoPis} />

            <div className="border-t border-gray-100 dark:border-darkBorder" />
            <BlocoPisCofinsItem titulo="COFINS" aliquota="7,6" debito={debitoCofins} credito={creditoCofins} resultado={resultadoCofins} />
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
