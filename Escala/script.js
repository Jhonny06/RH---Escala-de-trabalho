(function(){
const KEY='escala-loja-v1';
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DOW=['D','S','T','Q','Q','S','S'];
const TIPOS={folga:{label:'F',nome:'Folga'},ferias:{label:'FÉ',nome:'Férias'},atestado:{label:'AT',nome:'Atestado'}};
const PGRUPOS=[
  {k:'v',titulo:'VENDEDORES',nome:'Vendedores',cargo:'Vendedor'},
  {k:'o',titulo:'OPERADORES',nome:'Operadores',cargo:'Operador'},
  {k:'c',titulo:'CAIXAS',nome:'Caixas',cargo:'Caixa'},
  {k:'e',titulo:'ESTOQUISTAS',nome:'Estoquistas',cargo:'Estoquista'},
  {k:'vm',titulo:'VM',nome:'VM',cargo:'VM'}
];
/* colunas da planilha completa da controladoria (usadas só para importar/colar do Excel) */
const PCOLS={v:['superv','extra','clockin','orcado'],o:['superv','extra','clockin','orcado'],c:['superv','clockin','orcado'],e:['superv','clockin','orcado'],vm:['clockin']};
const PLANILHA=PGRUPOS.flatMap(g=>PCOLS[g.k].map(c=>({g:g.k,c})));
/* colunas mostradas na tela de planejamento: o orçado de cada cargo */
const PCAMPOS=PGRUPOS.map(g=>({g:g.k,c:'orcado'}));
const uid=()=>Math.random().toString(36).slice(2,10);
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function defaults(){
  return {loja:'',gerente:'',employees:[],months:{},tmonths:{},tarefas:[
    {id:uid(),code:'L',nome:'Limpeza',cor:'#dcfce7'},
    {id:uid(),code:'O',nome:'Organização',cor:'#dbeafe'},
    {id:uid(),code:'R',nome:'Reposição',cor:'#fef3c7'},
    {id:uid(),code:'V',nome:'Vitrine',cor:'#fce7f3'}
  ],presets:[
    {id:uid(),code:'M',nome:'Manhã',ini:'08:00',fim:'16:20',intervalo:60,cor:'#dbeafe'},
    {id:uid(),code:'I',nome:'Intermediário',ini:'10:00',fim:'18:20',intervalo:60,cor:'#fef3c7'},
    {id:uid(),code:'T',nome:'Tarde',ini:'13:40',fim:'22:00',intervalo:60,cor:'#ede9fe'}
  ]};
}
/* ---------- Base de lojas (controladoria) ----------
   Ponto de partida até a controladoria editar/importar a dela na aba Lojas.
   cod|supervisor|local|tipo do local|estrutura|seg a sex|sáb|dom|filiais
   Horário F = fechado. Filial "cod:TIPO" quando o tipo de operação difere da estrutura. */
const BASE_PADRAO=`X|RICARDO|BARUERI|CD|E-COMMERCE|08:00-17:48|F|F|X:E-COM
01|DANIEL|COCAIA|RUA|MAGAZINE|09:00-21:00|09:00-21:00|09:00-17:00|0101
02|HENRIQUE|BOITUVA|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|11:00-21:00|0201
03|AMANDA|DIADEMA|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|11:00-21:00|0301
04|DANIEL|COCAIA|RUA|MAGAZINE|09:00-21:00|09:00-21:00|09:00-17:00|0401
05|TIAGO|ARARAQUARA|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|12:00-20:00|0501
06|DANIEL|VILA SÃO JOSÉ|RUA|MAGAZINE|09:00-21:00|09:00-21:00|09:00-17:00|0601
07|TIAGO|SÃO CARLOS|RUA|MAGAZINE|09:00-19:00|09:00-17:00|F|0701
08|TIAGO|RIBEIRÃO PRETO|SHOPPING|CALÇADOS|10:00-22:00|10:00-22:00|11:00-21:00|0801
09|TIAGO|RIBEIRÃO PRETO|RUA|MAGAZINE|09:00-19:00|09:00-17:00|F|0901
10|DANIEL|CIDADE DUTRA|RUA|MAGAZINE|08:30-21:00|08:30-21:00|09:00-17:00|1001
11|DANIEL|JD. COLONIAL|RUA|MAGAZINE|09:00-21:00|09:00-21:00|09:00-17:00|1101
12|TIAGO|RIBEIRÃO PRETO|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|11:00-21:00|1201
13|AMANDA|IPIRANGA|RUA|UP SPORTS|08:30-20:30|08:30-20:30|09:00-16:00|3902:MAGAZINE,3309
14|AMANDA|CUPECÊ|RUA|MAGAZINE|09:00-21:00|09:00-21:00|09:00-17:00|1401
15|TIAGO|RIBEIRÃO PRETO|SHOPPING|CALÇADOS|10:00-22:00|10:00-22:00|11:00-21:00|1501
16|TIAGO|MOGI MIRIM|RUA|MAGAZINE|08:30-18:00|08:30-16:00|F|1601
17|AMANDA|VILA JOANIZA|RUA|MAGAZINE|09:00-21:00|09:00-21:00|09:00-17:00|1701
18|HENRIQUE|CAMPINAS|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|11:00-20:00|1801
19|AMANDA|INTERLAGOS|SHOPPING|CALÇADOS|10:00-22:00|10:00-22:00|11:00-21:00|1901
20|DANIEL|GRAJAÚ|RUA|MAGAZINE|09:00-21:00|09:00-21:00|09:00-17:00|2001
21|HENRIQUE|ITAQUAQUECETUBA|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|11:00-21:00|2101
22|HENRIQUE|SOROCABA|RUA|MAGAZINE|08:30-18:30|08:30-16:00|F|2201
23|AMANDA|CAMPO LIMPO|SHOPPING|CALÇADOS|10:00-22:00|10:00-22:00|11:00-21:00|2301
24|DANIEL|PARQUE BRASIL|RUA|MAGAZINE|08:30-21:00|08:30-21:00|09:00-17:00|2401
25|TIAGO|LIMEIRA|SHOPPING|CALÇADOS|10:00-22:00|10:00-22:00|14:00-20:00|2501
26|AMANDA|CAPÃO REDONDO|RUA|MAGAZINE|08:30-20:30|08:30-20:30|09:00-16:00|2601
27|DANIEL|GRAJAÚ|RUA|MAGAZINE|09:00-21:00|09:00-21:00|09:00-17:00|2701
28|HENRIQUE|UNIÃO|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|11:00-21:00|2801
29|VIANA|GUARATINGUETA|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|11:00-21:00|2901
30|VIANA|SÃO JOSÉ DOS CAMPOS|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|10:00-20:00|3001
31|AMANDA|MOOCA|RUA|MAGAZINE|08:30-20:30|08:30-20:30|09:00-16:00|3101
32|TIAGO|ARARAQUARA|SHOPPING|CALÇADOS|10:00-22:00|10:00-22:00|12:00-20:00|3201
33|VIANA|GUARATINGUETA|SHOPPING|UP SPORTS|10:00-22:00|10:00-22:00|11:00-21:00|3301
34|TIAGO|LIMEIRA|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|14:00-20:00|3401
35|TIAGO|RIO CLARO|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|12:00-19:00|3501
36|HENRIQUE|INDAIATUBA|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|12:00-20:00|3601
37|VIANA|PINDAMONHANGABA|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|12:00-21:00|0602
38|TIAGO|MOGI GUAÇÚ|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|12:00-20:00|3801
39|DANIEL|GRAJAÚ|RUA|UP SPORTS|09:00-21:00|09:00-21:00|09:00-17:00|3901,3310
40|VIANA|TAUBATÉ|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|12:00-21:00|2002
41|AMANDA|RIBEIRÃO PIRES|RUA|MAGAZINE|09:00-21:00|09:00-21:00|09:00-17:00|2102
42|HENRIQUE|JUNDIAÍ|RUA|MAGAZINE|08:30-18:00|08:30-14:00|F|1002
43|HENRIQUE|SOROCABA|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|11:00-20:00|4301
44|AMANDA|SANTO ANDRÉ|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|11:00-21:00|4401
45|TIAGO|MOGI GUAÇÚ|SHOPPING|UP SPORTS|10:00-22:00|10:00-22:00|12:00-20:00|3302
46|VIANA|TAUBATÉ|SHOPPING|UP SPORTS|10:00-22:00|10:00-22:00|12:00-21:00|3303
47|HENRIQUE|ARICANDUVA|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|11:00-21:00|2402
48|TIAGO|ARARAQUARA|SHOPPING|UP SPORTS|10:00-22:00|10:00-22:00|10:00-22:00|3304
49|VIANA|RESENDE|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|10:00-22:00|2202
50|VIANA|SÃO JOSÉ DOS CAMPOS|SHOPPING|UP SPORTS|10:00-22:00|10:00-22:00|10:00-20:00|3305
51|VIANA|PINDAMONHANGABA|SHOPPING|UP SPORTS|10:00-22:00|10:00-22:00|12:00-21:00|3306
52|DANIEL|VILA NATAL|SHOPPING|MAGAZINE|09:00-21:00|09:00-21:00|09:00-17:00|1202
53|HENRIQUE|SOROCABA|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|11:00-20:00|0402
54|HENRIQUE|ITAQUAQUECETUBA|SHOPPING|UP SPORTS|10:00-22:00|10:00-22:00|11:00-21:00|3307
55|VIANA|LORENA|SHOPPING|MAGAZINE|10:00-22:00|10:00-22:00|11:00-21:00|9003
56|DANIEL|PARELHEIROS|RUA|MAGAZINE|09:00-21:00|09:00-21:00|09:00-17:00|9004
57|HENRIQUE|TATUAPÉ|SHOPPING|UP SPORTS|10:00-22:00|10:00-22:00|11:00-21:00|3311
58|VIANA|VOLTA REDONDA|RUA|MAGAZINE|08:30-20:30|08:30-20:30|09:00-16:00|5801
59|VIANA|VOLTA REDONDA|SHOPPING|UP SPORTS|10:00-22:00|10:00-22:00|11:00-21:00|3312
60|VIANA|RESENDE|SHOPPING|UP SPORTS|10:00-22:00|10:00-22:00|10:00-22:00|3313
90|JOÃO|BARUERI|CD|E-COMMERCE|08:00-17:48|F|F|9001:E-COM
91|JOÃO|BARUERI|CD|UP SPORTS|08:00-17:48|F|F|3308:CD UP`;
function basePadrao(){
  const h=s=>s==='F'?'FECHADO':s.replace('-',' - ');
  return BASE_PADRAO.split('\n').map(r=>{
    const [cod,sup,local,tipo,estrutura,seg,sab,dom,fil]=r.split('|');
    return {cod,nome:cod==='X'?'EST X':'LOJA '+cod,sup,local,geo:local,tipo,estrutura,seg:h(seg),sab:h(sab),dom:h(dom),
      filiais:fil?fil.split(',').map(f=>{const [c,t]=f.split(':');return t?{cod:c,tipo:t}:{cod:c};}):[]};
  });
}
function load(){
  try{const s=localStorage.getItem(KEY);if(s)return JSON.parse(s);}
  catch(e){$('#banner').classList.add('show');}
  return null;
}
/* ---------- Servidor e perfil ----------
   config.js     -> window.ESCALA_CFG = {api:'/api/escala'}
   config-dp.js  -> window.ESCALA_DP  = {token:'...', usuario:'...'}  (só na área do DP no portal)
   Sem token (ou com ?perfil=gerente) a página abre no modo do gerente: só visualiza e solicita alterações. */
const CFG=window.ESCALA_CFG||{},DP=window.ESCALA_DP||{};
const API=String(CFG.api||'/api/escala').replace(/\/$/,'');
const QS=new URLSearchParams(location.search);
let GER=QS.get('perfil')==='gerente',ONLINE=false;
function setModo(g){
  GER=g;
  document.documentElement.classList.toggle('modo-gerente',g);
  document.documentElement.classList.toggle('modo-dp',!g);
  ['#loja','#gerente'].forEach(s=>{const el=document.querySelector(s);if(el)el.readOnly=g;});
  if(g){const on=document.querySelector('nav.tabs button.on');if(on&&on.classList.contains('so-dp'))document.querySelector('nav.tabs button[data-tab="escala"]').click();}
}
setModo(GER);
let S=(GER?null:load())||defaults();
function migra(){const D=defaults();if(!Array.isArray(S.presets))S.presets=D.presets;if(!Array.isArray(S.employees))S.employees=[];if(!S.months||typeof S.months!=='object')S.months={};if(!S.planos||typeof S.planos!=='object')S.planos={};if(S.lojaNum==null)S.lojaNum='';if(!Array.isArray(S.tarefas))S.tarefas=defaults().tarefas;if(!S.tmonths||typeof S.tmonths!=='object')S.tmonths={};if(!Array.isArray(S.base)||!S.base.length)S.base=basePadrao();}
migra();
function save(){
  if(GER&&ONLINE){agendaSync();return;}   // gerente só grava as tarefas da loja (ver sincroniza)
  try{localStorage.setItem(KEY,JSON.stringify(S));}
  catch(e){if(!ONLINE)$('#banner').classList.add('show');}
  agendaSync();
}

const today=new Date();let Y=today.getFullYear(),M=today.getMonth();
let brush=S.presets[0]?{t:'turno',p:S.presets[0].id}:{t:'folga'};

/* ---------- Filtro por cargo ---------- */
let cargo='';
const normCargo=s=>String(s||'').trim().toLowerCase();
/* Cargos fixos (os mesmos do orçado) + cargos antigos fora da lista, se ainda existirem */
const CARGOS=PGRUPOS.map(g=>g.cargo);
function listaCargos(){
  const extra=[];
  S.employees.forEach(e=>{const c=String(e.funcao||'').trim();if(c&&!CARGOS.includes(c)&&!extra.some(x=>normCargo(x)===normCargo(c)))extra.push(c);});
  return [...CARGOS,...extra];
}
function normCargos(){S.employees.forEach(e=>{const g=PGRUPOS.find(g=>g.k===grupoDe(e.funcao));if(g)e.funcao=g.cargo;});}
const cargoSel=(v,attrs)=>`<select ${attrs}>${!v?'<option value="">Selecione…</option>':''}${CARGOS.map(c=>`<option${c===v?' selected':''}>${c}</option>`).join('')}${v&&!CARGOS.includes(v)?`<option selected value="${esc(v)}">${esc(v)} (fora da lista)</option>`:''}</select>`;
const visiveis=()=>S.employees.filter(e=>!cargo||normCargo(e.funcao)===cargo);
function renderCargos(){
  const cs=listaCargos();
  if(cargo&&!cs.some(c=>normCargo(c)===cargo))cargo='';
  $('#filtroCargo').innerHTML='<option value="">Todos</option>'+cs.map(c=>`<option value="${esc(normCargo(c))}"${normCargo(c)===cargo?' selected':''}>${esc(c)}</option>`).join('');
  $('#tFiltroCargo').innerHTML=$('#filtroCargo').innerHTML;
  const sel=$('#empFunc').value;
  $('#empFunc').innerHTML='<option value="">Cargo…</option>'+CARGOS.map(c=>`<option${c===sel?' selected':''}>${c}</option>`).join('');
}
const nomeCargo=()=>cargo?(listaCargos().find(c=>normCargo(c)===cargo)||cargo):'';
const alvoTxt=()=>cargo?` (somente o cargo "${nomeCargo()}")`:'';
$('#filtroCargo').addEventListener('change',e=>{cargo=e.target.value;render();});
$('#tFiltroCargo').addEventListener('change',e=>{cargo=e.target.value;render();});

const daysIn=(y,m)=>new Date(y,m+1,0).getDate();
const keyOf=(y,m)=>`${y}-${String(m+1).padStart(2,'0')}`;
function monthData(y=Y,m=M,create=true){
  const k=keyOf(y,m);
  if(!S.months[k]){if(!create)return null;S.months[k]={cells:{},feriados:[]};}
  return S.months[k];
}
const toMin=t=>{const [h,m]=(t||'0:0').split(':').map(Number);return h*60+m;};
function dur(ini,fim,int){let a=toMin(ini),b=toMin(fim);if(b<=a)b+=1440;return Math.max(0,b-a-(+int||0));}
const fmtH=m=>`${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}`;
const preset=id=>S.presets.find(p=>p.id===id);

/* ---------- Aprovação do supervisor ---------- */
const fmtData=iso=>new Date(iso).toLocaleDateString('pt-BR');
const aprovacao=()=>{const md=monthData(Y,M,false);return md&&md.aprov||null;};
const envio=()=>{const md=monthData(Y,M,false);return md&&md.envio||null;};
function podeEditar(){
  if(GER)return false;
  const a=aprovacao(),en=envio();if(!a&&!en)return true;
  const msg=a?`A escala de ${MESES[M]}/${Y} já foi aprovada por ${a.por}. Alterar vai remover a aprovação e ela terá que ser enviada de novo. Continuar?`
    :`A escala de ${MESES[M]}/${Y} já foi enviada para aprovação. Alterar cancela o envio e ela terá que ser enviada de novo. Continuar?`;
  if(!confirm(msg))return false;
  const md=monthData();delete md.aprov;delete md.envio;save();renderAprov();return true;
}
/* Só pode enviar quando, em todos os dias, cada cargo tiver pelo menos o orçado do dia trabalhando,
   toda a equipe estiver com o mês preenchido e não houver problema com as regras trabalhistas */
function pendencias(){
  if(!S.lojaNum)return ['Selecione o nº da loja no topo da página.'];
  const pl=comparaPlano();
  if(!pl)return [`Não há planejamento (orçado) da loja ${S.lojaNum} para ${MESES[M]}/${Y}. Importe o planejamento da controladoria.`];
  const n=daysIn(Y,M),md=monthData(Y,M,false),p=[];
  const au=auditaMes();if(au.erros)p.push(`Regras trabalhistas: ${au.erros} problema(s) na escala. Veja a lista abaixo da grade e corrija.`);
  const inc=S.employees.filter(e=>{const r=md&&md.cells[e.id]||{};for(let d=1;d<=n;d++)if(!r[d])return true;return false;});
  if(inc.length)p.push(`${inc.length} colaborador(es) com dias sem preencher: ${inc.slice(0,5).map(e=>e.nome).join(', ')}${inc.length>5?'…':''}.`);
  pl.linhas.forEach(l=>{
    if(!l.falta.length)return;
    p.push(`${l.g.nome}: abaixo do orçado em ${l.falta.length} dia(s) – ${l.falta.slice(0,8).map(d=>`${d} (${l.tr[d]}/${l.od[d]})`).join(', ')}${l.falta.length>8?'…':''}.`);
  });
  return p;
}
function renderAprov(){
  const a=aprovacao(),en=envio(),b=$('#aprov'),btn=$('#enviar'),sp=supLoja(S.lojaNum);
  b.className='aprov'+(a?' ok':en?'':' edit');
  b.textContent=a?`✓ Aprovada por ${a.por} em ${fmtData(a.em)}`
    :en?`⏳ Enviada em ${fmtData(en.em)} – aguardando aprovação do supervisor${sp?' '+sp:''}`
    :'✎ Em preenchimento';
  btn.hidden=!!(a||en);
  if(!btn.hidden){const p=pendencias();btn.classList.toggle('pend',p.length>0);btn.title=p.length?'Pendências:\n'+p.join('\n'):'Tudo preenchido conforme o orçado';}
}
$('#enviar').onclick=()=>{
  const p=pendencias();
  if(p.length){alert(`A escala ainda não pode ser enviada para aprovação. Preencha todos os orçados:\n\n• ${p.join('\n• ')}`);return;}
  if(!confirm(`Enviar a escala de ${MESES[M]}/${Y} para aprovação do supervisor?`))return;
  monthData().envio={em:new Date().toISOString()};save();render();
};

function cellInfo(c){
  if(!c)return{label:'',cls:'',style:'',min:0,title:'',work:false};
  if(c.t==='turno'){
    const p=preset(c.p);
    if(!p)return{label:'?',cls:'',style:'',min:0,title:'Horário removido',work:true};
    return{label:esc(p.code),cls:'',style:`background:${p.cor}`,min:dur(p.ini,p.fim,p.intervalo),title:`${p.nome}: ${p.ini}–${p.fim} (int. ${p.intervalo} min)`,work:true};
  }
  if(c.t==='custom'){
    return{label:`${c.ini}<br>${c.fim}`,cls:'custom',style:'background:#f0f9ff',min:dur(c.ini,c.fim,c.intervalo),title:`Personalizado: ${c.ini}–${c.fim} (int. ${c.intervalo} min)`,work:true};
  }
  const t=TIPOS[c.t];
  return{label:t.label,cls:c.t,style:'',min:0,title:t.nome,work:false};
}

/* ---------- Menus "Mais ações" ---------- */
document.addEventListener('click',ev=>{
  document.querySelectorAll('details.menu[open]').forEach(d=>{
    if(!d.contains(ev.target)||ev.target.closest('.menu-pop button'))d.open=false;
  });
});

/* ---------- Abas ---------- */
document.querySelectorAll('nav.tabs button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.toggle('on',x===b));
  ['escala','tarefas','equipe','horarios','planejamento','lojas','solic','backup'].forEach(t=>$('#tab-'+t).hidden=(t!==b.dataset.tab));
  render();
  if(b.dataset.tab==='solic')carregaSolicitacoes();
}));

