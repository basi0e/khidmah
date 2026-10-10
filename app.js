/* Khidmah web app — talks to the Supabase database. Plain JavaScript, no build step. */
(function () {
'use strict';

/* ================= 1. Settings ================= */
const SUPABASE_URL = 'https://blpwieezcvvqsbwkuoec.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ioFP82tRgXMDED8pVTiU9w_kX95M-kF'; // public key, safe in the browser
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

const FEE = 0.10; // example platform fee shown to providers
const CATS = [
 {id:'ac',name:'AC service & repair',icon:'wind',from:120,subs:['AC cleaning & service','Gas refill','Split AC installation','Window AC repair','Duct cleaning']},
 {id:'plumbing',name:'Plumbing',icon:'wrench',from:80,subs:['Leak repair','Tap & mixer installation','Drain unblocking','Water heater repair','Toilet repair']},
 {id:'electrical',name:'Electrical',icon:'zap',from:90,subs:['Wiring fault','Lights & ceiling fans','Switches & sockets','Distribution board','Breaker keeps tripping']},
 {id:'rooms',name:'Room rental',icon:'bed-double',from:600,rooms:true,subs:['Room viewing']},
 {id:'cleaning',name:'Home cleaning',icon:'sparkles',from:150,subs:['Deep home cleaning','Sofa & carpet shampoo','Kitchen deep clean','Move-out cleaning']},
 {id:'pest',name:'Pest control',icon:'bug',from:180,subs:['Cockroach treatment','Bed bugs','Termites','Rodents']},
 {id:'tank',name:'Water tank cleaning',icon:'droplets',from:150,subs:['Tank cleaning & sterilizing','Tank insulation','Water pump repair']},
 {id:'appliance',name:'Appliance repair',icon:'washing-machine',from:100,subs:['Washing machine','Refrigerator','Oven & stove','Dishwasher']},
 {id:'painting',name:'Painting',icon:'paintbrush',from:350,subs:['Room painting','Full villa painting','Touch-up & patching','Roof waterproofing']},
 {id:'carpentry',name:'Carpentry',icon:'hammer',from:100,subs:['Furniture assembly','Door & lock repair','Kitchen cabinets','Curtain fitting']},
 {id:'moving',name:'Moving & packing',icon:'truck',from:400,subs:['Apartment move','Furniture only','Packing & wrapping']},
 {id:'cctv',name:'CCTV & satellite',icon:'camera',from:200,subs:['CCTV installation','Satellite dish setup','Intercom','Wi-Fi & router setup']},
 {id:'garden',name:'Gardening',icon:'leaf',from:120,subs:['Garden maintenance','Irrigation repair','Tree trimming']},
 {id:'carwash',name:'Car wash at home',icon:'car',from:40,subs:['Exterior wash','Full wash','Interior detailing']}
];
const catById = id => CATS.find(c => c.id === id) || CATS[0];
const CITIES = ['Riyadh','Dammam'];
const DISTRICTS = {Riyadh:['Al Olaya','Al Malqa','Al Yasmin','Al Nakheel','Al Sulimaniyah','Al Rawdah','Al Naseem','Al Aziziyah'],
  Dammam:['Al Faisaliyah','Al Shati','Al Nuzha','Al Mazruiyah','Al Rakah','Al Adamah','Al Khobar Al Shamalia','Al Badiyah']};
const ALL_LANGS = ['Arabic','English','Urdu','Hindi','Malayalam','Bengali','Tagalog'];
const SLOTS = [['Morning','8 am – 12 pm'],['Afternoon','12 – 4 pm'],['Evening','4 – 9 pm']];
const PAY = ['Cash','mada card','Apple Pay','STC Pay'];
const DAYN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const PTYPES = ['Individual technician','Company','Landlord / room owner'];
const DOCS = {
  'Individual technician':[['Iqama or national ID',true],['Trade or skill certificate',false]],
  'Company':[['Commercial Registration (CR)',true],['Municipality licence (Baladi)',true],['VAT registration certificate',false]],
  'Landlord / room owner':[['Iqama or national ID',true],['Title deed or Ejar lease contract',true]]
};
const FLOW = ['Requested','Accepted','On the way','In progress','Completed'];
const ACTIVE = ['Requested','Accepted','On the way','In progress'];
const BK_SELECT = '*, customer:profiles!bookings_customer_id_fkey(name), provider:profiles!bookings_provider_id_fkey(name)';

/* ================= 2. Helpers ================= */
const $ = s => document.querySelector(s), app = $('#app'), layer = $('#layer');
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const ic = (n, st='') => `<i data-lucide="${n}" class="ic"${st?` style="${st}"`:''}></i>`;
const icons = () => { try { window.lucide && lucide.createIcons({attrs:{class:'ic'}}) } catch(e){} };
const first = n => String(n||'').split(' ')[0];
const initials = n => String(n||'?').replace(/^Al /,'').split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
const avaStyle = n => `background:hsl(${hash(n)%360} 35% 86%);color:hsl(${hash(n)%360} 40% 22%)`;
const money = n => 'SAR ' + Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2});
const money2 = n => 'SAR ' + Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmt12 = t => { const [h,m] = String(t||'08:00').split(':').map(Number); const hh = h%12||12; return `${hh}${m?':'+String(m).padStart(2,'0'):''} ${h<12?'am':'pm'}` };
function timeAgo(ts){const s=(Date.now()-new Date(ts))/1000;if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' hr ago';const d=Math.floor(s/86400);return d<30?d+(d===1?' day ago':' days ago'):new Date(ts).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
const clock = ts => new Date(ts).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true});
const dayLabel = iso => new Date(iso+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
function dayList(){const out=[];for(let i=0;i<7;i++){const x=new Date();x.setDate(x.getDate()+i);const iso=x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
  const f=dayLabel(iso);out.push({iso,label:i===0?'Today':i===1?'Tomorrow':f.split(' ')[0].replace(',',''),sub:f.replace(/^\w+,?\s/,'')})}return out}
function toE164(v){let d=String(v||'').replace(/[^\d+]/g,'');if(/^05\d{8}$/.test(d))return '+966'+d.slice(1);if(/^5\d{8}$/.test(d))return '+966'+d;if(/^966\d{9}$/.test(d))return '+'+d;if(/^\+\d{9,15}$/.test(d))return d;if(/^00\d{9,15}$/.test(d))return '+'+d.slice(2);return null}
function fmtPhone(p){if(!p)return '';p=String(p).replace(/\D/g,'');if(p.startsWith('966')&&p.length===12)return `+966 ${p.slice(3,5)} ${p.slice(5,8)} ${p.slice(8)}`;return '+'+p}
function hoursText(pp){const d=pp.work_days||[6,0,1,2,3,4];let days;if(d.length===7)days='Daily';else if(d.length===6&&!d.includes(5))days='Sat – Thu';else days=[6,0,1,2,3,4,5].filter(x=>d.includes(x)).map(x=>DAYN[x]).join(', ');return `${days}, ${fmt12(pp.work_from)} – ${fmt12(pp.work_to)}`}
function check(id,ok,msg){const f=document.getElementById('f-'+id);if(!f)return ok;f.classList.toggle('bad',!ok);const e=f.querySelector('.err');if(e){e.hidden=ok;if(msg)e.textContent=msg}return ok}
const radio = n => { const e = document.querySelector(`input[name="${n}"]:checked`); return e ? e.value : '' };
const one = x => Array.isArray(x) ? x[0] : x;
async function q(p){ const { data, error, count } = await p; if (error) throw error; return count != null && data == null ? count : data; }
async function cnt(p){ const { count, error } = await p; if (error) throw error; return count || 0; }
function friendly(e){const m=(e&&e.message)||String(e);if(/Failed to fetch|NetworkError/i.test(m))return 'No connection. Check your internet and try again.';if(/rate limit|too many/i.test(m))return 'Too many tries. Wait a minute and try again.';if(/expired|invalid.*(otp|token)/i.test(m))return 'That code is wrong or has expired. Request a new one.';return m.replace(/^.*?: /,'')}
let tt;function toast(m,bad){clearTimeout(tt);let t=$('.toast');if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}
  t.innerHTML=`${ic(bad?'alert-circle':'check-circle-2','width:18px;height:18px')}<span>${esc(m)}</span>`;icons();tt=setTimeout(()=>t.remove(),3600)}
const fail = e => { console.error(e); toast(friendly(e), true); };

/* ================= 3. State ================= */
const S = { session:null, me:null, pp:null, view:'auth', p:{}, authTab:'login', otp:null, pending:null, city:'Riyadh',
  sort:'rating', filter:'all', seg:'new', cseg:'active', aseg:'review', bseg:'active', tseg:'Open', devMode:true, unread:0, counts:{} };
const uid = () => S.session && S.session.user.id;
const role = () => S.me && S.me.role;
try { const c = localStorage.getItem('kh_city'); if (c && CITIES.includes(c)) S.city = c; } catch(e){}

async function loadMe(){
  S.me = await q(sb.from('profiles').select('*').eq('id', uid()).maybeSingle());
  S.pp = null;
  if (S.me && S.me.role === 'provider') S.pp = await q(sb.from('provider_profiles').select('*').eq('user_id', uid()).maybeSingle());
  if (S.me && S.me.role === 'customer' && !localStorage.getItem('kh_city')) S.city = S.me.city;
}
const homeFor = () => !S.me ? 'complete' : S.me.role === 'provider' ? 'jobs' : S.me.role === 'admin' ? 'aoverview' : 'home';

