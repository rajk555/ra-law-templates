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
function date(v){
 const s=scalar(v),m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)||s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z)?$/);
 if(!m)return '';const iso=m[1].length===4,y=Number(iso?m[1]:m[3]),mo=Number(m[2]),d=Number(iso?m[3]:m[1]);
 const dt=new Date(Date.UTC(y,mo-1,d));return dt.getUTCFullYear()===y&&dt.getUTCMonth()===mo-1&&dt.getUTCDate()===d?String(d).padStart(2,'0')+'/'+String(mo).padStart(2,'0')+'/'+y:'';
}
function build(fields,keys){
 const f=id=>scalar(fields[id]);
 const first=(...ids)=>ids.map(f).find(Boolean)||'';
 const entity=(...ids)=>{const s=first(...ids);return /[A-Za-z]/.test(s)?s:'';};
 const acn=(...ids)=>{const s=first(...ids).replace(/\s/g,'');return /^\d{9}$/.test(s)?s.replace(/(\d{3})(\d{3})(\d{3})/,'$1 $2 $3'):'';};
 const value={company_name:entity('pdcMC','cFyUw'),company_acn:acn('Y3hnB','aw2IJ'),creditor_name:entity('pv1e9','N154p','UPOSo'),creditor_acn:acn('zfO7s'),matter_reference:f('piayF'),signing_firm:'RA Law Group'};
 const missing=k=>'[COMPLETE: '+label(k)+']';
 // Full address fields may be used verbatim; never mistake a partial street for a complete address.
 const postal=s=>/^\d{1,2},\d{3}$/.test(s)?s.replace(',',''):s;
 const ro1=f('eoemZ'),ro2=f('wAXru'),suburb=f('PsLSO'),state=f('FZjOg'),postcode=postal(f('U1Hxo'));
 value.registered_office_line1=ro1;
 value.registered_office_line2=[ro2,suburb||'[COMPLETE: Office suburb]',state||'[COMPLETE: Office state]',postcode||'[COMPLETE: Office postcode]'].filter(Boolean).join(' ');
 value.registered_office=f('4p4R9')||[(ro1||missing('registered_office_line1')),value.registered_office_line2].join(', ');
 value.creditor_address=f('NFlpp')||[f('CSfMZ')||'[COMPLETE: Creditor street]',f('ylQRX'),f('ylg5n')||'[COMPLETE: Creditor suburb]',f('CKTGZ')||'[COMPLETE: Creditor state]',postal(f('CxPJc'))||'[COMPLETE: Creditor postcode]'].filter(Boolean).join(', ');
 // A role lookup ID is not a person's name. Do not borrow contact emails from the client.
 value.lawyer_name=entity('HDqgG');value.responsible_partner=entity('hcSWn');value.contact_name=value.lawyer_name;
 const money=n=>n.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2});
 // Current balance may legitimately differ from original debt after payments.
 // Never extract the first number from explanatory multi-matter text.
 const balance=f('dXAgP')||f('5D208'),principal=amount(balance);
 if(principal!==null)value.debt_amount=money(principal);
 else if(balance)value.debt_amount='[VERIFY: Debt amount]';
 const display=(name,number)=>[name||missing('company_name'),'ACN '+(number||missing('company_acn'))].join(' ');
 value.plaintiff_display=value.plaintiff_body=display(value.creditor_name||missing('creditor_name'),value.creditor_acn||missing('creditor_acn'));
 value.defendant1_name=display(value.company_name,value.company_acn);
 value.individual_defendant_name=value.company_name;
 value.plaintiff_addr1=value.creditor_address;value.plaintiff_addr2='';
 value.defendant1_addr1=value.registered_office;value.defendant1_addr2='';
 for(const [n,nameId,addressId] of [[2,'EY40W','2Q0MI'],[3,'nnbwQ','l7YfE']]){
  value['defendant'+n+'_name']=entity(nameId)||missing('guarantor'+(n-1)+'_name');
  value['defendant'+n+'_addr1']=f(addressId)||missing('guarantor'+(n-1)+'_address');
  value['defendant'+n+'_addr2']='';
 }
 value.reference=value.matter_reference;value.defendant1_trading_name=f('ju8al');
 const trading=f('UPOSo').match(/\bt\s*\/?\s*a(?:s)?\s+(.+)$/i);value.plaintiff_trading_name=trading?trading[1]:'';
 value.doc_title='Complaint — '+(value.creditor_name||missing('creditor_name'))+' v '+(value.company_name||missing('company_name'));
 for(const [k,field]of [['contract_date','IN7Ei'],['debt_overdue_date','QVl3u'],['debt_date_from_fmt','7bili'],['debt_date_to_fmt','yce8V']])value[k]=date(f(field))||(f(field)?'[VERIFY: '+label(k)+']':'');
 value.balance_num=value.debt_amount;
 const nonnegative=v=>scalar(v)==='0'||scalar(v)==='0.00'||scalar(v)==='$0.00'?0:amount(v);
 const interest=nonnegative(f('inDnp')),total=nonnegative(f('KErZI'));
 value.interest_num=interest!==null?money(interest):(f('inDnp')?'[VERIFY: Interest amount]':'');
 value.total_num=total!==null&&principal!==null&&total>=principal&&(interest===null||Math.abs(total-principal-interest)<0.005)?money(total):(f('KErZI')?'[VERIFY: Total debt]':'');
 value.days_in_arrears=/^\d+$/.test(f('Iqsgy'))?f('Iqsgy'):'';
 value.partial_payment_paragraph=f('y9fnb')?'[VERIFY: Payment history — '+f('y9fnb')+']':'[COMPLETE: Payment history or remove if no payments]';
 value.legal_review='[VERIFY: Correct parties, court, contract clauses, guarantee, service and legal basis before use]';
 // A contract date is not a guarantee execution date. Debt dates are not interest periods.
 value.guarantee_date='';value.interest_calculation='[COMPLETE: Interest period, rate, basis and calculation]';
 value.interest_rate='[VERIFY: Interest rate]';
 const optional=new Set(['plaintiff_addr2','defendant1_addr2','defendant2_addr2','defendant3_addr2']);
 // Court/service/sworn dates, witnesses, liquidators, schedules and legal facts have no verified mapping.
 const result={};keys.forEach(k=>result[k]=value[k]||(optional.has(k)?'':missing(k)));return result;
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
root.RADraftCore={build,render,highlight,label,scalar,amount,date};
if(typeof module!=='undefined')module.exports=root.RADraftCore;
})(typeof window!=='undefined'?window:globalThis);

