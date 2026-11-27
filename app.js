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
let records = [];
let currentRecordId = null;
let deferredInstall = null;
let currentUser = null;
let currentVdcId = null;

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

// SUPABASE LOGIN AND ACCOUNT ACCESS
function showLoginMessage(message) {
  $("#loginMessage").textContent = message;
}

async function openUserAccount(user) {
  const { data: account, error } = await supabaseClient
    .from("user_accounts")
    .select("account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    showLoginMessage("Could not verify your account. Please try again.");
    $("#signOutBtn").hidden = false;
    return;
  }

  if (!account) {
    showLoginMessage("No VDC account is linked to this login. Contact the administrator.");
    $("#signOutBtn").hidden = false;
    return;
  }

  if (account.account_status !== "active") {
    showLoginMessage("Your account is awaiting approval or is not active. Please contact the VDC administrator.");
    $("#signOutBtn").hidden = false;
    return;
  }

  currentUser = user;
  STORAGE_KEY = STORAGE_KEY_BASE + "_" + user.id;
  records = loadRecords();
  updateCounts();
  renderRecords();

  $("#loginScreen").hidden = true;
  $("#appShell").hidden = false;
  $("#signOutBtn").hidden = false;
  await initializeUserContext(user);
  await initializeApprovalPanel(user);
  await initializeFinancePanel();
}

async function initializeUserContext(user) {
  currentVdcId = null;
  const { data: ownAccount, error: accountError } = await supabaseClient
    .from("user_accounts")
    .select("member_id")
    .eq("id", user.id)
    .maybeSingle();

  if (accountError || !ownAccount?.member_id) {
    const message = $("#financeMessage");
    if (message) message.textContent = "Your VDC membership could not be identified. Finance access is unavailable.";
    return;
  }

  const { data: ownMember, error: memberError } = await supabaseClient
    .from("members")
    .select("vdc_id")
    .eq("id", ownAccount.member_id)
    .maybeSingle();

  if (memberError || !ownMember?.vdc_id) {
    const message = $("#financeMessage");
    if (message) message.textContent = "Your VDC could not be identified. Finance access is unavailable.";
    return;
  }

  currentVdcId = ownMember.vdc_id;
}

async function initializeApprovalPanel(user) {
  const tab = $("#approvalsTab");
  const message = $("#approvalMessage");
  const list = $("#pendingAccountsList");
  // Show the tab to signed-in users so permission/deployment problems are visible.
  // Pending applicant data and approval actions remain permission-gated below.
  tab.hidden = false;
  list.innerHTML = "";
  message.textContent = "Checking approval permissions...";

  const { data: allowed, error: permissionError } = await supabaseClient.rpc(
    "has_permission",
    { requested_permission: "approve_accounts" }
  );
  if (permissionError || allowed !== true) {
    message.textContent = "Your account does not have permission to approve accounts.";
    return;
  }

  if (!currentVdcId) {
    message.textContent = "Could not identify your VDC. Please contact the system administrator.";
    return;
  }
  tab.hidden = false;
  await loadPendingAccounts();
}


// FINANCE WORKSPACE — payment requests and controlled approvals
function makePaymentRequestNumber() {
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `TB-${new Date().getFullYear()}-${token}`;
}

async function initializeFinancePanel() {
  const tab = $("#financeTab");
  if (tab) tab.hidden = false;
  $("#financeMessage").textContent = currentVdcId
    ? "Loading finance records..."
    : "Your VDC could not be identified. Finance access is unavailable.";
  if (currentVdcId) { await loadFinanceRequests(); await loadTransactionAccounts(); await loadFinancialTransactions(); }
  $("#transactionDate").value = new Date().toISOString().slice(0,10);
  updateTransactionTypeFields();
}

