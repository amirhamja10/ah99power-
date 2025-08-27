/* ==========
   Simple SPA using localStorage (demo only)
   ========== */

const VIEWS = ["loading","home","activate-method","activate-form","pending","signup","dashboard"];
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

function show(id){
  VIEWS.forEach(v => $('#'+v).classList.add('hidden'));
  $('#'+id).classList.remove('hidden');
  window.scrollTo({top:0,behavior:"smooth"});
  localStorage.setItem("ah99:view", id);
}

function toast(msg){
  alert(msg); // simple
}

// initial local state
const state = {
  method: null,            // bkash/nagad
  pending: false,
  active: false,
  user: null,              // {contact, first, last}
  balance: 0
};

// load saved
(function init(){
  const saved = JSON.parse(localStorage.getItem("ah99:state") || "null");
  if(saved) Object.assign(state, saved);

  // loader -> next
  setTimeout(() => {
    if(!state.pending && !state.active){
      show("home");
    }else if(state.pending && !state.active){
      show("pending");
      updateStatusBadge();
    }else if(state.active && !state.user){
      show("signup");
    }else{
      fillDashboard();
      show("dashboard");
    }
  }, 1800);

  // remember last view if freshly opened and not loading
  const remember = localStorage.getItem("ah99:view");
  if(remember && remember!=="loading"){
    // no-op; we always pass through loading first
  }
})();

function persist(){
  localStorage.setItem("ah99:state", JSON.stringify(state));
}

/* -------- Home -> Activate -------- */
$("#goActivate").addEventListener("click", ()=>{
  show("activate-method");
});

$$("#activate-method .btn.outline").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    state.method = btn.dataset.method; // bkash/nagad
    persist();
    $("#actTitle").textContent = (state.method==="bkash"?"বিকাশ":"নগদ")+" দিয়ে অ্যাকাউন্ট একটিভ";
    show("activate-form");
  });
});

/* -------- copy pay number -------- */
$("#copyBtn").addEventListener("click", ()=>{
  navigator.clipboard.writeText($("#payNumber").value).then(()=>{
    toast("নাম্বার কপি হয়েছে!");
  });
});

/* -------- submit activation -------- */
$("#submitActivation").addEventListener("click", ()=>{
  const sender = $("#senderNumber").value.trim();
  const trx    = $("#trxId").value.trim();

  if(!state.method){ return toast("একটি পেমেন্ট পদ্ধতি নির্বাচন করুন"); }
  if(!/^01\d{9}$/.test(sender)) return toast("সঠিক সেন্ডার নাম্বার দিন (11 digit)");
  if(trx.length < 6) return toast("ট্রানজেকশন আইডি দিন");

  state.pending = true;
  persist();
  updateStatusBadge();
  show("pending");
});

function updateStatusBadge(){
  $("#statusBadge").textContent = state.pending ? "PENDING" : (state.active ? "ACTIVE" : "N/A");
}

/* -------- Admin demo controls (frontend only) -------- */
$("#adminApprove").addEventListener("click", ()=>{
  state.pending = false;
  state.active = true;
  persist();
  show("signup");
});
$("#adminReject").addEventListener("click", ()=>{
  state.pending = false;
  state.active = false;
  persist();
  show("home");
});

/* -------- Signup after approved -------- */
$("#finishSignup").addEventListener("click", ()=>{
  const c = $("#siContact").value.trim();
  const f = $("#siFirst").value.trim();
  const l = $("#siLast").value.trim();
  const p1 = $("#siPass").value;
  const p2 = $("#siPass2").value;

  if(!c || !f || !l) return toast("সব ইনপুট পূরণ করুন");
  if(p1.length<6) return toast("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
  if(p1!==p2) return toast("পাসওয়ার্ড মেলেনি");

  state.user = {contact:c, first:f, last:l};
  state.balance = state.balance || 0;
  persist();
  fillDashboard();
  show("dashboard");
});

/* -------- Dashboard Tabs -------- */
$$(".tab").forEach(tab=>{
  tab.addEventListener("click", ()=>{
    $$(".tab").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    const name = tab.dataset.tab;
    $$(".tabview").forEach(v=>v.classList.add("hidden"));
    $("#tab-"+name).classList.remove("hidden");
  });
});

function fillDashboard(){
  $("#balanceTk").textContent = "৳ " + (state.balance||0);
}

/* -------- Jobs submit -> add balance (demo) -------- */
$("#submitJob").addEventListener("click", ()=>{
  const file = $("#jobShot").files[0];
  if(!file) return toast("স্ক্রিনশট আপলোড করুন");
  // demo: fixed reward
  state.balance = (state.balance||0) + 5;
  persist();
  fillDashboard();
  $("#jobShot").value = "";
  toast("জব সাবমিট হয়েছে! ৳5 যোগ করা হয়েছে (ডেমো)");
});

/* -------- Withdraw -------- */
$("#wdSubmit").addEventListener("click", ()=>{
  const method = $("#wdMethod").value;
  const number = $("#wdNumber").value.trim();
  const amount = parseInt($("#wdAmount").value,10);

  if(!/^01\d{9}$/.test(number)) return toast("সঠিক নাম্বার দিন");
  if(!amount || amount<50) return toast("কমপক্ষে ৳50 তুলতে পারবেন");
  if(amount > (state.balance||0)) return toast("পর্যাপ্ত ব্যালেন্স নেই");

  // demo: mark pending, do not deduct
  $("#wdNote").textContent = `অনুরোধ পেন্ডিং (${method.toUpperCase()}) — এডমিন অনুমোদনের পর সম্পন্ন হবে (ডেমো)।`;
});

/* -------- Settings / logout -------- */
$("#logout").addEventListener("click", ()=>{
  localStorage.removeItem("ah99:state");
  localStorage.removeItem("ah99:view");
  toast("লগআউট সম্পন্ন");
  location.reload();
});

/* -------- Back buttons -------- */
$$("[data-back]").forEach(btn=>{
  btn.addEventListener("click", ()=> show(btn.dataset.back));
});