// --- Usuarios ---
function getUsers(){ return JSON.parse(localStorage.getItem('users')||'[]'); }
function saveUsers(users){ localStorage.setItem('users',JSON.stringify(users)); }
function getCurrentUser(){ return JSON.parse(localStorage.getItem('currentUser')); }
function saveCurrentUser(user){ localStorage.setItem('currentUser',JSON.stringify(user)); }

// --- Login / Registro ---
function showRegister(){ document.getElementById('login-form').classList.add('hidden'); document.getElementById('register-form').classList.remove('hidden'); }
function showLogin(){ document.getElementById('register-form').classList.add('hidden'); document.getElementById('login-form').classList.remove('hidden'); }

function register(){
  let name=document.getElementById('reg-name').value;
  let email=document.getElementById('reg-email').value;
  let pass=document.getElementById('reg-password').value;
  if(!name||!email||!pass){ alert("Completa todos los campos"); return; }
  let users=getUsers();
  if(users.find(u=>u.email===email)){ alert("Usuario ya existe"); return; }
  let user={name,email,password:pass,medicamentos:[],bonos:0,foto:""};
  users.push(user); saveUsers(users); alert("Usuario registrado"); showLogin();
}

function login(){
  let email=document.getElementById('login-email').value;
  let pass=document.getElementById('login-password').value;
  let user=getUsers().find(u=>u.email===email && u.password===pass);
  if(!user){ alert("Usuario o contraseña incorrectos"); return; }
  saveCurrentUser(user);
  document.getElementById('auth').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  renderMeds(); renderRanking(); initAlarmas();
}

// --- Logout ---
function logout(){ localStorage.removeItem('currentUser'); document.getElementById('dashboard').classList.add('hidden'); document.getElementById('auth').classList.remove('hidden'); }

// --- Medicamentos ---
function addMed(){
  let name=document.getElementById('med-name').value;
  let dosis=document.getElementById('med-dosis').value;
  let hora=document.getElementById('med-hora').value;
  if(!name||!hora){ alert("Nombre y hora obligatorios"); return; }
  let user=getCurrentUser();
  user.medicamentos.push({name,dosis,hora,tomado:false});
  saveCurrentUser(user); renderMeds(); scheduleNotification({name,dosis,hora});
}

function renderMeds(){
  let medList=document.getElementById('med-list');
  let user=getCurrentUser();
  medList.innerHTML="";
  user.medicamentos.forEach((med,i)=>{
    let card=document.createElement('div');
    card.className="card"+(med.tomado?" taken":"");
    card.innerHTML=`<div>
      <p class="font-semibold text-lg">${med.name}</p>
      <p>${med.dosis} - ${med.hora}</p>
      <p>Tomado: <span class="font-semibold">${med.tomado?"Sí":"No"}</span></p>
    </div>
    <button onclick="marcar(${i})">${med.tomado?"Desmarcar":"Marcar"}</button>`;
    medList.appendChild(card);
  });
}

function marcar(i){
  let user=getCurrentUser();
  user.medicamentos[i].tomado=!user.medicamentos[i].tomado;
  if(user.medicamentos[i].tomado) user.bonos=(user.bonos||0)+1;
  saveCurrentUser(user); renderMeds(); renderRanking();
}

// --- Ranking ---
function renderRanking(){
  let ranking=document.getElementById('ranking');
  let users=getUsers().sort((a,b)=>b.bonos-(a.bonos||0)).slice(0,10);
  ranking.innerHTML="<ol>";
  users.forEach(u=>{ ranking.innerHTML+=`<li>${u.name} - ${u.bonos||0} pts</li>`; });
  ranking.innerHTML+="</ol>";
}

// --- Perfil usuario ---
function openUserMenu(){
  let user=getCurrentUser();
  document.getElementById('profile-name').value=user.name;
  document.getElementById('profile-email').value=user.email;
  document.getElementById('profile-pic').src=user.foto||"";
  document.getElementById('user-menu').classList.remove('hidden');
}
function closeUserMenu(){ document.getElementById('user-menu').classList.add('hidden'); }
document.getElementById('profile-input').addEventListener('change',e=>{
  const reader=new FileReader();
  reader.onload=function(){ document.getElementById('profile-pic').src=reader.result; }
  reader.readAsDataURL(e.target.files[0]);
});
function saveProfile(){
  let user=getCurrentUser();
  user.name=document.getElementById('profile-name').value;
  let pass=document.getElementById('profile-password').value;
  if(pass) user.password=pass;
  user.foto=document.getElementById('profile-pic').src;
  saveCurrentUser(user);
  closeUserMenu();
}

// --- Escaneo recetas ---
function scanReceta(){document.getElementById('file-input').click();}
document.getElementById('file-input').addEventListener('change',async(e)=>{
  const file=e.target.files[0]; if(!file) return;
  const worker=Tesseract.createWorker({logger:m=>console.log(m)});
  await worker.load(); await worker.loadLanguage('spa'); await worker.initialize('spa');
  const {data:{text}}=await worker.recognize(file);
  await worker.terminate();
  let user=getCurrentUser();
  user.medicamentos.push({name:text.split('\n')[0]||"Receta escaneada",dosis:"",hora:"08:00",tomado:false});
  saveCurrentUser(user); renderMeds(); alert("Receta añadida");
});

// --- Notificaciones ---
if('Notification' in window) Notification.requestPermission();
function scheduleNotification(med){
  if(!("Notification" in window)) return;
  let now=new Date(); let [h,min]=med.hora.split(":").map(Number);
  let notifTime=new Date(); notifTime.setHours(h,min,0,0);
  if(notifTime<now) notifTime.setDate(notifTime.getDate()+1);
  let timeout=notifTime-now;
  setTimeout(()=>{
    new Notification("Hora de tu medicamento",{body:`Toma ${med.name} - ${med.dosis}`,icon:"icon-192.png"});
    let audio=new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'); audio.play().catch(()=>{});
    scheduleNotification(med);
  },timeout);
}
function initAlarmas(){
  let user=getCurrentUser(); if(!user) return;
  user.medicamentos.forEach(m=>{ if(!m.tomado) scheduleNotification(m); });
}

// --- Service worker ---
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/service-worker.js').then(()=>console.log("SW registrado")).catch(console.log);
}
