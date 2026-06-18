const crypto = require('crypto');
const axios = require('axios');
const supabase = require('../../lib/supabase');
const { findById } = require('../../lib/userStore');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || '';
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || '';
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '';
const PAYOS_API_BASE = 'https://api-merchant.payos.vn';

const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

const PRICE_PER_CREDIT_VND = 25_000; // 1 credit = 25,000 VND
const MIN_CREDITS = 4;

const BANK_TRANSFER = {
  bank_code: 'MB',
  bank_bin: '970422',
  bank_name: 'MBBank',
  account_no: '0335828579',
  account_name: 'Lai Hoang Minh Phuc',
  vietqr_account_name: 'Automate Inc.',
  template: 'compact2',
};

function normalizeFrontendUrl() {
  return FRONTEND_URL.replace(/\/$/, '');
}

function generateTransferContent() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 10; i += 1) {
    code += alphabet[crypto.randomInt(0, alphabet.length)];
  }

  return code;
}

function buildVietQrUrl({ amountVnd, transferContent }) {
  const params = new URLSearchParams({
    amount: String(amountVnd),
    addInfo: transferContent,
    accountName: BANK_TRANSFER.vietqr_account_name,
  });

  return `https://img.vietqr.io/image/${BANK_TRANSFER.bank_bin}-${BANK_TRANSFER.account_no}-${BANK_TRANSFER.template}.png?${params.toString()}`;
}

function assertPayosConfigured() {
  if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
    throw new Error('payOS is not configured. Please set PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY in .env');
  }
}

function signPayosData(data) {
  const rawData = Object.keys(data)
    .sort()
    .map((key) => {
      let value = data[key];

      if (value === null || value === undefined) {
        value = '';
      }

      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }

      return `${key}=${value}`;
    })
    .join('&');

  return crypto
    .createHmac('sha256', PAYOS_CHECKSUM_KEY)
    .update(rawData)
    .digest('hex');
}

function generateOrderCode() {
  // payOS yêu cầu orderCode là số nguyên.
  // Date.now() * 100 + random vẫn nằm trong Number.MAX_SAFE_INTEGER.
  return Date.now() * 100 + crypto.randomInt(10, 99);
}

function generatePaymentCode(length = 10) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < length; i += 1) {
    code += alphabet[crypto.randomInt(0, alphabet.length)];
  }

  return code;
}

