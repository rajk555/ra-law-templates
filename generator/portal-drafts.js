/* RA Law draft-only merge helpers. No client data or credentials are stored here. */
(function(root){
'use strict';
const labels={company_name:'Company name',company_acn:'Company ACN',creditor_name:'Creditor name',creditor_acn:'Creditor ACN',matter_reference:'Matter reference',registered_office:'Registered office',registered_office_line1:'Office address line 1',registered_office_line2:'Office address line 2',lawyer_name:'Lawyer name',lawyer_email:'Lawyer email',liquidator1_name:'Liquidator 1',liquidator2_name:'Liquidator 2',support_deponent:'Support deponent',service_deponent:'Service deponent',demand_deponent:'Demand deponent',demand_service_deponent:'Demand service deponent',witness_name:'Witness name',witness_capacity:'Witness capacity',witness_address:'Witness address',debt_amount:'Debt amount',debt_amount_words:'Debt amount in words'};
function label(key){return labels[key]||key.replace(/(\d)/g,' $1').replace(/_/g,' ').replace(/^./,s=>s.toUpperCase());}
Object.assign(labels,{firm_address_line1:'Firm street',firm_address_line2:'Firm locality',firm_secondary_address_line1:'Second office street',firm_secondary_address_line2:'Second office locality',court_number:'Court #',document_date:'Doc date',invoice1_amount_display:'Invoice 1 amount',invoice2_amount_display:'Invoice 2 amount',invoice3_amount_display:'Invoice 3 amount'});
Object.assign(labels,{application_filing_date:'Filing date',application_post_date:'Post date',application_service_date:'Service date',asic_notice_date:'ASIC date'});
function scalar(v){
 if(Array.isArray(v))return v.length===1?scalar(v[0]):'';
 if(v&&typeof v==='object')return scalar(v.value??v.text??v.name??v.label);
 if(v==null||typeof v==='boolean')return '';
 const s=String(v).trim();return /^(?:n\/a|null|undefined|-)$/i.test(s)||s.includes('{{')?'':s;
}
function amount(v){const s=scalar(v);if(!/^(?:AUD\s*|\$\s*)?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(s))return null;
 const n=Number(s.replace(/AUD|\$|\s|,/g,''));return Number.isFinite(n)&&n>0?n:null;}
function build(fields,keys){
 const f=id=>scalar(fields[id]);
 const first=(...ids)=>ids.map(f).find(Boolean)||'';
 const entity=(...ids)=>{const s=first(...ids);return /[A-Za-z]/.test(s)?s:'';};
 const acn=(...ids)=>{const s=first(...ids).replace(/\s/g,'');return /^\d{9}$/.test(s)?s.replace(/(\d{3})(\d{3})(\d{3})/,'$1 $2 $3'):'';};
 const value={company_name:entity('pdcMC','cFyUw'),company_acn:acn('Y3hnB','aw2IJ'),creditor_name:entity('pv1e9','N154p','UPOSo'),creditor_acn:acn('zfO7s'),matter_reference:f('piayF'),signing_firm:'RA Law Group'};
 const missing=k=>'[COMPLETE: '+label(k)+']';
 // Full address fields may be used verbatim; never mistake a partial street for a complete address.
 const ro1=f('eoemZ'),ro2=f('wAXru'),suburb=f('PsLSO'),state=f('FZjOg'),postcode=f('U1Hxo');
 value.registered_office_line1=ro1;
 value.registered_office_line2=[ro2,suburb||'[COMPLETE: Office suburb]',state||'[COMPLETE: Office state]',postcode||'[COMPLETE: Office postcode]'].filter(Boolean).join(' ');
 value.registered_office=f('4p4R9')||[(ro1||missing('registered_office_line1')),value.registered_office_line2].join(', ');
 value.creditor_address=f('NFlpp')||[f('CSfMZ')||'[COMPLETE: Creditor street]',f('ylQRX'),f('ylg5n')||'[COMPLETE: Creditor suburb]',f('CKTGZ')||'[COMPLETE: Creditor state]',f('CxPJc')||'[COMPLETE: Creditor postcode]'].filter(Boolean).join(', ');
 // A role lookup ID is not a person's name. Do not borrow contact emails from the client.
 value.lawyer_name=entity('HDqgG');value.responsible_partner=entity('hcSWn');value.contact_name=value.lawyer_name;
 const balances=['dXAgP','5D208'].map(f).filter(Boolean),nums=balances.map(amount);
 if(balances.length&&nums.every(n=>n!==null)&&nums.every(n=>n===nums[0]))value.debt_amount=nums[0].toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2});
 else if(balances.length)value.debt_amount='[VERIFY: Debt amount]';
 // Court/service/sworn dates, witnesses, liquidators, schedules and legal facts have no verified mapping.
 const result={};keys.forEach(k=>result[k]=value[k]||missing(k));return result;
}
const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
function mergeNotes(zip,data){
 for(const part of ['word/footnotes.xml','word/endnotes.xml']){
  if(!zip.file(part))continue;
  const doc=new DOMParser().parseFromString(zip.file(part).asText(),'application/xml');
  for(const p of Array.from(doc.getElementsByTagNameNS(ns,'p'))){
   const nodes=Array.from(p.getElementsByTagNameNS(ns,'t'));const text=nodes.map(n=>n.textContent).join('');
   for(const m of Array.from(text.matchAll(/\{([a-z0-9_]+)\}/g)).reverse()){
    if(!(m[1] in data))throw Error('Unknown note field '+m[1]);
    let pos=0,inserted=false;
    for(const n of nodes){const s=n.textContent,end=pos+s.length;
     if(pos<m.index+m[0].length&&end>m.index){n.textContent=s.slice(0,Math.max(0,m.index-pos))+(inserted?'':data[m[1]])+s.slice(Math.min(s.length,m.index+m[0].length-pos));n.setAttribute('xml:space','preserve');inserted=true;}pos=end;}
   }
  }
  zip.file(part,new XMLSerializer().serializeToString(doc));
 }
}
function highlight(zip){
 let count=0;
 for(const part of Object.keys(zip.files).filter(n=>/^word\/(document|header\d+|footer\d+|footnotes|endnotes)\.xml$/.test(n))){
  const doc=new DOMParser().parseFromString(zip.file(part).asText(),'application/xml');
  for(const t of Array.from(doc.getElementsByTagNameNS(ns,'t'))){
   const s=t.textContent;const matches=Array.from(s.matchAll(/\[(?:COMPLETE|VERIFY):[^\]]+\]/g));if(!matches.length)continue;
   const r=t.parentNode;if(r.localName!=='r')throw Error('Unexpected marker location');
   // Split one text-only run so only the instructions are yellow, not the surrounding prose.
   const contents=Array.from(r.childNodes).filter(n=>n.nodeType===1&&n.localName!=='rPr');
   if(contents.length!==1){
    let pr=Array.from(r.childNodes).find(n=>n.localName==='rPr');if(!pr){pr=doc.createElementNS(ns,'w:rPr');r.insertBefore(pr,r.firstChild);}
    const h=doc.createElementNS(ns,'w:highlight');h.setAttributeNS(ns,'w:val','yellow');pr.appendChild(h);count+=matches.length;continue;
   }
   let pos=0;const chunks=[];
   for(const m of matches){if(m.index>pos)chunks.push([s.slice(pos,m.index),false]);chunks.push([m[0],true]);pos=m.index+m[0].length;}if(pos<s.length)chunks.push([s.slice(pos),false]);
   for(const [text,mark]of chunks){const nr=r.cloneNode(false);const pr0=Array.from(r.childNodes).find(n=>n.localName==='rPr');let pr=pr0?pr0.cloneNode(true):doc.createElementNS(ns,'w:rPr');
    for(const h of Array.from(pr.getElementsByTagNameNS(ns,'highlight')))pr.removeChild(h);
    if(mark){for(const sh of Array.from(pr.getElementsByTagNameNS(ns,'shd')))pr.removeChild(sh);const h=doc.createElementNS(ns,'w:highlight');h.setAttributeNS(ns,'w:val','yellow');pr.appendChild(h);const sh=doc.createElementNS(ns,'w:shd');sh.setAttributeNS(ns,'w:val','clear');sh.setAttributeNS(ns,'w:fill','FFFF00');pr.appendChild(sh);for(const col of Array.from(pr.getElementsByTagNameNS(ns,'color')))pr.removeChild(col);const col=doc.createElementNS(ns,'w:color');col.setAttributeNS(ns,'w:val','9C0006');pr.appendChild(col);count++;}
    nr.appendChild(pr);const nt=doc.createElementNS(ns,'w:t');nt.setAttribute('xml:space','preserve');nt.textContent=text;nr.appendChild(nt);r.parentNode.insertBefore(nr,r);
   }r.parentNode.removeChild(r);
  }
  zip.file(part,new XMLSerializer().serializeToString(doc));
 }
 return count;
}
function render(buffer,fields,keys,PZ,DT){
 const data=build(fields,keys);const zip=new PZ(buffer);mergeNotes(zip,data);
 const doc=new DT(zip,{paragraphLoop:true,linebreaks:true,nullGetter(p){throw Error('Unmapped field '+p.value);}});doc.render(data);
 const result=doc.getZip();const count=highlight(result);return {zip:result,data,count};
}
root.RADraftCore={build,render,highlight,label,scalar,amount};
if(typeof module!=='undefined')module.exports=root.RADraftCore;
})(typeof window!=='undefined'?window:globalThis);

