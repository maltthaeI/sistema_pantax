"use client";
import { useRef, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { formatarMesAnoAbrev } from '@/lib/utils';

const TIPOS_CALCULO = [
    { value: 'previa', label: 'Prévia', descricao: 'Dia 1 ao 20 do mês' },
    { value: 'fechamento', label: 'Fechamento', descricao: 'Dia 1 ao 30/31 do mês' },
];

export default function UploadTab() {
    const { uploadRelatorioNfe, uploadEmAndamento, importBatches } = useAppContext();
    const [tipoCalculo, setTipoCalculo] = useState('previa');
    const inputRef = useRef(null);

    const handleFile = (file) => {
        if (!file) return;
        uploadRelatorioNfe(file, tipoCalculo);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <span className="w-1 h-3.5 bg-brand rounded-full"></span>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Importar relatório NF-e</h4>
            </div>

            <div className="max-w-md flex flex-col gap-4">
                <div className="flex gap-2">
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

                <div className="rounded-xl border-2 border-dashed p-6 flex flex-col items-center text-center gap-3 transition border-blue-200 dark:border-blue-500/30 bg-blue-50/40 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400">
                    <Icon name="file-text" className="w-7 h-7" />
                    <div>
                        <h4 className="font-bold text-[13px] text-gray-800 dark:text-white">Relatório NF-e (.xlsx)</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Relatório Detalhado por Produto — notas emitidas e recebidas juntas. A empresa é criada automaticamente a partir do nome do arquivo.</p>
                    </div>
                    <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
                    <button
                        type="button"
                        disabled={uploadEmAndamento}
                        onClick={() => inputRef.current?.click()}
                        className="mt-1 px-4 py-2 text-[11px] font-semibold bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-md shadow-sm hover:shadow transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                        <Icon name="upload" className="w-3.5 h-3.5" /> {uploadEmAndamento ? 'Enviando...' : 'Selecionar arquivo .xlsx'}
                    </button>
                </div>
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
                                    <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-white truncate max-w-[220px]">{b.nome_arquivo}</td>
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
