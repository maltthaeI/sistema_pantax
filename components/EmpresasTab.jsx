"use client";
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { formatarCnpjCpf } from '@/lib/utils';

export default function EmpresasTab() {
    const { empresas, abrirNovaEmpresa, abrirEdicaoEmpresa } = useAppContext();

    return (
        <div className="p-6 max-w-4xl mx-auto flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-brand rounded-full"></span>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Empresas Cadastradas</h4>
                </div>
                <button type="button" onClick={abrirNovaEmpresa} className="flex items-center gap-1.5 bg-brand hover:bg-brandHover text-white px-3 py-2 rounded-md text-[12px] font-semibold shadow-sm transition">
                    <Icon name="plus" className="w-3.5 h-3.5" /> Nova Empresa
                </button>
            </div>

            <div className="bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-xl overflow-hidden">
                <table className="w-full text-[12px]">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-darkElevated text-gray-500 dark:text-gray-400 text-left">
                            <th className="px-4 py-2.5 font-semibold">Razão Social</th>
                            <th className="px-4 py-2.5 font-semibold">CNPJ</th>
                            <th className="px-4 py-2.5 font-semibold">Regime</th>
                            <th className="px-4 py-2.5 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {empresas.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">Nenhuma empresa cadastrada.</td></tr>
                        ) : empresas.map(e => (
                            <tr key={e.id} onClick={() => abrirEdicaoEmpresa(e)} className="border-t border-gray-100 dark:border-darkBorder hover:bg-gray-50 dark:hover:bg-darkHover cursor-pointer transition">
                                <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-white">
                                    {e.razao_social}
                                    {e.nome_fantasia && <span className="block text-[10px] text-gray-400">{e.nome_fantasia}</span>}
                                </td>
                                <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{formatarCnpjCpf(e.cnpj)}</td>
                                <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{e.regime_tributario}</td>
                                <td className="px-4 py-2.5">
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${e.ativo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-darkElevated dark:text-gray-400'}`}>{e.ativo ? 'Ativa' : 'Inativa'}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
