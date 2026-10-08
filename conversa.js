/* ============================================================
   AFM WHATSAPP
   conversa.js
   VERSÃO COMPLETA

   FUNÇÕES:
   - Sessão
   - Contatos
   - Setores
   - Mensagens de texto
   - Apagar mensagem de texto
   - Imagem
   - Vídeo
   - Áudio
   - Apagar imagem
   - Apagar vídeo
   - Apagar áudio
   - IndexedDB
   - Modal de mídia
   - Chamada de vídeo
   - Chamada de áudio
   - Compartilhamento de tela
   - Microfone
   - Câmera
   - Emojis
   - Nova conversa
   - Pesquisa
   - Sair
============================================================ */


document.addEventListener(
    "DOMContentLoaded",
    () => {


    /* ========================================================
       SESSÃO
    ======================================================== */

    let sessao = null;

    try {

        sessao =
            JSON.parse(
                sessionStorage.getItem(
                    "afmSessao"
                ) || "null"
            );

    } catch (erro) {

        console.error(
            "Erro ao carregar sessão:",
            erro
        );
    }


    if (!sessao) {

        window.location.href =
            "login.html";

        return;
    }


    const usuarioLogado =
        document.getElementById(
            "usuario-logado"
        );


    const setorLogado =
        document.getElementById(
            "setor-logado"
        );


    if (sessao) {

        if (usuarioLogado) {

            usuarioLogado.textContent =
                sessao.nome ||
                sessao.usuario ||
                "Usuário";
        }


        if (setorLogado) {

            setorLogado.textContent =
                `Setor: ${sessao.setor || "Todos"}`;
        }
    }



    /* ========================================================
       ELEMENTOS PRINCIPAIS
    ======================================================== */

    const usuarios =
        document.querySelectorAll(
            ".usuario"
        );


    const listaUsuarios =
        document.getElementById(
            "lista-usuarios"
        );


    const nomeContato =
        document.getElementById(
            "nome-contato"
        );


    const setorContato =
        document.getElementById(
            "setor-contato"
        );


    const statusContato =
        document.getElementById(
            "status-contato"
        );


    const mensagens =
        document.getElementById(
            "mensagens"
        );


    const mensagem =
        document.getElementById(
            "mensagem"
        );


    const barraResposta =
        document.getElementById(
            "barra-resposta"
        );


    const textoResposta =
        document.getElementById(
            "texto-resposta"
        );


    const btnCancelarResposta =
        document.getElementById(
            "btn-cancelar-resposta"
        );


    const sugestoesResposta =
        document.getElementById(
            "sugestoes-resposta"
        );


    const btnEnviar =
        document.getElementById(
            "btn-enviar"
        );


    const btnVideo =
        document.getElementById(
            "btn-video"
        );


    const btnLigacao =
        document.getElementById(
            "btn-ligacao"
        );


    const btnCompartilhar =
        document.getElementById(
            "btn-compartilhar"
        );



    /* ========================================================
       ESTADO
    ======================================================== */

    let contatoAtual =
        "";


    let setorAtual =
        "";


    let mensagemEmResposta =
        null;


    let streamCamera =
        null;


    let streamAudio =
        null;


    let streamTela =
        null;


    let microfoneVideoAtivo =
        true;


    let microfoneAudioAtivo =
        true;



    /* ========================================================
       INDEXEDDB
    ======================================================== */

    const NOME_BANCO =
        "AFM_WHATSAPP_DB";


    const VERSAO_BANCO =
        1;


    const NOME_STORE =
        "midias";


    let bancoMidias =
        null;



    /* ========================================================
       ABRIR INDEXEDDB
    ======================================================== */

    function abrirBancoMidias() {

        return new Promise(
            (resolve, reject) => {

                if (!window.indexedDB) {

                    reject(
                        new Error(
                            "IndexedDB não é suportado."
                        )
                    );

                    return;
                }


                const request =
                    indexedDB.open(
                        NOME_BANCO,
                        VERSAO_BANCO
                    );


                request.onupgradeneeded =
                    evento => {

                        const db =
                            evento.target.result;


                        if (
                            !db.objectStoreNames
                                .contains(
                                    NOME_STORE
                                )
                        ) {

                            const store =
                                db.createObjectStore(
                                    NOME_STORE,
                                    {
                                        keyPath: "id",
                                        autoIncrement: true
                                    }
                                );


                            store.createIndex(
                                "usuario",
                                "usuario",
                                {
                                    unique: false
                                }
                            );


                            store.createIndex(
                                "contato",
                                "contato",
                                {
                                    unique: false
                                }
                            );


                            store.createIndex(
                                "data",
                                "data",
                                {
                                    unique: false
                                }
                            );
                        }
                    };


                request.onsuccess =
                    () => {

                        bancoMidias =
                            request.result;

                        resolve(
                            bancoMidias
                        );
                    };


                request.onerror =
                    () => {

                        console.error(
                            "Erro IndexedDB:",
                            request.error
                        );

                        reject(
                            request.error
                        );
                    };
            }
        );
    }



    abrirBancoMidias()
        .catch(
            erro => {

                console.error(
                    "Erro ao iniciar banco:",
                    erro
                );
            }
        );



    /* ========================================================
       USUÁRIO ATUAL
    ======================================================== */

    function obterUsuarioAtual() {

        try {

            const sessaoAtual =
                JSON.parse(
                    sessionStorage.getItem(
                        "afmSessao"
                    ) || "null"
                );


            return (
                sessaoAtual?.usuario ||
                sessaoAtual?.nome ||
                "usuario"
            );

        } catch (erro) {

            return "usuario";
        }
    }



    /* ========================================================
       CONTATO ATUAL
    ======================================================== */

    function obterContatoAtual() {

        return (
            contatoAtual ||
            ""
        );
    }



    /* ========================================================
       SETOR ATUAL
    ======================================================== */

    function obterSetorAtual() {

        return (
            setorAtual ||
            "Todos"
        );
    }



    /* ========================================================
       HORA
    ======================================================== */

    function horaAtual() {

        return new Date()
            .toLocaleTimeString(
                "pt-BR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );
    }



    /* ========================================================
       CHAVE DAS MENSAGENS
    ======================================================== */

    function chaveMensagens(contato = contatoAtual) {

        return (
            `afmMensagens_${obterUsuarioAtual()}_${contato}`
        );
    }


    function criarMensagemInicialContato(contato = contatoAtual) {

        if (!contato) {
            return null;
        }

        let dados = [];

        try {

            dados =
                JSON.parse(
                    localStorage.getItem(
                        chaveMensagens(contato)
                    ) || "[]"
                );

        } catch (erro) {

            dados = [];
        }

        if (dados.length > 0) {
            return null;
        }

        const mensagemInicial = {
            id: gerarIdMensagem(),
            remetente: "Sistema",
            setorRemetente: "Sistema",
            destinatario: contato,
            setorDestinatario: obterSetorContato(contato),
            texto: "Olá! 👋",
            tipo: "recebida",
            autorContato: contato,
            hora: horaAtual(),
            data: new Date().toISOString()
        };

        dados.push(mensagemInicial);

        localStorage.setItem(
            chaveMensagens(contato),
            JSON.stringify(dados)
        );

        return mensagemInicial;
    }



    /* ========================================================
       SELECIONAR CONTATO
    ======================================================== */

    async function selecionarContato(
        elemento
    ) {

        if (!elemento) {
            return;
        }


        contatoAtual =
            elemento.dataset.contato ||
            "";


        limparResposta();


        setorAtual =
            elemento.dataset.setor ||
            "Todos";


        document
            .querySelectorAll(
                ".usuario"
            )
            .forEach(
                usuario => {

                    usuario.classList.remove(
                        "ativo"
                    );
                }
            );


        elemento.classList.add(
            "ativo"
        );


        if (nomeContato) {

            nomeContato.textContent =
                contatoAtual;
        }


        if (setorContato) {

            setorContato.textContent =
                `Setor: ${setorAtual}`;
        }


        if (statusContato) {

            statusContato.textContent =
                "🟢 Online";
        }

        window.socketClient?.joinConversation(setorAtual);

        await carregarMensagens();
    }



    /* ========================================================
       CLIQUE NOS CONTATOS
    ======================================================== */

    document
        .querySelectorAll(
            ".usuario"
        )
        .forEach(
            usuario => {

                usuario.addEventListener(
                    "click",
                    evento => {

                        if (
                            evento.target.closest(
                                ".btn-apagar"
                            )
                        ) {

                            return;
                        }


                        selecionarContato(
                            usuario
                        );
                    }
                );
            }
        );



    /* ========================================================
       APAGAR CONTATO
    ======================================================== */

    function configurarBotoesApagarContato() {

        document
            .querySelectorAll(
                ".btn-apagar"
            )
            .forEach(
                botao => {

                    botao.addEventListener(
                        "click",
                        evento => {

                            evento.preventDefault();

                            evento.stopPropagation();


                            const usuario =
                                botao.closest(
                                    ".usuario"
                                );


                            if (!usuario) {
                                return;
                            }


                            const nome =
                                usuario.dataset.contato ||
                                "";


                            if (!nome) {
                                return;
                            }


                            const confirmar =
                                confirm(
                                    `Deseja apagar o contato "${nome}"?`
                                );


                            if (!confirmar) {
                                return;
                            }


                            let apagados = [];


                            try {

                                apagados =
                                    JSON.parse(
                                        localStorage.getItem(
                                            "afmContatosExcluidos"
                                        ) || "[]"
                                    );

                            } catch (erro) {

                                apagados =
                                    [];
                            }


                            if (
                                !apagados.includes(
                                    nome
                                )
                            ) {

                                apagados.push(
                                    nome
                                );
                            }


                            localStorage.setItem(
                                "afmContatosExcluidos",
                                JSON.stringify(
                                    apagados
                                )
                            );


                            usuario.remove();


                            if (
                                contatoAtual ===
                                nome
                            ) {

                                contatoAtual =
                                    "";

                                setorAtual =
                                    "";


                                if (nomeContato) {

                                    nomeContato.textContent =
                                        "Selecione um contato";
                                }


                                if (setorContato) {

                                    setorContato.textContent =
                                        "";
                                }


                                if (statusContato) {

                                    statusContato.textContent =
                                        "";
                                }


                                if (mensagens) {

                                    mensagens.innerHTML =
                                        "";
                                }
                            }
                        }
                    );
                }
            );
    }


    configurarBotoesApagarContato();



    /* ========================================================
       REMOVER CONTATOS APAGADOS
    ======================================================== */

    function removerContatosApagados() {

        let apagados = [];


        try {

            apagados =
                JSON.parse(
                    localStorage.getItem(
                        "afmContatosExcluidos"
                    ) || "[]"
                );

        } catch (erro) {

            apagados =
                [];
        }


        document
            .querySelectorAll(
                ".usuario"
            )
            .forEach(
                usuario => {

                    const nome =
                        usuario.dataset.contato ||
                        "";


                    if (
                        apagados.includes(
                            nome
                        )
                    ) {

                        usuario.remove();
                    }
                }
            );
    }


    removerContatosApagados();


    if (
        sessao?.setor?.trim().toLocaleLowerCase("pt-BR") === "todos" &&
        listaUsuarios &&
        !listaUsuarios.querySelector("[data-todos='true']")
    ) {

        const contatoTodos =
            document.createElement("button");


        contatoTodos.type =
            "button";


        contatoTodos.className =
            "usuario conversa-todos";


        contatoTodos.dataset.contato =
            "Todos";


        contatoTodos.dataset.setor =
            "Todos";


        contatoTodos.dataset.todos =
            "true";


        contatoTodos.innerHTML = `
            <span class="avatar">👥</span>
            <span class="dados-usuario">
                <strong>Todos</strong>
                <small>Enviar para todos os contatos</small>
            </span>
        `;


        contatoTodos.addEventListener(
            "click",
            () => selecionarContato(contatoTodos)
        );


        listaUsuarios.prepend(contatoTodos);
    }



    /* ========================================================
       ID DA MENSAGEM
    ======================================================== */

    function gerarIdMensagem() {

        return (
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );
    }


    function obterDadosUsuarioAtual() {

        try {

            const sessaoAtual =
                JSON.parse(
                    sessionStorage.getItem(
                        "afmSessao"
                    ) || "null"
                );

            return {
                nome:
                    sessaoAtual?.nome ||
                    sessaoAtual?.usuario ||
                    "Usuário",
                setor:
                    sessaoAtual?.setor ||
                    "Todos"
            };

        } catch (erro) {

            return {
                nome: "Usuário",
                setor: "Todos"
            };
        }
    }


    function obterSetorContato(contatoDestino = contatoAtual) {

        if (!contatoDestino || contatoDestino === "Todos") {
            return "Todos";
        }

        const contatos =
            Array.from(
                document.querySelectorAll(
                    "#lista-usuarios .usuario"
                )
            );

        const contato =
            contatos.find(
                item =>
                    (item.dataset.contato || "")
                        .toLocaleLowerCase() ===
                    String(contatoDestino)
                        .toLocaleLowerCase()
            );

        return (
            contato?.dataset.setor ||
            setorAtual ||
            "Todos"
        );
    }



    /* ========================================================
       SALVAR MENSAGEM DE TEXTO
    ======================================================== */

    function salvarMensagem(
        texto,
        tipo = "enviada",
        resposta = null,
        contatoDestino = contatoAtual
    ) {

        let dados = [];


        try {

            dados =
                JSON.parse(
                    localStorage.getItem(
                        chaveMensagens(contatoDestino)
                    ) || "[]"
                );

        } catch (erro) {

            dados =
                [];
        }


        const dadosUsuarioAtual =
            obterDadosUsuarioAtual();

        const destinatario =
            contatoDestino || "Todos";

        const novaMensagem = {

            id:
                gerarIdMensagem(),

            remetente:
                dadosUsuarioAtual.nome,

            setorRemetente:
                dadosUsuarioAtual.setor,

            destinatario:
                destinatario,

            setorDestinatario:
                destinatario === "Todos"
                    ? "Todos"
                    : obterSetorContato(destinatario),

            texto:
                texto,

            tipo:
                tipo,

            hora:
                horaAtual(),

            data:
                new Date()
                    .toISOString(),

            resposta:
                null
        };


        if (resposta) {

            novaMensagem.resposta = {
                id: resposta.id,
                texto: resposta.texto,
                autor: resposta.autor
            };
        }


        dados.push(
            novaMensagem
        );


        localStorage.setItem(
            chaveMensagens(contatoDestino),
            JSON.stringify(
                dados
            )
        );


        return novaMensagem;
    }


    function normalizarSetorSocket(valor) {

        return String(valor || "")
            .trim()
            .toLocaleLowerCase("pt-BR")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }


    function canalDaConversa(setorDestino) {

        const setores = [
            normalizarSetorSocket(obterDadosUsuarioAtual().setor),
            normalizarSetorSocket(setorDestino)
        ].sort();

        return setores.includes("todos")
            ? "todos"
            : setores.join("::");
    }


    function adaptarMensagemSocket(mensagemServidor) {

        const dadosUsuarioAtual =
            obterDadosUsuarioAtual();

        const usuarioRemetente =
            mensagemServidor.sender?.user ||
            mensagemServidor.remetenteUsuario ||
            "";

        const propriaMensagem =
            usuarioRemetente &&
            usuarioRemetente.toLocaleLowerCase("pt-BR") ===
                obterUsuarioAtual().toLocaleLowerCase("pt-BR");

        return {
            ...mensagemServidor,
            texto:
                mensagemServidor.texto ||
                mensagemServidor.text ||
                "",
            tipo:
                propriaMensagem
                    ? "enviada"
                    : "recebida",
            hora:
                mensagemServidor.time ||
                (mensagemServidor.data
                    ? new Date(mensagemServidor.data).toLocaleTimeString(
                        "pt-BR",
                        { hour: "2-digit", minute: "2-digit" }
                    )
                    : horaAtual()),
            resposta:
                mensagemServidor.resposta ||
                mensagemServidor.reply ||
                null,
            autorContato:
                propriaMensagem
                    ? null
                    : mensagemServidor.sender?.name ||
                      mensagemServidor.remetente ||
                      "Contato",
            setorDestinatario:
                mensagemServidor.setorDestinatario ||
                mensagemServidor.targetSector ||
                dadosUsuarioAtual.setor
        };
    }


    function salvarMensagemSocket(mensagemServidor, contatoDestino) {

        if (!mensagemServidor?.id || !contatoDestino) {
            return null;
        }

        const mensagemAdaptada =
            adaptarMensagemSocket(mensagemServidor);

        let dados = [];

        try {
            dados = JSON.parse(
                localStorage.getItem(chaveMensagens(contatoDestino)) || "[]"
            );
        } catch (erro) {
            console.error("Erro ao carregar mensagens locais:", erro);
        }

        const indice =
            dados.findIndex(
                item => String(item.id) === String(mensagemAdaptada.id)
            );

        if (indice >= 0) {
            dados[indice] = mensagemAdaptada;
        } else {
            dados.push(mensagemAdaptada);
        }

        localStorage.setItem(
            chaveMensagens(contatoDestino),
            JSON.stringify(dados)
        );

        return mensagemAdaptada;
    }


    function solicitarHistoricoSocket(contatoDestino, setorDestino, callback) {

        const socketClient = window.socketClient;

        if (!socketClient) {
            return;
        }

        let respondido = false;

        const timeout =
            window.setTimeout(
                () => {
                    if (!respondido) {
                        respondido = true;
                        console.error("Tempo esgotado ao carregar o histórico do servidor.");
                    }
                },
                8000
            );

        socketClient.requestHistory(
            { targetSector: setorDestino },
            historico => {
                if (respondido) {
                    return;
                }

                respondido = true;
                window.clearTimeout(timeout);

                if (!Array.isArray(historico)) {
                    console.error("O servidor retornou um histórico inválido.");
                    return;
                }

                callback(contatoDestino, historico);
            }
        );
    }


    function sincronizarHistoricoServidor(contatoDestino, setorDestino) {

        solicitarHistoricoSocket(
            contatoDestino,
            setorDestino,
            (contatoHistorico, historico) => {

                const chaveHistorico =
                    chaveMensagens(contatoHistorico);

                let mensagensLocais = [];

                try {
                    mensagensLocais = JSON.parse(
                        localStorage.getItem(chaveHistorico) || "[]"
                    );
                } catch (erro) {
                    console.error("Erro ao carregar mensagens locais:", erro);
                }

                const mensagensPorId =
                    new Map(
                        mensagensLocais.map(item => [
                            String(item.id),
                            item
                        ])
                    );

                historico.forEach(item => {
                    if (item?.id) {
                        const mensagemAdaptada =
                            adaptarMensagemSocket(item);

                        mensagensPorId.set(
                            String(mensagemAdaptada.id),
                            mensagemAdaptada
                        );
                    }
                });

                localStorage.setItem(
                    chaveHistorico,
                    JSON.stringify(Array.from(mensagensPorId.values()))
                );

                if (contatoAtual === contatoHistorico) {
                    carregarMensagens(false);
                }
            }
        );
    }


    function receberMensagemSocket(mensagemServidor) {

        if (!mensagemServidor?.id) {
            console.error("O servidor enviou uma mensagem inválida.");
            return;
        }

        const contatoDestino =
            mensagemServidor.channel === "todos"
                ? "Todos"
                : mensagemServidor.channel === canalDaConversa(setorAtual)
                    ? contatoAtual
                    : "";

        if (!contatoDestino) {
            return;
        }

        const mensagemAdaptada =
            salvarMensagemSocket(mensagemServidor, contatoDestino);

        if (
            contatoAtual !== contatoDestino ||
            !mensagemAdaptada ||
            Array.from(mensagens?.children || []).some(
                elemento =>
                    elemento.dataset.mensagemId ===
                    String(mensagemAdaptada.id)
            )
        ) {
            return;
        }

        adicionarMensagemTela(
            mensagemAdaptada.texto,
            mensagemAdaptada.tipo,
            mensagemAdaptada.hora,
            mensagemAdaptada.id,
            mensagemAdaptada.resposta,
            mensagemAdaptada.autorContato
        );

        rolarMensagens();
    }


    window.socketClient?.socket?.on(
        "message:new",
        receberMensagemSocket
    );


    /* ========================================================
       APAGAR MENSAGEM DE TEXTO
    ======================================================== */

    function apagarMensagemTexto(
        id,
        elemento
    ) {

        if (!id) {

            alert(
                "Não foi possível identificar a mensagem."
            );

            return;
        }


        const confirmar =
            confirm(
                "Deseja apagar esta mensagem?"
            );


        if (!confirmar) {
            return;
        }


        const chaveAtual =
            chaveMensagens(
                contatoAtual || obterContatoAtual()
            );


        let dados = [];


        try {

            dados =
                JSON.parse(
                    localStorage.getItem(
                        chaveAtual
                    ) || "[]"
                );

        } catch (erro) {

            dados =
                [];
        }


        const novosDados =
            dados.filter(
                item =>
                    String(item.id) !==
                    String(id)
            );


        localStorage.setItem(
            chaveAtual,
            JSON.stringify(
                novosDados
            )
        );


        if (
            elemento &&
            elemento.parentNode
        ) {

            elemento.remove();
        }
    }



    /* ========================================================
       ADICIONAR MENSAGEM DE TEXTO NA TELA
    ======================================================== */

    function adicionarMensagemTela(
        texto,
        tipo = "enviada",
        hora = horaAtual(),
        id = null,
        resposta = null,
        autor = null
    ) {

        if (!mensagens) {
            return;
        }


        const div =
            document.createElement(
                "div"
            );


        div.className =
            `mensagem ${tipo}`;


        div.dataset.mensagemId =
            id ||
            gerarIdMensagem();


        div.style.position =
            "relative";


        div.style.paddingRight =
            "58px";


        const autorExibido =
            autor ||
            (tipo === "enviada" ? "Você" : contatoAtual || "Contato");

        if (autorExibido) {

            const autorElemento =
                document.createElement("strong");


            autorElemento.className =
                "autor-mensagem";


            autorElemento.textContent =
                autorExibido;


            div.appendChild(autorElemento);
        }


        if (resposta) {

            const citacao =
                document.createElement(
                    "div"
                );


            citacao.className =
                "citacao-mensagem";


            const autorCitacao =
                document.createElement(
                    "strong"
                );


            autorCitacao.className =
                "citacao-autor";


            autorCitacao.textContent =
                resposta.autor || "Mensagem";


            const textoCitado =
                document.createElement(
                    "span"
                );


            textoCitado.className =
                "citacao-texto";


            textoCitado.textContent =
                resposta.texto || "Mídia";


            citacao.append(
                autorCitacao,
                textoCitado
            );


            div.appendChild(
                citacao
            );
        }



        /* ====================================================
           TEXTO
        ==================================================== */

        const conteudo =
            document.createElement(
                "div"
            );


        conteudo.className =
            "conteudo-mensagem";


        conteudo.textContent =
            texto;


        div.appendChild(
            conteudo
        );



        /* ====================================================
           HORA
        ==================================================== */

        const horaElemento =
            document.createElement(
                "time"
            );


        horaElemento.textContent =
            hora;


        div.appendChild(
            horaElemento
        );



        /* ====================================================
           BOTÃO X
        ==================================================== */

        const btnExcluir =
            document.createElement(
                "button"
            );


        btnExcluir.type =
            "button";


        btnExcluir.className =
            "btn-apagar-mensagem";


        btnExcluir.textContent =
            "✕";


        btnExcluir.title =
            "Apagar mensagem";


        btnExcluir.setAttribute(
            "aria-label",
            "Apagar mensagem"
        );


        btnExcluir.style.position =
            "absolute";


        btnExcluir.style.top =
            "4px";


        btnExcluir.style.right =
            "4px";


        btnExcluir.style.zIndex =
            "20";


        btnExcluir.style.width =
            "22px";


        btnExcluir.style.height =
            "22px";


        btnExcluir.style.padding =
            "0";


        btnExcluir.style.margin =
            "0";


        btnExcluir.style.border =
            "none";


        btnExcluir.style.borderRadius =
            "4px";


        btnExcluir.style.background =
            "#ff0000";


        btnExcluir.style.color =
            "#ffffff";


        btnExcluir.style.fontWeight =
            "bold";


        btnExcluir.style.fontSize =
            "13px";


        btnExcluir.style.cursor =
            "pointer";


        btnExcluir.style.lineHeight =
            "22px";


        btnExcluir.addEventListener(
            "click",
            evento => {

                evento.preventDefault();

                evento.stopPropagation();


                apagarMensagemTexto(
                    div.dataset.mensagemId,
                    div
                );
            }
        );


        div.appendChild(
            btnExcluir
        );


        adicionarBotaoResposta(div);


        mensagens.appendChild(
            div
        );
    }



    /* ========================================================
       CARREGAR MENSAGENS
    ======================================================== */

    async function carregarMensagens(buscarHistoricoServidor = true) {

        if (!mensagens) {
            return;
        }


        mensagens.innerHTML =
            "";


        if (!contatoAtual) {
            return;
        }


        const contatoCarregado =
            contatoAtual;

        const chaveAtual =
            chaveMensagens(contatoCarregado);


        let dados = [];


        try {

            dados =
                JSON.parse(
                    localStorage.getItem(
                        chaveAtual
                    ) || "[]"
                );

        } catch (erro) {

            dados =
                [];
        }


        /* ====================================================
           CORRIGIR MENSAGENS ANTIGAS SEM ID
        ==================================================== */

        let houveAlteracao =
            false;


        dados.forEach(
            item => {

                if (!item.id) {

                    item.id =
                        gerarIdMensagem();

                    houveAlteracao =
                        true;
                }

                if (!item.data) {

                    item.data =
                        new Date()
                            .toISOString();

                    houveAlteracao =
                        true;
                }
            }
        );


        if (houveAlteracao) {

            localStorage.setItem(
                chaveAtual,
                JSON.stringify(
                    dados
                )
            );
        }



        /* ====================================================
           MÍDIAS
        ==================================================== */

        let midias = [];


        try {

            midias =
                await buscarMidiasDoContato(
                    obterUsuarioAtual(),
                    contatoCarregado
                );

        } catch (erro) {

            console.error(
                "Erro ao buscar mídias:",
                erro
            );
        }


        if (
            contatoAtual !==
            contatoCarregado
        ) {

            return;
        }



        /* ====================================================
           UNIR TEXTO + MÍDIA
        ==================================================== */

        const itens = [];


        dados.forEach(
            item => {

                itens.push({

                    tipoItem:
                        "texto",

                    data:
                        item.data ||
                        new Date()
                            .toISOString(),

                    dados:
                        item
                });
            }
        );


        midias.forEach(
            item => {

                itens.push({

                    tipoItem:
                        "midia",

                    data:
                        item.data ||
                        new Date()
                            .toISOString(),

                    dados:
                        item
                });
            }
        );


        itens.sort(
            (a, b) =>
                new Date(a.data) -
                new Date(b.data)
        );



        /* ====================================================
           RENDERIZAR
        ==================================================== */

        itens.forEach(
            item => {

                if (
                    item.tipoItem ===
                    "texto"
                ) {

                    adicionarMensagemTela(

                        item.dados.texto,

                        item.dados.tipo ||
                        "enviada",

                        item.dados.hora ||
                        horaAtual(),

                        item.dados.id,

                        item.dados.resposta || null,

                        item.dados.autorContato || null
                    );

                } else {

                    criarMensagemMidia(
                        item.dados
                    );
                }
            }
        );



        rolarMensagens();
    }



    /* ========================================================
       RESPOSTA AUTOMÁTICA DO CONTATO
    ======================================================== */

    function respostaAutomaticaContato(textoOuMensagem) {

        const texto =
            typeof textoOuMensagem === "object" && textoOuMensagem !== null
                ? textoOuMensagem.texto || textoOuMensagem.mensagem || textoOuMensagem.conteudo || ""
                : String(textoOuMensagem || "");


        const frase =
            String(texto)
                .trim()
                .toLowerCase();


        if (!frase) {
            return "Recebi sua mensagem...";
        }

        if (
            frase.includes("oi") ||
            frase.includes("olá") ||
            frase.includes("ola")
        ) {
            return "Oi! Tudo bem?";
        }

        if (
            frase.includes("bom") ||
            frase.includes("tudo bem") ||
            frase.includes("ok") ||
            frase.includes("certo")
        ) {
            return "Tudo certo! Vou verificar isso.";
        }

        if (
            frase.includes("obrigado") ||
            frase.includes("valeu")
        ) {
            return "De nada!";
        }

        if (
            frase.includes("quando") ||
            frase.includes("hoje") ||
            frase.includes("agora")
        ) {
            return "Assim que possível, vou responder.";
        }

        if (
            frase.includes("imagem") ||
            frase.includes("foto") ||
            frase.includes("anexo")
        ) {
            return "Claro, vou enviar assim que puder.";
        }

        return "Recebi sua mensagem...";
    }


    function adicionarRespostaAutomatica(
        textoOuMensagem,
        contatoDestino = contatoAtual,
        conversaAgrupada = null
    ) {

        const mensagemEntrada =
            typeof textoOuMensagem === "object" && textoOuMensagem !== null
                ? textoOuMensagem
                : { texto: textoOuMensagem };


        const texto =
            mensagemEntrada.texto ||
            mensagemEntrada.mensagem ||
            mensagemEntrada.conteudo ||
            "";


        const contatoFinal =
            contatoDestino ||
            mensagemEntrada.remetente ||
            mensagemEntrada.destinatario ||
            contatoAtual;


        if (!contatoFinal) {
            return;
        }


        const respostaTexto =
            respostaAutomaticaContato(mensagemEntrada);


        const dadosUsuarioAtual =
            obterDadosUsuarioAtual();

        const mensagemRecebida = {
            id: gerarIdMensagem(),
            remetente: contatoFinal,
            setorRemetente: obterSetorContato(contatoFinal),
            destinatario: dadosUsuarioAtual.nome,
            setorDestinatario: dadosUsuarioAtual.setor,
            texto: respostaTexto,
            tipo: "recebida",
            autorContato: contatoFinal,
            hora: horaAtual(),
            data: new Date().toISOString()
        };


        let dados = [];

        try {

            dados =
                JSON.parse(
                    localStorage.getItem(
                        chaveMensagens(contatoFinal)
                    ) || "[]"
                );

        } catch (erro) {

            dados = [];
        }


        dados.push(
            mensagemRecebida
        );


        localStorage.setItem(
            chaveMensagens(contatoFinal),
            JSON.stringify(
                dados
            )
        );


        if (conversaAgrupada && conversaAgrupada !== contatoFinal) {

            let mensagensAgrupadas = [];


            try {

                mensagensAgrupadas =
                    JSON.parse(
                        localStorage.getItem(
                            chaveMensagens(conversaAgrupada)
                        ) || "[]"
                    );

            } catch (erro) {

                mensagensAgrupadas = [];
            }


            mensagensAgrupadas.push({
                ...mensagemRecebida,
                autorContato: contatoFinal
            });


            localStorage.setItem(
                chaveMensagens(conversaAgrupada),
                JSON.stringify(mensagensAgrupadas)
            );
        }


        if (contatoAtual === contatoFinal) {


            adicionarMensagemTela(
                mensagemRecebida.texto,
                mensagemRecebida.tipo,
                mensagemRecebida.hora,
                mensagemRecebida.id,
                null,
                mensagemRecebida.autorContato
            );


            rolarMensagens();

        } else if (conversaAgrupada && contatoAtual === conversaAgrupada) {

            adicionarMensagemTela(
                mensagemRecebida.texto,
                mensagemRecebida.tipo,
                mensagemRecebida.hora,
                mensagemRecebida.id,
                null,
                contatoFinal
            );


            rolarMensagens();
        }
    }


    function enviarTextoParaTodos(texto, resposta = null) {

        const contatosDestino =
            Array.from(
                document.querySelectorAll(
                    "#lista-usuarios .usuario:not([data-todos='true'])"
                )
            ).filter(contato => contato.dataset.contato);


        if (contatosDestino.length === 0) {

            alert(
                "Não há contatos disponíveis para enviar a mensagem."
            );

            return false;
        }


        const mensagemAgrupada =
            salvarMensagem(
                texto,
                "enviada",
                resposta,
                "Todos"
            );


        adicionarMensagemTela(
            mensagemAgrupada.texto,
            mensagemAgrupada.tipo,
            mensagemAgrupada.hora,
            mensagemAgrupada.id,
            mensagemAgrupada.resposta || null
        );


        limparResposta();


        contatosDestino.forEach(contato => {

            salvarMensagem(
                texto,
                "enviada",
                resposta,
                contato.dataset.contato
            );
        });


        const payload = {
            text: texto,
            targetSector: "Todos",
            targetName: "Todos",
            reply: resposta ? {
                id: resposta.id,
                texto: resposta.texto,
                autor: resposta.autor
            } : null
        };

        if (window.socketClient) {
            window.socketClient.sendMessage(
                payload,
                respostaSocket => {
                    if (!respostaSocket || respostaSocket.ok === false) {
                        console.warn("Mensagem para todos não foi confirmada pelo servidor.");
                    }
                }
            );
        }


        contatosDestino.forEach((contato, indice) => {

            const nomeContato =
                contato.dataset.contato;


            window.setTimeout(
                () => {
                    adicionarRespostaAutomatica(
                        texto,
                        nomeContato,
                        "Todos"
                    );
                },
                700 + indice * 250
            );
        });


        rolarMensagens();

        return true;
    }


    

    /* ========================================================
       ENVIAR TEXTO
    ======================================================== */

    function enviarTexto(texto) {

        if (!mensagem) {
            return false;
        }


        const textoLimpo =
            String(texto ?? "").trim();


        if (!textoLimpo) {
            return false;
        }


        if (!contatoAtual) {
            alert(
                "Selecione um contato primeiro."
            );

            return false;
        }


        if (contatoAtual === "Todos") {

            const respostaAtual =
                mensagemEmResposta;


            const enviado =
                enviarTextoParaTodos(
                    textoLimpo,
                    respostaAtual
                );


            if (enviado) {
                limparResposta();
            }


            return enviado;
        }

        const resposta =
            mensagemEmResposta;

        const novaMensagem =
            salvarMensagem(
                textoLimpo,
                "enviada",
                resposta
            );


        adicionarMensagemTela(
            novaMensagem.texto,
            novaMensagem.tipo,
            novaMensagem.hora,
            novaMensagem.id,
            novaMensagem.resposta || null
        );


        limparResposta();


        if (window.socketClient) {
            window.socketClient.sendMessage(
                {
                    text: textoLimpo,
                    targetUser: contatoAtual,
                    targetName: contatoAtual,
                    targetSector: obterSetorContato(contatoAtual),
                    reply: resposta ? {
                        id: resposta.id,
                        texto: resposta.texto,
                        autor: resposta.autor
                    } : null
                },
                respostaSocket => {
                    if (!respostaSocket || respostaSocket.ok === false) {
                        console.warn("Mensagem não confirmada pelo servidor.");
                    }
                }
            );
        }


        rolarMensagens();


        const contatoDoEnvio =
            contatoAtual;


        window.setTimeout(
            () => {
                adicionarRespostaAutomatica(
                    textoLimpo,
                    contatoDoEnvio
                );
            },
            700
        );

        return true;
    }


    function limparResposta() {

        mensagemEmResposta =
            null;


        if (barraResposta) {

            barraResposta.hidden =
                true;
        }


        if (textoResposta) {

            textoResposta.textContent =
                "";
        }


        if (sugestoesResposta) {

            sugestoesResposta.hidden =
                true;
        }
    }


    function prepararResposta(elementoMensagem) {

        const conteudo =
            elementoMensagem.querySelector(
                ".conteudo-mensagem"
            );


        const nomeArquivo =
            elementoMensagem.querySelector(
                ".nome-arquivo"
            );


        const autorMensagem =
            elementoMensagem.querySelector(
                ".autor-mensagem"
            )?.textContent?.trim() ||
            (elementoMensagem.classList.contains("enviada") ? "Você" : "");


        const texto =
            String(
                conteudo?.textContent ||
                nomeArquivo?.textContent ||
                ""
            ).trim() ||
            (elementoMensagem.querySelector("video") ? "Vídeo" :
                elementoMensagem.querySelector("audio") ? "Áudio" :
                    elementoMensagem.querySelector("img") ? "Imagem" : "Mídia");


        const autorResposta =
            autorMensagem ||
            (elementoMensagem.classList.contains("enviada") ? "Você" : (contatoAtual || "Contato"));


        mensagemEmResposta = {
            id:
                elementoMensagem.dataset.mensagemId ||
                elementoMensagem.dataset.midiaId ||
                "",
            texto,
            autor:
                autorResposta
        };


        if (textoResposta) {

            textoResposta.textContent =
                `${mensagemEmResposta.autor}: ${texto}`;
        }


        if (barraResposta) {

            barraResposta.hidden =
                false;
        }

        if (sugestoesResposta) {

            sugestoesResposta.hidden =
                false;
        }


        mensagem?.focus();
    }


    function adicionarReacao(elementoMensagem, emoji) {

        const reacoesExistentes =
            elementoMensagem.querySelectorAll(
                ".reacao-mensagem"
            );


        const reacaoAtual =
            Array.from(reacoesExistentes).find(
                item => item.dataset.emoji === emoji
            );


        if (reacaoAtual) {

            reacaoAtual.remove();
            return;
        }


        const badge =
            document.createElement("span");


        badge.className =
            "reacao-mensagem";


        badge.dataset.emoji =
            emoji;


        badge.textContent =
            emoji;


        badge.title =
            "Reação";


        badge.style.position =
            "absolute";


        badge.style.bottom =
            "8px";


        badge.style.right =
            "10px";


        badge.style.background =
            "rgba(0, 0, 0, 0.35)";


        badge.style.borderRadius =
            "999px";


        badge.style.padding =
            "2px 6px";


        badge.style.fontSize =
            "11px";


        badge.style.lineHeight =
            "1.4";


        elementoMensagem.appendChild(
            badge
        );
    }


    function adicionarBotaoResposta(elementoMensagem) {

        const btnResponder =
            document.createElement(
                "button"
            );


        btnResponder.type =
            "button";


        btnResponder.className =
            "btn-responder-mensagem";


        btnResponder.textContent =
            "↩";


        btnResponder.title =
            "Responder mensagem";


        btnResponder.setAttribute(
            "aria-label",
            "Responder mensagem"
        );


        elementoMensagem.appendChild(
            btnResponder
        );


        const btnReagir =
            document.createElement(
                "button"
            );


        btnReagir.type =
            "button";


        btnReagir.className =
            "btn-reagir-mensagem";


        btnReagir.textContent =
            "🙂";


        btnReagir.title =
            "Reagir à mensagem";


        btnReagir.setAttribute(
            "aria-label",
            "Reagir à mensagem"
        );


        btnReagir.style.position =
            "absolute";


        btnReagir.style.top =
            "4px";


        btnReagir.style.right =
            "56px";


        btnReagir.style.zIndex =
            "20";


        btnReagir.style.width =
            "22px";


        btnReagir.style.height =
            "22px";


        btnReagir.style.padding =
            "0";


        btnReagir.style.margin =
            "0";


        btnReagir.style.border =
            "none";


        btnReagir.style.borderRadius =
            "4px";


        btnReagir.style.background =
            "#37474f";


        btnReagir.style.color =
            "#fff";


        btnReagir.style.cursor =
            "pointer";


        btnReagir.style.lineHeight =
            "22px";


        btnReagir.addEventListener(
            "click",
            evento => {

                evento.preventDefault();
                evento.stopPropagation();

                const emojis =
                    ["👍", "❤️", "😂", "🎉", "😮", "😢"];


                const indiceAtual =
                    emojis.indexOf(
                        elementoMensagem.dataset.ultimaReacao || ""
                    );


                const proximoIndice =
                    (indiceAtual + 1) % emojis.length;


                const emojiEscolhida =
                    emojis[proximoIndice];


                elementoMensagem.dataset.ultimaReacao =
                    emojiEscolhida;


                adicionarReacao(
                    elementoMensagem,
                    emojiEscolhida
                );
            }
        );


        elementoMensagem.appendChild(
            btnReagir
        );
    }


    if (mensagens) {

        mensagens.addEventListener(
            "click",
            evento => {

                const btnResponder =
                    evento.target.closest(
                        ".btn-responder-mensagem"
                    );


                if (btnResponder) {

                    const elementoMensagem =
                        btnResponder.closest(
                            ".mensagem"
                        );


                    if (elementoMensagem) {

                        prepararResposta(
                            elementoMensagem
                        );
                    }

                    return;
                }


                const btnReagir =
                    evento.target.closest(
                        ".btn-reagir-mensagem"
                    );


                if (btnReagir) {

                    const elementoMensagem =
                        btnReagir.closest(
                            ".mensagem"
                        );


                    if (elementoMensagem) {

                        const emojis =
                            ["👍", "❤️", "😂", "🎉", "😮", "😢"];


                        const indiceAtual =
                            emojis.indexOf(
                                elementoMensagem.dataset.ultimaReacao || ""
                            );


                        const proximoIndice =
                            (indiceAtual + 1) % emojis.length;


                        const emojiEscolhida =
                            emojis[proximoIndice];


                        elementoMensagem.dataset.ultimaReacao =
                            emojiEscolhida;


                        adicionarReacao(
                            elementoMensagem,
                            emojiEscolhida
                        );
                    }
                }
            }
        );
    }


    btnCancelarResposta?.addEventListener(
        "click",
        limparResposta
    );


    sugestoesResposta?.querySelectorAll("button")?.forEach(
        botao => {
            botao.addEventListener(
                "click",
                () => {
                    if (!mensagem) {
                        return;
                    }

                    mensagem.value =
                        botao.dataset.resposta || "";

                    mensagem.focus();
                    mensagem.setSelectionRange(
                        mensagem.value.length,
                        mensagem.value.length
                    );
                }
            );
        }
    );


    function enviarMensagem() {

        if (!mensagem) {
            return;
        }


        const texto =
            mensagem.value.trim();


        if (!enviarTexto(texto)) {
            return;
        }


        mensagem.value =
            "";


        mensagem.focus();
    }


    /* ========================================================
       ENVIO EM LOTE
    ======================================================== */

    function spam(
        message,
        loop,
        delay = 1000
    ) {

        const quantidade =
            Number.parseInt(
                loop,
                10
            );


        const intervalo =
            Number(delay);


        if (
            !Number.isInteger(quantidade) ||
            quantidade <= 0
        ) {
            throw new Error(
                "loop deve ser um inteiro maior que zero."
            );
        }


        if (
            !Number.isFinite(intervalo) ||
            intervalo < 250
        ) {
            throw new Error(
                "delay deve ser de pelo menos 250 ms."
            );
        }


        if (!contatoAtual) {
            alert(
                "Selecione um contato primeiro."
            );

            return;
        }


        const texto =
            String(message ?? "").trim();


        if (!texto) {
            return;
        }


        const contatoDoEnvio =
            contatoAtual;


        for (
            let i = 0;
            i < quantidade;
            i++
        ) {

            window.setTimeout(
                () => {

                    if (
                        contatoAtual !==
                        contatoDoEnvio
                    ) {
                        return;
                    }


                    enviarTexto(texto);
                },
                intervalo * i
            );
        }
    }


    window.afmChat =
        window.afmChat || {};


    window.afmChat.enviarTexto =
        enviarTexto;


    window.afmChat.spam =
        spam;


    /* ========================================================
       BOTÃO ENVIAR
    ======================================================== */

    if (btnEnviar) {

        btnEnviar.addEventListener(
            "click",
            enviarMensagem
        );
    }



    /* ========================================================
       ENTER
    ======================================================== */

    if (mensagem) {

        mensagem.addEventListener(
            "keydown",
            evento => {

                if (
                    evento.key ===
                    "Enter" &&
                    !evento.shiftKey
                ) {

                    evento.preventDefault();

                    enviarMensagem();
                }
            }
        );
    }



    /* ========================================================
       ROLAR
    ======================================================== */

    function rolarMensagens() {

        if (!mensagens) {
            return;
        }


        mensagens.scrollTop =
            mensagens.scrollHeight;
    }



    /* ========================================================
       SALVAR MÍDIA
    ======================================================== */

    function salvarMidiaNoBanco(
        arquivo,
        tipoForcado = null,
        nomeForcado = null
    ) {

        return new Promise(
            async (resolve, reject) => {

                try {

                    const db =
                        bancoMidias ||
                        await abrirBancoMidias();


                    let tipo =
                        tipoForcado;


                    if (!tipo) {

                        if (
                            arquivo.type.startsWith(
                                "image/"
                            )
                        ) {

                            tipo =
                                "imagem";

                        } else if (
                            arquivo.type.startsWith(
                                "video/"
                            )
                        ) {

                            tipo =
                                "video";

                        } else if (
                            arquivo.type.startsWith(
                                "audio/"
                            )
                        ) {

                            tipo =
                                "audio";

                        } else {

                            throw new Error(
                                "Tipo não suportado."
                            );
                        }
                    }


                    const registro = {

                        usuario:
                            obterUsuarioAtual(),

                        contato:
                            obterContatoAtual(),

                        setor:
                            obterSetorAtual(),

                        tipo:
                            tipo,

                        nome:
                            nomeForcado ||
                            arquivo.name ||
                            `arquivo-${Date.now()}`,

                        mime:
                            arquivo.type ||
                            "application/octet-stream",

                        tamanho:
                            arquivo.size,

                        arquivo:
                            arquivo,

                        data:
                            new Date()
                                .toISOString(),

                        hora:
                            horaAtual()
                    };


                    const transacao =
                        db.transaction(
                            [NOME_STORE],
                            "readwrite"
                        );


                    const store =
                        transacao.objectStore(
                            NOME_STORE
                        );


                    const request =
                        store.add(
                            registro
                        );


                    request.onsuccess =
                        () => {

                            resolve({

                                ...registro,

                                id:
                                    request.result
                            });
                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );
                        };

                } catch (erro) {

                    reject(
                        erro
                    );
                }
            }
        );
    }



    /* ========================================================
       BUSCAR MÍDIAS
    ======================================================== */

    function buscarMidiasDoContato(
        usuarioInformado,
        contatoInformado
    ) {

        return new Promise(
            async (resolve, reject) => {

                try {

                    const db =
                        bancoMidias ||
                        await abrirBancoMidias();


                    const transacao =
                        db.transaction(
                            [NOME_STORE],
                            "readonly"
                        );


                    const store =
                        transacao.objectStore(
                            NOME_STORE
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        () => {

                            const resultados =
                                request.result
                                    .filter(
                                        item => {

                                            return (

                                                item.usuario ===
                                                usuarioInformado

                                                &&

                                                item.contato ===
                                                contatoInformado

                                            );
                                        }
                                    );


                            resultados.sort(
                                (a, b) => {

                                    return (
                                        new Date(a.data) -
                                        new Date(b.data)
                                    );
                                }
                            );


                            resolve(
                                resultados
                            );
                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );
                        };

                } catch (erro) {

                    reject(
                        erro
                    );
                }
            }
        );
    }



    /* ========================================================
       APAGAR MÍDIA DO INDEXEDDB
    ======================================================== */

    function apagarMidiaDoBanco(
        id
    ) {

        return new Promise(
            async (resolve, reject) => {

                try {

                    const db =
                        bancoMidias ||
                        await abrirBancoMidias();


                    const transacao =
                        db.transaction(
                            [NOME_STORE],
                            "readwrite"
                        );


                    const store =
                        transacao.objectStore(
                            NOME_STORE
                        );


                    const request =
                        store.delete(
                            Number(id)
                        );


                    request.onsuccess =
                        () => {

                            resolve(
                                true
                            );
                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );
                        };

                } catch (erro) {

                    reject(
                        erro
                    );
                }
            }
        );
    }



    /* ========================================================
       APAGAR MÍDIA
    ======================================================== */

    async function excluirMensagemMidia(
        registro,
        elementoMensagem
    ) {

        if (
            !registro ||
            registro.id === undefined ||
            registro.id === null
        ) {

            alert(
                "Não foi possível identificar esta mídia."
            );

            return;
        }


        let nomeTipo =
            "mídia";


        if (
            registro.tipo ===
            "imagem"
        ) {

            nomeTipo =
                "imagem";

        } else if (
            registro.tipo ===
            "video"
        ) {

            nomeTipo =
                "vídeo";

        } else if (
            registro.tipo ===
            "audio"
        ) {

            nomeTipo =
                "áudio";
        }


        const confirmar =
            confirm(
                `Deseja apagar esta ${nomeTipo}?`
            );


        if (!confirmar) {
            return;
        }


        try {

            await apagarMidiaDoBanco(
                registro.id
            );


            if (
                elementoMensagem &&
                elementoMensagem.parentNode
            ) {

                elementoMensagem.remove();
            }


            if (
                elementoMensagem &&
                elementoMensagem.dataset.url
            ) {

                URL.revokeObjectURL(
                    elementoMensagem.dataset.url
                );
            }

        } catch (erro) {

            console.error(
                "Erro ao apagar mídia:",
                erro
            );


            alert(
                "Não foi possível apagar a mídia."
            );
        }
    }



    /* ========================================================
       CRIAR MENSAGEM DE MÍDIA
    ======================================================== */

    function criarMensagemMidia(
        registro
    ) {

        if (!mensagens) {
            return;
        }


        if (
            !registro ||
            !registro.arquivo
        ) {

            return;
        }


        const url =
            URL.createObjectURL(
                registro.arquivo
            );


        const mensagemDiv =
            document.createElement(
                "div"
            );


        mensagemDiv.className =
            "mensagem enviada";


        mensagemDiv.style.position =
            "relative";


        mensagemDiv.dataset.midiaId =
            registro.id;


        mensagemDiv.dataset.mensagemId =
            registro.id;


        mensagemDiv.dataset.url =
            url;



        /* ====================================================
           CONTAINER
        ==================================================== */

        const midiaEnviada =
            document.createElement(
                "div"
            );


        midiaEnviada.className =
            "midia-enviada";


        midiaEnviada.style.position =
            "relative";


        midiaEnviada.style.display =
            "inline-block";



        /* ====================================================
           BOTÃO X
        ==================================================== */

        const btnExcluir =
            document.createElement(
                "button"
            );


        btnExcluir.type =
            "button";


        btnExcluir.className =
            "btn-apagar-midia";


        btnExcluir.textContent =
            "✕";


        btnExcluir.title =
            "Apagar mídia";


        btnExcluir.setAttribute(
            "aria-label",
            "Apagar mídia"
        );


        btnExcluir.style.position =
            "absolute";


        btnExcluir.style.top =
            "5px";


        btnExcluir.style.right =
            "5px";


        btnExcluir.style.zIndex =
            "999";


        btnExcluir.style.width =
            "28px";


        btnExcluir.style.height =
            "28px";


        btnExcluir.style.padding =
            "0";


        btnExcluir.style.border =
            "none";


        btnExcluir.style.borderRadius =
            "5px";


        btnExcluir.style.background =
            "#ff0000";


        btnExcluir.style.color =
            "#ffffff";


        btnExcluir.style.fontWeight =
            "bold";


        btnExcluir.style.fontSize =
            "16px";


        btnExcluir.style.cursor =
            "pointer";


        btnExcluir.style.lineHeight =
            "28px";


        btnExcluir.addEventListener(
            "click",
            evento => {

                evento.preventDefault();

                evento.stopPropagation();


                excluirMensagemMidia(
                    registro,
                    mensagemDiv
                );
            }
        );


        midiaEnviada.appendChild(
            btnExcluir
        );



        /* ====================================================
           IMAGEM
        ==================================================== */

        if (
            registro.tipo ===
            "imagem"
        ) {

            const imagem =
                document.createElement(
                    "img"
                );


            imagem.src =
                url;


            imagem.alt =
                registro.nome ||
                "Imagem";


            imagem.className =
                "imagem-conversa";


            imagem.style.cursor =
                "pointer";


            imagem.addEventListener(
                "click",
                evento => {

                    /*
                       Não abrir modal quando
                       o clique for no X.
                    */

                    if (
                        evento.target.closest(
                            ".btn-apagar-midia"
                        )
                    ) {

                        return;
                    }


                    abrirModalMidia(
                        registro,
                        url
                    );
                }
            );


            midiaEnviada.appendChild(
                imagem
            );


            const nomeArquivo =
                document.createElement(
                    "div"
                );


            nomeArquivo.className =
                "nome-arquivo";


            nomeArquivo.textContent =
                `🖼️ ${registro.nome}`;


            nomeArquivo.style.cursor =
                "pointer";


            nomeArquivo.addEventListener(
                "click",
                () => {

                    abrirModalMidia(
                        registro,
                        url
                    );
                }
            );


            midiaEnviada.appendChild(
                nomeArquivo
            );
        }



        /* ====================================================
           VÍDEO
        ==================================================== */

        else if (
            registro.tipo ===
            "video"
        ) {

            const video =
                document.createElement(
                    "video"
                );


            video.src =
                url;


            video.controls =
                true;


            video.preload =
                "metadata";


            video.className =
                "video-conversa";


            video.style.maxWidth =
                "100%";


            video.addEventListener(
                "click",
                evento => {

                    if (
                        evento.target.closest(
                            ".btn-apagar-midia"
                        )
                    ) {

                        return;
                    }
                }
            );


            midiaEnviada.appendChild(
                video
            );


            const nomeArquivo =
                document.createElement(
                    "div"
                );


            nomeArquivo.className =
                "nome-arquivo";


            nomeArquivo.textContent =
                `🎥 ${registro.nome}`;


            nomeArquivo.style.cursor =
                "pointer";


            nomeArquivo.addEventListener(
                "click",
                () => {

                    abrirModalMidia(
                        registro,
                        url
                    );
                }
            );


            midiaEnviada.appendChild(
                nomeArquivo
            );
        }



        /* ====================================================
           ÁUDIO
        ==================================================== */

        else if (
            registro.tipo ===
            "audio"
        ) {

            const audio =
                document.createElement(
                    "audio"
                );


            audio.src =
                url;


            audio.controls =
                true;


            audio.preload =
                "metadata";


            audio.className =
                "audio-conversa";


            audio.style.maxWidth =
                "100%";


            midiaEnviada.appendChild(
                audio
            );


            const nomeArquivo =
                document.createElement(
                    "div"
                );


            nomeArquivo.className =
                "nome-arquivo";


            nomeArquivo.textContent =
                `🎤 ${registro.nome}`;


            midiaEnviada.appendChild(
                nomeArquivo
            );
        }



        /* ====================================================
           HORA
        ==================================================== */

        const hora =
            document.createElement(
                "time"
            );


        hora.textContent =
            registro.hora ||
            horaAtual();


        mensagemDiv.appendChild(
            midiaEnviada
        );


        mensagemDiv.appendChild(
            hora
        );


        adicionarBotaoResposta(
            mensagemDiv
        );


        mensagens.appendChild(
            mensagemDiv
        );
    }



    /* ========================================================
       MODAL DE MÍDIA
    ======================================================== */

    const modalMidia =
        document.getElementById(
            "modal-midia"
        );


    const visualizadorMidia =
        document.getElementById(
            "visualizador-midia"
        );


    const fecharMidia =
        document.getElementById(
            "fechar-midia"
        );



    function abrirModalMidia(
        registro,
        url
    ) {

        if (
            !modalMidia ||
            !visualizadorMidia
        ) {

            /*
               Caso o modal não exista no HTML,
               abre diretamente em uma nova aba.
            */

            window.open(
                url,
                "_blank"
            );

            return;
        }


        visualizadorMidia.innerHTML =
            "";


        if (
            registro.tipo ===
            "imagem"
        ) {

            const img =
                document.createElement(
                    "img"
                );


            img.src =
                url;


            img.alt =
                registro.nome ||
                "Imagem";


            img.style.maxWidth =
                "100%";


            img.style.maxHeight =
                "80vh";


            visualizadorMidia.appendChild(
                img
            );
        }


        else if (
            registro.tipo ===
            "video"
        ) {

            const video =
                document.createElement(
                    "video"
                );


            video.src =
                url;


            video.controls =
                true;


            video.autoplay =
                true;


            video.style.maxWidth =
                "100%";


            video.style.maxHeight =
                "80vh";


            visualizadorMidia.appendChild(
                video
            );
        }


        else if (
            registro.tipo ===
            "audio"
        ) {

            const audio =
                document.createElement(
                    "audio"
                );


            audio.src =
                url;


            audio.controls =
                true;


            audio.autoplay =
                true;


            visualizadorMidia.appendChild(
                audio
            );
        }


        modalMidia.hidden =
            false;
    }



    if (fecharMidia) {

        fecharMidia.addEventListener(
            "click",
            () => {

                if (visualizadorMidia) {

                    visualizadorMidia.innerHTML =
                        "";
                }


                if (modalMidia) {

                    modalMidia.hidden =
                        true;
                }
            }
        );
    }



    if (modalMidia) {

        modalMidia.addEventListener(
            "click",
            evento => {

                if (
                    evento.target ===
                    modalMidia
                ) {

                    if (visualizadorMidia) {

                        visualizadorMidia.innerHTML =
                            "";
                    }


                    modalMidia.hidden =
                        true;
                }
            }
        );
    }



    /* ========================================================
       ANEXO IMAGEM / VÍDEO
    ======================================================== */

    const btnAnexo =
        document.getElementById(
            "btn-anexo"
        );


    const inputImagemVideo =
        document.getElementById(
            "input-imagem-video"
        );


    if (
        btnAnexo &&
        inputImagemVideo
    ) {

        btnAnexo.addEventListener(
            "click",
            () => {

                inputImagemVideo.accept =
                    "image/*,video/*";


                inputImagemVideo.click();
            }
        );


        inputImagemVideo.addEventListener(
            "change",
            async function () {

                const arquivo =
                    this.files?.[0];


                if (!arquivo) {
                    return;
                }


                if (!contatoAtual) {

                    alert(
                        "Selecione um contato primeiro."
                    );


                    this.value =
                        "";


                    return;
                }


                const ehImagem =
                    arquivo.type.startsWith(
                        "image/"
                    );


                const ehVideo =
                    arquivo.type.startsWith(
                        "video/"
                    );


                if (
                    !ehImagem &&
                    !ehVideo
                ) {

                    alert(
                        "Selecione uma imagem ou vídeo."
                    );


                    this.value =
                        "";


                    return;
                }


                try {

                    const registro =
                        await salvarMidiaNoBanco(
                            arquivo
                        );


                    criarMensagemMidia(
                        registro
                    );


                    rolarMensagens();

                } catch (erro) {

                    console.error(
                        erro
                    );


                    alert(
                        "Erro ao salvar mídia."
                    );

                } finally {

                    this.value =
                        "";
                }
            }
        );
    }



    /* ========================================================
       BOTÃO DE VÍDEO/ARQUIVO
    ======================================================== */

    const btnVideoArquivo =
        document.getElementById(
            "btn-video-arquivo"
        );


    if (
        btnVideoArquivo &&
        inputImagemVideo
    ) {

        btnVideoArquivo.addEventListener(
            "click",
            () => {

                inputImagemVideo.accept =
                    "video/*";


                inputImagemVideo.click();
            }
        );
    }



    /* ========================================================
       ÁUDIO
    ======================================================== */

    const btnAudio =
        document.getElementById(
            "btn-audio"
        );


    const btnPararAudio =
        document.getElementById(
            "btn-parar-audio"
        );


    const btnEnviarAudio =
        document.getElementById(
            "btn-enviar-audio"
        );


    let gravadorAudio =
        null;


    let partesAudio =
        [];


    let gravandoAudio =
        false;


    let audioPreparado =
        null;



    /* ========================================================
       BOTÕES DE ÁUDIO
    ======================================================== */

    function atualizarBotoesAudio() {

        if (btnAudio) {

            btnAudio.hidden =
                gravandoAudio ||
                !!audioPreparado;
        }


        if (btnPararAudio) {

            btnPararAudio.hidden =
                !gravandoAudio;
        }


        if (btnEnviarAudio) {

            btnEnviarAudio.hidden =
                !audioPreparado ||
                gravandoAudio;
        }
    }



    /* ========================================================
       INICIAR GRAVAÇÃO
    ======================================================== */

    async function iniciarGravacaoAudio() {

        if (!contatoAtual) {

            alert(
                "Selecione um contato primeiro."
            );

            return;
        }


        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices
                .getUserMedia
        ) {

            alert(
                "Seu navegador não suporta áudio."
            );

            return;
        }


        if (
            typeof MediaRecorder ===
            "undefined"
        ) {

            alert(
                "Seu navegador não suporta gravação."
            );

            return;
        }


        try {

            const stream =
                await navigator.mediaDevices
                    .getUserMedia({
                        audio: true
                    });


            partesAudio =
                [];


            let mimeType =
                "audio/webm";


            if (
                MediaRecorder.isTypeSupported(
                    "audio/webm;codecs=opus"
                )
            ) {

                mimeType =
                    "audio/webm;codecs=opus";

            } else if (
                MediaRecorder.isTypeSupported(
                    "audio/ogg;codecs=opus"
                )
            ) {

                mimeType =
                    "audio/ogg;codecs=opus";
            }


            gravadorAudio =
                new MediaRecorder(
                    stream,
                    {
                        mimeType
                    }
                );


            gravadorAudio.addEventListener(
                "dataavailable",
                evento => {

                    if (
                        evento.data &&
                        evento.data.size > 0
                    ) {

                        partesAudio.push(
                            evento.data
                        );
                    }
                }
            );


            gravadorAudio.addEventListener(
                "stop",
                () => {

                    const tipo =
                        gravadorAudio.mimeType ||
                        mimeType ||
                        "audio/webm";


                    const blob =
                        new Blob(
                            partesAudio,
                            {
                                type:
                                    tipo
                            }
                        );


                    stream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );


                    gravadorAudio =
                        null;


                    partesAudio =
                        [];


                    gravandoAudio =
                        false;


                    if (!blob.size) {

                        audioPreparado =
                            null;


                        atualizarBotoesAudio();

                        return;
                    }


                    audioPreparado =
                        blob;


                    atualizarBotoesAudio();
                }
            );


            gravadorAudio.start();


            gravandoAudio =
                true;


            atualizarBotoesAudio();

        } catch (erro) {

            console.error(
                "Erro no microfone:",
                erro
            );


            alert(
                "Não foi possível acessar o microfone."
            );
        }
    }



    /* ========================================================
       PARAR ÁUDIO
    ======================================================== */

    function pararGravacaoAudio() {

        if (
            !gravadorAudio ||
            gravadorAudio.state ===
                "inactive"
        ) {

            return;
        }


        gravadorAudio.stop();
    }



    /* ========================================================
       ENVIAR ÁUDIO
    ======================================================== */

    async function enviarAudioGravado() {

        if (!audioPreparado) {

            alert(
                "Nenhum áudio preparado."
            );

            return;
        }


        if (!contatoAtual) {

            alert(
                "Selecione um contato primeiro."
            );

            return;
        }


        try {

            const extensao =
                audioPreparado.type.includes(
                    "ogg"
                )
                    ? "ogg"
                    : "webm";


            const nomeArquivo =
                `audio-${Date.now()}.${extensao}`;


            const registro =
                await salvarMidiaNoBanco(
                    audioPreparado,
                    "audio",
                    nomeArquivo
                );


            criarMensagemMidia(
                registro
            );


            audioPreparado =
                null;


            atualizarBotoesAudio();


            rolarMensagens();

        } catch (erro) {

            console.error(
                "Erro ao enviar áudio:",
                erro
            );


            alert(
                "Não foi possível enviar o áudio."
            );
        }
    }



    if (btnAudio) {

        btnAudio.addEventListener(
            "click",
            iniciarGravacaoAudio
        );
    }


    if (btnPararAudio) {

        btnPararAudio.addEventListener(
            "click",
            pararGravacaoAudio
        );
    }


    if (btnEnviarAudio) {

        btnEnviarAudio.addEventListener(
            "click",
            enviarAudioGravado
        );
    }


    atualizarBotoesAudio();



    /* ========================================================
       EMOJIS
    ======================================================== */

    const btnEmoji =
        document.getElementById(
            "btn-emoji"
        );


    const painelEmoji =
        document.getElementById(
            "painel-emoji"
        );


    if (
        btnEmoji &&
        painelEmoji
    ) {

        btnEmoji.addEventListener(
            "click",
            () => {

                painelEmoji.hidden =
                    !painelEmoji.hidden;
            }
        );


        painelEmoji
            .querySelectorAll(
                "button"
            )
            .forEach(
                botao => {

                    botao.addEventListener(
                        "click",
                        () => {

                            if (mensagem) {

                                mensagem.value +=
                                    botao.textContent;

                                mensagem.focus();
                            }
                        }
                    );
                }
            );
    }



    /* ========================================================
       CHAMADA DE VÍDEO
    ======================================================== */

    const telaVideo =
        document.getElementById(
            "tela-video"
        );


    const videoCamera =
        document.getElementById(
            "video-camera"
        );


    const videoTela =
        document.getElementById(
            "video-tela"
        );


    const placeholderCamera =
        document.getElementById(
            "video-camera-placeholder"
        );


    const placeholderCompartilhamento =
        document.getElementById(
            "placeholder-compartilhamento"
        );


    const nomeVideoContato =
        document.getElementById(
            "nome-video-contato"
        );


    const setorVideoContato =
        document.getElementById(
            "setor-video-contato"
        );


    const nomeParticipanteVideo =
        document.getElementById(
            "nome-participante-video"
        );


    const setorParticipanteVideo =
        document.getElementById(
            "setor-participante-video"
        );


    const setorVideoVoce =
        document.getElementById(
            "setor-video-voce"
        );


    const statusVideoVoce =
        document.getElementById(
            "status-video-voce"
        );


    const statusParticipanteVideo =
        document.getElementById(
            "status-participante-video"
        );


    const avatarVideoContato =
        document.getElementById(
            "avatar-video-contato"
        );


    const btnCameraVideo =
        document.getElementById(
            "btn-camera-video"
        );


    const btnMicrofoneVideo =
        document.getElementById(
            "btn-microfone-video"
        );


    const btnCompartilharVideo =
        document.getElementById(
            "btn-compartilhar-video"
        );


    const btnDesligarVideo =
        document.getElementById(
            "btn-desligar-video"
        );


    const fecharVideo =
        document.getElementById(
            "fechar-video"
        );



    /* ========================================================
       DADOS DO VÍDEO
    ======================================================== */

    function atualizarDadosVideo() {

        if (nomeVideoContato) {

            nomeVideoContato.textContent =
                `📹 Chamada de vídeo: ${contatoAtual}`;
        }


        if (setorVideoContato) {

            setorVideoContato.textContent =
                `Setor: ${setorAtual}`;
        }


        if (nomeParticipanteVideo) {

            nomeParticipanteVideo.textContent =
                contatoAtual;
        }


        if (setorParticipanteVideo) {

            setorParticipanteVideo.textContent =
                `Setor: ${setorAtual}`;
        }


        if (setorVideoVoce) {

            setorVideoVoce.textContent =
                `Setor: ${sessao?.setor || "Todos"}`;
        }


        if (statusParticipanteVideo) {

            statusParticipanteVideo.textContent =
                "🟢 Conectado";
        }


        if (avatarVideoContato) {

            avatarVideoContato.textContent =
                "👤";
        }
    }



    /* ========================================================
       ABRIR VÍDEO
    ======================================================== */

    async function abrirChamadaVideo() {

        if (!contatoAtual) {

            alert(
                "Selecione um contato primeiro."
            );

            return;
        }


        atualizarDadosVideo();


        if (telaVideo) {

            telaVideo.hidden =
                false;
        }


        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices
                .getUserMedia
        ) {

            if (statusVideoVoce) {

                statusVideoVoce.textContent =
                    "🟡 Câmera indisponível";
            }

            return;
        }


        try {

            streamCamera =
                await navigator.mediaDevices
                    .getUserMedia({
                        video: true,
                        audio: true
                    });


            if (videoCamera) {

                videoCamera.srcObject =
                    streamCamera;


                videoCamera.hidden =
                    false;
            }


            if (placeholderCamera) {

                placeholderCamera.hidden =
                    true;
            }


            if (statusVideoVoce) {

                statusVideoVoce.textContent =
                    "🟢 Câmera e microfone ativos";
            }

        } catch (erro) {

            console.error(
                erro
            );


            if (videoCamera) {

                videoCamera.hidden =
                    true;
            }


            if (placeholderCamera) {

                placeholderCamera.hidden =
                    false;
            }


            if (statusVideoVoce) {

                statusVideoVoce.textContent =
                    "🟡 Câmera desligada";
            }


            alert(
                "Não foi possível acessar a câmera."
            );
        }
    }


    if (btnVideo) {

        btnVideo.addEventListener(
            "click",
            abrirChamadaVideo
        );
    }



    /* ========================================================
       CÂMERA
    ======================================================== */

    if (btnCameraVideo) {

        btnCameraVideo.addEventListener(
            "click",
            async () => {

                if (!streamCamera) {

                    try {

                        streamCamera =
                            await navigator
                                .mediaDevices
                                .getUserMedia({
                                    video: true,
                                    audio: true
                                });

                    } catch (erro) {

                        alert(
                            "Não foi possível acessar a câmera."
                        );

                        return;
                    }
                }


                const faixa =
                    streamCamera
                        .getVideoTracks()[0];


                if (!faixa) {
                    return;
                }


                faixa.enabled =
                    !faixa.enabled;


                if (faixa.enabled) {

                    if (videoCamera) {

                        videoCamera.hidden =
                            false;
                    }


                    if (placeholderCamera) {

                        placeholderCamera.hidden =
                            true;
                    }


                    if (statusVideoVoce) {

                        statusVideoVoce.textContent =
                            "🟢 Câmera ligada";
                    }

                } else {

                    if (videoCamera) {

                        videoCamera.hidden =
                            true;
                    }


                    if (placeholderCamera) {

                        placeholderCamera.hidden =
                            false;
                    }


                    if (statusVideoVoce) {

                        statusVideoVoce.textContent =
                            "🔴 Câmera desligada";
                    }
                }
            }
        );
    }



    /* ========================================================
       MICROFONE DO VÍDEO
    ======================================================== */

    if (btnMicrofoneVideo) {

        btnMicrofoneVideo.addEventListener(
            "click",
            () => {

                if (!streamCamera) {
                    return;
                }


                const faixa =
                    streamCamera
                        .getAudioTracks()[0];


                if (!faixa) {
                    return;
                }


                faixa.enabled =
                    !faixa.enabled;


                microfoneVideoAtivo =
                    faixa.enabled;


                btnMicrofoneVideo.textContent =
                    faixa.enabled
                        ? "🎤"
                        : "🔇";
            }
        );
    }



    /* ========================================================
       COMPARTILHAR TELA
    ======================================================== */

    async function compartilharTela() {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices
                .getDisplayMedia
        ) {

            alert(
                "Seu navegador não suporta compartilhamento de tela."
            );

            return;
        }


        try {

            streamTela =
                await navigator.mediaDevices
                    .getDisplayMedia({
                        video: true,
                        audio: true
                    });


            if (videoTela) {

                videoTela.srcObject =
                    streamTela;


                videoTela.hidden =
                    false;
            }


            if (
                placeholderCompartilhamento
            ) {

                placeholderCompartilhamento.hidden =
                    true;
            }


            const faixa =
                streamTela
                    .getVideoTracks()[0];


            if (faixa) {

                faixa.addEventListener(
                    "ended",
                    pararCompartilhamento
                );
            }

        } catch (erro) {

            console.log(
                "Compartilhamento cancelado."
            );
        }
    }



    function pararCompartilhamento() {

        if (streamTela) {

            streamTela
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );
        }


        streamTela =
            null;


        if (videoTela) {

            videoTela.srcObject =
                null;


            videoTela.hidden =
                true;
        }


        if (
            placeholderCompartilhamento
        ) {

            placeholderCompartilhamento.hidden =
                false;
        }
    }



    if (btnCompartilharVideo) {

        btnCompartilharVideo.addEventListener(
            "click",
            compartilharTela
        );
    }



    if (btnCompartilhar) {

        btnCompartilhar.addEventListener(
            "click",
            async () => {

                if (
                    telaVideo &&
                    !telaVideo.hidden
                ) {

                    await compartilharTela();

                    return;
                }


                if (!contatoAtual) {

                    alert(
                        "Selecione um contato primeiro."
                    );

                    return;
                }


                if (telaVideo) {

                    telaVideo.hidden =
                        false;
                }


                atualizarDadosVideo();


                await compartilharTela();
            }
        );
    }



    /* ========================================================
       ENCERRAR VÍDEO
    ======================================================== */

    function encerrarChamadaVideo() {

        if (streamCamera) {

            streamCamera
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );
        }


        streamCamera =
            null;


        if (videoCamera) {

            videoCamera.srcObject =
                null;


            videoCamera.hidden =
                true;
        }


        pararCompartilhamento();


        if (placeholderCamera) {

            placeholderCamera.hidden =
                false;
        }


        if (telaVideo) {

            telaVideo.hidden =
                true;
        }
    }



    if (btnDesligarVideo) {

        btnDesligarVideo.addEventListener(
            "click",
            encerrarChamadaVideo
        );
    }


    if (fecharVideo) {

        fecharVideo.addEventListener(
            "click",
            encerrarChamadaVideo
        );
    }



    /* ========================================================
       CHAMADA DE ÁUDIO
    ======================================================== */

    const telaLigacao =
        document.getElementById(
            "tela-ligacao"
        );


    const nomeLigacao =
        document.getElementById(
            "nome-ligacao-contato"
        );


    const setorLigacao =
        document.getElementById(
            "setor-ligacao"
        );


    const statusLigacao =
        document.getElementById(
            "status-ligacao"
        );


    const btnMicrofoneLigacao =
        document.getElementById(
            "btn-microfone-ligacao"
        );


    const btnDesligarLigacao =
        document.getElementById(
            "btn-desligar-ligacao"
        );


    const fecharLigacao =
        document.getElementById(
            "fechar-ligacao"
        );



    /* ========================================================
       ABRIR ÁUDIO
    ======================================================== */

    async function abrirChamadaAudio() {

        if (!contatoAtual) {

            alert(
                "Selecione um contato primeiro."
            );

            return;
        }


        if (nomeLigacao) {

            nomeLigacao.textContent =
                contatoAtual;
        }


        if (setorLigacao) {

            setorLigacao.textContent =
                `Setor: ${setorAtual}`;
        }


        if (statusLigacao) {

            statusLigacao.textContent =
                "🔄 Conectando...";
        }


        if (telaLigacao) {

            telaLigacao.hidden =
                false;
        }


        try {

            streamAudio =
                await navigator.mediaDevices
                    .getUserMedia({
                        audio: true
                    });


            if (statusLigacao) {

                statusLigacao.textContent =
                    "🟢 Em chamada";
            }

        } catch (erro) {

            console.error(
                erro
            );


            if (statusLigacao) {

                statusLigacao.textContent =
                    "🔴 Microfone indisponível";
            }


            alert(
                "Não foi possível acessar o microfone."
            );
        }
    }


    if (btnLigacao) {

        btnLigacao.addEventListener(
            "click",
            abrirChamadaAudio
        );
    }



    /* ========================================================
       MICROFONE ÁUDIO
    ======================================================== */

    if (btnMicrofoneLigacao) {

        btnMicrofoneLigacao.addEventListener(
            "click",
            () => {

                if (!streamAudio) {
                    return;
                }


                const faixa =
                    streamAudio
                        .getAudioTracks()[0];


                if (!faixa) {
                    return;
                }


                faixa.enabled =
                    !faixa.enabled;


                microfoneAudioAtivo =
                    faixa.enabled;


                btnMicrofoneLigacao.textContent =
                    faixa.enabled
                        ? "🎤"
                        : "🔇";


                if (statusLigacao) {

                    statusLigacao.textContent =
                        faixa.enabled
                            ? "🟢 Microfone ativo"
                            : "🔇 Microfone desligado";
                }
            }
        );
    }



    /* ========================================================
       ENCERRAR ÁUDIO
    ======================================================== */

    function encerrarChamadaAudio() {

        if (streamAudio) {

            streamAudio
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );
        }


        streamAudio =
            null;


        if (telaLigacao) {

            telaLigacao.hidden =
                true;
        }


        if (btnMicrofoneLigacao) {

            btnMicrofoneLigacao.textContent =
                "🎤";
        }


        microfoneAudioAtivo =
            true;
    }


    if (btnDesligarLigacao) {

        btnDesligarLigacao.addEventListener(
            "click",
            encerrarChamadaAudio
        );
    }


    if (fecharLigacao) {

        fecharLigacao.addEventListener(
            "click",
            encerrarChamadaAudio
        );
    }

    /* ========================================================
   NOVA CONVERSA
   SETOR → CONTATO
   SALVAR / RECARREGAR / APAGAR
======================================================== */