/* ---------- Cabeçalho ---------- */
/* lojas com escala = as de número na base de lojas (a "EST X" fica só na base) */
let LOJAS=[],lojasSig='';
const baseLoja=n=>S.base.find(l=>l.cod===n)||null;
const descLoja=n=>{const b=baseLoja(n);return b?`${b.nome}${b.local?' – '+b.local:''}`:'';};
/* supervisor: o da base de lojas; o da planilha de planejamento só se a loja não tiver na base */
function supLoja(n){const b=baseLoja(n);if(b&&b.sup)return b.sup;const p=planoMes(),l=p&&p.lojas[n];return l&&l.sup||'';}
function atualizaLojas(){
  const ls=S.base.filter(l=>/^\d{2}$/.test(l.cod)).map(l=>l.cod).sort();
  const sig=ls.map(n=>n+descLoja(n)).join('|');if(sig===lojasSig)return;
  LOJAS=ls;lojasSig=sig;
  const ops=LOJAS.map(n=>`<option value="${n}">${esc(n+' – '+((baseLoja(n)||{}).local||''))}</option>`).join('');
  [['#lojaNum','<option value="">—</option>'],['#pLoja',''],['#solLoja','<option value="">Todas</option>']].forEach(([s,ini])=>{
    const el=$(s),v=el.value;el.innerHTML=ini+ops;el.value=v;
  });
}
atualizaLojas();
$('#lojaNum').addEventListener('change',e=>trocaLoja(e.target.value));
$('#loja').value=S.loja;$('#gerente').value=S.gerente;$('#lojaNum').value=S.lojaNum;
$('#loja').addEventListener('input',e=>{S.loja=e.target.value;save();});
$('#gerente').addEventListener('input',e=>{S.gerente=e.target.value;save();});

/* ---------- Pincéis ---------- */
function renderBrushes(){
  let h='';
  S.presets.forEach(p=>{
    const on=brush.t==='turno'&&brush.p===p.id;
    h+=`<button class="brush${on?' on':''}" data-t="turno" data-p="${p.id}"><span class="sw" style="background:${p.cor}">${esc(p.code)}</span>${esc(p.nome)} <small>${p.ini}–${p.fim}</small></button>`;
  });
  [['folga','F','Folga','var(--off)'],['ferias','FÉ','Férias','var(--fer)'],['atestado','AT','Atestado','var(--ate)'],['custom','✎','Personalizado','#f0f9ff'],['apagar','⌫','Apagar','#fff']].forEach(([t,l,n,c])=>{
    h+=`<button class="brush${brush.t===t?' on':''}" data-t="${t}"><span class="sw" style="background:${c}">${l}</span>${n}</button>`;
  });
  $('#brushes').innerHTML=h;
  $('#customBox').classList.toggle('show',brush.t==='custom');
}
$('#brushes').addEventListener('click',e=>{
  const b=e.target.closest('.brush');if(!b)return;
  brush={t:b.dataset.t,p:b.dataset.p};renderBrushes();
});

/* ---------- Grade ---------- */
/* pessoas da escala do mês (equipe + extras), respeitando o filtro de cargo; usada na Escala e nas Tarefas */
function pessoasEscala(){
  const md=monthData(Y,M,false);
  const ex=(md&&md.extras||[]).filter(x=>!cargo||normCargo(x.funcao)===cargo).map(x=>({...x,extra:true}));
  return [...visiveis(),...ex];
}
const temPessoas=()=>S.employees.length||(monthData(Y,M,false)?.extras||[]).length;
function renderGrid(){
  $('#mlabel').textContent=`${MESES[M]} ${Y}`;
  const n=daysIn(Y,M),md=monthData();
  if(!temPessoas()){
    $('#grid').innerHTML='<div class="empty">Nenhum colaborador carregado. A lista de colaboradores virá do Clock-in (Carol).</div>';
    renderPrint();return;
  }
  const lista=pessoasEscala();
  if(!lista.length){
    $('#grid').innerHTML=`<div class="empty">Nenhum colaborador com o cargo selecionado.</div>`;
    renderPrint();return;
  }
  const dayCls=d=>{const w=new Date(Y,M,d).getDay();return (w===0?'sun':'')+(md.feriados.includes(d)?' hol':'');};
  let h='<table class="grid"><thead><tr><th class="name">Colaborador</th>';
  for(let d=1;d<=n;d++){const w=new Date(Y,M,d).getDay();h+=`<th class="day ${dayCls(d)}" data-d="${d}" title="Clique para marcar/desmarcar feriado"><span>${d}</span><small>${DOW[w]}</small></th>`;}
  h+='<th class="tot">Horas</th><th class="tot">Folgas</th><th class="sig print-only">Assinatura</th></tr></thead><tbody>';
  const work=new Array(n+1).fill(0);
  const au=auditaMes();
  lista.forEach(e=>{
    const row=md.cells[e.id]||{};let tot=0,off=0;
    const nAl=au.lin.filter(l=>l.tipo==='e'&&l.nome===e.nome).length;
    if(e.extra){
      h+=`<tr class="extra"><td class="name" title="Justificativa: ${esc(e.just)}"><b>${esc(e.nome)}<span class="xbadge">EXTRA</span></b><small>${esc(e.funcao)}</small><small class="just">${esc(e.just)}</small>
        <span class="xact no-print"><button data-xed="${e.id}">Editar</button><button class="danger" data-xdel="${e.id}">Remover</button></span></td>`;
    }else h+=`<tr><td class="name"><b>${esc(e.nome)}${nAl?`<span class="alr no-print" title="${nAl} problema(s) com regras trabalhistas">⚠${nAl}</span>`:''}</b><small>${esc(e.funcao)}</small></td>`;
    for(let d=1;d<=n;d++){
      const i=cellInfo(row[d]);tot+=i.min;if(i.work)work[d]++;if(row[d]&&row[d].t==='folga')off++;
      const bg=i.style||'';
      const a=au.cel[e.id+'|'+d],tt=a?i.title+(i.title?'\n':'')+a.msgs.map(m=>'⚠ '+m).join('\n'):i.title;
      h+=`<td class="cell ${i.cls} ${i.style?'':dayCls(d)}${a?(a.tipo==='e'?' viol':' avis'):''}" style="${bg}" data-e="${e.id}" data-d="${d}" title="${esc(tt)}">${i.label}</td>`;
    }
    h+=`<td class="tot">${fmtH(tot)}</td><td class="tot">${off}</td><td class="sig print-only"></td></tr>`;
  });
  const pl=comparaPlano(),gF=cargo?grupoDe(nomeCargo()):null,ls=pl?pl.linhas.filter(l=>!cargo||l.g.k===gF):[];
  const orcD=d=>ls.reduce((s,l)=>s+l.od[d],0);
  const at=pl?atualizadoTxt(pl.p):'';
  h+=`</tbody><tfoot><tr><td class="name">${pl?`Total Orçado<small>em serviço / orçado do dia</small>${at?`<small class="atual">${at}</small>`:''}`:'Em serviço'}</td>`;
  for(let d=1;d<=n;d++){
    if(!pl){h+=`<td class="${work[d]===0?'low':''}">${work[d]}</td>`;continue;}
    const o=orcD(d),st=work[d]<o?'abaixo':work[d]>o?'acima':'igual';
    h+=`<td class="orcq ${st}" title="${work[d]} em serviço / ${o} orçado${st==='abaixo'?' – faltam '+(o-work[d]):st==='acima'?' – '+(work[d]-o)+' acima':''}">${work[d]}/${o}</td>`;
  }
  h+='<td></td><td></td><td class="print-only"></td></tr></tfoot></table>';
  $('#grid').innerHTML=h;
  renderAlertas(au);
  renderPrint();renderAprov();
}