async function loadFinanceRequests() {
  const message = $("#financeMessage");
  const list = $("#financeRequestsList");

  if (!currentVdcId) {
    message.textContent = "Your VDC could not be identified. Finance access is unavailable.";
    list.innerHTML = "";
    return;
  }

  message.textContent = "Loading payment requests...";
  list.innerHTML = "";

  const { data, error } = await supabaseClient
    .from("financial_payment_requests")
    .select("id, request_number, request_title, purpose, amount, currency, request_date, required_date, budget_reference, status, created_at")
    .eq("vdc_id", currentVdcId)
    .order("created_at", { ascending: false });

  if (error) {
    message.textContent = "Finance records are not visible to this account. Check finance permissions and database access policies.";
    return;
  }

  const [
    { data: canVerify, error: verifyError },
    { data: canApprove, error: approveError }
  ] = await Promise.all([
    supabaseClient.rpc("has_permission", {
      requested_permission: "verify_payments"
    }),
    supabaseClient.rpc("has_permission", {
      requested_permission: "approve_payments"
    })
  ]);

  const mayVerifyPayments = !verifyError && canVerify === true;
  const mayApprovePayments = !approveError && canApprove === true;

  message.textContent = data?.length
    ? `Showing ${data.length} payment request(s) for this VDC. Actions are validated by the database.`
    : "No payment requests have been recorded for this VDC.";

  list.innerHTML = (data || []).map(request => {
    const status = String(request.status || "").replace(/_/g, " ");
    let actions = "";

    if (request.status === "pending_verification" && mayVerifyPayments) {
      actions = `
        <button class="secondary"
          data-finance-action="verified"
          data-request-id="${escapeHtml(request.id)}">Verify</button>
        <button class="danger"
          data-finance-action="verification-rejected"
          data-request-id="${escapeHtml(request.id)}">Reject</button>`;
    } else if (request.status === "pending_approval" && mayApprovePayments) {
      actions = `
        <button class="primary"
          data-finance-action="approved"
          data-request-id="${escapeHtml(request.id)}">Approve</button>
        <button class="danger"
          data-finance-action="approval-rejected"
          data-request-id="${escapeHtml(request.id)}">Reject</button>`;
    }

    return `
      <article class="record-card finance-card">
        <div class="meta">
          <strong>${escapeHtml(request.request_title)}</strong>
          <small>
            ${escapeHtml(request.request_number)}
            • ${escapeHtml(request.currency || "GMD")}
            ${Number(request.amount).toLocaleString()}
            • ${escapeHtml(status)}
          </small>
          <small>
            Requested: ${escapeHtml(request.request_date || "—")}
            ${request.required_date
              ? " • Needed: " + escapeHtml(request.required_date)
              : ""}
          </small>
          <small>${escapeHtml(request.purpose)}</small>
        </div>
        <div class="finance-actions">${actions}</div>
      </article>`;
  }).join("");
}

const paymentSubmitButton = $("#submitPaymentRequestBtn");
if (paymentSubmitButton) {
  paymentSubmitButton.addEventListener("click", () => {
    const form = $("#paymentRequestForm");
    const invalidField = Array.from(form.elements).find(field =>
      field.willValidate && !field.checkValidity()
    );
    if (invalidField) {
      const label = invalidField.labels?.[0]?.textContent || invalidField.id || "a required field";
      $("#financeMessage").textContent = "Please complete or correct: " + label;
      invalidField.reportValidity();
    } else {
      $("#financeMessage").textContent = "Button tap detected. Sending form...";
    }
  });
}

$("#paymentRequestForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!currentUser || !currentVdcId) {
    $("#financeMessage").textContent = "Your login or VDC membership is not ready. Please sign in again.";
    return;
  }

  const button = $("#submitPaymentRequestBtn");
  button.disabled = true;
  button.textContent = "Submitting...";
  const requestId = crypto.randomUUID();
  const payload = {
    id: requestId,
    vdc_id: currentVdcId,
    request_number: makePaymentRequestNumber(),
    request_title: $("#paymentRequestTitle").value.trim(),
    purpose: $("#paymentRequestPurpose").value.trim(),
    amount: Number($("#paymentRequestAmount").value),
    requested_by: currentUser.id,
    status: "pending_verification",
    required_date: $("#paymentRequiredDate").value || null,
    budget_reference: $("#paymentBudgetReference").value.trim() || null
  };

  const { error } = await supabaseClient
    .from("financial_payment_requests")
    .insert(payload);

  button.disabled = false;
  button.textContent = "Submit for verification";

  if (error) {
    $("#financeMessage").textContent = error.code === "23505"
      ? "That request number already exists. Please submit again to generate another number."
      : "The request was not saved: " + error.message;
    return;
  }

  $("#paymentRequestForm").reset();
  $("#financeMessage").textContent = "Payment request submitted for verification.";
  await loadFinanceRequests();
});