window.RADraftManifest=[{"file":"consent-of-1x-liquidator.docx","title":"Consent of one liquidator","fields":["company_acn","company_name","consent_date","court_number","creditor_acn","creditor_name","document_date","firm_address_line1","firm_address_line2","lawyer_email","lawyer_name","liquidator1_name","liquidator_address","liquidator_state","matter_reference"],"path":"insolvency/consent-of-1x-liquidator.docx"},{"file":"consent-of-2x-liquidators.docx","title":"Consent of two liquidators","fields":["company_acn","company_name","consent_date","court_number","creditor_acn","creditor_name","document_date","firm_address_line1","firm_address_line2","lawyer_email","lawyer_name","liquidator1_name","liquidator2_name","liquidator_address","liquidator_firm","liquidator_state","matter_reference"],"path":"insolvency/consent-of-2x-liquidators.docx"},{"file":"stat-demand-and-supporting-affidavit.docx","title":"Statutory demand and supporting affidavit","fields":["affirmation_place","affirmation_state","company_acn","company_name","creditor_address","creditor_name","debt_amount","debt_amount_words","demand_affidavit_date","demand_deponent","deponent_address","document_date","firm_address_line1","firm_address_line2","invoice1_amount_display","invoice1_description","invoice2_amount_display","invoice2_description","invoice3_amount_display","invoice3_description","lawyer_email","lawyer_name","registered_office","signing_firm"],"path":"insolvency/stat-demand-and-supporting-affidavit.docx"},{"file":"stat-demand-post-judgment.docx","title":"Statutory demand following judgment","fields":["company_acn","company_name","creditor_address","creditor_name","debt_amount","debt_amount_words","document_date","firm_address_line1","firm_address_line2","judgment_court","judgment_date","judgment_registry","judgment_state","lawyer_email","lawyer_name","registered_office","signing_firm"],"path":"insolvency/stat-demand-post-judgment.docx"},{"file":"affidavit-in-support-of-winding-up.docx","title":"Affidavit supporting winding up","fields":["affirmation_place","affirmation_state","company_acn","company_name","court_number","creditor_acn","creditor_name","creditor_registration_state","debt_amount","debt_as_at_date","debt_description","demand_instruction_date","demand_service_date","deponent_address","deponent_role","document_date","firm_address_line1","firm_address_line2","lawyer_email","lawyer_name","matter_reference","support_affidavit_date","support_deponent","support_exhibit","witness_address","witness_capacity","witness_name"],"path":"insolvency/affidavit-in-support-of-winding-up.docx"},{"file":"affidavit-of-service-of-wind-up.docx","title":"Affidavit of service of winding up","fields":["affirmation_place","affirmation_state","application_filing_date","application_post_date","asic_extract_date","asic_recheck_date","company_acn","company_name","consent_filing_date","court_number","creditor_acn","creditor_name","demand_service_affidavit_date","demand_service_deponent","deponent_address","deponent_role","document_date","firm_address_line1","firm_address_line2","lawyer_email","lawyer_name","matter_reference","posting_location","posting_time","registered_office","service_affidavit_date","service_deponent","service_exhibit","support_affidavit_date","support_deponent","witness_address","witness_capacity","witness_name"],"path":"insolvency/affidavit-of-service-of-wind-up.docx"},{"file":"letter-serving-wind-up-application.docx","title":"Letter serving winding-up application","fields":["application_filing_date","company_acn","company_name","consent_filing_date","contact_name","contact_phone","court_number","creditor_name","demand_service_affidavit_date","demand_service_deponent","document_date","firm_phone","hearing_date","hearing_time","lawyer_email","matter_reference","registered_office_line1","registered_office_line2","responsible_partner","support_affidavit_date","support_deponent"],"path":"insolvency/letter-serving-wind-up-application.docx"},{"file":"wind-up-application.docx","title":"Winding-up application","fields":["company_acn","company_name","court_number","creditor_acn","creditor_name","demand_post_date","demand_service_deponent","document_date","firm_address_line1","firm_address_line2","firm_phone","firm_secondary_address_line1","firm_secondary_address_line2","hearing_date","hearing_time","lawyer_email","lawyer_name","liquidator1_name","matter_reference","registered_office","registered_office_line1","registered_office_line2"],"path":"repaired/wind-up-application.docx"},{"file":"submissions-winding-up-application.docx","title":"Submissions for winding-up application","fields":["application_filing_date","application_post_date","application_service_date","asic_extract_date","asic_notice_date","company_acn","company_name","compliance_deadline","court_number","creditor_acn","creditor_name","debt_amount","debt_as_at_date","demand_affidavit_date","demand_date","demand_deponent","demand_post_date","demand_service_affidavit_date","demand_service_date","demand_service_deponent","demand_service_exhibit","document_date","firm_address_line1","firm_address_line2","lawyer_email","lawyer_name","liquidator1_name","matter_reference","presumption_date","registered_office","service_affidavit_date","service_deponent","service_exhibit","support_affidavit_date","support_deponent"],"path":"insolvency/submissions-winding-up-application.docx"},{"file":"Complaint_Company1Guar_Template.docx","path":"repaired/Complaint_Company1Guar_Template.docx","legacy":true,"fields":["balance_num","contract_date","court_location","debt_date_from_fmt","debt_date_to_fmt","debt_overdue_date","doc_title","guarantee_date","interest_calculation","interest_num","legal_review","plaintiff_trading_name","reference","total_num"],"title":"Complaint - Company + 1 Guarantor"},{"file":"Complaint_Company2Guar_Template.docx","path":"repaired/Complaint_Company2Guar_Template.docx","legacy":true,"fields":["balance_num","contract_date","court_location","debt_date_from_fmt","debt_date_to_fmt","debt_overdue_date","doc_title","guarantee_date","interest_calculation","interest_num","legal_review","plaintiff_trading_name","reference","total_num"],"title":"Complaint - Company + 2 Guarantors"},{"file":"Complaint_SoleTrader1Guar_Template.docx","path":"repaired/Complaint_SoleTrader1Guar_Template.docx","legacy":true,"fields":["balance_num","contract_date","court_location","debt_date_from_fmt","debt_date_to_fmt","debt_overdue_date","defendant1_trading_name","doc_title","guarantee_date","interest_calculation","interest_num","legal_review","partial_payment_paragraph","plaintiff_trading_name","reference","total_num"],"title":"Complaint - Sole Trader + 1 Guarantor"},{"file":"Form4AB_1def_Template.docx","path":"repaired/Form4AB_1def_Template.docx","legacy":true,"fields":["court_location","court_number","defendant1_addr1","defendant1_addr2","doc_date","individual_defendant_name","lawyer_name","legal_review","plaintiff_addr1","plaintiff_addr2","plaintiff_body","plaintiff_display","reference"],"title":"Form 4AB - Individual Defendant Only"},{"file":"Form4AB_2def_Template.docx","path":"repaired/Form4AB_2def_Template.docx","legacy":true,"fields":["court_location","court_number","defendant1_addr1","defendant1_addr2","defendant1_name","defendant2_addr1","defendant2_addr2","defendant2_name","doc_date","lawyer_name","legal_review","plaintiff_addr1","plaintiff_addr2","plaintiff_body","plaintiff_display","reference"],"title":"Form 4AB - Company + 1 Guarantor"},{"file":"Form4AB_3def_Template.docx","path":"repaired/Form4AB_3def_Template.docx","legacy":true,"fields":["court_location","court_number","defendant1_addr1","defendant1_addr2","defendant1_name","defendant2_addr1","defendant2_addr2","defendant2_name","defendant3_addr1","defendant3_addr2","defendant3_name","doc_date","lawyer_name","legal_review","plaintiff_addr1","plaintiff_addr2","plaintiff_body","plaintiff_display","reference"],"title":"Form 4AB - Company + 2 Guarantors"},{"file":"Form4B_2def_Template.docx","path":"repaired/Form4B_2def_Template.docx","legacy":true,"fields":["court_location","court_number","defendant1_addr1","defendant1_addr2","defendant1_name","defendant2_addr1","defendant2_addr2","defendant2_name","doc_date","lawyer_name","legal_review","plaintiff_addr1","plaintiff_addr2","plaintiff_body","plaintiff_display","reference"],"title":"Form 4B - Company + 1 Guarantor"},{"file":"Form4B_3def_Template.docx","path":"repaired/Form4B_3def_Template.docx","legacy":true,"fields":["court_location","court_number","defendant1_addr1","defendant1_addr2","defendant1_name","defendant2_addr1","defendant2_addr2","defendant2_name","defendant3_addr1","defendant3_addr2","defendant3_name","doc_date","lawyer_name","legal_review","plaintiff_addr1","plaintiff_addr2","plaintiff_body","plaintiff_display","reference"],"title":"Form 4B - Company + 2 Guarantors"}];
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
const group=document.createElement('optgroup');group.label='RA Law Group — Statutory demands and winding up';
manifest.filter(m=>!m.legacy).forEach(m=>{const o=document.createElement('option');o.value='insolvency/'+m.file;o.textContent=m.title;group.appendChild(o);});select.appendChild(group);
const warning=document.createElement('p');warning.id='ra-draft-warning';warning.style.cssText='background:#fff8cc;color:#332800;padding:12px;border-radius:6px;font-size:14px;line-height:1.5';
warning.textContent='Draft Word documents: complete every yellow [COMPLETE: …] field and check every [VERIFY: …] instruction after downloading. Check all legal wording and facts, attach required exhibits, and remove the instructions before signing, serving or filing.';
wrap.insertBefore(warning,document.getElementById('ra-template-row'));
const sourceStatus=document.createElement('p');sourceStatus.id='ra-draft-source';sourceStatus.style.cssText='font-size:13px;color:#555';warning.after(sourceStatus);
let record=null,revision=0,busy=false,last=null;
const id=()=>new URL(location.href).searchParams.get('recordId');
const selected=()=>manifest.find(m=>(m.legacy?m.file:'insolvency/'+m.file)===select.value);
function invalidate(){last=null;revision++;download.disabled=true;message.textContent='';}
function refresh(){
 const m=selected();if(!m){warning.hidden=true;sourceStatus.hidden=true;return;}
 warning.hidden=false;sourceStatus.hidden=false;
 document.getElementById('ra-doc-title').textContent=m.title;document.getElementById('ra-doc-subtitle').textContent='Editable Word draft — completion required';document.getElementById('ra-generate-label').textContent='Generate Word draft';document.querySelector('#ra-selected span').textContent=m.title;
 const ready=record&&record.id===id();
 const connectionIncomplete=ready&&!['pdcMC','cFyUw'].some(k=>Object.prototype.hasOwnProperty.call(record.fields,k));
 sourceStatus.textContent=ready?(connectionIncomplete?'Warning: Softr is not sending all matter fields. These drafts may omit information held in the database. Fix the source connection before relying on auto-fill.':'Using available fields from the selected matter. Unavailable information will be highlighted in Word.'):'Loading selected matter data…';
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
  const response=await fetch(base+(m.path||file),{cache:'no-cache'});if(!response.ok)throw Error('Template could not be loaded ('+response.status+').');
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