/* ---------- Regras trabalhistas (CLT / comércio) ---------- */
const REGRA={maxConsec:6,domSemanas:3,interjornada:11*60,jornadaMax:10*60,semanaMax:44*60};
const ehTrab=c=>!!c&&(c.t==='turno'||c.t==='custom');
function turnoDe(c){
  if(!ehTrab(c))return null;
  const p=c.t==='turno'?preset(c.p):c;if(!p)return null;
  let a=toMin(p.ini),b=toMin(p.fim);if(b<=a)b+=1440;
  return {ini:a,fim:b,int:+p.intervalo||0,trab:Math.max(0,b-a-(+p.intervalo||0))};
}
/* célula de qualquer dia relativo ao mês aberto (d<1 = mês anterior, d>n = próximo) */
function celAt(eid,d,over){
  if(over&&over.d===d)return over.v;
  const dt=new Date(Y,M,d),md=S.months[keyOf(dt.getFullYear(),dt.getMonth())];
  return md&&md.cells[eid]&&md.cells[eid][dt.getDate()]||null;
}
const dm=d=>{const dt=new Date(Y,M,d);return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`;};
/* regras que olham só para o dia (e os vizinhos): servem para bloquear o preenchimento */
function errosDia(eid,d,over){
  const c=celAt(eid,d,over),t=turnoDe(c),e=[];if(!t)return e;
  if(t.trab>REGRA.jornadaMax)e.push(`Jornada de ${fmtH(t.trab)} passa do máximo de 10h por dia (CLT art. 59).`);
  if(t.trab>6*60&&t.int<60)e.push(`Jornada acima de 6h exige intervalo de no mínimo 1h (CLT art. 71).`);
  else if(t.trab>4*60&&t.trab<=6*60&&t.int<15)e.push(`Jornada de 4h a 6h exige intervalo de no mínimo 15 min (CLT art. 71).`);
  const ant=turnoDe(celAt(eid,d-1,over));
  if(ant){const desc=1440+t.ini-ant.fim;if(desc<REGRA.interjornada)e.push(`Só ${fmtH(Math.max(0,desc))} de descanso desde o turno de ${dm(d-1)}; o mínimo é 11h (CLT art. 66).`);}
  let tras=0;for(let k=d-1;ehTrab(celAt(eid,k,over));k--)tras++;
  let frente=0;for(let k=d+1;ehTrab(celAt(eid,k,over));k++)frente++;
  if(tras+1+frente>REGRA.maxConsec)e.push(`Ficaria ${tras+1+frente} dias seguidos trabalhando; o máximo é ${REGRA.maxConsec} e o 7º dia precisa ser folga (CLT art. 67; OJ 410 TST).`);
  return e;
}
/* ao preencher: confere o próprio dia e o dia seguinte (interjornada) */
function checaPreenchimento(eid,d,v){
  const over={d,v},e=errosDia(eid,d,over);
  const prox=turnoDe(celAt(eid,d+1,over)),t=turnoDe(v);
  if(t&&prox){const desc=1440+prox.ini-t.fim;if(desc<REGRA.interjornada)e.push(`Só ${fmtH(Math.max(0,desc))} de descanso até o turno de ${dm(d+1)}; o mínimo é 11h (CLT art. 66).`);}
  return [...new Set(e)];
}
/* auditoria do mês inteiro: erros (bloqueiam o envio) e avisos */
function auditaMes(){
  const n=daysIn(Y,M),md=monthData(Y,M,false),cel={},lin=[];
  if(!md)return {cel,lin,erros:0,avisos:0};
  const pessoas=[...S.employees,...(md.extras||[])];
  const marca=(eid,d,tipo,msg)=>{const k=eid+'|'+d,o=cel[k]=cel[k]||{tipo:'w',msgs:[]};if(tipo==='e')o.tipo='e';o.msgs.push(msg);};
  pessoas.forEach(p=>{
    if(!md.cells[p.id])return;
    const add=(tipo,d,msg)=>{lin.push({nome:p.nome,tipo,d,msg});if(d)marca(p.id,d,tipo,msg);};
    let seq=0;for(let k=0;ehTrab(celAt(p.id,k));k--)seq++;
    for(let d=1;d<=n;d++){
      errosDia(p.id,d).filter(m=>!m.startsWith('Ficaria')).forEach(m=>add('e',d,m));
      seq=ehTrab(celAt(p.id,d))?seq+1:0;
      if(seq===REGRA.maxConsec+1)add('e',d,`${seq} dias seguidos trabalhando; o 7º dia precisa ser folga (CLT art. 67; OJ 410 TST).`);
      else if(seq>REGRA.maxConsec+1)marca(p.id,d,'e',`${seq}º dia seguido de trabalho.`);
      if(ehTrab(celAt(p.id,d))&&abreDia(d)===false)add('w',d,`Turno num dia em que a loja não abre (${['domingo','segunda','terça','quarta','quinta','sexta','sábado'][new Date(Y,M,d).getDay()]} fechado na base de lojas).`);
    }
    // domingos: janela de N domingos seguidos sem folga (inclui os domingos anteriores do mês passado)
    const doms=[];let d0=1;while(new Date(Y,M,d0).getDay()!==0)d0++;
    for(let d=d0-7*(REGRA.domSemanas-1);d<=n;d+=7)doms.push(d);
    for(let i=0;i+REGRA.domSemanas<=doms.length;i++){
      const jan=doms.slice(i,i+REGRA.domSemanas),fim=jan[jan.length-1];
      if(fim<1)continue;
      if(jan.every(d=>ehTrab(celAt(p.id,d))))add('e',fim,`Trabalha ${REGRA.domSemanas} domingos seguidos (${jan.map(dm).join(', ')}); a folga deve cair num domingo pelo menos 1 vez a cada 3 semanas (Lei 10.101/2000, art. 6º).`);
    }
    // semanas de segunda a domingo que tocam o mês
    let seg=1;while(new Date(Y,M,seg).getDay()!==1)seg--;
    for(;seg<=n;seg+=7){
      let tot=0;for(let d=seg;d<seg+7;d++){const t=turnoDe(celAt(p.id,d));if(t)tot+=t.trab;}
      if(tot>REGRA.semanaMax)add('w',null,`Semana de ${dm(seg)} a ${dm(seg+6)}: ${fmtH(tot)} trabalhadas, acima de 44h (CF art. 7º, XIII). Verifique compensação/horas extras.`);
    }
  });
  return {cel,lin,erros:lin.filter(l=>l.tipo==='e').length,avisos:lin.filter(l=>l.tipo==='w').length};
}
let alertAberto=false;
function renderAlertas(au){
  const el=$('#alertas');
  const vis=au.lin;
  if(!vis.length){el.innerHTML='';return;}
  const er=vis.filter(l=>l.tipo==='e'),av=vis.filter(l=>l.tipo==='w');
  const tit=[er.length?`⛔ ${er.length} problema(s) com as regras trabalhistas – a escala não pode ser enviada`:'',av.length?`⚠ ${av.length} alerta(s)`:''].filter(Boolean).join(' · ');
  el.innerHTML=`<details class="alertas${er.length?'':' so-avis'}"><summary>${tit} <span class="small">(clique para ver)</span></summary><ul>`+
    vis.map(l=>`<li class="${l.tipo}"><b>${esc(l.nome)}</b>${l.d?' – dia '+dm(l.d):''}: ${esc(l.msg)}</li>`).join('')+'</ul></details>';
  const dt=el.querySelector('details');dt.open=alertAberto;dt.addEventListener('toggle',()=>{alertAberto=dt.open;});
}
let bloqueios=[];
let toastT=null;
function toast(msg,ok){const t=$('#toast');t.textContent=msg;t.classList.toggle('ok',!!ok);t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),7000);}
$('#toast').addEventListener('click',()=>$('#toast').classList.remove('show'));

let painting=false,dirty=false;
function paint(td){
  const e=td.dataset.e,d=+td.dataset.d,md=monthData();
  md.cells[e]=md.cells[e]||{};
  let v=null;
  if(brush.t==='turno')v={t:'turno',p:brush.p};
  else if(brush.t==='custom')v={t:'custom',ini:$('#cIni').value||'09:00',fim:$('#cFim').value||'18:00',intervalo:+$('#cInt').value||0};
  else if(brush.t!=='apagar')v={t:brush.t};
  if(ehTrab(v)){
    const er=checaPreenchimento(e,d,v);
    if(er.length){const p=S.employees.find(x=>x.id===e)||(md.extras||[]).find(x=>x.id===e);bloqueios.push(`${p?p.nome:''} – dia ${dm(d)}: ${er[0]}`);return;}
  }
  if(v)md.cells[e][d]=v;else delete md.cells[e][d];
  dirty=true;
  const i=cellInfo(v);
  td.className='cell '+i.cls;td.style.cssText=i.style;td.innerHTML=i.label;td.title=i.title;
}
const grid=$('#grid');
grid.addEventListener('pointerdown',ev=>{
  if(GER){const td=ev.target.closest('td.cell');if(td)abreSolicitacao(td.dataset.e,+td.dataset.d);return;}
  if(ev.target.closest('.xact'))return;
  const td=ev.target.closest('td.cell');
  if(td){ev.preventDefault();if(!podeEditar())return;painting=true;paint(td);return;}
  const th=ev.target.closest('th.day');
  if(th){if(!podeEditar())return;const d=+th.dataset.d,md=monthData();const i=md.feriados.indexOf(d);i>=0?md.feriados.splice(i,1):md.feriados.push(d);save();renderGrid();}
});
grid.addEventListener('pointerover',ev=>{
  if(!painting)return;const td=ev.target.closest('td.cell');if(td)paint(td);
});
document.addEventListener('pointerup',()=>{
  if(!painting)return;painting=false;
  if(dirty){dirty=false;save();renderGrid();}
  if(bloqueios.length){const b=[...new Set(bloqueios)];bloqueios=[];toast(`Preenchimento bloqueado pelas regras trabalhistas:\n• ${b.slice(0,4).join('\n• ')}${b.length>4?`\n… e mais ${b.length-4}`:''}`);}
});

/* ---------- Extras (cobertura de ausência) ---------- */
let extraEd=null;
function abreExtra(x){
  extraEd=x?x.id:null;
  $('#extraTit').textContent=x?'Editar extra':`Adicionar extra – ${MESES[M]}/${Y}`;
  $('#exNome').value=x?x.nome:'';
  $('#exCargo').innerHTML='<option value="">Selecione…</option>'+CARGOS.map(c=>`<option${x&&x.funcao===c?' selected':''}>${c}</option>`).join('');
  if(!x&&cargo)$('#exCargo').value=nomeCargo();
  $('#exJust').value=x?x.just:'';
  const d=$('#extraDlg');if(d.showModal)d.showModal();else d.setAttribute('open','');
  $('#exNome').focus();
}
const fechaExtra=()=>{const d=$('#extraDlg');if(d.close)d.close();else d.removeAttribute('open');};
$('#addExtra').onclick=()=>{if(podeEditar())abreExtra(null);};
$('#exCancel').onclick=fechaExtra;
$('#extraForm').addEventListener('submit',ev=>{
  ev.preventDefault();
  const nome=$('#exNome').value.trim(),funcao=$('#exCargo').value,just=$('#exJust').value.trim();
  if(!nome||!funcao||!just){alert('Preencha nome, cargo e justificativa.');return;}
  const md=monthData();md.extras=md.extras||[];
  if(extraEd){const x=md.extras.find(x=>x.id===extraEd);Object.assign(x,{nome,funcao,just});delete x.subst;}
  else md.extras.push({id:'x'+uid(),nome,funcao,just});
  fechaExtra();save();render();
});
grid.addEventListener('click',ev=>{
  const b=ev.target.closest('button[data-xed],button[data-xdel]');if(!b)return;
  const md=monthData(),id=b.dataset.xed||b.dataset.xdel,x=(md.extras||[]).find(x=>x.id===id);if(!x||!podeEditar())return;
  if(b.dataset.xed){abreExtra(x);return;}
  if(!confirm(`Remover o extra ${x.nome} da escala de ${MESES[M]}/${Y}?`))return;
  md.extras=md.extras.filter(y=>y.id!==id);delete md.cells[id];
  const td=tmonthData(false);if(td)delete td.cells[id];
  save();render();
});

/* ---------- Ações ---------- */
const mudaMes=d=>{M+=d;if(M<0){M=11;Y--;}if(M>11){M=0;Y++;}render();};
$('#prev').onclick=$('#tprev').onclick=()=>mudaMes(-1);
$('#next').onclick=$('#tnext').onclick=()=>mudaMes(1);
$('#print').onclick=()=>window.print();
$('#clear').onclick=()=>{
  if(!confirm(`Apagar a escala de ${MESES[M]}/${Y}${alvoTxt()}?`)||!podeEditar())return;
  const md=monthData();
  if(cargo)visiveis().forEach(e=>delete md.cells[e.id]);
  else S.months[keyOf(Y,M)]={cells:{},feriados:[]};
  save();render();
};
$('#rep1').onclick=()=>{
  if(!confirm(`Copiar os dias 1 a 7 para o restante do mês${alvoTxt()}? Os dias 8 em diante serão substituídos.`)||!podeEditar())return;
  const md=monthData(),n=daysIn(Y,M);
  visiveis().forEach(e=>{
    const r=md.cells[e.id]=md.cells[e.id]||{};
    for(let d=8;d<=n;d++){const s=((d-1)%7)+1;if(r[s])r[d]={...r[s]};else delete r[d];}
  });
  save();render();
};
$('#repPrev').onclick=()=>{
  const py=M===0?Y-1:Y,pm=M===0?11:M-1,prev=monthData(py,pm,false);
  if(!prev){alert('Não há escala salva para o mês anterior.');return;}
  if(!confirm(`Repetir a última semana do mês anterior em todo este mês (pelo dia da semana)${alvoTxt()}? A escala atual será substituída.`)||!podeEditar())return;
  const pn=daysIn(py,pm),md=monthData(),n=daysIn(Y,M);
  visiveis().forEach(e=>{
    const src=prev.cells[e.id]||{},byDow={};
    for(let d=pn-6;d<=pn;d++)byDow[new Date(py,pm,d).getDay()]=src[d];
    const r=md.cells[e.id]={};
    for(let d=1;d<=n;d++){const c=byDow[new Date(Y,M,d).getDay()];if(c)r[d]={...c};}
  });
  save();render();
};

/* ---------- Impressão ---------- */
const nomeLoja=()=>S.loja||descLoja(S.lojaNum);
function renderPrint(){
  const md=monthData();
  $('#printHead').innerHTML=`<img src="logo.jpg" alt="" class="plogo"><div><h2>Escala de Trabalho – ${MESES[M]}/${Y}</h2><div>${nomeLoja()?'<b>Loja:</b> '+esc(nomeLoja())+' &nbsp; ':''}${S.gerente?'<b>Gerente:</b> '+esc(S.gerente)+' &nbsp; ':''}${cargo?'<b>Cargo:</b> '+esc(nomeCargo()):''}</div>`+
    (()=>{const a=aprovacao(),en=envio();return `<div class="st${a?' ok':''}">${a?'Aprovada pelo supervisor '+esc(a.por)+' em '+fmtData(a.em):en?'Enviada em '+fmtData(en.em)+' – aguardando aprovação do supervisor':'Em preenchimento – não enviada para aprovação'}</div></div>`;})();
  let lg=S.presets.map(p=>`<span><b>${esc(p.code)}</b> = ${esc(p.nome)} ${p.ini}–${p.fim} (int. ${p.intervalo} min)</span>`).join('');
  lg+='<span><b>F</b> = Folga</span><span><b>FÉ</b> = Férias</span><span><b>AT</b> = Atestado</span>';
  const fer=[...md.feriados].sort((a,b)=>a-b);
  if(fer.length)lg+=`<span><b>Feriados:</b> ${fer.join(', ')}</span>`;
  if(funcTxt())lg+=`<span>${esc(funcTxt())}</span>`;
  const xs=(md.extras||[]).map(x=>`<div><b>${esc(x.nome)}</b> (${esc(x.funcao)}) – <i>${esc(x.just)}</i></div>`).join('');
  $('#printFoot').innerHTML=`<div class="legend">${lg}</div>${xs?`<div class="extras-print"><b>Extras do mês e justificativas:</b>${xs}</div>`:''}<div class="signs"><div>Gerente</div><div>Supervisor</div><div>Data</div></div>`;
}

/* ---------- Equipe ---------- */
$('#empForm').addEventListener('submit',ev=>{
  ev.preventDefault();
  const nome=$('#empNome').value.trim();if(!nome)return;
  const funcao=$('#empFunc').value;if(!funcao){alert('Escolha o cargo.');return;}
  S.employees.push({id:uid(),nome,funcao});
  $('#empNome').value='';$('#empNome').focus();
  save();render();
});
function renderEmp(){
  if(!S.employees.length){$('#empList').innerHTML='<p class="small">Nenhum colaborador ainda.</p>';return;}
  let h='<table class="list"><thead><tr><th>Nome</th><th>Cargo</th><th style="width:150px"></th></tr></thead><tbody>';
  S.employees.forEach((e,i)=>{
    h+=`<tr><td><input type="text" data-i="${i}" data-f="nome" value="${esc(e.nome)}"></td><td>${cargoSel(e.funcao,`data-i="${i}" data-f="funcao"`)}</td>
    <td class="row" style="flex-wrap:nowrap"><button data-up="${i}" title="Subir">↑</button><button data-down="${i}" title="Descer">↓</button><button class="danger" data-del="${i}">Remover</button></td></tr>`;
  });
  $('#empList').innerHTML=h+'</tbody></table>';
}
$('#empList').addEventListener('input',ev=>{
  const t=ev.target;if(t.dataset.f&&t.tagName!=='SELECT'){S.employees[+t.dataset.i][t.dataset.f]=t.value;save();}
});
$('#empList').addEventListener('change',ev=>{
  const t=ev.target;if(t.tagName==='SELECT'&&t.dataset.f){S.employees[+t.dataset.i][t.dataset.f]=t.value;save();render();}
});
$('#empList').addEventListener('click',ev=>{
  const b=ev.target.closest('button');if(!b)return;const E=S.employees;
  if(b.dataset.up){const i=+b.dataset.up;if(i>0)[E[i-1],E[i]]=[E[i],E[i-1]];}
  else if(b.dataset.down){const i=+b.dataset.down;if(i<E.length-1)[E[i+1],E[i]]=[E[i],E[i+1]];}
  else if(b.dataset.del){const i=+b.dataset.del;if(!confirm(`Remover ${E[i].nome}? A escala dessa pessoa também será apagada.`))return;
    const id=E[i].id;E.splice(i,1);Object.values(S.months).forEach(m=>delete m.cells[id]);Object.values(S.tmonths).forEach(m=>delete m.cells[id]);}
  save();render();
});

/* ---------- Horários ---------- */
function renderPresets(){
  let h='<table class="list"><thead><tr><th style="width:70px">Código</th><th>Descrição</th><th>Entrada</th><th>Saída</th><th>Intervalo (min)</th><th>Cor</th><th>Horas</th><th></th></tr></thead><tbody>';
  S.presets.forEach((p,i)=>{
    h+=`<tr><td><input type="text" maxlength="3" data-i="${i}" data-f="code" value="${esc(p.code)}" style="width:56px"></td>
    <td><input type="text" data-i="${i}" data-f="nome" value="${esc(p.nome)}"></td>
    <td><input type="time" data-i="${i}" data-f="ini" value="${p.ini}"></td>
    <td><input type="time" data-i="${i}" data-f="fim" value="${p.fim}"></td>
    <td><input type="number" min="0" step="5" data-i="${i}" data-f="intervalo" value="${p.intervalo}"></td>
    <td><input type="color" data-i="${i}" data-f="cor" value="${p.cor}"></td>
    <td class="small" id="dur${i}">${fmtH(dur(p.ini,p.fim,p.intervalo))}</td>
    <td><button class="danger" data-del="${i}">Remover</button></td></tr>`;
  });
  $('#presetList').innerHTML=h+'</tbody></table><p class="small" style="overflow-x:auto"></p>';
}
$('#presetList').addEventListener('input',ev=>{
  const t=ev.target;if(!t.dataset.f)return;const i=+t.dataset.i,p=S.presets[i];
  p[t.dataset.f]=t.dataset.f==='intervalo'?(+t.value||0):t.value;
  $('#dur'+i).textContent=fmtH(dur(p.ini,p.fim,p.intervalo));save();
});
$('#presetList').addEventListener('click',ev=>{
  const b=ev.target.closest('button[data-del]');if(!b)return;const i=+b.dataset.del;
  if(!confirm(`Remover o horário "${S.presets[i].nome}"? Células que usam esse horário ficarão marcadas com "?".`))return;
  S.presets.splice(i,1);save();render();
});
$('#addPreset').onclick=()=>{S.presets.push({id:uid(),code:'N',nome:'Novo turno',ini:'09:00',fim:'17:20',intervalo:60,cor:'#dcfce7'});save();render();};

/* ---------- Backup ---------- */
$('#exp').onclick=()=>{
  const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  const nome=(S.loja||'loja').replace(/[^\w-]+/g,'_');
  a.download=`escala_${nome}_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
$('#impBtn').onclick=()=>$('#imp').click();
$('#imp').addEventListener('change',ev=>{
  const f=ev.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{
    try{const d=JSON.parse(r.result);if(!d||!Array.isArray(d.employees)||!Array.isArray(d.presets)||typeof d.months!=='object')throw 0;
      if(!confirm('Substituir os dados atuais pelos do backup?'))return;
      S=d;migra();normCargos();save();$('#lojaNum').value=S.lojaNum;$('#loja').value=S.loja||'';$('#gerente').value=S.gerente||'';
      brush=S.presets[0]?{t:'turno',p:S.presets[0].id}:{t:'folga'};render();alert('Backup importado.');
    }catch(e){alert('Arquivo inválido: não é um backup desta ferramenta.');}
    ev.target.value='';
  };
  r.readAsText(f);
});
$('#wipe').onclick=()=>{
  if(!confirm('Apagar TODOS os dados (equipe, horários e escalas) deste navegador?'))return;
  S=defaults();migra();save();$('#lojaNum').value='';$('#loja').value='';$('#gerente').value='';brush={t:'turno',p:S.presets[0].id};render();
};

/* ---------- Tarefas administrativas ---------- */
const tarefa=id=>S.tarefas.find(t=>t.id===id);
let tbrush=S.tarefas[0]?S.tarefas[0].id:'apagar';
function tmonthData(create=true){
  const k=keyOf(Y,M);
  if(!S.tmonths[k]){if(!create)return null;S.tmonths[k]={cells:{}};}
  return S.tmonths[k];
}
function ausente(eid,d){
  const md=monthData(Y,M,false),c=md&&md.cells[eid]&&md.cells[eid][d];
  return c&&TIPOS[c.t]?TIPOS[c.t].nome:'';
}
const tkBg=ids=>{
  const c=(ids||[]).map(tarefa).filter(Boolean).map(t=>t.cor);
  if(c.length<2)return c.length?`background:${c[0]}`:'';
  const p=100/c.length;
  return `background:linear-gradient(to bottom,${c.map((x,i)=>`${x} ${i*p}% ${(i+1)*p}%`).join(',')})`;
};
const tkHtml=ids=>(ids||[]).map(id=>{const t=tarefa(id);return t?esc(t.code):'';}).filter(Boolean).join('<br>');
const tkTitle=ids=>(ids||[]).map(id=>{const t=tarefa(id);return t?t.nome:'';}).filter(Boolean).join(', ');
function renderTBrushes(){
  if(tbrush!=='apagar'&&!tarefa(tbrush))tbrush=S.tarefas[0]?S.tarefas[0].id:'apagar';
  let h=S.tarefas.map(t=>`<button class="brush${tbrush===t.id?' on':''}" data-id="${t.id}"><span class="sw" style="background:${t.cor}">${esc(t.code)}</span>${esc(t.nome)}</button>`).join('');
  h+=`<button class="brush${tbrush==='apagar'?' on':''}" data-id="apagar"><span class="sw" style="background:#fff">⌫</span>Apagar</button>`;
  $('#tbrushes').innerHTML=h;
}
$('#tbrushes').addEventListener('click',e=>{const b=e.target.closest('.brush');if(!b)return;tbrush=b.dataset.id;renderTBrushes();});
function renderTGrid(){
  $('#tmlabel').textContent=`${MESES[M]} ${Y}`;
  const n=daysIn(Y,M),td=tmonthData(false),mdE=monthData(Y,M,false),fer=mdE?mdE.feriados:[];
  if(!temPessoas()){$('#tgrid').innerHTML='<div class="empty">Nenhum colaborador carregado. A lista de colaboradores virá do Clock-in (Carol).</div>';renderTPrint();return;}
  const lista=pessoasEscala();
  if(!lista.length){$('#tgrid').innerHTML='<div class="empty">Nenhum colaborador com o cargo selecionado.</div>';renderTPrint();return;}
  const dayCls=d=>{const w=new Date(Y,M,d).getDay();return (w===0?'sun':'')+(fer.includes(d)?' hol':'');};
  let h='<table class="grid"><thead><tr><th class="name">Colaborador</th>';
  for(let d=1;d<=n;d++){const w=new Date(Y,M,d).getDay();h+=`<th class="day ${dayCls(d)}" style="cursor:default"><span>${d}</span><small>${DOW[w]}</small></th>`;}
  h+='<th class="tot">Tarefas</th><th class="sig print-only">Assinatura</th></tr></thead><tbody>';
  lista.forEach(e=>{
    const row=td&&td.cells[e.id]||{};let tot=0;
    h+=`<tr${e.extra?' class="extra"':''}><td class="name"${e.extra?` title="Justificativa: ${esc(e.just)}"`:''}><b>${esc(e.nome)}${e.extra?'<span class="xbadge">EXTRA</span>':''}</b><small>${esc(e.funcao)}</small></td>`;
    for(let d=1;d<=n;d++){
      const ids=row[d]||[],aus=ausente(e.id,d);tot+=ids.length;
      const tt=[tkTitle(ids),aus?'('+aus+')':''].filter(Boolean).join(' ');
      h+=`<td class="cell tcell ${aus?'off':dayCls(d)}" style="${tkBg(ids)}" data-e="${e.id}" data-d="${d}" title="${esc(tt)}">${tkHtml(ids)}</td>`;
    }
    h+=`<td class="tot">${tot}</td><td class="sig print-only"></td></tr>`;
  });
  $('#tgrid').innerHTML=h+'</tbody></table>';
  renderTPrint();
}
let tpainting=false,tdirty=false;
function tpaint(cell){
  const e=cell.dataset.e,d=+cell.dataset.d,td=tmonthData();
  const row=td.cells[e]=td.cells[e]||{},cur=row[d]||[];
  const ids=tbrush==='apagar'?[]:cur.includes(tbrush)?cur:[...cur,tbrush];
  if(ids.length)row[d]=ids;else delete row[d];
  tdirty=true;cell.style.cssText=tkBg(ids);cell.innerHTML=tkHtml(ids);
}
const tgrid=$('#tgrid');
tgrid.addEventListener('pointerdown',ev=>{
  const cell=ev.target.closest('td.tcell');if(!cell)return;ev.preventDefault();
  tpainting=true;tpaint(cell);
});
tgrid.addEventListener('pointerover',ev=>{if(!tpainting)return;const cell=ev.target.closest('td.tcell');if(cell)tpaint(cell);});
document.addEventListener('pointerup',()=>{if(tpainting){tpainting=false;if(tdirty){tdirty=false;save();renderTGrid();}}});
$('#tprint').onclick=()=>window.print();
$('#tclear').onclick=()=>{
  if(!confirm(`Apagar as tarefas de ${MESES[M]}/${Y}${alvoTxt()}?`))return;
  const td=tmonthData();
  if(cargo)pessoasEscala().forEach(e=>delete td.cells[e.id]);else td.cells={};
  save();render();
};
$('#trep1').onclick=()=>{
  if(!confirm(`Copiar as tarefas dos dias 1 a 7 para o restante do mês${alvoTxt()}? Os dias 8 em diante serão substituídos.`))return;
  const td=tmonthData(),n=daysIn(Y,M);
  pessoasEscala().forEach(e=>{
    const r=td.cells[e.id]=td.cells[e.id]||{};
    for(let d=8;d<=n;d++){const s=((d-1)%7)+1;if(r[s])r[d]=[...r[s]];else delete r[d];}
  });
  save();render();
};
function renderTPrint(){
  $('#tprintHead').innerHTML=`<img src="logo.jpg" alt="" class="plogo"><div><h2>Escala de Tarefas Administrativas – ${MESES[M]}/${Y}</h2><div>${nomeLoja()?'<b>Loja:</b> '+esc(nomeLoja())+' &nbsp; ':''}${S.gerente?'<b>Gerente:</b> '+esc(S.gerente)+' &nbsp; ':''}${cargo?'<b>Cargo:</b> '+esc(nomeCargo()):''}</div></div>`;
  const lg=S.tarefas.map(t=>`<span><span class="tk" style="background:${t.cor}">${esc(t.code)}</span> = ${esc(t.nome)}</span>`).join('')+'<span>Células listradas = folga, férias ou atestado</span>';
  $('#tprintFoot').innerHTML=`<div class="legend">${lg}</div><div class="signs"><div>Gerente</div><div>Data</div></div>`;
}
function renderTasks(){
  let h='<table class="list"><thead><tr><th style="width:70px">Código</th><th>Descrição</th><th>Cor</th><th></th></tr></thead><tbody>';
  S.tarefas.forEach((t,i)=>{
    h+=`<tr><td><input type="text" maxlength="3" data-i="${i}" data-f="code" value="${esc(t.code)}" style="width:56px"></td>
    <td><input type="text" data-i="${i}" data-f="nome" value="${esc(t.nome)}"></td>
    <td><input type="color" data-i="${i}" data-f="cor" value="${t.cor}"></td>
    <td><button class="danger" data-del="${i}">Remover</button></td></tr>`;
  });
  $('#taskList').innerHTML=h+'</tbody></table>';
}
$('#taskList').addEventListener('input',ev=>{const t=ev.target;if(!t.dataset.f)return;S.tarefas[+t.dataset.i][t.dataset.f]=t.value;save();renderTBrushes();renderTGrid();});
$('#taskList').addEventListener('click',ev=>{
  const b=ev.target.closest('button[data-del]');if(!b)return;const i=+b.dataset.del,id=S.tarefas[i].id;
  if(!confirm(`Remover a tarefa "${S.tarefas[i].nome}"? Ela também sai de todas as escalas de tarefas.`))return;
  S.tarefas.splice(i,1);
  Object.values(S.tmonths).forEach(m=>Object.values(m.cells).forEach(r=>Object.keys(r).forEach(d=>{r[d]=r[d].filter(x=>x!==id);if(!r[d].length)delete r[d];})));
  save();render();
});
$('#addTask').onclick=()=>{S.tarefas.push({id:uid(),code:'N',nome:'Nova tarefa',cor:'#e0f2fe'});save();render();};

/* ---------- Planejamento (controladoria) ---------- */
function planoMes(create=false){
  const k=keyOf(Y,M);
  if(!S.planos[k]){if(!create)return null;S.planos[k]={lojas:{}};}
  return S.planos[k];
}
function planoLoja(){const p=planoMes();return p&&S.lojaNum?p.lojas[S.lojaNum]||null:null;}
function grupoDe(c){
  const n=normCargo(c).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(n.startsWith('vend'))return 'v';if(n.startsWith('oper'))return 'o';if(n.startsWith('caix'))return 'c';
  if(n.startsWith('estoq'))return 'e';if(n==='vm'||n.startsWith('visual'))return 'vm';return '';
}
/* orçado de um cargo num dia: valor do dia, senão o orçado do mês (planilha mensal da controladoria) */
function orcDia(l,g,d){
  const x=l&&l[g];if(!x)return null;
  if(x.dias&&x.dias[d]!=null)return +x.dias[d];
  return x.orcado!=null&&x.orcado!==''?+x.orcado:null;
}
/* compara o orçado de cada dia com quem está trabalhando (equipe + extras) */
function comparaPlano(){
  const p=planoLoja();if(!p)return null;
  const n=daysIn(Y,M),md=monthData(Y,M,false);
  const pessoas=[...S.employees,...(md&&md.extras||[])];
  const cont={};S.employees.forEach(e=>{const g=grupoDe(e.funcao);cont[g]=(cont[g]||0)+1;});
  const linhas=PGRUPOS.map(g=>{
    const od=[],tr=[],falta=[];let max=0;
    for(let d=1;d<=n;d++){
      od[d]=orcDia(p,g.k,d)||0;max=Math.max(max,od[d]);
      tr[d]=pessoas.filter(e=>grupoDe(e.funcao)===g.k&&ehTrab(md&&md.cells[e.id]&&md.cells[e.id][d])).length;
      if(tr[d]<od[d])falta.push(d);
    }
    const qt=cont[g.k]||0;
    return {g,od,tr,falta,orc:max,qt,dif:qt-max,clock:+(p[g.k]||{}).clockin||0};
  });
  return {p,linhas,fora:cont['']||0};
}
const difTxt=d=>d===0?'conforme o orçado':d>0?`${d} acima do orçado`:`faltam ${-d}`;
function renderPlanEquipe(){
  const el=$('#planEquipe');
  if(!S.lojaNum){el.innerHTML='<div class="pinfo">Selecione o <b>nº da loja</b> no topo da página para comparar a equipe com o planejamento da controladoria.</div>';return;}
  const r=comparaPlano();
  if(!r){el.innerHTML=`<div class="pinfo">Ainda não há planejamento da loja <b>${S.lojaNum}</b> para <b>${MESES[M]}/${Y}</b>. Importe o arquivo da controladoria na aba <b>Planejamento</b>.</div>`;return;}
  const sp=supLoja(S.lojaNum);
  let h=`<p class="small" style="margin-top:0">Planejamento de ${MESES[M]}/${Y} – loja ${S.lojaNum}${sp?' – supervisor '+esc(sp):''}</p>
  <table class="pcomp"><thead><tr><th>Cargo</th><th>Orçado</th><th>Clockin</th><th>Cadastrados</th><th>Situação</th></tr></thead><tbody>`;
  r.linhas.forEach(l=>{
    h+=`<tr><td>${l.g.nome}</td><td>${l.orc==null?'—':l.orc}</td><td>${l.clock}</td><td>${l.qt}</td>
    <td class="${l.dif==null?'':l.dif===0?'ok':'warn'}">${l.dif==null?'sem orçado':(l.dif===0?'✓ ':'⚠ ')+difTxt(l.dif)}</td></tr>`;
  });
  h+='</tbody></table>';
  if(r.linhas.some(l=>l.dif<0))h+='<p style="margin:0 0 12px"><button id="exemplo">Criar colaboradores de exemplo para completar o orçado</button></p>';
  if(r.fora)h+=`<div class="pinfo">⚠ ${r.fora} colaborador(es) com cargo fora do planejamento. Use um destes cargos para entrar na conta: ${PGRUPOS.map(g=>g.cargo).join(', ')}.</div>`;
  el.innerHTML=h;
}
const NOMES=['Ana Souza','Bruno Lima','Carla Mendes','Diego Rocha','Elaine Castro','Felipe Araújo','Gabriela Nunes','Hugo Pereira','Isabela Martins','João Ribeiro','Karina Alves','Lucas Ferreira','Mariana Costa','Nathan Gomes','Olívia Barros','Paulo Teixeira','Quésia Duarte','Rafael Moreira','Sabrina Lopes','Thiago Cardoso','Úrsula Pinto','Vinícius Ramos','Wesley Correia','Yasmin Freitas','Bianca Carvalho','César Monteiro','Daniela Vieira','Eduardo Santos','Fernanda Rezende','Gustavo Azevedo','Helena Prado','Igor Batista','Juliana Farias','Leonardo Melo','Marcela Cunha','Otávio Nogueira','Priscila Dias','Renato Fonseca','Tatiane Machado','Vitor Andrade'];
$('#planEquipe').addEventListener('click',ev=>{
  if(!ev.target.closest('#exemplo'))return;
  const r=comparaPlano();if(!r)return;
  const falta=r.linhas.filter(l=>l.dif<0).map(l=>({g:l.g,q:-l.dif}));
  if(!confirm(`Criar colaboradores de exemplo para completar o orçado da loja ${S.lojaNum}?\n\n${falta.map(f=>`${f.q} ${f.g.nome}`).join('\n')}\n\nDepois é só trocar os nomes pelos reais na lista da equipe.`))return;
  const usados=new Set(S.employees.map(e=>e.nome));let i=0;
  const prox=()=>{while(i<NOMES.length&&usados.has(NOMES[i]))i++;const nm=i<NOMES.length?NOMES[i++]:`Colaborador ${S.employees.length+1}`;usados.add(nm);return nm;};
  falta.forEach(f=>{for(let k=0;k<f.q;k++)S.employees.push({id:uid(),nome:prox(),funcao:f.g.cargo});});
  save();render();
});
let pLoja=S.lojaNum||'01';
$('#pLoja').addEventListener('change',e=>{pLoja=e.target.value;renderPlan();});
function renderPlan(){
  $('#pmlabel').textContent=`${MESES[M]} ${Y}`;
  $('#pLoja').value=pLoja;
  const p=planoMes(),l=p&&p.lojas[pLoja]||{},n=daysIn(Y,M);
  $('#pSup').textContent=supLoja(pLoja)||'—';
  const hol=d=>new Date(Y,M,d).getDay()===0?'sun':'';
  let h='<table class="grid pdias"><thead><tr><th class="name">Cargo</th>';
  for(let d=1;d<=n;d++)h+=`<th class="day ${hol(d)}"><span>${d}</span><small>${DOW[new Date(Y,M,d).getDay()]}</small></th>`;
  h+='</tr></thead><tbody>';
  PGRUPOS.forEach((g,ri)=>{
    const x=l[g.k]||{};
    h+=`<tr><td class="name"><b>${g.nome}</b><small>orçado</small></td>`;
    for(let d=1;d<=n;d++){
      const v=orcDia(l,g.k,d),base=!(x.dias&&x.dias[d]!=null)&&v!=null;
      h+=`<td class="pc ${hol(d)}${base?' base':''}"${base?' title="Orçado do mês (planilha mensal)"':''}><input type="number" min="0" inputmode="numeric" data-r="${ri}" data-d="${d}" value="${v==null?'':v}"></td>`;
    }
    h+='</tr>';
  });
  h+='</tbody><tfoot></tfoot></table>';
  $('#pgrid').innerHTML=h;
  renderPlanTot();
}
function renderPlanTot(){
  const p=planoMes(),l=p&&p.lojas[pLoja]||{},n=daysIn(Y,M);
  const at=atualizadoTxt(l);
  let h=`<tr><td class="name">Total Orçado${at?`<small class="atual">${at}</small>`:''}</td>`;
  for(let d=1;d<=n;d++)h+=`<td>${PGRUPOS.reduce((s,g)=>s+(orcDia(l,g.k,d)||0),0)}</td>`;
  $('#pgrid tfoot').innerHTML=h+'</tr>';
}
/* data/hora da última alteração do planejamento de cada loja (mostrada no "Total Orçado") */
function marcaPlano(l){l.atualizadoEm=new Date().toISOString();}
function atualizadoTxt(l){
  const d=l&&l.atualizadoEm?new Date(l.atualizadoEm):null;if(!d||isNaN(d))return '';
  return `Planejamento atualizado em ${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`;
}
/* grava o orçado de um cargo num dia (vazio = volta para o orçado do mês, se houver) */
function setDia(loja,g,d,val){
  const p=planoMes(true),l=p.lojas[loja]=p.lojas[loja]||{},x=l[g]=l[g]||{};marcaPlano(l);
  const v=String(val??'').trim();x.dias=x.dias||{};
  if(v===''||isNaN(+v))delete x.dias[d];else x.dias[d]=Math.max(0,Math.round(+v));
}
/* usada nas importações: f = 'sup' ou {g,c} */
function setPlanCel(ri,f,val){
  const n=LOJAS[ri];if(!n||!f)return;
  const p=planoMes(true),l=p.lojas[n]=p.lojas[n]||{};marcaPlano(l);
  if(f==='sup'){l.sup=String(val||'').trim().toUpperCase();return;}
  const v=String(val??'').trim(),g=l[f.g]=l[f.g]||{};
  if(v===''||isNaN(+v))delete g[f.c];else g[f.c]=Math.max(0,Math.round(+v));
}
const pgrid=$('#pgrid');
const atualizaPlano=()=>{save();renderPlanTot();renderPlanEquipe();renderGrid();};
pgrid.addEventListener('change',ev=>{
  const t=ev.target;if(t.dataset.d==null)return;
  const g=PGRUPOS[+t.dataset.r].k,d=+t.dataset.d;
  setDia(pLoja,g,d,t.value);
  const x=planoMes().lojas[pLoja][g],v=orcDia(planoMes().lojas[pLoja],g,d);
  t.value=v==null?'':v;t.parentElement.classList.toggle('base',x.dias[d]==null&&v!=null);
  atualizaPlano();
});
pgrid.addEventListener('keydown',ev=>{
  const t=ev.target;if(t.dataset.d==null)return;
  const mv={Enter:[1,0],ArrowDown:[1,0],ArrowUp:[-1,0],ArrowRight:[0,1],ArrowLeft:[0,-1]}[ev.key];if(!mv)return;
  const nx=pgrid.querySelector(`input[data-r="${+t.dataset.r+mv[0]}"][data-d="${+t.dataset.d+mv[1]}"]`);
  if(nx){ev.preventDefault();nx.focus();nx.select();}
});
pgrid.addEventListener('focusin',ev=>{if(ev.target.dataset.d!=null)ev.target.select();});
pgrid.addEventListener('paste',ev=>{
  const t=ev.target;if(t.dataset.d==null)return;
  const txt=(ev.clipboardData||window.clipboardData).getData('text');
  if(!/[\t\n]/.test(txt.trim()))return;
  ev.preventDefault();
  const rows=txt.replace(/\r/g,'').split('\n').filter(r=>r.trim()!=='').map(r=>r.split('\t'));
  const n=daysIn(Y,M),r0=+t.dataset.r,d0=+t.dataset.d;
  rows.forEach((r,i)=>{const g=PGRUPOS[r0+i];if(!g)return;r.forEach((v,c)=>{if(d0+c<=n)setDia(pLoja,g.k,d0+c,v);});});
  save();render();
});
/* Formatos aceitos (a partir da coluna LOJA):
   - por dia (o exportado por esta ferramenta): LOJA, SUPERVISOR, CARGO, 1, 2, ... 31;
   - completo mensal, igual à planilha da controladoria: LOJA, SUPERVISOR, Superv/Extra/Clockin/Orçado de cada cargo;
   - simples mensal: LOJA, Vendedores, Operadores, Caixas, Estoquistas, VM (orçado).
   O orçado mensal vale para todos os dias do mês. */
const up=c=>String(c??'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const grupoTit=c=>{const u=up(c);return PGRUPOS.find(g=>u.startsWith(up(g.titulo).slice(0,4))||u.startsWith(up(g.cargo).slice(0,4))||u===up(g.titulo));};
function aplicaLinhas(rows){
  let off=0,mapa=null,dia=null;
  const hi=rows.findIndex(r=>r.some(c=>up(c)==='LOJA'));
  if(hi>=0){
    const hd=rows[hi];off=hd.findIndex(c=>up(c)==='LOJA');
    const iCargo=hd.findIndex(c=>up(c)==='CARGO');
    if(iCargo>=0){
      dia={cargo:iCargo,sup:hd.findIndex(c=>up(c)==='SUPERVISOR'),dias:{}};
      hd.forEach((c,i)=>{const s=String(c).trim();if(/^\d{1,2}$/.test(s)&&+s>=1&&+s<=31)dia.dias[i]=+s;});
    }else if(!hd.some(c=>['CLOCKIN','SUPERV','EXTRA'].includes(up(c)))){
      mapa={};hd.forEach((c,i)=>{const u=up(c);
        if(u.startsWith('SUPERVISOR'))mapa[i]='sup';
        else{const g=grupoTit(c);if(g)mapa[i]={g:g.k,c:'orcado'};}
      });
      if(!Object.keys(mapa).length)mapa=null;
    }
  }
  const lojas=new Set(),n=daysIn(Y,M);
  let ult='';
  rows.forEach((r,i)=>{
    if(i<=hi)return;
    let num=String(r[off]??'').trim();
    if(dia&&!num)num=ult;   // células de LOJA mescladas/vazias: usa a loja da linha anterior
    if(!/^\d{1,2}$/.test(num))return;
    ult=num;
    const loja=num.padStart(2,'0'),ri=LOJAS.indexOf(loja);if(ri<0)return;
    if(dia){
      const g=grupoTit(r[dia.cargo]);if(!g)return;
      if(dia.sup>=0&&String(r[dia.sup]).trim())setPlanCel(ri,'sup',r[dia.sup]);
      Object.entries(dia.dias).forEach(([c,d])=>{if(d<=n)setDia(loja,g.k,d,r[+c]);});
      if(Object.keys(dia.dias).some(c=>String(r[+c]??'').trim()!==''))lojas.add(loja);
      return;
    }else{
      const c=r.slice(off);
      if(mapa)Object.entries(mapa).forEach(([k,f])=>setPlanCel(ri,f,r[+k]));
      else if(c.length>=PLANILHA.length+2){setPlanCel(ri,'sup',c[1]);PLANILHA.forEach((f,k)=>setPlanCel(ri,f,c[k+2]));}
      else PCAMPOS.forEach((f,k)=>setPlanCel(ri,f,c[k+1]));
    }
    lojas.add(loja);
  });
  return lojas.size;
}
/* "Planejamento de Outubro/2026" no topo da planilha exportada: importa direto para esse mês */
function mesDaPlanilha(rows){
  for(const r of rows.slice(0,4))for(const c of r){
    const m=String(c).match(/planejamento de\s+([^\/\s]+)\s*\/\s*(\d{4})/i);
    if(m){const i=MESES.findIndex(x=>up(x)===up(m[1]));if(i>=0)return {y:+m[2],m:i};}
  }
  return null;
}
function importaPlanilha(f){
  const r=new FileReader();
  r.onload=()=>{
    let rows;
    try{
      const wb=XLSX.read(r.result,{type:'array'});
      const sh=wb.SheetNames.map(s=>XLSX.utils.sheet_to_json(wb.Sheets[s],{header:1,defval:'',raw:true}));
      rows=sh.find(rs=>rs.some(l=>l.some(c=>String(c).trim().toUpperCase()==='LOJA')));
    }catch(e){}
    if(!rows){alert('Não foi possível ler a planilha. Ela precisa ter a coluna LOJA e as colunas de Vendedores, Operadores, Caixas, Estoquistas e VM (orçado), ou o mesmo formato da planilha da controladoria.');return;}
    const mp=mesDaPlanilha(rows);if(mp){Y=mp.y;M=mp.m;}
    const nome=`${MESES[M]}/${Y}`;
    if(!confirm(`Importar a planilha "${f.name}" para o planejamento de ${nome}?${planoMes()?' O planejamento atual deste mês será substituído.':''}`)){render();return;}
    try{
      const ant=S.planos[keyOf(Y,M)];
      S.planos[keyOf(Y,M)]={lojas:{}};
      const n=aplicaLinhas(rows);
      if(!n){if(ant)S.planos[keyOf(Y,M)]=ant;else delete S.planos[keyOf(Y,M)];throw 0;}
      save();render();alert(`${n} loja(s) importadas da planilha para o planejamento de ${nome}.`);
    }catch(e){alert('Não foi possível ler a planilha. Ela precisa ter a coluna LOJA e as colunas de Vendedores, Operadores, Caixas, Estoquistas e VM (orçado), ou o mesmo formato da planilha da controladoria.');}
  };
  r.readAsArrayBuffer(f);
}
$('#pprev').onclick=()=>mudaMes(-1);
$('#pnext').onclick=()=>mudaMes(1);
$('#pcopy').onclick=()=>{
  const k=keyOf(M===0?Y-1:Y,M===0?11:M-1),prev=S.planos[k];
  if(!prev){alert('Não há planejamento para o mês anterior.');return;}
  if(planoMes()&&!confirm(`Substituir o planejamento de ${MESES[M]}/${Y} (todas as lojas) pelo do mês anterior?`))return;
  const novo=JSON.parse(JSON.stringify(prev)),pn=daysIn(M===0?Y-1:Y,M===0?11:M-1),n=daysIn(Y,M);
  // dias que não existem no mês anterior (ex.: 31) repetem o mesmo dia da semana da última semana
  Object.values(novo.lojas).forEach(l=>PGRUPOS.forEach(g=>{const x=l[g.k];if(!x||!x.dias)return;
    for(let d=pn+1;d<=n;d++)if(x.dias[d-7]!=null)x.dias[d]=x.dias[d-7];}));
  Object.values(novo.lojas).forEach(marcaPlano);
  S.planos[keyOf(Y,M)]=novo;save();render();
};
$('#prep1').onclick=()=>{
  if(!confirm(`Copiar os dias 1 a 7 da loja ${pLoja} para o restante de ${MESES[M]}/${Y}?`))return;
  const p=planoMes(true),l=p.lojas[pLoja]=p.lojas[pLoja]||{},n=daysIn(Y,M);
  PGRUPOS.forEach(g=>{for(let d=8;d<=n;d++){const v=orcDia(l,g.k,((d-1)%7)+1);setDia(pLoja,g.k,d,v==null?'':v);}});
  save();render();
};
$('#pclear').onclick=()=>{
  const p=planoMes();if(!p||!p.lojas[pLoja])return;
  if(!confirm(`Apagar o planejamento da loja ${pLoja} em ${MESES[M]}/${Y}?`))return;
  const sup=p.lojas[pLoja].sup;p.lojas[pLoja]=sup?{sup}:{};marcaPlano(p.lojas[pLoja]);save();render();
};
/* Exporta sempre em Excel (.xlsx): uma linha por loja e cargo, colunas com os dias; pode ser importado de volta */
$('#pexp').onclick=()=>{
  const p=planoMes();if(!p||!Object.keys(p.lojas).length){alert(`Não há planejamento preenchido para ${MESES[M]}/${Y}.`);return;}
  if(typeof XLSX==='undefined'){alert('O gerador de planilhas (xlsx.full.min.js) não foi encontrado na pasta da ferramenta.');return;}
  const n=daysIn(Y,M),col=i=>XLSX.utils.encode_col(i),ini=4,dias=Array.from({length:n},(_,i)=>i+1);
  const aoa=[[`Planejamento de ${MESES[M]}/${Y}`],[],['LOJA','SUPERVISOR','CARGO',...dias]];
  LOJAS.forEach(lj=>{const l=p.lojas[lj]||{},sp=supLoja(lj);PGRUPOS.forEach(g=>aoa.push([lj,sp,g.titulo,...dias.map(d=>{const v=orcDia(l,g.k,d);return v==null?'':v;})]));});
  const fim=aoa.length;
  aoa.push(['TOTAL','','',...dias.map(()=>0)]);
  const ws=XLSX.utils.aoa_to_sheet(aoa);
  for(let r=ini;r<=fim;r++)ws['A'+r]={t:'s',v:aoa[r-1][0]};
  dias.forEach((d,i)=>{const c=col(i+3);const tot=aoa.slice(ini-1,fim).reduce((s,r)=>s+(+r[i+3]||0),0);ws[c+(fim+1)]={t:'n',v:tot,f:`SUM(${c}${ini}:${c}${fim})`};});
  ws['!cols']=[{wch:6},{wch:14},{wch:13},...dias.map(()=>({wch:4}))];
  ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:n+2}}];
  ws['!freeze']={xSplit:3,ySplit:3};
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Planejamento');
  XLSX.writeFile(wb,`planejamento_${keyOf(Y,M)}.xlsx`);
};
$('#pimpBtn').onclick=()=>$('#pimp').click();
$('#pimp').addEventListener('change',ev=>{
  const f=ev.target.files[0];if(!f)return;
  if(!/\.json$/i.test(f.name)){
    ev.target.value='';
    if(typeof XLSX==='undefined'){alert('O leitor de planilhas (xlsx.full.min.js) não foi encontrado na pasta da ferramenta.');return;}
    importaPlanilha(f);return;
  }
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(!d||d.tipo!=='planejamento-escala'||!/^\d{4}-\d{2}$/.test(d.mes)||typeof d.lojas!=='object')throw 0;
      const [y,m]=d.mes.split('-').map(Number),nome=`${MESES[m-1]}/${y}`;
      if(S.planos[d.mes]&&!confirm(`Já existe planejamento de ${nome}. Substituir pelo do arquivo?`))return;
      Object.values(d.lojas).forEach(l=>{if(!l.atualizadoEm)marcaPlano(l);});
      S.planos[d.mes]={lojas:d.lojas};Y=y;M=m-1;save();render();
      alert(`Planejamento de ${nome} importado.`);
    }catch(e){alert('Arquivo inválido: não é um planejamento exportado por esta ferramenta.');}
    finally{ev.target.value='';}
  };
  r.readAsText(f);
});