const btnNovaConversa =
    document.getElementById("btn-nova-conversa");

const modalNovaConversa =
    document.getElementById("modal-nova-conversa");

const fecharNovaConversa =
    document.getElementById("fechar-nova-conversa");

const selectSetorConversa =
    document.getElementById("select-setor-conversa");

const selectContatoConversa =
    document.getElementById("select-contato-conversa");

const abrirNovaConversa =
    document.getElementById("abrir-nova-conversa");

const CHAVE_NOVAS_CONVERSAS =
    "afmNovasConversas";

const CHAVE_CONTATOS_EXCLUIDOS =
    "afmContatosExcluidos";


/* ========================================================
   LISTA DE SETORES
======================================================== */

const setoresNovaConversa = [
    "Câmera TI",
    "DY",
    "Tecnologia",
    "Produção",
    "RH",
    "Financeiro",
    "PCP",
    "Manutenção",
    "Supervisão",
    "Segurança",
    "Portaria",
    "Almoxarife",
    "Mecânica",
    "Elétrica",
    "Administração",
    "Modelação",
    "Sala de Encarregado",
    "Compras",
    "Contabilidade",
    "Controladoria",
    "Engenharia",
    "Expedição",
    "Fiscal",
    "Gestão",
    "Informática",
    "Jurídico",
    "Logística",
    "Marketing",
    "Qualidade",
    "Vendas",
    "Comercial",
    "Diretoria",
    "Serviços Gerais",
    "Desenvolvimento",
    "Projetos",
    "Compras e Suprimentos",
    "Atendimento",
    "Meio Ambiente",
    "Laboratório",
    "Usinagem",
    "Corte",
    "Solda",
    "Manutenção Industrial",
    "Manutenção Elétrica",
    "Manutenção Mecânica",
    "Ambulatório"
];


