"use client";
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { formatarValorFinanceiro, formatarMoeda, moedaParaNumero, formatarPercentual, digitosParaFracao, CustomSelect, Switch } from '@/lib/utils';
import { calcularPrecificacao, calcularIcmsVenda, ESTADOS_ICMS, UF_ORIGEM_PADRAO, estadoIcms, CENARIOS_ICMS_COMPRA, cenarioIcmsCompra } from '@/lib/precificacao';

const fracaoParaDigitos = (fracao) => Math.round(fracao * 10000).toString();

// h-full + o conteúdo em flex-col garante que os 3 quadros de resultado
// fiquem com a mesma altura (o grid pai usa items-stretch) — o <Spacer />
// abre espaço acima do resultado final pra ele ficar sempre encostado
// embaixo, alinhado entre os 3 quadros mesmo quando um tem menos linhas.
function Painel({ titulo, icon, cor, children }) {
    return (
        <div className="h-full bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 flex items-center gap-2 border-b border-dashed border-gray-200 dark:border-darkBorder">
                <span className={`p-1.5 rounded-md ${cor}`}><Icon name={icon} className="w-4 h-4" /></span>
                <h3 className="text-[12px] font-bold text-gray-800 dark:text-white uppercase tracking-wide">{titulo}</h3>
            </div>
            <div className="p-5 flex-1 flex flex-col gap-2">{children}</div>
        </div>
    );
}

function Spacer() {
    return <div className="flex-1" />;
}

function CampoMoeda({ label, digitos, onChange }) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-darkElevated rounded-lg px-3 py-2.5 border border-gray-200 dark:border-darkBorder focus-within:border-brand">
                <span className="text-[13px] font-bold text-gray-400">R$</span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={formatarMoeda(digitos)}
                    onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
                    placeholder="0,00"
                    className="w-full text-[13px] font-semibold text-gray-800 dark:text-white bg-transparent outline-none"
                />
            </div>
        </label>
    );
}

function CampoPercentual({ label, digitos, onChange }) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-darkElevated rounded-lg px-3 py-2.5 border border-gray-200 dark:border-darkBorder focus-within:border-brand">
                <input
                    type="text"
                    inputMode="numeric"
                    value={formatarPercentual(digitos)}
                    onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
                    placeholder="0,00"
                    className="w-full text-[13px] font-semibold text-gray-800 dark:text-white bg-transparent outline-none"
                />
                <span className="text-[13px] font-bold text-gray-400">%</span>
            </div>
        </label>
    );
}

