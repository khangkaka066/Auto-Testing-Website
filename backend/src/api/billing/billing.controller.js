const crypto = require('crypto');
const supabase = require('../../lib/supabase');
const { findById } = require('../../lib/userStore');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

const PRICE_PER_CREDIT_VND = 25_000; // 1 credit = 25,000 VND
const MIN_CREDITS = 4;

const BANK_TRANSFER = {
  bank_code: 'MB',
  bank_bin: '970422',
  bank_name: 'MB',
  account_no: '50335848579',
  account_name: 'Công Ty Cổ Phần AUTOMATE',
  vietqr_account_name: 'CONG TY CO PHAN AUTOMATE',
  template: 'compact2',
};

function generateTransferContent() {
  // Theo yêu cầu: random đúng 1 chữ số
  return crypto.randomInt(0, 10).toString();
}

function buildVietQrUrl({ amountVnd, transferContent }) {
  const params = new URLSearchParams({
    amount: String(amountVnd),
    addInfo: transferContent,
    accountName: BANK_TRANSFER.vietqr_account_name,
  });

  return `https://img.vietqr.io/image/${BANK_TRANSFER.bank_bin}-${BANK_TRANSFER.account_no}-${BANK_TRANSFER.template}.png?${params.toString()}`;
}

async function getPackages(req, res) {
  return res.json({
    success: true,
    stripe_enabled: !!stripe,
    bank_transfer_enabled: true,
    price_per_credit_vnd: PRICE_PER_CREDIT_VND,
    min_credits: MIN_CREDITS,
    bank_transfer: {
      bank_code: BANK_TRANSFER.bank_code,
      bank_name: BANK_TRANSFER.bank_name,
      account_no: BANK_TRANSFER.account_no,
      account_name: BANK_TRANSFER.account_name,
    },
  });
}

async function createBankTransfer(req, res) {
  const rawAmount = parseInt(req.body.credit_amount, 10);

  if (!rawAmount || rawAmount < MIN_CREDITS) {
    return res.status(400).json({
      success: false,
      message: `Minimum purchase is ${MIN_CREDITS} credits`,
    });
  }

  const totalVnd = rawAmount * PRICE_PER_CREDIT_VND;
  const transferContent = generateTransferContent();

  const qrUrl = buildVietQrUrl({
    amountVnd: totalVnd,
    transferContent,
  });

  try {
    /**
     * Bản không cần SQL mới:
     * - amount_usd đang được tận dụng để lưu số tiền VND.
     * - package_name lưu kèm "Nội dung CK" để admin đối chiếu.
     * - status = pending, sau này admin xác nhận thì cộng credit thủ công hoặc làm thêm endpoint approve.
     */
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: req.user.id,
        amount_usd: totalVnd,
        credits_added: rawAmount,
        package_name: `${rawAmount} Credits - VietQR - Nội dung CK: ${transferContent}`,
        status: 'pending',
      }])
      .select('id, created_at')
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      data: {
        transaction_id: data.id,
        created_at: data.created_at,
        credits: rawAmount,
        amount_vnd: totalVnd,
        transfer_content: transferContent,
        qr_url: qrUrl,
        bank: {
          bank_code: BANK_TRANSFER.bank_code,
          bank_name: BANK_TRANSFER.bank_name,
          account_no: BANK_TRANSFER.account_no,
          account_name: BANK_TRANSFER.account_name,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
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
          unit_amount: totalVnd,
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

    /**
     * Không dùng amount_vnd để tránh lỗi thiếu cột SQL.
     * Tạm lưu VND vào amount_usd.
     */
    await supabase.from('transactions').insert([{
      user_id: req.user.id,
      amount_usd: totalVnd,
      credits_added: rawAmount,
      package_name: `${rawAmount} Credits`,
      status: 'pending',
      stripe_session_id: session.id,
    }]);

    return res.json({
      success: true,
      data: {
        url: session.url,
        session_id: session.id,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
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
      await supabase
        .from('users')
        .update({ credits: newCredits })
        .eq('id', user_id);
    }

    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        stripe_payment_intent: session.payment_intent,
      })
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

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

  return res.json({
    success: true,
    data: data || [],
  });
}

module.exports = {
  getPackages,
  createCheckout,
  createBankTransfer,
  handleWebhook,
  getTransactions,
};