/* ========================================================
   PREENCHER SELECT
======================================================== */

function preencherSelectConversa(select, textoInicial) {

    if (!select) return;

    select.innerHTML = "";

    const inicial =
        document.createElement("option");

    inicial.value = "";
    inicial.textContent = textoInicial;

    select.appendChild(inicial);

    setoresNovaConversa.forEach(setor => {

        const option =
            document.createElement("option");

        option.value = setor;
        option.textContent = setor;

        select.appendChild(option);
    });
}


/* ========================================================
   CARREGAR SETORES E CONTATOS
======================================================== */

function carregarSetoresNovaConversa() {

    preencherSelectConversa(
        selectSetorConversa,
        "Selecione o setor"
    );

    preencherSelectConversa(
        selectContatoConversa,
        "Selecione o contato"
    );

    if (selectContatoConversa) {
        selectContatoConversa.disabled = true;
    }

    if (abrirNovaConversa) {
        abrirNovaConversa.disabled = true;
    }
}


/* ========================================================
   ATUALIZAR CONTATO
======================================================== */

function atualizarContatoNovaConversa() {

    if (
        !selectSetorConversa ||
        !selectContatoConversa
    ) {
        return;
    }

    const setor =
        selectSetorConversa.value;

    if (!setor) {

        selectContatoConversa.value = "";

        selectContatoConversa.disabled = true;

        if (abrirNovaConversa) {
            abrirNovaConversa.disabled = true;
        }

        return;
    }

    /*
       O contato possui a mesma lista de setores.
    */

    selectContatoConversa.disabled = false;

    selectContatoConversa.value = setor;

    if (abrirNovaConversa) {
        abrirNovaConversa.disabled = false;
    }
}


