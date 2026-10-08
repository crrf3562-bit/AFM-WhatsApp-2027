const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const http = require("node:http");
const { Server } = require("socket.io");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = Number(process.env.PORT) || 3000;
const messagesFile = path.join(__dirname, "data", "mensagens.json");

app.use(express.json({ limit: "16kb" }));

app.post("/api/gemini", async (request, response) => {
    const prompt = String(request.body?.prompt || "").trim();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        response.status(503).json({ error: "A integração Gemini não está configurada no servidor." });
        return;
    }

    if (!prompt || prompt.length > 4000) {
        response.status(400).json({ error: "A mensagem deve conter entre 1 e 4000 caracteres." });
        return;
    }

    try {
        const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const apiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }
        );
        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error("Erro da API Gemini:", data.error?.message || apiResponse.status);
            response.status(502).json({ error: "Não foi possível obter uma resposta do Gemini." });
            return;
        }

        const text = data.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

        if (!text) {
            response.status(502).json({ error: "O Gemini retornou uma resposta vazia." });
            return;
        }

        response.json({ text });
    } catch (error) {
        console.error("Falha ao consultar o Gemini:", error);
        response.status(502).json({ error: "Não foi possível conectar ao Gemini." });
    }
});

function normalize(value) {
    return String(value || "")
        .trim()
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function channelFor(sectorA, sectorB) {
    const sectors = [normalize(sectorA), normalize(sectorB)].sort();
    return sectors.includes("todos") ? "todos" : sectors.join("::");
}

function normalizeUser(value) {
    return String(value || "").trim().toLocaleLowerCase("pt-BR");
}

function automaticReplyFor(texto) {
    const textoLimpo = String(texto || "").trim().toLowerCase();

    if (!textoLimpo) {
        return "Recebi sua mensagem...";
    }

    if (textoLimpo.includes("oi") || textoLimpo.includes("olá") || textoLimpo.includes("ola")) {
        return "Oi! Tudo bem?";
    }

    if (textoLimpo.includes("bom") || textoLimpo.includes("tudo bem") || textoLimpo.includes("ok") || textoLimpo.includes("certo")) {
        return "Tudo certo! Vou verificar isso.";
    }

    if (textoLimpo.includes("obrigado") || textoLimpo.includes("valeu")) {
        return "De nada!";
    }

    if (textoLimpo.includes("quando") || textoLimpo.includes("hoje") || textoLimpo.includes("agora")) {
        return "Assim que possível, vou responder.";
    }

    if (textoLimpo.includes("imagem") || textoLimpo.includes("foto") || textoLimpo.includes("anexo")) {
        return "Claro, vou enviar assim que puder.";
    }

    return "Recebi sua mensagem...";
}

function conversationFor(userA, userB) {
    return [normalizeUser(userA), normalizeUser(userB)].sort().join("::");
}

function loadMessages() {
    try {
        return JSON.parse(fs.readFileSync(messagesFile, "utf8"));
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Não foi possível ler o histórico:", error);
        }
        return [];
    }
}

let messages = loadMessages();