window.RADraftManifest=[{"file":"consent-of-1x-liquidator.docx","title":"Consent of one liquidator","fields":["company_acn","company_name","consent_date","court_number","creditor_acn","creditor_name","document_date","firm_address_line1","firm_address_line2","lawyer_email","lawyer_name","liquidator1_name","liquidator_address","liquidator_state","matter_reference"]},{"file":"consent-of-2x-liquidators.docx","title":"Consent of two liquidators","fields":["company_acn","company_name","consent_date","court_number","creditor_acn","creditor_name","document_date","firm_address_line1","firm_address_line2","lawyer_email","lawyer_name","liquidator1_name","liquidator2_name","liquidator_address","liquidator_firm","liquidator_state","matter_reference"]},{"file":"stat-demand-and-supporting-affidavit.docx","title":"Statutory demand and supporting affidavit","fields":["affirmation_place","affirmation_state","company_acn","company_name","creditor_address","creditor_name","debt_amount","debt_amount_words","demand_affidavit_date","demand_deponent","deponent_address","document_date","firm_address_line1","firm_address_line2","invoice1_amount_display","invoice1_description","invoice2_amount_display","invoice2_description","invoice3_amount_display","invoice3_description","lawyer_email","lawyer_name","registered_office","signing_firm"]},{"file":"stat-demand-post-judgment.docx","title":"Statutory demand following judgment","fields":["company_acn","company_name","creditor_address","creditor_name","debt_amount","debt_amount_words","document_date","firm_address_line1","firm_address_line2","judgment_court","judgment_date","judgment_registry","judgment_state","lawyer_email","lawyer_name","registered_office","signing_firm"]},{"file":"affidavit-in-support-of-winding-up.docx","title":"Affidavit supporting winding up","fields":["affirmation_place","affirmation_state","company_acn","company_name","court_number","creditor_acn","creditor_name","creditor_registration_state","debt_amount","debt_as_at_date","debt_description","demand_instruction_date","demand_service_date","deponent_address","deponent_role","document_date","firm_address_line1","firm_address_line2","lawyer_email","lawyer_name","matter_reference","support_affidavit_date","support_deponent","support_exhibit","witness_address","witness_capacity","witness_name"]},{"file":"affidavit-of-service-of-wind-up.docx","title":"Affidavit of service of winding up","fields":["affirmation_place","affirmation_state","application_filing_date","application_post_date","asic_extract_date","asic_recheck_date","company_acn","company_name","consent_filing_date","court_number","creditor_acn","creditor_name","demand_service_affidavit_date","demand_service_deponent","deponent_address","deponent_role","document_date","firm_address_line1","firm_address_line2","lawyer_email","lawyer_name","matter_reference","posting_location","posting_time","registered_office","service_affidavit_date","service_deponent","service_exhibit","support_affidavit_date","support_deponent","witness_address","witness_capacity","witness_name"]},{"file":"letter-serving-wind-up-application.docx","title":"Letter serving winding-up application","fields":["application_filing_date","company_acn","company_name","consent_filing_date","contact_name","contact_phone","court_number","creditor_name","demand_service_affidavit_date","demand_service_deponent","document_date","firm_phone","hearing_date","hearing_time","lawyer_email","matter_reference","registered_office_line1","registered_office_line2","responsible_partner","support_affidavit_date","support_deponent"]},{"file":"wind-up-application.docx","title":"Winding-up application","fields":["company_acn","company_name","court_number","creditor_acn","creditor_name","demand_post_date","demand_service_deponent","document_date","firm_address_line1","firm_address_line2","firm_phone","firm_secondary_address_line1","firm_secondary_address_line2","hearing_date","hearing_time","lawyer_email","lawyer_name","liquidator1_name","matter_reference","registered_office","registered_office_line1","registered_office_line2"]},{"file":"submissions-winding-up-application.docx","title":"Submissions for winding-up application","fields":["application_filing_date","application_post_date","application_service_date","asic_extract_date","asic_notice_date","company_acn","company_name","compliance_deadline","court_number","creditor_acn","creditor_name","debt_amount","debt_as_at_date","demand_affidavit_date","demand_date","demand_deponent","demand_post_date","demand_service_affidavit_date","demand_service_date","demand_service_deponent","demand_service_exhibit","document_date","firm_address_line1","firm_address_line2","lawyer_email","lawyer_name","liquidator1_name","matter_reference","presumption_date","registered_office","service_affidavit_date","service_deponent","service_exhibit","support_affidavit_date","support_deponent"]}];
/* Appended to the existing Softr generator. The original eight options are retained. */
(function(){
'use strict';
if(document.getElementById('ra-draft-warning'))return;
const core=window.RADraftCore,manifest=window.RADraftManifest;
const source=document.currentScript.src;const base=new URL('../',source).href;
const wrap=document.getElementById('ra-wrap'),select=document.getElementById('ra-doc-select'),btn=document.getElementById('ra-btn'),download=document.getElementById('ra-download-btn'),message=document.getElementById('ra-msg');
if(!core||!manifest||!wrap||!select||!btn||!download)return;
const group=document.createElement('optgroup');group.label='RA Law Group — Statutory demands and winding up';
manifest.forEach(m=>{const o=document.createElement('option');o.value='insolvency/'+m.file;o.textContent=m.title;group.appendChild(o);});select.appendChild(group);
const warning=document.createElement('p');warning.id='ra-draft-warning';warning.style.cssText='background:#fff8cc;color:#332800;padding:12px;border-radius:6px;font-size:14px;line-height:1.5';
warning.textContent='Draft Word documents: complete every yellow [COMPLETE: …] field and check every [VERIFY: …] instruction after downloading. Check all legal wording and facts, attach required exhibits, and remove the instructions before signing, serving or filing.';
wrap.insertBefore(warning,document.getElementById('ra-template-row'));
const sourceStatus=document.createElement('p');sourceStatus.id='ra-draft-source';sourceStatus.style.cssText='font-size:13px;color:#555';warning.after(sourceStatus);
let record=null,revision=0,busy=false,last=null;
const id=()=>new URL(location.href).searchParams.get('recordId');
const selected=()=>manifest.find(m=>'insolvency/'+m.file===select.value);
function invalidate(){last=null;revision++;download.disabled=true;}
function refresh(){
 const m=selected();if(!m){warning.hidden=true;sourceStatus.hidden=true;return;}
 warning.hidden=false;sourceStatus.hidden=false;
 document.getElementById('ra-doc-title').textContent=m.title;document.getElementById('ra-doc-subtitle').textContent='Editable Word draft — completion required';document.getElementById('ra-generate-label').textContent='Generate Word draft';document.querySelector('#ra-selected span').textContent=m.title;
 const ready=record&&record.id===id();sourceStatus.textContent=ready?'Using available fields from the selected matter. Unavailable information will be highlighted in Word.':'Loading selected matter data…';
 if(ready){
  const data=core.build(record.fields,['company_name','creditor_name','matter_reference','company_acn','debt_amount','registered_office']);
  const show=v=>String(v).includes('[COMPLETE:')?'Complete in Word':v;
  document.getElementById('ra-matter-title').textContent=show(data.company_name);
  document.getElementById('ra-matter-subtitle').textContent=show(data.creditor_name)+' vs '+show(data.company_name);
  for(const [key,v] of Object.entries({'ra-actionstep-id':data.matter_reference,'ra-client-name':data.creditor_name,'ra-debtor-acn':data.company_acn,'ra-registered-office':data.registered_office,'ra-debt-amount':data.debt_amount,'ra-balance-outstanding':data.debt_amount,'ra-total-debt':'Complete in Word','ra-interest':'Complete in Word','ra-trading-as':core.scalar(record.fields.ju8al)||'Complete in Word','ra-debtor-abn':core.scalar(record.fields.ZgxtS)||'Complete in Word'})){const n=document.getElementById(key);if(n)n.textContent=show(v);}
 }
 btn.disabled=busy||!ready;download.disabled=busy||!last;
}
function receive(e){
 const d=e.detail;if(!d||String(d.id)!==id()||!d.fields||typeof d.fields!=='object')return;
 const next={id:String(d.id),fields:d.fields};
 if(JSON.stringify(record)!==JSON.stringify(next)){record=next;invalidate();}refresh();
}
window.addEventListener('get-record-item-details1',receive);
select.addEventListener('change',e=>{invalidate();message.textContent='';if(selected()){e.stopImmediatePropagation();refresh();}else{warning.hidden=true;sourceStatus.hidden=true;btn.disabled=false;download.disabled=false;}},true);
function save(){const u=URL.createObjectURL(last.blob),a=document.createElement('a');a.href=u;a.download=last.filename;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
async function generate(){
 const m=selected();if(!m||busy)return;
 if(!record||record.id!==id()){message.textContent='Matter data has not loaded. Refresh the page and try again.';return;}
 invalidate();const start=revision,snapshot=JSON.parse(JSON.stringify(record)),file=select.value;busy=true;refresh();message.className='';message.textContent='Preparing highlighted Word draft…';
 try{
  const response=await fetch(base+file,{cache:'no-cache'});if(!response.ok)throw Error('Template could not be loaded ('+response.status+').');
  const buffer=await response.arrayBuffer();const PZ=window.PizZip?.default||window.PizZip,DT=window.docxtemplater||window.Docxtemplater;
  if(!PZ||!DT)throw Error('Document libraries have not loaded. Refresh and retry.');
  const result=core.render(buffer,snapshot.fields,m.fields,PZ,DT);
  if(start!==revision||snapshot.id!==id()||file!==select.value)throw Error('The matter or template changed. Generate a fresh draft.');
  const ref=core.scalar(snapshot.fields.piayF)||snapshot.id;
  last={blob:result.zip.generate({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),filename:('DRAFT - '+m.title+' - '+ref).replace(/[\\/:*?"<>|]/g,' ')+'.docx',id:snapshot.id,file};
  save();message.className='ok';message.textContent='Word draft downloaded. '+result.count+' highlighted instructions require completion or review. Not ready for signing, service or filing.';
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
