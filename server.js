const express = require('express');
const axios = require('axios');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PAYPHONE_TOKEN = 'EqmX-vHvgmYR50YSZYmSpeCr7lc_y-9a8eJMDkbpuJf-adH1qCKKrvx1HfwOTWBvbrV4qVncLirLEGoQtlnjyXW_ieDbJzp9FGgUI3pPzjk1gch-p67g6rGq6sSOtUt2xwwEoq_q_mMEVO2eWxcFmrpgcP6Hrz1P63IBMa42QO9vQhzEqTw2a7pevFr-tWW0Cxc1B_R9eYY3eGjL7Kb48_4F5MMvPJ9tMGbTkpZS4eR_J5MR9woSc7BNnJsm9UPdYUQPiX1f7E6BCbEX8k9muFbefcY89zWpKbWbYQi6jK_wzN0ZF37pmjGvEQhMSoyoUf23QA';

app.post('/payphone-checkout', async (req, res) => {
    try {
        console.log("=== Nueva petición de pago recibida de Jumpseller ===");
        console.log("Cuerpo de la petición:", req.body);

        const orderData = req.body.order || req.body;
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

        console.log("Enviando payload a la API de Payphone:", payphonePayload);

        // URL oficial y corregida de la API de Payphone Button Initiate
        const response = await axios.post(
            'https://pay.payphonetodoesposible.com/api/button/v1/Initiate',
            payphonePayload,
            {
                headers: {
                    'Authorization': `Bearer ${PAYPHONE_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("Respuesta obtenida de Payphone:", response.data);

        if (response.data && response.data.payWithCard) {
            return res.redirect(response.data.payWithCard);
        } else if (response.data && response.data.payWithPayPhone) {
            return res.redirect(response.data.payWithPayPhone);
        } else {
            console.error("No se generó el enlace de pago en la respuesta de Payphone.");
            return res.status(500).send("Error al generar el enlace de pago con Payphone.");
        }

    } catch (error) {
        const errorDetails = error.response ? error.response.data : error.message;
        console.error("Error al procesar la solicitud de pago:", errorDetails);
        return res.status(500).send("Error interno en el servidor puente.");
    }
});

app.get('/', (req, res) => {
    res.send("Servidor puente Payphone-Jumpseller activo y operativo en la nube.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