// FINANCIAL TRANSACTIONS — draft entry and register
let transactionAccounts = { cashbook: [], bank: [] };

function selectedTransactionAccount(type, id) {
  return transactionAccounts[type].find(account => account.id === id);
}

function renderTransactionAccountOptions(selectId, type, selectedId = "") {
  const select = $(selectId);
  const rows = transactionAccounts[type] || [];
  select.innerHTML = '<option value="">Select account</option>' + rows.map(account => {
    const label = type === "bank"
      ? [account.account_name, account.bank_name].filter(Boolean).join(" — ")
      : account.cashbook_name;
    return `<option value="${escapeHtml(account.id)}" ${account.id === selectedId ? "selected" : ""}>${escapeHtml(label)} (${escapeHtml(account.currency || "GMD")})</option>`;
  }).join("");
}

async function loadTransactionAccounts() {
  const message = $("#transactionMessage");
  if (!currentVdcId) {
    message.textContent = "Your VDC could not be identified. Transaction accounts are unavailable.";
    return;
  }
  const [cash, bank] = await Promise.all([
    supabaseClient.from("vdc_cashbooks").select("id,cashbook_name,currency,is_active").eq("vdc_id", currentVdcId).eq("is_active", true).order("cashbook_name"),
    supabaseClient.from("vdc_bank_accounts").select("id,account_name,bank_name,currency,is_active").eq("vdc_id", currentVdcId).eq("is_active", true).order("account_name")
  ]);
  if (cash.error || bank.error) {
    message.textContent = "Could not load VDC accounts. Check the account access policies.";
    return;
  }
  transactionAccounts = { cashbook: cash.data || [], bank: bank.data || [] };
  renderTransactionAccountOptions("#transactionSourceAccount", $("#transactionAccountType").value);
  renderTransactionAccountOptions("#transactionDestinationAccount", $("#transactionDestinationType").value);
  message.textContent = "Accounts loaded. Choose the correct source account before saving a draft.";
}

function updateTransactionAccountFields() {
  renderTransactionAccountOptions("#transactionSourceAccount", $("#transactionAccountType").value);
  renderTransactionAccountOptions("#transactionDestinationAccount", $("#transactionDestinationType").value);
}
function updateTransactionTypeFields() {
  const isTransfer = $("#transactionType").value === "transfer";
  $("#transactionDestinationTypeField").hidden = !isTransfer;
  $("#transactionDestinationField").hidden = !isTransfer;
  $("#transactionDestinationType").required = isTransfer;
  $("#transactionDestinationAccount").required = isTransfer;
}

async function loadFinancialTransactions() {
  const list = $("#financialTransactionsList");
  if (!currentVdcId) { list.innerHTML = ""; return; }
  const { data, error } = await supabaseClient
    .from("financial_transactions")
    .select("id,transaction_type,account_type,amount,currency,transaction_date,description,reference_number,status,created_at")
    .eq("vdc_id", currentVdcId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    list.innerHTML = '<p class="hint">Transactions are not visible to this account. Check finance permissions and database policies.</p>';
    return;
  }
  list.innerHTML = data?.length ? data.map(row => `
    <article class="record-card finance-card">
      <div class="meta">
        <strong>${escapeHtml(row.description)}</strong>
        <small>${escapeHtml(row.transaction_type)} • GMD ${Number(row.amount).toLocaleString()} • ${escapeHtml(row.transaction_date || "—")}</small>
        <small>Status: ${escapeHtml(String(row.status || "").replace(/_/g, " "))}${row.reference_number ? " • Ref: " + escapeHtml(row.reference_number) : ""}</small>
      </div>
    </article>`).join("") : '<p class="hint">No financial transactions recorded yet.</p>';
}

