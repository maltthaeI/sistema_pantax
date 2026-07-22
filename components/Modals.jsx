"use client";
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { CustomSelect, Switch, formatarCnpjCpf, formatarMoeda, formatarPercentual, percentualParaFracao, fracaoParaPercentual } from '@/lib/utils';

export default function Modals() {
    const {
        modalEmpresaAberto, setModalEmpresaAberto, novaEmpresa, setNovaEmpresa, salvandoEmpresa, salvarEmpresa, REGIMES_TRIBUTARIOS,
        modalUsuarioAberto, setModalUsuarioAberto, novoUsuario, setNovoUsuario, salvandoUsuario, salvarUsuario,
        modalNotaFiscalManualAberto, setModalNotaFiscalManualAberto, novaNotaFiscalManual, setNovaNotaFiscalManual, salvandoNotaFiscalManual, salvarNotaFiscalManual,
        modalCteManualAberto, setModalCteManualAberto, novoCteManual, setNovoCteManual, salvandoCteManual, salvarCteManual,
    } = useAppContext();

    // Campos de valor nesses formulários manuais usam o mesmo input mascarado do resto do
    // app (dígitos crus -> "1.234,56"), mas o estado guarda o número puro pra bater com o
    // schema numeric — helper local pra não reescrever esse par toda hora.
    const campoValor = (valor, onChange) => ({
        value: valor === '' ? '' : formatarMoeda(((Number(valor) || 0) * 100).toFixed(0).toString()),
        onChange: e => {
            const digitos = e.target.value.replace(/\D/g, '');
            onChange(digitos ? parseInt(digitos, 10) / 100 : '');
        },
    });

    return (
        <>
            {modalEmpresaAberto && (
                <div onClick={() => setModalEmpresaAberto(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/80 glass no-print cursor-pointer animate-modal-backdrop">
                    <div onClick={e => e.stopPropagation()} className="bg-[#EDEFF0] dark:bg-darkBg w-full max-w-lg rounded border border-gray-200 dark:border-darkBorder shadow-2xl flex flex-col max-h-[95vh] cursor-default overflow-hidden animate-modal-in">
                        <div className="px-6 py-5 flex justify-between items-center bg-brand text-white rounded-t">
                            <h3 className="font-semibold text-lg tracking-tight">{novaEmpresa.id ? 'Editar Empresa' : 'Nova Empresa'}</h3>
                            <button type="button" onClick={() => setModalEmpresaAberto(false)} className="text-white/70 hover:text-white transition"><Icon name="x" className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={salvarEmpresa} className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                            <div>
                                <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Razão Social</label>
                                <input required value={novaEmpresa.razao_social} onChange={e => setNovaEmpresa({ ...novaEmpresa, razao_social: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Nome Fantasia</label>
                                    <input value={novaEmpresa.nome_fantasia || ''} onChange={e => setNovaEmpresa({ ...novaEmpresa, nome_fantasia: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">CNPJ</label>
                                    <input required value={formatarCnpjCpf(novaEmpresa.cnpj)} onChange={e => setNovaEmpresa({ ...novaEmpresa, cnpj: e.target.value.replace(/\D/g, '') })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Regime Tributário</label>
                                <CustomSelect
                                    value={novaEmpresa.regime_tributario}
                                    onChange={val => setNovaEmpresa({ ...novaEmpresa, regime_tributario: val })}
                                    options={REGIMES_TRIBUTARIOS.map(r => ({ value: r, label: r }))}
                                    className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none"
                                />
                            </div>

                            {novaEmpresa.regime_tributario !== 'Simples Nacional' && (
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Alíquotas PIS / COFINS (débito e crédito, em %)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-[11px] text-gray-400">PIS déb.</span>
                                            <input value={fracaoParaPercentual(novaEmpresa.aliquota_pis_debito)} onChange={e => setNovaEmpresa({ ...novaEmpresa, aliquota_pis_debito: percentualParaFracao(formatarPercentual(e.target.value)) })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded pl-[62px] pr-3 py-2 text-[13px] text-right outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="0,00" />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-[11px] text-gray-400">PIS créd.</span>
                                            <input value={fracaoParaPercentual(novaEmpresa.aliquota_pis_credito)} onChange={e => setNovaEmpresa({ ...novaEmpresa, aliquota_pis_credito: percentualParaFracao(formatarPercentual(e.target.value)) })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded pl-[68px] pr-3 py-2 text-[13px] text-right outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="0,00" />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-[11px] text-gray-400">COFINS déb.</span>
                                            <input value={fracaoParaPercentual(novaEmpresa.aliquota_cofins_debito)} onChange={e => setNovaEmpresa({ ...novaEmpresa, aliquota_cofins_debito: percentualParaFracao(formatarPercentual(e.target.value)) })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded pl-[82px] pr-3 py-2 text-[13px] text-right outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="0,00" />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-[11px] text-gray-400">COFINS créd.</span>
                                            <input value={fracaoParaPercentual(novaEmpresa.aliquota_cofins_credito)} onChange={e => setNovaEmpresa({ ...novaEmpresa, aliquota_cofins_credito: percentualParaFracao(formatarPercentual(e.target.value)) })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded pl-[88px] pr-3 py-2 text-[13px] text-right outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="0,00" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2.5">
                                <Switch checked={novaEmpresa.ativo} onChange={val => setNovaEmpresa({ ...novaEmpresa, ativo: val })} />
                                <span className="text-[13px] text-gray-700 dark:text-[#EDEDED]">Empresa ativa</span>
                            </div>

                            <button type="submit" disabled={salvandoEmpresa} className="w-full bg-brand hover:bg-brandHover text-white py-2.5 rounded text-[13px] font-semibold shadow transition mt-2 disabled:opacity-50">
                                {salvandoEmpresa ? 'Salvando...' : 'Salvar Empresa'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {modalUsuarioAberto && (
                <div onClick={() => setModalUsuarioAberto(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/80 glass no-print cursor-pointer animate-modal-backdrop">
                    <div onClick={e => e.stopPropagation()} className="bg-[#EDEFF0] dark:bg-darkBg w-full max-w-sm rounded border border-gray-200 dark:border-darkBorder shadow-2xl flex flex-col max-h-[95vh] cursor-default overflow-hidden animate-modal-in">
                        <div className="px-6 py-5 flex justify-between items-center bg-brand text-white rounded-t">
                            <h3 className="font-semibold text-lg tracking-tight">{novoUsuario.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                            <button type="button" onClick={() => setModalUsuarioAberto(false)} className="text-white/70 hover:text-white transition"><Icon name="x" className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={salvarUsuario} className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                            <div>
                                <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Nome</label>
                                <input required value={novoUsuario.nome} onChange={e => setNovoUsuario({ ...novoUsuario, nome: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" />
                            </div>
                            {!novoUsuario.id && (
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">E-mail</label>
                                    <input required type="email" value={novoUsuario.email} onChange={e => setNovoUsuario({ ...novoUsuario, email: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" />
                                </div>
                            )}
                            <div>
                                <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Nível</label>
                                <CustomSelect
                                    value={novoUsuario.nivel}
                                    onChange={val => setNovoUsuario({ ...novoUsuario, nivel: val })}
                                    options={[{ value: 'Operador', label: 'Operador' }, { value: 'Administrador', label: 'Administrador' }]}
                                    className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">{novoUsuario.id ? 'Nova Senha (opcional)' : 'Senha'}</label>
                                <input required={!novoUsuario.id} type="password" minLength={8} value={novoUsuario.id ? novoUsuario.novaSenha : novoUsuario.senha} onChange={e => setNovoUsuario({ ...novoUsuario, [novoUsuario.id ? 'novaSenha' : 'senha']: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="mínimo 8 caracteres" />
                            </div>
                            <button type="submit" disabled={salvandoUsuario} className="w-full bg-brand hover:bg-brandHover text-white py-2.5 rounded text-[13px] font-semibold shadow transition mt-2 disabled:opacity-50">
                                {salvandoUsuario ? 'Salvando...' : 'Salvar Usuário'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {modalNotaFiscalManualAberto && (
                <div onClick={() => setModalNotaFiscalManualAberto(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/80 glass no-print cursor-pointer animate-modal-backdrop">
                    <div onClick={e => e.stopPropagation()} className="bg-[#EDEFF0] dark:bg-darkBg w-full max-w-2xl rounded border border-gray-200 dark:border-darkBorder shadow-2xl flex flex-col max-h-[95vh] cursor-default overflow-hidden animate-modal-in">
                        <div className="px-6 py-5 flex justify-between items-center bg-brand text-white rounded-t">
                            <h3 className="font-semibold text-lg tracking-tight">Lançar Nota Fiscal Manualmente</h3>
                            <button type="button" onClick={() => setModalNotaFiscalManualAberto(false)} className="text-white/70 hover:text-white transition"><Icon name="x" className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={salvarNotaFiscalManual} className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Direção</label>
                                    <CustomSelect
                                        value={novaNotaFiscalManual.direcao}
                                        onChange={val => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, direcao: val })}
                                        options={[{ value: 'emitida', label: 'Emitida (venda)' }, { value: 'recebida', label: 'Recebida (compra)' }]}
                                        className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Tipo de Operação</label>
                                    <CustomSelect
                                        value={novaNotaFiscalManual.tipo_operacao}
                                        onChange={val => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, tipo_operacao: val })}
                                        options={[{ value: 'Saida', label: 'Saída' }, { value: 'Entrada', label: 'Entrada (devolução)' }]}
                                        className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Data de Emissão</label>
                                    <input required type="date" value={novaNotaFiscalManual.data_emissao} onChange={e => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, data_emissao: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Número</label>
                                    <input value={novaNotaFiscalManual.numero_nota} onChange={e => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, numero_nota: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Série</label>
                                    <input value={novaNotaFiscalManual.serie} onChange={e => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, serie: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Chave de Acesso (opcional)</label>
                                <input value={novaNotaFiscalManual.chave_acesso} onChange={e => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, chave_acesso: e.target.value.replace(/\D/g, '') })} maxLength={44} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED] font-mono" placeholder="44 dígitos, se tiver" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Emitente</label>
                                    <input value={novaNotaFiscalManual.emitente_nome} onChange={e => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, emitente_nome: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED] mb-2" placeholder="Nome" />
                                    <input value={formatarCnpjCpf(novaNotaFiscalManual.emitente_cnpj)} onChange={e => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, emitente_cnpj: e.target.value.replace(/\D/g, '') })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="CNPJ/CPF" />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Destinatário</label>
                                    <input value={novaNotaFiscalManual.destinatario_nome} onChange={e => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, destinatario_nome: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED] mb-2" placeholder="Nome" />
                                    <input value={formatarCnpjCpf(novaNotaFiscalManual.destinatario_cnpj)} onChange={e => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, destinatario_cnpj: e.target.value.replace(/\D/g, '') })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="CNPJ/CPF" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Valor Contábil</label>
                                    <span className="absolute left-3 top-[38px] text-[12px] text-gray-400">R$</span>
                                    <input required {...campoValor(novaNotaFiscalManual.valor_contabil, v => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, valor_contabil: v }))} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded pl-8 pr-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="0,00" />
                                </div>
                                <div className="relative">
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Valor do ICMS</label>
                                    <span className="absolute left-3 top-[38px] text-[12px] text-gray-400">R$</span>
                                    <input {...campoValor(novaNotaFiscalManual.valor_icms, v => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, valor_icms: v }))} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded pl-8 pr-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="0,00" />
                                </div>
                            </div>
                            {novaNotaFiscalManual.direcao === 'recebida' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Valor do ICMS-ST</label>
                                        <span className="absolute left-3 top-[38px] text-[12px] text-gray-400">R$</span>
                                        <input {...campoValor(novaNotaFiscalManual.valor_st, v => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, valor_st: v }))} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded pl-8 pr-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="0,00" />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Valor do IPI</label>
                                        <span className="absolute left-3 top-[38px] text-[12px] text-gray-400">R$</span>
                                        <input {...campoValor(novaNotaFiscalManual.valor_ipi, v => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, valor_ipi: v }))} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded pl-8 pr-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="0,00" />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Descrição / Observação</label>
                                <textarea rows={2} value={novaNotaFiscalManual.descricao} onChange={e => setNovaNotaFiscalManual({ ...novaNotaFiscalManual, descricao: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" />
                            </div>
                            <button type="submit" disabled={salvandoNotaFiscalManual} className="w-full bg-brand hover:bg-brandHover text-white py-2.5 rounded text-[13px] font-semibold shadow transition mt-2 disabled:opacity-50">
                                {salvandoNotaFiscalManual ? 'Salvando...' : 'Salvar Nota Fiscal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {modalCteManualAberto && (
                <div onClick={() => setModalCteManualAberto(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/80 glass no-print cursor-pointer animate-modal-backdrop">
                    <div onClick={e => e.stopPropagation()} className="bg-[#EDEFF0] dark:bg-darkBg w-full max-w-lg rounded border border-gray-200 dark:border-darkBorder shadow-2xl flex flex-col max-h-[95vh] cursor-default overflow-hidden animate-modal-in">
                        <div className="px-6 py-5 flex justify-between items-center bg-brand text-white rounded-t">
                            <h3 className="font-semibold text-lg tracking-tight">Lançar CT-e Manualmente</h3>
                            <button type="button" onClick={() => setModalCteManualAberto(false)} className="text-white/70 hover:text-white transition"><Icon name="x" className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={salvarCteManual} className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Data de Emissão</label>
                                    <input required type="date" value={novoCteManual.data_emissao} onChange={e => setNovoCteManual({ ...novoCteManual, data_emissao: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Número</label>
                                    <input value={novoCteManual.numero_cte} onChange={e => setNovoCteManual({ ...novoCteManual, numero_cte: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">CFOP</label>
                                    <input value={novoCteManual.cfop} onChange={e => setNovoCteManual({ ...novoCteManual, cfop: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Natureza</label>
                                <input value={novoCteManual.natureza} onChange={e => setNovoCteManual({ ...novoCteManual, natureza: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="Ex: PRESTAÇÕES DE SERVIÇOS DE TRANSPORTE" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Tomador</label>
                                    <input value={novoCteManual.tomador_nome} onChange={e => setNovoCteManual({ ...novoCteManual, tomador_nome: e.target.value })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED] mb-2" placeholder="Nome" />
                                    <input value={formatarCnpjCpf(novoCteManual.tomador_cnpj)} onChange={e => setNovoCteManual({ ...novoCteManual, tomador_cnpj: e.target.value.replace(/\D/g, '') })} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="CNPJ/CPF" />
                                </div>
                                <div className="grid grid-rows-2 gap-2">
                                    <div className="relative">
                                        <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Valor do Frete</label>
                                        <span className="absolute left-3 top-[38px] text-[12px] text-gray-400">R$</span>
                                        <input required {...campoValor(novoCteManual.valor_frete, v => setNovoCteManual({ ...novoCteManual, valor_frete: v }))} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded pl-8 pr-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="0,00" />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[13px] font-medium mb-1.5 text-gray-700 dark:text-[#EDEDED]">Valor do ICMS</label>
                                        <span className="absolute left-3 top-[38px] text-[12px] text-gray-400">R$</span>
                                        <input {...campoValor(novoCteManual.valor_icms, v => setNovoCteManual({ ...novoCteManual, valor_icms: v }))} className="w-full bg-white dark:bg-darkElevated border border-gray-300 dark:border-darkBorder rounded pl-8 pr-3 py-2 text-[13px] outline-none focus:border-brand transition dark:text-[#EDEDED]" placeholder="0,00" />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" disabled={salvandoCteManual} className="w-full bg-brand hover:bg-brandHover text-white py-2.5 rounded text-[13px] font-semibold shadow transition mt-2 disabled:opacity-50">
                                {salvandoCteManual ? 'Salvando...' : 'Salvar CT-e'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
