"use client";
import { useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';

const LANCAMENTOS_MANUAIS = [
    { label: 'Nota Fiscal Emitida', icon: 'file-text', cor: 'blue', acao: 'notaEmitida' },
    { label: 'Nota Fiscal Recebida', icon: 'file-text', cor: 'emerald', acao: 'notaRecebida' },
    { label: 'CT-e', icon: 'truck', cor: 'orange', acao: 'cte' },
];

const TIPOS = [
    { key: 'cte', label: 'CT-e', descricao: 'Cte.xlsx — documentos de frete/transporte', icon: 'truck', cor: 'orange' },
    { key: 'emitidas', label: 'NF-e Emitidas', descricao: 'Notas de venda emitidas pela empresa', icon: 'file-text', cor: 'blue' },
    { key: 'recebidas', label: 'NF-e Recebidas', descricao: 'Notas de compra recebidas pela empresa', icon: 'file-text', cor: 'emerald' },
];

const CORES = {
    orange: 'border-orange-200 dark:border-orange-500/30 bg-orange-50/40 dark:bg-orange-500/5 text-orange-600 dark:text-orange-400',
    blue: 'border-blue-200 dark:border-blue-500/30 bg-blue-50/40 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400',
    emerald: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
};

function Dropzone({ tipo }) {
    const { uploadArquivo, uploadEmAndamento, empresaAtualId } = useAppContext();
    const inputRef = useRef(null);
    const ocupado = uploadEmAndamento !== null;
    const estaSubindo = uploadEmAndamento === tipo.key;

    const handleFile = (file) => {
        if (!file) return;
        uploadArquivo(tipo.key, file);
    };

    return (
        <div className={`rounded-xl border-2 border-dashed p-6 flex flex-col items-center text-center gap-3 transition ${CORES[tipo.cor]} ${ocupado ? 'opacity-60' : ''}`}>
            <Icon name={tipo.icon} className="w-7 h-7" />
            <div>
                <h4 className="font-bold text-[13px] text-gray-800 dark:text-white">{tipo.label}</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{tipo.descricao}</p>
            </div>
            <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
            <button
                type="button"
                disabled={ocupado || !empresaAtualId}
                onClick={() => inputRef.current?.click()}
                className="mt-1 px-4 py-2 text-[11px] font-semibold bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-md shadow-sm hover:shadow transition disabled:opacity-50 flex items-center gap-1.5"
            >
                <Icon name="upload" className="w-3.5 h-3.5" /> {estaSubindo ? 'Enviando...' : 'Selecionar arquivo .xlsx'}
            </button>
        </div>
    );
}

export default function UploadTab() {
    const { empresaAtualId, empresaAtual, importBatches, abrirNovaNotaFiscalManual, abrirNovoCteManual } = useAppContext();

    const acionarLancamentoManual = (acao) => {
        if (acao === 'notaEmitida') abrirNovaNotaFiscalManual('emitida');
        if (acao === 'notaRecebida') abrirNovaNotaFiscalManual('recebida');
        if (acao === 'cte') abrirNovoCteManual();
    };

    return (
        <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
            {!empresaAtualId ? (
                <div className="p-6 text-center text-[13px] text-gray-500">Cadastre e selecione uma empresa para importar planilhas.</div>
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <span className="w-1 h-3.5 bg-brand rounded-full"></span>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Importar planilhas — {empresaAtual?.nome_fantasia || empresaAtual?.razao_social}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {TIPOS.map(tipo => <Dropzone key={tipo.key} tipo={tipo} />)}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-darkBorder"></div>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ou lance manualmente</span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-darkBorder"></div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {LANCAMENTOS_MANUAIS.map(item => (
                            <button key={item.acao} type="button" onClick={() => acionarLancamentoManual(item.acao)} className="flex items-center gap-2 bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder hover:border-brand dark:hover:border-brand px-4 py-2.5 rounded-md text-[12px] font-semibold text-gray-700 dark:text-white shadow-sm transition">
                                <Icon name="plus" className="w-3.5 h-3.5 text-brand" /> {item.label}
                            </button>
                        ))}
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
                                        <th className="px-4 py-2.5 font-semibold">Arquivo</th>
                                        <th className="px-4 py-2.5 font-semibold">Tipo</th>
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
                                            <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-white truncate max-w-[220px]">{b.nome_arquivo}</td>
                                            <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 capitalize">{b.tipo_arquivo}</td>
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
                </>
            )}
        </div>
    );
}
