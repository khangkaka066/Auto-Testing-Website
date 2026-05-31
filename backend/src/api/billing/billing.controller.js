const supabase = require('../../lib/supabase');
const { findById } = require('../../lib/userStore');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter',
    credits: 1_000_000,
    price_usd: 5,
    description: '1,000,000 credits',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    credits: 5_000_000,
    price_usd: 20,
    description: '5,000,000 credits',
    popular: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    credits: 15_000_000,
    price_usd: 50,
    description: '15,000,000 credits',
  },
};

async function getPackages(req, res) {
  return res.json({
    success: true,
    data: Object.values(CREDIT_PACKAGES),
    stripe_enabled: !!stripe,
  });
}

async function createCheckout(req, res) {
  const { package_id } = req.body;
  const pkg = CREDIT_PACKAGES[package_id];

  if (!pkg) {
    return res.status(400).json({ success: false, message: 'Invalid package' });
  }

  if (!stripe) {
    return res.status(503).json({
      success: false,
      message: 'Payment not configured. Add STRIPE_SECRET_KEY to .env',
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      payment_method_options: {
        card: { request_three_d_secure: 'automatic' },
      },
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `TestPilot — ${pkg.name} Pack`,
            description: `${pkg.credits.toLocaleString()} AI testing credits`,
          },
          unit_amount: pkg.price_usd * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/billing?success=1&package=${pkg.id}`,
      cancel_url: `${FRONTEND_URL}/billing?cancelled=1`,
      metadata: {
        user_id: req.user.id,
        package_id: pkg.id,
        credits: pkg.credits,
      },
      customer_email: req.user.email,
    });

    // Tạo transaction record ở trạng thái pending
    await supabase.from('transactions').insert([{
      user_id: req.user.id,
      amount_usd: pkg.price_usd,
      credits_added: pkg.credits,
      package_name: pkg.name,
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
    const { user_id, package_id, credits } = session.metadata;

    // Cộng credits cho user
    const creditsNum = parseInt(credits, 10);
    const user = await findById(user_id);
    if (user) {
      const newCredits = (user.credits || 0) + creditsNum;
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
