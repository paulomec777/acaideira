// Açaideira — Monte o seu no computador em 6 etapas guiadas (mesmas regras do app no celular).
// Grátis e obrigatórias: Tamanho, Sabor, Complementos (de 1 até o limite) e Cobertura.
// Pagas e opcionais: Recheio e Extras, com "Não quero" que já pula para a próxima.
// Também aplica os itens marcados como esgotados pela loja.
(function () {
  const APP = () => document.body.classList.contains('app');
  const E = id => document.getElementById(id);
  const ETAPAS = [
    { id: 'tam', box: 'o-tam', nome: 'Tamanho', dica: 'Escolha o tamanho do copo' },
    { id: 'base', box: 'o-base', nome: 'Sabor', dica: 'Escolha o sabor do açaí' },
    { id: 'meio', box: 'o-meio', nome: 'Recheio', dica: 'Recheio no meio · escolha ou toque em Não quero' },
    { id: 'comp', box: 'o-fini', nome: 'Complementos', dica: 'Complementos grátis · escolha pelo menos 1' },
    { id: 'prem', box: 'o-prem', nome: 'Extras', dica: 'Cremes e extras · escolha ou toque em Não quero' },
    { id: 'cob', box: 'o-cob', nome: 'Cobertura', dica: 'Escolha a cobertura (grátis)' }];
  const OBRIG = { tam: 1, base: 1, comp: 1, cob: 1 };
  let D = novo();
  function novo() { return { tamOk: false, cobOk: false, nao: { meio: false, prem: false }, at: 'tam' }; }
  const lim = () => TAMANHOS.find(t => t.id === sel.tam).lim;
  function feito(id) {
    return { tam: D.tamOk, base: !!sel.base, meio: D.nao.meio || sel.meio.length > 0, comp: sel.comps.length > 0, prem: D.nao.prem || sel.prem.length > 0, cob: D.cobOk }[id];
  }
  const falta = () => ETAPAS.filter(e => !feito(e.id));
  const stepEl = id => E(ETAPAS.find(e => e.id === id).box).closest('.step');

  // ---------- itens esgotados (vêm do banco quando o site está no servidor) ----------
  const esg = () => new Set((window.API_ONLINE && window.API_ONLINE.esgotados) || []);
  window.ITEM_ESGOTADO = id => esg().has(id);
  const _opt = opt;
  opt = function (el, list, isSel, onClick, extra) {
    const es = esg();
    _opt(el, list, isSel, o => { if (es.has(o.id)) { toast('Esse item esgotou hoje 😕'); return; } onClick(o); }, o => (extra && extra(o)) || es.has(o.id));
    [...el.children].forEach((b, i) => { const o = list[i]; if (!o) return; b.dataset.id = o.id; if (es.has(o.id)) { b.dataset.esg = '1'; b.insertAdjacentHTML('beforeend', '<i class="esg-tag">ESGOTADO</i>'); } });
  };

  // ---------- montagem da tela ----------
  function prepara() {
    if (E('pcEtapa')) return;
    const sticky = document.querySelector('#montar ~ .grid .card.sticky') || document.querySelector('.card.sticky');
    if (!sticky) return;
    sticky.insertAdjacentHTML('afterbegin', `<div class="pc-etapa" id="pcEtapa"><div class="pc-et-tx"><span id="pcEtTx"></span><i><b id="pcProg"></b></i></div><div class="pc-chips" id="pcChips"></div></div>`);
    E('pcChips').onclick = e => { const b = e.target.closest('[data-s]'); if (b) { D.at = b.dataset.s; irPara(b.dataset.s); decora(); } };
    ETAPAS.forEach(e => {
      const st = stepEl(e.id), h = st.querySelector('h3');
      st.dataset.etapa = e.id;
      if (!h.querySelector('.pc-req')) h.insertAdjacentHTML('beforeend', `<span class="pc-req" id="pcReq-${e.id}"></span>`);
      if (e.id === 'meio' || e.id === 'comp' || e.id === 'prem') st.insertAdjacentHTML('beforeend', `<button type="button" class="pc-next" id="pcNx-${e.id}" hidden></button>`);
      st.addEventListener('click', ev => clique(e.id, ev), true);
      st.addEventListener('mouseenter', () => st.classList.add('pc-hover'));
      st.addEventListener('mouseleave', () => st.classList.remove('pc-hover'));
    });
    ['meio', 'comp', 'prem'].forEach(id => { E('pcNx-' + id).onclick = ev => { ev.stopPropagation(); avancar(id); }; });
    const pm = E('meio-txt'); if (pm) pm.textContent = 'Até 2 para a camada do meio, cobrados à parte. Não quer? Toque em "Não quero recheio".';
  }

  // registra a escolha e decide se segue sozinho para a próxima etapa
  function clique(id, ev) {
    if (APP()) return;
    const b = ev.target.closest('.opt'); if (!b || ev.target.closest('.pc-next')) return;
    if (b.dataset.esg) return;
    const vazio = b.classList.contains('vazio0'), cont = b.classList.contains('cont'), stat = b.classList.contains('stat');
    D.at = id;
    // tamanho e cobertura: marca como escolhido ANTES do render do site, senão o decora() tira o .sel e o copo só enche no 2º toque
    if (id === 'tam') { if (!D.tamOk) render._t = null; D.tamOk = true; }
    if (id === 'cob') D.cobOk = true;
    setTimeout(() => {
      if (id === 'tam') { D.tamOk = true; avancar('tam'); }
      else if (id === 'base' && !stat && sel.base) avancar('base');
      else if (id === 'meio') {
        if (vazio && !sel.meio.length) { D.nao.meio = true; avancar('meio'); }
        else { if (sel.meio.length) D.nao.meio = false; if (sel.meio.length >= 2) avancar('meio'); else decora(); }
      }
      else if (id === 'comp') { if (!vazio && !cont && sel.comps.length >= lim()) avancar('comp'); else decora(); }
      else if (id === 'prem') {
        if (vazio && !sel.prem.length) { D.nao.prem = true; avancar('prem'); }
        else { if (sel.prem.length) D.nao.prem = false; decora(); }
      }
      else if (id === 'cob') { D.cobOk = true; avancar('cob'); }
    }, 0);
  }
  function irPara(id) {
    const st = id === 'fim' ? E('addMontar') : stepEl(id);
    const topo = (document.querySelector('header.top') || { offsetHeight: 0 }).offsetHeight + 18;
    scrollTo({ top: st.getBoundingClientRect().top + scrollY - topo - (id === 'fim' ? innerHeight / 2 : 0), behavior: 'smooth' });
  }
  function avancar(id) {
    const k = ETAPAS.findIndex(e => e.id === id);
    const depois = ETAPAS.slice(k + 1).find(e => !feito(e.id)), antes = falta()[0];
    const prox = depois ? depois.id : antes ? antes.id : 'fim';
    D.at = prox === 'fim' ? id : prox; decora();
    setTimeout(() => {
      irPara(prox);
      if (prox === 'fim') { const a = E('addMontar'); a.classList.remove('pc-pulsa'); void a.offsetWidth; a.classList.add('pc-pulsa'); }
    }, 480);
  }

  // ---------- decora a tela depois de cada render do site ----------
  const _render = render;
  render = function () {
    _render();
    if (APP() || !E('o-tam')) return;
    prepara(); decora();
  };
  function badge(id, cls, tx) { const b = E('pcReq-' + id); if (b) { b.className = 'pc-req ' + cls; b.textContent = tx; } }
  function decora() {
    const L = lim(), nc = sel.comps.length, nm = sel.meio.length, np = sel.prem.length;
    // nada vem pré-marcado: tamanho e cobertura só aparecem escolhidos depois do toque
    if (!D.tamOk) E('o-tam').querySelectorAll('.opt.sel').forEach(b => b.classList.remove('sel'));
    if (!D.cobOk) E('o-cob').querySelectorAll('.opt.sel').forEach(b => b.classList.remove('sel'));
    // "Não quero" no recheio e nos extras
    const vm = E('o-meio').querySelector('.opt.vazio0');
    if (vm) { vm.classList.toggle('sel', D.nao.meio); vm.querySelector('b').textContent = 'Não quero recheio'; const s = vm.querySelector('span:not(.lmp)'); if (s) s.textContent = 'pular etapa'; vm.classList.add('pc-nao'); }
    const vp = E('o-prem').querySelector('.opt.vazio0');
    if (vp) { vp.classList.toggle('sel', D.nao.prem); vp.querySelector('b').textContent = 'Não quero extras'; const s = vp.querySelector('span:not(.lmp)'); if (s) s.textContent = 'pular etapa'; vp.classList.add('pc-nao'); }
    // complementos são obrigatórios: o cartão vazio vira aviso, não escolha
    const vc = E('o-fini').querySelector('.opt.vazio0');
    if (vc) { vc.classList.remove('sel'); vc.classList.add('pc-falta'); vc.querySelector('b').textContent = 'Nenhum ainda'; const s = vc.querySelector('span:not(.lmp)'); if (s) s.textContent = `escolha de 1 a ${L} · grátis`; }
    const lt = E('lim-txt'); if (lt) lt.textContent = `Grátis e obrigatório: escolha de 1 a ${L} (${nc}/${L}). Já escolheu tudo o que queria? Toque em Continuar.`;
    // selos de cada etapa
    // o selo mantém o texto e só fica verde quando a etapa foi escolhida
    ETAPAS.forEach(e => badge(e.id, feito(e.id) ? 'ok' : OBRIG[e.id] ? 'ob' : 'opc', OBRIG[e.id] ? 'OBRIGATÓRIO' : 'OPCIONAL'));
    // botões "continuar" quando já há escolha e ainda cabe mais
    const nx = (id, mostra, tx) => { const b = E('pcNx-' + id); if (b) { b.hidden = !mostra; b.textContent = tx; } };
    const prox = id => { const k = ETAPAS.findIndex(e => e.id === id); return ETAPAS[k + 1] ? `${k + 2}. ${ETAPAS[k + 1].nome}` : 'Finalizar'; };
    nx('meio', nm === 1, `Só esse recheio · Continuar para ${prox('meio')} →`);
    nx('comp', nc > 0 && nc < L, `Já escolhi tudo (${nc} de ${L}) · Continuar para ${prox('comp')} →`);
    nx('prem', np > 0, `Pronto com os extras · Continuar para ${prox('prem')} →`);
    // números das etapas, foco e painel de progresso
    let nf = 0;
    ETAPAS.forEach((e, k) => {
      const st = stepEl(e.id), f = feito(e.id); if (f) nf++;
      const n = st.querySelector('h3 .n'); if (n) { n.textContent = f ? '✓' : k + 1; n.classList.toggle('pc-ok', f); }
      st.classList.toggle('pc-foco', e.id === D.at);
      st.classList.toggle('pc-feito', f);
    });
    const fl = falta(), k = ETAPAS.findIndex(e => e.id === D.at);
    E('pcEtTx').innerHTML = !fl.length ? '<em>Tudo pronto!</em> Confira e adicione à sacola 💜' : `<em>Etapa ${k + 1} de 6</em> · ${ETAPAS[k].dica}`;
    E('pcProg').style.width = (nf / 6 * 100) + '%';
    E('pcChips').innerHTML = ETAPAS.map((e, i) => { const f = feito(e.id); return `<button type="button" data-s="${e.id}" class="${f ? 'ok' : ''} ${e.id === D.at ? 'at' : ''} ${!f && OBRIG[e.id] ? 'ob' : ''}"><i>${f ? '✓' : i + 1}</i>${e.nome}</button>`; }).join('');
    const a = E('addMontar'); a.classList.toggle('pc-off', fl.length > 0);
    a.textContent = fl.length ? `Falta: ${fl[0].nome}` : 'Adicionar à sacola';
  }

  // ---------- adicionar: só com as 6 etapas feitas ----------
  const ad = E('addMontar'), _add = ad.onclick;
  ad.onclick = function (ev) {
    if (APP()) return _add.call(this, ev);
    const fl = falta();
    if (fl.length) {
      D.at = fl[0].id; decora(); irPara(fl[0].id);
      const st = stepEl(fl[0].id); st.classList.remove('pc-erro'); void st.offsetWidth; st.classList.add('pc-erro');
      toast('Falta escolher: ' + fl.map(e => e.nome).join(', ') + ' 💜'); return;
    }
    _add.call(this, ev);
    sel.base = null; sel.meio = []; sel.comps = []; sel.prem = []; sel.cob = 'nenhuma'; qtd = 1; D = novo(); render();
  };

  // começa sem cobertura escolhida (o cliente escolhe na etapa 6)
  if (!APP()) { sel.cob = 'nenhuma'; render(); }
  window.PASSOS_PC = { feito, falta, estado: () => D };
})();
