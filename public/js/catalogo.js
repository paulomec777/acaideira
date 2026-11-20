// Catálogo da Açaideira: usado pelo site (navegador) e pelo servidor (validação de preço).
const TAMANHOS=[{id:'300',ap:'Mini',nome:'300 ml',preco:13,lim:3,h:.55},{id:'400',ap:'Clássico',nome:'400 ml',preco:17,lim:4,h:.66},{id:'500',ap:'Turbo',nome:'500 ml',preco:20,lim:5,h:.78},{id:'700',ap:'Monstro',nome:'700 ml',preco:27,lim:6,h:.95}];
const BASES=[{id:'morango',nome:'Açaí com Morango',ico:'🍓',preco:0},{id:'maracuja',nome:'Açaí com Maracujá',ico:'💛',preco:0},{id:'ninho',nome:'Açaí Trufado de Ninho',ico:'🥛',preco:0},{id:'avela',nome:'Açaí Trufado de Avelã',ico:'🌰',preco:0},{id:'trad',nome:'Açaí com Guaraná (Tradicional)',ico:'🟣',preco:0},{id:'cereja',nome:'Açaí com Cereja Silvestre',ico:'🍒',preco:0},{id:'zero',nome:'Açaí Zero Açúcar',ico:'💪',preco:0},{id:'abacaxi',nome:'Açaí com Abacaxi',ico:'🍍',preco:0},{id:'pacoca',nome:'Açaí com Paçoca',ico:'🥜',preco:0},{id:'coco',nome:'Açaí com Coco',ico:'🥥',preco:0},{id:'banana',nome:'Açaí com Banana',ico:'🍌',preco:0},{id:'cookies',nome:'Açaí com Creme de Cookies',ico:'🍪',preco:0},{id:'cupu',nome:'Cupuaçu',ico:'🤍',preco:0},{id:'acaicupu',nome:'Açaí com Cupuaçu (meio a meio)',ico:'💜',preco:0}];
const COMPS=[
 {id:'f_bananinha',grupo:'fini',nome:'Fini Bananinha',ico:'🍌'},{id:'f_dentadura',grupo:'fini',nome:'Fini Dentadura',ico:'🦷'},{id:'f_amora',grupo:'fini',nome:'Fini Amora',ico:'🫐'},{id:'f_beijinho',grupo:'fini',nome:'Fini Beijinho',ico:'💋'},{id:'f_minhoca',grupo:'fini',nome:'Fini Minhoquinha',ico:'🪱'},{id:'f_mix',grupo:'fini',nome:'Fini Sortida',ico:'🍓'},
 {id:'leite',nome:'Leite em pó',ico:'🥛'},{id:'gran',nome:'Granola',ico:'🌾'},{id:'flocos',nome:'Flocos de arroz',ico:'🍚'},{id:'amchoc',nome:'Amendoim c/ chocolate',ico:'🍫'},{id:'amendoim',nome:'Amendoim granulado',ico:'🥜'},{id:'pacoca',nome:'Paçoca',ico:'🥜'},{id:'choccroc',nome:'Chocolate crocante',ico:'🍫'},{id:'gotas',nome:'Gotas de chocolate',ico:'🍫'},{id:'biju',nome:'Biju',ico:'🍘'},{id:'jujuba',nome:'Jujuba',ico:'🍬'},{id:'marsh',nome:'Marshmallow',ico:'☁️'},{id:'confete',nome:'Confete',ico:'🍬'},{id:'gominha',nome:'Gominha',ico:'🍭'},{id:'cereja',nome:'Cereja em calda',ico:'🍒'},
 {id:'c_morango',grupo:'fruta',nome:'Morango',ico:'🍓'},{id:'c_banana',grupo:'fruta',nome:'Banana',ico:'🍌'},{id:'c_uva',grupo:'fruta',nome:'Uva',ico:'🍇'}];
