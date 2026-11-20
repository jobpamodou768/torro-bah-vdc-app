// SUPABASE CONFIGURATION
const SUPABASE_URL = "https://epijlomphuouyrucwcqg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Axa7ZzaQ_aRbmUV_C-uVBA_YyzG-Jv4";

// INITIALISE SUPABASE CLIENT
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
 
);
const $ = s => document.querySelector(s);
const STORAGE_KEY_BASE = "torroBahVdcRecordsV1";
let STORAGE_KEY = STORAGE_KEY_BASE;

const templates = [
 {role:"Chairperson", items:[
  ["Executive oversight report","Oversight and leadership","date","Date"],["Decision follow-up record","Governance and follow-up","text","Decision / resolution reference"],["Official representation log","External representation","text","Organisation / authority represented to"]
 ]},
 {role:"Vice Chairperson",items:[
  ["Delegated duty report","Record duties carried out on behalf of the Chairperson","date","Date"],["Committee supervision note","Record supervision and issues referred","textarea","Observations and actions"]
 ]},
 {role:"Secretary General",items:[
  ["Meeting minutes","Formal record of a VDC or Executive Committee meeting","text","Meeting title"],["Attendance register","Record meeting or consultation attendance","text","Meeting / activity"],["Resolution register","Record decisions and assigned responsibilities","text","Resolution title"],["Correspondence register","Track incoming and outgoing letters","select","Direction"],["Action-point tracker","Track tasks, responsible officers and deadlines","text","Action / task"]
 ]},
 {role:"Assistant Secretary",items:[
  ["Administrative activity log","Record administrative support provided","text","Activity"],["Document dispatch register","Track letters and documents sent","text","Document / reference"],["Meeting preparation checklist","Prepare notices, agenda and attendance materials","date","Meeting date"]
 ]},
 {role:"Treasurer",items:[
  ["Income receipt","Record money received by the VDC","text","Payer / source"],["Expenditure voucher","Document an approved payment request or payment","text","Payee / supplier"],["Cashbook entry","Record a financial transaction","select","Transaction type"],["Donation register","Record donations and any stated restrictions","text","Donor / source"],["Monthly financial report","Summarise income, expenditure and balances","month","Reporting month"],["Budget proposal","Prepare proposed income and expenditure","text","Budget period"],["Bank reconciliation","Compare cashbook with bank statement","month","Reconciliation month"]
 ]},
 {role:"Auditor",items:[
  ["Financial inspection checklist","Independently inspect financial records","date","Inspection date"],["Audit findings report","Document findings, evidence and recommendations","text","Area reviewed"],["Recommendation follow-up","Track responses to audit recommendations","text","Finding reference"]
 ]},
 {role:"Project Officer",items:[
  ["Project proposal","Describe need, objectives, activities and estimated resources","text","Project title"],["Project work plan","Set activities, responsibilities and target dates","text","Project title"],["Project progress report","Record implementation progress and challenges","text","Project title"],["Site inspection report","Document site observations and photographs referenced","text","Project / site"],["Project completion report","Record outputs, handover and lessons","text","Project title"]
 ]},
 {role:"Procurement Officer",items:[
  ["Purchase requisition","Record a request for goods or services","text","Requesting officer / unit"],["Quotation comparison","Compare supplier quotations fairly","text","Goods / services"],["Procurement evaluation","Record evaluation against approved criteria","text","Procurement reference"],["Purchase order","Document an authorised order","text","Supplier"],["Goods received note","Record delivery and inspection of goods","text","Supplier / delivery"]
 ]},
 {role:"Mobilisation Officer",items:[
  ["Community mobilisation report","Record mobilisation activity and participation","text","Activity"],["Consultation attendance","Record attendance at a community consultation","text","Consultation topic"],["Community feedback form","Capture issues, suggestions and referrals","textarea","Feedback / issue"],["Contribution register","Record community contributions and receipts reference","text","Contributor / source"]
 ]},
 {role:"Welfare Officer",items:[
  ["Welfare assistance request","Record a request for support; restrict access","text","Case reference (avoid public names)"],["Beneficiary assessment","Record assessment and recommended support; confidential","textarea","Assessment summary"],["Assistance distribution record","Record approved assistance and acknowledgement","text","Assistance reference"],["Welfare activity report","Summarise non-identifying welfare activities","text","Activity"]
 ]},
 {role:"PRO",items:[
  ["Public announcement","Prepare an approved public notice","text","Announcement title"],["Press statement","Prepare a statement for authorised release","text","Subject"],["Communication register","Track public communications","select","Communication channel"],["Event coverage report","Record event coverage and media materials","text","Event"]
 ]},
 {role:"Assistant PRO",items:[
  ["Communication support log","Record communication tasks completed","text","Activity"],["Media materials register","Track photos, videos and publications","text","Event / subject"]
 ]}
];

