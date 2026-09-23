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
