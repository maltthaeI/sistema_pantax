"use client";
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { CustomSelect } from '@/lib/utils';

export default function Modals() {
    const {
        modalUsuarioAberto, setModalUsuarioAberto, novoUsuario, setNovoUsuario, salvandoUsuario, salvarUsuario,
    } = useAppContext();

    return (
        <>
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
        </>
    );
}
