const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const pino = require("pino");
const express = require("express");

const app = express();
app.use(express.json()); 

let sock;


app.post("/enviar-whatsapp", async (req, res) => {
    const { numero, texto } = req.body;

    console.log(`\n[ESP32 mandou dados] Para: ${numero} | Mensagem: ${texto}`);

    if (!sock) {
        return res.status(500).json({ erro: "O bot do WhatsApp ainda não está conectado!" });
    }

    try {
        
        const jid = `${numero}@s.whatsapp.net`;

        
        await sock.sendMessage(jid, { text: texto });

        console.log("✅ Mensagem enviada com sucesso para o WhatsApp!");
        return res.json({ status: "sucesso", msg: "Mensagem enviada!" });

    } catch (error) {
        console.log("Erro ao enviar mensagem pelo Baileys:", error.message);
        return res.status(500).json({ erro: error.message });
    }
});


app.listen(3000, "0.0.0.0", () => {
    console.log("🌐 Servidor do Node rodando na porta 3000 em modo público!");
});



async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        auth: state,
        version,
        logger: pino({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({ connection, qr }) => {
        if (qr) {
            console.log("Escaneie o QR Code para conectar o WhatsApp:");
            qrcode.generate(qr, { small: true });
        }
        if (connection === "open") {
            console.log("✅ Bot do WhatsApp conectado e pronto!");
        }
    });
}

iniciarBot();