// Fotos de fundo: coloque o arquivo em img/comp/<id>.jpg e preencha FOTOS_COMP[id]=true
const FOTOS_COMP={amchoc:1,amendoim:1,f_mix:1,cereja:1,choccroc:1,confete:1,f_amora:1,f_bananinha:1,f_beijinho:1,f_dentadura:1,f_minhoca:1,flocos:1,gominha:1,gotas:1,gran:1,jujuba:1,leite:1,marsh:1,biju:1,pacoca:1,c_morango:1,c_banana:1,c_uva:1};
const PREM=[{id:'ninho',nome:'Creme de Ninho',ico:'🥛',preco:3},{id:'avela',nome:'Creme de avelã / Nutella',ico:'🌰',preco:3},{id:'cookies',nome:'Creme de cookies',ico:'🍪',preco:3},{id:'coco',nome:'Creme de coco',ico:'🥥',preco:3},{id:'cramend',nome:'Creme de amendoim',ico:'🥜',preco:3},{id:'kinder',nome:'Creme Kinder Bueno',ico:'🍫',preco:3},{id:'maltine',nome:'Ovomaltine',ico:'🍫',preco:2},{id:'farinha',nome:'Farinha láctea',ico:'🥣',preco:2}];
const COBS=[{id:'nenhuma',nome:'Sem cobertura',ico:'—'},{id:'condensado',nome:'Leite condensado',ico:'🍯'},{id:'choc',nome:'Calda de chocolate',ico:'🍫'},{id:'morc',nome:'Calda de morango',ico:'🍓'},{id:'mel',nome:'Mel',ico:'🍯'}];
const PRONTOS=[
 {cat:'Açaídeiras Tradicionais',nome:'Açaídeiras Tradicional',desc:'Açaí batido com banana, leite em pó, granola, leite condensado e banana.',img:'m_trad2',tag:'Mais pedido',tam:[['300ml',13],['400ml',17],['500ml',20],['700ml',27]]},
 {cat:'Açaídeiras Tradicionais',nome:'Açaídeiras Casadinho',desc:'Açaí batido com banana, leite condensado, leite em pó, paçoca e cupuaçu.',img:'pacoca',tam:[['300ml',13],['400ml',17],['500ml',20]]},
 {cat:'Açaídeiras Tradicionais',nome:'Açaídeiras Tropical',desc:'Açaí batido com banana, leite em pó, leite condensado, uva, banana e morango.',img:'tropical',tam:[['300ml',13],['400ml',17],['500ml',20]]},
 {cat:'Açaídeiras Tradicionais',nome:'Santo à Moda',desc:'Açaí batido com banana, leite em pó, leite condensado, morango e farinha láctea.',img:'classica',tam:[['300ml',13],['400ml',17],['500ml',20]]},
 {cat:'Açaí Prêmio',nome:'Santo Trufado Avelã',desc:'Açaí batido com avelã, Nutella, leite em pó, morango e amendoim.',img:'amendoim',tam:[['300ml',15],['400ml',20],['500ml',25]]},
 {cat:'Açaí Prêmio',nome:'Santo Trufado Ninho',desc:'Açaí batido com Ninho, leite em pó, morango, paçoca e creme de Ninho.',img:'branca',tag:'Queridinho',tam:[['300ml',15],['400ml',20],['500ml',25]]},
 {cat:'Açaí Prêmio',nome:'Santo Maltine',desc:'Açaí batido com avelã, leite condensado, leite em pó, Ovomaltine, uva e paçoca.',img:'m_maltine',tam:[['300ml',15],['400ml',20],['500ml',25]]},
 {cat:'Açaí Prêmio',nome:'Santo Especial',desc:'Açaí batido com Ninho, leite em pó, Ovomaltine, creme de Ninho, morango e Nutella.',img:'fini',tag:'Do vídeo',tam:[['300ml',15],['400ml',20],['500ml',25]]},
 {cat:'Linha Zero & Kids',nome:'Santo Açaí Zero',desc:'Açaí zero, leite em pó, granola, mel, banana e uva.',img:'m_zero2',tam:[['300ml',15],['400ml',20],['500ml',25],['700ml',27]]},
 {cat:'Linha Zero & Kids',nome:'Santo Kids',desc:'Açaí batido com banana, leite em pó, leite condensado e M&M.',img:'m_kids',tag:'Kids',tam:[['200ml',9],['300ml',13]]}];