/* ---------- Lojas (base da controladoria) ----------
   Cada loja: {cod, nome, sup, local, geo, tipo, estrutura, seg, sab, dom, filiais:[{cod, tipo?}]}
   Horários guardados como "10:00 - 22:00", "FECHADO" ou "" (não informado).
   Filial sem tipo = mesmo tipo da estrutura da loja. */
const HRE=/^(\d{1,2})[:h.]?(\d{2})\s*(?:-|–|a|às|as|ate|até)\s*(\d{1,2})[:h.]?(\d{2})$/i;
/* devolve o horário normalizado, '' se vazio ou null se inválido */
function normHorario(s){
  const t=String(s??'').trim();if(!t)return '';
  if(/^fech/i.test(t))return 'FECHADO';
  const m=t.match(HRE);if(!m)return null;
  const hm=(h,mm)=>+h<24&&+mm<60?`${String(+h).padStart(2,'0')}:${mm}`:null;
  const a=hm(m[1],m[2]),b=hm(m[3],m[4]);return a&&b?`${a} - ${b}`:null;
}
/* false = fechado; {ini,fim} em minutos; null = não informado */
function horario(s){
  if(s==='FECHADO')return false;
  const m=/^(\d\d):(\d\d) - (\d\d):(\d\d)$/.exec(s||'');
  return m?{ini:+m[1]*60+ +m[2],fim:+m[3]*60+ +m[4]}:null;
}
const hDia=(b,w)=>w===0?b.dom:w===6?b.sab:b.seg;
function abreDia(d){const b=baseLoja(S.lojaNum);return b?horario(hDia(b,new Date(Y,M,d).getDay())):null;}
const funcDom=b=>b.dom==='FECHADO'?'N':b.dom?'S':'';
const filiaisTxt=b=>(b.filiais||[]).map(f=>f.tipo&&f.tipo!==b.estrutura?`${f.cod} (${f.tipo})`:f.cod).join(', ');
function parseFiliais(t){
  return String(t||'').split(',').map(s=>s.trim()).filter(Boolean).map(s=>{
    const m=s.match(/^([^\s(]+)\s*(?:\((.*)\))?$/);if(!m)return {cod:s.toUpperCase()};
    const tipo=String(m[2]||'').trim().toUpperCase();return tipo?{cod:m[1].toUpperCase(),tipo}:{cod:m[1].toUpperCase()};
  });
}
function funcTxt(){
  const b=baseLoja(S.lojaNum);if(!b)return '';
  const f=s=>s?s.toLowerCase().replace('fechado','fechada'):'—';
  return `Funcionamento: seg. a sex. ${f(b.seg)} · sáb. ${f(b.sab)} · dom. ${f(b.dom)}${b.sup?' · Supervisor '+b.sup:''}`;
}
const ordBase=()=>S.base.sort((a,b)=>{const na=/^\d+$/.test(a.cod),nb=/^\d+$/.test(b.cod);return na!==nb?(na?1:-1):a.cod.localeCompare(b.cod,'pt-BR',{numeric:true});});
const BCAMPOS=[['nome','Nome',110],['sup','Supervisor',110],['local','Local',150],['geo','Geo',150],['tipo','Tipo do local',100],['estrutura','Estrutura',110],
  ['seg','Seg. a sex.',115],['sab','Sábado',115],['dom','Domingo',115]];
const HCAMPOS=['seg','sab','dom'];
function renderBase(){
  const fs=$('#bSup'),sups=[...new Set(S.base.map(l=>l.sup).filter(Boolean))].sort(),sv=fs.value;
  fs.innerHTML='<option value="">Todos</option>'+sups.map(s=>`<option>${esc(s)}</option>`).join('');fs.value=sups.includes(sv)?sv:'';
  const q=up($('#bBusca').value),sf=fs.value;
  const vis=S.base.map((l,i)=>({l,i})).filter(({l})=>(!sf||l.sup===sf)&&(!q||up([l.cod,...BCAMPOS.map(([k])=>l[k]),funcDom(l),filiaisTxt(l)].join(' | ')).includes(q)));
  $('#bCont').textContent=`${vis.length} de ${S.base.length} loja(s)`;
  const dl=(id,k)=>`<datalist id="${id}">${[...new Set(S.base.map(l=>l[k]).filter(Boolean))].sort().map(v=>`<option value="${esc(v)}">`).join('')}</datalist>`;
  let h=dl('dlSup','sup')+dl('dlTipo','tipo')+dl('dlEstr','estrutura')+'<table class="list base"><thead><tr><th>Cód.</th>'+
    BCAMPOS.map(([,t])=>`<th>${t}</th>`).join('')+'<th title="Funciona aos domingos?">Dom?</th><th>Filiais (TOTVS)</th><th></th></tr></thead><tbody>';
  vis.forEach(({l,i})=>{
    h+=`<tr><td class="bcod">${esc(l.cod)}</td>`+BCAMPOS.map(([k,,w])=>{
      const inv=HCAMPOS.includes(k)&&l[k]&&horario(l[k])===null;
      const lst={sup:'dlSup',tipo:'dlTipo',estrutura:'dlEstr'}[k];
      return `<td><input type="text" data-i="${i}" data-f="${k}" value="${esc(l[k])}" style="min-width:${w}px"${lst?` list="${lst}"`:''}${HCAMPOS.includes(k)?' placeholder="FECHADO"':''}${inv?' class="inv" title="Horário inválido: use 10:00 - 22:00 ou FECHADO"':''}></td>`;
    }).join('')+`<td class="bdom ${funcDom(l)==='N'?'n':''}">${funcDom(l)}</td>
      <td><input type="text" data-i="${i}" data-f="filiais" value="${esc(filiaisTxt(l))}" style="min-width:150px"></td>
      <td><button class="danger" data-del="${i}">Remover</button></td></tr>`;
  });
  $('#bList').innerHTML=vis.length?h+'</tbody></table>':'<div class="empty">Nenhuma loja encontrada.</div>';
}
function baseMudou(){ordBase();save();atualizaLojas();render();}
/* edição de uma célula: atualiza só a linha, para não perder o foco ao passar para a próxima */
$('#bList').addEventListener('change',ev=>{
  const t=ev.target,f=t.dataset.f;if(!f)return;const l=S.base[+t.dataset.i];
  if(f==='filiais'){l.filiais=parseFiliais(t.value);t.value=filiaisTxt(l);}
  else if(HCAMPOS.includes(f)){
    const v=normHorario(t.value);
    if(v===null){alert(`Horário inválido: "${t.value}".\nUse o formato 10:00 - 22:00, ou FECHADO.`);t.value=l[f]||'';return;}
    l[f]=t.value=v;t.classList.remove('inv');t.removeAttribute('title');
    const td=t.closest('tr').querySelector('.bdom');td.textContent=funcDom(l);td.classList.toggle('n',funcDom(l)==='N');
  }else l[f]=t.value=t.value.trim().toUpperCase();
  save();atualizaLojas();renderResto();
});
$('#bList').addEventListener('click',ev=>{
  const b=ev.target.closest('button[data-del]');if(!b)return;const l=S.base[+b.dataset.del];
  if(!confirm(`Remover a ${l.nome} da base de lojas?\n\nEla sai da lista de lojas da escala. A escala e as tarefas já salvas dessa loja não são apagadas e voltam se ela for cadastrada de novo.`))return;
  S.base.splice(+b.dataset.del,1);baseMudou();
});
$('#bSup').addEventListener('change',renderBase);
$('#bBusca').addEventListener('input',renderBase);
$('#bAdd').onclick=()=>{
  const r=prompt('Número da nova loja (2 dígitos, ex.: 61):');if(r===null)return;
  const cod=r.trim().padStart(2,'0');
  if(!/^\d{2}$/.test(cod)||cod==='00'){alert('Informe um número de 01 a 99.');return;}
  if(baseLoja(cod)){alert(`A loja ${cod} já está na base.`);return;}
  S.base.push({cod,nome:'LOJA '+cod,sup:'',local:'',geo:'',tipo:'',estrutura:'',seg:'',sab:'',dom:'',filiais:[]});
  $('#bBusca').value=cod;$('#bSup').value='';baseMudou();
  const el=$(`#bList input[data-f="sup"]`);if(el)el.focus();
};
/* Exporta no formato das planilhas da controladoria: aba Lojas e aba Filiais (importáveis de volta) */
$('#bExp').onclick=()=>{
  if(typeof XLSX==='undefined'){alert('O gerador de planilhas (xlsx.full.min.js) não foi encontrado na pasta da ferramenta.');return;}
  const lj=[['SUP','LOJA','LOJA','LOCAL','GEO','TIPO DO LOCAL','ESTRUTURA','FUNC SEG À SEX','FUNC SÁB','FUNC DOM','FUNC DOM?']];
  S.base.forEach(l=>lj.push([l.sup,l.nome,l.cod,l.local,l.geo,l.tipo,l.estrutura,l.seg,l.sab,l.dom,funcDom(l)]));
  const fi=[['FILIAL','PARA','DE','LOJA DESCR','TIPO OPERAÇÃO','SUP']];
  S.base.forEach(l=>(l.filiais||[]).forEach(f=>fi.push([f.cod,l.cod,/^\d+$/.test(f.cod)?String(+f.cod):f.cod,l.nome,f.tipo||l.estrutura,l.sup])));
  const wb=XLSX.utils.book_new();
  [[lj,'Lojas',[12,10,6,24,24,14,14,15,15,15,10]],[fi,'Filiais',[8,6,6,12,16,12]]].forEach(([aoa,nm,w])=>{
    const ws=XLSX.utils.aoa_to_sheet(aoa);
    // códigos como texto, para o Excel não comer o zero à esquerda (01, 0101)
    aoa.forEach((r,ri)=>r.forEach((v,ci)=>{if(ri&&typeof v==='string'&&/^\d+$/.test(v)){const a=XLSX.utils.encode_cell({r:ri,c:ci});ws[a]={t:'s',v};}}));
    ws['!cols']=w.map(wch=>({wch}));ws['!autofilter']={ref:ws['!ref']};
    XLSX.utils.book_append_sheet(wb,ws,nm);
  });
  XLSX.writeFile(wb,`base_lojas_${new Date().toISOString().slice(0,10)}.xlsx`);
};
$('#bImpBtn').onclick=()=>$('#bImp').click();
$('#bImp').addEventListener('change',ev=>{
  const f=ev.target.files[0];ev.target.value='';if(!f)return;
  if(typeof XLSX==='undefined'){alert('O leitor de planilhas (xlsx.full.min.js) não foi encontrado na pasta da ferramenta.');return;}
  const r=new FileReader();
  r.onload=()=>{
    let abas;
    try{const wb=XLSX.read(r.result,{type:'array'});abas=wb.SheetNames.map(s=>XLSX.utils.sheet_to_json(wb.Sheets[s],{header:1,defval:'',raw:false}));}
    catch(e){alert('Não foi possível ler a planilha.');return;}
    const cab=(rows,teste)=>{const i=rows.findIndex(rw=>teste(rw.map(up)));return i<0?null:{i,hd:rows[i].map(up)};};
    const txt=v=>String(v??'').trim().toUpperCase();
    const cod2=v=>{const s=txt(v);return /^\d{1,2}$/.test(s)?s.padStart(2,'0'):s;};
    // aba de lojas: tem SUP e LOCAL
    let novas=null,erros=[];
    for(const rows of abas){
      const c=cab(rows,h=>h.includes('SUP')&&h.includes('LOCAL'));if(!c)continue;
      const col=n=>c.hd.indexOf(n),iLoja=c.hd.reduce((a,h,k)=>h==='LOJA'?[...a,k]:a,[]);
      const iSeg=c.hd.findIndex(h=>h.startsWith('FUNC SEG')),iSab=c.hd.findIndex(h=>h.startsWith('FUNC SAB')),iDom=c.hd.findIndex(h=>h==='FUNC DOM');
      novas=[];
      rows.slice(c.i+1).forEach(rw=>{
        const nome=txt(rw[iLoja[0]]);let cod=iLoja.length>1?cod2(rw[iLoja[1]]):'';
        if(!cod){const m=nome.match(/(\d+|X)$/);cod=m?cod2(m[1]):'';}
        if(!cod||novas.some(l=>l.cod===cod))return;
        const hr=(k,rot)=>{if(k<0)return '';const v=normHorario(rw[k]);if(v===null){erros.push(`${nome||cod}: ${rot} "${rw[k]}"`);return txt(rw[k]);}return v;};
        const ant=baseLoja(cod);
        novas.push({cod,nome:nome||'LOJA '+cod,sup:txt(rw[col('SUP')]),local:txt(rw[col('LOCAL')]),geo:txt(rw[col('GEO')]),tipo:txt(rw[col('TIPO DO LOCAL')]),
          estrutura:txt(rw[col('ESTRUTURA')]),seg:hr(iSeg,'seg. a sex.'),sab:hr(iSab,'sábado'),dom:hr(iDom,'domingo'),filiais:ant?ant.filiais:[]});
      });
      if(novas.length)break;novas=null;
    }
    // aba de filiais: tem FILIAL e PARA
    let fil=null;
    for(const rows of abas){
      const c=cab(rows,h=>h.includes('FILIAL')&&h.includes('PARA'));if(!c)continue;
      const iF=c.hd.indexOf('FILIAL'),iP=c.hd.indexOf('PARA'),iT=c.hd.findIndex(h=>h.startsWith('TIPO OPERA'));
      fil={};
      rows.slice(c.i+1).forEach(rw=>{const fc=txt(rw[iF]),lj=cod2(rw[iP]);if(!fc||!lj)return;(fil[lj]=fil[lj]||[]).push({cod:fc,tipo:iT>=0?txt(rw[iT]):''});});
      if(Object.keys(fil).length)break;fil=null;
    }
    if(!novas&&!fil){alert('Planilha não reconhecida. Use a planilha de lojas (colunas SUP, LOJA, LOCAL, ESTRUTURA, FUNC SEG À SEX…) e/ou a de filiais (FILIAL, PARA, TIPO OPERAÇÃO), como no Exportar base.');return;}
    const msg=[novas?`${novas.length} loja(s) – a base atual (${S.base.length}) será substituída`:'',fil?`filiais de ${Object.keys(fil).length} loja(s)`:''].filter(Boolean).join('\n• ');
    if(!confirm(`Importar "${f.name}"?\n\n• ${msg}`))return;
    if(novas)S.base=novas;
    if(fil)S.base.forEach(l=>{if(fil[l.cod])l.filiais=fil[l.cod].map(x=>x.tipo&&x.tipo!==l.estrutura?x:{cod:x.cod});});
    baseMudou();
    alert('Base de lojas importada.'+(erros.length?`\n\nHorários que não foram entendidos (ficaram marcados em vermelho):\n• ${erros.slice(0,10).join('\n• ')}${erros.length>10?'\n…':''}`:''));
  };
  r.readAsArrayBuffer(f);
});

function render(){renderBase();renderResto();}
function renderResto(){
  atualizaLojas();$('#funcLoja').textContent=funcTxt();
  $('#loja').placeholder=descLoja(S.lojaNum)||'Ex.: Loja70 – Centro de SP';
  renderPlan();renderPlanEquipe();renderAprov();renderCargos();renderBrushes();renderGrid();renderTBrushes();renderTGrid();renderTasks();renderEmp();renderPresets();}
/* ---------- Servidor (escala-api) ----------
   3 documentos: "global" (horários, planejamento e base de lojas, só DP), "loja" (equipe e escala, só DP)
   e "tarefas" da loja (tarefas cadastradas e do mês, DP e gerente). */
const ver={global:0,loja:0,tarefas:0},enviado={global:null,loja:null,tarefas:null};
let lojaCarregada='',syncT=null,syncP=null,syncDeNovo=false,tarefasGlobais=null,tmonthsLoja=null;
const gParte=()=>({presets:S.presets,planos:S.planos,base:S.base});
const lParte=()=>({loja:S.loja||'',gerente:S.gerente||'',employees:S.employees,months:S.months});
const tParte=()=>({tarefas:S.tarefas,tmonths:S.tmonths});
function quemSou(){let n=DP.usuario||'';try{n=n||localStorage.getItem('escala-usuario')||'';}catch(e){}return n||(GER?S.gerente:'')||'desconhecido';}
async function api(path,opt={}){
  const h={'Content-Type':'application/json','X-Usuario':encodeURIComponent(quemSou())};
  if(DP.token&&!GER)h.Authorization='Bearer '+DP.token;
  const r=await fetch(API+path,{...opt,headers:h,cache:'no-store'});
  if(!r.ok){const e=new Error('HTTP '+r.status);e.status=r.status;try{e.body=await r.json();}catch(_){}throw e;}
  return r.json();
}
function syncStatus(t,cls){const el=$('#syncSt');el.textContent=t;el.className='sync '+(cls||'');}
const statusPadrao=()=>GER?'Escala: somente visualização':'✓ Conectado ao servidor';
async function carregaGlobal(){
  const d=await api('/global');ver.global=d.versao;
  if(d.dados){S.presets=d.dados.presets||[];S.planos=d.dados.planos||{};if((d.dados.tarefas||[]).length)tarefasGlobais=d.dados.tarefas;
    const temBase=(d.dados.base||[]).length;if(temBase)S.base=d.dados.base;
    enviado.global=temBase?JSON.stringify(gParte()):null;}   // servidor ainda sem a base de lojas: sobe a deste navegador
  else enviado.global=null;   // servidor ainda vazio: o que está neste navegador sobe na próxima gravação
}
async function carregaLoja(n,migrar){
  const d=await api('/lojas/'+n);ver.loja=d.versao;lojaCarregada=n;
  tmonthsLoja=d.dados&&d.dados.tmonths||null;   // versões antigas guardavam as tarefas junto com a escala
  if(d.dados){Object.assign(S,{loja:d.dados.loja||'',gerente:d.dados.gerente||'',employees:d.dados.employees||[],months:d.dados.months||{}});enviado.loja=JSON.stringify(lParte());}
  else if(migrar)enviado.loja=null;   // primeira conexão: a escala deste navegador vai para esta loja
  else{Object.assign(S,{loja:'',gerente:'',employees:[],months:{}});enviado.loja=JSON.stringify(lParte());}
}
async function carregaTarefas(n,migrar){
  const d=await api('/lojas/'+n+'/tarefas');ver.tarefas=d.versao;
  if(d.dados){S.tarefas=d.dados.tarefas||[];S.tmonths=d.dados.tmonths||{};enviado.tarefas=JSON.stringify(tParte());return;}
  // loja ainda sem tarefas próprias: começa pela lista geral antiga (ou a padrão)
  if(!migrar||!S.tarefas||!S.tarefas.length)S.tarefas=JSON.parse(JSON.stringify(tarefasGlobais||defaults().tarefas));
  S.tmonths=tmonthsLoja||(migrar?S.tmonths||{}:{});
  enviado.tarefas=JSON.stringify(tParte());
  if(migrar||tmonthsLoja)enviado.tarefas=null;
}
const temPendente=k=>enviado[k]!==JSON.stringify({global:gParte,loja:lParte,tarefas:tParte}[k]());
function agendaSync(){if(!ONLINE)return;clearTimeout(syncT);syncStatus('Salvando…');syncT=setTimeout(sincroniza,700);}
async function put(k,path,parte){
  const s=JSON.stringify(parte());if(s===enviado[k])return;
  const r=await api(path,{method:'PUT',body:JSON.stringify({dados:parte(),versao:ver[k]})});ver[k]=r.versao;enviado[k]=s;
}
async function sincroniza(){
  clearTimeout(syncT);
  if(!ONLINE)return;
  if(syncP){syncDeNovo=true;return syncP;}
  syncP=(async()=>{
    try{
      if(!GER){await put('global','/global',gParte);if(lojaCarregada)await put('loja','/lojas/'+lojaCarregada,lParte);}
      if(lojaCarregada)await put('tarefas','/lojas/'+lojaCarregada+'/tarefas',tParte);
      syncStatus(GER?'✓ Tarefas salvas no servidor':'✓ Salvo no servidor','ok');
    }catch(e){
      if(e.status===409){alert('Os dados foram alterados por outra pessoa enquanto você editava. A tela vai ser atualizada com a versão mais recente; confira e refaça a sua última alteração.');await recarrega(true);}
      else if(e.status===401||e.status===403){syncStatus('⚠ Sem permissão para gravar','erro');alert('O servidor recusou a gravação (sem permissão). Verifique o token em config-dp.js.');}
      else{syncStatus('⚠ Sem conexão – tentando de novo…','erro');setTimeout(agendaSync,10000);}
    }finally{syncP=null;if(syncDeNovo){syncDeNovo=false;agendaSync();}}
  })();
  return syncP;
}
/* tudo=false: atualização automática; não descarta tarefas que o gerente ainda está gravando */
async function recarrega(tudo){
  if(!tudo&&syncP)return;
  try{
    await carregaGlobal();
    if(S.lojaNum){await carregaLoja(S.lojaNum,false);if(tudo||!temPendente('tarefas'))await carregaTarefas(S.lojaNum,false);}
  }catch(e){return;}
  migra();normCargos();aplicaCabecalho();render();if(tudo)syncStatus(statusPadrao(),'ok');
}
async function trocaLoja(n){
  if(ONLINE)await sincroniza();
  S.lojaNum=n;if(n)pLoja=n;
  if(ONLINE&&n){try{await carregaLoja(n,false);await carregaTarefas(n,false);}catch(e){alert(`Não foi possível carregar a loja ${n} do servidor.`);}}
  migra();normCargos();aplicaCabecalho();
  if(!ONLINE)save();else if(!GER)try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}
  render();carregaSolicitacoes();
}
function aplicaCabecalho(){
  $('#loja').value=S.loja||'';$('#gerente').value=S.gerente||'';$('#lojaNum').value=S.lojaNum||'';
  if(brush.t==='turno'&&!S.presets.some(p=>p.id===brush.p))brush=S.presets[0]?{t:'turno',p:S.presets[0].id}:{t:'folga'};
}
async function iniciaServidor(){
  try{await api('/health');ONLINE=true;}catch(e){ONLINE=false;}
  if(!ONLINE){
    if(GER){
      // sem servidor (ex.: página aberta direto do computador): mostra a escala salva neste navegador
      const loc=load();
      if(loc&&(loc.employees||[]).length){
        S=loc;const q=(QS.get('loja')||'').padStart(2,'0');if(LOJAS.includes(q))S.lojaNum=q;
        pLoja=S.lojaNum||'01';migra();normCargos();aplicaCabecalho();render();
        syncStatus('Sem servidor – mostrando a escala salva neste navegador','erro');
      }else{$('#grid').innerHTML=$('#tgrid').innerHTML='<div class="empty">Não foi possível conectar ao servidor da escala. Tente de novo mais tarde.</div>';syncStatus('⚠ Sem conexão','erro');}
    }
    else syncStatus('Sem servidor – salvando só neste navegador','erro');
    return;
  }
  if(!DP.token)setModo(true);
  try{
    await carregaGlobal();migra();atualizaLojas();   // a lista de lojas vem da base de lojas do servidor
    const qLoja=(QS.get('loja')||'').padStart(2,'0');
    if(GER&&LOJAS.includes(qLoja)){S.lojaNum=qLoja;$('#lojaNum').disabled=true;}
    if(!S.lojaNum)S.lojaNum=LOJAS[0]||'01';
    pLoja=S.lojaNum;
    await carregaLoja(S.lojaNum,!GER);await carregaTarefas(S.lojaNum,!GER);
  }
  catch(e){syncStatus('⚠ Erro ao carregar do servidor','erro');return;}
  migra();normCargos();aplicaCabecalho();render();
  syncStatus(statusPadrao(),GER?'':'ok');
  if(!GER&&(enviado.global===null||enviado.loja===null||enviado.tarefas===null))agendaSync();
  carregaSolicitacoes();
  setInterval(()=>{if(GER)recarrega(false);carregaSolicitacoes();},60000);
}

