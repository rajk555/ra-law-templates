/* RA Law draft-only merge helpers. No client data or credentials are stored here. */
(function(root){
'use strict';
const labels={company_name:'Company name',company_acn:'Company ACN',creditor_name:'Creditor name',creditor_acn:'Creditor ACN',matter_reference:'Matter reference',registered_office:'Registered office',registered_office_line1:'Office address line 1',registered_office_line2:'Office address line 2',lawyer_name:'Lawyer name',lawyer_email:'Lawyer email',liquidator1_name:'Liquidator 1',liquidator2_name:'Liquidator 2',support_deponent:'Support deponent',service_deponent:'Service deponent',demand_deponent:'Demand deponent',demand_service_deponent:'Demand service deponent',witness_name:'Witness name',witness_capacity:'Witness capacity',witness_address:'Witness address',debt_amount:'Debt amount',debt_amount_words:'Debt amount in words'};
const approvedOffices={
 VIC:{state:'VIC',address_line1:'Level 40, 140 William Street',address_line2:'Melbourne VIC 3000',phone:'+61 3 9607 8345'},
 QLD:{state:'QLD',address_line1:'Level 2, 167 Eagle Street',address_line2:'Brisbane QLD 4000',phone:'+61 7 3180 1777',lawyer_name:'Paul Rojas',lawyer_email:'p.rojas@ralawgroup.com.au'}
};
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
function list(v){
 if(Array.isArray(v))return v.map(scalar);
 return scalar(v).split(/,\s*/).map(s=>s.trim()).filter(Boolean);
}
function sameName(a,b){return scalar(a).replace(/\s+-\s+[A-Za-z0-9_-]+$/,'').replace(/\s+/g,' ').toLowerCase()===scalar(b).replace(/\s+/g,' ').toLowerCase();}
function draftData(fields){
 // Only consume an explicit drafting schema, never arbitrary extracted text or names.
 const candidates=[fields.ra_draft_data,fields['Draft Data'],fields['Drafting Data'],fields.LfWh7,fields.dReQF,fields.hw9CZ,fields.r6sLt];
 for(const v of Object.values(fields))if(typeof v==='string'&&(/^\s*\{/.test(v)))candidates.push(v);
 for(let v of candidates){
  if(typeof v==='string'){try{v=JSON.parse(v);}catch(_){continue;}}
  if(v&&typeof v==='object'&&!Array.isArray(v)&&v.schema==='ra_draft_data_v1')return v;
  if(v&&typeof v==='object'&&!Array.isArray(v)&&(Array.isArray(v.invoices)||v.demand_service)){
   return {...v,creditor:v.creditor||{name:v.plaintiff,acn:v.plaintiffACN||v.plaintiffAcn},
    invoices:(v.invoices||[]).map(i=>({...i,description:scalar(i.description)||[scalar(i.no||i.number)?'Invoice '+scalar(i.no||i.number):'',date(i.date)?'dated '+date(i.date):''].filter(Boolean).join(' ')})),
    debt:v.debt&&typeof v.debt==='object'?v.debt:{claim_amount:v.totalClaimEmail||v.csdAmount,collection_costs:v.collectionCostsEmail||v.collectionCosts,legal_costs:v.legalCosts,source_totals:[{source:'Instructions',amount:v.totalClaimEmail},{source:'Debt summary',amount:v.totalClaimTable}]},
    demand_service:v.demand_service||{deponent:v.demandServiceDeponent,post_date:v.demandPostDate,service_date:v.demandServiceDate,affidavit_date:v.demandServiceAffidavitDate}};
  }
 }
 return {};
}
function parties(fields,extra){
 const names=list(fields.pv1e9),numbers=list(fields.zfO7s);
 // UPOSo is the matter's explicit Plaintiff; linked Client lookups may include referrers.
 const explicit=scalar(extra.creditor?.name)||scalar(fields.UPOSo)||scalar(fields['Plaintiff']);
 const selected=explicit||((names.length===1)?names[0]:'');
 const index=names.findIndex(n=>sameName(n,selected));
 const one=key=>{const values=list(fields[key]);return index>=0&&values.length===names.length?values[index]:(names.length<=1&&values.length<=1?values[0]||'':'');};
 const number=scalar(extra.creditor?.acn)||(index>=0&&numbers.length===names.length?numbers[index]:(names.length<=1&&numbers.length===1?numbers[0]:''));
 return {name:selected,acn:number,address:scalar(extra.creditor?.address)||one('NFlpp'),street:one('CSfMZ')||one('ylQRX'),suburb:one('ylg5n'),state:one('CKTGZ'),postcode:one('CxPJc'),ambiguous:!/[A-Za-z]/.test(selected)||names.length>1&&index<0&&!extra.creditor?.acn};
}
function review(fields,keys){
 const extra=draftData(fields),p=parties(fields,extra),issues=[];
 if(p.ambiguous)issues.push('Select one creditor in the Plaintiff field and provide its matching ACN/address. The referring agency must remain separate.');
 if(/creditor_acn|plaintiff_display|plaintiff_body/.test(keys.join(' '))&&!/^\d{9}$/.test(p.acn.replace(/\s/g,'')))issues.push('The selected creditor needs one valid nine-digit ACN.');
 const invoices=extra.invoices;
 if(Array.isArray(invoices)&&invoices.length>3&&keys.some(k=>/^invoice\d/.test(k)))issues.push('This precedent has three invoice rows. Use a precedent with a full invoice schedule for more than three invoices.');
 if(Array.isArray(invoices)&&keys.some(k=>/^invoice\d/.test(k))&&invoices.some(i=>!scalar(i.description)||amount(i.amount)===null))issues.push('Each invoice needs a description and a valid amount.');
 if(Array.isArray(invoices)&&invoices.length&&keys.some(k=>/^invoice\d/.test(k))){
  const sum=invoices.reduce((n,i)=>n+(amount(i.amount)||0),0)+(amount(extra.debt?.collection_costs)||0)+(amount(extra.debt?.legal_costs)||0);
  const claim=amount(extra.debt?.claim_amount??fields.dXAgP);
  if(claim!==null&&Math.abs(sum-claim)>.005)issues.push('The invoice schedule and recorded costs do not add up to the claim amount. Reconcile the breakdown before generating.');
 }
 const claim=amount(extra.debt?.claim_amount??fields.dXAgP),sourceTotals=extra.debt?.source_totals||[];
 if(claim!==null&&sourceTotals.some(s=>amount(s.amount)!==null&&Math.abs(amount(s.amount)-claim)>.005)&&!scalar(extra.debt?.reconciliation))issues.push('The source documents disagree on the claim amount. Record the reconciliation before generating.');
 if(/\b(?:confirm|discrepan|conflict)\b/i.test(scalar(fields.y9fnb))&&!scalar(extra.debt?.reconciliation))issues.push('The matter payment/debt notes flag conflicting amounts. Reconcile them before generating.');
 return [...new Set(issues)];
}
function build(fields,keys){
 const f=id=>scalar(fields[id]);
 const first=(...ids)=>ids.map(f).find(Boolean)||'';
 const entity=(...ids)=>{const s=first(...ids);return /[A-Za-z]/.test(s)?s:'';};
 const acn=(...ids)=>{const s=first(...ids).replace(/\s/g,'');return /^\d{9}$/.test(s)?s.replace(/(\d{3})(\d{3})(\d{3})/,'$1 $2 $3'):'';};
 const extra=draftData(fields),party=parties(fields,extra);
 const value={company_name:entity('pdcMC','cFyUw'),company_acn:acn('Y3hnB','aw2IJ'),creditor_name:party.name,creditor_acn:acnValue(party.acn),matter_reference:f('piayF'),signing_firm:'RA Law Group'};
 const missing=k=>'[COMPLETE: '+label(k)+']';
 // Full address fields may be used verbatim; never mistake a partial street for a complete address.
 const postal=s=>/^\d{1,2},\d{3}$/.test(s)?s.replace(',',''):s;
 const ro1=f('eoemZ'),ro2=f('wAXru'),suburb=f('PsLSO'),state=f('FZjOg'),postcode=postal(f('U1Hxo'));
 value.registered_office_line1=ro1;
 value.registered_office_line2=[ro2,suburb||'[COMPLETE: Office suburb]',state||'[COMPLETE: Office state]',postcode||'[COMPLETE: Office postcode]'].filter(Boolean).join(' ');
 value.registered_office=f('4p4R9')||[(ro1||missing('registered_office_line1')),value.registered_office_line2].join(', ');
 value.creditor_address=party.address||[party.street||'[COMPLETE: Creditor street]',party.suburb||'[COMPLETE: Creditor suburb]',party.state||'[COMPLETE: Creditor state]',postal(party.postcode)||'[COMPLETE: Creditor postcode]'].filter(Boolean).join(', ');
 // A role lookup ID is not a person's name. Do not borrow contact emails from the client.
 value.lawyer_name=entity('HDqgG');value.responsible_partner=entity('hcSWn');value.contact_name=value.lawyer_name;
 const money=n=>n.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2});
 // Current balance may legitimately differ from original debt after payments.
 // Never extract the first number from explanatory multi-matter text.
 const balance=scalar(extra.debt?.claim_amount)||f('dXAgP')||f('5D208'),principal=amount(balance);
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
 // Firm routing is deterministic and uses approved office records, not an AI guess.
 const office=extra.office||extra.offices?.[state]||approvedOffices[state];
 if(office&&(!office.state||scalar(office.state)===state)){
  value.firm_address_line1=scalar(office.address_line1);value.firm_address_line2=scalar(office.address_line2);
  value.firm_phone=scalar(office.phone);
 }
 value.lawyer_email=scalar(extra.lawyer?.email)||scalar(office?.lawyer_email);value.lawyer_name=scalar(extra.lawyer?.name)||value.lawyer_name||scalar(office?.lawyer_name);
 value.contact_name=value.lawyer_name;
 const invoices=Array.isArray(extra.invoices)?extra.invoices:[];
 for(let n=1;n<=3;n++){
  const invoice=invoices[n-1];
  if(invoice){value['invoice'+n+'_description']=scalar(invoice.description);const a=amount(invoice.amount);value['invoice'+n+'_amount_display']=a===null?'':money(a);}
  else if(invoices.length){value['invoice'+n+'_description']='';value['invoice'+n+'_amount_display']='';}
 }
 const service=extra.demand_service||{};
 value.demand_service_deponent=scalar(service.deponent);
 value.demand_post_date=date(service.post_date);value.demand_service_date=date(service.service_date);
 value.demand_service_affidavit_date=date(service.affidavit_date);
 value.demand_service_exhibit=scalar(service.exhibit);
 value.posting_location=scalar(service.posting_location);value.posting_time=scalar(service.posting_time);
 value.demand_date=date(extra.demand?.date);value.demand_deponent=scalar(extra.demand?.deponent);
 value.demand_affidavit_date=date(extra.demand?.affidavit_date);
 value.debt_amount_words=scalar(extra.debt?.amount_words);
 const costs=[['Claimed collection costs',amount(extra.debt?.collection_costs)],['Claimed legal costs',amount(extra.debt?.legal_costs)]].filter(([,a])=>a!==null);
 value.costs_description=costs.map(([d])=>d).join('\n');value.costs_amount_display=costs.map(([,a])=>money(a)).join('\n');
 const optional=new Set(['plaintiff_addr2','defendant1_addr2','defendant2_addr2','defendant3_addr2']);
 optional.add('costs_description');optional.add('costs_amount_display');
 if(invoices.length)for(let n=invoices.length+1;n<=3;n++){optional.add('invoice'+n+'_description');optional.add('invoice'+n+'_amount_display');}
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
function acnValue(v){const s=scalar(v).replace(/\s/g,'');return /^\d{9}$/.test(s)?s.replace(/(\d{3})(\d{3})(\d{3})/,'$1 $2 $3'):'';}
root.RADraftCore={build,render,highlight,label,scalar,amount,date,draftData,parties,review};
if(typeof module!=='undefined')module.exports=root.RADraftCore;
})(typeof window!=='undefined'?window:globalThis);