const commonFields = [
 ["recordTitle","Record title","text",true],
 ["reference","Reference number (optional)","text",false],
 ["recordDate","Date","date",true],
 ["preparedBy","Prepared by","text",true],
 ["details","Details / description","textarea",true],
 ["actionRequired","Action required / next steps","textarea",false],
 ["relatedDocuments","Supporting documents / receipt references","text",false],
 ["status","Record status","select",true]
];
let records = loadRecords();
let currentRecordId = null;
let deferredInstall = null;

function loadRecords(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return []}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(records));updateCounts()}
function updateCounts(){$("#recordCount").textContent=records.length;$("#draftCount").textContent=records.filter(r=>r.status==="Draft").length;$("#roleCount").textContent=templates.length}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}
function today(){return new Date().toISOString().slice(0,10)}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function selectedTemplate(){const role=templates.find(t=>t.role===$("#roleSelect").value);return role?.items[Number($("#templateSelect").value)]}
function populateRoles(){
 $("#roleSelect").innerHTML=templates.map(t=>`<option>${escapeHtml(t.role)}</option>`).join("");
 populateTemplates();
}
function populateTemplates(){
 const role=templates.find(t=>t.role===$("#roleSelect").value);
 $("#templateSelect").innerHTML=role.items.map((x,i)=>`<option value="${i}">${escapeHtml(x[0])}</option>`).join("");
 renderFields();
}
function renderFields(){
 const item=selectedTemplate(); if(!item)return;
 $("#templateDescription").textContent=item[1];
 const extraType=item[2],extraLabel=item[3];
 const fields=[...commonFields.slice(0,4),["templateSpecific",extraLabel,extraType,false],...commonFields.slice(4)];
 $("#formFields").innerHTML=fields.map(([name,label,type,required])=>{
  let input="";
  if(type==="textarea") input=`<textarea id="${name}" name="${name}" ${required?"required":""}></textarea>`;
  else if(type==="select"){
   const options=name==="status"?["Draft","Submitted","Approved","Completed","Closed"]:name==="templateSpecific"&&extraLabel==="Direction"?["Incoming","Outgoing"]:name==="templateSpecific"&&extraLabel==="Transaction type"?["Income","Expenditure"]:["In person","Telephone","WhatsApp","Email","Other"];
   input=`<select id="${name}" name="${name}" ${required?"required":""}>${options.map(v=>`<option>${v}</option>`).join("")}</select>`;
  } else input=`<input id="${name}" name="${name}" type="${type}" ${required?"required":""} ${name==="recordDate"?`value="${today()}"`:""}>`;
  return `<div class="field ${type==="textarea"?"full":""}"><label for="${name}">${escapeHtml(label)}${required?" *":""}</label>${input}</div>`;
 }).join("");
}
function formData(status){
 const data=Object.fromEntries(new FormData($("#recordForm")).entries());
 const item=selectedTemplate();
 return {id:currentRecordId||crypto.randomUUID(),role:$("#roleSelect").value,template:item[0],description:item[1],createdAt:new Date().toISOString(),status,...data,status:status||data.status||"Submitted"};
}
function resetForm(){currentRecordId=null;$("#recordForm").reset();$("#recordDate").value=today();$("#status").value="Submitted"}
function save(status){
 const data=formData(status);
 const idx=records.findIndex(r=>r.id===data.id);
 if(idx>=0)records[idx]={...records[idx],...data,updatedAt:new Date().toISOString()};
 else records.unshift(data);
 persist();renderRecords();toast(status==="Draft"?"Draft saved on this device":"Record saved on this device");resetForm();
}
function renderRecords(){
 const q=$("#searchRecords").value.toLowerCase();
 const filtered=records.filter(r=>[r.recordTitle,r.role,r.template,r.reference].join(" ").toLowerCase().includes(q));
 $("#recordsList").innerHTML=filtered.length?filtered.map(r=>`<article class="record-card"><div class="meta"><strong>${escapeHtml(r.recordTitle||r.template)}</strong><small>${escapeHtml(r.role)} • ${escapeHtml(r.recordDate||"No date")} • ${escapeHtml(r.status)}</small></div><button data-open="${r.id}">Open</button></article>`).join(""):`<p class="hint">No saved records yet. Create a record in the Officer Toolkit.</p>`;
}
function openRecord(id){
 const r=records.find(x=>x.id===id);if(!r)return;
 currentRecordId=id;
 $("#dialogTitle").textContent=r.recordTitle||r.template;
 const skip=new Set(["id","createdAt","updatedAt","description"]);
 $("#dialogBody").innerHTML=Object.entries(r).filter(([k])=>!skip.has(k)).map(([k,v])=>`<div class="detail-row"><small>${escapeHtml(k.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase()))}</small><div>${escapeHtml(v||"—")}</div></div>`).join("");
 $("#recordDialog").showModal();
}
function printRecord(){
 const r=records.find(x=>x.id===currentRecordId);if(!r)return;
 $("#dialogBody").dataset.printTitle=r.recordTitle||r.template;
 window.print();
}
function exportBackup(){
 const blob=new Blob([JSON.stringify({app:"Torro Bah VDC",version:1,exportedAt:new Date().toISOString(),records},null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`torro-bah-vdc-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href);
}
function importBackup(file){
 const reader=new FileReader();reader.onload=()=>{
  try{const parsed=JSON.parse(reader.result);if(!Array.isArray(parsed.records))throw Error("Invalid backup");
   const map=new Map(records.map(r=>[r.id,r]));parsed.records.forEach(r=>{if(r.id)map.set(r.id,r)});
   records=[...map.values()].sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));persist();renderRecords();toast("Backup imported");
  }catch{toast("Could not read that backup file")}
 };reader.readAsText(file);
}
function switchTab(tab){
 document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===tab));
}
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>document.querySelector(`.tab[data-tab="${b.dataset.go}"]`)?.click()));
$("#roleSelect").addEventListener("change",populateTemplates);
$("#templateSelect").addEventListener("change",renderFields);
$("#recordForm").addEventListener("submit",e=>{e.preventDefault();save("Submitted")});
$("#saveDraftBtn").addEventListener("click",()=>save("Draft"));
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
$("#searchRecords").addEventListener("input",renderRecords);
$("#recordsList").addEventListener("click",e=>{const id=e.target.dataset.open;if(id)openRecord(id)});
$("#closeDialog").addEventListener("click",()=>$("#recordDialog").close());
$("#printRecordBtn").addEventListener("click",printRecord);
$("#deleteRecordBtn").addEventListener("click",()=>{
 if(!currentRecordId)return;
 if(confirm("Delete this record from this device? Export a backup first if you may need it.")){
  records=records.filter(r=>r.id!==currentRecordId);persist();renderRecords();$("#recordDialog").close();toast("Record deleted from this device");
 }
});
$("#exportBtn").addEventListener("click",exportBackup);
$("#importFile").addEventListener("change",e=>{if(e.target.files[0])importBackup(e.target.files[0]);e.target.value=""});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("#installBtn").hidden=false});
$("#installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("#installBtn").hidden=true});
populateRoles();updateCounts();renderRecords();
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