/* ========================================================
   OBTER CONVERSAS SALVAS
======================================================== */

function obterNovasConversasSalvas() {

    try {

        const dados =
            JSON.parse(
                localStorage.getItem(
                    CHAVE_NOVAS_CONVERSAS
                ) || "[]"
            );

        return Array.isArray(dados)
            ? dados
            : [];

    } catch (erro) {

        console.error(
            "Erro ao carregar conversas:",
            erro
        );

        return [];
    }
}


/* ========================================================
   OBTER CONTATOS EXCLUÍDOS
======================================================== */

function obterContatosExcluidos() {

    try {

        const dados =
            JSON.parse(
                localStorage.getItem(
                    CHAVE_CONTATOS_EXCLUIDOS
                ) || "[]"
            );

        return Array.isArray(dados)
            ? dados
            : [];

    } catch (erro) {

        return [];
    }
}


/* ========================================================
   SALVAR NOVA CONVERSA
======================================================== */

function salvarNovaConversa(setor, contato) {

    let conversas =
        obterNovasConversasSalvas();

    const existe =
        conversas.some(conversa =>
            conversa.setor === setor &&
            conversa.contato === contato
        );

    if (!existe) {

        conversas.push({

            id: Date.now(),

            setor: setor,

            contato: contato,

            hora: horaAtual(),

            data: new Date().toISOString()

        });
    }

    localStorage.setItem(
        CHAVE_NOVAS_CONVERSAS,
        JSON.stringify(conversas)
    );


    /*
       Se o usuário recriar uma conversa
       que havia sido apagada, retirar da lista
       de excluídos.
    */

    let excluidos =
        obterContatosExcluidos();

    excluidos =
        excluidos.filter(
            nome => nome !== contato
        );

    localStorage.setItem(
        CHAVE_CONTATOS_EXCLUIDOS,
        JSON.stringify(excluidos)
    );
}


