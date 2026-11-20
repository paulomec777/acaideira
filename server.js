// Açaideira — servidor do site, pedidos e pagamentos
// Site estático + API de pedidos (Supabase) + Mercado Pago (Pix e cartão) com confirmação automática.
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const catalogo = require('./public/js/catalogo.js');

const {
  PORT = 3000,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_PUBLISHABLE_KEY,
  MP_ACCESS_TOKEN,          // opcional: sem ele, Pix/cartão online viram "a loja envia pelo WhatsApp"
  PUBLIC_URL,               // ex.: https://acaideira.up.railway.app (usado no aviso do Mercado Pago)
  PIX_MINUTOS = '15',
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.');
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// ---------- utilidades ----------
const TZ = 'America/Sao_Paulo';
function agoraLocal() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { dia, hm: `${p.hour === '24' ? '00' : p.hour}:${p.minute}` };
}
function lojaAberta(cfg) {
  if (cfg.modo_abertura === 'aberto') return true;
  if (cfg.modo_abertura === 'fechado') return false;
  const { dia, hm } = agoraLocal();
  const h = cfg.horario?.[String(dia)];
  return !!(h && hm >= h[0] && hm < h[1]);
}
const so = (v, max = 200) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const reais = v => Math.round(v * 100) / 100;
async function lerConfig() {
  const [{ data: cfg }, { data: bairros }, { data: esg }] = await Promise.all([
    db.from('loja_config').select('*').eq('id', 1).single(),
    db.from('bairros').select('nome,taxa,ativo,ordem').eq('ativo', true).order('ordem'),
    db.from('itens_esgotados').select('item_id,nome'),
  ]);
  return { cfg, bairros: bairros || [], esgotados: esg || [] };
}
async function mp(pathname, body, idem) {
  const r = await fetch('https://api.mercadopago.com' + pathname, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json', ...(idem ? { 'X-Idempotency-Key': idem } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Mercado Pago ${r.status}: ${j.message || JSON.stringify(j).slice(0, 200)}`);
  return j;
}

// ---------- API pública ----------
app.get('/api/config', async (_req, res) => {
  try {
    const { cfg, bairros, esgotados } = await lerConfig();
    res.json({
      aberto: lojaAberta(cfg), horario: cfg.horario, pedidoMinimo: Number(cfg.pedido_minimo),
      tempoEntrega: cfg.tempo_entrega, tempoRetirada: cfg.tempo_retirada, whatsapp: cfg.whatsapp,
      bairros: bairros.map(b => ({ n: b.nome, t: Number(b.taxa) })), esgotados: esgotados.map(e => e.item_id),
      pagamentoOnline: !!MP_ACCESS_TOKEN,
      supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_PUBLISHABLE_KEY,
    });
  } catch (e) { console.error(e); res.status(500).json({ erro: 'Não foi possível carregar a loja.' }); }
});

const PAGAMENTOS = ['pix_online', 'cartao_online', 'pix_entrega', 'cartao_entrega', 'dinheiro'];
app.post('/api/pedidos', async (req, res) => {
  try {
    const b = req.body || {};
    const { cfg, bairros, esgotados } = await lerConfig();
    const erros = [];
    if (!lojaAberta(cfg)) return res.status(409).json({ erro: 'A loja está fechada agora. Confira nosso horário.' });
    const cliente = so(b.cliente, 80), telefone = so(b.telefone, 30).replace(/[^\d()+ -]/g, '');
    const modo = b.modo === 'retirada' ? 'retirada' : 'entrega';
    if (cliente.length < 2) erros.push('nome');
    if (telefone.replace(/\D/g, '').length < 10) erros.push('WhatsApp com DDD');
    let taxa = 0, bairro = null, endereco = null;
    if (modo === 'entrega') {
      const bz = bairros.find(x => x.nome === b.bairro);
      if (!bz) erros.push('bairro atendido'); else { bairro = bz.nome; taxa = Number(bz.taxa); }
      endereco = so(b.endereco, 160); if (endereco.length < 4) erros.push('rua e número');
    }
    const pagamento = PAGAMENTOS.includes(b.pagamento) ? b.pagamento : null;
    if (!pagamento) erros.push('forma de pagamento');
    if (!Array.isArray(b.itens) || !b.itens.length || b.itens.length > 30) erros.push('itens');
    const itens = [];
    const esgIds = new Set(esgotados.map(e => e.item_id));
    for (const it of b.itens || []) {
      const qtd = Math.max(1, Math.min(20, parseInt(it.qtd, 10) || 1));
      const preco = catalogo.precoDoItem(it.ref);
      if (preco == null) { erros.push('um item do pedido mudou, monte de novo'); break; }
      const usados = it.ref.tipo === 'montar' ? [it.ref.base, ...(it.ref.meio || []), ...(it.ref.comps || []), ...(it.ref.prem || [])] : [];
      const esg = usados.find(id => esgIds.has(id));
      if (esg) { erros.push('um item esgotou: ' + (esgotados.find(e => e.item_id === esg)?.nome || esg)); break; }
      itens.push({ qtd, nome: so(it.nome, 80), det: so(it.det, 400), preco, ref: it.ref });
    }
    if (erros.length) return res.status(400).json({ erro: 'Confira: ' + [...new Set(erros)].join(', ') + '.' });
    const subtotal = reais(itens.reduce((s, i) => s + i.preco * i.qtd, 0));
    if (modo === 'entrega' && subtotal < Number(cfg.pedido_minimo)) return res.status(400).json({ erro: `Pedido mínimo para entrega: R$ ${Number(cfg.pedido_minimo).toFixed(2)}` });
    const total = reais(subtotal + taxa);
    const online = pagamento === 'pix_online' || pagamento === 'cartao_online';
    const codigo = String(Date.now()).slice(-5) + crypto.randomInt(10);
    const troco = pagamento === 'dinheiro' && b.trocoPara ? Number(String(b.trocoPara).replace(',', '.')) || null : null;
    const { data: ped, error } = await db.from('pedidos').insert({
      codigo, cliente, telefone, modo, bairro, endereco, referencia: so(b.referencia, 120) || null, obs: so(b.obs, 300) || null,
      itens, subtotal, taxa, total, pagamento, troco_para: troco,
      pag_status: online ? 'pendente' : 'na_entrega',
      status: online && MP_ACCESS_TOKEN ? 'aguardando_pagamento' : 'confirmado',
    }).select('id,codigo,total,token_acompanhamento,codigo_entrega,status').single();
    if (error) throw error;

    const resp = { codigo: ped.codigo, total: Number(ped.total), token: ped.token_acompanhamento, codigoEntrega: ped.codigo_entrega, status: ped.status };
    if (online && MP_ACCESS_TOKEN) {
      const notification_url = PUBLIC_URL ? `${PUBLIC_URL}/api/mp/webhook` : undefined;
      if (pagamento === 'pix_online') {
        const exp = new Date(Date.now() + Number(PIX_MINUTOS) * 60000);
        const pay = await mp('/v1/payments', {
          transaction_amount: total, payment_method_id: 'pix', description: `Açaideira pedido #${codigo}`,
          external_reference: ped.id, notification_url, date_of_expiration: exp.toISOString().replace('Z', '-00:00'),
          payer: { email: `cliente+${codigo}@acaideira.app`, first_name: cliente.split(' ')[0] },
        }, ped.id);
        await db.from('pedidos').update({ mp_payment_id: String(pay.id) }).eq('id', ped.id);
        const tx = pay.point_of_interaction?.transaction_data || {};
        resp.pix = { copiaECola: tx.qr_code, qrBase64: tx.qr_code_base64, expiraEm: exp.toISOString() };
      } else {
        const pref = await mp('/checkout/preferences', {
          items: [{ title: `Açaideira pedido #${codigo}`, quantity: 1, unit_price: total, currency_id: 'BRL' }],
          external_reference: ped.id, notification_url,
          back_urls: PUBLIC_URL ? { success: `${PUBLIC_URL}/#pedido/${ped.token_acompanhamento}`, pending: `${PUBLIC_URL}/#pedido/${ped.token_acompanhamento}`, failure: `${PUBLIC_URL}/#pedido/${ped.token_acompanhamento}` } : undefined,
          auto_return: PUBLIC_URL ? 'approved' : undefined,
          payment_methods: { excluded_payment_types: [{ id: 'ticket' }], installments: 1 },
        });
        resp.linkPagamento = pref.init_point;
      }
    }
    res.status(201).json(resp);
  } catch (e) { console.error(e); res.status(500).json({ erro: 'Não conseguimos registrar o pedido. Tente de novo ou chame no WhatsApp.' }); }
});

// Acompanhamento do pedido pelo cliente (só com o token secreto do pedido)
app.get('/api/acompanhar/:token', async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.token)) return res.status(404).json({ erro: 'Pedido não encontrado.' });
  const { data: p } = await db.from('pedidos')
    .select('id,codigo,cliente,modo,bairro,itens,total,pagamento,pag_status,status,codigo_entrega,criado_em,atualizado_em')
    .eq('token_acompanhamento', req.params.token).maybeSingle();
  if (!p) return res.status(404).json({ erro: 'Pedido não encontrado.' });
  const { data: ev } = await db.from('pedido_eventos').select('status_para,criado_em').eq('pedido_id', p.id).order('criado_em');
  delete p.id;
  res.json({ ...p, eventos: ev || [] });
});