$("#transactionAccountType").addEventListener("change", updateTransactionAccountFields);
$("#transactionDestinationType").addEventListener("change", updateTransactionAccountFields);
$("#transactionType").addEventListener("change", updateTransactionTypeFields);
$("#financialTransactionForm").addEventListener("submit", async event => {
  event.preventDefault();
  const message = $("#transactionMessage");
  const button = $("#saveFinancialTransactionBtn");
  if (!currentUser || !currentVdcId) {
    message.textContent = "Your login or VDC membership is not ready. Please sign in again.";
    return;
  }
  const type = $("#transactionType").value;
  const accountType = $("#transactionAccountType").value;
  const sourceId = $("#transactionSourceAccount").value;
  const source = selectedTransactionAccount(accountType, sourceId);
  const destinationType = $("#transactionDestinationType").value;
  const destinationId = $("#transactionDestinationAccount").value;
  const destination = type === "transfer" ? selectedTransactionAccount(destinationType, destinationId) : null;
  if (!source) { message.textContent = "Select a valid active source account."; return; }
  if (type === "transfer" && (!destination || (accountType === destinationType && sourceId === destinationId))) {
    message.textContent = "Select a different valid destination account.";
    return;
  }
  const amount = Number($("#transactionAmount").value);
  if (!Number.isFinite(amount) || amount <= 0) { message.textContent = "Enter an amount greater than zero."; return; }
  if ((source.currency || "GMD") !== "GMD" || (destination && (destination.currency || "GMD") !== "GMD")) {
    message.textContent = "This workflow currently accepts GMD accounts only.";
    return;
  }
  button.disabled = true;
  button.textContent = "Saving draft...";
  const payload = {
    vdc_id: currentVdcId,
    transaction_type: type,
    account_type: accountType,
    bank_account_id: accountType === "bank" ? sourceId : null,
    cashbook_id: accountType === "cashbook" ? sourceId : null,
    destination_account_type: type === "transfer" ? destinationType : null,
    destination_bank_account_id: type === "transfer" && destinationType === "bank" ? destinationId : null,
    destination_cashbook_id: type === "transfer" && destinationType === "cashbook" ? destinationId : null,
    amount,
    currency: "GMD",
    transaction_date: $("#transactionDate").value,
    description: $("#transactionDescription").value.trim(),
    reference_number: $("#transactionReference").value.trim() || null,
    status: "draft",
    created_by: currentUser.id
  };
  const { error } = await supabaseClient.from("financial_transactions").insert(payload);
  button.disabled = false;
  button.textContent = "Save transaction draft";
  if (error) {
    message.textContent = "Draft was not saved: " + error.message;
    return;
  }
  $("#financialTransactionForm").reset();
  $("#transactionDate").value = new Date().toISOString().slice(0,10);
  updateTransactionTypeFields();
  updateTransactionAccountFields();
  message.textContent = "Transaction draft saved. It has not been submitted, approved or posted.";
  await loadFinancialTransactions();
});

let pendingFinanceDecision = null;

$("#financeRequestsList").addEventListener("click", event => {
  const button = event.target.closest("[data-finance-action]");
  if (!button) return;

  const action = button.dataset.financeAction;
  const rejected = action.endsWith("rejected");
  const stage = action.startsWith("verification") || action === "verified"
    ? "verification"
    : "final_approval";
  const decision = rejected ? "rejected" : (stage === "verification" ? "verified" : "approved");

  pendingFinanceDecision = { button, requestId: button.dataset.requestId, stage, decision };
  $("#financeDecisionTitle").textContent = rejected
    ? "Reject payment request"
    : decision === "verified" ? "Verify payment request" : "Approve payment request";
  $("#financeDecisionPrompt").textContent = rejected
    ? "Enter the reason. A written reason is required and will be saved in the approval history."
    : "Add an optional comment, then confirm your decision.";
  $("#financeDecisionReasonLabel").textContent = rejected ? "Reason for rejection *" : "Comments (optional)";
  $("#financeDecisionReason").value = "";
  $("#financeDecisionReason").required = rejected;
  $("#financeDecisionMessage").textContent = "";
  $("#confirmFinanceDecision").textContent = rejected
    ? "Confirm rejection"
    : decision === "verified" ? "Confirm verification" : "Confirm approval";
  $("#confirmFinanceDecision").disabled = false;
  $("#financeDecisionDialog").showModal();
});

const closeFinanceDecision = () => {
  pendingFinanceDecision = null;
  $("#financeDecisionDialog").close();
};
$("#cancelFinanceDecision").addEventListener("click", closeFinanceDecision);
$("#cancelFinanceDecisionBottom").addEventListener("click", closeFinanceDecision);

