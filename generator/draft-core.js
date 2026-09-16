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