function LinhaResultado({ label, valor, negrito = false }) {
    return (
        <div className="flex items-center justify-between px-1">
            <span className={`text-[12px] ${negrito ? 'font-bold text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
            <span className={`text-[13px] ${negrito ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-gray-300'}`}>R$ {formatarValorFinanceiro(valor)}</span>
        </div>
    );
}

function LinhaPercentual({ label, valor }) {
    return (
        <div className="flex items-center justify-between px-1">
            <span className="text-[12px] text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{(valor * 100).toFixed(2).replace('.', ',')}%</span>
        </div>
    );
}

function Divisor() {
    return <div className="border-t border-gray-100 dark:border-darkBorder my-1" />;
}

function TileResultadoFinal({ label, valor, margem }) {
    const negativo = valor < 0;
    return (
        <div className={`rounded-lg p-4 flex items-center justify-between gap-3 ${negativo ? 'bg-danger/10' : 'bg-success/10'}`}>
            <div>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">{label}</span>
                <h2 className={`text-xl font-black ${negativo ? 'text-danger' : 'text-success'}`}>R$ {formatarValorFinanceiro(valor)}</h2>
            </div>
            {margem != null && (
                <span className={`text-[12px] font-bold ${negativo ? 'text-danger' : 'text-success'}`}>{(margem * 100).toFixed(2).replace('.', ',')}%</span>
            )}
        </div>
    );
}

const OPCOES_ESTADO = ESTADOS_ICMS.map(e => ({ value: e.uf, label: `${e.nome} (${e.uf})` }));
const OPCOES_CENARIO_COMPRA = CENARIOS_ICMS_COMPRA.map(c => ({ value: c.key, label: c.label }));

export default function PrecificacaoTab() {
    const { empresaAtual } = useAppContext();

    const [precoVendaDigitos, setPrecoVendaDigitos] = useState('50000');
    const [precoCompraDigitos, setPrecoCompraDigitos] = useState('25000');
    const [origemUf, setOrigemUf] = useState(UF_ORIGEM_PADRAO);
    const [destinoUf, setDestinoUf] = useState(UF_ORIGEM_PADRAO);
    const [aliquotaInternaDestinoDigitos, setAliquotaInternaDestinoDigitos] = useState(fracaoParaDigitos(estadoIcms(UF_ORIGEM_PADRAO).aliquotaInterna));
    const [produtoImportadoVenda, setProdutoImportadoVenda] = useState(false);
    const [cenarioCompraKey, setCenarioCompraKey] = useState('nacional');
    const [aliquotaIcmsCompraDigitos, setAliquotaIcmsCompraDigitos] = useState(fracaoParaDigitos(cenarioIcmsCompra('nacional').aliquota));
    const [pagaDifal, setPagaDifal] = useState(true);
    const [taxaComissaoDigitos, setTaxaComissaoDigitos] = useState('1150');
    const [rebateDigitos, setRebateDigitos] = useState('');
    const [taxaPedidoDigitos, setTaxaPedidoDigitos] = useState('625');
    const [freteDigitos, setFreteDigitos] = useState('');
    const [adsDigitos, setAdsDigitos] = useState('');
    const [aliquotaCreditoIcmsFreteDigitos, setAliquotaCreditoIcmsFreteDigitos] = useState('1000');
    const [aliquotaDespesaOperacaoDigitos, setAliquotaDespesaOperacaoDigitos] = useState('50');
    const [aliquotaIrpjDigitos, setAliquotaIrpjDigitos] = useState('2500');
    const [aliquotaCsllDigitos, setAliquotaCsllDigitos] = useState('900');
    const [aliquotaPisCofinsDigitos, setAliquotaPisCofinsDigitos] = useState('925');

    if (!empresaAtual) {
        return <div className="p-6 text-center text-[13px] text-gray-500">Nenhuma empresa importada ainda.</div>;
    }

    const onChangeDestinoUf = (uf) => {
        setDestinoUf(uf);
        setAliquotaInternaDestinoDigitos(fracaoParaDigitos(estadoIcms(uf).aliquotaInterna));
    };
    const onChangeCenarioCompra = (key) => {
        setCenarioCompraKey(key);
        setAliquotaIcmsCompraDigitos(fracaoParaDigitos(cenarioIcmsCompra(key).aliquota));
    };

    const { aliquota: aliquotaIcmsVenda, difal: aliquotaIcmsDifalVenda } = calcularIcmsVenda({
        origemUf,
        destinoUf,
        produtoImportado: produtoImportadoVenda,
        aliquotaInternaDestino: digitosParaFracao(aliquotaInternaDestinoDigitos),
    });

    const { contabil, impostos, financeiro } = calcularPrecificacao({
        precoVenda: moedaParaNumero(precoVendaDigitos),
        precoCompra: moedaParaNumero(precoCompraDigitos),
        aliquotaIcmsVenda,
        aliquotaIcmsDifalVenda,
        aliquotaIcmsCompra: digitosParaFracao(aliquotaIcmsCompraDigitos),
        pagaDifal,
        taxaComissao: digitosParaFracao(taxaComissaoDigitos),
        rebate: moedaParaNumero(rebateDigitos),
        taxaPedido: moedaParaNumero(taxaPedidoDigitos),
        frete: moedaParaNumero(freteDigitos),
        ads: moedaParaNumero(adsDigitos),
        aliquotaCreditoIcmsFrete: digitosParaFracao(aliquotaCreditoIcmsFreteDigitos),
        aliquotaDespesaOperacao: digitosParaFracao(aliquotaDespesaOperacaoDigitos),
        aliquotaIrpj: digitosParaFracao(aliquotaIrpjDigitos),
        aliquotaCsll: digitosParaFracao(aliquotaCsllDigitos),
        aliquotaPisCofins: digitosParaFracao(aliquotaPisCofinsDigitos),
    });

    return (
        <div className="p-6 max-w-[1400px] flex flex-col gap-6">
            <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Precificação — Lucro Real</h2>
                <p className="text-[12px] text-gray-500">{empresaAtual.nome_fantasia || empresaAtual.razao_social} · simulador de repasse de tributos por produto</p>
            </div>

            {/* Não existe na planilha original — é o único dado que não pertence a
                nenhuma das 3 colunas, então fica fora delas, servindo às 3. */}
            <label className="flex flex-col gap-1 max-w-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Empresa — Estado de Origem</span>
                <CustomSelect
                    value={origemUf}
                    onChange={setOrigemUf}
                    options={OPCOES_ESTADO}
                    pesquisavel
                    className="bg-gray-50 dark:bg-darkElevated rounded-lg border border-gray-200 dark:border-darkBorder text-[13px] font-semibold text-gray-800 dark:text-white cursor-pointer"
                />
            </label>
            <p className="text-[11px] text-gray-400 px-1 -mt-4">Onde a empresa está sediada — define quando a venda é dentro do estado e qual alíquota interestadual (7% ou 12%) se aplica.</p>

            {/* A Apuração Contábil da planilha original virava uma coluna só,
                enorme — quebrada aqui em 3 tabelas lado a lado (Venda / Compra /
                Despesas de Vendas), cada uma com seus campos de preenchimento
                junto dos resultados que eles alimentam. O restante da Apuração
                Contábil (Lucro Líquido Operacional em diante) desce pra linha de
                baixo, ao lado de Impostos e Financeira. */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Painel titulo="Venda" icon="trending-up" cor="bg-info/10 text-info">
                    <CampoMoeda label="Preço de Venda" digitos={precoVendaDigitos} onChange={setPrecoVendaDigitos} />

                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Venda — Estado de Destino</span>
                        <CustomSelect
                            value={destinoUf}
                            onChange={onChangeDestinoUf}
                            options={OPCOES_ESTADO}
                            pesquisavel
                            className="bg-gray-50 dark:bg-darkElevated rounded-lg border border-gray-200 dark:border-darkBorder text-[13px] font-semibold text-gray-800 dark:text-white cursor-pointer"
                        />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <CampoPercentual label="Alíquota Interna do Destino" digitos={aliquotaInternaDestinoDigitos} onChange={setAliquotaInternaDestinoDigitos} />
                        {destinoUf !== origemUf && (
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Produto Importado?</span>
                                <div className="flex items-center h-[42px]">
                                    <Switch checked={produtoImportadoVenda} onChange={setProdutoImportadoVenda} color="success" />
                                </div>
                            </div>
                        )}
                    </div>
                    <LinhaResultado label="ICMS na Venda" valor={contabil.icmsVenda} />
                    <LinhaResultado label="ICMS DIFAL na Venda" valor={contabil.icmsDifalVenda} />

                    <CampoPercentual label="PIS/COFINS" digitos={aliquotaPisCofinsDigitos} onChange={setAliquotaPisCofinsDigitos} />
                    <LinhaResultado label="PIS/COFINS na Venda" valor={contabil.pisCofinsVenda} />
                    <LinhaResultado label="Total de Impostos na Venda" valor={contabil.totalImpostosVenda} negrito />
                    <LinhaResultado label="Receita Líquida de Venda" valor={contabil.receitaLiquidaVenda} negrito />
                </Painel>

                <Painel titulo="Compra" icon="trending-down" cor="bg-secondary/10 text-secondary">
                    <CampoMoeda label="Preço de Compra" digitos={precoCompraDigitos} onChange={setPrecoCompraDigitos} />
                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Compra — Origem do Produto</span>
                        <CustomSelect
                            value={cenarioCompraKey}
                            onChange={onChangeCenarioCompra}
                            options={OPCOES_CENARIO_COMPRA}
                            className="bg-gray-50 dark:bg-darkElevated rounded-lg border border-gray-200 dark:border-darkBorder px-3 py-2.5 text-[13px] font-semibold text-gray-800 dark:text-white cursor-pointer"
                        />
                    </label>
                    <CampoPercentual label="Alíquota ICMS na Compra" digitos={aliquotaIcmsCompraDigitos} onChange={setAliquotaIcmsCompraDigitos} />
                    <LinhaResultado label="Crédito de ICMS" valor={contabil.icmsCompraCredito} />
                    <LinhaResultado label="Crédito de PIS/COFINS" valor={contabil.pisCofinsCompraCredito} />
                    <LinhaResultado label="Total de Crédito" valor={contabil.totalCredito} negrito />
                    <LinhaResultado label="CMV" valor={contabil.cmv} negrito />
                    <LinhaResultado label="Lucro Bruto" valor={contabil.lucroBruto} negrito />
                </Painel>

                <Painel titulo="Despesas de Vendas" icon="tag" cor="bg-brand/10 text-brand">
                    <CampoMoeda label="Rebate" digitos={rebateDigitos} onChange={setRebateDigitos} />
                    <CampoPercentual label="Taxa de Comissão" digitos={taxaComissaoDigitos} onChange={setTaxaComissaoDigitos} />
                    <CampoMoeda label="Taxa de Pedido" digitos={taxaPedidoDigitos} onChange={setTaxaPedidoDigitos} />
                    <CampoMoeda label="Frete" digitos={freteDigitos} onChange={setFreteDigitos} />
                    <CampoMoeda label="Ads" digitos={adsDigitos} onChange={setAdsDigitos} />
                    <LinhaResultado label="Despesas de Vendas" valor={contabil.despesasVendas} negrito />
                    <CampoPercentual label="Crédito ICMS Frete" digitos={aliquotaCreditoIcmsFreteDigitos} onChange={setAliquotaCreditoIcmsFreteDigitos} />
                    <LinhaResultado label="Crédito de ICMS Frete" valor={contabil.creditoIcmsFrete} />
                    <LinhaResultado label="Crédito de PIS/COFINS (Despesas)" valor={contabil.creditoPisCofinsDespesas} />
                </Painel>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Painel titulo="Apuração de Impostos" icon="percent" cor="bg-secondary/10 text-secondary">
                    <LinhaResultado label="ICMS Débito (Venda)" valor={impostos.icmsVenda} />
                    <LinhaResultado label="ICMS Crédito (Compra)" valor={impostos.icmsCompraCredito} />
                    <LinhaResultado label="Crédito ICMS Frete" valor={impostos.creditoIcmsFrete} />
                    <LinhaResultado label="Saldo de ICMS" valor={impostos.saldoIcms} negrito />
                    <LinhaResultado label="DIFAL de ICMS" valor={impostos.totalDifal} />
                    <Divisor />
                    <LinhaResultado label="PIS/COFINS Débito (Venda)" valor={impostos.pisCofinsVenda} />
                    <LinhaResultado label="PIS/COFINS Crédito (Compra)" valor={impostos.pisCofinsCompraCredito} />
                    <LinhaResultado label="Crédito PIS/COFINS (Despesas)" valor={impostos.creditoPisCofinsDespesas} />
                    <LinhaResultado label="Saldo de PIS/COFINS" valor={impostos.saldoPisCofins} negrito />
                    <Divisor />
                    <LinhaResultado label="Total de ICMS, PIS e COFINS" valor={impostos.totalIcmsPisCofins} negrito />
                    {impostos.totalDifal > 0 && (
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">Recolher DIFAL nesta venda?</span>
                            <Switch checked={pagaDifal} onChange={setPagaDifal} color="success" />
                        </div>
                    )}
                    <Spacer />
                    <Divisor />
                    <TileResultadoFinal label="Total de Impostos a Pagar" valor={impostos.totalImpostos} />
                </Painel>

                <Painel titulo="Apuração Financeira" icon="dollar-sign" cor="bg-success/10 text-success">
                    <LinhaResultado label="Preço de Venda" valor={financeiro.precoVenda} />
                    <LinhaResultado label="Preço de Compra" valor={financeiro.precoCompra} />
                    <LinhaResultado label="Total de Impostos" valor={financeiro.totalImpostos} />
                    <LinhaResultado label="Despesas de Vendas" valor={financeiro.despesasVendas} />
                    <Divisor />
                    <LinhaResultado label="Margem de Contribuição" valor={financeiro.margemContribuicao} negrito />
                    <LinhaPercentual label="Margem de Contribuição (%)" valor={financeiro.margemContribuicaoPct} />
                    <Divisor />
                    <LinhaResultado label="IRPJ a Pagar" valor={financeiro.valorIrpj} />
                    <LinhaResultado label="CSLL a Pagar" valor={financeiro.valorCsll} />
                    <LinhaResultado label="Total de Impostos a Pagar" valor={financeiro.totalImpostosAPagar} negrito />
                    <LinhaPercentual label="Alíquota Final de Impostos" valor={financeiro.aliquotaFinalImpostos} />
                    <Spacer />
                    <Divisor />
                    <TileResultadoFinal label="Lucro Líquido" valor={financeiro.lucroLiquidoFinanceiro} margem={financeiro.margemLiquidaFinanceira} />
                </Painel>

                <Painel titulo="Apuração Contábil" icon="file-text" cor="bg-info/10 text-info">
                    <LinhaResultado label="Lucro Líquido Operacional" valor={contabil.lucroLiquidoOperacional} negrito />
                    <CampoPercentual label="Despesa da Operação" digitos={aliquotaDespesaOperacaoDigitos} onChange={setAliquotaDespesaOperacaoDigitos} />
                    <LinhaResultado label="Base de Cálculo IRPJ/CSLL" valor={contabil.baseIrpjCsll} />
                    <CampoPercentual label="IRPJ" digitos={aliquotaIrpjDigitos} onChange={setAliquotaIrpjDigitos} />
                    <LinhaResultado label="IRPJ" valor={contabil.valorIrpj} />
                    <CampoPercentual label="CSLL" digitos={aliquotaCsllDigitos} onChange={setAliquotaCsllDigitos} />
                    <LinhaResultado label="CSLL" valor={contabil.valorCsll} />
                    <LinhaResultado label="Total de Impostos sobre o Lucro" valor={contabil.totalImpostosLucro} negrito />
                    <Spacer />
                    <Divisor />
                    <TileResultadoFinal label="Lucro Líquido Contábil" valor={contabil.lucroLiquidoContabil} margem={contabil.margemLiquidaContabil} />
                </Painel>
            </div>
        </div>
    );
}
