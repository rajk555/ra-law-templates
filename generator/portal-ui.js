/* Appended to the existing Softr generator. The original eight options are retained. */
(function(){
'use strict';
if(document.getElementById('ra-draft-warning'))return;
const core=window.RADraftCore,manifest=window.RADraftManifest;
const source=document.currentScript.src;const sourceUrl=new URL(source);
// jsDelivr serves the JavaScript but can reject DOCX binaries. Fetch blank
// documents from raw GitHub at the exact same immutable commit instead.
const hosted=sourceUrl.hostname==='cdn.jsdelivr.net'&&sourceUrl.pathname.match(/^\/gh\/rajk555\/ra-law-templates@([a-f0-9]{40})\/generator\//);
const base=hosted?'https://raw.githubusercontent.com/rajk555/ra-law-templates/'+hosted[1]+'/':new URL('../',source).href;
const wrap=document.getElementById('ra-wrap'),select=document.getElementById('ra-doc-select'),btn=document.getElementById('ra-btn'),download=document.getElementById('ra-download-btn'),message=document.getElementById('ra-msg');
if(!core||!manifest||!wrap||!select||!btn||!download)return;
const fileLink=document.createElement('a');fileLink.id='ra-file-download';fileLink.textContent='Download';fileLink.hidden=true;
fileLink.style.cssText='padding:10px 16px;background:#fff;color:#111;border:1px solid #ddd;border-radius:8px;text-align:center;text-decoration:none;font:inherit;font-weight:600';
download.after(fileLink);
const group=document.createElement('optgroup');group.label='RA Law Group — Statutory demands and winding up';
manifest.filter(m=>!m.legacy).forEach(m=>{const o=document.createElement('option');o.value='insolvency/'+m.file;o.textContent=m.title;group.appendChild(o);});select.appendChild(group);
const warning=document.createElement('p');warning.id='ra-draft-warning';warning.style.cssText='background:#fff8cc;color:#332800;padding:12px;border-radius:6px;font-size:14px;line-height:1.5';
warning.textContent='Draft Word documents: complete every yellow [COMPLETE: …] field and check every [VERIFY: …] instruction after downloading. Check all legal wording and facts, attach required exhibits, and remove the instructions before signing, serving or filing.';
wrap.insertBefore(warning,document.getElementById('ra-template-row'));
const sourceStatus=document.createElement('p');sourceStatus.id='ra-draft-source';sourceStatus.style.cssText='font-size:13px;color:#555';warning.after(sourceStatus);
// These native fields supply the record event; keep their raw JSON out of the matter view.
const supportingStyle=document.createElement('style');
supportingStyle.textContent='#item-details1 .softr-fields-container:has([data-softr-field-id="_t0menx28k"]) { display: none !important; }';
document.head.appendChild(supportingStyle);
let record=null,revision=0,busy=false,last=null;
const id=()=>new URL(location.href).searchParams.get('recordId');
const selected=()=>manifest.find(m=>(m.legacy?m.file:'insolvency/'+m.file)===select.value);
function invalidate(){last=null;revision++;download.disabled=true;download.hidden=false;fileLink.hidden=true;if(fileLink.href.startsWith('blob:'))URL.revokeObjectURL(fileLink.href);fileLink.removeAttribute('href');message.textContent='';}
function refresh(){
 const m=selected();if(!m){warning.hidden=true;sourceStatus.hidden=true;return;}
 warning.hidden=false;sourceStatus.hidden=false;
 document.getElementById('ra-doc-title').textContent=m.title;document.getElementById('ra-doc-subtitle').textContent='Editable Word draft — completion required';document.getElementById('ra-generate-label').textContent='Generate Word draft';document.querySelector('#ra-selected span').textContent=m.title;
 const ready=record&&record.id===id();
 const connectionIncomplete=ready&&!['pdcMC','cFyUw'].some(k=>Object.prototype.hasOwnProperty.call(record.fields,k));
 sourceStatus.textContent=ready?(connectionIncomplete?'Warning: Softr is not sending all matter fields. These drafts may omit information held in the database. Fix the source connection before relying on auto-fill.':'Using available fields from the selected matter. Unavailable information will be highlighted in Word.'):'Loading selected matter data…';
 if(ready){const extra=core.draftData(record.fields);sourceStatus.textContent+=' Invoice rows: '+(extra.invoices?.length||0)+'. Service deponent: '+(extra.demand_service?.deponent||'not recorded')+'.';}
 if(ready){
  const data=core.build(record.fields,['company_name','creditor_name','matter_reference','company_acn','debt_amount','registered_office','total_num','interest_num']);
  const show=v=>String(v).includes('[COMPLETE:')?'Complete in Word':v;
  document.getElementById('ra-matter-title').textContent=show(data.company_name);
  document.getElementById('ra-matter-subtitle').textContent=show(data.creditor_name)+' vs '+show(data.company_name);
  for(const [key,v] of Object.entries({'ra-actionstep-id':data.matter_reference,'ra-client-name':data.creditor_name,'ra-debtor-acn':data.company_acn,'ra-registered-office':data.registered_office,'ra-debt-amount':data.debt_amount,'ra-balance-outstanding':data.debt_amount,'ra-total-debt':data.total_num,'ra-interest':data.interest_num,'ra-trading-as':core.scalar(record.fields.ju8al)||'Complete in Word','ra-debtor-abn':core.scalar(record.fields.ZgxtS)||'Complete in Word'})){const n=document.getElementById(key);if(n)n.textContent=show(v);}
 }else{
  document.getElementById('ra-matter-title').textContent='Loading matter…';
  document.getElementById('ra-matter-subtitle').textContent='';
  for(const key of ['ra-actionstep-id','ra-client-name','ra-debtor-acn','ra-registered-office','ra-debt-amount','ra-balance-outstanding','ra-total-debt','ra-interest','ra-trading-as','ra-debtor-abn']){const n=document.getElementById(key);if(n)n.textContent='';}
 }
 btn.disabled=busy||!ready;download.disabled=busy||!last;download.hidden=!!last;fileLink.hidden=!last;
}
function receive(e){
 const d=e.detail;if(!d||String(d.id)!==id()||!d.fields||typeof d.fields!=='object')return;
 const next={id:String(d.id),fields:d.fields};
 if(JSON.stringify(record)!==JSON.stringify(next)){record=next;invalidate();}refresh();
}
window.addEventListener('get-record-item-details1',receive);
select.addEventListener('change',e=>{invalidate();message.textContent='';if(selected()){e.stopImmediatePropagation();refresh();}else{warning.hidden=true;sourceStatus.hidden=true;btn.disabled=false;download.disabled=false;}},true);
function save(){if(!fileLink.hasAttribute('href')){fileLink.href=URL.createObjectURL(last.blob);fileLink.download=last.filename;}fileLink.hidden=false;download.hidden=true;fileLink.click();}
async function generate(){
 const m=selected();if(!m||busy)return;
 if(!record||record.id!==id()){message.textContent='Matter data has not loaded. Refresh the page and try again.';return;}
 const issues=core.review(record.fields,m.fields);
 if(issues.length){message.className='err';message.textContent=issues.join(' ');return;}
 invalidate();const start=revision,snapshot=JSON.parse(JSON.stringify(record)),file=select.value;busy=true;refresh();message.className='';message.textContent='Preparing highlighted Word draft…';
 try{
  const response=await fetch(base+(m.path||file),{cache:'no-cache'});if(!response.ok)throw Error('Template could not be loaded ('+response.status+').');
  const buffer=await response.arrayBuffer();const PZ=window.PizZip?.default||window.PizZip,DT=window.docxtemplater||window.Docxtemplater;
  if(!PZ||!DT)throw Error('Document libraries have not loaded. Refresh and retry.');
  const result=core.render(buffer,snapshot.fields,m.fields,PZ,DT);
  if(start!==revision||snapshot.id!==id()||file!==select.value)throw Error('The matter or template changed. Generate a fresh draft.');
  const ref=core.scalar(snapshot.fields.piayF)||snapshot.id;
  last={blob:result.zip.generate({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),filename:('DRAFT - '+m.title+' - '+ref).replace(/[\\/:*?"<>|]/g,' ')+'.docx',id:snapshot.id,file};
  save();message.className='ok';message.textContent='Word draft ready. '+result.count+' highlighted instructions require completion or review. Not ready for signing, service or filing.';
 }catch(e){last=null;message.className='err';message.textContent=e.message;}
 finally{busy=false;refresh();}
}
btn.addEventListener('click',e=>{if(!selected())return;e.preventDefault();e.stopImmediatePropagation();generate();},true);
download.addEventListener('click',e=>{if(!selected())return;e.preventDefault();e.stopImmediatePropagation();if(last&&last.id===id()&&last.file===select.value)save();else generate();},true);
window.addEventListener('popstate',()=>{record=null;invalidate();refresh();window.dispatchEvent(new CustomEvent('reload-block-item-details1'));});
// Do not carry a cached document across SPA matter navigation, including pushState changes.
let lastId=id();setInterval(()=>{if(lastId!==id()){lastId=id();record=null;invalidate();refresh();window.dispatchEvent(new CustomEvent('reload-block-item-details1'));}},400);
// Start on the new group so the newly added documents are immediately discoverable.
select.value='insolvency/'+manifest[0].file;refresh();
setTimeout(refresh,2800);
window.dispatchEvent(new CustomEvent('reload-block-item-details1'));
setTimeout(()=>{if(!record){sourceStatus.textContent='Matter data did not arrive. Reload this page before generating a draft.';}},12000);
})();