/* ================= 4. Navigation and chrome ================= */
const NAV = {
  customer:[['home','search','Find','Find a service'],['bookings','clipboard-list','Bookings','My bookings'],['notifs','bell','Alerts','Notifications'],['account','user','Account','Account']],
  provider:[['jobs','inbox','Jobs','Jobs'],['earnings','wallet','Earnings','Earnings'],['notifs','bell','Alerts','Notifications'],['account','user','Account','Account']],
  admin:[['aoverview','layout-dashboard','Overview','Overview'],['aproviders','users','Providers','Providers'],['abookings','clipboard-list','Bookings','Bookings'],['atickets','life-buoy','Tickets','Support tickets']]
};
const PARENT = {cat:'home',pro:'home',favorites:'account',addresses:'account',help:'account',terms:'account',profile:'account',docs:'account',reviews:'account'};
function curTab(){ if (S.view==='booking') return role()==='provider'?'jobs':role()==='admin'?'abookings':'bookings'; return PARENT[S.view] || S.view; }
async function refreshCounts(){
  if (!S.me) return;
  try {
    const c = {};
    c.notifs = await cnt(sb.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',uid()).eq('is_read',false));
    if (role()==='customer') c.bookings = await cnt(sb.from('bookings').select('id',{count:'exact',head:true}).eq('customer_id',uid()).in('status',ACTIVE));
    if (role()==='provider') c.jobs = await cnt(sb.from('bookings').select('id',{count:'exact',head:true}).eq('provider_id',uid()).eq('status','Requested'));
    if (role()==='admin') {
      c.aproviders = await cnt(sb.from('provider_profiles').select('user_id',{count:'exact',head:true}).eq('status','Under review'));
      c.atickets = await cnt(sb.from('tickets').select('id',{count:'exact',head:true}).eq('status','Open'));
    }
    S.counts = c; chrome();
  } catch(e){ console.warn(e); }
}
function chrome(){
  const u = S.me;
  document.body.classList.toggle('has-bot', !!u);
  $('#botnav').hidden = !u;
  const rc = $('#rolechip'); rc.hidden = !u || u.role === 'customer'; rc.textContent = u ? (u.role==='admin'?'Admin':'Provider') : '';
  $('#devbar').hidden = !S.devMode;
  if (!u) { $('#topnav').innerHTML=''; $('#topright').innerHTML = S.session ? `<button class="btn ghost sm" data-a="logout">Log out</button>` : ''; return; }
  const items = NAV[u.role], cur = curTab(), c = S.counts;
  const badge = k => c[k] && k!=='notifs' ? `<span class="badge-n">${c[k]}</span>` : '';
  $('#topnav').innerHTML = items.filter(([k])=>k!=='notifs'&&k!=='account').map(([k,,,l])=>`<button data-go="${k}" aria-current="${k===cur?'page':'false'}">${l}${badge(k)}</button>`).join('');
  $('#botnav').innerHTML = items.map(([k,i,l])=>`<button data-go="${k}" aria-current="${k===cur?'page':'false'}">${ic(i)}<span>${l}</span>${c[k]?`<span class="badge-n">${c[k]}</span>`:''}</button>`).join('');
  $('#topright').innerHTML = (u.role==='customer'?`<label class="city">${ic('map-pin','width:16px;height:16px')}<select id="city" aria-label="City">${CITIES.map(x=>`<option ${S.city===x?'selected':''}>${x}</option>`).join('')}</select></label>`:'')
    + `<button class="bell" data-go="notifs" aria-label="Notifications">${ic('bell','width:18px;height:18px')}${c.notifs?`<span class="dot">${c.notifs}</span>`:''}</button>`
    + `<button class="me" data-go="account" aria-label="Account"><span class="ava-s">${esc(initials(u.name))}</span><span class="nm">${esc(first(u.name))}</span></button>`;
  icons();
}
function go(view, p){ if (view==='start') view = S.session ? homeFor() : 'auth'; S.view = view; S.p = p || {}; if (view==='cat') S.filter='all'; render(); window.scrollTo(0,0); }
let renderSeq = 0;
async function render(keepScroll){
  if (!S.session && S.view !== 'auth') S.view = 'auth';
  if (S.session && !S.me && S.view !== 'complete') S.view = 'complete';
  const mySeq = ++renderSeq, y = window.scrollY;
  const draft = $('#chatin') ? $('#chatin').value : null;
  chrome();
  const V = {auth:authView, complete:completeView, home:homeView, cat:catView, pro:proView, bookings:bookingsView, booking:bookingView, notifs:notifsView, account:accountView,
    addresses:addressesView, favorites:favoritesView, help:helpView, terms:termsView, jobs:jobsView, earnings:earningsView, profile:profileView, docs:docsView, reviews:reviewsView,
    aoverview:aOverview, aproviders:aProviders, abookings:aBookings, atickets:aTickets};
  if (!keepScroll) app.innerHTML = `<div class="wrap page"><div class="loading">${ic('loader-circle')}Loading…</div></div>`, icons();
  let html;
  try { html = await (V[S.view] || homeView)(); }
  catch(e) { console.error(e); html = `<div class="wrap page"><div class="empty"><span class="tile">${ic('wifi-off','width:26px;height:26px')}</span><h3>Couldn't load this page</h3><p>${esc(friendly(e))}</p><button class="btn" data-a="retry">Try again</button></div></div>`; }
  if (mySeq !== renderSeq) return;
  app.innerHTML = html;
  if (draft != null && $('#chatin')) $('#chatin').value = draft;
  const m = $('.msgs'); if (m) m.scrollTop = m.scrollHeight;
  if (S.view === 'auth') bindAuth();
  if (S.view === 'home') bindSearch();
  if (S.view === 'notifs') sb.from('notifications').update({is_read:true}).eq('user_id',uid()).eq('is_read',false).then(()=>setTimeout(refreshCounts,800));
  icons();
  if (keepScroll) window.scrollTo(0, y);
}
const back = (to,label,p) => `<button class="back" data-go="${to}"${p?Object.entries(p).map(([k,v])=>` data-${k}="${esc(v)}"`).join(''):''}>${ic('chevron-left')}${label}</button>`;
function pillFor(status, r){
  const m = {Requested:['req',r==='customer'?'Waiting for provider':'New request'],Accepted:['ok','Accepted'],'On the way':['ok','On the way'],'In progress':['ok','In progress'],Completed:['done','Completed'],Declined:['can','Declined'],Cancelled:['can','Cancelled']};
  const x = m[status] || ['done',status]; return `<span class="pill ${x[0]}">${x[1]}</span>`;
}
const stars = n => `<span class="star">${'★'.repeat(Math.round(n))}<span style="color:var(--line)">${'★'.repeat(5-Math.round(n))}</span></span>`;
const emptyBox = (icon,title,text,btn) => `<div class="empty"><span class="tile">${ic(icon,'width:26px;height:26px')}</span><h3>${title}</h3><p>${text}</p>${btn||''}</div>`;

/* ================= 5. Login with a code ================= */
function authView(){
  const lg = S.authTab === 'login';
  return `<div class="wrap"><section class="auth">
    <div class="auth-side">
      <div class="eyebrow">Riyadh · Dammam</div>
      <h1>Home services you can <em>trust</em>, booked in minutes.</h1>
      <p class="lead">Log in or create a free account to book a technician, or to receive jobs as a service provider.</p>
      <div class="roles-info">
        <div class="ri"><span class="tile">${ic('home')}</span><strong>For customers</strong><p>Find verified plumbers, electricians, AC technicians and rooms. Pay after the job is done.</p></div>
        <div class="ri"><span class="tile">${ic('hard-hat')}</span><strong>For service providers</strong><p>Technicians, companies and landlords get booking requests from customers in their districts.</p></div>
      </div>
    </div>
    <div class="card auth-card">
      ${S.otp ? otpForm() : `<div class="tabs" role="tablist"><button role="tab" aria-selected="${lg}" data-tab="login">Log in</button><button role="tab" aria-selected="${!lg}" data-tab="register">Create account</button></div>
      ${lg ? loginForm() : registerForm()}`}
    </div>
  </section></div>`;
}
function loginForm(){
  return `<form class="form" id="loginform" novalidate>
    <div class="formerr" id="autherr" hidden></div>
    <label class="f" id="f-lphone">WhatsApp number<input id="lphone" inputmode="tel" autocomplete="tel" placeholder="05X XXX XXXX"><span class="err" hidden>Enter a Saudi number starting with 05, or a full number starting with +.</span></label>
    <div class="wa">${ic('message-circle')}<span>We'll send a 6-digit login code to this number. No password needed.</span></div>
    <button class="btn full" type="submit" id="sendbtn">${ic('message-circle')}Send code</button>
    <p style="margin:0;text-align:center;font-size:14px" class="muted">New to Khidmah? <button type="button" class="linkbtn" data-tab="register">Create an account</button></p>
  </form>`;
}
function profileFields(prefix){
  return `<fieldset><legend>I want to</legend><div class="rolepick">
      <label class="opt"><input type="radio" name="role" id="role-c" value="customer" checked><span><strong>${ic('home','width:18px;height:18px')}Book services</strong><small>Customer account</small></span></label>
      <label class="opt"><input type="radio" name="role" id="role-p" value="provider"><span><strong>${ic('hard-hat','width:18px;height:18px')}Offer services</strong><small>Service provider account</small></span></label>
    </div></fieldset>
    <label class="f" id="f-rname"><span id="rname-l">Full name</span><input id="rname" autocomplete="name"><span class="err" hidden>Enter your name.</span></label>
    <div class="row2">
      ${prefix==='reg'?`<label class="f" id="f-rphone">WhatsApp number<input id="rphone" inputmode="tel" autocomplete="tel" placeholder="05X XXX XXXX"><span class="err" hidden>Enter a Saudi number starting with 05, or a full number starting with +.</span></label>`:''}
      <label class="f">City<select id="rcity">${CITIES.map(c=>`<option>${c}</option>`).join('')}</select></label>
    </div>
    <div id="provfields" hidden class="form">
      <fieldset><legend>Provider type</legend><div class="opts">${PTYPES.map((t,i)=>`<label class="opt"><input type="radio" name="ptype" id="ptype${i}" value="${t}" ${i===0?'checked':''}><span>${t}</span></label>`).join('')}</div></fieldset>
      <fieldset id="f-rcats"><legend>Services you offer</legend><div class="opts">${CATS.map(c=>`<label class="opt"><input type="checkbox" name="rcat" id="rc-${c.id}" value="${c.id}"><span>${esc(c.name)}</span></label>`).join('')}</div><span class="err" hidden>Pick at least one service.</span></fieldset>
      <div class="row2">
        <label class="f" id="f-rprice"><span id="rprice-l">Starting price (SAR)</span><input id="rprice" type="number" inputmode="numeric" min="10" placeholder="e.g. 100"><span class="err" hidden>Enter a starting price of at least SAR 10.</span></label>
        <label class="f">Experience<select id="ryears"><option>Less than 1 yr</option><option>1–3 yrs experience</option><option selected>3–5 yrs experience</option><option>5–10 yrs experience</option><option>10+ yrs experience</option></select></label>
      </div>
    </div>
    <label class="check" id="f-rterms"><input type="checkbox" id="rterms"><span>I agree to the <button type="button" class="linkbtn" data-a="termsSheet">Terms of Service and Privacy Policy</button><span class="err" hidden style="display:block">Please accept the terms to continue.</span></span></label>`;
}
function registerForm(){
  return `<form class="form" id="regform" novalidate>
    <div class="formerr" id="autherr" hidden></div>
    ${profileFields('reg')}
    <div class="wa">${ic('message-circle')}<span>Next, we'll send a code to your number to confirm it.</span></div>
    <button class="btn full" type="submit" id="sendbtn">Verify number and create account</button>
    <p style="margin:0;text-align:center;font-size:14px" class="muted">Already have an account? <button type="button" class="linkbtn" data-tab="login">Log in</button></p>
  </form>`;
}
function readProfileForm(form, needPhone){
  const prov = $('#role-p').checked;
  const ok = [check('rname', $('#rname').value.trim().length > 1), check('rterms', $('#rterms').checked)];
  let phone = null;
  if (needPhone) { phone = toE164($('#rphone').value); ok.push(check('rphone', !!phone)); }
  let cats = [];
  if (prov) { cats = [...form.querySelectorAll('input[name=rcat]:checked')].map(x=>x.value); $('#f-rcats .err').hidden = cats.length > 0; ok.push(cats.length > 0, check('rprice', +$('#rprice').value >= 10)); }
  if (ok.includes(false)) { const b = form.querySelector('.bad input'); b && b.focus(); return null; }
  const city = $('#rcity').value;
  return { phone, profile: { role: prov ? 'provider' : 'customer', name: $('#rname').value.trim(), city },
    provider: prov ? { provider_type: radio('ptype'), services: cats, price_from: +$('#rprice').value, experience: $('#ryears').value, districts: [...DISTRICTS[city]], vat_registered: radio('ptype')==='Company' } : null };
}
function syncProfileForm(form){
  const sync = () => { const prov = $('#role-p').checked; $('#provfields').hidden = !prov; $('#rname-l').textContent = prov ? 'Name or company name' : 'Full name';
    const land = prov && $('#ptype2').checked; $('#rprice-l').textContent = land ? 'Monthly rent from (SAR)' : 'Starting price (SAR)'; if (land) $('#rc-rooms').checked = true; };
  form.querySelectorAll('input[name=role],input[name=ptype]').forEach(r => r.onchange = sync);
}
function otpForm(){
  const o = S.otp;
  return `<form class="form" id="otpform" novalidate>
    <button type="button" class="back" id="otpback" style="margin:0">${ic('chevron-left')}Change number</button>
    <div><h3 style="font-size:22px">Enter the code</h3><p class="muted" style="margin:6px 0 0">We sent a 6-digit code to <strong style="color:var(--ink);white-space:nowrap">${fmtPhone(o.phone)}</strong>.</p></div>
    ${S.devMode ? `<div class="devcode" id="devcode">Test mode: real messages aren't connected yet, so your code appears here. <b id="devcodeval">Fetching…</b></div>` : ''}
    <div class="otp" id="otpbox" role="group" aria-label="6-digit code">${[0,1,2,3,4,5].map(i=>`<input id="otp${i}" inputmode="numeric" maxlength="1" autocomplete="${i===0?'one-time-code':'off'}" aria-label="Digit ${i+1}">`).join('')}</div>
    <div class="formerr" id="otperr" hidden></div>
    <button class="btn full" type="submit" id="otpbtn">${S.pending ? 'Verify and create account' : 'Log in'}</button>
    <div class="resend" id="resend"></div>
  </form>`;
}
let otpTimer = null;
async function sendCode(phone){
  const { error } = await sb.auth.signInWithOtp({ phone, options: { shouldCreateUser: true } });
  if (error) throw error;
  S.otp = { phone, resendAt: Date.now() + 60e3 };
  try { localStorage.setItem('kh_pending', JSON.stringify(S.pending || null)); } catch(e){}
  render();
}
function bindAuth(){
  app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { S.authTab = b.dataset.tab; render(); });
  if (S.otp) return bindOtp();
  const err = $('#autherr'), btn = $('#sendbtn');
  const busy = on => { btn.disabled = on; };
  const lf = $('#loginform');
  if (lf) lf.onsubmit = async e => { e.preventDefault(); err.hidden = true;
    const phone = toE164($('#lphone').value); if (!check('lphone', !!phone)) return;
    S.pending = null; busy(true);
    try { await sendCode(phone); } catch(ex) { err.textContent = friendly(ex); err.hidden = false; busy(false); }
  };
  const rf = $('#regform');
  if (rf) { syncProfileForm(rf);
    rf.onsubmit = async e => { e.preventDefault(); err.hidden = true;
      const d = readProfileForm(rf, true); if (!d) return;
      S.pending = { profile: d.profile, provider: d.provider }; busy(true);
      try { await sendCode(d.phone); } catch(ex) { err.textContent = friendly(ex); err.hidden = false; busy(false); }
    };
  }
}
function bindOtp(){
  const o = S.otp, boxes = [...app.querySelectorAll('.otp input')], err = $('#otperr');
  const code = () => boxes.map(b => b.value).join('');
  if (S.devMode) {
    const fetchCode = async (n) => { const { data } = await sb.rpc('dev_get_code', { p_phone: o.phone }); const el = $('#devcodeval'); if (!el) return;
      if (data) el.textContent = data; else if (n < 6) setTimeout(() => fetchCode(n+1), 1000); else el.textContent = 'Not found. Check the Supabase hook is turned on.'; };
    setTimeout(() => fetchCode(0), 700);
  }
  let verifying = false;
  const verify = async () => {
    if (verifying) return;
    if (code().length < 6) { err.textContent = 'Enter all 6 digits of the code.'; err.hidden = false; return; }
    verifying = true; $('#otpbtn').disabled = true;
    const { data, error } = await sb.auth.verifyOtp({ phone: o.phone, token: code(), type: 'sms' });
    if (error) { verifying = false; $('#otpbtn').disabled = false; $('#otpbox').classList.add('bad'); err.textContent = friendly(error); err.hidden = false; boxes.forEach(b=>b.value=''); boxes[0].focus(); return; }
    clearInterval(otpTimer); S.otp = null; S.session = data.session;
    try { await afterLogin(); } catch(ex) { fail(ex); }
  };
  boxes.forEach((b,i) => {
    b.oninput = () => { b.value = b.value.replace(/\D/g,'').slice(-1); $('#otpbox').classList.remove('bad'); err.hidden = true; if (b.value && i < 5) boxes[i+1].focus(); if (code().length === 6) verify(); };
    b.onkeydown = e => { if (e.key==='Backspace' && !b.value && i>0) { boxes[i-1].focus(); boxes[i-1].value=''; } };
    b.onpaste = e => { const t = (e.clipboardData||window.clipboardData).getData('text').replace(/\D/g,'').slice(0,6); if (!t) return; e.preventDefault(); t.split('').forEach((d,k)=>{ if (boxes[k]) boxes[k].value = d }); if (t.length===6) verify(); };
  });
  boxes[0].focus();
  $('#otpform').onsubmit = e => { e.preventDefault(); verify(); };
  $('#otpback').onclick = () => { clearInterval(otpTimer); S.otp = null; render(); };
  const tick = () => { const el = $('#resend'); if (!el || !S.otp) { clearInterval(otpTimer); return; }
    const left = Math.ceil((o.resendAt - Date.now())/1000);
    if (left > 0) el.textContent = `Didn't get it? You can request a new code in 0:${String(left).padStart(2,'0')}`;
    else if (!el.querySelector('button')) { el.innerHTML = `Didn't get it? <button type="button" class="linkbtn" id="resendbtn">Send a new code</button>`;
      $('#resendbtn').onclick = () => sendCode(o.phone).then(() => toast('New code sent')).catch(fail); } };
  clearInterval(otpTimer); tick(); otpTimer = setInterval(tick, 1000);
}
async function afterLogin(){
  await loadMe();
  if (!S.me) {
    let pending = S.pending; if (!pending) { try { pending = JSON.parse(localStorage.getItem('kh_pending')); } catch(e){} }
    if (pending) { await createProfile(pending); try { localStorage.removeItem('kh_pending'); } catch(e){} }
  }
  S.pending = null;
  startRealtime(); refreshCounts();
  go(homeFor());
  if (S.me) toast(`Welcome, ${first(S.me.name)}`);
}
async function createProfile(d){
  await q(sb.from('profiles').insert({ id: uid(), ...d.profile }));
  if (d.provider) await q(sb.from('provider_profiles').insert({ user_id: uid(), ...d.provider }));
  await loadMe();
}
function completeView(){
  return `<div class="wrap page"><div class="narrow stack">
    <div class="sec-h" style="margin:0"><div><h2>Finish setting up your account</h2><p>Your number ${fmtPhone(S.session.user.phone)} is confirmed. Tell us a little about you.</p></div></div>
    <form class="card form" id="completeform" novalidate>${profileFields('complete')}<button class="btn full" type="submit">Create account</button></form>
  </div></div>`;
}

