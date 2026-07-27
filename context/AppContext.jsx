"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { chaveLinhaCfop } from '@/lib/utils';

export { supabase };

export const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    // ==== SESSÃO / LOGIN ====
    const [usuario, setUsuario] = useState(null);
    const [carregandoSessao, setCarregandoSessao] = useState(true);
    const [loginInput, setLoginInput] = useState('');
    const [senhaInput, setSenhaInput] = useState('');
    const [erroLogin, setErroLogin] = useState('');
    const isAdmin = usuario?.nivel === 'Administrador';

    const [darkMode, setDarkMode] = useState(true);
    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);
    const toggleDarkMode = () => setDarkMode(!darkMode);

    const [abaAtual, setAbaAtual] = useState('dashboard');
    // Submenu dentro da aba "Resumo": emitidas | recebidas | cte | previa.
    const [resumoSubAba, setResumoSubAba] = useState('emitidas');
    // Drawer da sidebar em telas mobile (a sidebar fixa só aparece em lg+).
    const [sidebarMobileAberto, setSidebarMobileAberto] = useState(false);

    // ==== EMPRESAS (criadas automaticamente a partir do arquivo importado) ====
    const [empresas, setEmpresas] = useState([]);
    const [empresaAtualId, setEmpresaAtualId] = useState(null);
    const empresaAtual = empresas.find(e => e.id === empresaAtualId) || null;

    // ==== COMPETÊNCIA (mês/ano + Prévia ou Fechamento) ====
    const [competencias, setCompetencias] = useState([]);
    const [competenciaAtualId, setCompetenciaAtualId] = useState(null);
    const competenciaAtual = competencias.find(c => c.key === competenciaAtualId) || null;

    // ==== IMPORTAÇÃO ====
    const [importBatches, setImportBatches] = useState([]);
    const [uploadEmAndamento, setUploadEmAndamento] = useState(false);
    // Incrementa a cada upload concluído — telas que mostram dados agregados
    // (Emitidas/Recebidas/CT-e, Dashboard) escutam isso pra refazer a busca
    // mesmo quando a empresa/competência selecionada não muda (reimportar a
    // mesma competência).
    const [ultimaImportacaoEm, setUltimaImportacaoEm] = useState(0);

    // ==== SELEÇÃO DE CFOPs (checkboxes nas telas Emitidas/Recebidas/CT-e) ====
    // Emitidas = lado do débito; Recebidas + CT-e = lado do crédito da apuração.
    const selecaoCfopVazia = () => ({ emitidas: new Set(), recebidas: new Set(), cte: new Set() });
    const [selecoesCfop, setSelecoesCfop] = useState(selecaoCfopVazia());

    function alternarSelecaoCfop(origem, chave) {
        setSelecoesCfop(prev => {
            const novoSet = new Set(prev[origem]);
            if (novoSet.has(chave)) novoSet.delete(chave); else novoSet.add(chave);
            return { ...prev, [origem]: novoSet };
        });
    }

    function alternarTodosSelecaoCfop(origem, chaves, marcar) {
        setSelecoesCfop(prev => {
            const novoSet = new Set(prev[origem]);
            for (const chave of chaves) { if (marcar) novoSet.add(chave); else novoSet.delete(chave); }
            return { ...prev, [origem]: novoSet };
        });
    }

    // Troca de competência invalida a seleção anterior (é de outro mês/tipo).
    useEffect(() => { setSelecoesCfop(selecaoCfopVazia()); }, [competenciaAtualId]);

    // ==== APURAÇÃO (gerada a partir da seleção, não fica salva no banco) ====
    const [apuracaoIcms, setApuracaoIcms] = useState(null);
    const [apuracaoPisCofins, setApuracaoPisCofins] = useState(null);
    const [gerandoApuracao, setGerandoApuracao] = useState(false);
    // Estorno de Débito e Acumulado do ICMS: ajustes manuais, dígitos brutos de
    // input mascarado (formatarMoeda/moedaParaNumero), zerados a cada "Gerar
    // Apuração" e aplicados em tempo real no resultado (ver PreviaTab.CardEditavel).
    const [estornoDebitoIcms, setEstornoDebitoIcms] = useState('');
    const [acumuladoCreditoIcms, setAcumuladoCreditoIcms] = useState('');

    // Alíquotas do regime não-cumulativo (confirmadas contra planilha de
    // referência real — PIS/COFINS não é soma direta da planilha, é Base x Alíquota).
    const ALIQUOTA_PIS = 0.0165;
    const ALIQUOTA_COFINS = 0.076;

    async function gerarApuracao() {
        if (!empresaAtualId || !competenciaAtual) return;
        setGerandoApuracao(true);
        try {
            const buscarOrigem = (origem) => supabase.from('nfe_resumo_cfop').select('*')
                .eq('empresa_id', empresaAtualId).eq('ano', competenciaAtual.ano).eq('mes', competenciaAtual.mes)
                .eq('tipo_calculo', competenciaAtual.tipo_calculo).eq('origem', origem);

            const [emitidas, recebidas, cte] = await Promise.all([
                buscarOrigem('emitidas'), buscarOrigem('recebidas'), buscarOrigem('cte'),
            ]);
            const linhasEmitidas = emitidas.data || [];
            const linhasRecebidas = recebidas.data || [];
            const linhasCte = cte.data || [];

            // direcaoFiltro/categoriaFiltro opcionais: só soma linhas daquela
            // direção/categoria (Emitidas mistura vendas — saída — com devoluções
            // de venda — entrada; Recebidas mistura Revenda e Uso e Consumo).
            //
            // Seleção (checkbox) só existe em Emitidas (débito) — nada marcado ali
            // significa débito zerado, de propósito, pra forçar a escolha. Recebidas
            // e CT-e não têm checkbox: todo CFOP Autorizado entra no crédito.
            const somar = (linhas, origem, campo, direcaoFiltro = null, categoriaFiltro = null) => linhas
                .filter(l => origem !== 'emitidas' || selecoesCfop[origem].has(chaveLinhaCfop(l)))
                .filter(l => !direcaoFiltro || l.cfop_direcao === direcaoFiltro)
                .filter(l => !categoriaFiltro || l.categoria === categoriaFiltro)
                .reduce((soma, l) => soma + (l[campo] || 0), 0);

            // ==== ICMS: Débito = Saídas NF-e (+ Estorno manual); Crédito =
            // Devoluções (entrada em Emitidas) + NF-e Entrada (só Revenda em
            // Recebidas) + CT-e (+ Acumulado manual) — Estorno/Acumulado entram
            // na tela (PreviaTab), aqui só a parte calculada da planilha ====
            const saidasNfe = somar(linhasEmitidas, 'emitidas', 'valor_icms', 'saida');
            const devolucoes = somar(linhasEmitidas, 'emitidas', 'valor_icms', 'entrada');
            const nfeEntrada = somar(linhasRecebidas, 'recebidas', 'valor_icms', null, 'revenda');
            const creditoCte = somar(linhasCte, 'cte', 'valor_icms');
            setApuracaoIcms({ saidasNfe, devolucoes, nfeEntrada, cte: creditoCte });
            setEstornoDebitoIcms('');
            setAcumuladoCreditoIcms('');

            // ==== PIS/COFINS: Base x Alíquota, não soma direta ====
            // Débito, igual ao ICMS: campo Saída (Valor Total das saídas
            // selecionadas em Emitidas) e campo ICMS (Valor ICMS das mesmas
            // saídas) — a base é a diferença entre os dois.
            const debitoSaida = somar(linhasEmitidas, 'emitidas', 'valor_total', 'saida');
            const debitoIcms = somar(linhasEmitidas, 'emitidas', 'valor_icms', 'saida');
            const baseDebito = debitoSaida - debitoIcms;

            // Crédito, em 6 linhas: Compra Revenda/ICMS-ST-IPI (Recebidas, só
            // categoria Revenda), Frete/ICMS (CT-e) e Devolução Revenda/ICMS-ST-IPI
            // (entrada em Emitidas, só linhas selecionadas — mesma seleção do débito).
            const compraRevenda = somar(linhasRecebidas, 'recebidas', 'valor_total', null, 'revenda');
            const icmsStIpiRevenda = somar(linhasRecebidas, 'recebidas', 'valor_icms', null, 'revenda')
                + somar(linhasRecebidas, 'recebidas', 'valor_icms_st', null, 'revenda')
                + somar(linhasRecebidas, 'recebidas', 'valor_ipi', null, 'revenda');
            const frete = somar(linhasCte, 'cte', 'valor_total');
            const icmsCte = somar(linhasCte, 'cte', 'valor_icms');
            const devolucaoRevenda = somar(linhasEmitidas, 'emitidas', 'valor_total', 'entrada');
            const icmsStIpiEntrada = somar(linhasEmitidas, 'emitidas', 'valor_icms', 'entrada')
                + somar(linhasEmitidas, 'emitidas', 'valor_icms_st', 'entrada')
                + somar(linhasEmitidas, 'emitidas', 'valor_ipi', 'entrada');
            const baseCredito = compraRevenda - icmsStIpiRevenda + frete - icmsCte + devolucaoRevenda - icmsStIpiEntrada;

            const debitoPis = baseDebito * ALIQUOTA_PIS;
            const creditoPis = baseCredito * ALIQUOTA_PIS;
            const debitoCofins = baseDebito * ALIQUOTA_COFINS;
            const creditoCofins = baseCredito * ALIQUOTA_COFINS;
            const resultadoPis = debitoPis - creditoPis;
            const resultadoCofins = debitoCofins - creditoCofins;

            // ==== Compra para ficar credor: quanto precisaria comprar (a mais)
            // pra zerar o PIS a pagar, projetado sobre a média de venda ====
            const compraParaZerar = Math.round((resultadoPis / ALIQUOTA_PIS) * 100) / 100;
            const mediaVenda = baseDebito / 20;
            const faturamento = mediaVenda * 10;
            const totalCompraParaFicarCredor = compraParaZerar + faturamento;

            setApuracaoPisCofins({
                debitoSaida, debitoIcms, baseDebito,
                compraRevenda, icmsStIpiRevenda, frete, icmsCte, devolucaoRevenda, icmsStIpiEntrada, baseCredito,
                debitoPis, creditoPis, resultadoPis,
                debitoCofins, creditoCofins, resultadoCofins,
                compraParaZerar, mediaVenda, faturamento, totalCompraParaFicarCredor,
            });

            setAbaAtual('resumo');
            setResumoSubAba('previa');
        } finally {
            setGerandoApuracao(false);
        }
    }

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
            setEmpresaAtualId(empresas[0].id);
        }
    }, [empresas, empresaAtualId]);

    // ==== COMPETÊNCIAS ====
    // Cada upload concluído vira uma competência disponível (ano/mês + Prévia ou
    // Fechamento) — não existe mais período criado manualmente, vem do próprio import_batches.
    async function carregarCompetencias(empresaId) {
        if (!empresaId) { setCompetencias([]); return; }
        const { data, error } = await supabase
            .from('import_batches')
            .select('ano, mes, tipo_calculo, created_at')
            .eq('empresa_id', empresaId)
            .eq('tipo_arquivo', 'nfe')
            .eq('status', 'concluido')
            .not('ano', 'is', null)
            .order('created_at', { ascending: false });
        if (error || !data) { setCompetencias([]); return; }

        const vistos = new Set();
        const lista = [];
        for (const b of data) {
            const key = `${b.ano}-${b.mes}-${b.tipo_calculo}`;
            if (vistos.has(key)) continue;
            vistos.add(key);
            lista.push({ key, ano: b.ano, mes: b.mes, tipo_calculo: b.tipo_calculo });
        }
        setCompetencias(lista);
    }

    useEffect(() => {
        setCompetenciaAtualId(null);
        if (empresaAtualId) carregarCompetencias(empresaAtualId);
        else setCompetencias([]);
    }, [empresaAtualId]);

    useEffect(() => {
        if (!competenciaAtualId && competencias.length > 0) {
            setCompetenciaAtualId(competencias[0].key);
        }
    }, [competencias, competenciaAtualId]);

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

    // A empresa não é escolhida antes do upload — nasce do nome do arquivo de Emitidas.
    // arquivos = { emitidas, recebidas, cte } (File cada) — os 3 sobem juntos.
    async function uploadRelatorioNfe(arquivos, tipoCalculo) {
        setUploadEmAndamento(true);
        try {
            const token = await obterToken();
            const formData = new FormData();
            formData.append('emitidas', arquivos.emitidas);
            formData.append('recebidas', arquivos.recebidas);
            formData.append('cte', arquivos.cte);
            formData.append('tipo_calculo', tipoCalculo);
            const res = await fetch('/api/import/nfe', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const json = await res.json();
            if (!res.ok) {
                alert('Erro na importação: ' + (json.error || res.statusText));
            } else {
                alert(`Importação concluída: ${json.linhas_processadas} linha(s) processada(s)${json.linhas_erro ? `, ${json.linhas_erro} com erro` : ''}.`);
                await carregarEmpresas();
                setEmpresaAtualId(json.empresa_id);
                setAbaAtual('resumo');
                setResumoSubAba('emitidas');
                setUltimaImportacaoEm(Date.now());
            }
        } catch (e) {
            alert('Erro na importação: ' + e.message);
        } finally {
            setUploadEmAndamento(false);
        }
    }

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
                        <img src="/logo-pantax.webp" alt="Pantax" className="h-11 w-11 mb-3" />
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
        isAdmin, usuario, setUsuario, logout,
        darkMode, toggleDarkMode,
        abaAtual, setAbaAtual, resumoSubAba, setResumoSubAba,
        sidebarMobileAberto, setSidebarMobileAberto,
        empresas, empresaAtualId, setEmpresaAtualId, empresaAtual,
        competencias, competenciaAtualId, setCompetenciaAtualId, competenciaAtual,
        importBatches, uploadEmAndamento, uploadRelatorioNfe, ultimaImportacaoEm,
        selecoesCfop, alternarSelecaoCfop, alternarTodosSelecaoCfop,
        apuracaoIcms, apuracaoPisCofins, gerandoApuracao, gerarApuracao,
        estornoDebitoIcms, setEstornoDebitoIcms, acumuladoCreditoIcms, setAcumuladoCreditoIcms,
        usuariosSistema, modalUsuarioAberto, setModalUsuarioAberto, novoUsuario, setNovoUsuario, salvandoUsuario,
        abrirNovoUsuario, abrirEdicaoUsuario, salvarUsuario,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