window.confirmFinanceDecisionAction = async event => {
  event.preventDefault();
  const message = $("#financeDecisionMessage");
  const confirmButton = $("#confirmFinanceDecision");

  if (!pendingFinanceDecision) {
    message.textContent = "No pending finance decision was found. Close this window and try again.";
    return;
  }

  const { button, requestId, stage, decision } = pendingFinanceDecision;
  const comments = $("#financeDecisionReason").value.trim();
  if (decision === "rejected" && !comments) {
    message.textContent = "A written rejection reason is required.";
    return;
  }

  confirmButton.disabled = true;
  button.disabled = true;
  message.textContent = "Recording decision... Please wait.";

  try {
    const { error } = await supabaseClient.rpc("record_financial_approval", {
      p_payment_request_id: requestId,
      p_approval_stage: stage,
      p_decision: decision,
      p_comments: comments || null,
      p_delegation_id: null
    });

    if (error) {
      message.textContent = "Decision not recorded: " + error.message;
      confirmButton.disabled = false;
      button.disabled = false;
      return;
    }

    $("#financeDecisionDialog").close();
    pendingFinanceDecision = null;
    $("#financeMessage").textContent = "Decision recorded successfully. Refreshing the request list...";
    await loadFinanceRequests();
    $("#financeMessage").textContent = "Decision recorded successfully.";
  } catch (error) {
    message.textContent = "Unexpected error: " + (error?.message || String(error));
    confirmButton.disabled = false;
    button.disabled = false;
  }
};

let pendingApplicantMap = new Map();
let selectedApplicantAccountId = null;

function applicantValue(value) {
  return value === null || value === undefined || value === "" ? "Not provided" : String(value);
}

function showApplicantReview(accountId) {
  const applicant = pendingApplicantMap.get(accountId);
  if (!applicant) return;
  selectedApplicantAccountId = accountId;
  $("#applicantReviewTitle").textContent = applicant.full_name || "Applicant details";
  const details = [
    ["Full name", applicant.full_name],
    ["Membership ID", applicant.membership_id],
    ["Membership status", applicant.status],
    ["Member category", applicant.category],
    ["Phone number", applicant.phone],
    ["Email address", applicant.email],
    ["Residential status", applicant.residential_status],
    ["Current residence", applicant.current_residence],
    ["Membership registration date", applicant.registration_date],
    ["App account created", applicant.account_created_at ? new Date(applicant.account_created_at).toLocaleString() : null]
  ];
  $("#applicantReviewDetails").innerHTML = details.map(([label,value]) =>
    `<div class="detail-row"><small>${escapeHtml(label)}</small><div>${escapeHtml(applicantValue(value))}</div></div>`
  ).join("");
  $("#applicantIdentityCheck").checked = false;
  $("#applicantMembershipCheck").checked = false;
  $("#confirmApplicantApproval").disabled = true;
  $("#applicantReviewMessage").textContent = "Compare these details with the official VDC membership register before making a decision.";
  $("#applicantDialog").showModal();
}

function updateApplicantApprovalReady() {
  $("#confirmApplicantApproval").disabled =
    !($("#applicantIdentityCheck").checked && $("#applicantMembershipCheck").checked);
}

async function approveApplicant(accountId, button) {
  if (!confirm("Have you personally verified the applicant's identity and approved VDC membership, and do you intend to activate this account?")) return;
  button.disabled = true;
  button.textContent = "Approving...";
  const { data, error } = await supabaseClient.rpc("approve_user_account", {
    target_user_id: accountId
  });
  if (error || data !== true) {
    $("#applicantReviewMessage").textContent = error?.message || "Approval could not be completed.";
    button.disabled = false;
    button.textContent = "Approve account";
    return;
  }
  $("#applicantReviewMessage").textContent = "Account approved successfully.";
  $("#applicantDialog").close();
  $("#approvalMessage").textContent = "Account approved successfully.";
  await loadPendingAccounts();
}