/* ================= 6. Customer screens ================= */
async function homeView(){
  const active = one(await q(sb.from('bookings').select(BK_SELECT).eq('customer_id',uid()).in('status',ACTIVE).order('created_at',{ascending:false}).limit(1)));
  return `<div class="wrap">
  <section class="hero">
    <div>
      <div class="eyebrow">Hi ${esc(first(S.me.name))} · ${esc(S.city)}</div>
      <h1>Something broken at home? Get a <em>trusted technician</em> today.</h1>
      <p class="lead">Compare verified plumbers, electricians, AC technicians and more in ${esc(S.city)}. See starting prices in SAR, book a time slot, and pay after the job is done.</p>
      <div class="search" role="search">${ic('search','color:var(--muted)')}<input id="q" type="search" autocomplete="off" placeholder="Try “AC gas refill” or “leaking tap”" aria-label="Search services"><button class="btn" id="qgo">Search</button><div class="sugg" id="sugg" hidden></div></div>
      <div class="quick">${['ac','plumbing','electrical','cleaning','rooms'].map(id=>`<button class="chip" data-go="cat" data-cat="${id}">${esc(catById(id).name)}</button>`).join('')}</div>
    </div>
    ${active ? `<aside class="steps" aria-label="Your current booking">
      <div class="bk-top"><div><div class="ref">${esc(active.ref)} · your current booking</div><h3 style="margin-top:4px">${esc(active.service)}</h3></div>${pillFor(active.status,'customer')}</div>
      ${timelineBar(active, [])}
      <dl class="kv"><dt>Provider</dt><dd>${esc(active.provider && active.provider.name)}</dd><dt>When</dt><dd>${dayLabel(active.visit_date)} · ${esc(active.visit_slot)}</dd></dl>
      <button class="btn" data-go="booking" data-id="${active.id}">Track booking</button></aside>`
    : `<aside class="steps" aria-label="How booking works"><h3>How a booking works</h3>
      <div class="step"><b>1</b><div><strong>Pick a service</strong><p>Choose the job and compare providers near your district.</p></div></div>
      <div class="step"><b>2</b><div><strong>Choose a time</strong><p>As soon as possible, or a slot up to 7 days ahead.</p></div></div>
      <div class="step"><b>3</b><div><strong>Track and chat</strong><p>See when the technician is on the way and message them.</p></div></div>
      <div class="step"><b>4</b><div><strong>Pay after the job</strong><p>Cash, mada, Apple Pay or STC Pay, with a receipt including VAT.</p></div></div>
      <div class="trust"><span>${ic('shield-check')}Iqama / CR verified</span><span>${ic('badge-check')}30-day work guarantee</span><span>${ic('star')}Rated by real customers</span></div></aside>`}
  </section>
  <section class="block"><div class="sec-h"><div><h2>All services</h2><p>${CATS.length} categories in ${esc(S.city)}</p></div></div>
    <div class="grid-cats">${CATS.map(c=>`<button class="cat" data-go="cat" data-cat="${c.id}"><span class="tile">${ic(c.icon,'width:22px;height:22px')}</span><strong>${esc(c.name)}</strong><small>${c.rooms?'Monthly rent':'Book a visit'}</small></button>`).join('')}</div>
  </section></div>`;
}
async function favIds(){ return (await q(sb.from('favorites').select('provider_id').eq('customer_id',uid()))).map(f=>f.provider_id); }
function proCard(p, catId, favs){
  const fav = favs.includes(p.id), room = catId === 'rooms';
  return `<article class="pro">
    <button class="ava" style="${avaStyle(p.name)}" data-go="pro" data-id="${p.id}" data-cat="${catId}" aria-label="View ${esc(p.name)}">${esc(initials(p.name))}</button>
    <div class="pro-main">
      <div class="pro-top"><button class="linkname" data-go="pro" data-id="${p.id}" data-cat="${catId}">${esc(p.name)}</button>${p.verified?`<span class="verified">${ic('badge-check')}Verified</span>`:''}${+p.jobs_done<3?'<span class="newtag">New</span>':''}
        ${role()==='customer'?`<button class="heart" data-a="fav" data-id="${p.id}" aria-pressed="${fav}" aria-label="${fav?'Remove from':'Save to'} favourites">${ic('heart')}</button>`:''}</div>
      <div class="meta">${+p.review_count?`<span class="star">★ ${(+p.rating).toFixed(1)}</span><span>${p.review_count} reviews</span>`:'<span>No reviews yet</span>'}<span>${p.jobs_done} jobs done</span>${p.experience?`<span>${esc(p.experience)}</span>`:''}</div>
      <div class="meta"><span>${ic('map-pin')}${(p.districts||[]).slice(0,3).map(esc).join(', ')||esc(p.city)}</span></div>
      <div class="tags">${(p.languages||[]).map(l=>`<span>${esc(l)}</span>`).join('')}</div>
      <div class="pro-foot"><div class="price"><small>${room?'Rent from':'Visit + labour from'}</small><b>SAR ${+p.price_from}</b>${room?' <span class="muted">/ month</span>':''}</div>
        <div class="btns"><button class="btn line sm" data-go="pro" data-id="${p.id}" data-cat="${catId}">Profile</button>${role()==='customer'?`<button class="btn sm" data-a="book" data-id="${p.id}" data-cat="${catId}">${room?'Request viewing':'Book'}</button>`:''}</div></div>
    </div></article>`;
}
async function catView(){
  const c = catById(S.p.cat);
  let list = await q(sb.from('provider_cards').select('*').eq('city',S.city).eq('available',true).contains('services',[c.id]));
  if (S.filter==='verified') list = list.filter(p=>p.verified);
  if (S.filter==='company') list = list.filter(p=>p.provider_type==='Company');
  if (S.filter==='solo') list = list.filter(p=>p.provider_type==='Individual technician');
  list.sort(S.sort==='price'?(a,b)=>a.price_from-b.price_from:S.sort==='jobs'?(a,b)=>b.jobs_done-a.jobs_done:(a,b)=>(b.rating-a.rating)||(b.verified-a.verified));
  const favs = await favIds();
  const chip = (k,l) => `<button class="chip" data-a="filter" data-v="${k}" aria-pressed="${S.filter===k}">${l}</button>`;
  return `<div class="wrap page" style="padding-top:24px">${back('home','All services')}
    <div class="res-head"><span class="tile">${ic(c.icon,'width:26px;height:26px')}</span><div><h1>${c.rooms?'Rooms for rent in '+esc(S.city):esc(c.name)}</h1><div class="muted">${list.length} ${c.rooms?'owners':'providers'} in ${esc(S.city)}${c.rooms?'':' · '+c.subs.slice(0,3).map(esc).join(', ')+' and more'}</div></div></div>
    ${c.rooms?'':`<div class="toolbar">${chip('all','All')}${chip('verified','Verified only')}${chip('company','Companies')}${chip('solo','Individual technicians')}
      <select id="sort" aria-label="Sort by">${[['rating','Top rated'],['price','Lowest price'],['jobs','Most jobs done']].map(([v,l])=>`<option value="${v}" ${S.sort===v?'selected':''}>${l}</option>`).join('')}</select></div>`}
    ${list.length ? `<div class="list two" style="margin-top:16px">${list.map(p=>proCard(p,c.id,favs)).join('')}</div>`
      : emptyBox('users', `No ${c.rooms?'room owners':'providers'} here yet`, `Nobody offers ${esc(c.name.toLowerCase())} in ${esc(S.city)} yet. Try another city, or check back soon as new providers join.`)}
    ${c.rooms?'':'<p class="note">The technician confirms the final price on site before starting work. Spare parts are charged separately and shown on your receipt.</p>'}
  </div>`;
}
async function proView(){
  const p = await q(sb.from('provider_cards').select('*').eq('id',S.p.id).maybeSingle());
  const r = role(), backBtn = r==='customer' ? back('cat', catById(S.p.cat||'ac').name, {cat:S.p.cat||'ac'}) : r==='provider' ? back('profile','My services') : back('aproviders','Providers');
  if (!p) return `<div class="wrap page">${backBtn}${emptyBox('user-x','This provider is not available','They may have paused new jobs.')}</div>`;
  const catId = S.p.cat || p.services[0], c = catById(catId);
  const revs = await q(sb.from('reviews').select('*').eq('provider_id',p.id).order('created_at',{ascending:false}).limit(20));
  const favs = r==='customer' ? await favIds() : [], fav = favs.includes(p.id);
  const services = (p.services||[]).filter(s=>s!=='rooms').map(catById);
  return `<div class="wrap page" style="padding-top:24px">${backBtn}
    <div class="phead"><div class="ava" style="${avaStyle(p.name)}">${esc(initials(p.name))}</div>
      <div style="min-width:0"><div class="pro-top"><h1>${esc(p.name)}</h1>${p.verified?`<span class="verified">${ic('badge-check')}Verified</span>`:''}</div>
      <div class="meta" style="margin-top:6px">${+p.review_count?`<span class="star">★ ${(+p.rating).toFixed(1)}</span><span>${p.review_count} reviews</span>`:'<span>No reviews yet</span>'}<span>${p.jobs_done} jobs done</span>${p.experience?`<span>${esc(p.experience)}</span>`:''}<span>${ic('map-pin')}${esc(p.city)}</span><span>${esc(p.provider_type)}</span></div></div></div>
    <div class="pgrid"><div class="stack">
      ${p.about?`<div class="card"><h3>About</h3><p style="margin:0">${esc(p.about)}</p></div>`:''}
      ${services.length?`<div class="card"><h3>Services</h3><div class="plist">${services.map(s=>`<div><span>${ic(s.icon,'width:16px;height:16px;vertical-align:-3px')} ${esc(s.name)}</span><span class="muted sm-txt">${s.subs.slice(0,3).map(esc).join(', ')}</span></div>`).join('')}</div>
        <p class="note" style="margin-top:10px">Labour from SAR ${+p.price_from}. Parts are extra and agreed with you before the work starts.</p></div>`:''}
      <div class="card"><h3>Reviews</h3>${revs.length?revs.map(rv=>`<div class="rev"><div class="meta"><strong style="color:var(--ink)">${esc(rv.customer_name)}</strong>${stars(rv.stars)}<span>${timeAgo(rv.created_at)}</span></div>${rv.body?`<p>${esc(rv.body)}</p>`:''}${rv.reply?`<div class="reply"><strong>Reply from ${esc(p.name)}:</strong> ${esc(rv.reply)}</div>`:''}</div>`).join(''):'<p class="muted" style="margin:0">No reviews yet. Reviews appear after completed jobs.</p>'}</div>
    </div><div class="stack sticky-cta">
      <div class="card"><div class="price"><small>${c.rooms?'Rent from':'Visit + labour from'}</small><b>SAR ${+p.price_from}</b></div>
        ${r==='customer'?`<div class="actions" style="margin-top:12px"><button class="btn" style="flex:1" data-a="book" data-id="${p.id}" data-cat="${catId}">${c.rooms?'Request a viewing':'Book now'}</button>
        <button class="btn line" data-a="fav" data-id="${p.id}" aria-pressed="${fav}">${ic('heart')}${fav?'Saved':'Save'}</button></div>`:`<p class="muted sm-txt" style="margin:10px 0 0">${r==='provider'?'This is how customers see your profile.':'Admin view of the public profile.'}</p>`}</div>
      <div class="card"><dl class="kv" style="gap:10px 16px"><dt>Hours</dt><dd>${esc(hoursText(p))}</dd><dt>Areas</dt><dd>${(p.districts||[]).length?p.districts.map(esc).join(', '):'All of '+esc(p.city)}</dd><dt>Languages</dt><dd>${(p.languages||[]).map(esc).join(', ')}</dd></dl></div>
    </div></div></div>`;
}
async function bookingsView(){
  const all = await q(sb.from('bookings').select(BK_SELECT+', bills(total)').eq('customer_id',uid()).order('created_at',{ascending:false}));
  const act = all.filter(b=>ACTIVE.includes(b.status)), past = all.filter(b=>!ACTIVE.includes(b.status)), list = S.cseg==='active'?act:past;
  return `<div class="wrap page"><div class="sec-h"><div><h2>My bookings</h2><p>Track jobs, chat with providers and see receipts</p></div></div>
    <div class="segs"><button data-a="seg" data-k="cseg" data-v="active" aria-pressed="${S.cseg==='active'}">Active (${act.length})</button><button data-a="seg" data-k="cseg" data-v="past" aria-pressed="${S.cseg==='past'}">Past (${past.length})</button></div>
    ${list.length ? `<div class="list two">${list.map(b=>bookingCard(b,'customer')).join('')}</div>` : emptyBox('calendar', S.cseg==='active'?'No active bookings':'No past bookings', 'When you book a technician or request a room viewing, it shows up here so you can track it.', `<button class="btn" data-go="home">Find a service</button>`)}
  </div>`;
}
function bookingCard(b, r){
  const other = r==='customer' ? (b.provider&&b.provider.name) : (b.customer&&b.customer.name)||'Customer';
  const bill = one(b.bills);
  return `<article class="bk click" data-go="booking" data-id="${b.id}" role="link" tabindex="0" aria-label="Open booking ${esc(b.ref)}">
    <div class="bk-top"><div><span class="ref">${esc(b.ref)}${b.urgent?' · <span style="color:var(--danger);font-weight:700">URGENT</span>':''}</span><br><strong>${esc(b.service)}</strong></div>${pillFor(b.status,r)}</div>
    <dl class="kv"><dt>${r==='customer'?'Provider':'Customer'}</dt><dd>${esc(other)}</dd><dt>When</dt><dd>${dayLabel(b.visit_date)} · ${esc(b.visit_slot)}</dd><dt>Where</dt><dd>${esc(b.district)}, ${esc(b.city)}</dd>
      <dt>${bill?'Total':b.kind==='room'?'Rent':'From'}</dt><dd>${bill?money2(bill.total):b.kind==='room'?money(b.rent)+' / month':money(b.price_from)}</dd></dl>
  </article>`;
}
function timelineBar(b, events){
  if (['Cancelled','Declined'].includes(b.status)) return '';
  const flow = b.kind==='room' ? ['Requested','Accepted','Completed'] : FLOW, idx = flow.indexOf(b.status);
  const label = s => b.kind==='room' ? {Requested:'Requested',Accepted:'Viewing confirmed',Completed:'Viewed'}[s] : s;
  return `<div class="tl" style="grid-template-columns:repeat(${flow.length},minmax(0,1fr))">${flow.map((s,i)=>{const t=events.filter(x=>x.status===s).pop();
    return `<div class="${i<=idx?'done':''}"><i></i><span>${label(s)}</span>${t&&i<=idx?`<small>${new Date(t.created_at).toLocaleTimeString('en-GB',{hour:'numeric',minute:'2-digit',hour12:true})}</small>`:''}</div>`}).join('')}</div>`;
}
async function bookingView(){
  const r = role(), backTo = r==='provider'?['jobs','Jobs']:r==='admin'?['abookings','All bookings']:['bookings','My bookings'];
  const b = await q(sb.from('bookings').select(BK_SELECT+', bills(*), reviews(*)').eq('id',S.p.id).maybeSingle());
  if (!b) return `<div class="wrap page">${back(...backTo)}${emptyBox('search-x','Booking not found','It may have been removed, or it belongs to another account.')}</div>`;
  const [events, msgs, phone] = await Promise.all([
    q(sb.from('booking_events').select('*').eq('booking_id',b.id).order('created_at')),
    q(sb.from('messages').select('*').eq('booking_id',b.id).order('created_at')),
    sb.rpc('get_contact_phone',{p_booking:b.id}).then(x=>x.data)
  ]);
  const bill = one(b.bills), review = one(b.reviews), finalS = ['Cancelled','Declined'].includes(b.status);
  const otherName = r==='customer' ? b.provider&&b.provider.name : b.customer&&b.customer.name;
  const phoneHtml = p => `<span class="phone">${fmtPhone(p)} <button class="copy" data-a="copy" data-text="${esc(fmtPhone(p))}">Copy</button></span>`;
  return `<div class="wrap page" style="padding-top:24px">${back(...backTo)}
    <div class="sec-h" style="align-items:start"><div><div class="ref">${esc(b.ref)} · booked ${timeAgo(b.created_at)}${b.urgent?' · <span style="color:var(--danger);font-weight:700">URGENT</span>':''}</div><h2 style="margin-top:4px">${esc(b.service)}</h2><p>${esc(catById(b.category).name)}</p></div>${pillFor(b.status,r)}</div>
    ${finalS?`<div class="banner bad">${ic('x-circle')}<div><strong>${b.status==='Cancelled'?'This booking was cancelled':'The provider declined this booking'}</strong>${b.status_reason?`<p>Reason: ${esc(b.status_reason)}</p>`:''}${r==='customer'?`<button class="btn sm" data-go="cat" data-cat="${b.category}">Find another provider</button>`:''}</div></div>`:''}
    <div class="bgrid"><div class="stack">
      ${finalS?'':`<div class="card">${timelineBar(b,events)}</div>`}
      <div class="card"><h3>Details</h3><dl class="kv" style="gap:10px 16px">
        ${r==='admin'?`<dt>Customer</dt><dd>${esc(b.customer&&b.customer.name)}${phone?' · '+phoneHtml(phone):''}</dd><dt>Provider</dt><dd>${esc(b.provider&&b.provider.name)}</dd>`
        :`<dt>${r==='customer'?(b.kind==='room'?'Owner':'Provider'):'Customer'}</dt><dd>${esc(otherName)}</dd><dt>Mobile</dt><dd>${phone?phoneHtml(phone):`<span class="muted">${r==='customer'?'Shown once the provider accepts':'Shown after you accept'}</span>`}</dd>`}
        <dt>When</dt><dd>${dayLabel(b.visit_date)} · ${esc(b.visit_slot)}</dd>
        <dt>Where</dt><dd>${esc(b.district)}, ${esc(b.city)}${b.address?`<br><span class="muted">${esc(b.address)}</span>`:''}</dd>
        ${b.note?`<dt>Note</dt><dd>${esc(b.note)}</dd>`:''}
        <dt>${b.kind==='room'?'Rent':'Price'}</dt><dd>${b.kind==='room'?money(b.rent)+' / month':'From '+money(b.price_from)+' (labour)'}</dd>
        <dt>Payment</dt><dd>${esc(bill?bill.paid_method:b.pay_method)}${bill?' · paid':' · after the job'}</dd>
      </dl></div>
      ${bill?receiptCard(b,bill):''}
      ${actionsCard(b,r)}
      ${b.status==='Completed'&&b.kind!=='room'?reviewCard(b,review,r):''}
    </div><div class="stack">${chatCard(b,msgs,r)}</div></div>
  </div>`;
}
function receiptCard(b, bill){
  return `<div class="card"><h3>Receipt</h3><div class="bill">
    <div><span>Labour</span><span>${money2(bill.labour)}</span></div>
    <div><span>Parts${bill.parts_note?` <span class="muted">(${esc(bill.parts_note)})</span>`:''}</span><span>${money2(bill.parts)}</span></div>
    <div><span>VAT 15%</span><span>${bill.vat_applied?money2(bill.vat_amount):'<span class="muted">Not VAT registered</span>'}</span></div>
    <div class="tot"><span>Total paid</span><span>${money2(bill.total)}</span></div>
    <div class="muted sm-txt"><span>Paid by ${esc(bill.paid_method)} · ${clock(bill.created_at)}</span><span>${esc(b.ref)}</span></div>
  </div></div>`;
}
function actionsCard(b, r){
  const A = [];
  if (r==='customer') {
    if (['Requested','Accepted'].includes(b.status)) A.push(`<button class="btn line sm" data-a="reschedule" data-id="${b.id}">${ic('calendar')}Reschedule</button>`,`<button class="btn line sm" data-a="cancel" data-id="${b.id}">${ic('x')}Cancel booking</button>`);
    if (b.status!=='Requested' && !['Cancelled','Declined'].includes(b.status)) A.push(`<button class="btn line sm" data-a="report" data-id="${b.id}">${ic('flag')}Report a problem</button>`);
    if (b.status==='Completed' && b.kind!=='room') A.push(`<button class="btn sm" data-a="book" data-id="${b.provider_id}" data-cat="${b.category}">${ic('rotate-ccw')}Book again</button>`);
  }
  if (r==='provider') {
    if (b.status==='Requested') A.push(`<button class="btn sm" data-a="status" data-id="${b.id}" data-v="Accepted">${ic('check')}Accept</button>`,`<button class="btn line sm" data-a="decline" data-id="${b.id}">Decline</button>`);
    if (b.kind==='room' && b.status==='Accepted') A.push(`<button class="btn sm" data-a="status" data-id="${b.id}" data-v="Completed">${ic('check')}Mark viewing as done</button>`);
    else if (b.status==='Accepted') A.push(`<button class="btn sm" data-a="status" data-id="${b.id}" data-v="On the way">${ic('navigation')}I'm on the way</button>`);
    if (b.status==='On the way') A.push(`<button class="btn sm" data-a="status" data-id="${b.id}" data-v="In progress">${ic('play')}Start job</button>`);
    if (b.status==='In progress') A.push(`<button class="btn sm" data-a="finish" data-id="${b.id}">${ic('receipt')}Finish job and send bill</button>`);
    if (['Accepted','On the way'].includes(b.status)) A.push(`<button class="btn line sm" data-a="pcancel" data-id="${b.id}">Cancel job</button>`);
  }
  if (r==='admin' && ACTIVE.includes(b.status)) A.push(`<button class="btn line sm" data-a="acancel" data-id="${b.id}">${ic('x')}Cancel booking</button>`);
  if (!A.length) return '';
  return `<div class="card"><h3>${r==='admin'?'Admin actions':'Actions'}</h3><div class="actions">${A.join('')}</div></div>`;
}
function reviewCard(b, rv, r){
  if (!rv) return r==='customer' ? `<div class="card"><h3>How did it go?</h3><p class="muted" style="margin:0 0 12px">Your rating helps other customers and rewards good providers.</p><button class="btn" data-a="rate" data-id="${b.id}" data-pid="${b.provider_id}" data-name="${esc(b.provider&&b.provider.name)}">${ic('star')}Rate ${esc(first(b.provider&&b.provider.name))}</button></div>`
    : `<div class="card"><h3>Review</h3><p class="muted" style="margin:0">The customer hasn't rated this job yet.</p></div>`;
  return `<div class="card"><h3>${r==='customer'?'Your review':'Customer review'}</h3><div class="meta">${stars(rv.stars)}<span>${timeAgo(rv.created_at)}</span></div><p style="margin:6px 0 0">${esc(rv.body||'No comment')}</p>
    ${rv.reply?`<div class="reply"><strong>Reply from ${esc(b.provider&&b.provider.name)}:</strong> ${esc(rv.reply)}</div>`:r==='provider'?`<form class="form" data-form="reply" data-id="${b.id}" style="margin-top:12px"><label class="f">Reply publicly<textarea name="reply" rows="2" placeholder="Thank the customer or respond to their feedback"></textarea></label><div><button class="btn sm" type="submit">Post reply</button></div></form>`:''}</div>`;
}
function chatCard(b, msgs, r){
  const can = r!=='admin' && !['Cancelled','Declined'].includes(b.status);
  const names = {[b.customer_id]: b.customer&&b.customer.name, [b.provider_id]: b.provider&&b.provider.name};
  const otherName = r==='customer' ? b.provider&&b.provider.name : b.customer&&b.customer.name;
  return `<div class="card"><h3>${r==='admin'?'Conversation':'Messages with '+esc(first(otherName))}</h3>
    <div class="msgs" aria-live="polite">${msgs.map(m=>!m.sender_id?`<div class="msg sys">${esc(m.body)} · ${clock(m.created_at)}</div>`
      :`<div class="msg ${m.sender_id===uid()?'me':''}">${r==='admin'?`<strong class="sm-txt">${esc(first(names[m.sender_id]))}</strong><br>`:''}${esc(m.body)}<time>${clock(m.created_at)}</time></div>`).join('')}</div>
    ${can?`<form class="chatform" data-form="chat" data-id="${b.id}"><input id="chatin" autocomplete="off" placeholder="Write a message" aria-label="Message" maxlength="2000"><button class="btn sm" type="submit" aria-label="Send">${ic('send')}</button></form>
      <p class="muted sm-txt" style="margin:8px 0 0">Keep payments and contact inside Khidmah so the 30-day guarantee covers your job.</p>`:r==='admin'?'':'<p class="muted sm-txt" style="margin:10px 0 0">Messaging is closed for this booking.</p>'}</div>`;
}
async function notifsView(){
  const list = await q(sb.from('notifications').select('*').eq('user_id',uid()).order('created_at',{ascending:false}).limit(60));
  return `<div class="wrap page"><div class="narrow"><div class="sec-h"><div><h2>Notifications</h2><p>Updates on bookings, messages and your account</p></div></div>
    ${list.length?`<div class="card" style="padding:0;overflow:hidden">${list.map(n=>`<button class="notif ${n.is_read?'':'unread'}" ${n.booking_id?`data-go="booking" data-id="${n.booking_id}"`:''}>${ic(n.booking_id?'clipboard-list':'bell')}<span>${esc(n.body)}<small>${timeAgo(n.created_at)}</small></span></button>`).join('')}</div>`
    : emptyBox('bell','No notifications yet','Booking updates and new messages appear here. In the live app they also arrive on WhatsApp.')}</div></div>`;
}
async function accountView(){
  const u = S.me, since = new Date(u.created_at).toLocaleDateString('en-GB',{month:'long',year:'numeric'});
  const item = (g,i,l,sub) => `<button data-go="${g}">${ic(i)}<span>${l}</span>${sub!=null?`<span class="sub">${sub}</span>`:''}${ic('chevron-right','width:18px;height:18px')}</button>`;
  let menu;
  if (u.role==='customer') { const [a,f] = await Promise.all([cnt(sb.from('addresses').select('id',{count:'exact',head:true}).eq('user_id',uid())), cnt(sb.from('favorites').select('provider_id',{count:'exact',head:true}).eq('customer_id',uid()))]);
    menu = [item('addresses','map-pin','Saved addresses',a),item('favorites','heart','Favourite providers',f),item('help','life-buoy','Help and support'),item('terms','file-text','Terms and privacy')]; }
  else if (u.role==='provider') menu = [item('profile','store','My services and hours'),item('docs','shield-check','Verification documents',esc(S.pp&&S.pp.status)),item('reviews','star','Reviews'),item('earnings','wallet','Earnings'),item('help','life-buoy','Help and support'),item('terms','file-text','Terms and privacy')];
  else menu = [item('terms','file-text','Terms and privacy')];
  return `<div class="wrap page"><div class="narrow stack">
    <div class="card acct-head"><div class="ava">${esc(initials(u.name))}</div><div style="min-width:0"><h2 style="font-size:22px">${esc(u.name)}</h2>
      <div class="muted">${u.role==='provider'?esc(S.pp&&S.pp.provider_type):u.role==='admin'?'Administrator':'Customer'} · ${fmtPhone(S.session.user.phone)} · ${esc(u.city)}</div><div class="muted sm-txt">Member since ${since}</div></div>
      <button class="btn ghost sm" style="margin-left:auto" data-a="editme">Edit</button></div>
    <div class="card" style="padding-block:6px"><div class="menu">${menu.join('')}</div></div>
    <div class="actions"><button class="btn line" data-a="logout">${ic('log-out')}Log out</button></div>
    <p class="muted sm-txt" style="margin:0">To delete your account and data, contact support from the Help page.</p>
  </div></div>`;
}
async function addressesView(){
  const a = await q(sb.from('addresses').select('*').eq('user_id',uid()).order('created_at'));
  return `<div class="wrap page"><div class="narrow stack">${back('account','Account')}
    <div class="sec-h" style="margin:0"><div><h2>Saved addresses</h2><p>Pick one when booking so the technician finds you quickly</p></div></div>
    <div class="card">${a.length?a.map(x=>`<div class="row"><div><strong>${esc(x.label)}</strong><div class="muted sm-txt">${esc(x.district)} · ${esc(x.detail)}</div></div><button class="btn ghost sm" data-a="deladdr" data-id="${x.id}">Remove</button></div>`).join(''):'<p class="muted" style="margin:0">No saved addresses yet.</p>'}</div>
    <form class="card form" data-form="addaddr" novalidate><h3 style="margin:0">Add an address</h3>
      <div class="row2"><label class="f">Label<select name="label"><option>Home</option><option>Office</option><option>Family house</option><option>Other</option></select></label>
      <label class="f">District<select name="district">${DISTRICTS[S.city].map(d=>`<option>${d}</option>`).join('')}</select></label></div>
      <label class="f" id="f-adetail">Building, street and landmark<input name="detail" placeholder="e.g. Villa 12, Street 5, near Panda"><span class="err" hidden>Add the building and street so the technician can find you.</span></label>
      <div><button class="btn" type="submit">Save address</button></div></form></div></div>`;
}
async function favoritesView(){
  const ids = await favIds();
  const list = ids.length ? await q(sb.from('provider_cards').select('*').in('id',ids)) : [];
  return `<div class="wrap page">${back('account','Account')}<div class="sec-h"><div><h2>Favourite providers</h2><p>Providers you've saved for next time</p></div></div>
    ${list.length?`<div class="list two">${list.map(p=>proCard(p,p.services[0],ids)).join('')}</div>`:emptyBox('heart','No favourites yet','Tap the heart on a provider to save them here.',`<button class="btn" data-go="home">Browse services</button>`)}</div>`;
}
const FAQ = {
  customer:[['When do I pay?','After the job is done. You pay the technician by cash, mada card, Apple Pay or STC Pay, and you get a receipt in the app.'],
    ['What is the 30-day guarantee?','If the same problem comes back within 30 days of a completed job, open the booking and tap “Report a problem”. We arrange a free revisit or a refund of the labour.'],
    ['Can I change or cancel my booking?','Yes. Open the booking and use Reschedule or Cancel. Cancelling is free until the technician is on the way.'],
    ['How are providers verified?','Each provider uploads an iqama or national ID, and companies upload their CR and municipality licence. Our team checks them before the Verified badge appears.']],
  provider:[['How do I get the Verified badge?','Upload your documents under Account › Verification documents. Our team reviews them within 2 working days.'],
    ['When do I get paid?','Customers pay you directly after the job. Khidmah charges a platform fee on completed jobs, shown on your Earnings page.'],
    ['Can I pause new requests?','Yes. Turn off “Available for new jobs” under My services and hours. You stay hidden from search until you turn it back on.'],
    ["What if a customer doesn't show up?","Message them in the booking first. If you still can't reach them, cancel the job with the reason “Customer not reachable”."]]
};
async function helpView(){
  const mine = await q(sb.from('tickets').select('*, ticket_replies(body, created_at)').eq('user_id',uid()).order('created_at',{ascending:false}));
  return `<div class="wrap page"><div class="narrow stack">${back('account','Account')}
    <div class="sec-h" style="margin:0"><div><h2>Help and support</h2><p>Answers to common questions, or send us a message</p></div></div>
    <div class="card"><h3>Common questions</h3>${(FAQ[role()]||FAQ.customer).map(([qq,a])=>`<details class="faq"><summary>${esc(qq)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
    <form class="card form" data-form="ticket" novalidate><h3 style="margin:0">Contact support</h3>
      <label class="f">Topic<select name="subject"><option>Question about a booking</option><option>Payment issue</option><option>Account or login</option><option>Delete my account</option><option>Feedback or suggestion</option><option>Something else</option></select></label>
      <label class="f" id="f-tmsg">Message<textarea name="text" rows="4" placeholder="Tell us what happened. Include a booking number if you have one."></textarea><span class="err" hidden>Write a short message so we can help.</span></label>
      <div><button class="btn" type="submit">Send to support</button></div></form>
    ${mine.length?`<div class="card"><h3>Your tickets</h3>${mine.map(t=>`<div class="row" style="display:grid;gap:6px"><div class="bk-top"><div><span class="ref">${esc(t.ref)}</span><br><strong>${esc(t.subject)}</strong></div><span class="pill ${t.status==='Open'?'req':'done'}">${t.status}</span></div>
      <p style="margin:0" class="sm-txt">${esc(t.body)}</p>${(t.ticket_replies||[]).map(rp=>`<div class="reply"><strong>Khidmah support:</strong> ${esc(rp.body)}</div>`).join('')}</div>`).join('')}</div>`:''}
  </div></div>`;
}
function termsBody(){
  return `<div class="prose"><div class="banner" style="margin:0 0 6px">${ic('file-warning')}<div><strong>Draft</strong><p>These points show what the final terms need to cover. Have them written and reviewed by a lawyer before launch.</p></div></div>
    <h3>Using Khidmah</h3><p>Khidmah connects customers with independent service providers and room owners in Saudi Arabia. Providers are responsible for the work they carry out.</p>
    <h3>Bookings and payments</h3><p>Prices shown are starting prices for labour. The final price, including any parts and VAT, is agreed before work starts and shown on the receipt.</p>
    <h3>Cancellations</h3><p>Customers can cancel free of charge until the provider is on the way.</p>
    <h3>Your data</h3><p>We store your name, phone number, addresses and booking history to run the service, in line with Saudi Arabia's Personal Data Protection Law. Your number is shared with a provider only after they accept your booking.</p>
    <h3>Verification</h3><p>Providers upload identification and, for companies, a Commercial Registration. Documents are used only for verification.</p></div>`;
}
function termsView(){ return `<div class="wrap page"><div class="narrow stack">${back(S.me?'account':'auth','Back')}<div class="sec-h" style="margin:0"><div><h2>Terms and privacy</h2></div></div><div class="card">${termsBody()}</div></div></div>`; }

/* ================= 7. Provider screens ================= */
function verifyBanner(pp){
  if (pp.status==='Verified') return '';
  if (pp.status==='Under review') return `<div class="banner">${ic('hourglass')}<div><strong>Documents under review</strong><p>Our team is checking your documents. The Verified badge appears once approved.</p></div></div>`;
  if (pp.status==='Rejected') return `<div class="banner bad">${ic('shield-x')}<div><strong>Verification not approved</strong><p>${esc(pp.reject_reason||'Please upload clearer documents.')}</p><button class="btn sm" data-go="docs">Upload again</button></div></div>`;
  return `<div class="banner">${ic('shield-alert')}<div><strong>Get verified to win more jobs</strong><p>Customers prefer providers with the Verified badge. Upload your documents to start the check.</p><button class="btn sm" data-go="docs">Upload documents</button></div></div>`;
}
async function jobsView(){
  await loadMe();
  const pp = S.pp, mine = await q(sb.from('bookings').select(BK_SELECT+', bills(total)').eq('provider_id',uid()).order('created_at',{ascending:false}));
  const card = await q(sb.from('provider_cards').select('rating,review_count,jobs_done').eq('id',uid()).maybeSingle()) || {rating:0,review_count:0,jobs_done:0};
  const g = {new:mine.filter(b=>b.status==='Requested'),upcoming:mine.filter(b=>['Accepted','On the way','In progress'].includes(b.status)),past:mine.filter(b=>!ACTIVE.includes(b.status))};
  const list = g[S.seg] || g.new;
  return `<div class="wrap page"><div class="sec-h"><div><h2>Jobs</h2><p>${esc(S.me.name)} · ${esc(S.me.city)} · ${pp.services.map(s=>esc(catById(s).name)).join(', ')}</p></div></div>
    ${verifyBanner(pp)}
    ${pp.available===false?`<div class="banner">${ic('pause-circle')}<div><strong>You're hidden from customers</strong><p>Turn on “Available for new jobs” to appear in search again.</p><button class="btn sm" data-go="profile">Change availability</button></div></div>`:''}
    <div class="stats four"><div class="stat"><b>${g.new.length}</b><span>New requests</span></div><div class="stat"><b>${g.upcoming.length}</b><span>Upcoming jobs</span></div>
      <div class="stat"><b>${card.jobs_done}</b><span>Completed</span></div><div class="stat"><b>${+card.review_count?'★ '+(+card.rating).toFixed(1):'–'}</b><span>${+card.review_count?card.review_count+' reviews':'No reviews yet'}</span></div></div>
    <div class="segs">${[['new','New'],['upcoming','Upcoming'],['past','Past']].map(([k,l])=>`<button data-a="seg" data-k="seg" data-v="${k}" aria-pressed="${S.seg===k}">${l} (${g[k].length})</button>`).join('')}</div>
    ${list.length?`<div class="list two">${list.map(b=>bookingCard(b,'provider')).join('')}</div>`
      : emptyBox('inbox', S.seg==='new'?'No new requests':S.seg==='upcoming'?'No upcoming jobs':'Nothing here yet', S.seg==='new'?'When a customer in '+esc(S.me.city)+' books you, the request appears here.':'Accepted and finished jobs show up in these tabs.')}
  </div>`;
}
async function earningsView(){
  const done = await q(sb.from('bookings').select('id, ref, service, bills(*)').eq('provider_id',uid()).eq('status','Completed'));
  const rows = done.map(b=>({b,bill:one(b.bills)})).filter(x=>x.bill).map(x=>{const sub=+x.bill.labour+ +x.bill.parts, fee=Math.round(sub*FEE*100)/100;return {...x,fee,net:Math.round((+x.bill.total-fee)*100)/100}}).sort((a,b)=>new Date(b.bill.created_at)-new Date(a.bill.created_at));
  const now = new Date(), mStart = new Date(now.getFullYear(),now.getMonth(),1), sum=(a,k)=>a.reduce((s,x)=>s+x[k],0);
  const month = rows.filter(r=>new Date(r.bill.created_at)>=mStart), cash = rows.filter(r=>r.bill.paid_method==='Cash');
  return `<div class="wrap page"><div class="sec-h"><div><h2>Earnings</h2><p>Money from completed jobs, after the platform fee</p></div></div>
    <div class="stats four"><div class="stat"><b>${money(Math.round(sum(month,'net')))}</b><span>This month</span></div><div class="stat"><b>${money(Math.round(sum(rows,'net')))}</b><span>All time</span></div>
      <div class="stat"><b>${money(Math.round(sum(rows,'fee')))}</b><span>Platform fees</span></div><div class="stat"><b>${money(Math.round(sum(cash,'fee')))}</b><span>Fees owed on cash jobs</span></div></div>
    <div class="card">${rows.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Job</th><th>Paid by</th><th class="n">Total</th><th class="n">VAT</th><th class="n">Fee</th><th class="n">You keep</th></tr></thead><tbody>
      ${rows.map(r=>`<tr class="click" data-go="booking" data-id="${r.b.id}"><td>${new Date(r.bill.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td><td>${esc(r.b.service)}<br><span class="ref">${esc(r.b.ref)}</span></td><td>${esc(r.bill.paid_method)}</td><td class="n">${money2(r.bill.total)}</td><td class="n">${money2(r.bill.vat_amount)}</td><td class="n">${money2(r.fee)}</td><td class="n"><b>${money2(r.net)}</b></td></tr>`).join('')}
      </tbody></table></div>`:'<p class="muted" style="margin:0">No completed jobs yet. When you finish a job and send the bill, it shows up here.</p>'}</div>
    <p class="note">The platform fee is shown at an example rate of ${FEE*100}% of labour and parts, before VAT. The real rate is set before launch.</p></div>`;
}
async function profileView(){
  await loadMe();
  const u = S.me, pp = S.pp, hrs = Array.from({length:18},(_,i)=>String(6+i).padStart(2,'0')+':00'), wf = String(pp.work_from).slice(0,5), wt = String(pp.work_to).slice(0,5);
  return `<div class="wrap page"><div class="narrow stack">${back('account','Account')}
    <div class="sec-h" style="margin:0"><div><h2>My services and hours</h2><p>This is what customers see on your profile</p></div><button class="btn line sm" data-go="pro" data-id="${uid()}" data-cat="${pp.services[0]}">${ic('eye')}Preview profile</button></div>
    <form class="form" data-form="profile" novalidate>
      <div class="card"><label class="switch"><span><strong>Available for new jobs</strong><br><span class="muted sm-txt">Turn off when you're busy or on leave</span></span><input type="checkbox" name="available" ${pp.available?'checked':''} aria-label="Available for new jobs"></label></div>
      <div class="card form">
        <label class="f">About you<textarea name="about" rows="3" maxlength="600" placeholder="e.g. Carrier and LG split AC specialist. Own tools and gas cylinder.">${esc(pp.about||'')}</textarea></label>
        <fieldset id="f-pcats"><legend>Services you offer</legend><div class="opts">${CATS.map(c=>`<label class="opt"><input type="checkbox" name="svc" value="${c.id}" ${pp.services.includes(c.id)?'checked':''}><span>${esc(c.name)}</span></label>`).join('')}</div><span class="err" hidden>Pick at least one service.</span></fieldset>
        <div class="row2"><label class="f" id="f-pprice">${pp.provider_type.startsWith('Landlord')?'Monthly rent from (SAR)':'Starting price for labour (SAR)'}<input name="price" type="number" min="10" value="${+pp.price_from}"><span class="err" hidden>Enter a price of at least SAR 10.</span></label>
          <label class="f">City<select name="city">${CITIES.map(c=>`<option ${u.city===c?'selected':''}>${c}</option>`).join('')}</select></label></div>
        <label class="check"><input type="checkbox" name="vat" ${pp.vat_registered?'checked':''}><span>I'm registered for VAT, so add 15% VAT to my bills</span></label>
      </div>
      <div class="card form">
        <fieldset><legend>Districts you cover in ${esc(u.city)}</legend><div class="opts">${DISTRICTS[u.city].map(d=>`<label class="opt"><input type="checkbox" name="dist" value="${d}" ${(pp.districts||[]).includes(d)?'checked':''}><span>${d}</span></label>`).join('')}</div></fieldset>
        <fieldset><legend>Working days</legend><div class="opts">${[6,0,1,2,3,4,5].map(d=>`<label class="opt"><input type="checkbox" name="day" value="${d}" ${(pp.work_days||[]).includes(d)?'checked':''}><span>${DAYN[d]}</span></label>`).join('')}</div></fieldset>
        <div class="row2"><label class="f">From<select name="from">${hrs.map(h=>`<option value="${h}" ${wf===h?'selected':''}>${fmt12(h)}</option>`).join('')}</select></label>
          <label class="f">To<select name="to">${hrs.map(h=>`<option value="${h}" ${wt===h?'selected':''}>${fmt12(h)}</option>`).join('')}</select></label></div>
        <fieldset><legend>Languages you speak</legend><div class="opts">${ALL_LANGS.map(l=>`<label class="opt"><input type="checkbox" name="lang" value="${l}" ${(pp.languages||[]).includes(l)?'checked':''}><span>${l}</span></label>`).join('')}</div></fieldset>
      </div>
      <div><button class="btn" type="submit">Save changes</button></div>
    </form></div></div>`;
}
async function docsView(){
  await loadMe();
  const pp = S.pp, req = DOCS[pp.provider_type] || DOCS['Individual technician'];
  const docs = await q(sb.from('documents').select('*').eq('provider_id',uid()).order('uploaded_at',{ascending:false}));
  const have = t => docs.find(d=>d.doc_type===t), missing = req.filter(([t,r])=>r&&!have(t)).length, locked = ['Under review','Verified'].includes(pp.status);
  return `<div class="wrap page"><div class="narrow stack">${back('account','Account')}
    <div class="sec-h" style="margin:0"><div><h2>Verification documents</h2><p>Status: <span class="pill ${pp.status==='Verified'?'ok':pp.status==='Rejected'?'can':'req'}">${esc(pp.status)}</span></p></div></div>
    ${pp.status==='Rejected'?`<div class="banner bad">${ic('shield-x')}<div><strong>Not approved</strong><p>${esc(pp.reject_reason||'')}</p></div></div>`:''}
    <div class="card">${req.map(([t,r])=>{const d=have(t);return `<div class="row"><div><strong>${esc(t)}</strong> ${r?'':'<span class="muted sm-txt">(optional)</span>'}<div class="muted sm-txt">${d?`${ic('file-check','width:14px;height:14px;vertical-align:-2px;color:var(--accent)')} ${esc(d.file_name)} · uploaded ${timeAgo(d.uploaded_at)}`:'Not uploaded yet · PDF, JPG or PNG, up to 10 MB'}</div></div>
      ${locked?'':`<label class="btn ${d?'ghost':'line'} sm filebtn">${ic('upload')}${d?'Replace':'Upload'}<input type="file" accept=".pdf,image/*" data-doc="${esc(t)}" aria-label="Upload ${esc(t)}"></label>`}</div>`}).join('')}</div>
    ${locked?`<p class="muted" style="margin:0">${pp.status==='Verified'?'You are verified. Contact support if your documents change.':'Your documents are being reviewed.'}</p>`
      :`<div class="actions"><button class="btn" data-a="submitdocs" ${missing?'disabled':''}>Submit for review</button>${missing?`<span class="muted sm-txt">Upload ${missing} more required document${missing>1?'s':''} first</span>`:''}</div>
      <p class="muted sm-txt" style="margin:0">Files are stored privately. Only you and the Khidmah review team can open them.</p>`}
  </div></div>`;
}
async function reviewsView(){
  const list = await q(sb.from('reviews').select('*, booking:bookings(id, ref, service)').eq('provider_id',uid()).order('created_at',{ascending:false}));
  const avg = list.length ? list.reduce((a,r)=>a+r.stars,0)/list.length : 0;
  return `<div class="wrap page"><div class="narrow stack">${back('account','Account')}
    <div class="sec-h" style="margin:0"><div><h2>Reviews</h2><p>${list.length?`★ ${avg.toFixed(1)} average from ${list.length} review${list.length>1?'s':''}`:'No reviews yet'}</p></div></div>
    ${list.length?list.map(rv=>`<div class="card"><div class="meta"><strong style="color:var(--ink)">${esc(rv.customer_name)}</strong>${stars(rv.stars)}<span>${timeAgo(rv.created_at)}</span></div><p style="margin:6px 0 0">${esc(rv.body||'No comment')}</p>
      ${rv.reply?`<div class="reply"><strong>Your reply:</strong> ${esc(rv.reply)}</div>`:`<form class="form" data-form="reply" data-id="${rv.booking_id}" style="margin-top:12px"><label class="f">Reply publicly<textarea name="reply" rows="2"></textarea></label><div><button class="btn sm" type="submit">Post reply</button></div></form>`}
      <div class="ref" style="margin-top:8px"><button class="linkbtn sm-txt" data-go="booking" data-id="${rv.booking_id}">${esc(rv.booking&&rv.booking.ref)} · ${esc(rv.booking&&rv.booking.service)}</button></div></div>`).join('')
      : emptyBox('star','No reviews yet','Customers can rate you after you finish a job.')}
  </div></div>`;
}

/* ================= 8. Admin screens ================= */
async function aOverview(){
  const c = (t, f) => cnt(f(sb.from(t).select('*',{count:'exact',head:true})));
  const [cust, prov, ver, bks, rev, tick, req] = await Promise.all([
    c('profiles', x=>x.eq('role','customer')), c('profiles', x=>x.eq('role','provider')), c('provider_profiles', x=>x.eq('status','Verified')),
    c('bookings', x=>x), c('provider_profiles', x=>x.eq('status','Under review')), c('tickets', x=>x.eq('status','Open')), c('bookings', x=>x.eq('status','Requested'))]);
  const latest = await q(sb.from('bookings').select(BK_SELECT).order('created_at',{ascending:false}).limit(6));
  const people = await q(sb.from('profiles').select('*').neq('role','admin').order('created_at',{ascending:false}).limit(6));
  return `<div class="wrap page"><div class="sec-h"><div><h2>Overview</h2><p>Khidmah across Riyadh and Dammam</p></div></div>
    <div class="stats four"><div class="stat"><b>${cust}</b><span>Customers</span></div><div class="stat"><b>${ver} / ${prov}</b><span>Verified providers</span></div><div class="stat"><b>${bks}</b><span>Bookings</span></div><div class="stat"><b>${req}</b><span>Waiting for a provider</span></div></div>
    <div class="bgrid"><div class="stack"><div class="card"><h3>Needs attention</h3>
      <div class="row"><div><strong>Providers waiting for verification</strong><div class="muted sm-txt">Check documents and approve or reject</div></div><button class="btn sm" data-go="aproviders">${rev} to review</button></div>
      <div class="row"><div><strong>Open support tickets</strong><div class="muted sm-txt">Customers and providers waiting for a reply</div></div><button class="btn sm" data-go="atickets">${tick} open</button></div></div></div>
    <div class="stack"><div class="card"><h3>Latest bookings</h3>${latest.length?latest.map(b=>`<button class="notif" style="padding:10px 0" data-go="booking" data-id="${b.id}"><span style="flex:1;min-width:0"><strong>${esc(b.service)}</strong><small>${esc(b.customer&&b.customer.name)} → ${esc(b.provider&&b.provider.name)} · ${timeAgo(b.created_at)}</small></span>${pillFor(b.status,'admin')}</button>`).join(''):'<p class="muted" style="margin:0">No bookings yet.</p>'}</div>
      <div class="card"><h3>New sign-ups</h3>${people.length?people.map(u=>`<div class="row"><div><strong>${esc(u.name)}</strong><div class="muted sm-txt">${u.role==='provider'?'Provider':'Customer'} · ${esc(u.city)} · ${timeAgo(u.created_at)}</div></div></div>`).join(''):'<p class="muted" style="margin:0">No sign-ups yet.</p>'}</div></div></div></div>`;
}
async function aProviders(){
  const all = await q(sb.from('provider_profiles').select('*, profile:profiles!provider_profiles_user_id_fkey(name, city, created_at)').order('updated_at',{ascending:false}));
  const docs = await q(sb.from('documents').select('*').order('uploaded_at',{ascending:false}));
  const g = {review:all.filter(u=>u.status==='Under review'),pending:all.filter(u=>u.status==='Pending verification'),verified:all.filter(u=>u.status==='Verified'),rejected:all.filter(u=>u.status==='Rejected')};
  const list = g[S.aseg] || [];
  return `<div class="wrap page"><div class="sec-h"><div><h2>Providers</h2><p>Verify documents and manage provider accounts</p></div></div>
    <div class="segs">${[['review','Under review'],['pending','No documents yet'],['verified','Verified'],['rejected','Rejected']].map(([k,l])=>`<button data-a="seg" data-k="aseg" data-v="${k}" aria-pressed="${S.aseg===k}">${l} (${g[k].length})</button>`).join('')}</div>
    ${list.length?`<div class="list two">${list.map(pp=>{const d=docs.filter(x=>x.provider_id===pp.user_id);return `<article class="bk">
      <div class="bk-top"><div><strong>${esc(pp.profile&&pp.profile.name)}</strong><div class="muted sm-txt">${esc(pp.provider_type)} · ${esc(pp.profile&&pp.profile.city)} · joined ${timeAgo(pp.profile&&pp.profile.created_at)}</div></div><span class="pill ${pp.status==='Verified'?'ok':pp.status==='Rejected'?'can':'req'}">${esc(pp.status)}</span></div>
      <dl class="kv"><dt>Services</dt><dd>${pp.services.map(s=>esc(catById(s).name)).join(', ')}</dd><dt>From</dt><dd>${money(pp.price_from)}</dd>
        <dt>Documents</dt><dd>${d.length?d.map(x=>`<button class="linkbtn sm-txt" data-a="opendoc" data-path="${esc(x.file_path)}">${ic('file-text','width:14px;height:14px;vertical-align:-2px')} ${esc(x.doc_type)}</button>`).join('<br>'):'<span class="muted">None uploaded</span>'}</dd>
        ${pp.status==='Rejected'&&pp.reject_reason?`<dt>Reason</dt><dd>${esc(pp.reject_reason)}</dd>`:''}</dl>
      <div class="actions">
        ${pp.status==='Under review'?`<button class="btn sm" data-a="approve" data-id="${pp.user_id}">${ic('check')}Approve</button><button class="btn line sm" data-a="reject" data-id="${pp.user_id}">Reject</button>`:''}
        ${pp.status==='Verified'?`<button class="btn line sm" data-a="revoke" data-id="${pp.user_id}">Remove Verified badge</button>`:''}
        <button class="btn ghost sm" data-go="pro" data-id="${pp.user_id}" data-cat="${pp.services[0]}">View profile</button></div></article>`}).join('')}</div>`
      : emptyBox('users','No providers here','Providers move between these tabs as they upload documents and get reviewed.')}</div>`;
}
async function aBookings(){
  const all = await q(sb.from('bookings').select(BK_SELECT+', bills(total)').order('created_at',{ascending:false}).limit(300));
  const g = {active:all.filter(b=>ACTIVE.includes(b.status)),completed:all.filter(b=>b.status==='Completed'),cancelled:all.filter(b=>['Cancelled','Declined'].includes(b.status)),all};
  const list = g[S.bseg] || all;
  return `<div class="wrap page"><div class="sec-h"><div><h2>All bookings</h2><p>Every booking on the platform</p></div></div>
    <div class="segs">${[['active','Active'],['completed','Completed'],['cancelled','Cancelled or declined'],['all','All']].map(([k,l])=>`<button data-a="seg" data-k="bseg" data-v="${k}" aria-pressed="${S.bseg===k}">${l} (${g[k].length})</button>`).join('')}</div>
    <div class="card">${list.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Booking</th><th>Customer</th><th>Provider</th><th>When</th><th>Status</th><th class="n">Total</th></tr></thead><tbody>
      ${list.map(b=>{const bill=one(b.bills);return `<tr class="click" data-go="booking" data-id="${b.id}"><td><span class="ref">${esc(b.ref)}</span><br>${esc(b.service)}</td><td>${esc(b.customer&&b.customer.name)}</td><td>${esc(b.provider&&b.provider.name)}</td><td>${dayLabel(b.visit_date)}<br><span class="muted sm-txt">${esc(b.district)}, ${esc(b.city)}</span></td><td>${pillFor(b.status,'admin')}</td><td class="n">${bill?money2(bill.total):'–'}</td></tr>`}).join('')}
      </tbody></table></div>`:'<p class="muted" style="margin:0">No bookings in this group.</p>'}</div></div>`;
}
async function aTickets(){
  const all = await q(sb.from('tickets').select('*, user:profiles!tickets_user_id_fkey(name, role), booking:bookings(id, ref), ticket_replies(body, created_at)').order('created_at',{ascending:false}));
  const g = {Open:all.filter(t=>t.status==='Open'),Resolved:all.filter(t=>t.status==='Resolved')}, list = g[S.tseg] || [];
  return `<div class="wrap page"><div class="narrow" style="max-width:820px"><div class="sec-h"><div><h2>Support tickets</h2><p>Questions and problems reported by customers and providers</p></div></div>
    <div class="segs">${['Open','Resolved'].map(k=>`<button data-a="seg" data-k="tseg" data-v="${k}" aria-pressed="${S.tseg===k}">${k} (${g[k].length})</button>`).join('')}</div>
    ${list.length?`<div class="stack">${list.map(t=>`<article class="card">
      <div class="bk-top"><div><span class="ref">${esc(t.ref)} · ${timeAgo(t.created_at)}</span><br><strong>${esc(t.subject)}</strong><div class="muted sm-txt">${esc(t.user&&t.user.name)} · ${esc(t.user&&t.user.role)}${t.booking?` · <button class="linkbtn" data-go="booking" data-id="${t.booking.id}">${esc(t.booking.ref)}</button>`:''}</div></div><span class="pill ${t.status==='Open'?'req':'done'}">${t.status}</span></div>
      <p style="margin:10px 0 0">${esc(t.body)}</p>${(t.ticket_replies||[]).map(r=>`<div class="reply"><strong>Support (${timeAgo(r.created_at)}):</strong> ${esc(r.body)}</div>`).join('')}
      ${t.status==='Open'?`<form class="form" data-form="treply" data-id="${t.id}" style="margin-top:12px"><label class="f">Reply to ${esc(first(t.user&&t.user.name))}<textarea name="text" rows="2" placeholder="Your reply appears in their notifications"></textarea></label>
        <div class="actions"><button class="btn sm" type="submit" value="1">Reply and resolve</button><button class="btn line sm" type="submit" value="0">Reply only</button></div></form>`:''}
    </article>`).join('')}</div>`:emptyBox('life-buoy',`No ${S.tseg.toLowerCase()} tickets`,'Tickets come from the Help page and from “Report a problem” on bookings.')}</div></div>`;
}

/* ================= 9. Sheets (forms that slide up) ================= */
function sheet(title, sub, body){
  layer.innerHTML = `<div class="scrim" id="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-h"><div><h2>${esc(title)}</h2>${sub?`<p>${sub}</p>`:''}</div><button class="x" data-a="close" aria-label="Close">${ic('x')}</button></div>${body}</div></div>`;
  icons(); const f = layer.querySelector('textarea,input:not([type=radio]):not([type=checkbox]),select'); if (f) f.focus();
}
const closeSheet = () => { layer.innerHTML = ''; };
function dayFields(prefix){
  const D = dayList();
  return `<fieldset data-when><legend>Day</legend><div class="opts">${D.map((d,i)=>`<label class="opt"><input type="radio" name="${prefix}day" value="${d.iso}" ${i===1?'checked':''}><span>${d.label}<small>${d.sub}</small></span></label>`).join('')}</div></fieldset>
  <fieldset data-when><legend>Time</legend><div class="opts">${SLOTS.map((t,i)=>`<label class="opt"><input type="radio" name="${prefix}slot" value="${t[0]} (${t[1]})" ${i===2?'checked':''}><span>${t[0]}<small>${t[1]}</small></span></label>`).join('')}</div></fieldset>`;
}
async function openBook(pid, catId){
  const p = await q(sb.from('provider_cards').select('*').eq('id',pid).maybeSingle());
  if (!p || !p.available) return toast('This provider is not taking new jobs right now', true);
  const c = catById(catId || p.services[0]), addrs = await q(sb.from('addresses').select('*').eq('user_id',uid()).order('created_at'));
  const room = !!c.rooms;
  sheet(room?'Request a viewing':'Book '+p.name, `${esc(room?p.name:c.name)} · ${+p.review_count?'★ '+(+p.rating).toFixed(1):'New on Khidmah'} · ${esc(S.city)}`,
  `<form class="form" data-form="book" data-id="${p.id}" data-cat="${c.id}" novalidate>
    ${room?'':`<label class="f">What do you need?<select name="svc">${c.subs.map(s=>`<option>${esc(s)}</option>`).join('')}</select></label>
    <fieldset><legend>When</legend><div class="rolepick">
      <label class="opt wide"><input type="radio" name="when" value="later" checked><span><strong>${ic('calendar','width:16px;height:16px')}Schedule</strong><small>Pick a day and time</small></span></label>
      <label class="opt wide"><input type="radio" name="when" value="asap"><span><strong>${ic('zap','width:16px;height:16px')}As soon as possible</strong><small>Urgent, today</small></span></label></div></fieldset>`}
    ${dayFields('b')}
    ${room?'':`<fieldset><legend>Address</legend><div class="opts">
      ${addrs.map((a,i)=>`<label class="opt wide"><input type="radio" name="addr" value="${a.id}" ${i===0?'checked':''}><span>${esc(a.label)}<small>${esc(a.district)} · ${esc(a.detail)}</small></span></label>`).join('')}
      <label class="opt wide"><input type="radio" name="addr" value="new" ${addrs.length?'':'checked'}><span>${addrs.length?'Another address':'New address'}<small>Enter it below</small></span></label></div></fieldset>
    <div id="newaddr" class="form" ${addrs.length?'hidden':''}>
      <div class="row2"><label class="f">District<select name="district">${DISTRICTS[S.city].map(d=>`<option>${d}</option>`).join('')}</select></label>
      <label class="f" id="f-bdetail">Building, street, landmark<input name="detail" placeholder="e.g. Villa 12, near Panda"><span class="err" hidden>Add the building and street.</span></label></div>
      <label class="check"><input type="checkbox" name="saveaddr" checked><span>Save this address for next time</span></label></div>`}
    <label class="f">${room?'Message to the owner':'Describe the problem'} (optional)<textarea name="note" rows="2" maxlength="1000" placeholder="${room?'e.g. Working in Olaya, looking to move in next month':'e.g. Split AC in the bedroom is not cooling and water is dripping'}"></textarea></label>
    ${room?'':`<fieldset><legend>Pay after the job with</legend><div class="opts">${PAY.map((t,i)=>`<label class="opt"><input type="radio" name="pay" value="${t}" ${i===0?'checked':''}><span>${t}</span></label>`).join('')}</div></fieldset>`}
    <div class="sum"><div class="price"><small>${room?'Rent from':'Labour from'}</small><b>SAR ${+p.price_from}</b>${room?' <span class="muted">/ month</span>':''}</div><button class="btn" type="submit">${ic('check')}Send request</button></div>
  </form>`);
  const f = layer.querySelector('form');
  f.querySelectorAll('input[name=when]').forEach(r=>r.onchange=()=>f.querySelectorAll('[data-when]').forEach(x=>x.hidden=radio('when')==='asap'));
  f.querySelectorAll('input[name=addr]').forEach(r=>r.onchange=()=>$('#newaddr').hidden=radio('addr')!=='new');
  f._p = p;
}
function reasonSheet(title, sub, form, id, reasons){
  sheet(title, sub, `<form class="form" data-form="${form}" data-id="${id}" novalidate>
    <fieldset><legend>Reason</legend><div class="opts">${reasons.map((x,i)=>`<label class="opt wide"><input type="radio" name="reason" value="${esc(x)}" ${i===0?'checked':''}><span>${esc(x)}</span></label>`).join('')}</div></fieldset>
    <label class="f">Anything to add? (optional)<textarea name="more" rows="2"></textarea></label>
    <div class="actions"><button class="btn danger" type="submit">Confirm</button><button class="btn ghost" type="button" data-a="close">Go back</button></div></form>`);
}
async function billSheet(id){
  const b = await q(sb.from('bookings').select(BK_SELECT).eq('id',id).single());
  sheet('Finish job and send bill', `${esc(b.ref)} · ${esc(b.service)} · ${esc(b.customer&&b.customer.name)}`,
  `<form class="form" data-form="bill" data-id="${b.id}" novalidate>
    <div class="row2"><label class="f" id="f-blab">Labour (SAR)<input name="labour" type="number" min="0" step="0.01" value="${+b.price_from}"><span class="err" hidden>Enter the labour amount.</span></label>
      <label class="f">Parts (SAR)<input name="parts" type="number" min="0" step="0.01" value="0"></label></div>
    <label class="f">Parts used (optional)<input name="partsNote" placeholder="e.g. 1 kg R410A gas, new capacitor"></label>
    <label class="check"><input type="checkbox" name="vat" ${S.pp&&S.pp.vat_registered?'checked':''}><span>Add 15% VAT (I'm VAT registered)</span></label>
    <fieldset><legend>Customer paid with</legend><div class="opts">${PAY.map(t=>`<label class="opt"><input type="radio" name="paid" value="${t}" ${t===b.pay_method?'checked':''}><span>${t}</span></label>`).join('')}</div></fieldset>
    <div class="bill card" style="padding:14px" id="billprev"></div>
    <button class="btn full" type="submit">${ic('check')}Complete job and send receipt</button></form>`);
  const f = layer.querySelector('form'), upd = () => { const sub = (+f.elements.labour.value||0) + (+f.elements.parts.value||0), vat = f.elements.vat.checked ? Math.round(sub*15)/100 : 0;
    $('#billprev').innerHTML = `<div><span>Subtotal</span><span>${money2(sub)}</span></div><div><span>VAT 15%</span><span>${money2(vat)}</span></div><div class="tot"><span>Customer pays</span><span>${money2(sub+vat)}</span></div>`; };
  f.oninput = upd; upd();
}

/* ================= 10. Button actions ================= */
const busyRun = async (el, fn) => { if (el) el.disabled = true; try { await fn(); } catch(e) { fail(e); } finally { if (el && el.isConnected) el.disabled = false; } };
const setStatus = (id, s, reason) => q(sb.rpc('set_booking_status', { p_booking: id, p_status: s, p_reason: reason || null }));
const ACT = {
  close: closeSheet,
  retry: () => render(),
  logout: async () => { await sb.auth.signOut(); S.session = null; S.me = null; S.pp = null; stopRealtime(); go('auth'); toast('You are logged out'); },
  termsSheet: () => sheet('Terms and privacy','',termsBody()),
  filter: a => { S.filter = a.dataset.v; render(true); },
  seg: a => { S[a.dataset.k] = a.dataset.v; render(true); },
  fav: a => busyRun(a, async () => { const id = a.dataset.id, on = a.getAttribute('aria-pressed') === 'true';
    if (on) await q(sb.from('favorites').delete().eq('customer_id',uid()).eq('provider_id',id)); else await q(sb.from('favorites').insert({customer_id:uid(),provider_id:id}));
    toast(on ? 'Removed from favourites' : 'Saved to favourites'); render(true); }),
  book: a => openBook(a.dataset.id, a.dataset.cat).catch(fail),
  copy: a => { const t = a.dataset.text; try { navigator.clipboard.writeText(t).then(()=>{a.textContent='Copied';setTimeout(()=>a.textContent='Copy',1500)},()=>{a.textContent=t}) } catch(e){ a.textContent = t } },
  editme: () => sheet('Edit your details','',`<form class="form" data-form="editme" novalidate>
    <label class="f" id="f-ename">${role()==='provider'?'Name or company name':'Full name'}<input name="pname" value="${esc(S.me.name)}"><span class="err" hidden>Enter your name.</span></label>
    <label class="f">City<select name="city">${CITIES.map(c=>`<option ${S.me.city===c?'selected':''}>${c}</option>`).join('')}</select></label>
    <p class="muted sm-txt" style="margin:0">Your phone number is used to log in. Contact support to change it.</p><button class="btn full" type="submit">Save</button></form>`),
  deladdr: a => busyRun(a, async () => { await q(sb.from('addresses').delete().eq('id',a.dataset.id)); toast('Address removed'); render(true); }),
  cancel: a => reasonSheet('Cancel booking','The provider will be notified','cancel',a.dataset.id,['My plans changed','I found another provider','The provider asked me to cancel','I booked by mistake','Other reason']),
  pcancel: a => reasonSheet('Cancel job','The customer will be notified','pcancel',a.dataset.id,['Customer not reachable',"Emergency, I can't make it",'Job is bigger than described','Other reason']),
  acancel: a => reasonSheet('Cancel booking as admin','Both sides will be notified','acancel',a.dataset.id,['Reported by customer','Provider suspended','Duplicate booking','Other reason']),
  decline: a => reasonSheet('Decline request','The customer will be notified','decline',a.dataset.id,['Not available at that time','Outside my service area',"Not a service I offer",'Other reason']),
  reject: a => reasonSheet('Reject verification','The provider will see this reason','reject',a.dataset.id,['Document is unclear or cut off','Document has expired',"Name doesn't match the account","CR doesn't cover this service",'Other reason']),
  reschedule: a => sheet('Reschedule','The provider will be notified of the new time',`<form class="form" data-form="resched" data-id="${a.dataset.id}" novalidate>${dayFields('s')}<button class="btn full" type="submit">Save new time</button></form>`),
  report: a => sheet('Report a problem','Sent to Khidmah support',`<form class="form" data-form="report" data-id="${a.dataset.id}" novalidate>
    <fieldset><legend>What went wrong?</legend><div class="opts">${['The problem came back (30-day guarantee)','Work not done properly',"Provider didn't show up",'Charged more than agreed','Damage to my property','Something else'].map((x,i)=>`<label class="opt wide"><input type="radio" name="subject" value="${esc(x)}" ${i===0?'checked':''}><span>${esc(x)}</span></label>`).join('')}</div></fieldset>
    <label class="f" id="f-rtext">Details<textarea name="text" rows="3" placeholder="What happened, and what would you like us to do?"></textarea><span class="err" hidden>Add a few details so our team can help.</span></label>
    <button class="btn full" type="submit">Send to support</button></form>`),
  rate: a => sheet('Rate '+a.dataset.name,'',`<form class="form" data-form="rate" data-id="${a.dataset.id}" data-pid="${a.dataset.pid}" novalidate>
    <fieldset id="f-stars"><legend>Your rating</legend><div class="stars">${[5,4,3,2,1].map(n=>`<input type="radio" name="stars" id="st${n}" value="${n}"><label for="st${n}" aria-label="${n} star${n>1?'s':''}">★</label>`).join('')}</div><span class="err" hidden>Tap a star to rate.</span></fieldset>
    <label class="f">Tell others about the job (optional)<textarea name="text" rows="3" maxlength="1000" placeholder="Was the technician on time? Was the problem fixed?"></textarea></label>
    <button class="btn full" type="submit">Post review</button></form>`),
  status: a => busyRun(a, async () => { await setStatus(a.dataset.id, a.dataset.v);
    toast({Accepted:"Accepted. The customer's number is now visible",'On the way':'Customer told you are on the way','In progress':'Job started',Completed:'Viewing marked as done'}[a.dataset.v]||'Updated');
    if (a.dataset.v==='Accepted' && S.view==='jobs') S.seg='upcoming'; render(true); refreshCounts(); }),
  finish: a => billSheet(a.dataset.id).catch(fail),
  submitdocs: a => busyRun(a, async () => { await q(sb.from('provider_profiles').update({status:'Under review'}).eq('user_id',uid())); toast('Documents sent for review'); render(true); }),
  approve: a => busyRun(a, async () => { await q(sb.from('provider_profiles').update({status:'Verified',reject_reason:null}).eq('user_id',a.dataset.id)); toast('Provider verified'); render(true); refreshCounts(); }),
  revoke: a => busyRun(a, async () => { await q(sb.from('provider_profiles').update({status:'Pending verification'}).eq('user_id',a.dataset.id)); toast('Verified badge removed'); render(true); }),
  opendoc: a => busyRun(a, async () => { const { data, error } = await sb.storage.from('provider-docs').createSignedUrl(a.dataset.path, 120); if (error) throw error; window.open(data.signedUrl, '_blank', 'noopener'); })
};

/* ================= 11. Form submits ================= */
const val = (f, n) => (f.elements[n] ? String(f.elements[n].value).trim() : '');
const FORMS = {
  async book(f){
    const p = f._p, c = catById(f.dataset.cat), room = !!c.rooms, asap = !room && radio('when')==='asap';
    let district = DISTRICTS[S.city][0], address = '';
    if (!room) {
      if (radio('addr')==='new') { district = val(f,'district'); address = val(f,'detail'); if (!check('bdetail', address.length > 2)) return;
        if (f.elements.saveaddr.checked) await q(sb.from('addresses').insert({ user_id: uid(), label: 'Home', district, detail: address })); }
      else { const a = one(await q(sb.from('addresses').select('*').eq('id',radio('addr')))); district = a.district; address = a.detail; }
    } else { district = (p.districts||[])[0] || DISTRICTS[S.city][0]; }
    const b = await q(sb.from('bookings').insert({
      category: c.id, kind: room?'room':'service', service: room?'Room viewing':val(f,'svc'), customer_id: uid(), provider_id: p.id, city: S.city, district, address,
      note: val(f,'note') || null, visit_date: asap ? dayList()[0].iso : radio('bday'), visit_slot: asap ? 'As soon as possible' : radio('bslot'), urgent: asap,
      pay_method: room ? 'Monthly rent' : radio('pay') }).select('id, ref').single());
    closeSheet(); go('booking', { id: b.id }); toast(`Request ${b.ref} sent to ${p.name}`); refreshCounts();
  },
  async chat(f){ const inp = $('#chatin'), t = inp.value.trim(); if (!t) return; inp.value = '';
    await q(sb.from('messages').insert({ booking_id: f.dataset.id, sender_id: uid(), body: t })); render(true); },
  async cancel(f){ await setStatus(f.dataset.id,'Cancelled',val(f,'reason')+(val(f,'more')?' · '+val(f,'more'):'')); closeSheet(); render(true); refreshCounts(); toast('Booking cancelled'); },
  async pcancel(f){ await setStatus(f.dataset.id,'Cancelled','Provider: '+val(f,'reason')+(val(f,'more')?' · '+val(f,'more'):'')); closeSheet(); render(true); toast('Job cancelled'); },
  async acancel(f){ await setStatus(f.dataset.id,'Cancelled','Khidmah support: '+val(f,'reason')); closeSheet(); render(true); toast('Booking cancelled'); },
  async decline(f){ await setStatus(f.dataset.id,'Declined',val(f,'reason')+(val(f,'more')?' · '+val(f,'more'):'')); closeSheet(); render(true); refreshCounts(); toast('Request declined'); },
  async reject(f){ await q(sb.from('provider_profiles').update({status:'Rejected',reject_reason:val(f,'reason')+(val(f,'more')?'. '+val(f,'more'):'')}).eq('user_id',f.dataset.id)); closeSheet(); render(true); refreshCounts(); toast('Provider rejected'); },
  async resched(f){ await q(sb.from('bookings').update({ visit_date: radio('sday'), visit_slot: radio('sslot'), urgent: false }).eq('id',f.dataset.id)); closeSheet(); render(true); toast('New time saved'); },
  async bill(f){ if (!check('blab', f.elements.labour.value !== '' && +f.elements.labour.value >= 0)) return;
    await q(sb.rpc('complete_job', { p_booking: f.dataset.id, p_labour: +f.elements.labour.value, p_parts: +f.elements.parts.value || 0, p_parts_note: val(f,'partsNote') || null, p_vat: f.elements.vat.checked, p_paid: radio('paid') }));
    closeSheet(); render(true); toast('Job completed and receipt sent'); },
  async rate(f){ const s = radio('stars'); $('#f-stars .err').hidden = !!s; if (!s) return;
    await q(sb.from('reviews').insert({ booking_id: f.dataset.id, provider_id: f.dataset.pid, customer_name: '-', stars: +s, body: val(f,'text') || null })); closeSheet(); render(true); toast('Thanks for your review'); },
  async reply(f){ const t = val(f,'reply'); if (!t) return; await q(sb.from('reviews').update({ reply: t }).eq('booking_id', f.dataset.id)); render(true); toast('Reply posted'); },
  async report(f){ if (!check('rtext', val(f,'text').length > 4)) return;
    const t = await q(sb.from('tickets').insert({ user_id: uid(), booking_id: f.dataset.id, subject: radio('subject'), body: val(f,'text') }).select('ref').single()); closeSheet(); toast(`Ticket ${t.ref} sent. We reply within 24 hours`); },
  async ticket(f){ if (!check('tmsg', val(f,'text').length > 4)) return;
    const t = await q(sb.from('tickets').insert({ user_id: uid(), subject: val(f,'subject'), body: val(f,'text') }).select('ref').single()); render(true); toast(`Ticket ${t.ref} sent`); },
  async treply(f, e){ const t = val(f,'text'), resolve = e.submitter && e.submitter.value === '1';
    if (!t && !resolve) { f.elements.text.focus(); return; }
    if (t) await q(sb.from('ticket_replies').insert({ ticket_id: f.dataset.id, author_id: uid(), body: t }));
    if (resolve) await q(sb.from('tickets').update({ status: 'Resolved' }).eq('id', f.dataset.id));
    render(true); refreshCounts(); toast(resolve ? 'Reply sent and ticket resolved' : 'Reply sent'); },
  async addaddr(f){ const d = val(f,'detail'); if (!check('adetail', d.length > 2)) return;
    await q(sb.from('addresses').insert({ user_id: uid(), label: val(f,'label'), district: val(f,'district'), detail: d })); render(true); toast('Address saved'); },
  async profile(f){
    const g = n => [...f.querySelectorAll(`input[name=${n}]:checked`)].map(x=>x.value), svc = g('svc');
    $('#f-pcats .err').hidden = svc.length > 0; const okp = check('pprice', +f.elements.price.value >= 10); if (!svc.length || !okp) return;
    const city = val(f,'city'), cityChanged = city !== S.me.city;
    await q(sb.from('provider_profiles').update({ available: f.elements.available.checked, about: val(f,'about') || null, services: svc, price_from: +f.elements.price.value, vat_registered: f.elements.vat.checked,
      districts: cityChanged ? [...DISTRICTS[city]] : g('dist'), work_days: g('day').map(Number), work_from: val(f,'from'), work_to: val(f,'to'), languages: g('lang').length ? g('lang') : ['Arabic'] }).eq('user_id', uid()));
    if (cityChanged) await q(sb.from('profiles').update({ city }).eq('id', uid()));
    await loadMe(); render(true); toast('Changes saved');
  },
  async editme(f){ const nm = val(f,'pname'); if (!check('ename', nm.length > 1)) return;
    await q(sb.from('profiles').update({ name: nm, city: val(f,'city') }).eq('id', uid())); await loadMe(); if (role()==='customer') S.city = S.me.city; closeSheet(); render(true); toast('Details saved'); }
};

/* ================= 12. Events ================= */
document.addEventListener('click', e => {
  const a = e.target.closest('[data-a]');
  if (a && ACT[a.dataset.a]) { e.preventDefault(); ACT[a.dataset.a](a, e); return; }
  const g = e.target.closest('[data-go]');
  if (g) { e.preventDefault(); closeSheet(); const { go: v, ...p } = g.dataset; go(v, p); return; }
  if (e.target.id === 'scrim') closeSheet();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && layer.innerHTML) closeSheet();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role=link][data-go]')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('submit', async e => {
  const f = e.target;
  if (f.id === 'completeform') { e.preventDefault(); const d = readProfileForm(f, false); if (!d) return;
    const b = f.querySelector('button[type=submit]'); b.disabled = true;
    try { await createProfile(d); startRealtime(); refreshCounts(); go(homeFor()); toast(`Welcome, ${first(S.me.name)}`); } catch(ex) { fail(ex); b.disabled = false; } return; }
  if (f.dataset.form && FORMS[f.dataset.form]) { e.preventDefault();
    const b = e.submitter || f.querySelector('button[type=submit]'); if (b) b.disabled = true;
    try { await FORMS[f.dataset.form](f, e); } catch(ex) { fail(ex); } finally { if (b && b.isConnected) b.disabled = false; } }
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'city') { S.city = t.value; try { localStorage.setItem('kh_city', S.city); } catch(x){} render(); }
  if (t.id === 'sort') { S.sort = t.value; render(true); }
  if (t.dataset && t.dataset.doc && t.files && t.files[0]) {
    const file = t.files[0];
    if (file.size > 10 * 1024 * 1024) return toast('That file is over 10 MB. Upload a smaller photo or PDF.', true);
    try {
      const path = `${uid()}/${Date.now()}-${file.name.replace(/[^\w.-]+/g,'_')}`;
      const { error } = await sb.storage.from('provider-docs').upload(path, file, { upsert: false }); if (error) throw error;
      await q(sb.from('documents').insert({ provider_id: uid(), doc_type: t.dataset.doc, file_path: path, file_name: file.name }));
      if (S.pp.status === 'Rejected') await q(sb.from('provider_profiles').update({ status: 'Pending verification' }).eq('user_id', uid())).catch(()=>{});
      toast('Document uploaded'); render(true);
    } catch(ex) { fail(ex); }
  }
});

/* search */
function matches(term){
  term = term.trim().toLowerCase(); if (!term) return [];
  const out = [];
  CATS.forEach(c => {
    if (c.name.toLowerCase().includes(term)) out.push({cat:c.id,label:c.name,sub:'Category'});
    if (!c.rooms) c.subs.forEach(s => { if (s.toLowerCase().includes(term) || term.split(' ').every(w=>s.toLowerCase().includes(w))) out.push({cat:c.id,label:s,sub:c.name}); });
    if (c.rooms && /room|bed|studio|rent|accom/.test(term)) out.push({cat:c.id,label:'Rooms for rent',sub:'Room rental'});
  });
  const syn = {leak:'plumbing',tap:'plumbing',pipe:'plumbing',drain:'plumbing',toilet:'plumbing',heater:'plumbing',light:'electrical',power:'electrical',socket:'electrical',fan:'electrical',cooling:'ac',gas:'ac',split:'ac',cockroach:'pest',insect:'pest',clean:'cleaning',sofa:'cleaning',fridge:'appliance',washing:'appliance',paint:'painting',door:'carpentry',furniture:'carpentry',move:'moving',shift:'moving',camera:'cctv',dish:'cctv',wifi:'cctv',water:'tank',car:'carwash',garden:'garden'};
  Object.keys(syn).forEach(k => { if (term.includes(k) && !out.some(o=>o.cat===syn[k])) { const c = catById(syn[k]); out.push({cat:c.id,label:c.name,sub:'Category'}); } });
  return out.slice(0,6);
}
function bindSearch(){
  const qi = $('#q'), box = $('#sugg'); if (!qi) return; let idx = -1, cur = [];
  const draw = () => { cur = matches(qi.value); idx = -1; if (!qi.value.trim()) { box.hidden = true; return; }
    box.innerHTML = cur.length ? cur.map((m,i)=>`<button type="button" data-i="${i}">${ic(catById(m.cat).icon,'color:var(--accent)')}<span>${esc(m.label)}</span><small>${esc(m.sub)}</small></button>`).join('') : `<div style="padding:12px 14px" class="muted">No match yet. Try “AC”, “leak” or “room”.</div>`;
    box.hidden = false; icons(); box.querySelectorAll('[data-i]').forEach(b => b.onmousedown = e => { e.preventDefault(); go('cat', {cat:cur[b.dataset.i].cat}); }); };
  qi.oninput = draw; qi.onblur = () => setTimeout(() => box.hidden = true, 120);
  qi.onkeydown = e => { const items = box.querySelectorAll('[data-i]');
    if (e.key==='ArrowDown'||e.key==='ArrowUp') { e.preventDefault(); if (!items.length) return; idx = (idx + (e.key==='ArrowDown'?1:-1) + items.length) % items.length; items.forEach((b,i)=>b.classList.toggle('on',i===idx)); }
    if (e.key==='Enter') { e.preventDefault(); const m = cur[idx>=0?idx:0]; if (m) go('cat',{cat:m.cat}); } if (e.key==='Escape') box.hidden = true; };
  $('#qgo').onclick = () => { const m = matches(qi.value)[0]; if (m) go('cat',{cat:m.cat}); else { draw(); qi.focus(); } };
}

/* ================= 13. Live updates ================= */
let channel = null;
function stopRealtime(){ if (channel) { sb.removeChannel(channel); channel = null; } }
function startRealtime(){
  stopRealtime(); if (!uid()) return;
  channel = sb.channel('me-' + uid())
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid()}` }, payload => {
      refreshCounts();
      const n = payload.new;
      if (S.view === 'booking' && n.booking_id === S.p.id && !layer.innerHTML) render(true);
      else if (['jobs','bookings','home','notifs','aoverview','aproviders','atickets'].includes(S.view) && !layer.innerHTML) render(true);
      if (!(S.view === 'booking' && n.booking_id === S.p.id)) toast(n.body);
    })
    .subscribe();
}

/* ================= 14. Start ================= */
async function start(){
  try { const { data } = await sb.rpc('is_dev_mode'); S.devMode = data !== false; } catch(e) {}
  const { data: { session } } = await sb.auth.getSession();
  S.session = session;
  if (session) { try { await loadMe(); } catch(e) { console.error(e); } startRealtime(); refreshCounts(); S.view = homeFor(); }
  render();
  sb.auth.onAuthStateChange((evt, sess) => { S.session = sess; if (evt === 'SIGNED_OUT') { S.me = null; S.pp = null; stopRealtime(); if (S.view !== 'auth') go('auth'); } });
}
start();
})();
