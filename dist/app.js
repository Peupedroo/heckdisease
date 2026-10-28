const $=s=>document.querySelector(s), KEY='heck-records-v1';let records=[],current={},step=0,editing=false,dirty=false;
try{records=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(records))records=[]}catch{alert('Não foi possível ler os registros locais. Verifique as permissões do navegador.')}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=['Identificação','Histórico de saúde','Hábitos e condições','Exposições ao HPV','Evolução das lesões','Exame clínico','Investigação diagnóstica','Acompanhamento'];
const multi=new Set(['s2q8','s3q2','s3q8','s4q9','s5q12','s6q1','s6q4','s7q6','s7q9']);
function notify(s){$('#toast').textContent=s;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',3500)}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(records));return true}catch{notify('Não foi possível salvar. Exporte os registros e confira o armazenamento.');return false}}
function render(){let filtered=records.filter(r=>JSON.stringify([r.s1q1,r.s1q7,r.s8q2]).toLowerCase().includes($('#search').value.toLowerCase())&&(!$('#statusfilter').value||r.status===$('#statusfilter').value));$('#rows').innerHTML=filtered.map(r=>`<tr><td><b>${esc(r.s1q1||'Sem código')}</b></td><td>${esc(r.s1q7||'—')}</td><td>${esc(r.s1q3? r.s1q3.split('-').reverse().join('/'):'—')}</td><td><span class="badge ${r.status==='Concluído'?'done':''}">${esc(r.status)}</span></td><td><button data-edit="${esc(r.id)}">Abrir ↗</button></td></tr>`).join('');$('#empty').hidden=filtered.length>0;$('#empty h3').textContent=records.length?'Nenhum registro encontrado':'O primeiro registro começa aqui';$('#total').textContent=records.length;$('#navcount').textContent=records.length;$('#done').textContent=records.filter(r=>r.status==='Concluído').length;$('#drafts').textContent=records.filter(r=>r.status!=='Concluído').length;document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openRecord(b.dataset.edit))}
function home(list=false){if(editing&&!checkpoint())return;editing=false;$('#editor').hidden=true;$('#dashboard').hidden=list;$('#records').hidden=false;$('#breadcrumb').textContent=list?'Participantes':'Visão geral';$('#listtitle').textContent=list?'Participantes':'Registros recentes';document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$(list?'#nav-records':'#nav-home').classList.add('active');render();showResume()}
function openRecord(id){if(editing&&!checkpoint())return;current=id?structuredClone(records.find(r=>r.id===id)):{id:crypto.randomUUID(),status:'Rascunho',s1q3:new Date().toLocaleDateString('en-CA')};step=Number.isInteger(current._step)?Math.min(7,Math.max(0,current._step)):0;editing=true;dirty=false;$('#dashboard').hidden=true;$('#records').hidden=true;$('#editor').hidden=false;$('#breadcrumb').textContent=id?'Editar coleta':'Nova coleta';$('#editor-title').textContent=id?`Coleta ${current.s1q1||''}`:'Nova coleta';$('#resume-banner').hidden=true;document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$('#nav-new').classList.add('active');drawStep();window.scrollTo(0,0)}
function collect(){document.querySelectorAll('#fields [name]').forEach(el=>{if(el.type==='checkbox'){current[el.name]=Array.from(document.querySelectorAll(`#fields input[name="${el.name}"]:checked`)).map(x=>x.value)}else current[el.name]=el.value})}
function drawStep(){const sec=schema[step];$('#steps').innerHTML=short.map((t,i)=>`<button type="button" class="${i===step?'active':''}" data-step="${i}">${String(i+1).padStart(2,'0')} &nbsp; ${t}</button>`).join('');document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{if(!checkpoint())return;step=+b.dataset.step;current._step=step;checkpoint();drawStep()});$('#mobile-step').innerHTML=short.map((t,i)=>`<option value="${i}" ${i===step?'selected':''}>${i+1}. ${t}</option>`).join('');$('#step-label').textContent=`Etapa ${step+1} de 8`;$('#progress-label').textContent=Math.round((step+1)/8*100)+'% das etapas';$('#progressbar').style.width=(step+1)/8*100+'%';let html=`<h2>${esc(sec.title)}</h2>`;
if(step===0)html+='<p class="notice">Identifique o participante por código. O nome completo deve ser mantido em arquivo separado da base de pesquisa; ele não é coletado neste app.</p>';
if(step===3)html+='<p class="notice">Seção opcional e confidencial. Aplicar individualmente, somente quando adequado à idade e ao protocolo ético aprovado. Pode ser deixada em branco. A doença de Heck não comprova transmissão sexual.</p>';
html+='<div class="fields-grid">';sec.fields.forEach(f=>{if(f.id==='s1q2')return;let v=current[f.id]||'';html+=`<${multi.has(f.id)?'div':'label'} class="${multi.has(f.id)||/Observações|Descrição|Resultado/.test(f.label)?'wide':''}">${esc(f.label)}${f.id==='s1q1'?' *':''}${['s8q7','s8q8'].includes(f.id)?' <small>(obrigatório para concluir)</small>':''}`;
if(f.options.length&&multi.has(f.id)){html+='<div class="checks">'+f.options.map(o=>`<label><input type="checkbox" name="${f.id}" value="${esc(o)}" ${Array.isArray(v)&&v.includes(o)?'checked':''}> ${esc(o)}</label>`).join('')+'</div>'}
else if(f.options.length)html+=`<select name="${f.id}"><option value="">Selecione ou deixe sem resposta</option>${f.options.map(o=>`<option ${v===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
else{let type=/Data da entrevista|Data da avaliação/.test(f.label)?'date':/Idade|dimensão/.test(f.label)?'number':'text';html+=/Observações|Descrição|Resultado/.test(f.label)?`<textarea name="${f.id}">${esc(v)}</textarea>`:`<input name="${f.id}" type="${type}" ${type==='number'?'min="0" step="any"':''} ${f.id==='s1q1'?'required maxlength="80"':''} value="${esc(v)}">`}
html+=multi.has(f.id)?'</div>':'</label>'});html+='</div>';if(step===7)html+='<p class="notice">A conclusão exige consentimento registrado e assentimento quando aplicável. Registros sem consentimento podem ser salvos como rascunho.</p><p id="consent-error" class="field-error" role="alert" hidden></p>';$('#fields').innerHTML=html;$('#prev').disabled=step===0;$('#next').textContent=step===7?'Concluir coleta ✓':'Próxima etapa →';$('#save-status').textContent='Respostas salvas automaticamente neste dispositivo.'}
function save(complete=false){collect();if(!String(current.s1q1||'').trim()){notify('Informe o código do participante na etapa 1.');step=0;drawStep();return false}if(records.some(r=>r.id!==current.id&&r.s1q1===current.s1q1)){notify('Já existe um participante com este código.');return false}if(complete&&(current.s8q7!=='Sim'||!['Sim','Não se aplica'].includes(current.s8q8))){notify('Confira consentimento e assentimento antes de concluir.');return false}current.status=complete?'Concluído':'Rascunho';current._step=step;current.updatedAt=new Date().toISOString();let old=records;records=records.filter(r=>r.id!==current.id).concat(structuredClone(current));if(!persist()){records=old;return false}dirty=false;if(complete){try{localStorage.removeItem(DRAFT_KEY)}catch{}editing=false}else checkpoint();notify(complete?'Coleta concluída e salva.':'Rascunho salvo neste dispositivo.');render();return true}
$('#form').onsubmit=e=>{e.preventDefault();if(!checkpoint())return;if(step<7){step++;current._step=step;checkpoint();drawStep();window.scrollTo(0,0)}else askConclude()};
$('#save').onclick=()=>save();
$('#prev').onclick=()=>{if(!checkpoint())return;if(step>0)step--;current._step=step;checkpoint();drawStep();window.scrollTo(0,0)};
$('#mobile-step').onchange=e=>{if(!checkpoint())return;step=+e.target.value;current._step=step;checkpoint();drawStep()};
$('#close-editor').onclick=()=>home(true);
document.querySelectorAll('[data-new]').forEach(b=>b.onclick=()=>openRecord());
$('#nav-new').onclick=()=>openRecord();$('#nav-home').onclick=()=>home();$('#nav-records').onclick=()=>home(true);
$('#search').oninput=render;$('#statusfilter').onchange=render;
$('#export').onclick=()=>{if(!records.length)return notify('Ainda não há registros para exportar.');let fs=schema.flatMap(s=>s.fields.filter(f=>f.id!=='s1q2'));let cols=[['id','ID do registro'],['status','Situação'],...fs.map(f=>[f.id,f.label]),['updatedAt','Última atualização']];const cell=v=>'"'+String(Array.isArray(v)?v.join(' | '):v??'').replace(/^[=+@-]/,"' $&").replace(/"/g,'""')+'"';const csv='\ufeff'+[cols.map(c=>cell(c[1])).join(';'),...records.map(r=>cols.map(c=>cell(r[c[0]])).join(';'))].join('\r\n');let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='heck-coletas-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};

// Keep an active snapshot even before a participant code has been entered.
const DRAFT_KEY='heck-active-draft-v1';
function showResume(){
  try{const draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');$('#resume-banner').hidden=!draft||editing;if(draft)$('#resume-label').textContent=(draft.data.s1q1||'Participante sem código')+' · Etapa '+(draft.step+1)+' de 8'}catch{$('#resume-banner').hidden=true}
}
function checkpoint(){
  if(!editing)return true;
  collect();current._step=step;
  const status=$('#save-status');
  try{
    localStorage.setItem(DRAFT_KEY,JSON.stringify({data:current,step}));
    const stored=records.find(r=>r.id===current.id);
    if(dirty || (stored && stored._step!==step)){
      if(dirty){current.updatedAt=new Date().toISOString();current.status='Rascunho';}
      const code=String(current.s1q1||'').trim();
      if(!code||!records.some(r=>r.id!==current.id&&r.s1q1===code)){
        current.s1q1=code;
        const next=records.filter(r=>r.id!==current.id).concat(structuredClone(current));
        localStorage.setItem(KEY,JSON.stringify(next));records=next;
        status.textContent=(code?'Salvo automaticamente neste dispositivo · ':'Rascunho sem código salvo neste dispositivo · ')+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      }else status.textContent=code?'Respostas preservadas. Escolha um código que ainda não esteja em uso.':'Respostas preservadas. Informe o código para incluir na lista de participantes.';
      localStorage.setItem(DRAFT_KEY,JSON.stringify({data:current,step}));
    }
    status.classList.remove('error');dirty=false;return true;
  }catch{status.textContent='Não foi possível salvar. Mantenha o app aberto e exporte os registros.';status.classList.add('error');return false}
}
$('#form').addEventListener('input',()=>{dirty=true;checkpoint()});
$('#form').addEventListener('change',()=>{dirty=true;checkpoint()});
$('#resume-draft').onclick=()=>{try{const draft=JSON.parse(localStorage.getItem(DRAFT_KEY));if(!draft)return;current=draft.data;step=Math.min(7,Math.max(0,draft.step||0));editing=true;dirty=false;$('#dashboard').hidden=true;$('#records').hidden=true;$('#editor').hidden=false;$('#resume-banner').hidden=true;$('#editor-title').textContent='Continuar coleta';$('#breadcrumb').textContent='Coleta em andamento';drawStep();window.scrollTo(0,0)}catch{notify('Não foi possível recuperar o rascunho.')}};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')checkpoint()});
window.addEventListener('pagehide',checkpoint);
window.addEventListener('beforeunload',e=>{if(!checkpoint()){e.preventDefault();e.returnValue=''}});

// Confirmação de consentimento antes de concluir a coleta.
function consentError(){
  if(current.s8q7!=='Sim')return 'Para concluir, selecione "Sim" em "Consentimento registrado?". Se o consentimento ainda não foi obtido, use "Salvar rascunho".';
  if(!['Sim','Não se aplica'].includes(current.s8q8))return 'Para concluir, responda "Assentimento quando aplicável?" com "Sim" ou "Não se aplica".';
  return '';
}
function askConclude(){
  collect();
  const msg=consentError(),err=$('#consent-error');
  document.querySelectorAll('[name="s8q7"],[name="s8q8"]').forEach(el=>el.removeAttribute('aria-invalid'));
  if(msg){
    err.textContent=msg;err.hidden=false;
    const el=$(`[name="${current.s8q7!=='Sim'?'s8q7':'s8q8'}"]`);
    el.setAttribute('aria-invalid','true');el.scrollIntoView({block:'center',behavior:'smooth'});el.focus({preventScroll:true});
    return;
  }
  err.hidden=true;
  $('#confirm-summary').innerHTML=`Participante <b>${esc(current.s1q1||'sem código')}</b><br>Consentimento registrado: <b>${esc(current.s8q7)}</b><br>Assentimento: <b>${esc(current.s8q8)}</b><br><br>Ao confirmar, a coleta será marcada como “Concluído”.`;
  const d=$('#confirm-dialog');
  if(d.showModal)d.showModal();else if(confirm('Confirmar o consentimento e concluir a coleta?'))finishCollect();
}
function finishCollect(){if(save(true))home(true)}
$('#confirm-cancel').onclick=()=>$('#confirm-dialog').close();
$('#confirm-ok').onclick=()=>{$('#confirm-dialog').close();finishCollect()};
$('#form').addEventListener('change',()=>{const e=$('#consent-error');if(e)e.hidden=true});

$('#today').textContent=new Date().toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});render();showResume();