async function loadPendingAccounts() {
  const message = $("#approvalMessage");
  const list = $("#pendingAccountsList");
  message.textContent = "Loading pending accounts...";
  list.innerHTML = "";
  pendingApplicantMap = new Map();

  const { data: pending, error } = await supabaseClient
    .from("user_accounts")
    .select("id, member_id, created_at")
    .eq("account_status", "pending");

  if (error) {
    message.textContent = "Could not load pending accounts. Check the account access policies.";
    return;
  }
  if (!pending?.length) {
    message.textContent = "There are no pending accounts visible to you.";
    return;
  }

  const memberIds = pending.map(row => row.member_id);
  const { data: members, error: membersError } = await supabaseClient
    .from("members")
    .select("id, full_name, membership_id, status, vdc_id, phone, email, category, residential_status, current_residence, registration_date")
    .in("id", memberIds)
    .eq("vdc_id", currentVdcId);

  if (membersError) {
    message.textContent = "Could not load applicant details. Check the member-record access policy.";
    return;
  }

  const memberMap = new Map((members || []).map(m => [m.id, m]));
  const sameVdcPending = pending.filter(row => memberMap.has(row.member_id));
  if (!sameVdcPending.length) {
    message.textContent = "No pending accounts for your VDC were found.";
    return;
  }

  message.textContent = "Open View application for each applicant. Verify identity and membership against the official VDC register before approval.";
  list.innerHTML = sameVdcPending.map(row => {
    const m = memberMap.get(row.member_id);
    pendingApplicantMap.set(row.id, {...m, account_created_at: row.created_at});
    return `<article class="record-card approval-card">
      <div class="meta">
        <strong>${escapeHtml(m.full_name || "Name unavailable")}</strong>
        <small>${escapeHtml(m.membership_id || "No membership number")} • Membership: ${escapeHtml(m.status || "Unknown")}</small>
      </div>
      <button class="secondary" data-view-applicant="${escapeHtml(row.id)}">View application</button>
    </article>`;
  }).join("");
}

$("#pendingAccountsList").addEventListener("click", event => {
  const button = event.target.closest("[data-view-applicant]");
  if (button) showApplicantReview(button.dataset.viewApplicant);
});

$("#applicantIdentityCheck").addEventListener("change", updateApplicantApprovalReady);
$("#applicantMembershipCheck").addEventListener("change", updateApplicantApprovalReady);
$("#closeApplicantDialog").addEventListener("click", () => $("#applicantDialog").close());
$("#confirmApplicantApproval").addEventListener("click", async () => {
  if (!selectedApplicantAccountId) return;
  await approveApplicant(selectedApplicantAccountId, $("#confirmApplicantApproval"));
});

$("#loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;

  showLoginMessage("Signing in...");

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
  showLoginMessage("Reset error: " + error.message);
  return;
  }

  await openUserAccount(data.user);
});

$("#signOutBtn").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    showLoginMessage("Sign out failed. Please try again.");
    return;
  }

  records = [];
  $("#appShell").hidden = true;
  $("#loginScreen").hidden = false;
  $("#signOutBtn").hidden = true;
  $("#loginForm").reset();
  showLoginMessage("You have signed out.");
});

async function restoreLoginSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
  showLoginMessage("Sign-in failed. Check your email and password.");
  return;
  }

  if (data.session) {
    await openUserAccount(data.session.user);
  }
}supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    $("#loginScreen").hidden = true;
    $("#appShell").hidden = true;
    $("#resetPasswordScreen").hidden = false;
  }
});

restoreLoginSession();

$("#forgotPasswordLink").addEventListener("click", async event => {
  event.preventDefault();

  const email = $("#loginEmail").value.trim();

  if (!email) {
    showLoginMessage("Enter your email address first.");
    $("#loginEmail").focus();
    return;
  }

  showLoginMessage("Sending password reset email...");

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: "https://jobpamodou768.github.io/torro-bah-vdc-app/"
  });

  showLoginMessage("Reset error: " + error.message);

  showLoginMessage("Password reset instructions have been sent to your email.");
});
$("#resetPasswordForm").addEventListener("submit", async event => {
  event.preventDefault();

  const password = $("#newPassword").value;
  const confirmPassword = $("#confirmNewPassword").value;

  if (password !== confirmPassword) {
    $("#resetPasswordMessage").textContent = "Passwords do not match.";
    return;
  }

  $("#resetPasswordMessage").textContent = "Updating password...";

  const { error } = await supabaseClient.auth.updateUser({
    password: password
  });

  if (error) {
    $("#resetPasswordMessage").textContent =
      "Password update failed. Please try again.";
    return;
  }

  $("#resetPasswordMessage").textContent =
    "Password updated successfully. Please sign in.";

  await supabaseClient.auth.signOut();

  $("#resetPasswordScreen").hidden = true;
  $("#loginScreen").hidden = false;
});
