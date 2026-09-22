// Esta función corre en el servidor de Vercel, no en el navegador.
// Aquí SÍ es seguro usar la llave secreta de Stripe (STRIPE_SECRET_KEY),
// porque nunca llega al navegador de quien visita la página.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    var amount = parseInt(req.body && req.body.amount, 10);
    if (!amount || amount < 100) amount = 500; // mínimo $1.00 USD, default $5.00

    var origin = 'https://' + req.headers.host;

    var params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('ui_mode', 'embedded_page');
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', 'Apoyo a Serendip');
    params.append('line_items[0][price_data][unit_amount]', String(amount));
    params.append('line_items[0][quantity]', '1');
    params.append('return_url', origin + '/?donacion=gracias');

    var response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    var session = await response.json();

    if (!response.ok) {
      res.status(500).json({ error: session.error ? session.error.message : 'Error de Stripe' });
      return;
    }

    res.status(200).json({ clientSecret: session.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