/* ========================================================
   CRIAR CONTATO NA LISTA
======================================================== */

function criarContatoNovaConversa(
    setor,
    contato,
    hora = null
) {

    if (!listaUsuarios) {
        return null;
    }


    /*
       Procurar contato existente.
    */

    const existente =
        Array.from(
            listaUsuarios.querySelectorAll(
                ".usuario"
            )
        ).find(usuario =>
            usuario.dataset.contato === contato &&
            usuario.dataset.setor === setor
        );


    if (existente) {
        return existente;
    }


    /* ==========================================
       BOTÃO DO CONTATO
    ========================================== */

    const novoContato =
        document.createElement("button");

    novoContato.type = "button";
    novoContato.className = "usuario";

    novoContato.dataset.contato =
        contato;

    novoContato.dataset.setor =
        setor;


    /* ==========================================
       INFORMAÇÕES
    ========================================== */

    const informacoes =
        document.createElement("span");

    informacoes.className =
        "informacoes-contato";


    const nome =
        document.createElement("strong");

    nome.textContent =
        contato;


    const setorTexto =
        document.createElement("small");

    setorTexto.textContent =
        `Setor: ${setor}`;


    informacoes.appendChild(nome);
    informacoes.appendChild(setorTexto);


    /* ==========================================
       HORA
    ========================================== */

    const horario =
        document.createElement("time");

    horario.textContent =
        hora || horaAtual();


    /* ==========================================
       BOTÃO X
    ========================================== */

    const btnApagar =
        document.createElement("span");

    btnApagar.className =
        "btn-apagar";

    btnApagar.textContent =
        "×";

    btnApagar.title =
        "Apagar conversa";

    btnApagar.setAttribute(
        "aria-label",
        "Apagar conversa"
    );


    /* ==========================================
       STATUS ONLINE
    ========================================== */

    const status =
        document.createElement("span");

    status.className =
        "status-online";

    status.textContent =
        "●";


    /* ==========================================
       MONTAR CONTATO
    ========================================== */

    novoContato.appendChild(
        informacoes
    );

    novoContato.appendChild(
        horario
    );

    novoContato.appendChild(
        btnApagar
    );

    novoContato.appendChild(
        status
    );


    /* ==========================================
       SELECIONAR CONTATO
    ========================================== */

    novoContato.addEventListener(
        "click",
        evento => {

            if (
                evento.target.closest(
                    ".btn-apagar"
                )
            ) {
                return;
            }

            selecionarContato(
                novoContato
            );
        }
    );


    /*
       Coloca no topo.
    */

    listaUsuarios.prepend(
        novoContato
    );

    return novoContato;
}


