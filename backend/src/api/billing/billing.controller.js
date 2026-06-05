const supabase = require('../../lib/supabase');
const { findById } = require('../../lib/userStore');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

const PRICE_PER_CREDIT_VND = 25_000; // 1 credit = 25,000 VND
const MIN_CREDITS = 4;

async function getPackages(req, res) {
  return res.json({
    success: true,
    stripe_enabled: !!stripe,
    price_per_credit_vnd: PRICE_PER_CREDIT_VND,
    min_credits: MIN_CREDITS,
  });
}

async function createCheckout(req, res) {
  const rawAmount = parseInt(req.body.credit_amount, 10);

  if (!rawAmount || rawAmount < MIN_CREDITS) {
    return res.status(400).json({
      success: false,
      message: `Minimum purchase is ${MIN_CREDITS} credits`,
    });
  }

  if (!stripe) {
    return res.status(503).json({
      success: false,
      message: 'Payment not configured. Add STRIPE_SECRET_KEY to .env',
    });
  }

  const totalVnd = rawAmount * PRICE_PER_CREDIT_VND;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'vnd',
          product_data: {
            name: `TestPilot — ${rawAmount} Credits`,
            description: `${rawAmount} AI testing credits (~${(rawAmount * 500_000).toLocaleString()} tokens)`,
          },
          unit_amount: totalVnd, // VND is zero-decimal in Stripe
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/billing?success=1&credits=${rawAmount}`,
      cancel_url: `${FRONTEND_URL}/billing?cancelled=1`,
      metadata: {
        user_id: req.user.id,
        credits: rawAmount,
        amount_vnd: totalVnd,
      },
      customer_email: req.user.email,
    });

    await supabase.from('transactions').insert([{
      user_id: req.user.id,
      amount_usd: null,
      amount_vnd: totalVnd,
      credits_added: rawAmount,
      package_name: `${rawAmount} Credits`,
      status: 'pending',
      stripe_session_id: session.id,
    }]);

    return res.json({ success: true, data: { url: session.url, session_id: session.id } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function handleWebhook(req, res) {
  if (!stripe) return res.status(503).send('Stripe not configured');

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { user_id, credits } = session.metadata;

    const creditsNum = parseFloat(credits);
    const user = await findById(user_id);
    if (user) {
      const newCredits = (parseFloat(user.credits) || 0) + creditsNum;
      await supabase.from('users').update({ credits: newCredits }).eq('id', user_id);
    }

    // Cập nhật transaction thành completed
    await supabase.from('transactions')
      .update({ status: 'completed', stripe_payment_intent: session.payment_intent })
      .eq('stripe_session_id', session.id);
  }

  return res.json({ received: true });
}

async function getTransactions(req, res) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data: data || [] });
}

module.exports = { getPackages, createCheckout, handleWebhook, getTransactions };
