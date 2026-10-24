const express = require('express');
const axios = require('axios');

const app = express();

// Middlewares para procesar peticiones JSON y datos provenientes de Jumpseller
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Token de producción oficial de Payphone
const PAYPHONE_TOKEN = 'EqmX-vHvgmYR50YSZYmSpeCr7lc_y-9a8eJMDkbpuJf-adH1qCKKrvx1HfwOTWBvbrV4qVncLirLEGoQtlnjyXW_ieDbJzp9FGgUI3pPzjk1gch-p67g6rGq6sSOtUt2xwwEoq_q_mMEVO2eWxcFmrpgcP6Hrz1P63IBMa42QO9vQhzEqTw2a7pevFr-tWW0Cxc1B_R9eYY3eGjL7Kb48_4F5MMvPJ9tMGbTkpZS4eR_J5MR9woSc7BNnJsm9UPdYUQPiX1f7E6BCbEX8k9muFbefcY89zWpKbWbYQi6jK_wzN0ZF37pmjGvEQhMSoyoUf23QA';

/**
 * RUTA PRINCIPAL: /payphone-checkout
 * Recibe la información de la orden enviada por Jumpseller,
 * la transforma al formato de Payphone y redirige al usuario a la pasarela de pago.
 */
app.post('/payphone-checkout', async (req, res) => {
    try {
        console.log("=== Nueva petición de pago recibida de Jumpseller ===");
        console.log("Cuerpo de la petición:", req.body);

        // Extraer la información de la orden (soporta formato directo o anidado en order)
        const orderData = req.body.order || req.body;
        
        // Convertir el monto total a centavos de dólar USD (Ejemplo: $0.10 -> 10 centavos)
        const rawAmount = orderData.total || orderData.amount || 0;
        const amountInCents = Math.round(parseFloat(rawAmount) * 100);

        // ID de transacción del cliente y datos del comprador
        const clientTransactionId = String(orderData.id || Date.now());
        const email = orderData.customer?.email || orderData.email || 'cliente@tienda.com';
        const phone = orderData.customer?.phone || orderData.phone || '0999999999';

        // Estructura requerida por la API de Payphone (Button Initiate V1)
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

        // Petición POST a Payphone
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

        // Redirección del comprador a la pantalla de pago
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

/**
 * RUTA DE VERIFICACIÓN
 * Permite comprobar que el servidor está activo desde cualquier navegador.
 */
app.get('/', (req, res) => {
    res.send("Servidor puente Payphone-Jumpseller activo y operativo en la nube.");
});

// Configuración de puerto dinámico (asignado por Render o puerto 3000 local)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});