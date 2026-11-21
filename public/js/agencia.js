// Açaideira — Área de manutenção da agência (aba "Agência" do painel).
// Organização: um menu por assunto; cada seção explica o que altera e onde aparece no site.
// Edições ficam em rascunho até "Salvar alterações" (barra no rodapé da seção).
// Stories publicam direto pelo editor, com prévia no celular antes de enviar.
(function () {
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = v => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
  const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const hojeSP = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  const hora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  let SB = null, root = null, atual = 'visao';
  const S = { cfg: null, bairros: [], stories: [], esg: [] };      // o que está salvo no banco
  const R = {};                                                      // rascunhos por seção

  const SECOES = [
    { id: 'visao', ico: '🏠', nome: 'Visão geral', sub: 'Como a loja está agora' },
    { id: 'previa', ico: '👀', nome: 'Prévias', sub: 'Site e celular ao vivo' },
    { id: 'stories', ico: '⭕', nome: 'Stories', sub: 'Bolinha "Novidades" no celular' },
    { id: 'funcionamento', ico: '🕒', nome: 'Funcionamento', sub: 'Abrir/fechar, horário, tempos' },
    { id: 'entrega', ico: '🛵', nome: 'Entrega', sub: 'Bairros e taxas' },
    { id: 'contato', ico: '💳', nome: 'Contato e Pix', sub: 'WhatsApp e dados do Pix' },
    { id: 'guia', ico: '🧭', nome: 'Onde mexer', sub: 'Aqui ou no código' }];

  window.AGENCIA = async function (sb, el) {
    SB = sb; root = el;
    root.innerHTML = (window.AGENCIA_DEMO ? `<div class="ag-demo">🧪 <b>Demonstração</b> com dados de exemplo: dá para mexer em tudo, mas nada é salvo de verdade. Com o site no ar, esta aba aparece para quem entra com a conta da agência.</div>` : '') + `<div class="ag">
      <aside class="ag-menu" id="agMenu">${SECOES.map(s => `<button data-s="${s.id}"><i>${s.ico}</i><span><b>${s.nome}</b><small>${s.sub}</small></span><em class="ag-dot" hidden></em></button>`).join('')}</aside>
      <main class="ag-main"><div id="agMain"><div class="ag-load">Carregando dados da loja…</div></div>
        <div class="ag-save" id="agSave" hidden><span id="agSaveTx">Alterações não salvas</span><button class="ag-b2" id="agDesc">Descartar</button><button class="ag-b1" id="agSalva">Salvar alterações</button></div></main></div>`;
    root.querySelector('#agMenu').onclick = e => { const b = e.target.closest('[data-s]'); if (b) abre(b.dataset.s); };
    root.querySelector('#agDesc').onclick = () => { delete R[atual]; abre(atual); };
    root.querySelector('#agSalva').onclick = () => salvar(atual);
    addEventListener('beforeunload', e => { if (Object.keys(R).some(sujo)) { e.preventDefault(); e.returnValue = ''; } });
    await carregaTudo();
    abre('visao');
  };

  async function carregaTudo() {
    const [c, b, d, e] = await Promise.all([
      SB.from('loja_config').select('*').eq('id', 1).single(),
      SB.from('bairros').select('*').order('ordem').order('id'),
      SB.from('destaques').select('*').order('ordem').order('criado_em'),
      SB.from('itens_esgotados').select('item_id,nome')]);
    S.cfg = c.data || {}; S.bairros = b.data || []; S.stories = d.error ? null : (d.data || []); S.esg = e.data || [];
  }

  // ---------- navegação e rascunhos ----------
  function abre(id) {
    atual = id;
    root.querySelectorAll('#agMenu [data-s]').forEach(b => b.classList.toggle('on', b.dataset.s === id));
    const m = root.querySelector('#agMain');
    m.innerHTML = ({ visao, previa, stories, funcionamento, entrega, contato, guia })[id]();
    ({ visao: ligaVisao, previa: ligaPrevia, stories: ligaStories, funcionamento: ligaFunc, entrega: ligaEntrega, contato: ligaContato, guia: () => { } })[id]();
    barra();
    m.scrollIntoView({ block: 'nearest' });
  }
  const original = sec => ({ funcionamento: () => ({ modo_abertura: S.cfg.modo_abertura, horario: S.cfg.horario || {}, tempo_entrega: S.cfg.tempo_entrega, tempo_retirada: S.cfg.tempo_retirada, pedido_minimo: Number(S.cfg.pedido_minimo) }), entrega: () => S.bairros.map(b => ({ ...b })), contato: () => ({ whatsapp: S.cfg.whatsapp, pix_nome: S.cfg.pix_nome, pix_cidade: S.cfg.pix_cidade }) })[sec]();
  const rasc = sec => (R[sec] = R[sec] || JSON.parse(JSON.stringify(original(sec))));
  const sujo = sec => R[sec] && JSON.stringify(R[sec]) !== JSON.stringify(original(sec));
  function barra() {
    const b = root.querySelector('#agSave'), s = sujo(atual);
    b.hidden = !s; if (s) root.querySelector('#agSaveTx').textContent = `Alterações não salvas em ${SECOES.find(x => x.id === atual).nome}. Nada muda no site até salvar.`;
    root.querySelectorAll('#agMenu [data-s]').forEach(x => x.querySelector('.ag-dot').hidden = !sujo(x.dataset.s));
  }
  const cab = (titulo, faz, onde, ver) => `<header class="ag-h"><div><h3>${titulo}</h3><p>${faz}</p>${onde ? `<div class="ag-onde"><span>Aparece em</span>${onde.map(o => `<em>${o}</em>`).join('')}</div>` : ''}</div>${ver ? `<button class="ag-b2 ag-ver" data-ver="${ver}">👀 Ver no celular</button>` : ''}</header>`;
  const ligaVer = () => root.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => { abre('previa'); setTimeout(() => mostra(b.dataset.ver), 900); });
  const campo = (rot, html, ajuda) => `<label class="ag-f"><b>${rot}</b>${html}${ajuda ? `<small>${ajuda}</small>` : ''}</label>`;

  // ---------- status da loja (mesma regra do servidor) ----------
  function abertaAgora(cfg) {
    if (cfg.modo_abertura === 'aberto') return [true, 'aberta à força pela loja'];
    if (cfg.modo_abertura === 'fechado') return [false, 'fechada à força pela loja'];
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const g = t => p.find(x => x.type === t).value, dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), hm = `${g('hour').replace('24', '00')}:${g('minute')}`;
    const h = (cfg.horario || {})[String(dia)];
    return h && hm >= h[0] && hm < h[1] ? [true, `pelo horário (${DIAS[dia]} ${h[0]}–${h[1]})`] : [false, h ? `pelo horário (${DIAS[dia]} ${h[0]}–${h[1]})` : `pelo horário (${DIAS[dia]}: não abre)`];
  }
  function statusStory(d) {
    const h = hojeSP();
    if (!d.ativo) return ['pausado', 'Pausado'];
    if (d.inicio && d.inicio > h) return ['agendado', 'Agendado'];
    if (d.fim && d.fim < h) return ['encerrado', 'Encerrado'];
    return ['noar', 'No ar'];
  }

  // ---------- Visão geral ----------
  function visao() {
    const [ab, porque] = abertaAgora(S.cfg), noar = (S.stories || []).filter(d => statusStory(d)[0] === 'noar').length, bat = S.bairros.filter(b => b.ativo);
    const atual = S.cfg.atualizado_em ? new Date(S.cfg.atualizado_em).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
    return cab('Visão geral', 'Um resumo de como o site está agora para o cliente. Toque em um cartão para ir à seção.', null) + `
      <div class="ag-kpis">
        <button class="ag-kpi ${ab ? 'ok' : 'off'}" data-ir="funcionamento"><small>Loja agora</small><b>${ab ? '● Aberta' : '● Fechada'}</b><span>${esc(porque)}</span></button>
        <button class="ag-kpi" data-ir="stories"><small>Stories no ar</small><b>${S.stories ? noar : '—'}</b><span>${S.stories ? `${S.stories.length} cadastrados` : 'tabela não encontrada'}</span></button>
        <button class="ag-kpi" data-ir="entrega"><small>Bairros atendidos</small><b>${bat.length}</b><span>${bat.length ? `taxas de ${brl(Math.min(...bat.map(b => +b.taxa)))} a ${brl(Math.max(...bat.map(b => +b.taxa)))}` : 'nenhum ativo'}</span></button>
        <button class="ag-kpi ${S.esg.length ? 'warn' : ''}" data-ir="esg"><small>Esgotados hoje</small><b>${S.esg.length}</b><span>${S.esg.length ? esc(S.esg.slice(0, 3).map(e => e.nome).join(', ')) + (S.esg.length > 3 ? '…' : '') : 'cardápio completo'}</span></button>
      </div>
      <div class="ag-card"><h4>Mapa rápido: o que você muda aqui e onde o cliente vê</h4>
        <div class="ag-mapa">
          ${[['⭕', 'Stories', 'stories', 'Primeira bolinha dos stories no celular ("Novidades")'], ['🕒', 'Funcionamento', 'funcionamento', 'Selo "Aberto agora", tempos em Entrega/Retirada, pedido mínimo no checkout; fora do horário o site não aceita pedido'], ['🛵', 'Entrega', 'entrega', 'Lista de bairros e taxa no checkout'], ['💳', 'Contato e Pix', 'contato', 'Botões de WhatsApp, mensagem do pedido e dados do Pix']].map(([i, n, s, o]) => `<button data-ir="${s}"><i>${i}</i><b>${n}</b><span>${o}</span><em>›</em></button>`).join('')}
        </div>
        <p class="ag-mini">${S.cfg.atualizado_em ? `Configurações salvas pela última vez em ${esc(atual)}. ` : ''}Preços, fotos dos copos e textos fixos ficam no código: veja "Onde mexer".</p></div>`;
  }
  function ligaVisao() { root.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => { if (b.dataset.ir === 'esg') { document.querySelector('.al-tabs [data-t=esgotados]')?.click(); return; } abre(b.dataset.ir); }); }

  // ---------- Prévias ----------
  function previa() {
    return cab('Prévias ao vivo', 'O site como o cliente vê agora, no computador e no celular. Depois de salvar algo, toque em "Recarregar" para ver a mudança.', null) + `
      <div class="ag-pv-bar"><button class="ag-b2" id="pvRec">↻ Recarregar</button><span>No celular, ir para:</span>
        <button class="ag-chip" data-p="inicio">Início</button><button class="ag-chip" data-p="novidades">Story "Novidades"</button><button class="ag-chip" data-p="montar">Monte o seu</button><button class="ag-chip" data-p="checkout">Checkout</button><button class="ag-chip" data-p="loja">Info da loja</button></div>
      <div class="ag-pv">
        <div class="ag-pv-pc"><div class="ag-pv-tit">💻 Computador</div><div class="ag-pv-tela" id="pvPcBox"><iframe id="pvPc" title="Prévia no computador" src="${location.pathname}?previa=1" loading="lazy"></iframe></div></div>
        <div class="ag-pv-cel"><div class="ag-pv-tit">📱 Celular</div><div class="ag-phone"><div class="ag-scr"><div class="ag-sb"><b>${hora()}</b><i class="ag-ilha"></i><span>▮▮▮ ◔</span></div><iframe id="pvCel" title="Prévia no celular" src="${location.pathname}?previa=1" loading="lazy"></iframe></div></div></div>
      </div>`;
  }
  function ligaPrevia() {
    const box = root.querySelector('#pvPcBox'), pc = root.querySelector('#pvPc');
    // computador: mesma altura do celular ao lado (ou 16:10 quando empilhado), rolável por dentro
    const ajusta = () => { const k = box.clientWidth / 1366, lado = innerWidth > 1000, h = lado ? 610 - 22 : Math.round(box.clientWidth * .66); pc.style.transform = `scale(${k})`; box.style.height = h + 'px'; pc.style.height = Math.round(h / k) + 'px'; };
    ajusta(); addEventListener('resize', ajusta);
    root.querySelector('#pvRec').onclick = () => { pc.contentWindow.location.reload(); root.querySelector('#pvCel').contentWindow.location.reload(); };
    root.querySelectorAll('[data-p]').forEach(b => b.onclick = () => mostra(b.dataset.p));
  }
  function mostra(p) {
    const f = root.querySelector('#pvCel'); if (!f) return;
    const w = f.contentWindow, A = w.APP_;
    if (!A) { setTimeout(() => mostra(p), 500); return; }
    try {
      const tinha = w.document.body.classList.contains('ap-trava') || w.document.getElementById('drawer')?.classList.contains('on');
      for (let n = 0; n < 4 && w.document.body.classList.contains('ap-trava'); n++) A.volta();
      w.eval('typeof fechar=="function"&&fechar()');
      setTimeout(() => {
        if (p === 'inicio') w.scrollTo(0, 0);
        else if (p === 'novidades') { const k = [...w.document.querySelectorAll('.ap-sto small')].findIndex(s => s.textContent === 'Novidades'); if (k > 0) A.story(k); else { w.scrollTo(0, 0); window.toast && toast('Nenhum story "Novidades" no ar agora'); } }
        else if (p === 'montar') A.montar();
        else if (p === 'checkout') { w.eval("if(!sacola.length)sacola.push({nome:'Exemplo (prévia)',det:'Item só para ver o checkout',preco:17,qtd:1,ref:{tipo:'pronto',i:0,t:0}});atualiza();abrir();setTimeout(()=>telaCheckout(),450)"); }
        else if (p === 'loja') { const vai = () => { const x = w.document.getElementById('ap-s-loja'); if (x) w.scrollTo({ top: x.getBoundingClientRect().top + w.scrollY - 108, behavior: 'instant' }); }; vai(); setTimeout(vai, 500); }
      }, tinha ? 750 : 120);
    } catch (e) { }
  }

  // ---------- Stories ----------
  function stories() {
    const h = cab('Stories do site', 'Fotos e vídeos curtos de novidades, promoções e lançamentos. Publicar aqui coloca o story no site na hora; pausar ou apagar tira na hora.', ['Celular · primeira bolinha "Novidades"', 'Na ordem desta lista'], 'novidades');
    if (!S.stories) return h + `<div class="ag-card ag-erro">A tabela de stories não foi encontrada no banco.</div>`;
    return h + `<div class="ag-sbar"><button class="ag-b1" id="stNovo">+ Novo story</button><span class="ag-mini">Dica: vídeo em pé (9:16), até 30 s e 50 MB · foto até 10 MB (o site diminui antes de enviar).</span></div>
      <div class="ag-sts">${S.stories.map((d, k) => { const [c, t] = statusStory(d); return `<div class="ag-st"><div class="ag-st-m">${d.tipo === 'video' ? `<video src="${esc(d.midia_url)}" muted playsinline preload="metadata"></video><i>▶</i>` : `<img src="${esc(d.midia_url)}" alt="">`}<span class="ag-tag ${c}">${t}</span></div>
        <div class="ag-st-i"><b>${esc(d.titulo)}</b><small>${esc(d.texto || 'Sem texto')}</small><small>${d.inicio || d.fim ? `📅 ${d.inicio ? fmt(d.inicio) : 'já'} até ${d.fim ? fmt(d.fim) : 'sem fim'}` : '📅 sem data de fim'}${d.botao_texto ? ` · botão "${esc(d.botao_texto)}"` : ''}</small></div>
        <div class="ag-st-a"><button class="ag-ic" data-a="sobe" data-k="${k}" ${k ? '' : 'disabled'} title="Subir na ordem">↑</button><button class="ag-ic" data-a="desce" data-k="${k}" ${k < S.stories.length - 1 ? '' : 'disabled'} title="Descer na ordem">↓</button><button class="ag-b2" data-a="edita" data-k="${k}">Editar</button><button class="ag-b2" data-a="ativo" data-k="${k}">${d.ativo ? 'Pausar' : 'Ativar'}</button><button class="ag-b2 ag-perigo" data-a="apaga" data-k="${k}">Apagar</button></div></div>`; }).join('') || '<div class="ag-vazio">Nenhum story ainda. Toque em "+ Novo story".</div>'}</div>
      <div id="stEd"></div>`;
  }
  const fmt = d => d.split('-').reverse().slice(0, 2).join('/');
  function ligaStories() {
    ligaVer();
    if (!S.stories) return;
    root.querySelector('#stNovo').onclick = () => editor(null);
    root.querySelectorAll('.ag-st [data-a]').forEach(b => b.onclick = async () => {
      const k = +b.dataset.k, d = S.stories[k], a = b.dataset.a; let r;
      if (a === 'edita') return editor(d);
      if (a === 'ativo') r = await SB.from('destaques').update({ ativo: !d.ativo }).eq('id', d.id);
      if (a === 'apaga') {
        if (!confirm(`Apagar o story "${d.titulo}"? Ele sai do site na hora.`)) return;
        r = await SB.from('destaques').delete().eq('id', d.id);
        const cam = d.midia_url.split('/object/public/midia/')[1]; if (!r.error && cam) await SB.storage.from('midia').remove([decodeURIComponent(cam)]);
      }
      if (a === 'sobe' || a === 'desce') {
        const l = [...S.stories], j = a === 'sobe' ? k - 1 : k + 1;[l[k], l[j]] = [l[j], l[k]];
        const rs = await Promise.all(l.map((x, i) => SB.from('destaques').update({ ordem: i }).eq('id', x.id))); r = rs.find(x => x.error) || {};
      }
      if (r && r.error) { aviso('Não deu certo: ' + r.error.message, 1); return; }
      await recarrega('destaques'); abre('stories'); aviso(a === 'apaga' ? 'Story apagado' : a === 'ativo' ? (d.ativo ? 'Story pausado: saiu do site' : 'Story ativado: está no site') : 'Ordem atualizada');
    });
  }
  async function recarrega(t) {
    if (t === 'destaques') { const { data } = await SB.from('destaques').select('*').order('ordem').order('criado_em'); S.stories = data || []; }
    if (t === 'bairros') { const { data } = await SB.from('bairros').select('*').order('ordem').order('id'); S.bairros = data || []; }
    if (t === 'cfg') { const { data } = await SB.from('loja_config').select('*').eq('id', 1).single(); S.cfg = data || S.cfg; }
  }
  function editor(d) {
    const ed = root.querySelector('#stEd'), novo = !d; d = d || { titulo: '', texto: '', botao_texto: '', botao_link: '', inicio: '', fim: '', tipo: 'foto', midia_url: '' };
    const lk = ['#montar', '#ap-s-dest', '#ap-s-sab', ''].includes(d.botao_link || '') ? (d.botao_link || '') : 'url';
    ed.innerHTML = `<div class="ag-modal"><div class="ag-ed">
      <div class="ag-ed-f"><h4>${novo ? 'Novo story' : 'Editar story'}</h4>
        <div class="ag-drop" id="edDrop"><input type="file" id="edArq" accept="image/jpeg,image/png,image/webp,video/mp4"><b>${novo ? 'Escolha a foto ou o vídeo' : 'Trocar a foto ou o vídeo (opcional)'}</b><small>Arraste aqui ou toque para escolher · JPG, PNG, WEBP ou MP4</small><span id="edNome"></span></div>
        ${campo('Título', `<input class="ag-in" id="edTit" maxlength="60" value="${esc(d.titulo)}" placeholder="Ex.: Novo sabor: Pistache">`, 'Aparece em letras grandes no story (até 60 letras).')}
        ${campo('Texto', `<input class="ag-in" id="edTxt" maxlength="160" value="${esc(d.texto || '')}" placeholder="Uma linha sobre a novidade">`, 'Linha menor, abaixo do título (opcional).')}
        <div class="ag-2">${campo('Botão leva para', `<select class="ag-in" id="edLk"><option value="">Sem botão</option><option value="#montar">Monte o seu</option><option value="#ap-s-dest">Cardápio</option><option value="#ap-s-sab">Sabores</option><option value="url">Outro link (https://…)</option></select>`)}
        ${campo('Texto do botão', `<input class="ag-in" id="edBt" maxlength="30" value="${esc(d.botao_texto || '')}" placeholder="Ex.: Quero provar">`)}</div>
        <div id="edUrlW" hidden>${campo('Link', `<input class="ag-in" id="edUrl" maxlength="300" value="${lk === 'url' ? esc(d.botao_link) : ''}" placeholder="https://…">`)}</div>
        <div class="ag-2">${campo('Começa em', `<input class="ag-in" type="date" id="edIni" value="${d.inicio || ''}">`, 'Vazio = já entra no ar.')}${campo('Termina em', `<input class="ag-in" type="date" id="edFim" value="${d.fim || ''}">`, 'Vazio = fica até você pausar.')}</div>
        <div class="ag-err" id="edErr"></div>
        <div class="ag-ed-b"><button class="ag-b2" id="edCanc">Cancelar</button><button class="ag-b1" id="edOk">${novo ? 'Publicar no site' : 'Salvar story'}</button></div></div>
      <div class="ag-ed-p"><div class="ag-pv-tit">Prévia no celular</div><div class="ag-phone sm"><div class="ag-ilha"></div><div class="ag-stp" id="edPrev"></div></div></div></div></div>`;
    const $ = id => ed.querySelector('#' + id);
    $('edLk').value = lk; $('edUrlW').hidden = lk !== 'url';
    let arq = null, url = d.midia_url, tipo = d.tipo;
    const prev = () => {
      const tit = $('edTit').value || 'Título do story', tx = $('edTxt').value, bt = $('edLk').value && $('edBt').value;
      $('edPrev').innerHTML = `<div class="ag-stp-bars"><i></i></div><div class="ag-stp-hd"><img src="img/logo.png" alt=""><span>acaideira · Novidades</span></div>${url ? (tipo === 'video' ? `<video src="${esc(url)}" autoplay muted loop playsinline></video>` : `<img class="m" src="${esc(url)}" alt="">`) : '<div class="ag-stp-vz">Sua foto ou vídeo aparece aqui</div>'}<div class="ag-stp-tx"><b>${esc(tit)}</b><span>${esc(tx)}</span></div>${bt ? `<em>${esc(bt.toUpperCase())}</em>` : ''}`;
    };
    prev();
    ['edTit', 'edTxt', 'edBt'].forEach(i => $(i).oninput = prev);
    $('edLk').onchange = () => { $('edUrlW').hidden = $('edLk').value !== 'url'; prev(); };
    const pega = f => { if (!f) return; arq = f; $('edErr').textContent = ''; tipo = f.type === 'video/mp4' ? 'video' : 'foto'; url = URL.createObjectURL(f); $('edNome').textContent = `${f.name} · ${(f.size / 1048576).toFixed(1)} MB`; prev(); };
    $('edArq').onchange = () => pega($('edArq').files[0]);
    const dr = $('edDrop'); dr.ondragover = e => { e.preventDefault(); dr.classList.add('on'); }; dr.ondragleave = () => dr.classList.remove('on'); dr.ondrop = e => { e.preventDefault(); dr.classList.remove('on'); pega(e.dataTransfer.files[0]); };
    const fecha = () => { ed.innerHTML = ''; };
    $('edCanc').onclick = fecha;
    ed.querySelector('.ag-modal').onclick = e => { if (e.target.classList.contains('ag-modal')) fecha(); };
    $('edOk').onclick = async () => {
      const err = $('edErr'), ok = $('edOk'); err.textContent = '';
      const tit = $('edTit').value.trim(), l = $('edLk').value, link = l === 'url' ? $('edUrl').value.trim() : l, btx = $('edBt').value.trim();
      if (novo && !arq) return err.textContent = 'Escolha a foto ou o vídeo.';
      if (!tit) return err.textContent = 'Dê um título ao story.';
      if (l === 'url' && !/^https:\/\//.test(link)) return err.textContent = 'O link precisa começar com https://';
      if (link && !btx) return err.textContent = 'Escreva o texto do botão.';
      if ($('edIni').value && $('edFim').value && $('edFim').value < $('edIni').value) return err.textContent = 'A data de fim é antes do início.';
      if (arq) {
        const v = arq.type === 'video/mp4';
        if (!v && !/^image\//.test(arq.type)) return err.textContent = 'Use foto (JPG, PNG, WEBP) ou vídeo MP4.';
        if (v && arq.size > 50 * 1048576) return err.textContent = 'Vídeo acima de 50 MB. Exporte em 1080p e até 30 segundos.';
        if (!v && arq.size > 10 * 1048576) return err.textContent = 'Foto acima de 10 MB.';
      }
      ok.disabled = true; ok.textContent = arq ? 'Enviando arquivo…' : 'Salvando…';
      try {
        const dados = { titulo: tit, texto: $('edTxt').value.trim() || null, botao_texto: link ? btx : null, botao_link: link || null, inicio: $('edIni').value || null, fim: $('edFim').value || null };
        if (arq) {
          const v = arq.type === 'video/mp4', blob = v ? arq : await reduzFoto(arq), cam = `destaques/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${v ? 'mp4' : 'webp'}`;
          const up = await SB.storage.from('midia').upload(cam, blob, { contentType: v ? 'video/mp4' : 'image/webp', upsert: false }); if (up.error) throw up.error;
          dados.midia_url = SB.storage.from('midia').getPublicUrl(cam).data.publicUrl; dados.tipo = v ? 'video' : 'foto';
        }
        const r = novo ? await SB.from('destaques').insert({ ...dados, ordem: S.stories.length }) : await SB.from('destaques').update(dados).eq('id', d.id);
        if (r.error) throw r.error;
        await recarrega('destaques'); fecha(); abre('stories'); aviso(novo ? 'Story publicado: já está no site 💜' : 'Story atualizado');
      } catch (e) { err.textContent = 'Não deu certo: ' + (e.message || e); ok.disabled = false; ok.textContent = novo ? 'Publicar no site' : 'Salvar story'; }
    };
  }
  async function reduzFoto(f) {
    const img = await createImageBitmap(f), k = Math.min(1, 1440 / Math.max(img.width, img.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    return await new Promise(r => cv.toBlob(r, 'image/webp', .85));
  }

  // ---------- Funcionamento ----------
  function funcionamento() {
    const D = rasc('funcionamento'), [ab, porque] = abertaAgora({ ...S.cfg, ...D });
    return cab('Funcionamento', 'Quando o site aceita pedidos e quanto tempo o cliente espera. Fora do horário, o site mostra "Fechado agora" e o servidor recusa pedidos.', ['Selo "Aberto/Fechado agora"', 'Entrega/Retirada no topo do celular', 'Checkout (pedido mínimo)']) + `
      <div class="ag-card"><h4>Abrir e fechar</h4><p class="ag-mini">Com <b>${ab ? 'estas regras a loja está ABERTA' : 'estas regras a loja está FECHADA'}</b> agora (${esc(porque)}). A loja também consegue mudar isso pelo painel dela.</p>
        <div class="ag-seg" id="fnModo">${[['auto', 'Automático', 'segue o horário abaixo'], ['aberto', 'Aberta agora', 'ignora o horário'], ['fechado', 'Fechada agora', 'pausa os pedidos']].map(([v, n, s]) => `<button data-v="${v}" class="${D.modo_abertura === v ? 'on' : ''}"><b>${n}</b><small>${s}</small></button>`).join('')}</div></div>
      <div class="ag-card"><div class="ag-ch"><h4>Horário de funcionamento</h4><button class="ag-b2" id="fnCopia">Copiar segunda para todos os dias</button></div>
        <div class="ag-hor">${DIAS.map((n, i) => { const x = (D.horario || {})[String(i)]; return `<div class="ag-dia ${x ? '' : 'fechado'}"><b>${n}</b><label class="ag-sw"><input type="checkbox" data-d="${i}" ${x ? 'checked' : ''}><i></i><span>${x ? 'Abre' : 'Fechado'}</span></label><input class="ag-in" type="time" data-a="${i}" value="${x ? x[0] : '14:00'}" ${x ? '' : 'disabled'}><span class="ag-as">às</span><input class="ag-in" type="time" data-f="${i}" value="${x ? x[1] : '22:00'}" ${x ? '' : 'disabled'}></div>`; }).join('')}</div></div>
      <div class="ag-card"><h4>Tempos e pedido mínimo</h4><div class="ag-3">
        ${campo('Tempo de entrega', `<input class="ag-in" id="fnTe" value="${esc(D.tempo_entrega || '')}" placeholder="35 a 50 min">`, 'Aparece no botão Entrega e na sacola.')}
        ${campo('Tempo de retirada', `<input class="ag-in" id="fnTr" value="${esc(D.tempo_retirada || '')}" placeholder="15 min">`, 'Aparece no botão Retirada.')}
        ${campo('Pedido mínimo (R$)', `<input class="ag-in" id="fnPm" type="number" min="0" step="0.5" value="${D.pedido_minimo}">`, '0 = sem mínimo. Abaixo disso o checkout não deixa finalizar.')}</div></div>`;
  }
  function ligaFunc() {
    const D = rasc('funcionamento'), m = root.querySelector('#agMain');
    const re = () => { const y = scrollY; abre('funcionamento'); scrollTo(0, y); };
    m.querySelectorAll('#fnModo [data-v]').forEach(b => b.onclick = () => { D.modo_abertura = b.dataset.v; re(); });
    m.querySelectorAll('[data-d]').forEach(c => c.onchange = () => { const i = c.dataset.d; D.horario[i] = c.checked ? [m.querySelector(`[data-a="${i}"]`).value, m.querySelector(`[data-f="${i}"]`).value] : null; re(); });
    m.querySelectorAll('[data-a],[data-f]').forEach(t => t.onchange = () => { const i = t.dataset.a || t.dataset.f; if (D.horario[i]) { D.horario[i] = [m.querySelector(`[data-a="${i}"]`).value, m.querySelector(`[data-f="${i}"]`).value]; barra(); } });
    m.querySelector('#fnCopia').onclick = () => { const s = D.horario['1']; if (!s) return aviso('Segunda está fechada: abra a segunda primeiro', 1); for (let i = 0; i < 7; i++) D.horario[String(i)] = [...s]; re(); };
    m.querySelector('#fnTe').oninput = e => { D.tempo_entrega = e.target.value; barra(); };
    m.querySelector('#fnTr').oninput = e => { D.tempo_retirada = e.target.value; barra(); };
    m.querySelector('#fnPm').oninput = e => { D.pedido_minimo = Number(e.target.value) || 0; barra(); };
  }

  // ---------- Entrega ----------
  function entrega() {
    const L = rasc('entrega');
    return cab('Entrega: bairros e taxas', 'Os bairros que o cliente pode escolher no checkout e a taxa de cada um. A taxa entra no total do pedido e o servidor confere o valor.', ['Checkout · campo Bairro', 'Total do pedido'], 'checkout') + `
      <div class="ag-card"><div class="ag-bh"><span>Bairro</span><span>Taxa</span><span>Atende</span><span></span></div>
        <div id="enLista">${L.map((b, k) => `<div class="ag-bai ${b._x ? 'apagado' : ''} ${b.ativo ? '' : 'inativo'}">
          <input class="ag-in" data-k="${k}" data-c="nome" value="${esc(b.nome || '')}" placeholder="Nome do bairro" ${b._x ? 'disabled' : ''}>
          <div class="ag-rs"><span>R$</span><input class="ag-in" data-k="${k}" data-c="taxa" type="number" min="0" step="0.5" value="${Number(b.taxa || 0)}" ${b._x ? 'disabled' : ''}></div>
          <label class="ag-sw"><input type="checkbox" data-k="${k}" data-c="ativo" ${b.ativo ? 'checked' : ''} ${b._x ? 'disabled' : ''}><i></i><span>${b.ativo ? 'Sim' : 'Não'}</span></label>
          <div class="ag-bac"><button class="ag-ic" data-m="-1" data-k="${k}" ${k ? '' : 'disabled'} title="Subir">↑</button><button class="ag-ic" data-m="1" data-k="${k}" ${k < L.length - 1 ? '' : 'disabled'} title="Descer">↓</button><button class="ag-ic ${b._x ? '' : 'ag-perigo'}" data-x="${k}" title="${b._x ? 'Desfazer' : 'Remover'}">${b._x ? '↺' : '✕'}</button></div></div>`).join('')}</div>
        <button class="ag-add" id="enAdd">+ Adicionar bairro</button>
        <p class="ag-mini">Taxa R$ 0 aparece como "a combinar". "Atende = Não" esconde o bairro sem apagar. A ordem aqui é a ordem da lista no checkout.</p></div>`;
  }
  function ligaEntrega() {
    ligaVer();
    const L = rasc('entrega'), m = root.querySelector('#agMain'), re = () => { const y = scrollY; abre('entrega'); scrollTo(0, y); };
    m.querySelectorAll('[data-c]').forEach(i => { const ev = i.type === 'checkbox' ? 'onchange' : 'oninput'; i[ev] = () => { const b = L[+i.dataset.k], c = i.dataset.c; b[c] = c === 'ativo' ? i.checked : c === 'taxa' ? Number(i.value) || 0 : i.value; if (c === 'ativo') re(); else barra(); }; });
    m.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const k = +b.dataset.k, j = k + +b.dataset.m;[L[k], L[j]] = [L[j], L[k]]; re(); });
    m.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { const k = +b.dataset.x; if (!L[k].id) L.splice(k, 1); else L[k]._x = !L[k]._x; re(); });
    m.querySelector('#enAdd').onclick = () => { L.push({ nome: '', taxa: 0, ativo: true }); re(); setTimeout(() => { const l = m.querySelectorAll('[data-c=nome]'); l[l.length - 1].focus(); }, 30); };
  }

  // ---------- Contato e Pix ----------
  function contato() {
    const D = rasc('contato');
    return cab('Contato e Pix', 'Para onde vão as mensagens dos clientes e os dados que aparecem no Pix.', ['Botões de WhatsApp do site', 'Mensagem do pedido', 'QR Code do Pix']) + `
      <div class="ag-card"><div class="ag-3">
        ${campo('WhatsApp da loja', `<input class="ag-in" id="ctWa" inputmode="numeric" value="${esc(D.whatsapp || '')}" placeholder="5561982022436">`, 'Só números, com 55 + DDD. Recebe os pedidos e as dúvidas.')}
        ${campo('Nome no Pix', `<input class="ag-in" id="ctPn" maxlength="25" value="${esc(D.pix_nome || '')}">`, 'Nome que o banco do cliente mostra ao pagar (até 25 letras).')}
        ${campo('Cidade no Pix', `<input class="ag-in" id="ctPc" maxlength="15" value="${esc(D.pix_cidade || '')}">`, 'Cidade da conta (até 15 letras).')}</div>
        <div class="ag-test"><span>Teste o número:</span><a class="ag-b2" id="ctTeste" target="_blank" rel="noopener">Abrir conversa no WhatsApp ↗</a></div>
        <p class="ag-mini">A <b>chave Pix</b> ainda fica no código (arquivo <code>index.html</code>, campo <code>pixChave</code>). Com o Mercado Pago ligado no servidor, o Pix é gerado pelo Mercado Pago e confirmado sozinho, sem precisar da chave.</p></div>`;
  }
  function ligaContato() {
    const D = rasc('contato'), m = root.querySelector('#agMain'), t = m.querySelector('#ctTeste');
    const lk = () => { t.href = `https://wa.me/${(D.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent('Teste do site Açaideira ✅')}`; };
    lk();
    m.querySelector('#ctWa').oninput = e => { D.whatsapp = e.target.value.replace(/\D/g, ''); lk(); barra(); };
    m.querySelector('#ctPn').oninput = e => { D.pix_nome = e.target.value; barra(); };
    m.querySelector('#ctPc').oninput = e => { D.pix_cidade = e.target.value; barra(); };
  }

  // ---------- Onde mexer ----------
  function guia() {
    const L = [
      ['Story de novidade ou promoção', 'Aqui · Stories', 'Entra na bolinha "Novidades" do celular na hora'],
      ['Abrir ou fechar a loja agora', 'Aqui · Funcionamento (ou a loja, no painel dela)', 'Selo muda; fechada, o site não aceita pedidos'],
      ['Horário de cada dia', 'Aqui · Funcionamento', 'Site abre e fecha sozinho nesses horários'],
      ['Tempo de entrega/retirada, pedido mínimo', 'Aqui · Funcionamento', 'Textos de Entrega/Retirada e trava no checkout'],
      ['Bairros e taxas', 'Aqui · Entrega', 'Lista e taxa no checkout'],
      ['WhatsApp, nome e cidade do Pix', 'Aqui · Contato e Pix', 'Botões de WhatsApp, mensagem do pedido, QR do Pix'],
      ['Item que acabou hoje', 'Aba Esgotados (a loja também usa)', 'Item fica cinza "ESGOTADO" e o servidor recusa'],
      ['Preço de copo, tamanho, complemento', 'Código · public/js/catalogo.js', 'Preço no site e no servidor (mesmo arquivo)'],
      ['Nova taça no cardápio', 'Código · PRONTOS em js/catalogo.js + foto em img/', 'Novo cartão no cardápio e no app'],
      ['Foto de copo, sabor ou complemento', 'Código · trocar o arquivo em public/img/ (mesmo nome)', 'Foto nova em todo o site'],
      ['Vídeos fixos dos stories (Vídeos, Na taça)', 'Código · lista STORIES em js/app.js + public/video/', 'Bolinhas fixas do celular'],
      ['Textos do topo, sobre a loja, rodapé', 'Código · public/index.html', 'Site do computador'],
      ['Cores e visual do app', 'Código · public/css/app.css', 'App no celular'],
      ['Contas da equipe (loja/agência)', 'Supabase · tabela equipe', 'Quem vê o quê no painel'],
      ['Chaves secretas, endereço do site', 'Railway · Variables', 'Servidor, Pix e cartão do Mercado Pago']];
    return cab('Onde mexer', 'Tudo o que dá para mudar no site e onde fica. O que está "Aqui" você muda nesta área, sem código; o resto é com alteração no código pelo GitHub (o site atualiza sozinho em 1 a 2 minutos).', null) + `
      <div class="ag-card ag-tab"><div class="ag-tr ag-th"><span>Quero mudar…</span><span>Onde</span><span>O que acontece no site</span></div>${L.map(([a, b, c]) => `<div class="ag-tr"><span>${a}</span><span class="${b.startsWith('Aqui') || b.startsWith('Aba') ? 'aqui' : 'cod'}">${b}</span><span>${c}</span></div>`).join('')}</div>`;
  }

  // ---------- salvar ----------
  async function salvar(sec) {
    const bt = root.querySelector('#agSalva'); bt.disabled = true; bt.textContent = 'Salvando…';
    try {
      if (sec === 'funcionamento') {
        const D = R.funcionamento;
        for (const [i, h] of Object.entries(D.horario || {})) if (h && h[0] >= h[1]) throw new Error(`${DIAS[i]}: o horário de fechar precisa ser depois do de abrir.`);
        const { error } = await SB.from('loja_config').update({ ...D, atualizado_em: new Date().toISOString() }).eq('id', 1); if (error) throw error;
        await recarrega('cfg');
      }
      if (sec === 'contato') {
        const D = R.contato;
        if ((D.whatsapp || '').length < 12) throw new Error('WhatsApp com 55 + DDD + número, ex.: 5561982022436.');
        if (!D.pix_nome || !D.pix_cidade) throw new Error('Preencha nome e cidade do Pix.');
        const { error } = await SB.from('loja_config').update({ ...D, atualizado_em: new Date().toISOString() }).eq('id', 1); if (error) throw error;
        await recarrega('cfg');
      }
      if (sec === 'entrega') {
        const L = R.entrega.map((b, i) => ({ ...b, ordem: i })), vivos = L.filter(b => !b._x);
        if (vivos.some(b => !String(b.nome || '').trim())) throw new Error('Todo bairro precisa de nome.');
        for (const b of L.filter(b => b._x && b.id)) { const r = await SB.from('bairros').delete().eq('id', b.id); if (r.error) throw r.error; }
        const velhos = vivos.filter(b => b.id).map(({ _x, ...b }) => ({ ...b, nome: b.nome.trim() })), novos = vivos.filter(b => !b.id).map(({ _x, id, ...b }) => ({ ...b, nome: b.nome.trim() }));
        if (velhos.length) { const r = await SB.from('bairros').upsert(velhos); if (r.error) throw r.error; }
        if (novos.length) { const r = await SB.from('bairros').insert(novos); if (r.error) throw r.error; }
        await recarrega('bairros');
      }
      delete R[sec]; abre(sec); aviso(`Salvo às ${hora()}: já vale no site ✅`);
    } catch (e) { aviso('Não salvou: ' + (e.message || e), 1); }
    bt.disabled = false; bt.textContent = 'Salvar alterações';
  }
  function aviso(t, erro) { if (window.toast) toast(t); const s = root.querySelector('#agSaveTx'); if (erro && s) { root.querySelector('#agSave').hidden = false; s.textContent = t; } }

  // ---------- Demonstração (só quando o site roda sem servidor, ex.: prévia) ----------
  // Mostra a aba Agência com dados de exemplo guardados só na memória: nada vai para o banco.
  function bancoDemo() {
    const hoje = hojeSP(), T = {
      loja_config: [{ id: 1, modo_abertura: 'auto', tempo_entrega: '35 a 50 min', tempo_retirada: '15 min', pedido_minimo: 15, whatsapp: '5561982022436', pix_nome: 'Acaideira', pix_cidade: 'Novo Gama', atualizado_em: new Date().toISOString(), horario: { '0': ['14:00', '22:00'], '1': null, '2': ['14:00', '22:00'], '3': ['14:00', '22:00'], '4': ['14:00', '22:00'], '5': ['14:00', '23:00'], '6': ['14:00', '23:00'] } }],
      bairros: [{ id: 1, nome: 'Boa Vista 2', taxa: 3, ativo: true, ordem: 0 }, { id: 2, nome: 'Boa Vista 1', taxa: 4, ativo: true, ordem: 1 }, { id: 3, nome: 'Centro (Novo Gama)', taxa: 6, ativo: true, ordem: 2 }, { id: 4, nome: 'Pedregal', taxa: 8, ativo: false, ordem: 3 }],
      destaques: [{ id: 'd1', titulo: 'Novo sabor: Pistache', texto: 'Só esta semana, em todos os tamanhos', midia_url: 'img/g3.jpg', tipo: 'foto', botao_texto: 'Quero provar', botao_link: '#montar', ativo: true, ordem: 0, inicio: null, fim: null, criado_em: hoje },
        { id: 'd2', titulo: 'Combo família', texto: '2 copos de 500 ml com desconto', midia_url: 'video/frutas.mp4', tipo: 'video', botao_texto: null, botao_link: null, ativo: false, ordem: 1, inicio: null, fim: null, criado_em: hoje }],
      itens_esgotados: [{ item_id: 'demo', nome: 'Morango (exemplo)' }]
    };
    let nid = 100;
    const q = t => {
      let filtros = [], op = 'select', val = null, single = false;
      const b = {
        select() { return b }, order() { return b }, single() { single = true; return b },
        eq(c, v) { filtros.push(r => String(r[c]) === String(v)); return b }, neq(c, v) { filtros.push(r => String(r[c]) !== String(v)); return b },
        update(v) { op = 'update'; val = v; return b }, insert(v) { op = 'insert'; val = v; return b }, upsert(v) { op = 'upsert'; val = v; return b }, delete() { op = 'delete'; return b },
        then(res) {
          const L = T[t] = T[t] || [], ok = r => filtros.every(f => f(r)), arr = v => Array.isArray(v) ? v : [v];
          if (op === 'update') L.filter(ok).forEach(r => Object.assign(r, val));
          if (op === 'insert') arr(val).forEach(v => L.push({ id: 'n' + (++nid), criado_em: new Date().toISOString(), ...v }));
          if (op === 'upsert') arr(val).forEach(v => { const k = v.id !== undefined ? L.find(r => r.id === v.id) : v.item_id !== undefined ? L.find(r => r.item_id === v.item_id) : null; k ? Object.assign(k, v) : L.push({ ...v }); });
          if (op === 'delete') T[t] = L.filter(r => !ok(r));
          let d = JSON.parse(JSON.stringify(T[t].filter(ok)));
          if ('ordem' in (d[0] || {})) d.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
          res({ data: op === 'select' ? (single ? d[0] : d) : null, error: null });
        }
      };
      return b;
    };
    const urls = {};
    return { from: q, storage: { from: () => ({ upload: async (cam, blob) => { urls[cam] = URL.createObjectURL(blob); return { error: null }; }, getPublicUrl: cam => ({ data: { publicUrl: urls[cam] || 'img/logo.png' } }), remove: async () => ({ error: null }) }) } };
  }
  function ofereceDemo() {
    if (location.hash !== '#painel' || window.API_ONLINE || document.getElementById('tab-agencia') || !window.PAINEL_PAPEL) return;
    const nav = document.querySelector('.al-tabs'); if (!nav || nav.querySelector('[data-t=agdemo]')) return;
    nav.insertAdjacentHTML('beforeend', '<button data-t="agdemo">🎯 Agência (demo)</button>');
    nav.querySelector('[data-t=agdemo]').onclick = ev => {
      ev.stopPropagation(); ev.target.remove(); window.AGENCIA_DEMO = true;
      PAINEL_PAPEL({ papel: 'agencia' }, bancoDemo());
      setTimeout(() => document.querySelector('.al-tabs [data-t=agencia]')?.click(), 50);
    };
  }
  addEventListener('hashchange', () => setTimeout(ofereceDemo, 1500));
  addEventListener('load', () => setTimeout(ofereceDemo, 1500));
  window.AGENCIA_TESTE = { estado: () => ({ S, R, atual }), abre };
})();
