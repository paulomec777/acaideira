// Açaideira — Área da loja por papel.
// 'loja'    → Pedidos, Mensagens, Resumo, Como usar + Esgotados + abrir/fechar a loja.
// 'agencia' → tudo da loja + aba Agência: configurações, bairros e taxas, stories do site.
// As regras de segurança do banco garantem o mesmo: quem é 'loja' não consegue gravar o que é da agência.
(function () {
  const $id = id => document.getElementById(id);
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let SB = null;
  const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  window.PAINEL_PAPEL = function (eq, sb) {
    SB = sb;
    const papel = eq.papel === 'agencia' ? 'agencia' : 'loja';
    document.body.dataset.papel = papel;
    const nav = document.querySelector('.al-tabs'), box = document.querySelector('#v-painel .al');
    if (!nav || !box) return;
    if (!$id('tab-esgotados')) {
      nav.insertAdjacentHTML('beforeend', '<button data-t="esgotados">🚫 Esgotados</button>');
      box.insertAdjacentHTML('beforeend', '<div class="al-tab" id="tab-esgotados"></div>');
    }
    if (papel === 'agencia' && !$id('tab-agencia')) {
      nav.insertAdjacentHTML('beforeend', '<button data-t="agencia">🎯 Agência</button>');
      box.insertAdjacentHTML('beforeend', '<div class="al-tab" id="tab-agencia"></div>');
    }
    if (papel !== 'agencia') { nav.querySelector('[data-t=agencia]')?.remove(); $id('tab-agencia')?.remove(); }
    const kick = document.querySelector('#v-painel .al-kick');
    if (kick) kick.textContent = papel === 'agencia' ? 'ÁREA DA LOJA · ACESSO AGÊNCIA' : 'ÁREA DA LOJA';
    esgotados();
    if (papel === 'agencia') agencia();
  };

  // ---------- Esgotados (loja e agência) ----------
  function itensMontagem() {
    const vistos = new Set(), grupos = [['Sabores de açaí', BASES], ['Complementos', COMPS], ['Cremes e extras', PREM], ['Recheios do meio', MEIO.filter(m => m.id !== 'nenhum')]];
    return grupos.map(([g, l]) => [g, l.filter(i => !vistos.has(i.id) && vistos.add(i.id))]).filter(([, l]) => l.length);
  }
  async function esgotados() {
    const t = $id('tab-esgotados'); if (!t) return;
    const { data, error } = await SB.from('itens_esgotados').select('item_id');
    if (error) { t.innerHTML = `<div class="al-card"><p>Não foi possível carregar os esgotados: ${esc(error.message)}</p></div>`; return; }
    const on = new Set((data || []).map(d => d.item_id));
    t.innerHTML = `<div class="al-card pp-card"><div class="pp-h"><div><h4>Acabou algum ingrediente?</h4><p class="al-obs">Toque no item para marcar como esgotado. Ele some das escolhas do site na hora e o servidor recusa pedidos com ele. Toque de novo quando voltar.</p></div><button class="al-sec" id="pp-zera">Novo dia: liberar todos</button></div>
      ${itensMontagem().map(([g, l]) => `<h5 class="pp-g">${esc(g)}</h5><div class="pp-chips">${l.map(i => `<button class="pp-chip ${on.has(i.id) ? 'esg' : ''}" data-id="${esc(i.id)}" data-nome="${esc(i.nome)}">${on.has(i.id) ? '🚫 ' : ''}${esc(i.nome)}</button>`).join('')}</div>`).join('')}</div>`;
    t.querySelectorAll('.pp-chip').forEach(b => b.onclick = async () => {
      b.disabled = true;
      const id = b.dataset.id, marcar = !b.classList.contains('esg');
      const r = marcar ? await SB.from('itens_esgotados').upsert({ item_id: id, nome: b.dataset.nome }) : await SB.from('itens_esgotados').delete().eq('item_id', id);
      if (r.error) { toast('Não deu certo: ' + r.error.message); b.disabled = false; return; }
      toast(marcar ? `${b.dataset.nome} marcado como esgotado` : `${b.dataset.nome} voltou ao cardápio`);
      if (window.API_ONLINE) { const s = new Set(API_ONLINE.esgotados || []); marcar ? s.add(id) : s.delete(id); API_ONLINE.esgotados = [...s]; }
      esgotados();
    });
    $id('pp-zera').onclick = async () => {
      const r = await SB.from('itens_esgotados').delete().neq('item_id', '');
      if (r.error) { toast('Não deu certo: ' + r.error.message); return; }
      if (window.API_ONLINE) API_ONLINE.esgotados = [];
      toast('Todos os itens liberados'); esgotados();
    };
  }

  // ---------- Agência ----------
  async function agencia() {
    const t = $id('tab-agencia'); if (!t) return;
    if (window.AGENCIA) return window.AGENCIA(SB, t);
    t.innerHTML = `<div class="pp-intro"><span class="al-kick">SÓ A AGÊNCIA VÊ ESTA ABA</span><p>Configurações da loja, bairros e taxas de entrega e os stories do site. A loja não consegue alterar nada daqui.</p></div>
      <div class="al-card pp-card" id="pp-stories"></div><div class="al-card pp-card" id="pp-config"></div><div class="al-card pp-card" id="pp-bairros"></div>`;
    stories(); config(); bairros();
  }

  // stories do site
  async function stories() {
    const c = $id('pp-stories');
    const { data, error } = await SB.from('destaques').select('*').order('ordem').order('criado_em');
    if (error) { c.innerHTML = `<h4>Stories do site</h4><p class="al-obs">A tabela de stories ainda não existe no banco: ${esc(error.message)}</p>`; return; }
    const lista = data || [];
    c.innerHTML = `<div class="pp-h"><div><h4>Stories do site</h4><p class="al-obs">Aparecem em "Novidades", a primeira bolinha dos stories no celular. Foto até 10 MB (o site diminui antes de enviar) ou vídeo MP4 em pé até 50 MB.</p></div></div>
      <div class="pp-sts">${lista.map((d, k) => `<div class="pp-st ${d.ativo ? '' : 'off'}">${d.tipo === 'video' ? `<video src="${esc(d.midia_url)}" muted playsinline preload="metadata"></video>` : `<img src="${esc(d.midia_url)}" alt="">`}
        <div class="pp-sti"><b>${esc(d.titulo)}</b><small>${esc(d.texto || '')}</small><small>${d.inicio || d.fim ? `📅 ${d.inicio || '…'} até ${d.fim || '…'}` : 'Sem data de fim'}${d.botao_texto ? ` · botão "${esc(d.botao_texto)}"` : ''}</small></div>
        <div class="pp-sta"><button class="al-sec" data-a="sobe" data-k="${k}" ${k ? '' : 'disabled'} title="Subir">↑</button><button class="al-sec" data-a="ativo" data-k="${k}">${d.ativo ? 'Pausar' : 'Ativar'}</button><button class="al-sec" data-a="apaga" data-k="${k}">Apagar</button></div></div>`).join('') || '<p class="al-obs">Nenhum story ainda.</p>'}</div>
      <h5 class="pp-g">Novo story</h5>
      <div class="pp-form">
        <label>Foto ou vídeo<input type="file" id="ps-arq" accept="image/jpeg,image/png,image/webp,video/mp4"></label>
        <label>Título<input class="in" id="ps-tit" maxlength="60" placeholder="Ex.: Novo sabor: Pistache"></label>
        <label>Texto<input class="in" id="ps-txt" maxlength="160" placeholder="Uma linha sobre a novidade"></label>
        <label>Texto do botão<input class="in" id="ps-bt" maxlength="30" placeholder="Ex.: Quero provar"></label>
        <label>O botão leva para<select class="in" id="ps-lk"><option value="">Sem botão</option><option value="#montar">Monte o seu</option><option value="#ap-s-dest">Cardápio</option><option value="#ap-s-sab">Sabores</option><option value="url">Outro link (https://…)</option></select></label>
        <label id="ps-urlw" hidden>Link<input class="in" id="ps-url" maxlength="300" placeholder="https://…"></label>
        <label>Começa em<input class="in" id="ps-ini" type="date"></label>
        <label>Termina em<input class="in" id="ps-fim" type="date"></label>
      </div>
      <div class="al-merr" id="ps-err"></div><button class="al-big" id="ps-ok">Publicar story</button>`;
    c.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
      const d = lista[+b.dataset.k], a = b.dataset.a; let r;
      if (a === 'ativo') r = await SB.from('destaques').update({ ativo: !d.ativo }).eq('id', d.id);
      else if (a === 'apaga') { if (!confirm('Apagar este story?')) return; r = await SB.from('destaques').delete().eq('id', d.id); }
      else if (a === 'sobe') { const k = +b.dataset.k; await Promise.all(lista.map((x, i) => SB.from('destaques').update({ ordem: i === k ? k - 1 : i === k - 1 ? k : i }).eq('id', x.id))); }
      if (r && r.error) { toast('Não deu certo: ' + r.error.message); return; }
      stories();
    });
    $id('ps-lk').onchange = () => { $id('ps-urlw').hidden = $id('ps-lk').value !== 'url'; };
    $id('ps-ok').onclick = publicaStory;
  }
  async function reduzFoto(f) {
    const img = await createImageBitmap(f), max = 1440, k = Math.min(1, max / Math.max(img.width, img.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    return await new Promise(r => cv.toBlob(r, 'image/webp', .85));
  }
  async function publicaStory() {
    const err = $id('ps-err'), bt = $id('ps-ok'); err.textContent = '';
    const f = $id('ps-arq').files[0], tit = $id('ps-tit').value.trim(), lk = $id('ps-lk').value;
    const link = lk === 'url' ? $id('ps-url').value.trim() : lk, btx = $id('ps-bt').value.trim();
    if (!f) return err.textContent = 'Escolha a foto ou o vídeo.';
    if (!tit) return err.textContent = 'Dê um título ao story.';
    if (lk === 'url' && !/^https:\/\//.test(link)) return err.textContent = 'O link precisa começar com https://';
    if (link && !btx) return err.textContent = 'Escreva o texto do botão.';
    const video = f.type === 'video/mp4';
    if (!video && !/^image\//.test(f.type)) return err.textContent = 'Use foto (JPG, PNG, WEBP) ou vídeo MP4.';
    if (video && f.size > 50 * 1024 * 1024) return err.textContent = 'Vídeo acima de 50 MB. Exporte em 1080p e até 30 segundos.';
    if (!video && f.size > 10 * 1024 * 1024) return err.textContent = 'Foto acima de 10 MB.';
    bt.disabled = true; bt.textContent = 'Enviando…';
    try {
      const blob = video ? f : await reduzFoto(f), ext = video ? 'mp4' : 'webp';
      const path = `destaques/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await SB.storage.from('midia').upload(path, blob, { contentType: video ? 'video/mp4' : 'image/webp', upsert: false });
      if (up.error) throw up.error;
      const url = SB.storage.from('midia').getPublicUrl(path).data.publicUrl;
      const ins = await SB.from('destaques').insert({ titulo: tit, texto: $id('ps-txt').value.trim() || null, midia_url: url, tipo: video ? 'video' : 'foto', botao_texto: link ? btx : null, botao_link: link || null, inicio: $id('ps-ini').value || null, fim: $id('ps-fim').value || null, ordem: 999 });
      if (ins.error) throw ins.error;
      toast('Story publicado 💜'); stories();
    } catch (e) { err.textContent = 'Não deu certo: ' + (e.message || e); }
    bt.disabled = false; bt.textContent = 'Publicar story';
  }

  // configurações da loja
  async function config() {
    const c = $id('pp-config');
    const { data: cfg, error } = await SB.from('loja_config').select('*').eq('id', 1).single();
    if (error) { c.innerHTML = `<p>Erro: ${esc(error.message)}</p>`; return; }
    const h = cfg.horario || {};
    c.innerHTML = `<h4>Configurações da loja</h4>
      <div class="pp-form">
        <label>Tempo de entrega<input class="in" id="pc-te" value="${esc(cfg.tempo_entrega)}"></label>
        <label>Tempo de retirada<input class="in" id="pc-tr" value="${esc(cfg.tempo_retirada)}"></label>
        <label>Pedido mínimo (R$)<input class="in" id="pc-pm" type="number" min="0" step="0.5" value="${Number(cfg.pedido_minimo)}"></label>
        <label>WhatsApp (só números, com 55)<input class="in" id="pc-wa" value="${esc(cfg.whatsapp)}"></label>
        <label>Nome no Pix<input class="in" id="pc-pn" value="${esc(cfg.pix_nome)}"></label>
        <label>Cidade no Pix<input class="in" id="pc-pc" value="${esc(cfg.pix_cidade)}"></label>
      </div>
      <h5 class="pp-g">Horário de funcionamento</h5>
      <div class="pp-hor">${DIAS.map((d, i) => { const x = h[String(i)]; return `<div class="pp-dia"><b>${d}</b><label class="pp-ab"><input type="checkbox" data-d="${i}" class="pc-ab" ${x ? 'checked' : ''}> aberto</label><input class="in" type="time" id="pc-a${i}" value="${x ? x[0] : '14:00'}"><span>às</span><input class="in" type="time" id="pc-f${i}" value="${x ? x[1] : '22:00'}"></div>`; }).join('')}</div>
      <div class="al-merr" id="pc-err"></div><button class="al-big" id="pc-ok">Salvar configurações</button>`;
    $id('pc-ok').onclick = async () => {
      const wa = $id('pc-wa').value.replace(/\D/g, '');
      if (wa.length < 12) { $id('pc-err').textContent = 'WhatsApp com DDI e DDD, ex.: 5561982022436'; return; }
      const horario = {}; DIAS.forEach((_, i) => { horario[String(i)] = document.querySelector(`.pc-ab[data-d="${i}"]`).checked ? [$id('pc-a' + i).value, $id('pc-f' + i).value] : null; });
      const { error } = await SB.from('loja_config').update({ tempo_entrega: $id('pc-te').value.trim(), tempo_retirada: $id('pc-tr').value.trim(), pedido_minimo: Number($id('pc-pm').value) || 0, whatsapp: wa, pix_nome: $id('pc-pn').value.trim(), pix_cidade: $id('pc-pc').value.trim(), horario, atualizado_em: new Date().toISOString() }).eq('id', 1);
      if (error) { $id('pc-err').textContent = 'Não deu certo: ' + error.message; return; }
      $id('pc-err').textContent = ''; toast('Configurações salvas ✅');
    };
  }

  // bairros e taxas
  async function bairros() {
    const c = $id('pp-bairros');
    const { data, error } = await SB.from('bairros').select('*').order('ordem').order('id');
    if (error) { c.innerHTML = `<p>Erro: ${esc(error.message)}</p>`; return; }
    const linha = b => `<div class="pp-bai" data-id="${b.id || ''}"><input class="in pb-n" value="${esc(b.nome || '')}" placeholder="Nome do bairro"><input class="in pb-t" type="number" min="0" step="0.5" value="${Number(b.taxa || 0)}"><label class="pp-ab"><input type="checkbox" class="pb-a" ${b.ativo !== false ? 'checked' : ''}> ativo</label><button class="al-sec pb-x" title="Remover">✕</button></div>`;
    c.innerHTML = `<h4>Bairros e taxas de entrega</h4><p class="al-obs">Taxa 0 aparece como "a combinar". Desmarque "ativo" para esconder um bairro sem apagar.</p>
      <div class="pp-bh"><span>Bairro</span><span>Taxa (R$)</span><span></span><span></span></div><div id="pb-lista">${(data || []).map(linha).join('')}</div>
      <button class="al-sec" id="pb-add">+ Adicionar bairro</button><div class="al-merr" id="pb-err"></div><button class="al-big" id="pb-ok">Salvar bairros</button>`;
    const apagados = new Set();
    const liga = () => c.querySelectorAll('.pb-x').forEach(x => x.onclick = () => { const r = x.closest('.pp-bai'); if (r.dataset.id) apagados.add(+r.dataset.id); r.remove(); });
    liga();
    $id('pb-add').onclick = () => { $id('pb-lista').insertAdjacentHTML('beforeend', linha({ ativo: true })); liga(); };
    $id('pb-ok').onclick = async () => {
      const rows = [...c.querySelectorAll('.pp-bai')].map((r, i) => ({ id: r.dataset.id ? +r.dataset.id : undefined, nome: r.querySelector('.pb-n').value.trim(), taxa: Number(r.querySelector('.pb-t').value) || 0, ativo: r.querySelector('.pb-a').checked, ordem: i }));
      if (rows.some(r => !r.nome)) { $id('pb-err').textContent = 'Todo bairro precisa de nome.'; return; }
      for (const id of apagados) { const r = await SB.from('bairros').delete().eq('id', id); if (r.error) { $id('pb-err').textContent = r.error.message; return; } }
      const velhos = rows.filter(r => r.id), novos = rows.filter(r => !r.id).map(({ id, ...r }) => r);
      if (velhos.length) { const r = await SB.from('bairros').upsert(velhos); if (r.error) { $id('pb-err').textContent = r.error.message; return; } }
      if (novos.length) { const r = await SB.from('bairros').insert(novos); if (r.error) { $id('pb-err').textContent = r.error.message; return; } }
      toast('Bairros salvos ✅'); bairros();
    };
  }
})();
