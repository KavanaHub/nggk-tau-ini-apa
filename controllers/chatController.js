import fetch from 'node-fetch';

export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong' });
        }

        // Nomor WA Admin tujuan (bisa diset dari ENV, default ke nomor Anda)
        // WAJIB KODE NEGARA (misal: 628...)
        const TARGET_PHONE = process.env.WHATSAPP_ADMIN_PHONE || '6285179935117';
        const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

        if (!FONNTE_TOKEN) {
            console.warn('⚠️ FONNTE_TOKEN belum diatur di .env backend. Mensimulasikan pesan OK (Development Mode).');
            return res.status(200).json({
                success: true,
                simulated: true,
                message: 'Mode simulasi aktif (Token belum dipasang)'
            });
        }

        const waMessage = `🔔 *Pesan Support dari Web Kavanahub*\n\n"${message}"\n\n_Balas pesan ini untuk merespons pengunjung._`;

        // Request ke API Fonnte
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': FONNTE_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: TARGET_PHONE,
                message: waMessage,
                countryCode: '62'
            })
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            throw new Error(data.reason || 'Gagal mengirim pesan melalui Fonnte');
        }

        return res.status(200).json({ success: true, data });

    } catch (error) {
        console.error('Chat API Error:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * Handle Webhook dari Fonnte ketika ada pesan masuk ke WA
 */
export const webhookFonnte = async (req, res) => {
    try {
        const { device, sender, message, text, name } = req.body;

        // Fonnte kadang mengirim `message` kadang `text` tergantung jenis file/text
        const incomingText = message || text;

        console.log(`[WEBHOOK FONNTE INBOUND]`);
        console.log(`Dari: ${sender} (${name || 'Unknown'})`);
        console.log(`Pesan: ${incomingText}`);

        // Karena HTTP Request ke Webhook dari Fonnte langsung harus segera dijawab 200 OK
        // Maka logic socket atau emit diproses setelahnya
        // TODO: (Next Phase) Tembak balasan ke Pusher/Socket.io/Supabase Realtime agar UI Next.js update

        return res.status(200).json({ status: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return res.status(500).json({ status: false, message: 'Webhook processing failed' });
    }
};