/* ========================================================
   RECARREGAR CONVERSAS APÓS F5
======================================================== */

function recarregarNovasConversas() {

    if (!listaUsuarios) {
        return;
    }

    const conversas =
        obterNovasConversasSalvas();

    const excluidos =
        obterContatosExcluidos();


    conversas.forEach(conversa => {

        if (
            !conversa ||
            !conversa.setor ||
            !conversa.contato
        ) {
            return;
        }


        /*
           Não recriar conversa apagada.
        */

        if (
            excluidos.includes(
                conversa.contato
            )
        ) {
            return;
        }


        criarContatoNovaConversa(
            conversa.setor,
            conversa.contato,
            conversa.hora
        );
    });
}


/* ========================================================
   APAGAR CONVERSA PELO X
======================================================== */

if (listaUsuarios) {

    listaUsuarios.addEventListener(
        "click",
        evento => {

            const botao =
                evento.target.closest(
                    ".btn-apagar"
                );

            if (!botao) {
                return;
            }

            evento.preventDefault();
            evento.stopPropagation();


            const contatoElemento =
                botao.closest(
                    ".usuario"
                );

            if (!contatoElemento) {
                return;
            }


            const nomeContato =
                contatoElemento.dataset.contato;

            const setorContato =
                contatoElemento.dataset.setor;


            const confirmar =
                confirm(
                    `Deseja apagar a conversa com "${nomeContato}"?`
                );


            if (!confirmar) {
                return;
            }


            /* ==========================================
               REMOVER DO LOCALSTORAGE
            ========================================== */

            let conversas =
                obterNovasConversasSalvas();

            conversas =
                conversas.filter(
                    conversa =>
                        !(
                            conversa.contato ===
                                nomeContato &&
                            conversa.setor ===
                                setorContato
                        )
                );


            localStorage.setItem(
                CHAVE_NOVAS_CONVERSAS,
                JSON.stringify(conversas)
            );


            /* ==========================================
               SALVAR COMO EXCLUÍDO
            ========================================== */

            let excluidos =
                obterContatosExcluidos();


            if (
                !excluidos.includes(
                    nomeContato
                )
            ) {

                excluidos.push(
                    nomeContato
                );
            }


            localStorage.setItem(
                CHAVE_CONTATOS_EXCLUIDOS,
                JSON.stringify(
                    excluidos
                )
            );


            /* ==========================================
               APAGAR MENSAGENS
            ========================================== */

            try {

                const usuarioAtual =
                    obterUsuarioAtual();

                const chave =
                    `afmMensagens_${usuarioAtual}_${nomeContato}`;

                localStorage.removeItem(
                    chave
                );

            } catch (erro) {

                console.warn(
                    "Não foi possível apagar mensagens:",
                    erro
                );
            }


            /* ==========================================
               REMOVER DA TELA
            ========================================== */

            contatoElemento.remove();


            /* ==========================================
               SE ERA A CONVERSA ABERTA
            ========================================== */

            if (
                contatoAtual ===
                nomeContato
            ) {

                contatoAtual = null;
                setorAtual = null;


                const primeiro =
                    document.querySelector(
                        "#lista-usuarios .usuario"
                    );


                if (primeiro) {

                    selecionarContato(
                        primeiro
                    );

                } else {

                    const titulo =
                        document.getElementById(
                            "nome-contato"
                        );

                    if (titulo) {

                        titulo.textContent =
                            "Nenhuma conversa";
                    }
                }
            }
        }
    );
}


