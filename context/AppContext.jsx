"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export { supabase };

export const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

const REGIMES_TRIBUTARIOS = ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'];

export const AppProvider = ({ children }) => {
    // ==== SESSÃO / LOGIN ====
    const [usuario, setUsuario] = useState(null);
    const [carregandoSessao, setCarregandoSessao] = useState(true);
    const [loginInput, setLoginInput] = useState('');
    const [senhaInput, setSenhaInput] = useState('');
    const [erroLogin, setErroLogin] = useState('');
    const isAdmin = usuario?.nivel === 'Administrador';

    const [darkMode, setDarkMode] = useState(false);
    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);
    const toggleDarkMode = () => setDarkMode(!darkMode);

    const [abaAtual, setAbaAtual] = useState('dashboard');

    // ==== EMPRESAS ====
    const [empresas, setEmpresas] = useState([]);
    const [empresaAtualId, setEmpresaAtualId] = useState(null);
    const empresaAtual = empresas.find(e => e.id === empresaAtualId) || null;
    const [modalEmpresaAberto, setModalEmpresaAberto] = useState(false);
    const [novaEmpresa, setNovaEmpresa] = useState({ id: null, razao_social: '', nome_fantasia: '', cnpj: '', regime_tributario: 'Lucro Real', aliquota_pis_debito: '', aliquota_pis_credito: '', aliquota_cofins_debito: '', aliquota_cofins_credito: '', ativo: true });
    const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);

    // ==== PERÍODOS DE APURAÇÃO ====
    const [periodos, setPeriodos] = useState([]);
    const [periodoAtualId, setPeriodoAtualId] = useState(null);
    const periodoAtual = periodos.find(p => p.id === periodoAtualId) || null;
    const [salvandoPeriodo, setSalvandoPeriodo] = useState(false);

    // ==== NOTAS FISCAIS / CT-e / IMPORTS ====
    const [notasFiscais, setNotasFiscais] = useState([]);
    const [notaFiscalExpandidaId, setNotaFiscalExpandidaId] = useState(null);
    const [itensNotaFiscal, setItensNotaFiscal] = useState([]);
    const [cteDocumentos, setCteDocumentos] = useState([]);
    const [importBatches, setImportBatches] = useState([]);
    const [uploadEmAndamento, setUploadEmAndamento] = useState(null); // 'cte' | 'emitidas' | 'recebidas' | null

    // ==== LANÇAMENTO MANUAL (alternativa ao upload de planilha) ====
    const hojeISO = () => new Date().toISOString().split('T')[0];
    const notaFiscalManualVazia = (direcao = 'emitida') => ({
        direcao, tipo_operacao: 'Saida', data_emissao: hojeISO(), numero_nota: '', serie: '',
        chave_acesso: '', emitente_nome: '', emitente_cnpj: '', destinatario_nome: '', destinatario_cnpj: '',
        valor_contabil: '', valor_icms: '', valor_st: '', valor_ipi: '', descricao: '',
    });
    const cteManualVazio = () => ({
        data_emissao: hojeISO(), numero_cte: '', cfop: '', natureza: '',
        tomador_nome: '', tomador_cnpj: '', valor_frete: '', valor_icms: '', status: 'Autorizada',
    });

    const [modalNotaFiscalManualAberto, setModalNotaFiscalManualAberto] = useState(false);
    const [novaNotaFiscalManual, setNovaNotaFiscalManual] = useState(notaFiscalManualVazia());
    const [salvandoNotaFiscalManual, setSalvandoNotaFiscalManual] = useState(false);

    const [modalCteManualAberto, setModalCteManualAberto] = useState(false);
    const [novoCteManual, setNovoCteManual] = useState(cteManualVazio());
    const [salvandoCteManual, setSalvandoCteManual] = useState(false);

    // ==== APURAÇÃO ====
    const [apuracaoIcms, setApuracaoIcms] = useState(null);
    const [apuracaoPisCofins, setApuracaoPisCofins] = useState(null);
    const [carregandoApuracao, setCarregandoApuracao] = useState(false);

    // ==== USUÁRIOS (admin) ====
    const [usuariosSistema, setUsuariosSistema] = useState([]);
    const [modalUsuarioAberto, setModalUsuarioAberto] = useState(false);
    const [novoUsuario, setNovoUsuario] = useState({ id: null, nome: '', email: '', nivel: 'Operador', senha: '', novaSenha: '' });
    const [salvandoUsuario, setSalvandoUsuario] = useState(false);

    async function carregarPerfil(userId) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error || !data) return null;
        return data;
    }

    const efetuarLogin = async (e) => {
        e.preventDefault();
        setErroLogin('Entrando...');

        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginInput.trim(),
            password: senhaInput,
        });

        if (error) {
            setErroLogin('E-mail ou senha incorretos.');
            return;
        }

        const perfil = await carregarPerfil(data.user.id);
        if (!perfil) {
            setErroLogin('Login válido, mas sem perfil cadastrado (tabela profiles). Fale com um administrador.');
            await supabase.auth.signOut();
            return;
        }

        setUsuario(perfil);
        setErroLogin('');
        setLoginInput('');
        setSenhaInput('');
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUsuario(null);
        setEmpresaAtualId(null);
        setPeriodoAtualId(null);
    };

    useEffect(() => {
        let ativo = true;
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session && ativo) {
                const perfil = await carregarPerfil(session.user.id);
                if (!ativo) return;
                if (perfil) setUsuario(perfil);
                else {
                    setErroLogin('Login válido, mas sem perfil cadastrado (tabela profiles). Fale com um administrador.');
                    await supabase.auth.signOut();
                }
            }
            if (ativo) setCarregandoSessao(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') setUsuario(null);
        });

        return () => {
            ativo = false;
            listener?.subscription?.unsubscribe();
        };
    }, []);

    async function obterToken() {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    }

    // ==== EMPRESAS ====
    async function carregarEmpresas() {
        const { data, error } = await supabase.from('empresas').select('*').order('razao_social');
        if (!error && data) setEmpresas(data);
    }

    useEffect(() => { if (usuario) carregarEmpresas(); }, [usuario]);

    useEffect(() => {
        if (!empresaAtualId && empresas.length > 0) {
            const primeiraAtiva = empresas.find(e => e.ativo) || empresas[0];
            setEmpresaAtualId(primeiraAtiva.id);
        }
    }, [empresas, empresaAtualId]);

    function abrirNovaEmpresa() {
        setNovaEmpresa({ id: null, razao_social: '', nome_fantasia: '', cnpj: '', regime_tributario: 'Lucro Real', aliquota_pis_debito: '', aliquota_pis_credito: '', aliquota_cofins_debito: '', aliquota_cofins_credito: '', ativo: true });
        setModalEmpresaAberto(true);
    }

    function abrirEdicaoEmpresa(empresa) {
        setNovaEmpresa({ ...empresa });
        setModalEmpresaAberto(true);
    }

    async function salvarEmpresa(e) {
        e.preventDefault();
        setSalvandoEmpresa(true);
        const payload = {
            razao_social: novaEmpresa.razao_social,
            nome_fantasia: novaEmpresa.nome_fantasia || null,
            cnpj: novaEmpresa.cnpj,
            regime_tributario: novaEmpresa.regime_tributario,
            aliquota_pis_debito: Number(novaEmpresa.aliquota_pis_debito) || 0,
            aliquota_pis_credito: Number(novaEmpresa.aliquota_pis_credito) || 0,
            aliquota_cofins_debito: Number(novaEmpresa.aliquota_cofins_debito) || 0,
            aliquota_cofins_credito: Number(novaEmpresa.aliquota_cofins_credito) || 0,
            ativo: !!novaEmpresa.ativo,
        };

        if (novaEmpresa.id) {
            const { error } = await supabase.from('empresas').update(payload).eq('id', novaEmpresa.id);
            if (error) { alert('Erro ao atualizar empresa: ' + error.message); setSalvandoEmpresa(false); return; }
        } else {
            const { error } = await supabase.from('empresas').insert([payload]);
            if (error) { alert('Erro ao criar empresa: ' + error.message); setSalvandoEmpresa(false); return; }
        }

        await carregarEmpresas();
        setSalvandoEmpresa(false);
        setModalEmpresaAberto(false);
    }

    // ==== PERÍODOS ====
    async function carregarPeriodos() {
        if (!empresaAtualId) { setPeriodos([]); return; }
        const { data, error } = await supabase
            .from('periodos_apuracao')
            .select('*')
            .eq('empresa_id', empresaAtualId)
            .order('ano', { ascending: false })
            .order('mes', { ascending: false });
        if (!error && data) setPeriodos(data);
    }

    useEffect(() => {
        setPeriodoAtualId(null);
        if (empresaAtualId) carregarPeriodos();
        else setPeriodos([]);
    }, [empresaAtualId]);

    useEffect(() => {
        if (!periodoAtualId && periodos.length > 0) {
            const aberto = periodos.find(p => p.status === 'aberto');
            setPeriodoAtualId((aberto || periodos[0]).id);
        }
    }, [periodos, periodoAtualId]);

    async function salvarCamposPeriodo(campos) {
        if (!periodoAtualId) return;
        setSalvandoPeriodo(true);
        const { error } = await supabase.from('periodos_apuracao').update(campos).eq('id', periodoAtualId);
        if (error) alert('Erro ao salvar período: ' + error.message);
        else await carregarPeriodos();
        setSalvandoPeriodo(false);
    }

    async function fecharPeriodo() {
        if (!periodoAtualId) return;
        const token = await obterToken();
        const res = await fetch('/api/apuracao/fechar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ periodo_id: periodoAtualId }),
        });
        const json = await res.json();
        if (!res.ok) { alert('Erro ao fechar período: ' + (json.error || res.statusText)); return; }
        await carregarPeriodos();
    }

    async function reabrirPeriodo() {
        if (!periodoAtualId) return;
        const token = await obterToken();
        const res = await fetch('/api/apuracao/reabrir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ periodo_id: periodoAtualId }),
        });
        const json = await res.json();
        if (!res.ok) { alert('Erro ao reabrir período: ' + (json.error || res.statusText)); return; }
        await carregarPeriodos();
    }

    // ==== NOTAS FISCAIS ====
    async function carregarNotasFiscais(direcao) {
        if (!periodoAtualId) { setNotasFiscais([]); return; }
        const { data, error } = await supabase
            .from('notas_fiscais')
            .select('*')
            .eq('periodo_id', periodoAtualId)
            .eq('direcao', direcao)
            .order('data_emissao', { ascending: false });
        if (!error && data) setNotasFiscais(data);
    }

    async function carregarItensNotaFiscal(notaFiscalId) {
        if (notaFiscalExpandidaId === notaFiscalId) { setNotaFiscalExpandidaId(null); setItensNotaFiscal([]); return; }
        const { data, error } = await supabase.from('nota_fiscal_itens').select('*').eq('nota_fiscal_id', notaFiscalId);
        if (!error && data) { setItensNotaFiscal(data); setNotaFiscalExpandidaId(notaFiscalId); }
    }

    // ==== CT-e ====
    async function carregarCteDocumentos() {
        if (!periodoAtualId) { setCteDocumentos([]); return; }
        const { data, error } = await supabase
            .from('cte_documentos')
            .select('*')
            .eq('periodo_id', periodoAtualId)
            .order('data_emissao', { ascending: false });
        if (!error && data) setCteDocumentos(data);
    }

    // ==== LANÇAMENTO MANUAL ====
    // Mesma lógica de find-or-create período do pipeline de import (lib/xlsxParsers/shared.js),
    // só que direto pelo client — RLS já libera insert em periodos_apuracao pra qualquer logado.
    async function resolverPeriodoCliente(dataISO) {
        if (!empresaAtualId || !dataISO) return null;
        const [anoStr, mesStr] = dataISO.split('-');
        const ano = parseInt(anoStr, 10);
        const mes = parseInt(mesStr, 10);

        const { data: existente } = await supabase
            .from('periodos_apuracao').select('id, status')
            .eq('empresa_id', empresaAtualId).eq('ano', ano).eq('mes', mes).maybeSingle();
        if (existente) return existente;

        const { data: criado, error } = await supabase
            .from('periodos_apuracao').insert([{ empresa_id: empresaAtualId, ano, mes }])
            .select('id, status').single();
        if (error) { alert('Erro ao criar período: ' + error.message); return null; }
        return criado;
    }

    function abrirNovaNotaFiscalManual(direcao) {
        setNovaNotaFiscalManual(notaFiscalManualVazia(direcao));
        setModalNotaFiscalManualAberto(true);
    }

    async function salvarNotaFiscalManual(e) {
        e.preventDefault();
        setSalvandoNotaFiscalManual(true);
        const n = novaNotaFiscalManual;

        const periodo = await resolverPeriodoCliente(n.data_emissao);
        if (!periodo) { setSalvandoNotaFiscalManual(false); return; }
        if (periodo.status === 'fechado') {
            alert('O período desta data já está fechado. Reabra o período antes de lançar notas nele.');
            setSalvandoNotaFiscalManual(false);
            return;
        }

        const payload = {
            empresa_id: empresaAtualId,
            periodo_id: periodo.id,
            direcao: n.direcao,
            tipo_operacao: n.tipo_operacao,
            data_emissao: n.data_emissao,
            numero_nota: n.numero_nota || null,
            serie: n.serie || null,
            chave_acesso: n.chave_acesso || null,
            emitente_nome: n.emitente_nome || null,
            emitente_cnpj: n.emitente_cnpj || null,
            destinatario_nome: n.destinatario_nome || null,
            destinatario_cnpj: n.destinatario_cnpj || null,
            valor_contabil: Number(n.valor_contabil) || 0,
            valor_icms: Number(n.valor_icms) || 0,
            valor_st: Number(n.valor_st) || 0,
            valor_ipi: Number(n.valor_ipi) || 0,
            descricao: n.descricao || null,
            status: 'Lançamento Manual',
        };

        const { error } = await supabase.from('notas_fiscais').insert([payload]);
        if (error) { alert('Erro ao salvar nota fiscal: ' + error.message); setSalvandoNotaFiscalManual(false); return; }

        setPeriodoAtualId(periodo.id);
        await Promise.all([carregarPeriodos(), carregarNotasFiscais(n.direcao), carregarApuracoes()]);
        setSalvandoNotaFiscalManual(false);
        setModalNotaFiscalManualAberto(false);
    }

    function abrirNovoCteManual() {
        setNovoCteManual(cteManualVazio());
        setModalCteManualAberto(true);
    }

    async function salvarCteManual(e) {
        e.preventDefault();
        setSalvandoCteManual(true);
        const c = novoCteManual;

        const periodo = await resolverPeriodoCliente(c.data_emissao);
        if (!periodo) { setSalvandoCteManual(false); return; }
        if (periodo.status === 'fechado') {
            alert('O período desta data já está fechado. Reabra o período antes de lançar CT-e nele.');
            setSalvandoCteManual(false);
            return;
        }

        const payload = {
            empresa_id: empresaAtualId,
            periodo_id: periodo.id,
            data_emissao: c.data_emissao,
            numero_cte: c.numero_cte || null,
            cfop: c.cfop || null,
            natureza: c.natureza || null,
            tomador_nome: c.tomador_nome || null,
            tomador_cnpj: c.tomador_cnpj || null,
            valor_frete: Number(c.valor_frete) || 0,
            valor_icms: Number(c.valor_icms) || 0,
            status: c.status || 'Autorizada',
        };

        const { error } = await supabase.from('cte_documentos').insert([payload]);
        if (error) { alert('Erro ao salvar CT-e: ' + error.message); setSalvandoCteManual(false); return; }

        setPeriodoAtualId(periodo.id);
        await Promise.all([carregarPeriodos(), carregarCteDocumentos(), carregarApuracoes()]);
        setSalvandoCteManual(false);
        setModalCteManualAberto(false);
    }

    // ==== IMPORT BATCHES ====
    async function carregarImportBatches() {
        if (!empresaAtualId) { setImportBatches([]); return; }
        const { data, error } = await supabase
            .from('import_batches')
            .select('*')
            .eq('empresa_id', empresaAtualId)
            .order('created_at', { ascending: false })
            .limit(30);
        if (!error && data) setImportBatches(data);
    }

    useEffect(() => { if (empresaAtualId) carregarImportBatches(); }, [empresaAtualId]);

    async function uploadArquivo(tipo, file) {
        if (!empresaAtualId) { alert('Selecione uma empresa antes de importar.'); return; }
        setUploadEmAndamento(tipo);
        try {
            const token = await obterToken();
            const formData = new FormData();
            formData.append('file', file);
            formData.append('empresa_id', empresaAtualId);
            const res = await fetch(`/api/import/${tipo}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const json = await res.json();
            if (!res.ok) {
                alert('Erro na importação: ' + (json.error || res.statusText));
            } else {
                alert(`Importação concluída: ${json.linhas_processadas} linha(s) processada(s)${json.linhas_erro ? `, ${json.linhas_erro} com erro` : ''}.`);
            }
            await Promise.all([carregarImportBatches(), carregarPeriodos()]);
        } catch (e) {
            alert('Erro na importação: ' + e.message);
        } finally {
            setUploadEmAndamento(null);
        }
    }

    // ==== APURAÇÃO ====
    async function carregarApuracaoIcms() {
        if (!periodoAtualId) { setApuracaoIcms(null); return; }
        const { data, error } = await supabase.rpc('calcular_apuracao_icms', { p_periodo_id: periodoAtualId });
        if (!error && data && data[0]) setApuracaoIcms(data[0]);
    }

    async function carregarApuracaoPisCofins() {
        if (!periodoAtualId) { setApuracaoPisCofins(null); return; }
        const { data, error } = await supabase.rpc('calcular_apuracao_pis_cofins', { p_periodo_id: periodoAtualId });
        if (!error && data && data[0]) setApuracaoPisCofins(data[0]);
    }

    async function carregarApuracoes() {
        setCarregandoApuracao(true);
        await Promise.all([carregarApuracaoIcms(), carregarApuracaoPisCofins()]);
        setCarregandoApuracao(false);
    }

    // Recarrega tudo que depende do período sempre que ele muda (troca de empresa/período/abertura/fechamento).
    useEffect(() => {
        if (!periodoAtualId) {
            setNotasFiscais([]); setCteDocumentos([]); setApuracaoIcms(null); setApuracaoPisCofins(null);
            return;
        }
        carregarCteDocumentos();
        carregarApuracoes();
    }, [periodoAtualId]);

    // ==== USUÁRIOS (admin) ====
    async function carregarUsuarios() {
        const { data, error } = await supabase.from('profiles').select('*').order('nome');
        if (!error && data) setUsuariosSistema(data);
    }

    useEffect(() => { if (isAdmin) carregarUsuarios(); }, [isAdmin]);

    function abrirNovoUsuario() {
        setNovoUsuario({ id: null, nome: '', email: '', nivel: 'Operador', senha: '', novaSenha: '' });
        setModalUsuarioAberto(true);
    }

    function abrirEdicaoUsuario(u) {
        setNovoUsuario({ id: u.id, nome: u.nome, email: '', nivel: u.nivel, senha: '', novaSenha: '' });
        setModalUsuarioAberto(true);
    }

    async function salvarUsuario(e) {
        e.preventDefault();
        setSalvandoUsuario(true);
        const token = await obterToken();
        const rota = '/api/usuarios';
        const metodo = novoUsuario.id ? 'PUT' : 'POST';
        const body = novoUsuario.id
            ? { id: novoUsuario.id, nome: novoUsuario.nome, nivel: novoUsuario.nivel, novaSenha: novoUsuario.novaSenha || undefined }
            : { email: novoUsuario.email, senha: novoUsuario.senha, nome: novoUsuario.nome, nivel: novoUsuario.nivel };

        const res = await fetch(rota, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) { alert('Erro ao salvar usuário: ' + json.error); setSalvandoUsuario(false); return; }

        await carregarUsuarios();
        setSalvandoUsuario(false);
        setModalUsuarioAberto(false);
    }

    // ==== TELA DE LOGIN ====
    if (carregandoSessao) {
        return <div className="flex min-h-screen items-center justify-center bg-[#EDEFF0]"></div>;
    }

    if (!usuario) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#EDEFF0] text-[#454545] p-4 select-none font-sans">
                <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex flex-col gap-6">
                    <div className="text-center flex flex-col items-center">
                        <div className="h-11 w-11 rounded-xl bg-brand text-white flex items-center justify-center font-black text-lg mb-3">P</div>
                        <h1 className="text-lg font-bold text-gray-900">Pantax</h1>
                        <p className="text-[11px] text-gray-400 mt-1">Apuração fiscal — insira suas credenciais</p>
                    </div>

                    <form onSubmit={efetuarLogin} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">E-mail</label>
                            <input required type="email" value={loginInput} onChange={e => setLoginInput(e.target.value)} className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition text-gray-800" placeholder="seu@email.com" autoComplete="username" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Senha</label>
                            <input required type="password" value={senhaInput} onChange={e => setSenhaInput(e.target.value)} className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[13px] outline-none focus:border-brand transition text-gray-800" placeholder="••••••" autoComplete="current-password" />
                        </div>
                        {erroLogin && <p className="text-[11px] text-red-500 font-medium text-center">{erroLogin}</p>}
                        <button type="submit" className="w-full bg-brand hover:bg-brandHover text-white py-2 rounded text-[13px] font-semibold shadow transition mt-2">
                            Entrar no Sistema
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const value = {
        REGIMES_TRIBUTARIOS,
        isAdmin, usuario, setUsuario, logout,
        darkMode, toggleDarkMode,
        abaAtual, setAbaAtual,
        empresas, empresaAtualId, setEmpresaAtualId, empresaAtual,
        modalEmpresaAberto, setModalEmpresaAberto, novaEmpresa, setNovaEmpresa, salvandoEmpresa,
        abrirNovaEmpresa, abrirEdicaoEmpresa, salvarEmpresa,
        periodos, periodoAtualId, setPeriodoAtualId, periodoAtual, salvandoPeriodo,
        salvarCamposPeriodo, fecharPeriodo, reabrirPeriodo,
        notasFiscais, carregarNotasFiscais,
        notaFiscalExpandidaId, itensNotaFiscal, carregarItensNotaFiscal,
        cteDocumentos, carregarCteDocumentos,
        importBatches, uploadEmAndamento, uploadArquivo,
        modalNotaFiscalManualAberto, setModalNotaFiscalManualAberto, novaNotaFiscalManual, setNovaNotaFiscalManual, salvandoNotaFiscalManual,
        abrirNovaNotaFiscalManual, salvarNotaFiscalManual,
        modalCteManualAberto, setModalCteManualAberto, novoCteManual, setNovoCteManual, salvandoCteManual,
        abrirNovoCteManual, salvarCteManual,
        apuracaoIcms, apuracaoPisCofins, carregandoApuracao, carregarApuracoes,
        usuariosSistema, modalUsuarioAberto, setModalUsuarioAberto, novoUsuario, setNovoUsuario, salvandoUsuario,
        abrirNovoUsuario, abrirEdicaoUsuario, salvarUsuario,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
