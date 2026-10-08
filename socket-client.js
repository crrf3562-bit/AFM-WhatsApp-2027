(function () {
    function parseSession() {
        try {
            return JSON.parse(sessionStorage.getItem("afmSessao") || "null") || {};
        } catch (error) {
            return {};
        }
    }

    function isWindowSocketAvailable() {
        return Boolean(window.io);
    }

    if (!isWindowSocketAvailable()) {
        console.warn("Socket.IO client não carregado.");
        return;
    }

    const session = parseSession();
    const socket = window.io({
        auth: {
            usuario: session.usuario || session.nome || "",
            nome: session.nome || session.usuario || "",
            setor: session.setor || "Todos"
        }
    });
    const pendingEmits = [];
    let currentTargetSector = "Todos";

    function flushPendingEmits() {
        if (!socket || !socket.connected || pendingEmits.length === 0) {
            return;
        }

        const queued = pendingEmits.splice(0, pendingEmits.length);

        queued.forEach(({ eventName, payload, callback }) => {
            socket.emit(eventName, payload || {}, callback || (() => {}));
        });
    }

    function emitSocket(eventName, payload, callback) {
        if (!socket) {
            if (typeof callback === "function") {
                callback({ ok: false, error: "Socket indisponível." });
            }
            return;
        }

        if (!socket.connected) {
            pendingEmits.push({ eventName, payload, callback });
            socket.connect();
            return;
        }

        socket.emit(eventName, payload || {}, callback || (() => {}));
    }

    socket.on("connect", () => {
        console.log("Socket.IO conectado.");
        socket.emit("conversation:join", {
            targetSector: currentTargetSector
        });
        flushPendingEmits();
    });

    socket.on("connect_error", error => {
        console.error("Socket.IO conexão falhou:", error?.message || error);
    });

    socket.on("disconnect", reason => {
        console.warn("Socket.IO desconectado:", reason);
    });

    window.socket = socket;
    window.socketClient = {
        socket,
        isConnected() {
            return Boolean(socket && socket.connected);
        },
        connect() {
            if (socket) {
                socket.connect();
            }
        },
        disconnect() {
            if (socket) {
                socket.disconnect();
            }
        },
        joinConversation(targetSector) {
            currentTargetSector = targetSector || "Todos";

            if (socket.connected) {
                socket.emit("conversation:join", {
                    targetSector: currentTargetSector
                });
                return;
            }

            socket.connect();
        },
        requestHistory(data, callback) {
            emitSocket("history:get", data || {}, callback);
        },
        sendMessage(data, callback) {
            if (!socket) {
                callback?.({ ok: false, error: "Socket indisponível." });
                return false;
            }

            if (!socket.connected) {
                pendingEmits.push({
                    eventName: "message:send",
                    payload: data || {},
                    callback
                });
                socket.connect();
                return true;
            }

            socket.timeout(10000).emit(
                "message:send",
                data || {},
                (error, response) => {
                    if (error) {
                        callback?.({
                            ok: false,
                            error: "O servidor não confirmou o envio da mensagem."
                        });
                        return;
                    }

                    callback?.(response);
                }
            );
            return true;
        }
    };
})();