/* ========================================================
   ABRIR MODAL
======================================================== */

if (
    btnNovaConversa &&
    modalNovaConversa
) {

    btnNovaConversa.addEventListener(
        "click",
        () => {

            modalNovaConversa.hidden =
                false;

            if (selectSetorConversa) {
                selectSetorConversa.value = "";
            }

            if (selectContatoConversa) {
                selectContatoConversa.value = "";
                selectContatoConversa.disabled = true;
            }

            if (abrirNovaConversa) {
                abrirNovaConversa.disabled = true;
            }
        }
    );
}


/* ========================================================
   FECHAR MODAL
======================================================== */

if (fecharNovaConversa) {

    fecharNovaConversa.addEventListener(
        "click",
        () => {

            if (modalNovaConversa) {

                modalNovaConversa.hidden =
                    true;
            }
        }
    );
}


/* ========================================================
   ALTERAR SETOR
======================================================== */

if (selectSetorConversa) {

    selectSetorConversa.addEventListener(
        "change",
        atualizarContatoNovaConversa
    );
}


/* ========================================================
   ALTERAR CONTATO
======================================================== */

if (selectContatoConversa) {

    selectContatoConversa.addEventListener(
        "change",
        () => {

            if (abrirNovaConversa) {

                abrirNovaConversa.disabled =
                    !selectContatoConversa.value;
            }
        }
    );
}