function saveMessages() {
    fs.mkdirSync(path.dirname(messagesFile), { recursive: true });
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

app.use("/data", (_request, response) => response.sendStatus(404));
app.use(express.static(__dirname));

io.on("connection", socket => {
    const session = socket.handshake.auth || {};
    const user = String(session.usuario || "").trim();
    const name = String(session.nome || "").trim();
    const sector = String(session.setor || "").trim();

    if (!user || !name || !sector) {
        socket.disconnect(true);
        return;
    }

    socket.data.user = user;
    socket.data.name = name;
    socket.data.sector = sector;
    socket.join(`user:${normalizeUser(user)}`);

    socket.on("conversation:join", data => {
        for (const room of socket.rooms) {
            if (room.startsWith("channel:")) {
                socket.leave(room);
            }
        }

        const channel = channelFor(sector, data?.targetSector);
        if (channel !== "todos") {
            socket.join(`channel:${channel}`);
        }
    });

    socket.on("history:get", (data, respond) => {
        const targetUser = String(data?.targetUser || "").trim();

        if (targetUser) {
            const conversation = conversationFor(user, targetUser);
            const history = messages.filter(message => message.conversation === conversation);
            if (typeof respond === "function") {
                respond(history);
            }
            return;
        }

        const channel = channelFor(sector, data?.targetSector);
        const history = messages.filter(message => message.channel === channel);
        if (typeof respond === "function") {
            respond(history);
        }
    });

    socket.on("message:send", (data, respond) => {
        const text = String(data?.text || "").trim();
        const targetUser = String(data?.targetUser || "").trim();
        const targetSector = String(data?.targetSector || "").trim();

        if (!text || (!targetUser && !targetSector) || text.length > 10000) {
            if (typeof respond === "function") {
                respond({ ok: false, error: "Mensagem ou destino inválido." });
            }
            return;
        }

        const payload = {
            id: String(data?.id || `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`),
            remetente: name,
            remetenteUsuario: user,
            setorRemetente: sector,
            texto: text,
            data: new Date().toISOString(),
            tipo: "enviada",
            resposta: data?.reply || null,
            text,
            sender: { user, name, sector },
            reply: data?.reply || null,
            time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            date: new Date().toISOString()
        };

        if (targetUser) {
            if (normalizeUser(targetUser) === normalizeUser(user)) {
                if (typeof respond === "function") {
                    respond({ ok: false, error: "Não é possível enviar mensagem para a própria conta." });
                }
                return;
            }

            const targetName = String(data?.targetName || targetUser).trim();
            const conversation = conversationFor(user, targetUser);
            const message = {
                ...payload,
                destinatario: targetName,
                destinatarioUsuario: targetUser,
                setorDestinatario: String(data?.targetSector || "Todos").trim(),
                conversation,
                targetUser,
            };

            messages.push(message);
            saveMessages();
            io.to(`user:${normalizeUser(targetUser)}`).emit("message:new", message);

            if (typeof respond === "function") {
                respond({ ok: true, message });
            }

            if (normalizeUser(targetUser) !== "gemini") {
                return;
            }

            const autoReply = automaticReplyFor(text);
            const targetSector = String(data?.targetSector || "Todos").trim();
            const channel = channelFor(sector, targetSector);
            const replyMessage = {
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
                remetente: targetName,
                remetenteUsuario: targetUser,
                setorRemetente: targetSector,
                destinatario: name,
                destinatarioUsuario: user,
                setorDestinatario: sector,
                texto: autoReply,
                data: new Date().toISOString(),
                tipo: "recebida",
                resposta: null,
                text: autoReply,
                conversation,
                channel,
                sender: { user: targetUser, name: targetName, sector: String(data?.targetSector || "Todos").trim() },
                targetUser: user,
                reply: null,
                targetSector: sector,
                time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                date: new Date().toISOString(),
                autorContato: targetName
            };

            messages.push(replyMessage);
            saveMessages();
            io.to(`user:${normalizeUser(user)}`).emit("message:new", replyMessage);
            return;
        }

        const channel = channelFor(sector, targetSector);
        const message = {
            ...payload,
            destinatario: targetSector,
            setorDestinatario: targetSector,
            channel,
            targetSector,
        };

        messages.push(message);
        saveMessages();

        if (channel === "todos") {
            socket.broadcast.emit("message:new", message);
        } else {
            io.to(`channel:${channel}`).except(socket.id).emit("message:new", message);
        }

        if (typeof respond === "function") {
            respond({ ok: true, message });
        }
    });

    socket.on("message:import", (data, respond) => {
        const text = String(data?.text || "").trim();
        const targetSector = String(data?.targetSector || "").trim();
        const importedAuthor = String(data?.importedAuthor || "").trim();
        const time = String(data?.time || "").trim();
        const parsedDate = new Date(data?.date);

        if (
            !text || text.length > 10000 || !targetSector ||
            !importedAuthor || importedAuthor.length > 160 ||
            !/^\d{1,2}:\d{2}$/.test(time) || Number.isNaN(parsedDate.getTime())
        ) {
            if (typeof respond === "function") {
                respond({ ok: false, error: "Dados da mensagem importada inválidos." });
            }
            return;
        }

        const channel = channelFor(sector, targetSector);
        const message = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
            remetente: importedAuthor,
            setorRemetente: sector,
            destinatario: targetSector,
            setorDestinatario: targetSector,
            texto: text,
            data: parsedDate.toISOString(),
            tipo: "recebida",
            resposta: null,
            text,
            channel,
            targetSector,
            sender: { user, name, sector },
            imported: true,
            importedAuthor,
            time,
            date: parsedDate.toISOString()
        };

        messages.push(message);
        saveMessages();

        if (channel === "todos") {
            socket.broadcast.emit("message:new", message);
        } else {
            io.to(`channel:${channel}`).except(socket.id).emit("message:new", message);
        }

        if (typeof respond === "function") {
            respond({ ok: true, message });
        }
    });
});

server.listen(port, "0.0.0.0", () => {
    console.log(`AFM WhatsApp disponível em http://localhost:${port}`);
});