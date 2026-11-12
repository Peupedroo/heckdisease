const $=s=>document.querySelector(s), KEY='heck-records-v1';let records=[],current={},step=0,editing=false,dirty=false;
try{records=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(records))records=[]}catch{alert('Não foi possível ler os registros locais. Verifique as permissões do navegador.')}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=['Identificação','Histórico de saúde','Hábitos e condições','Exposições ao HPV','Evolução das lesões','Exame clínico','Fotos clínicas','Investigação diagnóstica','Acompanhamento'];
const steps=[...schema.slice(0,6),{title:'Fotos clínicas',photos:true,fields:[]},...schema.slice(6)];const LAST=steps.length-1;
const multi=new Set(['s2q8','s3q2','s3q8','s4q9','s5q12','s6q1','s6q4','s7q6','s7q9']);
function notify(s){$('#toast').textContent=s;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',3500)}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(records));return true}catch{notify('Não foi possível salvar. Exporte os registros e confira o armazenamento.');return false}}
function render(){let filtered=records.filter(r=>JSON.stringify([r.s1q1,r.s1q7,r.s8q2]).toLowerCase().includes($('#search').value.toLowerCase())&&(!$('#statusfilter').value||r.status===$('#statusfilter').value));$('#rows').innerHTML=filtered.map(r=>`<tr><td><b>${esc(r.s1q1||'Sem código')}</b></td><td>${esc(r.s1q7||'—')}</td><td>${esc(r.s1q3? r.s1q3.split('-').reverse().join('/'):'—')}</td><td><span class="badge ${r.status==='Concluído'?'done':''}">${esc(r.status)}</span></td><td><button data-edit="${esc(r.id)}">Abrir ↗</button></td></tr>`).join('');$('#empty').hidden=filtered.length>0;$('#empty h3').textContent=records.length?'Nenhum registro encontrado':'O primeiro registro começa aqui';$('#total').textContent=records.length;$('#navcount').textContent=records.length;$('#done').textContent=records.filter(r=>r.status==='Concluído').length;$('#drafts').textContent=records.filter(r=>r.status!=='Concluído').length;document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openRecord(b.dataset.edit))}
function home(list=false){if(editing&&!checkpoint())return;editing=false;$('#editor').hidden=true;$('#dashboard').hidden=list;$('#records').hidden=false;$('#breadcrumb').textContent=list?'Participantes':'Visão geral';$('#listtitle').textContent=list?'Participantes':'Registros recentes';document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$(list?'#nav-records':'#nav-home').classList.add('active');render();showResume()}
function openRecord(id){if(editing&&!checkpoint())return;current=id?structuredClone(records.find(r=>r.id===id)):{id:crypto.randomUUID(),status:'Rascunho',s1q3:new Date().toLocaleDateString('en-CA')};step=Number.isInteger(current._step)?Math.min(LAST,Math.max(0,current._step)):0;editing=true;dirty=false;$('#dashboard').hidden=true;$('#records').hidden=true;$('#editor').hidden=false;$('#breadcrumb').textContent=id?'Editar coleta':'Nova coleta';$('#editor-title').textContent=id?`Coleta ${current.s1q1||''}`:'Nova coleta';$('#resume-banner').hidden=true;document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$('#nav-new').classList.add('active');drawStep();window.scrollTo(0,0)}
function collect(){document.querySelectorAll('#fields [name]').forEach(el=>{if(el.type==='checkbox'){current[el.name]=Array.from(document.querySelectorAll(`#fields input[name="${el.name}"]:checked`)).map(x=>x.value)}else current[el.name]=el.value})}
function drawStep(){const sec=steps[step];$('#steps').innerHTML=short.map((t,i)=>`<button type="button" class="${i===step?'active':''}" data-step="${i}">${String(i+1).padStart(2,'0')} &nbsp; ${t}</button>`).join('');document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{if(!checkpoint())return;step=+b.dataset.step;current._step=step;checkpoint();drawStep()});$('#mobile-step').innerHTML=short.map((t,i)=>`<option value="${i}" ${i===step?'selected':''}>${i+1}. ${t}</option>`).join('');$('#step-label').textContent=`Etapa ${step+1} de ${steps.length}`;$('#progress-label').textContent=Math.round((step+1)/steps.length*100)+'% das etapas';$('#progressbar').style.width=(step+1)/steps.length*100+'%';let html=`<h2>${esc(sec.title)}</h2>`;
if(step===0)html+='<p class="notice">Identifique o participante por código. O nome completo deve ser mantido em arquivo separado da base de pesquisa; ele não é coletado neste app.</p>';
if(step===3)html+='<p class="notice">Seção opcional e confidencial. Aplicar individualmente, somente quando adequado à idade e ao protocolo ético aprovado. Pode ser deixada em branco. A doença de Heck não comprova transmissão sexual.</p>';
html+='<div class="fields-grid">';sec.fields.forEach(f=>{if(f.id==='s1q2')return;let v=current[f.id]||'';html+=`<${multi.has(f.id)?'div':'label'} class="${multi.has(f.id)||/Observações|Descrição|Resultado/.test(f.label)?'wide':''}">${esc(f.label)}${f.id==='s1q1'?' *':''}${['s8q7','s8q8'].includes(f.id)?' <small>(obrigatório para concluir)</small>':''}`;
if(f.options.length&&multi.has(f.id)){html+='<div class="checks">'+f.options.map(o=>`<label><input type="checkbox" name="${f.id}" value="${esc(o)}" ${Array.isArray(v)&&v.includes(o)?'checked':''}> ${esc(o)}</label>`).join('')+'</div>'}
else if(f.options.length)html+=`<select name="${f.id}"><option value="">Selecione ou deixe sem resposta</option>${f.options.map(o=>`<option ${v===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
else{let type=/Data da entrevista|Data da avaliação/.test(f.label)?'date':/Idade|dimensão/.test(f.label)?'number':'text';html+=/Observações|Descrição|Resultado/.test(f.label)?`<textarea name="${f.id}">${esc(v)}</textarea>`:`<input name="${f.id}" type="${type}" ${type==='number'?'min="0" step="any"':''} ${f.id==='s1q1'?'required maxlength="80"':''} value="${esc(v)}">`}
html+=multi.has(f.id)?'</div>':'</label>'});html+='</div>';if(sec.photos)html+=photoPanelHtml();if(step===LAST)html+='<p class="notice">A conclusão exige consentimento registrado e assentimento quando aplicável. Registros sem consentimento podem ser salvos como rascunho.</p><p id="consent-error" class="field-error" role="alert" hidden></p>';$('#fields').innerHTML=html;if(sec.photos)bindPhotos();$('#prev').disabled=step===0;$('#next').textContent=step===LAST?'Concluir coleta ✓':'Próxima etapa →';$('#save-status').textContent='Respostas salvas automaticamente neste dispositivo.'}
function save(complete=false){collect();if(!String(current.s1q1||'').trim()){notify('Informe o código do participante na etapa 1.');step=0;drawStep();return false}if(records.some(r=>r.id!==current.id&&r.s1q1===current.s1q1)){notify('Já existe um participante com este código.');return false}if(complete&&(current.s8q7!=='Sim'||!['Sim','Não se aplica'].includes(current.s8q8))){notify('Confira consentimento e assentimento antes de concluir.');return false}current.status=complete?'Concluído':'Rascunho';current._step=step;current.updatedAt=new Date().toISOString();let old=records;records=records.filter(r=>r.id!==current.id).concat(structuredClone(current));if(!persist()){records=old;return false}dirty=false;if(complete){try{localStorage.removeItem(DRAFT_KEY)}catch{}editing=false}else checkpoint();notify(complete?'Coleta concluída e salva.':'Rascunho salvo neste dispositivo.');render();if(complete){queueSync(current.id);syncPending()}return true}
$('#form').onsubmit=e=>{e.preventDefault();if(!checkpoint())return;if(step<LAST){step++;current._step=step;checkpoint();drawStep();window.scrollTo(0,0)}else askConclude()};
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
  try{const draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');$('#resume-banner').hidden=!draft||editing;if(draft)$('#resume-label').textContent=(draft.data.s1q1||'Participante sem código')+' · Etapa '+(draft.step+1)+' de '+steps.length}catch{$('#resume-banner').hidden=true}
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
$('#resume-draft').onclick=()=>{try{const draft=JSON.parse(localStorage.getItem(DRAFT_KEY));if(!draft)return;current=draft.data;step=Math.min(LAST,Math.max(0,draft.step||0));editing=true;dirty=false;$('#dashboard').hidden=true;$('#records').hidden=true;$('#editor').hidden=false;$('#resume-banner').hidden=true;$('#editor-title').textContent='Continuar coleta';$('#breadcrumb').textContent='Coleta em andamento';drawStep();window.scrollTo(0,0)}catch{notify('Não foi possível recuperar o rascunho.')}};
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

// ===== Fotos clínicas (ficam no aparelho até o envio) =====
const MAX_PHOTOS=12;
let _pdb=null;
function pdb(){if(_pdb)return _pdb;_pdb=new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('sem IndexedDB'));const r=indexedDB.open('heck-photos-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('p');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});_pdb.catch(()=>{_pdb=null});return _pdb}
async function pput(id,blob){const d=await pdb();return new Promise((res,rej)=>{const t=d.transaction('p','readwrite');t.objectStore('p').put(blob,id);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})}
async function pget(id){const d=await pdb();return new Promise((res,rej)=>{const q=d.transaction('p').objectStore('p').get(id);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)})}
async function pdel(id){const d=await pdb();return new Promise((res,rej)=>{const t=d.transaction('p','readwrite');t.objectStore('p').delete(id);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
// Reduz a imagem (máx. 1600 px) e regrava como JPEG: diminui o tamanho e remove EXIF/GPS.
function compress(file,max=1600,q=.8){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{const k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?res(b):rej(new Error('falha ao converter')),'image/jpeg',q)};img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('imagem inválida'))};img.src=u})}
function blobToBase64(b){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=()=>rej(r.error);r.readAsDataURL(b)})}
function photoPanelHtml(){
  const ok=current.s6q13==='Sim';
  return '<p class="notice">Fotografe somente a lesão. Evite rosto, tatuagens e qualquer detalhe que identifique o participante. As imagens são reduzidas e os dados de localização (GPS) são removidos.</p>'
    +(ok?'':'<p class="field-error">Para anexar fotos, marque "Sim" em "Registro fotográfico autorizado e realizado?" na etapa 6 (Exame clínico).</p>')
    +'<div class="photo-add"><label class="primary photo-btn'+(ok?'':' disabled')+'">＋ Adicionar fotos<input type="file" id="photo-input" accept="image/*" multiple hidden'+(ok?'':' disabled')+'></label><span id="photo-count"></span></div><div id="photo-grid" class="photo-grid"></div>';
}
const thumbURLs=[];
async function renderPhotoGrid(){
  const grid=$('#photo-grid');if(!grid)return;
  thumbURLs.splice(0).forEach(u=>URL.revokeObjectURL(u));
  const list=current.photos||[];
  const items=await Promise.all(list.map(async p=>{let src='';try{const b=await pget(p.id);if(b){src=URL.createObjectURL(b);thumbURLs.push(src)}}catch{}return{p,src}}));
  if(!$('#photo-grid'))return;
  grid.innerHTML=items.map(({p,src},i)=>`<figure class="photo-card"><div class="photo-thumb">${src?`<img src="${src}" alt="Foto ${i+1}">`:'<span>sem prévia</span>'}</div><input class="photo-caption" data-photo="${esc(p.id)}" placeholder="Legenda (ex.: mucosa jugal direita)" maxlength="120" aria-label="Legenda da foto ${i+1}" value="${esc(p.caption||'')}"><figcaption><span class="badge ${p.url?'done':''}">${p.url?'Enviada':'Pendente'}</span>${p.url?'':`<button type="button" class="textbutton" data-remove="${esc(p.id)}">Remover</button>`}</figcaption></figure>`).join('');
  $('#photo-count').textContent=list.length?list.length+' de '+MAX_PHOTOS+' fotos':'Nenhuma foto adicionada';
}
async function addPhotos(files){
  current.photos=current.photos||[];
  let added=0;
  for(const f of files){
    if(current.photos.length>=MAX_PHOTOS){notify('Limite de '+MAX_PHOTOS+' fotos por coleta.');break}
    if(!f.type.startsWith('image/'))continue;
    try{
      const blob=await compress(f),id=crypto.randomUUID();
      await pput(id,blob);
      current.photos.push({id,name:'foto-'+(current.photos.length+1)+'.jpg',caption:'',ts:new Date().toISOString()});
      added++;
    }catch{notify('Não foi possível processar uma das imagens.')}
  }
  if(added){dirty=true;checkpoint();notify(added===1?'Foto adicionada.':added+' fotos adicionadas.')}
  renderPhotoGrid();
}
async function removePhoto(id){
  const i=(current.photos||[]).findIndex(p=>p.id===id);
  if(i<0||current.photos[i].url)return;
  current.photos.splice(i,1);
  try{await pdel(id)}catch{}
  dirty=true;checkpoint();renderPhotoGrid();
}
function bindPhotos(){
  const inp=$('#photo-input'),grid=$('#photo-grid');
  if(inp)inp.onchange=async e=>{const fs=[...e.target.files];e.target.value='';await addPhotos(fs)};
  grid.oninput=e=>{const id=e.target.dataset&&e.target.dataset.photo;if(!id)return;const p=(current.photos||[]).find(x=>x.id===id);if(p)p.caption=e.target.value};
  grid.onclick=e=>{const id=e.target.dataset&&e.target.dataset.remove;if(id)removePhoto(id)};
  renderPhotoGrid();
}