/* ========================================================
   ABRIR E SALVAR CONVERSA
======================================================== */

if (abrirNovaConversa) {

    abrirNovaConversa.addEventListener(
        "click",
        () => {

            const setor =
                selectSetorConversa
                    ? selectSetorConversa.value
                    : "";


            const contato =
                selectContatoConversa
                    ? selectContatoConversa.value
                    : "";


            if (!setor) {

                alert(
                    "Selecione um setor."
                );

                return;
            }


            if (!contato) {

                alert(
                    "Selecione um contato."
                );

                return;
            }


            /* Salvar */
            salvarNovaConversa(
                setor,
                contato
            );


            /* Procurar existente */
            let contatoEncontrado =
                Array.from(
                    document.querySelectorAll(
                        "#lista-usuarios .usuario"
                    )
                ).find(usuario =>
                    usuario.dataset.contato ===
                    contato &&
                    usuario.dataset.setor ===
                    setor
                );


            /* Criar se não existir */
            if (!contatoEncontrado) {

                contatoEncontrado =
                    criarContatoNovaConversa(
                        setor,
                        contato,
                        horaAtual()
                    );
            }


            /* Selecionar */
            if (contatoEncontrado) {

                selecionarContato(
                    contatoEncontrado
                );
            }


            /* Fechar */
            if (modalNovaConversa) {

                modalNovaConversa.hidden =
                    true;
            }
        }
    );
}


/* ========================================================
   INICIALIZAÇÃO
======================================================== */

carregarSetoresNovaConversa();

atualizarContatoNovaConversa();

recarregarNovasConversas();

    /* ========================================================
       PESQUISA
    ======================================================== */

    const pesquisa =
        document.getElementById(
            "pesquisar-conversa"
        );


    const resultado =
        document.getElementById(
            "resultado-busca"
        );


    if (pesquisa) {

        pesquisa.addEventListener(
            "input",
            () => {

                const termo =
                    pesquisa.value
                        .trim()
                        .toLowerCase();


                let encontrados =
                    0;


                document
                    .querySelectorAll(
                        ".usuario"
                    )
                    .forEach(
                        usuario => {

                            const nome =
                                (
                                    usuario.dataset
                                        .contato ||
                                    ""
                                ).toLowerCase();


                            const setor =
                                (
                                    usuario.dataset
                                        .setor ||
                                    ""
                                ).toLowerCase();


                            const mostrar =
                                !termo ||

                                nome.includes(
                                    termo
                                ) ||

                                setor.includes(
                                    termo
                                );


                            usuario.style.display =
                                mostrar
                                    ? "flex"
                                    : "none";


                            if (
                                mostrar &&
                                termo
                            ) {

                                encontrados++;
                            }
                        }
                    );


                if (resultado) {

                    resultado.textContent =
                        termo
                            ? `${encontrados} contato(s) encontrado(s)`
                            : "";
                }
            }
        );
    }



    /* ========================================================
       BOTÃO CÂMERA
    ======================================================== */

    const btnCamera =
        document.getElementById(
            "btn-camera"
        );


    if (btnCamera) {

        btnCamera.addEventListener(
            "click",
            abrirChamadaVideo
        );
    }



    /* ========================================================
       SAIR
    ======================================================== */

    const btnSair =
        document.getElementById(
            "btn-sair"
        );


    if (btnSair) {

        btnSair.addEventListener(
            "click",
            () => {

                if (
                    gravadorAudio &&
                    gravadorAudio.state !==
                        "inactive"
                ) {

                    gravadorAudio.stop();
                }


                encerrarChamadaVideo();


                encerrarChamadaAudio();


                sessionStorage.removeItem(
                    "afmSessao"
                );


                window.location.href =
                    "login.html";
            }
        );
    }



    /* ========================================================
       ESC
    ======================================================== */

    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key !==
                "Escape"
            ) {

                return;
            }


            if (painelEmoji) {

                painelEmoji.hidden =
                    true;
            }


            if (modalNovaConversa) {

                modalNovaConversa.hidden =
                    true;
            }


            if (modalMidia) {

                modalMidia.hidden =
                    true;
            }


            encerrarChamadaVideo();


            encerrarChamadaAudio();
        }
    );



    /* ========================================================
       PRIMEIRO CONTATO
    ======================================================== */

    const primeiroContato =
        document.querySelector(
            ".usuario"
        );


    if (primeiroContato) {

        selecionarContato(
            primeiroContato
        );
    }



    /* ========================================================
       CARREGAMENTO FINAL
    ======================================================== */

    setTimeout(
        () => {

            if (contatoAtual) {

                carregarMensagens();
            }

        },
        300
    );



});
