const express = require('express');
const axios = express ? require('axios') : null;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PAYPHONE_TOKEN = 'EqmX-vHvgmYR50YSZYmSpeCr7lc_y-9a8eJMDkbpuJf-adH1qCKKrvx1HfwOTWBvbrV4qVncLirLEGoQtlnjyXW_ieDbJzp9FGgUI3pPzjk1gch-p67g6rGq6sSOtUt2xwwEoq_q_mMEVO2eWxcFmrpgcP6Hrz1P63IBMa42QO9vQhzEqTw2a7pevFr-tWW0Cxc1B_R9eYY3eGjL7Kb48_4F5MMvPJ9tMGbTkpZS4eR_J5MR9woSc7BNnJsm9UPdYUQPiX1f7E6BCbEX8k9muFbefcY89zWpKbWbYQi6jK_wzN0ZF37pmjGvEQhMSoyoUf23QA';

app.post('/payphone-checkout', async (req, res) => {
    try {
        console.log("=== NUEVA PETICIÓN RECIBIDA DE JUMPSELLER ===");
        const orderData = req.body.order || req.body;
        console.log("Datos de la orden procesados:", JSON.stringify(orderData));

        const rawAmount = orderData.total || orderData.amount || 0;
        const amountInCents = Math.round(parseFloat(rawAmount) * 100);

        const clientTransactionId = String(orderData.id || Date.now());
        const email = orderData.customer?.email || orderData.email || 'cliente@tienda.com';
        const phone = orderData.customer?.phone || orderData.phone || '0999999999';

        const payphonePayload = {
            amount: amountInCents,
            amountWithoutTax: amountInCents,
            tax: 0,
            currency: "USD",
            clientTransactionId: clientTransactionId,
            email: email,
            phoneNumber: phone,
            responseUrl: "https://pay.payphonetodoesposible.com/payphone/response",
            cancellationUrl: "https://pay.payphonetodoesposible.com/payphone/cancel"
        };

        const targetUrl = 'https://pay.payphonetodoesposible.com/api/button/v1/Initiate';
        console.log("Conectando estrictamente a la URL:", targetUrl);
        console.log("Payload enviado:", payphonePayload);

        const response = await axios.post(targetUrl, payphonePayload, {
            headers: {
                'Authorization': `Bearer ${PAYPHONE_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("Respuesta exitosa de Payphone:", response.data);

        if (response.data && response.data.payWithCard) {
            return res.redirect(response.data.payWithCard);
        } else if (response.data && response.data.payWithPayPhone) {
            return res.redirect(response.data.payWithPayPhone);
        } else {
            return res.status(500).send("Payphone respondió pero sin enlaces de pago.");
        }

    } catch (error) {
        console.error("--- ERROR DETALLADO DE PAYPHONE ---");
        if (error.response) {
            console.error("Status HTTP:", error.response.status);
            console.error("Datos de error del servidor de Payphone:", error.response.data);
        } else {
            console.error("Error de red o configuración:", error.message);
        }
        return res.status(500).send("Error interno en el servidor puente.");
    }
});

app.get('/', (req, res) => {
    res.send("Servidor puente activo y actualizado.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