// ===== Envio para o Google Planilhas (via Google Apps Script) =====
// 1) URL do app da Web gerada na implantação do Apps Script.
// 2) TOKEN igual ao que está no arquivo Codigo.gs.
const SHEETS_URL='https://script.google.com/macros/s/AKfycbxjKG7kiBSS6nO2X8zVbSCPsjlz48ingPxhJ6V5KB0ogY3qMLAklT_IzCk_RpV6BtMk/exec';
const SHEETS_TOKEN='troque-por-uma-senha-longa';
const SYNC_KEY='heck-sync-queue-v1';
let syncing=false;
function getSyncQueue(){try{const q=JSON.parse(localStorage.getItem(SYNC_KEY)||'[]');return Array.isArray(q)?q:[]}catch{return[]}}
function setSyncQueue(q){try{localStorage.setItem(SYNC_KEY,JSON.stringify(q))}catch{}}
function queueSync(id){const q=getSyncQueue();if(!q.includes(id)){q.push(id);setSyncQueue(q)}}
function sheetColumns(){const fs=schema.flatMap(s=>s.fields.filter(f=>f.id!=='s1q2'));return [['id','ID do registro'],['status','Situação'],...fs.map(f=>[f.id,f.label]),['updatedAt','Última atualização'],['photoLinks','Fotos (links)']]}
async function postJSON(payload){
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),90000);
  try{
    const res=await fetch(SHEETS_URL,{method:'POST',body:JSON.stringify({token:SHEETS_TOKEN,...payload}),signal:ctl.signal});
    return await res.json();
  }finally{clearTimeout(t)}
}
async function uploadPhotos(r){
  for(const p of (r.photos||[])){
    if(p.url)continue;
    const blob=await pget(p.id);
    if(!blob)continue;
    const data=await blobToBase64(blob);
    const j=await postJSON({action:'photo',photo:{id:p.id,caption:p.caption||'',ts:p.ts||'',code:r.s1q1||'',recordId:r.id,mime:'image/jpeg',data}});
    if(!j.ok)return false;
    p.url=j.url;
    if(current&&current.id===r.id&&Array.isArray(current.photos)){const cp=current.photos.find(x=>x.id===p.id);if(cp)cp.url=j.url}
    persist();
  }
  return true;
}
async function syncOne(id){
  const r=records.find(x=>x.id===id);
  if(!r)return true;
  if(!(await uploadPhotos(r)))return false;
  const rec={...r,photoLinks:(r.photos||[]).map(p=>p.url||'').filter(Boolean).join('\n')};
  const j=await postJSON({columns:sheetColumns(),record:rec});
  return j.ok===true;
}
async function syncPending(){
  if(syncing||!navigator.onLine||!SHEETS_URL.startsWith('https://'))return;
  let q=getSyncQueue();
  if(!q.length)return;
  syncing=true;
  let sent=0,failed=false;
  try{
    for(const id of [...q]){
      try{
        if(await syncOne(id)){q=q.filter(x=>x!==id);setSyncQueue(q);sent++}
        else{failed=true;break}
      }catch{failed=true;break}
    }
  }finally{syncing=false}
  if(sent)notify(sent===1?'Coleta enviada para a planilha.':sent+' coletas enviadas para a planilha.');
  else if(failed)notify('Não foi possível enviar à planilha. Será tentado de novo quando houver conexão.');
}
window.addEventListener('online',syncPending);
syncPending();
