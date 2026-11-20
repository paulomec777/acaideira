// Açaideira — modo online (servidor + banco de dados).
// Quando o site roda no servidor (Railway), este arquivo liga: pedidos gravados no banco,
// Pix/cartão pelo Mercado Pago, acompanhamento do pedido e painel da loja em tempo real.
// Sem servidor (ex.: arquivo aberto direto), o site continua no modo WhatsApp.
(function () {
  let API = null, SB = null, sessao = null, canal = null;
  const $id = id => document.getElementById(id);
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- 1. Configuração da loja vinda do banco ----------
  fetch('/api/config').then(r => r.ok ? r.json() : null).then(c => {
    if (!c) return;
    API = c; window.API_ONLINE = c;
    LOJA.whats = c.whatsapp; LOJA.tempoEntrega = c.tempoEntrega; LOJA.tempoRetirada = c.tempoRetirada; LOJA.pedidoMinimo = c.pedidoMinimo;
    BAIRROS.splice(0, BAIRROS.length, ...c.bairros);
    const st = $id('status');
    if (st) { st.textContent = c.aberto ? 'Aberto agora' : 'Fechado agora'; st.classList.toggle('aberto', c.aberto); st.classList.toggle('fechado', !c.aberto); }
    document.querySelectorAll('.area-loja').forEach(a => a.style.display = '');
    rotaOnline(); if (location.hash === '#painel') entraPainel();
  }).catch(() => {});

  // ---------- 2. Checkout gravando no banco ----------
  const _telaCheckout = telaCheckout, _confirmar = confirmar;
  telaCheckout = function () {
    _telaCheckout();
    if (!API) return;
    const av = document.querySelector('#dBody .aviso');
    if (av) av.innerHTML = API.pagamentoOnline
      ? '🔒 Pix e cartão online pelo <b>Mercado Pago</b>. O pedido é confirmado automaticamente quando o pagamento cair.'
      : '🔒 Pagamento online: a loja envia o Pix ou o link do Mercado Pago no seu WhatsApp.';
    if (!API.aberto) {
      const e = $id('f-err'); e.textContent = '🌙 A loja está fechada agora. Você pode montar seu pedido, mas só consegue enviar no horário de funcionamento.'; e.style.display = 'block';
    }
  };
  function codigoPagamento() {
    if (ck.pag === 'pix') return 'pix_online';
    if (ck.pag === 'mp') return 'cartao_online';
    return { cartao: 'cartao_entrega', pix: 'pix_entrega', dinheiro: 'dinheiro' }[ck.local || 'cartao'];
  }
  confirmar = async function () {
    if (!API) return _confirmar();
    salvaCampos();
    const err = $id('f-err'), tel = (ck.tel || '').replace(/\D/g, '');
    const falta = [!ck.nome && 'seu nome', tel.length < 10 && 'um WhatsApp válido com DDD', ck.modo === 'entrega' && !ck.bairro && 'o bairro', ck.modo === 'entrega' && !ck.rua && 'rua e número'].filter(Boolean);
    if (falta.length) { err.textContent = 'Falta preencher: ' + falta.join(', ') + '.'; err.style.display = 'block'; return; }
    const btn = document.querySelector('#dFoot .btn.verde'); if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
    try { localStorage.setItem('acaideira_cliente', JSON.stringify({ nome: ck.nome, tel: ck.tel, bairro: ck.bairro, rua: ck.rua, ref: ck.ref })); } catch (e) {}
    let r, j;
    try {
      r = await fetch('/api/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        cliente: ck.nome, telefone: ck.tel, modo: ck.modo, bairro: ck.bairro, endereco: ck.rua, referencia: ck.ref, obs: ck.obs,
        pagamento: codigoPagamento(), trocoPara: ck.trocov,
        itens: sacola.map(i => ({ qtd: i.qtd, nome: i.nome, det: i.det, ref: i.ref })) }) });
      j = await r.json();
    } catch (e) { j = { erro: 'Sem conexão. Tente de novo.' }; }
    if (!r || !r.ok) { err.textContent = j.erro || 'Não foi possível enviar.'; err.style.display = 'block'; if (btn) { btn.disabled = false; btn.textContent = 'Revisar pedido'; } return; }
    try { const l = JSON.parse(localStorage.getItem('acaideira_meus') || '[]'); l.unshift({ t: j.token, c: j.codigo, d: Date.now() }); localStorage.setItem('acaideira_meus', JSON.stringify(l.slice(0, 10))); } catch (e) {}
    const resumoSacola = sacola.map(i => `${i.qtd}× ${i.nome}`).join(', ');
    sacola = []; atualiza();
    $id('dTitulo').textContent = 'Pedido #' + j.codigo;
    let html = '';
    if (j.pix) {
      html += `<div class="pix"><b>Pague com Pix para confirmar</b>
        ${j.pix.qrBase64 ? `<img class="qrimg" src="data:image/png;base64,${j.pix.qrBase64}" alt="QR Code Pix">` : ''}
        <div class="pixval">${brl(j.total)}</div>
        <button class="btn sec" type="button" id="copiaPix">📋 Copiar código Pix (copia e cola)</button>
        <small class="pixnome">O código vale ${Math.round((new Date(j.pix.expiraEm) - Date.now()) / 60000)} minutos. Quando o pagamento cair, seu pedido é confirmado <b>sozinho</b>.</small></div>`;
    } else if (j.linkPagamento) {
      html += `<div class="pix"><b>Pague com cartão para confirmar</b><div class="pixval">${brl(j.total)}</div>
        <a class="btn verde" href="${esc(j.linkPagamento)}" target="_blank" rel="noopener">💳 Pagar no Mercado Pago</a>
        <small class="pixnome">Página segura do Mercado Pago. Seu pedido é confirmado assim que o pagamento for aprovado.</small></div>`;
    } else {
      html += `<div class="ok"><div class="big">💜</div><h3>Pedido recebido!</h3><p class="ok-p">${ck.pag === 'pix' || ck.pag === 'mp' ? 'A loja vai te enviar o pagamento no WhatsApp.' : 'A loja já está com seu pedido.'} ${ck.modo === 'entrega' ? 'Previsão: ' + LOJA.tempoEntrega + '.' : 'Fica pronto em cerca de ' + LOJA.tempoRetirada + '.'}</p></div>`;
    }
    if (ck.modo === 'entrega') html += `<div class="aviso">🔐 Seu <b>código de entrega</b> é <b style="font-size:18px">${esc(j.codigoEntrega)}</b>. Informe ao motoboy quando ele chegar.</div>`;
    html += `<div class="revisao"><div class="rv-h">Seu pedido</div><div class="rv-p">${esc(resumoSacola)}</div><div class="rv-i tot"><span>Total</span><b>${brl(j.total)}</b></div></div>`;
    $id('dBody').innerHTML = html;
    if (j.pix) $id('copiaPix').onclick = () => copiar(j.pix.copiaECola);
    $id('dFoot').innerHTML = `<a class="btn" href="#pedido/${j.token}" onclick="fechar()">📍 Acompanhar meu pedido</a>`;
  };

  // ---------- 3. Página "Acompanhe seu pedido" ----------
  const ETAPAS = [['aguardando_pagamento', 'Aguardando pagamento', '⏳'], ['confirmado', 'Pedido confirmado', '✅'], ['em_producao', 'Montando seu açaí', '🥣'], ['saiu', 'Saiu para entrega', '🛵'], ['entregue', 'Entregue', '💜']];
  let timerAcomp = null;
  function rotaOnline() {
    const m = location.hash.match(/^#pedido\/([0-9a-f-]{36})$/i);
    let sec = $id('v-pedido');
    if (!m) { if (sec) sec.classList.remove('on'); clearInterval(timerAcomp); return; }
    if (!sec) { sec = document.createElement('section'); sec.className = 'view'; sec.id = 'v-pedido'; sec.innerHTML = '<div class="wrap ac" id="ac-box"></div>'; document.querySelector('#v-painel').after(sec); }
    document.querySelectorAll('.view').forEach(s => s.classList.toggle('on', s === sec));
    const carrega = async () => {
      const r = await fetch('/api/acompanhar/' + m[1]); const p = await r.json();
      if (!r.ok) { $id('ac-box').innerHTML = '<div class="al-card"><h4>Pedido não encontrado</h4></div>'; return; }
      const ent = p.modo === 'entrega';
      const lista = ETAPAS.filter(e => (p.pagamento.endsWith('online') || e[0] !== 'aguardando_pagamento')).map(e => e[0] === 'saiu' && !ent ? ['pronto', 'Pronto para retirar', '🏪'] : e).map(e => e[0] === 'entregue' && !ent ? ['entregue', 'Retirado', '💜'] : e);
      const atual = p.status === 'pronto' && ent ? 'saiu' : p.status;
      const ia = lista.findIndex(e => e[0] === atual);
      $id('ac-box').innerHTML = p.status === 'cancelado'
        ? `<div class="al-card"><h4>Pedido #${esc(p.codigo)} cancelado</h4><p>${p.pag_status === 'expirado' ? 'O Pix não foi pago no prazo.' : 'Fale com a loja se tiver dúvidas.'}</p></div>`
        : `<span class="al-kick">ACOMPANHE SEU PEDIDO</span><h2 class="al-tit">Pedido #${esc(p.codigo)}</h2>
          <div class="ac-steps">${lista.map((e, i) => `<div class="ac-st ${i < ia ? 'feito' : i === ia ? 'agora' : ''}"><b>${e[2]}</b><span>${e[1]}</span></div>`).join('')}</div>
          ${ent && p.status !== 'entregue' ? `<div class="al-card ac-cod">🔐 Código de entrega: <b>${esc(p.codigo_entrega)}</b><small>Informe ao motoboy. Só ele finaliza a entrega com este código.</small></div>` : ''}
          <div class="al-card"><h4>Itens</h4>${p.itens.map(i => `<div class="al-lin"><span>${i.qtd}× ${esc(i.nome)}</span></div>`).join('')}<div class="al-lin"><b>Total</b><b>${brl(Number(p.total))}</b></div></div>
          <a class="al-big ac-ajuda" target="_blank" rel="noopener" href="https://wa.me/${API ? API.whatsapp : LOJA.whats}?text=${encodeURIComponent('Oi! Preciso de ajuda com o pedido #' + p.codigo)}">💬 Preciso de ajuda</a>`;
    };
    carrega(); clearInterval(timerAcomp); timerAcomp = setInterval(carrega, 8000); window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', () => { if (API) rotaOnline(); });

  // ---------- 4. Painel da loja em tempo real ----------
  function carregaSB() {
    return new Promise((ok, falha) => {
      if (window.supabase && window.supabase.createClient) return ok();
      const s = document.createElement('script'); s.src = 'js/supabase.js'; s.onload = ok; s.onerror = falha; document.head.appendChild(s);
    });
  }
  const DB2UI = { aguardando_pagamento: 'novo', confirmado: 'novo', em_producao: 'prep', pronto: 'saiu', saiu: 'saiu', entregue: 'fim' };
  const PAGTXT = { pix_online: 'Pix online', cartao_online: 'Cartão online (Mercado Pago)', pix_entrega: 'Pix na entrega', cartao_entrega: 'Cartão na maquininha na entrega', dinheiro: 'Dinheiro na entrega' };
  function linhaParaPedido(r) {
    let pagTxt = PAGTXT[r.pagamento] || r.pagamento;
    if (r.modo === 'retirada') pagTxt = pagTxt.replace('na entrega', 'na loja');
    if (r.pagamento === 'dinheiro' && r.troco_para) pagTxt += ` (troco para R$ ${Number(r.troco_para).toFixed(2).replace('.', ',')})`;
    if (r.pag_status === 'pago') pagTxt = (r.pagamento === 'pix_online' ? 'Pix' : 'Cartão') + ' — pago pelo QR do site';
    return { id: r.id, num: r.codigo, cliente: r.cliente, tel: r.telefone, modo: r.modo, bairro: r.bairro, rua: r.endereco, ref: r.referencia, obs: r.obs,
      itens: r.itens, total: Number(r.total), pagTxt, st: DB2UI[r.status] || 'novo', db: r, hora: new Date(r.criado_em) };
  }
  async function carregaPedidos() {
    const desde = new Date(Date.now() - 20 * 3600e3).toISOString();
    const { data, error } = await SB.from('pedidos').select('*').gte('criado_em', desde).neq('status', 'cancelado').order('criado_em', { ascending: false });
    if (error) { toast('Erro ao carregar pedidos'); return; }
    const antes = new Set(pedidos.filter(p => p.db && p.db.status === 'confirmado').map(p => p.id));
    pedidos = data.map(linhaParaPedido);
    if (pedidos.some(p => p.db.status === 'confirmado' && !antes.has(p.id)) && antes.size + 1 > 0 && carregaPedidos.ja) alerta();
    carregaPedidos.ja = true;
    renderPainel();
  }
  const _renderPainel = renderPainel;
  renderPainel = function () {
    _renderPainel();
    if (!API) return;
    document.querySelectorAll('.al-ped').forEach(card => {
      const n = card.querySelector('.al-ph b')?.textContent.replace('#', '');
      const p = pedidos.find(x => String(x.num) === n); if (!p || !p.db) return;
      if (p.db.status === 'aguardando_pagamento') {
        card.classList.add('aguard');
        card.querySelector('.al-acts').innerHTML = `<div class="al-pill aguarda">⏳ Aguardando pagamento online — confirma sozinho</div><button class="al-b" onclick="confirmaManual('${p.id}')">✔ Já recebi (confirmar manual)</button>`;
      }
      if (p.modo === 'entrega' && p.st !== 'fim') card.querySelector('.al-mod').insertAdjacentHTML('beforeend', `<br><span>🔐 Código de entrega: <b>${esc(p.db.codigo_entrega)}</b></span>`);
    });
  };
  const _msgs = msgs;
  msgs = function (p) {
    const m = _msgs(p);
    if (API && p.db) {
      const link = `${location.origin}/#pedido/${p.db.token_acompanhamento}`;
      m.aceitar += `\n\n📍 Acompanhe aqui: ${link}` + (p.modo === 'entrega' ? `\n🔐 Seu código de entrega: ${p.db.codigo_entrega} (informe ao motoboy)` : '');
    }
    return m;
  };
  const UI2DB = (p, st) => st === 'prep' ? 'em_producao' : st === 'saiu' ? (p.modo === 'entrega' ? 'saiu' : 'pronto') : st === 'fim' ? 'entregue' : 'confirmado';
  const _mov = mov;
  mov = async function (n, st) {
    if (!API || !SB) return _mov(n, st);
    const p = pedidos.find(x => String(x.num) === String(n)); if (!p) return;
    if (p.db.status === 'aguardando_pagamento') { toast('Aguarde o pagamento ser confirmado'); return; }
    if (st === 'fim' && p.modo === 'entrega') {
      const c = prompt('Digite o código de entrega que o cliente informou ao motoboy:');
      if (c == null) return;
      if (c.trim() !== p.db.codigo_entrega) { alert('Código errado. Confira com o cliente antes de finalizar.'); return; }
    }
    const { error } = await SB.from('pedidos').update({ status: UI2DB(p, st) }).eq('id', p.id);
    if (error) toast('Não foi possível atualizar'); else toast(st === 'prep' ? 'Pedido em produção ✅' : st === 'saiu' ? 'Etapa atualizada 🛵' : 'Pedido finalizado 💜');
    carregaPedidos();
  };
  const _volta = voltaPed;
  voltaPed = async function (n) {
    if (!API || !SB) return _volta(n);
    const p = pedidos.find(x => String(x.num) === String(n)); const o = ['novo', 'prep', 'saiu', 'fim']; const i = o.indexOf(p.st);
    if (i > 0) { await SB.from('pedidos').update({ status: UI2DB(p, o[i - 1]) }).eq('id', p.id); carregaPedidos(); }
  };
  const _cancela = cancelaPed;
  cancelaPed = async function (n) {
    if (!API || !SB) return _cancela(n);
    if (!confirm('Cancelar o pedido #' + n + '?')) return;
    const p = pedidos.find(x => String(x.num) === String(n));
    await SB.from('pedidos').update({ status: 'cancelado' }).eq('id', p.id); carregaPedidos(); toast('Pedido cancelado');
  };
  window.confirmaManual = async function (id) {
    if (!confirm('Confirmar que o pagamento caiu na conta?')) return;
    await SB.from('pedidos').update({ pag_status: 'pago', status: 'confirmado' }).eq('id', id); carregaPedidos();
  };
  async function modoLoja(v) { await SB.from('loja_config').update({ modo_abertura: v, atualizado_em: new Date().toISOString() }).eq('id', 1); toast(v === 'auto' ? 'Loja no horário automático' : v === 'aberto' ? 'Loja ABERTA' : 'Loja FECHADA'); }
  window.modoLoja = modoLoja;

  async function entraPainel() {
    const box = document.querySelector('#v-painel .al');
    await carregaSB();
    if (!SB) SB = window.supabase.createClient(API.supabaseUrl, API.supabaseKey);
    const { data: { session } } = await SB.auth.getSession(); sessao = session;
    let login = $id('al-login');
    if (!sessao) {
      if (!login) { login = document.createElement('div'); login.id = 'al-login'; box.prepend(login); }
      [...box.children].forEach(c => { if (c !== login) c.style.display = 'none'; });
      login.innerHTML = `<div class="al-card al-loginbox"><span class="al-kick">ÁREA DA LOJA</span><h3>Entrar</h3>
        <label>E-mail</label><input class="in" id="lg-email" type="email" autocomplete="username">
        <label>Senha</label><input class="in" id="lg-senha" type="password" autocomplete="current-password">
        <div class="al-merr" id="lg-err"></div><button class="al-big" id="lg-btn">Entrar</button>
        <p class="al-obs">Primeiro acesso? <a href="#" id="lg-novo">Criar acesso da loja</a> (o dono libera depois).</p></div>`;
      const vai = async criar => {
        const email = $id('lg-email').value.trim(), password = $id('lg-senha').value;
        if (!email || password.length < 6) { $id('lg-err').textContent = 'Informe e-mail e senha (mínimo 6 caracteres).'; return; }
        const f = criar ? SB.auth.signUp({ email, password }) : SB.auth.signInWithPassword({ email, password });
        const { error, data } = await f;
        if (error) { $id('lg-err').textContent = error.message.includes('Invalid') ? 'E-mail ou senha incorretos.' : error.message; return; }
        if (criar && !data.session) { $id('lg-err').textContent = 'Acesso criado! Confirme o e-mail recebido e peça para liberar sua conta.'; return; }
        entraPainel();
      };
      $id('lg-btn').onclick = () => vai(false); $id('lg-novo').onclick = e => { e.preventDefault(); vai(true); };
      return;
    }
    if (login) login.remove();
    [...box.children].forEach(c => c.style.display = '');
    const { data: eq } = await SB.from('equipe').select('nome,papel').eq('user_id', sessao.user.id).maybeSingle();
    if (!eq) {
      box.insertAdjacentHTML('afterbegin', `<div class="al-card" id="al-semacesso"><h4>Conta aguardando liberação</h4><p>Peça ao dono da loja para liberar o e-mail <b>${esc(sessao.user.email)}</b>.</p><button class="al-b" onclick="sairLoja()">Sair</button></div>`);
      return;
    }
    $id('al-semacesso')?.remove();
    const top = document.querySelector('.al-topbtn');
    if (top && !$id('al-modo')) top.insertAdjacentHTML('afterbegin', `<select class="al-chip" id="al-modo" onchange="modoLoja(this.value)"><option value="auto">🕐 Horário automático</option><option value="aberto">🟢 Forçar aberto</option><option value="fechado">🔴 Forçar fechado</option></select><button class="al-chip" onclick="sairLoja()">Sair (${esc(eq.nome)})</button>`);
    const { data: cfg } = await SB.from('loja_config').select('modo_abertura').eq('id', 1).single();
    if (cfg) $id('al-modo').value = cfg.modo_abertura;
    document.querySelectorAll('.al-acoes,#al-guia').forEach(e => e.style.display = 'none');
    document.querySelectorAll('#tab-resumo .al-sec').forEach(e => e.style.display = 'none');
    await carregaPedidos();
    if (!canal) canal = SB.channel('pedidos-loja').on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => carregaPedidos()).subscribe();
  }
  window.sairLoja = async () => { await SB.auth.signOut(); location.reload(); };
  const _rota = rota;
  rota = function () { _rota(); if (API && location.hash === '#painel') entraPainel(); if (API) rotaOnline(); };
  window.addEventListener('hashchange', () => { if (API && location.hash === '#painel') entraPainel(); });
})();
