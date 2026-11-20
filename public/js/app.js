// Açaideira — modo APP no celular (perfil estilo Instagram + cardápio estilo iFood).
// Usa o mesmo catálogo, sacola e checkout do site; só muda a cara no celular.
(function () {
  const mq = matchMedia('(max-width:700px)');
  const APP = () => document.body.classList.contains('app');
  const E = id => document.getElementById(id);
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const IG = 'https://instagram.com/acaideira.sorvete.acai';
  const ENDERECO = 'Av. Lago Azul, Boa Vista 2, Qd 1, Lt 4, Loja 4 — ao lado do Camp+, Novo Gama-GO';
  const MAPA = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Av. Lago Azul, Boa Vista 2, Novo Gama - GO, Açaideira');

  // ---------- ícones ----------
  const sv = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const IC = {
    casa: sv('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
    busca: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    pedidos: sv('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
    loja: sv('<path d="M4 9h16l-1-5H5z"/><path d="M5 9v11h14V9"/><path d="M10 20v-6h4v6"/>'),
    sacola: sv('<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
    voltar: sv('<path d="M15 18l-6-6 6-6"/>'),
    fechar: sv('<path d="M6 6l12 12M18 6 6 18"/>'),
    share: sv('<path d="M12 3v13"/><path d="m7 8 5-5 5 5"/><path d="M5 14v6h14v-6"/>')
  };

  // ---------- fotos ----------
  const fotoComp = id => (typeof FOTOS_COMP !== 'undefined' && FOTOS_COMP[id]) || id === 'f_beijinho' ? `img/comp/${id}.jpg` : null;
  const fotoMeio = m => m.foto || (['banana', 'condensado', 'cookies', 'granola', 'morango', 'ninho', 'nutella', 'pacoca'].includes(m.id) ? `img/rech/${m.id}.jpg` : null);
  const fotoItem = it => { const r = it.ref || {}; if (r.tipo === 'pronto' && PRONTOS[r.i]) return `img/${PRONTOS[r.i].img}.jpg`; if (r.tipo === 'montar') return `img/sab/${r.base}.jpg`; return 'img/logo.png'; };
  const th = (src, ico) => `<span class="th">${src ? `<img src="${src}" alt="" loading="lazy">` : (ico || '')}</span>`;

  const SABS = [
    { id: 'trad', w: 'AÇAÍ', bg: '#3d1048', tx: '#fff', n: 'Açaí com Guaraná', d: 'O clássico batido com guaraná. Encorpado, gelado e do jeito que o Pará ensinou.' },
    { id: 'morango', w: 'MORANGO', bg: '#c2185b', tx: '#fff0f5', n: 'Açaí com Morango', d: 'Docinho, rosado e o favorito da criançada.' },
    { id: 'maracuja', w: 'MARACUJÁ', bg: '#f2b705', tx: '#3a2600', n: 'Açaí com Maracujá', d: 'Azedinho na medida, refrescante para os dias quentes de Goiás.' },
    { id: 'ninho', w: 'NINHO', bg: '#f3e9dc', tx: '#3d1048', n: 'Trufado de Ninho', d: 'Cremoso, com gosto de leite em pó de infância.' },
    { id: 'cupu', w: 'CUPUAÇU', bg: '#d9b77e', tx: '#3b2410', n: 'Cupuaçu', d: 'A fruta amazônica de sabor marcante. Puro ou meio a meio com açaí.' },
    { id: 'zero', w: 'ZERO', bg: '#a8d672', tx: '#1c1456', n: 'Açaí Zero Açúcar', d: 'Zero açúcar, todo o sabor. A base da nossa Linha Fit.' }];

  // ---------- pilha de telas (botão voltar do celular fecha a tela de cima) ----------
  const pilha = [];
  function empilha(nome, fecha) { pilha.push({ nome, fecha }); history.pushState({ ap: nome }, ''); trava(); }
  function desempilha() { if (pilha.length) history.back(); }
  addEventListener('popstate', () => { const c = pilha.pop(); if (c) c.fecha(); trava(); });
  function trava() { document.body.classList.toggle('ap-trava', pilha.length > 0); }

  // ---------- montagem da tela inicial ----------
  const minPreco = p => Math.min(...p.tam.map(t => t[1]));
  const cats = [...new Set(PRONTOS.map(p => p.cat))];
  const slug = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

  function linhaProduto(p, i) {
    return `<button class="ap-it" onclick="APP_.produto(${i})"><div class="tx">${p.tag ? `<span class="tg">${esc(p.tag)}</span>` : ''}<h4>${esc(p.nome)}</h4><p>${esc(p.desc)}</p><div class="pr"><small>A partir de </small>${brl(minPreco(p))}</div></div><div class="im"><img src="img/${p.img}.jpg" alt="${esc(p.nome)}" loading="lazy"></div></button>`;
  }

  function monta() {
    const v = E('v-cardapio'); if (!v || E('app')) return;
    const app = document.createElement('div'); app.id = 'app';
    const destaques = PRONTOS.map((p, i) => [p, i]).filter(([p]) => p.tag);
    app.innerHTML = `
<div class="ap-bar" id="apBar"><span class="nm">Açaideira Sorvete &amp; Açaí</span>
  <button class="ap-ic" onclick="APP_.aba('busca')" aria-label="Buscar">${IC.busca}</button>
  <button class="ap-ic" onclick="APP_.compartilha()" aria-label="Compartilhar">${IC.share}</button></div>
<div class="ap-capa"><video src="video/propaganda.mp4" poster="video/poster.jpg" autoplay muted loop playsinline preload="metadata"></video></div>
<div class="ap-perfil">
  <div class="ap-pt"><div class="ap-av"><span><img src="img/logo.png" alt="Açaideira"></span></div>
    <div class="ap-nums"><div><b>14</b><small>sabores</small></div><div><b>30+</b><small>complementos</small></div><div><b>${PRONTOS.length}</b><small>taças prontas</small></div></div></div>
  <div class="ap-nome">Açaideira Sorvete &amp; Açaí</div>
  <div class="ap-bio">Seu momento mais gostoso começa aqui 💜 Açaí do seu jeito, sorvetes e taças gourmet.<br>📍 Boa Vista 2 · ao lado do Camp+ · Novo Gama-GO<br><a href="${IG}" target="_blank" rel="noopener">@acaideira.sorvete.acai</a></div>
  <div class="ap-sts" id="apSts"><span class="ap-st">🛵 Delivery</span><span class="ap-st">🏪 Retirada sem fila</span><span class="ap-st">⚡ Pix · Cartão · Dinheiro</span></div>
  <div class="ap-bts"><button class="ap-bt pri" onclick="APP_.montar()">Monte o seu</button><a class="ap-bt" href="https://wa.me/${LOJA.whats}" target="_blank" rel="noopener">WhatsApp</a><a class="ap-bt" href="${IG}" target="_blank" rel="noopener">Instagram</a></div>
</div>
<div class="ap-stories" id="apStories"></div>
<div class="ap-modo"><div class="ap-seg" id="apModo"></div></div>
<nav class="ap-tabs" id="apTabs">
  <button data-s="ap-s-dest" class="on">Destaques</button><button data-s="ap-s-monte">Monte o seu</button>${cats.map(c => `<button data-s="ap-s-${slug(c)}">${esc(c.replace('Açaídeiras ', ''))}</button>`).join('')}<button data-s="ap-s-loja">A loja</button>
</nav>
<section class="ap-sec" id="ap-s-dest"><h2>Os mais pedidos</h2><p class="s">Os queridinhos de quem já provou</p>
  <div class="ap-hs">${destaques.map(([p, i]) => `<button class="ap-hc" onclick="APP_.produto(${i})"><div class="im"><img src="img/${p.img}.jpg" alt="" loading="lazy"><span class="tg">${esc(p.tag)}</span><span class="pl">+</span></div><b>${esc(p.nome)}</b><span>${brl(minPreco(p))}</span></button>`).join('')}</div></section>
<section class="ap-sec" id="ap-s-monte"><h2>Monte o seu</h2><p class="s">Escolha tamanho, sabor, recheio e complementos</p>
  <button class="ap-ban" onclick="APP_.montar()"><div><h3>DO SEU JEITO</h3><p>Você escolhe tudo e vê o copo<br>ficando pronto na hora.</p><span class="go">Começar · a partir de ${brl(TAMANHOS[0].preco)}</span></div>${copoSVG({ tam: '500', base: 'trad', meio: ['ninho'], comps: ['c_morango', 'c_uva', 'gran'], prem: [], cob: 'condensado' })}</button>
  <div class="ap-sabs">${BASES.map(b => `<button class="ap-sab" onclick="APP_.montar('${b.id}')"><img src="img/sab/${b.id}.jpg" alt="" loading="lazy"><small>${esc(b.nome.replace('Açaí com ', '').replace('Açaí ', ''))}</small></button>`).join('')}</div></section>
${cats.map(c => `<section class="ap-sec" id="ap-s-${slug(c)}"><h2>${esc(c)}</h2>${PRONTOS.map((p, i) => p.cat === c ? linhaProduto(p, i) : '').join('')}</section>`).join('')}
<section class="ap-sec" id="ap-s-loja"><h2>A loja</h2><div class="ap-info">${infoLoja()}</div></section>
<div class="ap-rod">Açaideira Sorvete &amp; Açaí · Novo Gama-GO<br><a href="#painel">🔒 Área da loja</a></div>

<button class="ap-cart" id="apCart" onclick="abrir()"><span class="q" id="apCartQ">0</span><b>Ver sacola</b><span id="apCartT">R$ 0,00</span></button>
<nav class="ap-nav" id="apNav">
  <button data-a="inicio" class="on">${IC.casa}Início</button><button data-a="busca">${IC.busca}Buscar</button><button data-a="pedidos">${IC.pedidos}Pedidos<span class="bd" id="apPedBd" hidden></span></button><button data-a="sacola">${IC.sacola}Sacola<span class="bd" id="apSacBd" hidden></span></button>
</nav>

<div class="ap-pg" id="apProd"></div>
<div class="ap-pg" id="apMont"></div>
<div class="ap-pg tb" id="apTab"></div>
<div class="ap-sv" id="apSv"></div>`;
    v.prepend(app);

    // barra superior fica sólida depois da capa
    const bar = E('apBar');
    addEventListener('scroll', () => bar.classList.toggle('solida', scrollY > 150), { passive: true });
    // abas
    E('apTabs').querySelectorAll('button').forEach(b => b.onclick = () => { const s = E(b.dataset.s); scrollTo({ top: s.getBoundingClientRect().top + scrollY - 100, behavior: 'smooth' }); });
    const secs = [...E('apTabs').querySelectorAll('button')].map(b => E(b.dataset.s));
    let tk = false;
    addEventListener('scroll', () => {
      if (tk || !APP()) return; tk = true; requestAnimationFrame(() => {
        tk = false; let at = secs[0]; secs.forEach(s => { if (s.getBoundingClientRect().top < 130) at = s; });
        E('apTabs').querySelectorAll('button').forEach(b => { const on = b.dataset.s === at.id; if (on && !b.classList.contains('on')) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); b.classList.toggle('on', on); });
      });
    }, { passive: true });
    // navegação inferior
    E('apNav').querySelectorAll('button').forEach(b => b.onclick = () => aba(b.dataset.a));
    renderStories(); renderModo(); cartBar(); statusLoja();
  }

  function infoLoja() {
    return `<a class="ap-ln" href="${MAPA}" target="_blank" rel="noopener"><i>📍</i><div><b>Endereço</b><small>${ENDERECO}</small></div></a>
<a class="ap-ln" href="https://wa.me/${LOJA.whats}" target="_blank" rel="noopener"><i>💬</i><div><b>WhatsApp</b><small>(61) 98202-2436 · tire dúvidas e acompanhe seu pedido</small></div></a>
<div class="ap-ln"><i>🛵</i><div><b>Entrega e retirada</b><small>Entrega em ${esc(LOJA.tempoEntrega)} · retirada em cerca de ${esc(LOJA.tempoRetirada)}, sem fila</small></div></div>
<div class="ap-ln"><i>💳</i><div><b>Pagamento</b><small>Pix, cartão online (Mercado Pago) ou cartão, Pix e dinheiro na entrega</small></div></div>
<div class="ap-ln"><i>⚠️</i><div><b>Alérgenos</b><small>Alguns produtos podem conter leite, amendoim, castanhas, soja e glúten, e pode haver contato cruzado. Tem alergia? Fale com a gente antes de pedir.</small></div></div>`;
  }

  function statusLoja() {
    const c = window.API_ONLINE; if (!c) return;
    const s = E('apSts'); if (!s || s.querySelector('.ab,.fe')) return;
    s.insertAdjacentHTML('afterbegin', c.aberto ? '<span class="ap-st ab">● Aberto agora</span>' : '<span class="ap-st fe">● Fechado agora</span>');
  }

  function renderModo() {
    const b = E('apModo'); if (!b) return;
    const taxaMin = Math.min(...BAIRROS.map(x => x.t).filter(t => t > 0));
    b.innerHTML = `<button data-m="entrega" class="${ck.modo === 'entrega' ? 'on' : ''}"><b>🛵 Entrega</b><small>${esc(LOJA.tempoEntrega)}${isFinite(taxaMin) ? ' · a partir de ' + brl(taxaMin) : ''}</small></button><button data-m="retirada" class="${ck.modo === 'retirada' ? 'on' : ''}"><b>🏪 Retirada</b><small>${esc(LOJA.tempoRetirada)} · grátis</small></button>`;
    b.querySelectorAll('button').forEach(x => x.onclick = () => { ck.modo = x.dataset.m; renderModo(); });
  }

  // ---------- barra da sacola ----------
  function cartBar(pula) {
    const q = sacola.reduce((s, i) => s + i.qtd, 0), c = E('apCart'); if (!c) return;
    E('apCartQ').textContent = q; E('apCartT').textContent = brl(sub());
    c.classList.toggle('on', q > 0);
    const bd = E('apSacBd'); bd.hidden = !q; bd.textContent = q;
    if (pula && q) { c.classList.remove('pula'); void c.offsetWidth; c.classList.add('pula'); }
    const n = meus().length, pb = E('apPedBd'); if (pb) { pb.hidden = !n; pb.textContent = n; }
  }

  // ---------- página do produto pronto ----------
  let P = null;
  function produto(i) {
    P = { i, t: 0, qtd: 1, obs: '' };
    const pg = E('apProd'); renderProduto();
    pg.querySelector('.sc').scrollTop = 0;
    pg.classList.add('on'); empilha('produto', () => pg.classList.remove('on'));
  }
  function renderProduto() {
    const p = PRONTOS[P.i], pg = E('apProd'), sc = pg.querySelector('.sc'), st = sc ? sc.scrollTop : 0;
    pg.innerHTML = `<div class="ap-pbar">${esc(p.nome)}</div><button class="ap-ic ap-x" onclick="APP_.volta()" aria-label="Fechar">${IC.voltar}</button>
<div class="sc"><div class="ap-hero"><img src="img/${p.img}.jpg" alt="${esc(p.nome)}"></div>
<div class="ap-pd">${p.tag ? `<span class="ap-st" style="background:#f1e6f6;color:#3d1048">${esc(p.tag)}</span>` : ''}<h2 style="margin-top:8px">${esc(p.nome)}</h2><p>${esc(p.desc)}</p><div class="pr">A partir de ${brl(minPreco(p))}</div></div>
<div class="ap-sh"><div><b>Escolha o tamanho</b><small>Escolha 1 opção</small></div><span class="ap-req ok">✓</span></div>
${p.tam.map((t, k) => `<button class="ap-op ${k === P.t ? 'on' : ''}" data-k="${k}">${th(null, copoMini(t[0]))}<div class="tx"><b>${esc(t[0])}</b><em>${brl(t[1])}</em></div><span class="ck"></span></button>`).join('')}
<div class="ap-obs"><label>Alguma observação? <small>${P.obs.length}/140</small></label><textarea maxlength="140" placeholder="Ex.: sem granola, caprichar no leite condensado" id="apObsP">${esc(P.obs)}</textarea></div></div>
<div class="ap-ft"><div class="ap-qt"><button data-q="-1">−</button><b>${P.qtd}</b><button data-q="1">+</button></div><button class="ap-add" id="apAddP"><span>Adicionar</span><span>${brl(p.tam[P.t][1] * P.qtd)}</span></button></div>`;
    rolagem(pg, st);
    pg.querySelectorAll('.ap-op').forEach(b => b.onclick = () => { P.t = +b.dataset.k; renderProduto(); });
    pg.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { P.qtd = Math.max(1, P.qtd + +b.dataset.q); renderProduto(); });
    const ta = E('apObsP'); ta.oninput = () => { P.obs = ta.value; ta.previousElementSibling.querySelector('small').textContent = ta.value.length + '/140'; };
    E('apAddP').onclick = () => {
      const t = p.tam[P.t];
      sacola.push({ nome: p.nome + ' ' + t[0], det: p.desc + (P.obs.trim() ? ' · Obs: ' + P.obs.trim() : ''), preco: t[1], qtd: P.qtd, ref: { tipo: 'pronto', i: P.i, t: P.t } });
      atualiza(); desempilha(); setTimeout(() => toast('Adicionado à sacola 💜'), 250);
    };
  }

  function rolagem(pg, st) { const sc = pg.querySelector('.sc'); sc.scrollTop = st; const f = () => pg.classList.toggle('rolou', sc.scrollTop > 180); sc.onscroll = f; f(); }
  // irPara desconta a barra branca do topo
  // ---------- Monte o seu (estilo iFood) ----------
  let M = null;
  const tamM = () => TAMANHOS.find(t => t.id === M.tam);
  const precoM = () => tamM().preco + (BASES.find(b => b.id === M.base) || { preco: 0 }).preco + M.meio.reduce((s, id) => s + MEIO.find(m => m.id === id).preco, 0) + M.prem.reduce((s, id) => s + PREM.find(p => p.id === id).preco, 0);
  function montar(base) {
    M = { tam: '400', base: base || null, meio: [], comps: [], prem: [], cob: 'condensado', qtd: 1, obs: '' };
    const pg = E('apMont'); renderMontar(); pg.querySelector('.sc').scrollTop = 0;
    pg.classList.add('on'); empilha('montar', () => pg.classList.remove('on'));
    if (base) setTimeout(() => irPara('mt-meio'), 380);
  }
  function irPara(id) { const pg = E('apMont'), s = pg.querySelector('.sc'), el = E(id); if (el) s.scrollTo({ top: el.offsetTop - 56, behavior: 'smooth' }); }
  function cab(id, titulo, sub, estado) {
    return `<div class="ap-sh" id="${id}"><div><b>${titulo}</b><small>${sub}</small></div>${estado}</div>`;
  }
  function op({ on, dis, cx, foto, ico, nome, sub, preco, attr }) {
    return `<button class="ap-op ${on ? 'on' : ''} ${dis ? 'dis' : ''} ${cx ? 'cx' : ''}" ${attr}>${th(foto, ico)}<div class="tx"><b>${esc(nome)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}${preco ? `<em>${preco}</em>` : ''}</div><span class="ck"></span></button>`;
  }
  function renderMontar() {
    const pg = E('apMont'), sc0 = pg.querySelector('.sc'), st = sc0 ? sc0.scrollTop : 0, t = tamM(), lim = t.lim;
    if (M.comps.length > lim) M.comps = M.comps.slice(0, lim);
    const nm = M.meio.length, nc = M.comps.length;
    const grupos = [['fruta', '🍓 Frutas frescas'], ['fini', '🍬 Linha Fini'], [undefined, '✨ Outros complementos']];
    const base = BASES.find(b => b.id === M.base);
    pg.innerHTML = `<div class="ap-pbar">Monte seu açaí · ${brl(precoM() * M.qtd)}</div><button class="ap-ic ap-x" onclick="APP_.volta()" aria-label="Fechar">${IC.voltar}</button>
<div class="sc">
 <div class="ap-copo" id="apCopo">${copoSVG(M)}<span class="ch">${t.ap} · ${t.nome}</span><span class="lb">${base ? esc(base.nome) : 'Escolha o sabor 👇'}</span></div>
 <div class="ap-pd"><h2>Monte seu açaí</h2><p>Escolha cada camada e veja o copo ficando pronto. Complementos inclusos no preço; recheios e cremes especiais são cobrados à parte.</p><div class="pr">A partir de ${brl(TAMANHOS[0].preco)}</div></div>
 ${cab('mt-tam', 'Tamanho', 'Escolha 1 opção', '<span class="ap-req ok">✓</span>')}
 ${TAMANHOS.map(x => op({ on: x.id === M.tam, ico: copoMini(x.nome, x.h), nome: `${x.ap} · ${x.nome}`, sub: `até ${x.lim} complementos inclusos`, preco: brl(x.preco), attr: `data-tam="${x.id}"` })).join('')}
 ${cab('mt-base', 'Sabor do açaí', 'Escolha 1 opção', M.base ? '<span class="ap-req ok">✓</span>' : '<span class="ap-req">OBRIGATÓRIO</span>')}
 ${BASES.map(b => op({ on: b.id === M.base, foto: `img/sab/${b.id}.jpg`, nome: b.nome, preco: b.preco ? '+ ' + brl(b.preco) : '', attr: `data-base="${b.id}"` })).join('')}
 ${cab('mt-meio', 'Recheio no meio do copo', 'Escolha até 2 opções', `<span class="ap-req ${nm ? 'cnt' : 'opc'}">${nm ? nm + '/2' : 'OPCIONAL'}</span>`)}
 ${Object.entries(GRUPOS_MEIO).map(([g, gt]) => `<div class="ap-sub">${gt}</div>` + MEIO.filter(m => m.id !== 'nenhum' && m.grupo === g).map(m => op({ cx: 1, on: M.meio.includes(m.id), dis: nm >= 2 && !M.meio.includes(m.id), foto: fotoMeio(m), ico: m.ico, nome: m.nome, preco: '+ ' + brl(m.preco), attr: `data-meio="${m.id}"` })).join('')).join('')}
 ${cab('mt-comp', 'Complementos', `Escolha até ${lim} · inclusos no preço`, `<span class="ap-req ${nc ? (nc >= lim ? 'ok' : 'cnt') : 'opc'}">${nc ? nc + '/' + lim : 'OPCIONAL'}</span>`)}
 ${grupos.map(([g, gt]) => `<div class="ap-sub">${gt}</div>` + COMPS.filter(c => c.grupo === g).map(c => op({ cx: 1, on: M.comps.includes(c.id), dis: nc >= lim && !M.comps.includes(c.id), foto: fotoComp(c.id), ico: c.ico, nome: c.nome.replace('Fini ', ''), sub: 'Incluso', attr: `data-comp="${c.id}"` })).join('')).join('')}
 ${cab('mt-prem', 'Cremes especiais e extras', 'Escolha quantos quiser', `<span class="ap-req ${M.prem.length ? 'cnt' : 'opc'}">${M.prem.length || 'OPCIONAL'}</span>`)}
 ${PREM.map(p => op({ cx: 1, on: M.prem.includes(p.id), foto: `img/extra/${p.id}.jpg`, ico: p.ico, nome: p.nome, preco: '+ ' + brl(p.preco), attr: `data-prem="${p.id}"` })).join('')}
 ${cab('mt-cob', 'Cobertura', 'Escolha 1 opção · inclusa', '<span class="ap-req ok">✓</span>')}
 ${COBS.map(c => op({ on: c.id === M.cob, foto: c.id !== 'nenhuma' ? `img/cob/${c.id}.jpg` : null, ico: '🚫', nome: c.nome, sub: c.id === 'nenhuma' ? '' : 'Inclusa', attr: `data-cob="${c.id}"` })).join('')}
 <div class="ap-obs"><label>Alguma observação? <small>${M.obs.length}/140</small></label><textarea maxlength="140" id="apObsM" placeholder="Ex.: pouco leite em pó, granola separada">${esc(M.obs)}</textarea></div>
</div>
<div class="ap-ft"><div class="ap-qt"><button data-q="-1">−</button><b>${M.qtd}</b><button data-q="1">+</button></div><button class="ap-add ${M.base ? '' : 'off'}" id="apAddM"><span>${M.base ? 'Adicionar' : 'Escolha o sabor'}</span><span>${brl(precoM() * M.qtd)}</span></button></div>`;
    rolagem(pg, st);
    const re = () => { renderMontar(); const s = E('apCopo').querySelector('svg'); s && s.animate([{ transform: 'scale(.94)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(.2,.9,.3,1.4)' }); };
    const tog = (arr, id, max) => { const k = arr.indexOf(id); if (k >= 0) arr.splice(k, 1); else if (!max || arr.length < max) arr.push(id); else toast(`Máximo de ${max} — desmarque um para trocar`); };
    pg.querySelectorAll('[data-tam]').forEach(b => b.onclick = () => { M.tam = b.dataset.tam; re(); });
    pg.querySelectorAll('[data-base]').forEach(b => b.onclick = () => { const novo = !M.base; M.base = b.dataset.base; re(); if (novo) setTimeout(() => irPara('mt-meio'), 120); });
    pg.querySelectorAll('[data-meio]').forEach(b => b.onclick = () => { tog(M.meio, b.dataset.meio, 2); re(); });
    pg.querySelectorAll('[data-comp]').forEach(b => b.onclick = () => { tog(M.comps, b.dataset.comp, tamM().lim); re(); });
    pg.querySelectorAll('[data-prem]').forEach(b => b.onclick = () => { tog(M.prem, b.dataset.prem); re(); });
    pg.querySelectorAll('[data-cob]').forEach(b => b.onclick = () => { M.cob = b.dataset.cob; re(); });
    pg.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { M.qtd = Math.max(1, M.qtd + +b.dataset.q); renderMontar(); });
    const ta = E('apObsM'); ta.oninput = () => { M.obs = ta.value; ta.previousElementSibling.querySelector('small').textContent = ta.value.length + '/140'; };
    E('apAddM').onclick = () => {
      if (!M.base) { irPara('mt-base'); const h = E('mt-base'); h.classList.remove('erro'); void h.offsetWidth; h.classList.add('erro'); toast('Escolha o sabor do açaí 💜'); return; }
      const t = tamM();
      const det = [BASES.find(b => b.id === M.base).nome, M.meio.length ? 'No meio: ' + M.meio.map(id => MEIO.find(m => m.id === id).nome).join(' + ') : null, ...M.comps.map(id => COMPS.find(c => c.id === id).nome), ...M.prem.map(id => PREM.find(c => c.id === id).nome), M.cob !== 'nenhuma' ? COBS.find(c => c.id === M.cob).nome : null, M.obs.trim() ? 'Obs: ' + M.obs.trim() : null].filter(Boolean).join(', ');
      sacola.push({ nome: 'Açaí ' + t.ap + ' ' + t.nome, det, preco: precoM(), qtd: M.qtd, ref: { tipo: 'montar', tam: M.tam, base: M.base, meio: [...M.meio], comps: [...M.comps], prem: [...M.prem], cob: M.cob } });
      atualiza(); desempilha(); setTimeout(() => toast('Seu açaí foi para a sacola 💜'), 250);
    };
  }

  // ---------- desenho do copo (SVG ao vivo) ----------
  const COR_BASE = { trad: '#4b1652', morango: '#9c2350', maracuja: '#5a1d50', ninho: '#6b3270', avela: '#4a1d36', cereja: '#6e1240', zero: '#3e1446', abacaxi: '#5b2255', pacoca: '#57264a', coco: '#5f2a66', banana: '#58204f', cookies: '#4f2445', cupu: '#e2c391', acaicupu: '#4b1652' };
  const COR_COMP = { c_morango: '#e23b4c', c_banana: '#f4d77a', c_uva: '#8dc63f', gran: '#b07a3b', leite: '#fbf6ee', flocos: '#f5eedd', amchoc: '#5a3418', amendoim: '#c98d4a', pacoca: '#d4a05a', choccroc: '#4a2a14', gotas: '#3b2010', biju: '#efe2c4', jujuba: '#ff5d8f', marsh: '#ffe4f0', confete: '#3fa7f5', gominha: '#ffb02e', cereja: '#c4122f' };
  const COR_COB = { condensado: '#f6e7c6', choc: '#4a2511', morc: '#d6336c', mel: '#e8a317' };
  function copoSVG(s) {
    const t = TAMANHOS.find(x => x.id === s.tam) || TAMANHOS[1];
    const top = 14, bot = 168, H = bot - top, xl = y => 16 + 14 * (y - top) / H, xr = y => 124 - 14 * (y - top) / H;
    const fill = bot - H * t.h, FH = bot - fill;
    const cb = COR_BASE[s.base] || '#4b1652', cb2 = s.base === 'acaicupu' ? '#e2c391' : cb;
    const meio = (s.meio || []).map(id => MEIO.find(m => m.id === id)).filter(Boolean);
    let ly = '';
    const y1 = bot - FH * (meio.length ? .42 : 1);
    ly += `<rect x="0" y="${y1}" width="140" height="${bot - y1 + 2}" fill="${cb2}"/>`;
    let y = y1;
    meio.forEach(m => { const h = FH * .11; y -= h; ly += `<rect x="0" y="${y}" width="140" height="${h}" fill="${m.cor || '#e8d2b0'}"/>`; });
    if (meio.length) ly += `<rect x="0" y="${fill}" width="140" height="${y - fill}" fill="${cb}"/>`;
    // brilho e textura
    ly += `<rect x="0" y="${fill}" width="140" height="${FH}" fill="url(#apTx)" opacity=".35"/>`;
    const L = xl(fill), R = xr(fill), W = R - L, cx = (L + R) / 2;
    const dome = `<path d="M${L - 2} ${fill + 1} C ${L + W * .1} ${fill - 26}, ${R - W * .1} ${fill - 26}, ${R + 2} ${fill + 1} Z" fill="${cb}"/>`;
    let tops = '';
    (s.prem || []).forEach((id, k) => { const c = { ninho: '#fbf3e4', avela: '#5a3418', cookies: '#d8c7b0', coco: '#fffaf0', cramend: '#c98d4a', kinder: '#7a4a24', maltine: '#7b5233', farinha: '#efe2c4' }[id] || '#f3e2bf'; const px = cx + (k % 2 ? 1 : -1) * (8 + k * 6); tops += `<ellipse cx="${px}" cy="${fill - 12}" rx="11" ry="6" fill="${c}"/>`; });
    const cob = COR_COB[s.cob];
    if (cob) tops += `<path d="M${L + W * .12} ${fill - 8} Q ${cx} ${fill - 22} ${R - W * .12} ${fill - 8} L ${R - W * .12} ${fill + 6} Q ${R - W * .2} ${fill + 16} ${R - W * .26} ${fill + 4} Q ${cx + 6} ${fill + 20} ${cx} ${fill + 3} Q ${cx - 10} ${fill + 14} ${L + W * .3} ${fill + 2} Q ${L + W * .2} ${fill + 18} ${L + W * .12} ${fill + 4} Z" fill="${cob}" opacity=".95"/>`;
    (s.comps || []).forEach((id, k) => { const n = 5; for (let j = 0; j < n; j++) { const a = ((k * 37 + j * 71) % 100) / 100, b = ((k * 53 + j * 29) % 100) / 100; const px = L + 8 + a * (W - 16), py = fill - 6 - Math.sin(a * Math.PI) * 16 + b * 6; const big = id.startsWith('c_'); tops += big ? `<circle cx="${px}" cy="${py}" r="${id === 'c_morango' ? 5.5 : 4.5}" fill="${COR_COMP[id]}" stroke="#0002"/>` : `<rect x="${px - 2.2}" y="${py - 2.2}" width="4.4" height="4.4" rx="1.4" transform="rotate(${a * 90} ${px} ${py})" fill="${COR_COMP[id] || '#f0a'}"/>`; } });
    return `<svg viewBox="0 -14 140 186" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Seu copo">
<defs><clipPath id="apCl"><path d="M16 ${top} H124 L110 ${bot} Q109 ${bot + 4} 105 ${bot + 4} H35 Q31 ${bot + 4} 30 ${bot} Z"/></clipPath>
<pattern id="apTx" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#fff" opacity=".25"/><circle cx="9" cy="8" r=".9" fill="#000" opacity=".25"/></pattern></defs>
<g clip-path="url(#apCl)">${ly}</g>${dome}${tops}
<path d="M16 ${top} H124 L110 ${bot} Q109 ${bot + 4} 105 ${bot + 4} H35 Q31 ${bot + 4} 30 ${bot} Z" fill="#ffffff14" stroke="#ffffffaa" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M26 ${top + 10} L36 ${bot - 8}" stroke="#ffffff59" stroke-width="4" stroke-linecap="round"/>
<rect x="11" y="${top - 5}" width="118" height="7" rx="3.5" fill="#ffffffcc"/></svg>`;
  }
  function copoMini(rot, h) {
    const hh = h || (parseInt(rot) >= 700 ? .95 : parseInt(rot) >= 500 ? .78 : parseInt(rot) >= 400 ? .66 : parseInt(rot) >= 300 ? .55 : .45);
    const f = 40 - 34 * hh;
    return `<svg viewBox="0 0 34 44"><path d="M4 4h26l-3 36H7z" fill="#fff" stroke="#3d1048" stroke-width="2" stroke-linejoin="round"/><path d="M${4 + 3 * (f - 4) / 36} ${f}H${30 - 3 * (f - 4) / 36}L27 40H7z" fill="#5b1a6b"/></svg>`;
  }

  // ---------- sacola (tela cheia) ----------
  const _telaSacola = telaSacola;
  telaSacola = function () {
    if (!APP()) return _telaSacola();
    E('dTitulo').textContent = 'Sacola';
    if (!sacola.length) {
      E('dBody').innerHTML = `<div class="ap-vz" style="padding-top:90px"><big>🥣</big><b style="font-size:16px;color:#1f1324">Sua sacola está vazia</b><br>Que tal montar um açaí do seu jeito?</div>`;
      E('dFoot').innerHTML = `<button class="btn" onclick="fechar();setTimeout(()=>APP_.montar(),350)">Montar meu açaí</button>`; return;
    }
    E('dBody').innerHTML = `<div class="ap-sc-loja"><img src="img/logo.png" alt=""><div><b>Açaideira Sorvete &amp; Açaí</b><small>${ck.modo === 'entrega' ? '🛵 Entrega · ' + esc(LOJA.tempoEntrega) : '🏪 Retirada · ' + esc(LOJA.tempoRetirada)}</small></div></div>` +
      sacola.map((it, i) => `<div class="ap-sc-it"><div class="im"><img src="${fotoItem(it)}" alt=""></div><div class="tx"><b>${esc(it.nome)}</b><small>${esc(it.det || '')}</small><span class="pr">${brl(it.preco * it.qtd)}</span></div><div class="ap-qt"><button onclick="APP_.qtd(${i},-1)" aria-label="Diminuir">${it.qtd > 1 ? '−' : '🗑'}</button><b>${it.qtd}</b><button onclick="APP_.qtd(${i},1)" aria-label="Aumentar">+</button></div></div>`).join('') +
      `<button class="ap-sc-mais" onclick="fechar()">+ Adicionar mais itens</button>`;
    E('dFoot').innerHTML = `<div class="resumo-linha"><span>Subtotal</span><span>${brl(sub())}</span></div><div class="resumo-linha"><span>Taxa de entrega</span><span>${ck.modo === 'retirada' ? 'Grátis' : 'calculada pelo bairro'}</span></div><div class="total"><span>Total</span><span>${brl(sub() + (ck.modo === 'retirada' ? 0 : taxa()))}</span></div><button class="btn" onclick="telaCheckout()">Continuar</button>`;
  };
  function qtd(i, d) { const it = sacola[i]; if (!it) return; it.qtd += d; if (it.qtd <= 0) sacola.splice(i, 1); atualiza(); telaSacola(); }

  const _abrir = abrir, _fechar = fechar;
  abrir = function () { _abrir(); if (APP() && !pilha.some(p => p.nome === 'sacola')) empilha('sacola', () => { _fechar(); cartBar(); }); };
  fechar = function () { if (APP() && pilha.length && pilha[pilha.length - 1].nome === 'sacola') desempilha(); else _fechar(); };
  E('fechar').onclick = () => fechar(); E('ov').onclick = () => fechar();
  const ab = E('abrirCarrinho'); if (ab) ab.onclick = () => abrir();

  const _atualiza = atualiza;
  atualiza = function () { _atualiza(); cartBar(true); };

  // guarda os pedidos do cliente (modo WhatsApp) para a aba Pedidos
  const _finaliza = finaliza;
  finaliza = function (cod, total) {
    try { const l = JSON.parse(localStorage.getItem('acaideira_meus') || '[]'); l.unshift({ c: cod, d: Date.now(), total, modo: ck.modo, itens: sacola.map(i => ({ ...i })) }); localStorage.setItem('acaideira_meus', JSON.stringify(l.slice(0, 10))); } catch (e) { }
    _finaliza(cod, total); cartBar();
  };
  function meus() { try { return JSON.parse(localStorage.getItem('acaideira_meus') || '[]'); } catch (e) { return []; } }

  // ---------- abas inferiores: busca, pedidos, sacola ----------
  let abaAtual = 'inicio';
  function aba(a) {
    if (a === 'sacola') { abrir(); return; }
    const pg = E('apTab');
    abaAtual = a;
    E('apNav').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.a === a));
    if (a === 'inicio') { pg.classList.remove('on'); if (scrollY > 10 && !pg.dataset.was) scrollTo({ top: 0, behavior: 'smooth' }); delete pg.dataset.was; return; }
    pg.dataset.was = '1';
    if (a === 'busca') {
      pg.innerHTML = `<div class="ap-ph"><h3 style="padding:0">Buscar</h3></div><div class="ap-busca">${IC.busca}<input id="apQ" type="search" placeholder="Buscar no cardápio da Açaideira" autocomplete="off"></div><div class="sc" id="apRes"></div>`;
      const q = E('apQ'); q.oninput = () => busca(q.value); busca('');
      pg.classList.add('on'); setTimeout(() => q.focus(), 300);
    } else if (a === 'pedidos') {
      const l = meus();
      pg.innerHTML = `<div class="ap-ph"><h3 style="padding:0">Meus pedidos</h3></div><div class="sc">${l.length ? l.map((p, k) => `<div class="ap-ped"><div class="h"><b>Pedido #${esc(p.c)}</b><span>${new Date(p.d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · ${new Date(p.d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div>
        ${p.itens ? `<ul>${p.itens.map(i => `<li>${i.qtd}× ${esc(i.nome)}</li>`).join('')}</ul><div class="h"><span>${p.modo === 'retirada' ? '🏪 Retirada' : '🛵 Entrega'}</span><b>${brl(p.total || 0)}</b></div>` : '<ul><li>Pedido feito pelo site</li></ul>'}
        <div class="bs">${p.t ? `<a class="pri" href="#pedido/${esc(p.t)}">Acompanhar</a>` : `<a href="https://wa.me/${LOJA.whats}?text=${encodeURIComponent('Olá! Quero saber do meu pedido #' + p.c)}" target="_blank" rel="noopener">Falar com a loja</a>`}${p.itens ? `<button class="pri" onclick="APP_.repetir(${k})">Pedir de novo</button>` : ''}</div></div>`).join('') : `<div class="ap-vz"><big>🧾</big><b style="color:#1f1324">Nenhum pedido ainda</b><br>Seus pedidos aparecem aqui depois que você finalizar.</div>`}</div>`;
      pg.classList.add('on');
    }
  }
  function busca(q) {
    const n = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(), k = n(q.trim());
    const pr = PRONTOS.map((p, i) => [p, i]).filter(([p]) => !k || n(p.nome + ' ' + p.desc + ' ' + p.cat).includes(k));
    const sb = k ? BASES.filter(b => n(b.nome).includes(k)) : [];
    E('apRes').innerHTML = (sb.length ? `<div class="ap-sub">Montar com o sabor</div>` + sb.map(b => `<button class="ap-op" onclick="APP_.aba('inicio');APP_.montar('${b.id}')">${th(`img/sab/${b.id}.jpg`)}<div class="tx"><b>${esc(b.nome)}</b><small>Monte o seu com esse sabor</small></div></button>`).join('') : '') +
      (pr.length ? (k ? '<div class="ap-sub">Taças e copos</div>' : '<div class="ap-sub">Todo o cardápio</div>') + pr.map(([p, i]) => linhaProduto(p, i)).join('') : '') +
      (!pr.length && !sb.length ? `<div class="ap-vz"><big>🔎</big>Não achamos “${esc(q)}”.<br>Que tal <a href="#" onclick="APP_.aba('inicio');APP_.montar();return false" style="color:#3d1048;font-weight:700">montar do seu jeito</a>?</div>` : '');
  }
  function repetir(k) { const p = meus()[k]; if (!p || !p.itens) return; p.itens.forEach(i => sacola.push({ ...i })); atualiza(); aba('inicio'); setTimeout(abrir, 200); }

  // ---------- stories ----------
  const pr = i => ({ i: `img/${PRONTOS[i].img}.jpg`, t: PRONTOS[i].nome, d: PRONTOS[i].desc, cta: ['Pedir · ' + brl(minPreco(PRONTOS[i])), () => produto(i)] });
  const STORIES = [
    { id: 'monte', nome: 'Monte o seu', mais: 1 },
    { id: 'taca', nome: 'Na taça', capa: 'video/poster.jpg', sl: [{ v: 'video/propaganda.mp4', p: 'video/poster.jpg', cont: 1, t: 'A taça se montando', d: 'Açaí, creme de Ninho, morangos, balinhas e Nutella caindo na taça.', cta: ['Quero o Santo Especial', () => produto(7)] }] },
    { id: 'copos', nome: 'Vídeos', capa: 'video/colorido.jpg', sl: [{ v: 'video/colorido.mp4', p: 'video/colorido.jpg', t: 'Copo Colorido', d: 'Marshmallow, M&M e muita cor.', cta: ['Montar o meu', () => montar()] }, { v: 'video/frutas.mp4', p: 'video/frutas.jpg', t: 'Taça de Frutas', d: 'Banana, uva e morango fresquinhos.', cta: ['Pedir a Tropical', () => produto(2)] }, { v: 'video/cascao.mp4', p: 'video/cascao.jpg', t: 'Cascão', d: 'Sorvete na casquinha crocante.', cta: ['Pedir no WhatsApp', () => open(`https://wa.me/${LOJA.whats}?text=${encodeURIComponent('Olá! Quero um Cascão 🍦')}`, '_blank')] }] },
    { id: 'sabores', nome: 'Sabores', capa: 'img/sab/morango.jpg', sl: SABS.map(s => ({ sab: s, cta: ['Montar com esse sabor', () => montar(s.id)] })) },
    { id: 'premio', nome: 'Prêmio', capa: 'img/branca.jpg', sl: [4, 5, 6, 7].map(pr) },
    { id: 'trad', nome: 'Tradicionais', capa: 'img/m_trad2.jpg', sl: [0, 1, 2, 3].map(pr) },
    { id: 'kids', nome: 'Zero & Kids', capa: 'img/m_kids.jpg', sl: [8, 9].map(pr) },
    { id: 'vitrine', nome: 'Vitrine', capa: 'img/g2.jpg', sl: [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ i: `img/g${n}.jpg`, t: 'Direto da vitrine', d: 'Nossas taças de pertinho, feitas na hora.', cta: ['Ver o cardápio', () => { const s = E('ap-s-dest'); scrollTo({ top: s.getBoundingClientRect().top + scrollY - 100, behavior: 'smooth' }); }] })) }];
  const vistos = () => { try { return JSON.parse(localStorage.getItem('acaideira_vistos') || '[]'); } catch (e) { return []; } };
  function renderStories() {
    const v = vistos();
    E('apStories').innerHTML = STORIES.map((s, k) => `<button class="ap-sto ${v.includes(s.id) ? 'visto' : ''}" data-k="${k}"><div class="rg ${s.mais ? 'mais' : ''}"><span>${s.mais ? '+' : `<img src="${s.capa}" alt="" loading="lazy">`}</span></div><small>${esc(s.nome)}</small></button>`).join('');
    E('apStories').querySelectorAll('.ap-sto').forEach(b => b.onclick = () => { const s = STORIES[+b.dataset.k]; if (s.mais) montar(); else story(+b.dataset.k); });
  }
  let S = null;
  function story(k, j = 0) {
    const sv = E('apSv');
    if (!S) { S = { k, j }; sv.classList.add('on'); empilha('story', () => { pararStory(); sv.classList.remove('on'); sv.innerHTML = ''; S = null; renderStories(); }); }
    S.k = k; S.j = j;
    const st = STORIES[k], sl = st.sl[j];
    try { const v = vistos(); if (!v.includes(st.id)) { v.push(st.id); localStorage.setItem('acaideira_vistos', JSON.stringify(v)); } } catch (e) { }
    let md = '';
    if (sl.v) md = `<div class="md ${sl.cont ? 'cont' : ''}">${sl.cont ? `<div class="blur" style="background-image:url(${sl.p})"></div>` : ''}<video src="${sl.v}" poster="${sl.p}" playsinline muted autoplay preload="auto"></video></div>`;
    else if (sl.sab) md = `<div class="md" style="background:${sl.sab.bg};color:${sl.sab.tx}"><div class="sab"><div class="w">${sl.sab.w}</div><img src="img/sab/${sl.sab.id}.jpg" alt=""></div></div>`;
    else md = `<div class="md"><div class="blur" style="background-image:url(${sl.i})"></div><img src="${sl.i}" alt="" style="position:relative;z-index:1;object-fit:contain"></div>`;
    const tt = sl.sab ? sl.sab.n : sl.t, dd = sl.sab ? sl.sab.d : sl.d, cor = sl.sab ? sl.sab.tx : '#fff';
    sv.className = 'ap-sv on' + (sl.v ? ' video' : '');
    sv.innerHTML = `<div class="bars">${st.sl.map((_, x) => `<i><b style="width:${x < j ? 100 : 0}%"></b></i>`).join('')}</div>
<div class="hd"><img src="img/logo.png" alt=""><span>acaideira <small>· ${esc(st.nome)}</small></span><button class="fx" aria-label="Fechar">×</button></div>
${md}<button class="som" aria-label="Som">🔇</button>
<div class="tx" style="color:${cor};${sl.sab ? 'text-shadow:none' : ''}"><h4 style="color:${cor}">${esc(tt)}</h4><p>${esc(dd || '')}</p></div>
<div class="zn e"></div><div class="zn d"></div>${sl.cta ? `<button class="cta">${esc(sl.cta[0])}</button>` : ''}`;
    sv.querySelector('.fx').onclick = () => desempilha();
    if (sl.cta) sv.querySelector('.cta').onclick = () => { const f = sl.cta[1]; desempilha(); setTimeout(f, 300); };
    const bar = sv.querySelectorAll('.bars b')[j];
    const vid = sv.querySelector('video');
    let dur = 5000, t0 = performance.now(), pausa = 0, pausadoEm = 0;
    const tick = now => {
      if (!S || S.k !== k || S.j !== j) return;
      let p;
      if (vid && vid.duration) p = vid.currentTime / vid.duration; else if (vid) p = 0; else p = (now - t0 - pausa) / dur;
      if (!pausadoEm) bar.style.width = Math.min(100, p * 100) + '%';
      if (p >= 1 || (vid && vid.ended)) return proximo();
      S.raf = requestAnimationFrame(tick);
    };
    S.raf = requestAnimationFrame(tick);
    S.pausa = on => { if (on) { pausadoEm = performance.now(); vid && vid.pause(); } else { if (pausadoEm) pausa += performance.now() - pausadoEm; pausadoEm = 0; vid && vid.play().catch(() => { }); } };
    if (vid) { vid.play().catch(() => { }); const sb = sv.querySelector('.som'); sb.onclick = e => { e.stopPropagation(); vid.muted = !vid.muted; sb.textContent = vid.muted ? '🔇' : '🔊'; }; }
    let segurou = false, tm;
    sv.querySelectorAll('.zn').forEach(z => {
      z.onpointerdown = () => { segurou = false; tm = setTimeout(() => { segurou = true; S && S.pausa(true); }, 220); };
      z.onpointerup = () => { clearTimeout(tm); if (segurou) { S && S.pausa(false); return; } z.classList.contains('e') ? anterior() : proximo(); };
      z.onpointerleave = () => { clearTimeout(tm); if (segurou) { segurou = false; S && S.pausa(false); } };
    });
    // arrastar para baixo fecha
    let y0 = null; sv.ontouchstart = e => { y0 = e.touches[0].clientY; }; sv.ontouchend = e => { if (y0 != null && e.changedTouches[0].clientY - y0 > 90) desempilha(); y0 = null; };
  }
  function pararStory() { if (S) cancelAnimationFrame(S.raf); const v = E('apSv').querySelector('video'); if (v) v.pause(); }
  function proximo() { if (!S) return; pararStory(); const st = STORIES[S.k]; if (S.j < st.sl.length - 1) story(S.k, S.j + 1); else { let n = S.k + 1; while (n < STORIES.length && STORIES[n].mais) n++; if (n < STORIES.length) story(n, 0); else desempilha(); } }
  function anterior() { if (!S) return; pararStory(); if (S.j > 0) story(S.k, S.j - 1); else if (S.k > 1) story(S.k - 1, 0); else story(S.k, 0); }

  function compartilha() {
    const d = { title: 'Açaideira Sorvete & Açaí', text: 'Monte seu açaí na Açaideira 💜', url: location.href.split('#')[0] };
    if (navigator.share) navigator.share(d).catch(() => { }); else { (navigator.clipboard ? navigator.clipboard.writeText(d.url) : Promise.reject()).then(() => toast('Link copiado ✅'), () => toast(d.url)); }
  }

  window.APP_ = { produto, montar, volta: desempilha, aba, qtd, repetir, compartilha, story: k => story(k || 1) };

  function liga() {
    document.body.classList.toggle('app', mq.matches);
    if (mq.matches) { monta(); cartBar(); }
  }
  (mq.addEventListener ? mq.addEventListener('change', liga) : mq.addListener(liga));
  liga();
  // status "aberto/fechado" quando o servidor responder
  let tent = 0; const iv = setInterval(() => { statusLoja(); renderModo(); if (window.API_ONLINE || ++tent > 10) clearInterval(iv); }, 800);
})();
