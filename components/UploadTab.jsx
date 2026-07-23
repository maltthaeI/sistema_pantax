"use client";
import { useRef, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { formatarMesAnoAbrev, CubeGridSpinner } from '@/lib/utils';

const TIPOS_CALCULO = [
    { value: 'previa', label: 'Prévia', descricao: 'Dia 1 ao 20 do mês' },
    { value: 'fechamento', label: 'Fechamento', descricao: 'Dia 1 ao 30/31 do mês' },
];

const CAMPOS_ARQUIVO = [
    { key: 'emitidas', label: 'Emitidas', icon: 'trending-up', cor: 'blue' },
    { key: 'recebidas', label: 'Recebidas', icon: 'trending-down', cor: 'emerald' },
    { key: 'cte', label: 'CT-e', icon: 'truck', cor: 'orange' },
];

const CORES = {
    blue: 'border-blue-200 dark:border-blue-500/30 bg-blue-50/40 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400',
    emerald: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
    orange: 'border-orange-200 dark:border-orange-500/30 bg-orange-50/40 dark:bg-orange-500/5 text-orange-600 dark:text-orange-400',
};

function CampoArquivo({ campo, arquivo, onEscolher, desabilitado }) {
    const inputRef = useRef(null);
    const selecionado = !!arquivo;

    return (
        <div className={`relative rounded-xl border-2 p-5 flex flex-col items-center text-center gap-2.5 transition ${selecionado ? 'border-solid border-emerald-400 dark:border-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-500/10' : `border-dashed ${CORES[campo.cor]}`} ${desabilitado ? 'opacity-60' : ''}`}>
            {selecionado && (
                <span className="absolute -top-2.5 -right-2.5 bg-emerald-500 text-white rounded-full p-1 shadow-sm">
                    <Icon name="check-circle" className="w-4 h-4" />
                </span>
            )}
            <Icon name={selecionado ? 'check-circle' : campo.icon} className={`w-6 h-6 ${selecionado ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
            <h4 className="font-bold text-[13px] text-gray-800 dark:text-white">{campo.label}</h4>
            <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={e => onEscolher(campo.key, e.target.files?.[0] || null)} />
            {selecionado ? (
                <>
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 break-all leading-snug">{arquivo.name}</p>
                    <div className="flex gap-2">
                        <button type="button" disabled={desabilitado} onClick={() => inputRef.current?.click()} className="px-2.5 py-1 text-[10px] font-semibold bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-md shadow-sm hover:shadow transition disabled:opacity-50">
                            Trocar
                        </button>
                        <button type="button" disabled={desabilitado} onClick={() => onEscolher(campo.key, null)} className="px-2.5 py-1 text-[10px] font-semibold text-red-500 bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-md shadow-sm hover:shadow transition disabled:opacity-50">
                            Remover
                        </button>
                    </div>
                </>
            ) : (
                <button
                    type="button"
                    disabled={desabilitado}
                    onClick={() => inputRef.current?.click()}
                    className="px-3 py-1.5 text-[11px] font-semibold bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-md shadow-sm hover:shadow transition disabled:opacity-50 flex items-center gap-1.5 max-w-full"
                >
                    <Icon name="upload" className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Selecionar .xlsx</span>
                </button>
            )}
        </div>
    );
}

export default function UploadTab() {
    const { uploadRelatorioNfe, uploadEmAndamento, importBatches } = useAppContext();
    const [tipoCalculo, setTipoCalculo] = useState('previa');
    const [arquivos, setArquivos] = useState({ emitidas: null, recebidas: null, cte: null });

    const escolherArquivo = (chave, file) => setArquivos(prev => ({ ...prev, [chave]: file }));
    const qtdSelecionados = Object.values(arquivos).filter(Boolean).length;
    const todosSelecionados = qtdSelecionados === 3;

    const enviar = () => {
        if (!todosSelecionados) return;
        uploadRelatorioNfe(arquivos, tipoCalculo);
        setArquivos({ emitidas: null, recebidas: null, cte: null });
    };

    return (
        <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <span className="w-1 h-3.5 bg-brand rounded-full"></span>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Importar relatórios NF-e</h4>
            </div>

            <div className="relative max-w-2xl flex flex-col gap-4">
                {uploadEmAndamento && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/85 dark:bg-darkBg/85 glass rounded-xl">
                        <CubeGridSpinner />
                        <p className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">Processando planilhas...</p>
                    </div>
                )}
                <div className="flex gap-2 max-w-md">
                    {TIPOS_CALCULO.map(t => (
                        <button
                            key={t.value}
                            type="button"
                            disabled={uploadEmAndamento}
                            onClick={() => setTipoCalculo(t.value)}
                            className={`flex-1 text-left px-3 py-2.5 rounded-lg border text-[12px] transition disabled:opacity-50 ${tipoCalculo === t.value ? 'border-brand bg-brand/5 dark:bg-brand/10' : 'border-gray-200 dark:border-darkBorder bg-white dark:bg-darkCard'}`}
                        >
                            <span className="block font-bold text-gray-800 dark:text-white">{t.label}</span>
                            <span className="block text-[10px] text-gray-500 dark:text-gray-400">{t.descricao}</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {CAMPOS_ARQUIVO.map(campo => (
                        <CampoArquivo
                            key={campo.key}
                            campo={campo}
                            arquivo={arquivos[campo.key]}
                            onEscolher={escolherArquivo}
                            desabilitado={uploadEmAndamento}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        disabled={!todosSelecionados || uploadEmAndamento}
                        onClick={enviar}
                        className="self-start px-4 py-2.5 text-[12px] font-semibold bg-brand hover:bg-brandHover text-white rounded-md shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                    >
                        <Icon name="upload" className="w-3.5 h-3.5" /> {uploadEmAndamento ? 'Enviando...' : 'Enviar as 3 planilhas'}
                    </button>
                    <span className={`text-[11px] font-semibold ${todosSelecionados ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                        {qtdSelecionados} de 3 arquivos selecionados
                    </span>
                </div>
                {!todosSelecionados && <p className="text-[11px] text-gray-400">Selecione os 3 arquivos (Emitidas, Recebidas e CT-e) antes de enviar.</p>}
            </div>

            <div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-1 h-3.5 bg-brand rounded-full"></span>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Histórico de importações</h4>
                </div>
                <div className="bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-xl overflow-hidden">
                    <table className="w-full text-[12px]">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-darkElevated text-gray-500 dark:text-gray-400 text-left">
                                <th className="px-4 py-2.5 font-semibold">Arquivos</th>
                                <th className="px-4 py-2.5 font-semibold">Competência</th>
                                <th className="px-4 py-2.5 font-semibold text-right">Linhas</th>
                                <th className="px-4 py-2.5 font-semibold">Status</th>
                                <th className="px-4 py-2.5 font-semibold">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {importBatches.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">Nenhuma importação ainda.</td></tr>
                            ) : importBatches.map(b => (
                                <tr key={b.id} className="border-t border-gray-100 dark:border-darkBorder">
                                    <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-white truncate max-w-[260px]" title={[b.nome_arquivo_emitidas, b.nome_arquivo_recebidas, b.nome_arquivo_cte].filter(Boolean).join(', ')}>
                                        {[b.nome_arquivo_emitidas, b.nome_arquivo_recebidas, b.nome_arquivo_cte].filter(Boolean).join(', ') || '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{b.ano ? `${formatarMesAnoAbrev(b.ano, b.mes)} · ${b.tipo_calculo === 'previa' ? 'Prévia' : 'Fechamento'}` : '—'}</td>
                                    <td className="px-4 py-2.5 text-right text-gray-700 dark:text-gray-300">{b.linhas_processadas}{b.linhas_erro > 0 ? ` (${b.linhas_erro} erro)` : ''}</td>
                                    <td className="px-4 py-2.5">
                                        {b.status === 'concluido' && <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"><Icon name="check-circle" className="w-3.5 h-3.5" /> Concluído</span>}
                                        {b.status === 'erro' && <span className="inline-flex items-center gap-1 text-red-500 font-semibold" title={b.erro_detalhe}><Icon name="x-circle" className="w-3.5 h-3.5" /> Erro</span>}
                                        {b.status === 'processando' && <span className="inline-flex items-center gap-1 text-amber-500 font-semibold"><Icon name="clock" className="w-3.5 h-3.5" /> Processando</span>}
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{new Date(b.created_at).toLocaleString('pt-BR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