async function getPackages(req, res) {
  return res.json({
    success: true,
    stripe_enabled: !!stripe,
    bank_transfer_enabled: true,
    payos_enabled: !!(PAYOS_CLIENT_ID && PAYOS_API_KEY && PAYOS_CHECKSUM_KEY),
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
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: req.user.id,
        amount_usd: totalVnd,
        amount_vnd: totalVnd,
        credits_added: rawAmount,
        package_name: `${rawAmount} Credits - VietQR - Nội dung CK: ${transferContent}`,
        status: 'pending',
        provider: 'bank_transfer',
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

async function createPayosPayment(req, res) {
  try {
    assertPayosConfigured();

    const rawAmount = parseInt(req.body.credit_amount, 10);

    if (!rawAmount || rawAmount < MIN_CREDITS) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase is ${MIN_CREDITS} credits`,
      });
    }

    const credits = rawAmount;
    const amountVnd = credits * PRICE_PER_CREDIT_VND;
    const orderCode = generateOrderCode();

    // Theo yêu cầu: mã/nội dung thanh toán random chữ + số khoảng 10 ký tự
    const paymentCode = generatePaymentCode(10);

    const returnUrl = `${normalizeFrontendUrl()}/billing?payos=success&orderCode=${orderCode}`;
    const cancelUrl = `${normalizeFrontendUrl()}/billing?payos=cancelled&orderCode=${orderCode}`;

    const paymentPayload = {
      orderCode,
      amount: amountVnd,
      description: paymentCode,
      cancelUrl,
      returnUrl,
    };

    paymentPayload.signature = signPayosData({
      amount: paymentPayload.amount,
      cancelUrl: paymentPayload.cancelUrl,
      description: paymentPayload.description,
      orderCode: paymentPayload.orderCode,
      returnUrl: paymentPayload.returnUrl,
    });

    const { data: transaction, error: insertError } = await supabase
      .from('transactions')
      .insert([{
        user_id: req.user.id,
        amount_usd: amountVnd, // giữ tương thích code cũ đang đọc amount_usd
        amount_vnd: amountVnd,
        credits_added: credits,
        package_name: `${credits} Credits - payOS - ${paymentCode}`,
        status: 'pending',
        provider: 'payos',
        provider_order_code: orderCode,
      }])
      .select('id, created_at')
      .single();

    if (insertError) {
      return res.status(500).json({
        success: false,
        message: insertError.message,
      });
    }

    const payosResponse = await axios.post(
      `${PAYOS_API_BASE}/v2/payment-requests`,
      paymentPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY,
        },
      }
    );

    if (payosResponse.data?.code !== '00') {
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          raw_webhook: payosResponse.data,
        })
        .eq('id', transaction.id);

      return res.status(400).json({
        success: false,
        message: payosResponse.data?.desc || 'Cannot create payOS payment link',
      });
    }

    const payosData = payosResponse.data.data;

    await supabase
      .from('transactions')
      .update({
        provider_payment_link_id: payosData.paymentLinkId,
        stripe_session_id: payosData.paymentLinkId, // giữ tương thích nếu UI/admin cũ nhìn cột này
      })
      .eq('id', transaction.id);

    return res.json({
      success: true,
      data: {
        transaction_id: transaction.id,
        created_at: transaction.created_at,
        order_code: orderCode,
        payment_code: paymentCode,
        credits,
        amount_vnd: amountVnd,
        checkout_url: payosData.checkoutUrl,
        qr_code: payosData.qrCode,
        payment_link_id: payosData.paymentLinkId,
        status: payosData.status,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.response?.data?.desc || err.response?.data?.message || err.message,
    });
  }
}

async function handlePayosWebhook(req, res) {
  try {
    assertPayosConfigured();

    const webhookBody = req.body;

    if (!webhookBody || !webhookBody.data || !webhookBody.signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payOS webhook payload',
      });
    }

    const expectedSignature = signPayosData(webhookBody.data);

    if (expectedSignature !== webhookBody.signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payOS signature',
      });
    }

    const data = webhookBody.data;

    // Không cộng credit nếu webhook không báo thành công
    if (!webhookBody.success || webhookBody.code !== '00') {
      return res.json({ success: true });
    }

    const orderCode = Number(data.orderCode);
    const paidAmount = Number(data.amount);
    const reference = data.reference || null;

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('provider', 'payos')
      .eq('provider_order_code', orderCode)
      .maybeSingle();

    if (txError) {
      return res.status(500).json({
        success: false,
        message: txError.message,
      });
    }

    // Khi payOS verify webhook URL có thể gửi dữ liệu mẫu.
    // Không tìm thấy transaction thì bỏ qua nhưng vẫn trả 200.
    if (!transaction) {
      return res.json({
        success: true,
        message: 'Transaction not found, ignored',
      });
    }

    if (transaction.status === 'completed') {
      return res.json({
        success: true,
        message: 'Transaction already completed',
      });
    }

    const expectedAmount = Number(transaction.amount_vnd || transaction.amount_usd || 0);

    if (paidAmount !== expectedAmount) {
      await supabase
        .from('transactions')
        .update({
          raw_webhook: webhookBody,
        })
        .eq('id', transaction.id);

      return res.status(400).json({
        success: false,
        message: 'Amount mismatch',
      });
    }

    // Chỉ update transaction còn pending để tránh cộng credit 2 lần khi webhook retry
    const { data: updatedRows, error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        provider_reference: reference,
        provider_payment_link_id: data.paymentLinkId,
        stripe_payment_intent: reference, // giữ tương thích cột cũ
        paid_at: new Date().toISOString(),
        raw_webhook: webhookBody,
      })
      .eq('id', transaction.id)
      .eq('status', 'pending')
      .select('id, user_id, credits_added');

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: updateError.message,
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return res.json({
        success: true,
        message: 'No pending transaction to complete',
      });
    }

    const completedTx = updatedRows[0];

    const { error: creditError } = await supabase.rpc('increment_user_credits', {
      p_user_id: completedTx.user_id,
      p_credits: Number(completedTx.credits_added || 0),
    });

    if (creditError) {
      return res.status(500).json({
        success: false,
        message: creditError.message,
      });
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function getPayosStatus(req, res) {
  const orderCode = Number(req.params.orderCode);

  if (!orderCode) {
    return res.status(400).json({
      success: false,
      message: 'Invalid orderCode',
    });
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('id, status, credits_added, amount_vnd, amount_usd, provider_order_code, paid_at')
    .eq('user_id', req.user.id)
    .eq('provider', 'payos')
    .eq('provider_order_code', orderCode)
    .maybeSingle();

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

  return res.json({
    success: true,
    data,
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
          unit_amount: totalVnd,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${normalizeFrontendUrl()}/billing?success=1&credits=${rawAmount}`,
      cancel_url: `${normalizeFrontendUrl()}/billing?cancelled=1`,
      metadata: {
        user_id: req.user.id,
        credits: rawAmount,
        amount_vnd: totalVnd,
      },
      customer_email: req.user.email,
    });

    await supabase.from('transactions').insert([{
      user_id: req.user.id,
      amount_usd: totalVnd,
      amount_vnd: totalVnd,
      credits_added: rawAmount,
      package_name: `${rawAmount} Credits`,
      status: 'pending',
      provider: 'stripe',
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
  createPayosPayment,
  handlePayosWebhook,
  getPayosStatus,
  handleWebhook,
  getTransactions,
};
