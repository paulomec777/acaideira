// Açaideira — APP no celular: estrutura de iFood, visual noturno premium da marca.
// Usa o mesmo catálogo, sacola, checkout e o copo animado do site.
(function () {
  const mq = matchMedia('(max-width:700px)');
  const APP = () => document.body.classList.contains('app');
  const E = id => document.getElementById(id);
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const vibra = n => { try { navigator.vibrate && navigator.vibrate(n || 8); } catch (e) { } };
  const IG = 'https://instagram.com/acaideira.sorvete.acai';
  const ENDERECO = 'Av. Lago Azul, Boa Vista 2, Qd 1, Lt 4, Loja 4 — ao lado do Camp+, Novo Gama-GO';
  const MAPA = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Av. Lago Azul, Boa Vista 2, Novo Gama - GO, Açaideira');

  const sv = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const IC = {
    casa: sv('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
    busca: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    pedidos: sv('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
    sacola: sv('<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
    voltar: sv('<path d="M15 18l-6-6 6-6"/>'),
    share: sv('<path d="M12 3v13"/><path d="m7 8 5-5 5 5"/><path d="M5 14v6h14v-6"/>')
  };
  const fotoComp = id => (typeof FOTOS_COMP !== 'undefined' && FOTOS_COMP[id]) || id === 'f_beijinho' ? `img/comp/${id}.jpg` : null;
  const fotoMeio = m => m.foto || (['banana', 'condensado', 'cookies', 'granola', 'morango', 'ninho', 'nutella', 'pacoca'].includes(m.id) ? `img/rech/${m.id}.jpg` : null);
  const fotoItem = it => { const r = it.ref || {}; if (r.tipo === 'pronto' && PRONTOS[r.i]) return `img/${PRONTOS[r.i].img}.jpg`; if (r.tipo === 'montar') return `img/sab/${r.base}.jpg`; return 'img/logo.png'; };
  const minPreco = p => Math.min(...p.tam.map(t => t[1]));
  const cats = [...new Set(PRONTOS.map(p => p.cat))];
  const slug = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const curto = n => n.replace(' (Tradicional)', '').replace(' (meio a meio)', ' ½').replace('Açaí com ', '').replace('Açaí ', '');

  const SABS = [
    { id: 'trad', w: 'AÇAÍ', bg: '#3d1048', tx: '#ffffff', n: 'Açaí com Guaraná', d: 'O clássico batido com guaraná. Encorpado, gelado e do jeito que o Pará ensinou.' },
    { id: 'morango', w: 'MORANGO', bg: '#c2185b', tx: '#fff0f5', n: 'Açaí com Morango', d: 'Docinho, rosado e o favorito da criançada.' },
    { id: 'maracuja', w: 'MARACUJÁ', bg: '#f2b705', tx: '#3a2600', n: 'Açaí com Maracujá', d: 'Azedinho na medida, refrescante para os dias quentes de Goiás.' },
    { id: 'ninho', w: 'NINHO', bg: '#f3e9dc', tx: '#3d1048', n: 'Trufado de Ninho', d: 'Cremoso, com gosto de leite em pó de infância.' },
    { id: 'cupu', w: 'CUPUAÇU', bg: '#d9b77e', tx: '#3b2410', n: 'Cupuaçu', d: 'A fruta amazônica de sabor marcante. Puro ou meio a meio com açaí.' },
    { id: 'zero', w: 'ZERO', bg: '#a8d672', tx: '#1c1456', n: 'Açaí Zero Açúcar', d: 'Zero açúcar, todo o sabor. A base da nossa Linha Fit.' }];

  // ---------- pilha de telas: o "voltar" do celular fecha a tela de cima ----------
  // fechar pelo X fecha na hora (não depende do histórico, que pode falhar dentro de prévias)
  const pilha = []; let ignora = 0;
  function empilha(nome, fecha) { let ok = false; try { history.pushState({ ap: nome }, ''); ok = true; } catch (e) { } pilha.push({ nome, fecha, ok }); trava(); }
  function desempilha() { const c = pilha.pop(); if (!c) return; c.fecha(); trava(); if (c.ok) { ignora++; try { history.back(); } catch (e) { ignora--; } setTimeout(() => { ignora = 0; }, 700); } }
  addEventListener('popstate', () => { if (ignora) { ignora--; return; } const c = pilha.pop(); if (c) c.fecha(); trava(); });
  function trava() { document.body.classList.toggle('ap-trava', pilha.length > 0); }

  // ---------- tela inicial ----------
  function linhaProduto(p, i) {
    return `<button class="ap-it ap-rv" onclick="APP_.produto(${i})"><div class="tx">${p.tag ? `<span class="tg">${esc(p.tag)}</span>` : ''}<h4>${esc(p.nome)}</h4><p>${esc(p.desc)}</p><div class="pr"><small>a partir de</small>${brl(minPreco(p))}</div></div><div class="im"><img src="img/${p.img}.jpg" alt="${esc(p.nome)}" loading="lazy"><span class="ap-plus">+</span></div></button>`;
  }
  function monta() {
    const v = E('v-cardapio'); if (!v || E('app')) return;
    const app = document.createElement('div'); app.id = 'app';
    const dest = PRONTOS.map((p, i) => [p, i]).filter(([p]) => p.tag);
    const tick = ['#MONTEDOSEUJEITO', 'RETIRADA SEM FILA', 'PEÇA PELO SITE', '14 SABORES', '+30 COMPLEMENTOS', 'FEITO NA HORA'];
    app.innerHTML = `
<div class="ap-bar" id="apBar"><span class="ap-logo">Açaí<span>deira</span></span>
  <button class="ap-ic" onclick="APP_.aba('busca')" aria-label="Buscar">${IC.busca}</button>
  <button class="ap-ic" onclick="APP_.compartilha()" aria-label="Compartilhar">${IC.share}</button></div>
<header class="ap-hero" id="apHero">
  <div class="bgv" id="apBgv"><video src="video/propaganda.mp4" poster="video/poster.jpg" autoplay muted loop playsinline preload="metadata"></video></div>
  <div class="ap-sel">+30<small>COMPLEMENTOS</small></div>
  <div id="apHc"><span class="ap-chip" id="apChip"><i></i>Boa Vista 2 · Novo Gama-GO</span>
  <h1>NÃO É SÓ AÇAÍ,<br>É <span>AÇAIDEIRA.</span></h1>
  <p>14 sabores de açaí, +30 complementos e o seu jeito de montar. Peça aqui e receba em casa, ou retire sem fila.</p>
  <div class="ap-ctas"><button class="ap-cta v" onclick="APP_.montar()">MONTE O SEU</button><button class="ap-cta o" onclick="APP_.vaiPara('ap-s-dest')">CARDÁPIO</button></div>
  <div class="ap-info"><span>${ICO.moto}Delivery</span><span>${ICO.loja}Retirada sem fila</span><span>${ICO.pix}Pix · Cartão · Dinheiro</span></div></div>
</header>
<div class="ap-stories" id="apStories"></div>
<div class="ap-modo"><div class="ap-seg" id="apModo"></div></div>
<div id="apDeNovo"></div>
<div class="ap-tick"><div>${[...tick, ...tick].map(t => `<span>${t}</span><span>✦</span>`).join('')}</div></div>
<nav class="ap-tabs" id="apTabs"><button data-s="ap-s-dest" class="on">Destaques</button><button data-s="ap-s-monte">Monte o seu</button><button data-s="ap-s-sab">Sabores</button>${cats.map(c => `<button data-s="ap-s-${slug(c)}">${esc(c.replace('Açaídeiras ', ''))}</button>`).join('')}<button data-s="ap-s-loja">A loja</button></nav>

<section class="ap-sec" id="ap-s-dest"><div class="ap-h ap-rv"><h2>Mais pedidos</h2></div><p class="ap-sub2 ap-rv">Os queridinhos de quem já provou</p>
  <div class="ap-hs" id="apHs">${dest.map(([p, i]) => `<button class="ap-hc" onclick="APP_.produto(${i})"><div class="im"><img src="img/${p.img}.jpg" alt="" loading="lazy"><span class="tg">${esc(p.tag)}</span><div class="bd"><b>${esc(p.nome)}</b><small>${esc(p.desc)}</small><div class="pr"><span><em>a partir de</em>${brl(minPreco(p))}</span><span class="ap-plus">+</span></div></div></div></button>`).join('')}</div>
  <div class="ap-dots" id="apHsD">${dest.map((_, k) => `<i class="${k ? '' : 'on'}"></i>`).join('')}</div></section>

<section class="ap-sec" id="ap-s-monte"><button class="ap-ban ap-rv" onclick="APP_.montar()"><h3>MONTE<br>DO SEU <span>JEITO</span></h3><p>Escolha cada camada e veja os ingredientes caindo no seu copo.</p><span class="go">COMEÇAR · ${brl(TAMANHOS[0].preco)}</span>
  <div class="ap-orb"><div class="sc"></div><img class="f" src="img/anim/morango.webp" style="left:6px;top:10px" alt=""><img class="f" src="img/anim/banana.webp" style="right:44px;top:-6px;animation-delay:-1.5s" alt=""><img class="f" src="img/anim/uva.webp" style="left:18px;bottom:6px;width:44px;animation-delay:-3s" alt=""><img class="f" src="img/anim/granola.webp" style="right:40px;bottom:-4px;animation-delay:-2.2s" alt=""></div></button></section>

<section class="ap-sabw" id="ap-s-sab"><div class="ap-h"><h2>Sabores da casa</h2></div><p class="ap-sub2">Deslize e escolha a base do seu copo</p>
  <div class="ap-sw" id="apSw">${SABS.map(s => `<div class="ap-sc"><div class="w">${s.w}</div><img src="img/sab/${s.id}.jpg" alt="" loading="lazy"><h4>${esc(s.n)}</h4><p>${esc(s.d)}</p><button onclick="APP_.montar('${s.id}')">Montar com esse sabor →</button></div>`).join('')}</div>
  <div class="ap-dots" id="apSwD">${SABS.map((_, k) => `<i class="${k ? '' : 'on'}"></i>`).join('')}</div>
  <div class="ap-chips">${BASES.filter(b => !SABS.some(s => s.id === b.id)).map(b => `<button onclick="APP_.montar('${b.id}')"><img src="img/sab/${b.id}.jpg" alt="" loading="lazy">${esc(curto(b.nome))}</button>`).join('')}</div></section>

${cats.map(c => `<section class="ap-sec" id="ap-s-${slug(c)}"><div class="ap-h ap-rv"><h2>${esc(c.replace('Açaídeiras ', ''))}</h2><small>${PRONTOS.filter(p => p.cat === c).length} opções</small></div><div class="ap-list">${PRONTOS.map((p, i) => p.cat === c ? linhaProduto(p, i) : '').join('')}</div></section>`).join('')}

<section class="ap-sec" id="ap-s-loja"><div class="ap-h ap-rv"><h2>A loja</h2></div><div class="ap-loja ap-rv">${infoLoja()}</div></section>
<div class="ap-rod"><b>AÇAIDEIRA</b>Sorvete &amp; Açaí · Seu momento mais gostoso começa aqui<br><a href="${IG}" target="_blank" rel="noopener">@acaideira.sorvete.acai</a></div>

<button class="ap-cart" id="apCart" onclick="abrir()"><span class="q" id="apCartQ">0</span><b>VER SACOLA</b><span id="apCartT">R$ 0,00</span></button>
<nav class="ap-nav" id="apNav"><button data-a="inicio" class="on">${IC.casa}Início</button><button data-a="busca">${IC.busca}Buscar</button><button data-a="pedidos">${IC.pedidos}Pedidos<span class="bd" id="apPedBd" hidden></span></button><button data-a="sacola">${IC.sacola}Sacola<span class="bd" id="apSacBd" hidden></span></button></nav>
<div class="ap-pg" id="apProd"></div><div class="ap-pg" id="apMont"></div><div class="ap-pg tb" id="apTab"></div><div class="ap-sv" id="apSv"></div>`;
    v.prepend(app);
    interacoes();
    renderStories(); renderModo(); cartBar(); statusLoja(); deNovo();
    // entrada discreta da loja: segurar o nome "Açaídeira" no topo por 2 segundos
    const logo = app.querySelector('.ap-logo'); let seg = 0;
    const solta = () => clearTimeout(seg);
    logo.addEventListener('pointerdown', () => { solta(); seg = setTimeout(() => { vibra([10, 30, 10]); location.hash = '#painel'; }, 2000); });
    ['pointerup', 'pointerleave', 'pointercancel', 'pointermove'].forEach(ev => logo.addEventListener(ev, e => { if (ev !== 'pointermove' || Math.abs(e.movementX) + Math.abs(e.movementY) > 6) solta(); }));
    logo.addEventListener('contextmenu', e => e.preventDefault());
  }

  function interacoes() {
    const bar = E('apBar'), bgv = E('apBgv'), hc = E('apHc');
    let tk = false;
    const secs = [...E('apTabs').querySelectorAll('button')].map(b => E(b.dataset.s));
    addEventListener('scroll', () => {
      if (tk || !APP()) return; tk = true;
      requestAnimationFrame(() => {
        tk = false; const y = scrollY;
        bar.classList.toggle('solida', y > 220);
        if (y < 900) { bgv.style.transform = `translateY(${y * .38}px) scale(${1 + y / 2200})`; hc.style.opacity = Math.max(0, 1 - y / 420); hc.style.transform = `translateY(${y * .12}px)`; }
        let at = secs[0]; secs.forEach(s => { if (s.getBoundingClientRect().top < 140) at = s; });
        E('apTabs').querySelectorAll('button').forEach(b => { const on = b.dataset.s === at.id; if (on && !b.classList.contains('on')) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); b.classList.toggle('on', on); });
      });
    }, { passive: true });
    E('apTabs').querySelectorAll('button').forEach(b => b.onclick = () => vaiPara(b.dataset.s));
    E('apNav').querySelectorAll('button').forEach(b => b.onclick = () => aba(b.dataset.a));
    // carrossel com profundidade
    const hs = E('apHs'), hd = E('apHsD').children;
    const prof = () => { const c = hs.getBoundingClientRect(), cx = c.left + 18; let mi = 0, md = 1e9;[...hs.children].forEach((el, k) => { const r = el.getBoundingClientRect(), d = Math.abs(r.left - cx); if (d < md) { md = d; mi = k; } const f = Math.min(1, d / r.width); el.style.setProperty('--sc', (1 - f * .08).toFixed(3)); el.style.setProperty('--op', (1 - f * .35).toFixed(3)); });[...hd].forEach((d, k) => d.classList.toggle('on', k === mi)); };
    hs.addEventListener('scroll', () => requestAnimationFrame(prof), { passive: true }); prof();
    // sabores: a cor do bloco acompanha o sabor
    const sw = E('apSw'), sd = E('apSwD').children, box = E('ap-s-sab');
    const cor = () => { const k = Math.round(sw.scrollLeft / Math.max(1, sw.clientWidth)), s = SABS[Math.max(0, Math.min(SABS.length - 1, k))]; box.style.setProperty('--sb', s.bg); box.style.setProperty('--sx', s.tx);[...sd].forEach((d, j) => d.classList.toggle('on', j === k)); };
    sw.addEventListener('scroll', () => requestAnimationFrame(cor), { passive: true }); cor();
    // revelar ao rolar
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('#app .ap-rv').forEach((el, k) => { el.style.transitionDelay = (k % 3) * 60 + 'ms'; io.observe(el); });
  }
  function vaiPara(id) { const s = E(id); if (s) scrollTo({ top: s.getBoundingClientRect().top + scrollY - 108, behavior: 'smooth' }); }

  function infoLoja() {
    return `<a class="ap-ln" href="${MAPA}" target="_blank" rel="noopener"><i>${ICO.pin}</i><div><b>Endereço</b><small>${ENDERECO}</small></div></a>
<a class="ap-ln" href="https://wa.me/${LOJA.whats}" target="_blank" rel="noopener"><i>${ICO.chat}</i><div><b>WhatsApp</b><small>(61) 98202-2436 · dúvidas e acompanhamento do pedido</small></div></a>
<div class="ap-ln"><i>${ICO.moto}</i><div><b>Entrega e retirada</b><small>Entrega em ${esc(LOJA.tempoEntrega)} · retirada em cerca de ${esc(LOJA.tempoRetirada)}, sem fila</small></div></div>
<div class="ap-ln"><i>${ICO.cartao}</i><div><b>Pagamento</b><small>Pix, cartão online (Mercado Pago) ou cartão, Pix e dinheiro na entrega</small></div></div>
<div class="ap-ln"><i>${ICO.alerta}</i><div><b>Alérgenos</b><small>Alguns produtos podem conter leite, amendoim, castanhas, soja e glúten, e pode haver contato cruzado. Tem alergia? Fale com a gente antes de pedir.</small></div></div>`;
  }
  function statusLoja() {
    const c = window.API_ONLINE, ch = E('apChip'); if (!c || !ch || ch.dataset.ok) return;
    ch.dataset.ok = 1; ch.classList.toggle('fe', !c.aberto); ch.innerHTML = `<i></i>${c.aberto ? 'Aberto agora' : 'Fechado agora'} · Boa Vista 2`;
  }
  function renderModo() {
    const b = E('apModo'); if (!b) return;
    const tx = BAIRROS.map(x => x.t).filter(t => t > 0), tmin = tx.length ? Math.min(...tx) : 0;
    b.classList.toggle('r', ck.modo === 'retirada');
    b.innerHTML = `<span class="ind"></span><button data-m="entrega" class="${ck.modo === 'entrega' ? 'on' : ''}"><b>${ICO.moto}Entrega</b><small>${esc(LOJA.tempoEntrega)}${tmin ? ' · ' + brl(tmin) + '+' : ''}</small></button><button data-m="retirada" class="${ck.modo === 'retirada' ? 'on' : ''}"><b>${ICO.loja}Retirada</b><small>${esc(LOJA.tempoRetirada)} · grátis</small></button>`;
    b.querySelectorAll('button').forEach(x => x.onclick = () => { if (ck.modo === x.dataset.m) return; ck.modo = x.dataset.m; vibra(); b.classList.toggle('r', ck.modo === 'retirada'); b.querySelectorAll('button').forEach(y => y.classList.toggle('on', y === x)); });
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
  // a foto do item voa até a sacola
  function voa(src, rect) {
    if (!rect || !rect.width) { cartBar(true); return; }
    cartBar(false);
    const alvoEl = E('apCart').classList.contains('on') ? E('apCart').querySelector('.q') : E('apNav').querySelector('[data-a=sacola]');
    const alvo = alvoEl.getBoundingClientRect();
    const im = document.createElement('img'); im.src = src; im.className = 'ap-voo';
    const s = Math.min(rect.width, 150), x0 = rect.left + rect.width / 2 - s / 2, y0 = Math.max(40, rect.top + rect.height / 2 - s / 2);
    Object.assign(im.style, { left: x0 + 'px', top: y0 + 'px', width: s + 'px', height: s + 'px' }); document.body.appendChild(im);
    const dx = alvo.left + alvo.width / 2 - (x0 + s / 2), dy = alvo.top + alvo.height / 2 - (y0 + s / 2);
    im.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx * .4}px,${dy * .25 - 80}px) scale(.62) rotate(-12deg)`, opacity: 1, offset: .45 }, { transform: `translate(${dx}px,${dy}px) scale(.16) rotate(10deg)`, opacity: .85 }], { duration: 760, easing: 'cubic-bezier(.5,0,.5,1)' }).onfinish = () => { im.remove(); cartBar(true); vibra(15); };
  }

  // ---------- produto ----------
  let P = null;
  function produto(i) {
    P = { i, t: 0, qtd: 1, obs: '' };
    const pg = E('apProd'), p = PRONTOS[i];
    pg.innerHTML = `<div class="ap-pbar">${esc(p.nome)}<span id="apPbP"></span></div><button class="ap-ic ap-x" onclick="APP_.volta()" aria-label="Voltar">${IC.voltar}</button>
<div class="sc"><div class="ap-foto"><img src="img/${p.img}.jpg" alt="${esc(p.nome)}" id="apPimg"></div>
<div class="ap-pd">${p.tag ? `<span class="tg">${esc(p.tag)}</span>` : ''}<h2>${esc(p.nome)}</h2><p>${esc(p.desc)}</p><div class="pr">a partir de <b>${brl(minPreco(p))}</b></div></div>
<div class="ap-sh"><div><b>Tamanho</b><small>Escolha 1 opção</small></div><span class="ap-req ok">✓</span></div>
<div class="ap-tams" id="apPt">${p.tam.map((t, k) => `<button class="ap-tam" data-k="${k}"><span class="cp">${copoMini(t[0])}</span><span><b>${esc(t[0])}</b><em>${brl(t[1])}</em></span></button>`).join('')}</div>
<div class="ap-obs"><label><b>Alguma observação?</b><small id="apOc">0/140</small></label><textarea maxlength="140" placeholder="Ex.: sem granola, caprichar no leite condensado" id="apObsP"></textarea></div></div>
<div class="ap-ft"><div class="ap-qt"><button data-q="-1" aria-label="Menos">−</button><b id="apPq">1</b><button data-q="1" aria-label="Mais">+</button></div><button class="ap-add" id="apAddP"><span>ADICIONAR</span><span id="apPv"></span></button></div>`;
    const sc = pg.querySelector('.sc'), img = E('apPimg');
    sc.onscroll = () => { const y = sc.scrollTop; pg.classList.toggle('rolou', y > 260); img.style.transform = `translateY(${y * .35}px) scale(${1 + y / 1600})`; };
    const upd = () => {
      pg.querySelectorAll('.ap-tam').forEach(b => b.classList.toggle('on', +b.dataset.k === P.t));
      const v = brl(p.tam[P.t][1] * P.qtd); E('apPv').textContent = v; E('apPbP').textContent = v; E('apPq').textContent = P.qtd;
    };
    pg.querySelectorAll('.ap-tam').forEach(b => b.onclick = () => { P.t = +b.dataset.k; vibra(); upd(); });
    pg.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { P.qtd = Math.max(1, P.qtd + +b.dataset.q); vibra(); upd(); });
    const ta = E('apObsP'); ta.oninput = () => { P.obs = ta.value; E('apOc').textContent = ta.value.length + '/140'; };
    E('apAddP').onclick = () => {
      const t = p.tam[P.t], r = img.getBoundingClientRect();
      sacola.push({ nome: p.nome + ' ' + t[0], det: p.desc + (P.obs.trim() ? ' · Obs: ' + P.obs.trim() : ''), preco: t[1], qtd: P.qtd, ref: { tipo: 'pronto', i: P.i, t: P.t } });
      atualizaSem(); desempilha(); setTimeout(() => voa(`img/${p.img}.jpg`, r), 120); vibra(12);
    };
    upd(); sc.scrollTop = 0;
    pg.classList.add('on'); empilha('produto', () => pg.classList.remove('on'));
  }

  // ---------- Monte o seu (usa o copo animado do site) ----------
  let MO = { obs: '' }, copoCasa = null;
  // Regras: toda etapa pede um toque do cliente.
  // Grátis e obrigatórias: Tamanho, Sabor, Complementos (de 1 até o limite) e Cobertura.
  // Pagas e opcionais: Recheio e Extras, com a opção "Não quero" que já pula para a próxima.
  function montar(base) {
    sel.tam = '400'; sel.base = base || null; sel.meio = []; sel.comps = []; sel.prem = []; sel.cob = 'nenhuma'; qtd = 1;
    MO = { obs: '', tamOk: false, cobOk: false, nao: { meio: false, prem: false }, cont: { meio: false, comp: false, prem: false } };
    const pg = E('apMont');
    pg.innerHTML = `<button class="ap-ic ap-x" onclick="APP_.volta()" aria-label="Voltar">${IC.voltar}</button>
<div class="ap-mtop" id="apMtop"><div class="ap-cupw" id="apCupw"><span class="ap-mpr" id="apMpr"></span></div><div class="ap-etapa"><span id="apEtTx"></span><i><b id="apProg"></b></i></div><div class="ap-steps" id="apSteps"></div></div>
<div class="sc" id="apMsc"><div id="apEsp" style="height:430px"></div>
 <div class="ap-pd" style="margin-top:0;padding-top:18px"><h2>Monte seu açaí</h2><p>São <b style="color:#fff">6 etapas</b> e cada uma pede um toque seu. A tela segue sozinha para a próxima, e você vê os ingredientes caindo no copo. <b style="color:#a8d672">Tamanho, sabor, complementos e cobertura são grátis.</b> Recheio e extras são cobrados à parte, e se não quiser é só tocar em <b style="color:#fff">Não quero</b>.</p></div>
 <div id="apMlist">${listaMontar()}</div>
 <div class="ap-obs ap-etp" id="mt-fim"><label><b>Pronto! Alguma observação?</b><small id="apOm">0/140</small></label><textarea maxlength="140" id="apObsM" placeholder="Ex.: pouco leite em pó, granola separada"></textarea></div></div>
<div class="ap-ft"><div class="ap-qt"><button data-q="-1" aria-label="Menos">−</button><b id="apMq">1</b><button data-q="1" aria-label="Mais">+</button></div><button class="ap-add" id="apAddM"><span id="apAddMt">ADICIONAR</span><span id="apMv"></span></button></div>`;
    const copo = document.querySelector('.card.sticky .copo') || document.querySelector('.copo');
    if (copo) { if (!copoCasa) copoCasa = copo.parentNode; E('apCupw').prepend(copo); }
    try { setModo('a'); } catch (e) { }
    const sc = E('apMsc'), cw = E('apCupw'), mtop = E('apMtop');
    sc.onscroll = () => {
      const k = Math.min(1, sc.scrollTop / 240);
      cw.style.setProperty('--ch', (340 - 168 * k) + 'px'); cw.style.setProperty('--cs', (1 - .46 * k).toFixed(3)); cw.classList.toggle('mini', k > .5);
      const lim = mtop.getBoundingClientRect().bottom + 90; let at = 'mt-tam';
      ETAPAS.forEach(([id]) => { const el = E(id); if (el && el.getBoundingClientRect().top < lim) at = id; });
      if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4) at = 'mt-fim';
      marcaEtapa(at);
    };
    E('apMlist').onclick = e => {
      const nx = e.target.closest('[data-nx]'); if (nx) { const id = nx.dataset.nx; MO.cont[{ 'mt-meio': 'meio', 'mt-comp': 'comp', 'mt-prem': 'prem' }[id]] = true; vibra(); avancar(id); return; }
      const t = e.target.closest('[data-o]'); if (!t) return;
      const [tipo, id] = t.dataset.o.split(':'), lim = TAMANHOS.find(x => x.id === sel.tam).lim;
      const tog = (arr, max) => { const k = arr.indexOf(id); if (k >= 0) { arr.splice(k, 1); return true; } if (max && arr.length >= max) { toast(`Máximo de ${max}: desmarque um para trocar`); vibra([10, 40, 10]); return false; } arr.push(id); return true; };
      if (['base', 'meio', 'comp', 'prem'].includes(tipo) && window.ITEM_ESGOTADO && ITEM_ESGOTADO(id)) { toast('Esse item esgotou hoje'); vibra([10, 40, 10]); return; }
      if (tipo === 'nao') { MO.nao[id] = true; if (id === 'meio') sel.meio = []; else sel.prem = []; vibra(); atualizaMontar(); avancar(id === 'meio' ? 'mt-meio' : 'mt-prem'); return; }
      if (tipo === 'tam') { sel.tam = id; MO.tamOk = true; }
      else if (tipo === 'base') sel.base = id;
      else if (tipo === 'meio') { if (!tog(sel.meio, 2)) return; MO.nao.meio = false; if (!sel.meio.length) MO.cont.meio = false; }
      else if (tipo === 'comp') { if (!tog(sel.comps, lim)) return; if (!sel.comps.length) MO.cont.comp = false; }
      else if (tipo === 'prem') { tog(sel.prem); MO.nao.prem = false; if (!sel.prem.length) MO.cont.prem = false; }
      else if (tipo === 'cob') { sel.cob = id; MO.cobOk = true; }
      vibra(); atualizaMontar();
      // segue sozinho quando a etapa fica completa
      if (tipo === 'tam') avancar('mt-tam');
      else if (tipo === 'base') avancar('mt-base');
      else if (tipo === 'meio' && sel.meio.length >= 2) avancar('mt-meio');
      else if (tipo === 'comp' && sel.comps.length >= TAMANHOS.find(x => x.id === sel.tam).lim) avancar('mt-comp');
      else if (tipo === 'cob') avancar('mt-cob');
    };
    E('apSteps').onclick = e => { const b = e.target.closest('[data-s]'); if (b) irPara(b.dataset.s); };
    pg.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { qtd = Math.max(1, qtd + +b.dataset.q); vibra(); atualizaMontar(true); });
    const ta = E('apObsM'); ta.oninput = () => { MO.obs = ta.value; E('apOm').textContent = ta.value.length + '/140'; };
    E('apAddM').onclick = addMontarApp;
    atualizaMontar(); E('apEsp').style.height = mtop.offsetHeight + 'px'; sc.scrollTop = 0; sc.onscroll();
    pg.classList.add('on'); empilha('montar', () => { pg.classList.remove('on'); setTimeout(devolveCopo, 450); });
  }
  function devolveCopo() { const copo = document.querySelector('#apCupw .copo'); if (copo && copoCasa && !E('apMont').classList.contains('on')) { sel.cob = 'condensado'; copoCasa.prepend(copo); try { render(); } catch (e) { } } }
  const ETAPAS = [['mt-tam', 'Tamanho', 'Escolha o tamanho do copo'], ['mt-base', 'Sabor', 'Escolha o sabor do açaí'], ['mt-meio', 'Recheio', 'Recheio no meio · escolha ou toque em Não quero'], ['mt-comp', 'Complementos', 'Complementos grátis · escolha pelo menos 1'], ['mt-prem', 'Extras', 'Cremes e extras · escolha ou toque em Não quero'], ['mt-cob', 'Cobertura', 'Escolha a cobertura (grátis)']];
  function feito(id) {
    const lim = TAMANHOS.find(x => x.id === sel.tam).lim, nm = sel.meio.length, nc = sel.comps.length, np = sel.prem.length;
    return { 'mt-tam': MO.tamOk, 'mt-base': !!sel.base, 'mt-meio': MO.nao.meio || nm > 0, 'mt-comp': nc > 0, 'mt-prem': MO.nao.prem || np > 0, 'mt-cob': MO.cobOk }[id];
  }
  const falta = () => ETAPAS.filter(([id]) => !feito(id));
  function irPara(id) { const sc = E('apMsc'), el = E(id); if (!el) return; const topo = E('apMtop').offsetHeight - E('apCupw').offsetHeight + 172; const y = sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top; sc.scrollTo({ top: Math.max(0, y - topo + 2), behavior: 'smooth' }); }
  function avancar(id) {
    atualizaMontar(true);
    const k = ETAPAS.findIndex(e => e[0] === id);
    // próxima etapa ainda não feita (depois desta; se não houver, a primeira que faltar)
    const depois = ETAPAS.slice(k + 1).find(([e]) => !feito(e)), antes = falta()[0];
    const prox = depois ? depois[0] : antes ? antes[0] : 'mt-fim';
    setTimeout(() => {
      irPara(prox);
      if (prox === 'mt-fim') { const a = E('apAddM'); a.classList.remove('pulsa'); void a.offsetWidth; a.classList.add('pulsa'); }
    }, 520);
  }
  function marcaEtapa(at) {
    const k = ETAPAS.findIndex(e => e[0] === at);
    E('apEtTx').innerHTML = at === 'mt-fim' ? (falta().length ? `<em>Falta:</em> ${falta().map(e => e[1]).join(', ')}` : '<em>Tudo pronto!</em> Revise e adicione à sacola') : `<em>Etapa ${k + 1} de 6</em> · ${ETAPAS[k][2]}`;
    document.querySelectorAll('#apMlist .ap-etp, #mt-fim').forEach(s => s.classList.toggle('foco', s.dataset.e === at || s.id === at));
    E('apSteps').querySelectorAll('button').forEach(b => { const on = b.dataset.s === at; if (on && !b.classList.contains('at')) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); b.classList.toggle('at', on); });
  }
  const tile = (o, foto, ico, nome, subt, cls) => `<button class="ap-t ${cls || ''}" data-o="${o}">${foto ? `<img src="${foto}" alt="" loading="lazy">` : `<span class="ico">${ico === 'x' ? ICO.x : ICO.brilho}</span>`}<span class="ck"></span><span class="nm"><b>${esc(nome)}</b>${subt ? `<small>${subt}</small>` : ''}</span></button>`;
  const cab = (id, t, s, badgeId) => { const n = ETAPAS.findIndex(e => e[0] === id) + 1; return `<div class="ap-sh" id="${id}"><div><small class="ap-et">ETAPA ${n} DE 6</small><b><span class="ap-n">${n}</span>${t}</b><small id="${id}-s">${s}</small></div><span class="ap-req" id="${badgeId}"></span></div>`; };
  const etp = (id, html, comBotao) => `<section class="ap-etp" data-e="${id}">${html}${comBotao ? `<button class="ap-next go" data-nx="${id}" id="nx-${id}" hidden></button>` : ''}</section>`;
  const naoQuero = qual => tile('nao:' + qual, null, 'x', 'Não quero', 'PULAR ETAPA', 'nao');
  function listaMontar() {
    const gruposC = [['fruta', 'Frutas frescas'], ['fini', 'Linha Fini'], [undefined, 'Crocantes e doces']];
    return etp('mt-tam', cab('mt-tam', 'Tamanho', 'Escolha 1 · obrigatório', 'bTam') +
      `<div class="ap-tams">${TAMANHOS.map(t => `<button class="ap-tam" data-o="tam:${t.id}"><span class="cp">${copoMini(t.nome, t.h)}</span><span><b>${t.ap}</b><small>${t.nome} · até ${t.lim} compl. grátis</small><em>${brl(t.preco)}</em></span></button>`).join('')}</div>`) +
      etp('mt-base', cab('mt-base', 'Sabor do açaí', 'Escolha 1 · obrigatório', 'bBase') +
      `<div class="ap-grid">${BASES.map(b => tile('base:' + b.id, `img/sab/${b.id}.jpg`, b.ico, curto(b.nome), b.preco ? '+ ' + brl(b.preco) : '')).join('')}</div>`) +
      etp('mt-meio', cab('mt-meio', 'Recheio no meio', 'Até 2 · cobrado à parte · ou “Não quero”', 'bMeio') +
      `<div class="ap-grid ap-g1">${naoQuero('meio')}</div>` +
      Object.entries(GRUPOS_MEIO).map(([g, gt]) => `<div class="ap-gt">${gt}</div><div class="ap-grid">` + MEIO.filter(m => m.id !== 'nenhum' && m.grupo === g).map(m => tile('meio:' + m.id, fotoMeio(m), m.ico, m.nome.replace('Fini ', ''), '+ ' + brl(m.preco))).join('') + '</div>').join(''), 1) +
      etp('mt-comp', cab('mt-comp', 'Complementos', '', 'bComp') +
      gruposC.map(([g, gt]) => `<div class="ap-gt">${gt}</div><div class="ap-grid">` + COMPS.filter(c => c.grupo === g).map(c => tile('comp:' + c.id, fotoComp(c.id), c.ico, c.nome.replace('Fini ', ''), 'GRÁTIS')).join('') + '</div>').join(''), 1) +
      etp('mt-prem', cab('mt-prem', 'Cremes e extras', 'Quantos quiser · cobrados à parte · ou “Não quero”', 'bPrem') +
      `<div class="ap-grid">${naoQuero('prem')}${PREM.map(p => tile('prem:' + p.id, `img/extra/${p.id}.jpg`, p.ico, p.nome, '+ ' + brl(p.preco))).join('')}</div>`, 1) +
      etp('mt-cob', cab('mt-cob', 'Cobertura', 'Escolha 1 · grátis · obrigatório', 'bCob') +
      `<div class="ap-grid">${COBS.map(c => tile('cob:' + c.id, c.id !== 'nenhuma' ? `img/cob/${c.id}.jpg` : null, 'x', c.nome, c.id === 'nenhuma' ? 'SÓ AÇAÍ' : 'GRÁTIS')).join('')}</div>`);
  }
  function badge(id, cls, txt) { const b = E(id); if (b) { b.className = 'ap-req ' + cls; b.textContent = txt; } }
  function atualizaMontar(semCopo) {
    if (!semCopo) try { render(); } catch (e) { }
    const t = TAMANHOS.find(x => x.id === sel.tam), lim = t.lim, nc = sel.comps.length, nm = sel.meio.length, np = sel.prem.length;
    E('apMlist').querySelectorAll('[data-o]').forEach(el => {
      const [tipo, id] = el.dataset.o.split(':');
      const on = tipo === 'tam' ? MO.tamOk && sel.tam === id : tipo === 'base' ? sel.base === id : tipo === 'meio' ? sel.meio.includes(id) : tipo === 'comp' ? sel.comps.includes(id) : tipo === 'prem' ? sel.prem.includes(id) : tipo === 'nao' ? MO.nao[id] : MO.cobOk && sel.cob === id;
      const dis = !on && ((tipo === 'comp' && nc >= lim) || (tipo === 'meio' && nm >= 2));
      if (on && !el.classList.contains('on') && el.animate) el.animate([{ transform: 'scale(.9)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 340, easing: 'cubic-bezier(.3,1.6,.5,1)' });
      el.classList.toggle('on', !!on); el.classList.toggle('dis', dis);
      const es = ['base', 'meio', 'comp', 'prem'].includes(tipo) && window.ITEM_ESGOTADO && ITEM_ESGOTADO(id);
      if (es && !el.dataset.esg) { el.dataset.esg = '1'; el.insertAdjacentHTML('beforeend', '<i class="esg-tag">ESGOTADO</i>'); }
    });
    // o selo mantém o texto e só fica verde quando a etapa foi escolhida
    [['bTam', 'mt-tam', 1], ['bBase', 'mt-base', 1], ['bMeio', 'mt-meio', 0], ['bComp', 'mt-comp', 1], ['bPrem', 'mt-prem', 0], ['bCob', 'mt-cob', 1]].forEach(([b, id, ob]) => badge(b, feito(id) ? 'ok' : ob ? 'ob' : 'opc', ob ? 'OBRIGATÓRIO' : 'OPCIONAL'));
    const cs = E('mt-comp-s'); if (cs) cs.textContent = `Grátis · escolha de 1 a ${lim} no ${t.ap}`;
    // botões "continuar" só quando já há escolha e ainda cabe mais
    const nx = (id, mostra, txt) => { const b = E('nx-' + id); if (b) { b.hidden = !mostra; b.textContent = txt; } };
    const proxNome = id => { const k = ETAPAS.findIndex(e => e[0] === id); return ETAPAS[k + 1] ? (k + 2) + '. ' + ETAPAS[k + 1][1] : 'Finalizar'; };
    nx('mt-meio', nm === 1, `Só esse recheio · Continuar para ${proxNome('mt-meio')} →`);
    nx('mt-comp', nc > 0 && nc < lim, `Já escolhi tudo (${nc} de ${lim}) · Continuar →`);
    nx('mt-prem', np > 0, `Pronto com os extras · Continuar para ${proxNome('mt-prem')} →`);
    const st = E('apSteps'), atual = st.querySelector('.at'), atS = atual ? atual.dataset.s : 'mt-tam';
    let nf = 0;
    st.innerHTML = ETAPAS.map(([s, n], k) => { const f = feito(s); if (f) nf++; return `<button data-s="${s}" class="${f ? 'ok' : ''} ${atS === s ? 'at' : ''}"><i>${f ? '✓' : k + 1}</i>${n}</button>`; }).join('');
    E('apProg').style.width = (nf / 6 * 100) + '%';
    const fl = falta();
    E('apMpr').textContent = brl(precoMontar()); E('apMv').textContent = brl(precoMontar() * qtd); E('apMq').textContent = qtd;
    E('apAddM').classList.toggle('off', fl.length > 0); E('apAddMt').textContent = fl.length ? 'FALTA: ' + (fl[0][0] === 'mt-comp' ? 'COMPLEM.' : fl[0][1].toUpperCase()) : 'ADICIONAR';
    const at = E('apSteps').querySelector('.at'); if (at && E('apEtTx')) marcaEtapa(at.dataset.s);
  }
  function addMontarApp() {
    const fl = falta();
    if (fl.length) { const id = fl[0][0]; irPara(id); const h = E(id); h.classList.remove('erro'); void h.offsetWidth; h.classList.add('erro'); toast(`Falta escolher: ${fl.map(e => e[1]).join(', ')}`); vibra([10, 40, 10]); return; }
    const t = TAMANHOS.find(x => x.id === sel.tam);
    const det = [BASES.find(b => b.id === sel.base).nome, sel.meio.length ? 'No meio: ' + sel.meio.map(id => MEIO.find(m => m.id === id).nome).join(' + ') : null, ...sel.comps.map(id => COMPS.find(c => c.id === id).nome), ...sel.prem.map(id => PREM.find(c => c.id === id).nome), sel.cob !== 'nenhuma' ? COBS.find(c => c.id === sel.cob).nome : null, MO.obs.trim() ? 'Obs: ' + MO.obs.trim() : null].filter(Boolean).join(', ');
    const base = sel.base, r = (document.querySelector('#apCupw .cupbox') || E('apCupw')).getBoundingClientRect();
    sacola.push({ nome: 'Açaí ' + t.ap + ' ' + t.nome, det, preco: precoMontar(), qtd, ref: { tipo: 'montar', tam: sel.tam, base, meio: [...sel.meio], comps: [...sel.comps], prem: [...sel.prem], cob: sel.cob } });
    atualizaSem(); vibra(12);
    sel.meio = []; sel.base = null; sel.comps = []; sel.prem = []; qtd = 1;
    desempilha(); setTimeout(() => voa(`img/sab/${base}.jpg`, r), 120);
  }
  function copoMini(rot, h) {
    const n = parseInt(rot), hh = h || (n >= 700 ? .95 : n >= 500 ? .78 : n >= 400 ? .66 : n >= 300 ? .55 : .45), f = 40 - 34 * hh, a = 3 * (f - 4) / 36;
    return `<svg viewBox="0 0 34 44"><path d="M${4 + a} ${f}H${30 - a}L27 40H7z" fill="#a8d672"/><path d="M4 4h26l-3 36H7z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" opacity=".85"/></svg>`;
  }

  // ---------- sacola (tela cheia, com sugestões) ----------
  const _telaSacola = telaSacola;
  telaSacola = function () {
    if (!APP()) return _telaSacola();
    E('dTitulo').textContent = 'Sua sacola';
    if (!sacola.length) {
      E('dBody').innerHTML = `<div class="ap-vz" style="padding-top:90px"><big>${ICO.copo}</big><b>Sua sacola está vazia</b><br>Que tal montar um açaí do seu jeito?</div>`;
      E('dFoot').innerHTML = `<button class="btn" onclick="fechar();setTimeout(()=>APP_.montar(),380)">MONTAR MEU AÇAÍ</button>`; return;
    }
    const naSacola = new Set(sacola.filter(i => i.ref && i.ref.tipo === 'pronto').map(i => i.ref.i));
    const sug = PRONTOS.map((p, i) => [p, i]).filter(([, i]) => !naSacola.has(i)).sort((a, b) => (b[0].tag ? 1 : 0) - (a[0].tag ? 1 : 0)).slice(0, 6);
    E('dBody').innerHTML = `<div class="ap-sc-loja"><img src="img/logo.png" alt=""><div><b>Açaideira Sorvete &amp; Açaí</b><small>${ck.modo === 'entrega' ? ICO.moto + 'Entrega · ' + esc(LOJA.tempoEntrega) : ICO.loja + 'Retirada · ' + esc(LOJA.tempoRetirada)}</small></div></div>` +
      sacola.map((it, i) => `<div class="ap-sc-it" style="animation-delay:${i * 50}ms"><div class="im"><img src="${fotoItem(it)}" alt=""></div><div class="tx"><b>${esc(it.nome)}</b><small>${esc(it.det || '')}</small><span class="pr">${brl(it.preco * it.qtd)}</span></div><div class="ap-qt"><button onclick="APP_.qtd(${i},-1)" aria-label="Diminuir">${it.qtd > 1 ? '−' : ICO.lixo}</button><b>${it.qtd}</b><button onclick="APP_.qtd(${i},1)" aria-label="Aumentar">+</button></div></div>`).join('') +
      `<button class="ap-sc-mais" onclick="fechar()">+ Adicionar mais itens</button>` +
      (sug.length ? `<div class="ap-up"><h5>Peça também</h5><div class="row">${sug.map(([p, i]) => `<button onclick="fechar();setTimeout(()=>APP_.produto(${i}),380)"><img src="img/${p.img}.jpg" alt="" loading="lazy"><i>+</i><b>${esc(p.nome)}</b><span>${brl(minPreco(p))}</span></button>`).join('')}</div></div>` : '');
    E('dFoot').innerHTML = `<div class="resumo-linha"><span>Subtotal</span><span>${brl(sub())}</span></div><div class="resumo-linha"><span>Taxa de entrega</span><span>${ck.modo === 'retirada' ? 'Grátis' : 'pelo bairro, no próximo passo'}</span></div><div class="total"><span>TOTAL</span><span>${brl(sub() + (ck.modo === 'retirada' ? 0 : taxa()))}</span></div><button class="btn" onclick="telaCheckout()">CONTINUAR</button>`;
  };
  function qtdItem(i, d) { const it = sacola[i]; if (!it) return; it.qtd += d; if (it.qtd <= 0) sacola.splice(i, 1); vibra(); atualiza(); telaSacola(); }

  const _abrir = abrir, _fechar = fechar;
  abrir = function () { _abrir(); if (APP() && !pilha.some(p => p.nome === 'sacola')) empilha('sacola', () => { _fechar(); cartBar(); }); };
  fechar = function () { if (APP() && pilha.length && pilha[pilha.length - 1].nome === 'sacola') desempilha(); else _fechar(); };
  E('fechar').onclick = () => fechar(); E('ov').onclick = () => fechar();
  const ab = E('abrirCarrinho'); if (ab) ab.onclick = () => abrir();
  const _atualiza = atualiza;
  atualiza = function () { _atualiza(); cartBar(true); };
  function atualizaSem() { _atualiza(); }   // a barra pula quando a foto chega

  const _finaliza = finaliza;
  finaliza = function (cod, total) {
    try { const l = JSON.parse(localStorage.getItem('acaideira_meus') || '[]'); l.unshift({ c: cod, d: Date.now(), total, modo: ck.modo, itens: sacola.map(i => ({ ...i })) }); localStorage.setItem('acaideira_meus', JSON.stringify(l.slice(0, 10))); } catch (e) { }
    try { deNovo(); } catch (e) { }
    _finaliza(cod, total); cartBar();
  };
  // ---------- "Pedir de novo" no início: o último pedido do cliente, a um toque ----------
  function deNovo() {
    const box = E('apDeNovo'); if (!box) return;
    const k = meus().findIndex(p => p.itens && p.itens.length), p = k >= 0 ? meus()[k] : null;
    if (!p) { box.innerHTML = ''; return; }
    const it = p.itens[0], mais = p.itens.length - 1, foto = (() => { try { return fotoItem(it); } catch (e) { return 'img/logo.png'; } })();
    const quando = new Date(p.d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    box.innerHTML = `<div class="ap-dn ap-rv vis"><div class="im"><img src="${foto}" alt=""></div><div class="tx"><small>SEU ÚLTIMO PEDIDO · ${esc(quando)}</small><b>${it.qtd}× ${esc(it.nome)}</b>${mais > 0 ? `<em>+ ${mais} ${mais > 1 ? 'itens' : 'item'}</em>` : ''}<span>${brl(p.total || 0)}</span></div><button onclick="APP_.repetir(${k})">Pedir de novo</button></div>`;
  }
  function meus() { try { return JSON.parse(localStorage.getItem('acaideira_meus') || '[]'); } catch (e) { return []; } }

  // ---------- abas inferiores ----------
  function aba(a) {
    if (a === 'sacola') { abrir(); return; }
    const pg = E('apTab');
    E('apNav').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.a === a));
    vibra(5);
    if (a === 'inicio') { const estava = pg.classList.contains('on'); pg.classList.remove('on'); if (!estava) scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (a === 'busca') {
      pg.innerHTML = `<div class="ap-ph"><h3>Buscar</h3></div><div class="ap-busca">${IC.busca}<input id="apQ" type="search" placeholder="Açaí, Ninho, morango, kids…" autocomplete="off"></div><div class="ap-sug">${['Ninho', 'Nutella', 'Morango', 'Zero', 'Kids', 'Paçoca'].map(s => `<button onclick="APP_.busca('${s}')">${s}</button>`).join('')}</div><div class="sc" id="apRes"></div>`;
      const q = E('apQ'); q.oninput = () => busca(q.value); busca('');
      pg.classList.add('on'); setTimeout(() => q.focus({ preventScroll: true }), 300);
    } else if (a === 'pedidos') {
      const l = meus();
      pg.innerHTML = `<div class="ap-ph"><h3>Meus pedidos</h3></div><div class="sc">${l.length ? l.map((p, k) => `<div class="ap-ped"><div class="h"><b>PEDIDO #${esc(p.c)}</b><span>${new Date(p.d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · ${new Date(p.d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div>
        ${p.itens ? `<ul>${p.itens.map(i => `<li>${i.qtd}× ${esc(i.nome)}</li>`).join('')}</ul><div class="h"><span>${p.modo === 'retirada' ? ICO.loja + 'Retirada' : ICO.moto + 'Entrega'}</span><b class="v">${brl(p.total || 0)}</b></div>` : '<ul><li>Pedido feito pelo site</li></ul>'}
        <div class="bs">${p.t ? `<a class="pri" href="#pedido/${esc(p.t)}">Acompanhar</a>` : `<a href="https://wa.me/${LOJA.whats}?text=${encodeURIComponent('Olá! Quero saber do meu pedido #' + p.c)}" target="_blank" rel="noopener">Falar com a loja</a>`}${p.itens ? `<button class="pri" onclick="APP_.repetir(${k})">Pedir de novo</button>` : ''}</div></div>`).join('') : `<div class="ap-vz"><big>${ICO.recibo}</big><b>Nenhum pedido ainda</b><br>Seus pedidos aparecem aqui depois que você finalizar.</div>`}</div>`;
      pg.classList.add('on');
    }
  }
  function busca(q) {
    const inp = E('apQ'); if (inp && inp.value !== q) inp.value = q;
    const n = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(), k = n(q.trim());
    const pr = PRONTOS.map((p, i) => [p, i]).filter(([p]) => !k || n(p.nome + ' ' + p.desc + ' ' + p.cat).includes(k));
    const sb = k ? BASES.filter(b => n(b.nome).includes(k)) : [];
    E('apRes').innerHTML = (sb.length ? `<div class="ap-gt">Montar com o sabor</div><div class="ap-grid">${sb.map(b => `<button class="ap-t" onclick="APP_.aba('inicio');APP_.montar('${b.id}')"><img src="img/sab/${b.id}.jpg" alt=""><span class="nm"><b>${esc(curto(b.nome))}</b><small>MONTAR →</small></span></button>`).join('')}</div>` : '') +
      (pr.length ? `<div class="ap-gt">${k ? 'Taças e copos' : 'Todo o cardápio'}</div><div class="ap-list">${pr.map(([p, i]) => linhaProduto(p, i).replace('ap-it ap-rv', 'ap-it')).join('')}</div>` : '') +
      (!pr.length && !sb.length ? `<div class="ap-vz"><big>${ICO.lupa}</big>Não achamos “${esc(q)}”.<br>Que tal <a href="#" onclick="APP_.aba('inicio');APP_.montar();return false" style="color:#a8d672;font-weight:700">montar do seu jeito</a>?</div>` : '');
  }
  function repetir(k) { const p = meus()[k]; if (!p || !p.itens) return; p.itens.forEach(i => sacola.push({ ...i })); atualiza(); aba('inicio'); setTimeout(abrir, 200); }

  // ---------- stories ----------
  const pr = i => ({ i: `img/${PRONTOS[i].img}.jpg`, t: PRONTOS[i].nome, d: PRONTOS[i].desc, cta: ['PEDIR · ' + brl(minPreco(PRONTOS[i])), () => produto(i)] });
  const STORIES = [
    { id: 'monte', nome: 'Monte o seu', mais: 1 },
    { id: 'taca', nome: 'Na taça', capa: 'video/poster.jpg', sl: [{ v: 'video/propaganda.mp4', p: 'video/poster.jpg', cont: 1, t: 'A taça se montando', d: 'Açaí, creme de Ninho, morangos, balinhas e Nutella caindo na taça.', cta: ['QUERO O SANTO ESPECIAL', () => produto(7)] }] },
    { id: 'copos', nome: 'Vídeos', capa: 'video/colorido.jpg', sl: [{ v: 'video/colorido.mp4', p: 'video/colorido.jpg', t: 'Copo Colorido', d: 'Marshmallow, M&M e muita cor.', cta: ['MONTAR O MEU', () => montar()] }, { v: 'video/frutas.mp4', p: 'video/frutas.jpg', t: 'Taça de Frutas', d: 'Banana, uva e morango fresquinhos.', cta: ['PEDIR A TROPICAL', () => produto(2)] }, { v: 'video/cascao.mp4', p: 'video/cascao.jpg', t: 'Cascão', d: 'Sorvete na casquinha crocante.', cta: ['PEDIR NO WHATSAPP', () => open(`https://wa.me/${LOJA.whats}?text=${encodeURIComponent('Olá! Quero um Cascão 🍦')}`, '_blank')] }] },
    { id: 'sabores', nome: 'Sabores', capa: 'img/sab/morango.jpg', sl: SABS.map(s => ({ sab: s, cta: ['MONTAR COM ESSE SABOR', () => montar(s.id)] })) },
    { id: 'premio', nome: 'Prêmio', capa: 'img/branca.jpg', sl: [4, 5, 6, 7].map(pr) },
    { id: 'trad', nome: 'Tradicionais', capa: 'img/m_trad2.jpg', sl: [0, 1, 2, 3].map(pr) },
    { id: 'kids', nome: 'Zero & Kids', capa: 'img/m_kids.jpg', sl: [8, 9].map(pr) },
    { id: 'vitrine', nome: 'Vitrine', capa: 'img/g2.jpg', sl: [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ i: `img/g${n}.jpg`, t: 'Direto da vitrine', d: 'Nossas taças de pertinho, feitas na hora.', cta: ['VER O CARDÁPIO', () => vaiPara('ap-s-dest')] })) }];
  // stories cadastrados pela agência no painel (vêm do servidor)
  function novidades() {
    const ds = ((window.API_ONLINE && API_ONLINE.destaques) || []).filter(d => /^https:\/\//.test(d.midia_url));
    if (!ds.length || STORIES.some(s => s.id === 'novidades')) return;
    const linkOk = l => l && (/^https:\/\//.test(l) || l.startsWith('#'));
    const sl = ds.map(d => ({ ...(d.tipo === 'video' ? { v: d.midia_url, p: '' } : { i: d.midia_url }), t: d.titulo, d: d.texto || '', cta: d.botao_texto && linkOk(d.botao_link) ? [d.botao_texto.toUpperCase(), () => { if (d.botao_link === '#montar') montar(); else if (d.botao_link.startsWith('#')) vaiPara(d.botao_link.slice(1)); else open(d.botao_link, '_blank', 'noopener'); }] : null }));
    const capa = ds.find(d => d.tipo === 'foto');
    STORIES.splice(1, 0, { id: 'novidades', nome: 'Novidades', capa: capa ? capa.midia_url : 'img/logo.png', sl });
    try { localStorage.setItem('acaideira_vistos', JSON.stringify(vistos().filter(x => x !== 'novidades'))); } catch (e) { }
    if (E('apStories')) renderStories();
  }
  const vistos = () => { try { return JSON.parse(localStorage.getItem('acaideira_vistos') || '[]'); } catch (e) { return []; } };
  function renderStories() {
    const v = vistos();
    E('apStories').innerHTML = STORIES.map((s, k) => `<button class="ap-sto ${v.includes(s.id) ? 'visto' : ''}" data-k="${k}"><div class="rg ${s.mais ? 'mais' : ''}"><span>${s.mais ? '+' : `<img src="${esc(s.capa)}" alt="" loading="lazy">`}</span></div><small>${esc(s.nome)}</small></button>`).join('');
    E('apStories').querySelectorAll('.ap-sto').forEach(b => b.onclick = () => { const s = STORIES[+b.dataset.k]; vibra(); if (s.mais) montar(); else story(+b.dataset.k); });
  }
  let S = null;
  function story(k, j = 0) {
    const svw = E('apSv');
    if (!S) { S = { k, j }; svw.classList.add('on'); empilha('story', () => { pararStory(); svw.classList.remove('on'); svw.innerHTML = ''; S = null; renderStories(); }); }
    S.k = k; S.j = j;
    const st = STORIES[k], sl = st.sl[j];
    try { const v = vistos(); if (!v.includes(st.id)) { v.push(st.id); localStorage.setItem('acaideira_vistos', JSON.stringify(v)); } } catch (e) { }
    let md;
    if (sl.v) md = `<div class="md ${sl.cont ? 'cont' : ''}">${sl.cont ? `<div class="blur" style="background-image:url('${esc(sl.p)}')"></div>` : ''}<video src="${esc(sl.v)}" poster="${esc(sl.p)}" playsinline muted autoplay preload="auto"></video></div>`;
    else if (sl.sab) md = `<div class="md" style="background:${sl.sab.bg};color:${sl.sab.tx}"><div class="sab"><div class="w">${sl.sab.w}</div><img src="img/sab/${sl.sab.id}.jpg" alt=""></div></div>`;
    else md = `<div class="md"><div class="blur" style="background-image:url('${esc(sl.i)}')"></div><img src="${esc(sl.i)}" alt="" style="position:relative;z-index:1;object-fit:contain"></div>`;
    const tt = sl.sab ? sl.sab.n : sl.t, dd = sl.sab ? sl.sab.d : sl.d, cor = sl.sab ? sl.sab.tx : '#fff';
    svw.className = 'ap-sv on' + (sl.v ? ' video' : '');
    svw.innerHTML = `<div class="bars">${st.sl.map((_, x) => `<i><b style="width:${x < j ? 100 : 0}%"></b></i>`).join('')}</div>
<div class="hd"><img src="img/logo.png" alt=""><span>acaideira <small>· ${esc(st.nome)}</small></span><button class="svx" aria-label="Fechar">×</button></div>
${md}<button class="som" aria-label="Som">${ICO.mudo}</button>
<div class="tx" style="color:${cor};${sl.sab ? 'text-shadow:none' : ''}"><h4 style="color:${cor}">${esc(tt)}</h4><p>${esc(dd || '')}</p></div>
<div class="zn e"></div><div class="zn d"></div>${sl.cta ? `<button class="cta">${esc(sl.cta[0])}</button>` : ''}`;
    svw.querySelector('.svx').onclick = () => desempilha();
    if (sl.cta) svw.querySelector('.cta').onclick = () => { const f = sl.cta[1]; desempilha(); setTimeout(f, 300); };
    const bar = svw.querySelectorAll('.bars b')[j], vid = svw.querySelector('video');
    let dur = 5000, t0 = performance.now(), pausa = 0, pausadoEm = 0;
    const tick = now => {
      if (!S || S.k !== k || S.j !== j) return;
      let p; if (vid) p = vid.duration ? vid.currentTime / vid.duration : 0; else p = (now - t0 - pausa) / dur;
      if (!pausadoEm) bar.style.width = Math.min(100, p * 100) + '%';
      if (p >= 1 || (vid && vid.ended)) return proximo();
      S.raf = requestAnimationFrame(tick);
    };
    S.raf = requestAnimationFrame(tick);
    S.pausa = on => { if (on) { pausadoEm = performance.now(); vid && vid.pause(); } else { if (pausadoEm) pausa += performance.now() - pausadoEm; pausadoEm = 0; vid && vid.play().catch(() => { }); } };
    if (vid) { vid.play().catch(() => { }); const sb = svw.querySelector('.som'); sb.onclick = e => { e.stopPropagation(); vid.muted = !vid.muted; sb.innerHTML = vid.muted ? ICO.mudo : ICO.som; }; }
    let segurou = false, tm;
    svw.querySelectorAll('.zn').forEach(z => {
      z.onpointerdown = () => { segurou = false; tm = setTimeout(() => { segurou = true; S && S.pausa(true); }, 220); };
      z.onpointerup = () => { clearTimeout(tm); if (segurou) { S && S.pausa(false); return; } z.classList.contains('e') ? anterior() : proximo(); };
      z.onpointerleave = () => { clearTimeout(tm); if (segurou) { segurou = false; S && S.pausa(false); } };
    });
    let y0 = null; svw.ontouchstart = e => { y0 = e.touches[0].clientY; }; svw.ontouchend = e => { if (y0 != null && e.changedTouches[0].clientY - y0 > 90) desempilha(); y0 = null; };
  }
  function pararStory() { if (S) cancelAnimationFrame(S.raf); const v = E('apSv').querySelector('video'); if (v) v.pause(); }
  function proximo() { if (!S) return; pararStory(); const st = STORIES[S.k]; if (S.j < st.sl.length - 1) story(S.k, S.j + 1); else { const n = S.k + 1; if (n < STORIES.length) story(n, 0); else desempilha(); } }
  function anterior() { if (!S) return; pararStory(); if (S.j > 0) story(S.k, S.j - 1); else if (S.k > 1) story(S.k - 1, 0); else story(S.k, 0); }

  function compartilha() {
    const d = { title: 'Açaideira Sorvete & Açaí', text: 'Monte seu açaí na Açaideira 💜', url: location.href.split('#')[0] };
    if (navigator.share) navigator.share(d).catch(() => { }); else (navigator.clipboard ? navigator.clipboard.writeText(d.url) : Promise.reject()).then(() => toast('Link copiado'), () => toast(d.url));
  }

  window.APP_ = { produto, montar, volta: desempilha, aba, qtd: qtdItem, repetir, compartilha, busca, vaiPara, story: k => story(k || 1) };

  function liga() { document.body.classList.toggle('app', mq.matches); if (mq.matches) { monta(); cartBar(); } }
  (mq.addEventListener ? mq.addEventListener('change', liga) : mq.addListener(liga));
  liga();
  let tent = 0; const iv = setInterval(() => { statusLoja(); renderModo(); novidades(); if (window.API_ONLINE || ++tent > 10) clearInterval(iv); }, 800);
})();