const MEIO=[{id:'nenhum',nome:'Não quero recheio',ico:'🚫',preco:0,sub:'Sem custo'},{id:'ninho',nome:'Creme de Ninho',ico:'🥛',preco:3,cor:'#f6efe0'},{id:'nutella',nome:'Nutella',ico:'🌰',preco:3,cor:'#5a3418'},{id:'cookies',nome:'Creme de cookies',ico:'🍪',preco:3,cor:'#d8c7b0'},{id:'morango',nome:'Morango picado',ico:'🍓',preco:3,cor:'#e8414f'},{id:'banana',nome:'Banana',ico:'🍌',preco:3,cor:'#f5dc7a'},{id:'condensado',nome:'Leite condensado',ico:'🍯',preco:2,cor:'#f5e6c8'},{id:'pacoca',nome:'Paçoca',ico:'🥜',preco:2,cor:'#d9a35b'},{id:'granola',nome:'Granola',ico:'🌾',preco:2,cor:'#b8874a'}];
// Qualquer acompanhamento pode ir no meio: extras pelo preço deles, complementos por PRECO_COMP_MEIO
const PRECO_COMP_MEIO=2;
[...['coco','cramend','kinder','maltine','farinha'].map(id=>PREM.find(x=>x.id===id)),{id:'uva',nome:'Uva',ico:'🍇',preco:3}].forEach(p=>{const id=p.id;MEIO.push({id,nome:p.nome,ico:p.ico,preco:p.preco,foto:`img/extra/${id}.jpg`,grupo:p.preco>=3?'creme':'croc'})});
COMPS.filter(c=>!['gran','pacoca'].includes(c.id)&&c.grupo!=='fruta').forEach(c=>MEIO.push({id:c.id,nome:c.nome,ico:c.ico,preco:PRECO_COMP_MEIO,foto:`img/comp/${c.id}.jpg`,grupo:c.grupo==='fini'?'fini':'croc'}));
MEIO.forEach(m=>{if(!m.grupo)m.grupo=['pacoca','granola'].includes(m.id)?'croc':'creme'});
const GRUPOS_MEIO={creme:'Cremes e frutas',fini:'Linha Fini',croc:'Crocantes e doces'};
{const ord=['creme','fini','croc'];MEIO.sort((a,b)=>ord.indexOf(a.grupo)-ord.indexOf(b.grupo))}

// Preço de um item da sacola, recalculado a partir do catálogo (nunca confiar no preço enviado pelo navegador)
function precoDoItem(ref){
  if(!ref||typeof ref!=='object')return null;
  if(ref.tipo==='pronto'){const p=PRONTOS[ref.i];const t=p&&p.tam[ref.t];return t?t[1]:null}
  if(ref.tipo==='montar'){
    const t=TAMANHOS.find(x=>x.id===ref.tam),b=BASES.find(x=>x.id===ref.base);if(!t||!b)return null;
    const meio=(ref.meio||[]).slice(0,2).map(id=>MEIO.find(m=>m.id===id));if(meio.some(m=>!m))return null;
    const comps=(ref.comps||[]);if(comps.length>t.lim||comps.some(id=>!COMPS.find(c=>c.id===id)))return null;
    const prem=(ref.prem||[]).map(id=>PREM.find(x=>x.id===id));if(prem.some(x=>!x))return null;
    if(ref.cob&&!COBS.find(c=>c.id===ref.cob))return null;
    return t.preco+(b.preco||0)+meio.reduce((s,m)=>s+m.preco,0)+prem.reduce((s,x)=>s+x.preco,0);
  }
  return null;
}
if(typeof module!=='undefined')module.exports={TAMANHOS,BASES,COMPS,PREM,COBS,PRONTOS,MEIO,precoDoItem};