// Mercado Pago avisa aqui quando o pagamento muda. Nunca confiamos no corpo: consultamos o pagamento na API.
app.post('/api/mp/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    if (!MP_ACCESS_TOKEN) return;
    const tipo = req.body?.type || req.query.type || req.query.topic;
    const id = req.body?.data?.id || req.query['data.id'] || req.query.id;
    if (!id) return;
    if (tipo === 'payment') return confirmaPagamento(String(id));
    if (tipo === 'merchant_order') {
      const mo = await mp(`/merchant_orders/${id}`);
      for (const p of mo.payments || []) await confirmaPagamento(String(p.id));
    }
  } catch (e) { console.error('webhook', e.message); }
});
async function confirmaPagamento(paymentId) {
  const pay = await mp(`/v1/payments/${paymentId}`);
  const pedidoId = pay.external_reference;
  if (!pedidoId) return;
  const { data: ped } = await db.from('pedidos').select('id,total,status,pag_status').eq('id', pedidoId).maybeSingle();
  if (!ped) return;
  if (pay.status === 'approved' && Math.abs(Number(pay.transaction_amount) - Number(ped.total)) < 0.01) {
    if (ped.pag_status !== 'pago') await db.from('pedidos').update({ pag_status: 'pago', mp_payment_id: paymentId, status: ped.status === 'aguardando_pagamento' ? 'confirmado' : ped.status }).eq('id', ped.id);
  } else if (['refunded', 'charged_back'].includes(pay.status)) {
    await db.from('pedidos').update({ pag_status: 'estornado' }).eq('id', ped.id);
  }
}

// Pix não pago no prazo: cancela sozinho
setInterval(async () => {
  try {
    const limite = new Date(Date.now() - (Number(PIX_MINUTOS) + 2) * 60000).toISOString();
    const { data } = await db.from('pedidos').select('id').eq('status', 'aguardando_pagamento').lt('criado_em', limite);
    for (const p of data || []) await db.from('pedidos').update({ status: 'cancelado', pag_status: 'expirado' }).eq('id', p.id).eq('status', 'aguardando_pagamento');
  } catch (e) { console.error('expira', e.message); }
}, 60000);

// ---------- site ----------
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h', setHeaders: (r, f) => { if (f.endsWith('.html')) r.setHeader('Cache-Control', 'no-cache'); } }));
app.get('/health', (_q, r) => r.send('ok'));
app.listen(PORT, () => console.log(`Açaideira no ar na porta ${PORT}`));