/* ---------- Solicitações de alteração (gerente -> DP) ---------- */
const TIPOS_SOL={troca_turno:'Troca de turno/horário',troca_folga:'Troca de folga',ferias:'Férias',atestado:'Atestado/ausência',extra:'Incluir extra',outro:'Outro'};
const ST_SOL={pendente:'⏳ Pendente',aprovada:'✓ Aprovada',concluida:'✓ Concluída',recusada:'✕ Recusada'};
let SOL=[];
const mesNome=k=>{const [y,m]=String(k).split('-');return `${MESES[+m-1]||k}/${y}`;};
const fmtDH=iso=>{const d=new Date(iso);return isNaN(d)?'':d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});};
$('#sTipo').innerHTML=Object.entries(TIPOS_SOL).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
async function carregaSolicitacoes(){
  if(!ONLINE)return;
  try{SOL=await api('/solicitacoes'+(GER?'?loja='+S.lojaNum:''));}catch(e){return;}
  renderSolicitacoes();
}
function cardSol(s){
  const acts=!GER&&s.status==='pendente'?`<div class="acts"><button data-sabrir="${s.id}">Abrir escala</button><button class="primary" data-sok="${s.id}">Marcar como concluída</button><button class="danger" data-snao="${s.id}">Recusar</button></div>`:'';
  return `<div class="sol st-${esc(s.status)}"><div class="sol-top"><b>Loja ${esc(s.loja)}</b><span>${esc(mesNome(s.mes))}</span><span>${esc(TIPOS_SOL[s.tipo]||s.tipo)}</span><span class="sst">${ST_SOL[s.status]||esc(s.status)}</span></div>
    <div class="small">${s.colaborador?'Colaborador: <b>'+esc(s.colaborador)+'</b>':''}${s.dias?' · Dia(s): <b>'+esc(s.dias)+'</b>':''}</div>
    <div class="sdesc">${esc(s.descricao)}</div>
    <div class="small">Pedido por ${esc(s.solicitante)} em ${fmtDH(s.criado_em)}${s.resposta||s.status!=='pendente'?` · <b>Resposta do DP</b>${s.respondido_por?' ('+esc(s.respondido_por)+')':''}: ${esc(s.resposta||'—')}`:''}</div>${acts}</div>`;
}
function renderSolicitacoes(){
  if(GER){
    const ls=SOL.slice(0,20);
    $('#minhasSol').innerHTML=ls.length?`<h4>Solicitações desta loja</h4>${ls.map(cardSol).join('')}`:'';
    return;
  }
  const pend=SOL.filter(s=>s.status==='pendente').length,b=$('#solBadge');
  b.hidden=!pend;b.textContent=pend;
  const st=$('#solStatus').value,lj=$('#solLoja').value;
  const ls=SOL.filter(s=>(!st||s.status===st)&&(!lj||s.loja===lj));
  $('#solLista').innerHTML=ls.length?ls.map(cardSol).join(''):'<div class="empty">Nenhuma solicitação.</div>';
}
$('#solStatus').addEventListener('change',renderSolicitacoes);
$('#solLoja').addEventListener('change',renderSolicitacoes);
$('#solAtualizar').onclick=carregaSolicitacoes;
$('#solLista').addEventListener('click',async ev=>{
  const b=ev.target.closest('button');if(!b)return;
  const id=b.dataset.sabrir||b.dataset.sok||b.dataset.snao,s=SOL.find(x=>String(x.id)===id);if(!s)return;
  if(b.dataset.sabrir){
    const [y,m]=s.mes.split('-').map(Number);Y=y;M=m-1;
    await trocaLoja(s.loja);
    document.querySelector('nav.tabs button[data-tab="escala"]').click();
    return;
  }
  let body;
  if(b.dataset.sok){const r=prompt('Comentário para o gerente (opcional):','Alteração feita na escala.');if(r===null)return;body={status:'concluida',resposta:r};}
  else{const r=prompt('Motivo da recusa (o gerente vai ver):');if(!r||!r.trim())return;body={status:'recusada',resposta:r.trim()};}
  try{await api('/solicitacoes/'+s.id,{method:'PATCH',body:JSON.stringify(body)});}
  catch(e){alert('Não foi possível gravar a resposta no servidor.');return;}
  carregaSolicitacoes();
});
function abreSolicitacao(eid,d){
  if(!ONLINE){alert('As solicitações de alteração são enviadas pelo servidor da escala, que ainda não está disponível. Fale com o coordenador de DP diretamente.');return;}
  const ps=pessoasEscala(),p=eid?ps.find(x=>x.id===eid):null;
  $('#solRef').textContent=`Loja ${S.lojaNum} · ${MESES[M]}/${Y}`;
  let nome='';try{nome=localStorage.getItem('escala-usuario')||'';}catch(e){}
  $('#sNome').value=nome||S.gerente||'';
  $('#sColab').innerHTML='<option value="">— vários / geral —</option>'+ps.map(x=>`<option${p&&p.id===x.id?' selected':''}>${esc(x.nome)}</option>`).join('');
  $('#sDias').value=d?dm(d):'';
  $('#sTipo').value=d&&p&&ehTrab(celAt(p.id,d))?'troca_turno':'troca_folga';
  $('#sDesc').value='';
  const dl=$('#solDlg');if(dl.showModal)dl.showModal();else dl.setAttribute('open','');
  ($('#sNome').value?$('#sDesc'):$('#sNome')).focus();
}
const fechaSol=()=>{const d=$('#solDlg');if(d.close)d.close();else d.removeAttribute('open');};
$('#solicitar').onclick=()=>abreSolicitacao(null,null);
$('#sCancel').onclick=fechaSol;
$('#solForm').addEventListener('submit',async ev=>{
  ev.preventDefault();
  const body={loja:S.lojaNum,mes:keyOf(Y,M),solicitante:$('#sNome').value.trim(),colaborador:$('#sColab').value||null,
    dias:$('#sDias').value.trim()||null,tipo:$('#sTipo').value,descricao:$('#sDesc').value.trim()};
  if(body.solicitante.length<2||body.descricao.length<3){alert('Preencha o seu nome e a descrição do que precisa mudar.');return;}
  try{await api('/solicitacoes',{method:'POST',body:JSON.stringify(body)});}
  catch(e){alert('Não foi possível enviar a solicitação. Verifique a conexão e tente de novo.');return;}
  try{localStorage.setItem('escala-usuario',body.solicitante);}catch(e){}
  fechaSol();toast('Solicitação enviada ao coordenador de DP.',true);carregaSolicitacoes();
});

normCargos();if(!GER)try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}
render();
iniciaServidor();
})();
