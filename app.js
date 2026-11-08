const KEY="bodyEvolutionDataV1";
const today=()=>new Date().toISOString().slice(0,10);
const seed={
  weights:[
    {date:"2025-09-01",weight:66,note:"Историческая точка · сентябрь 2025"},
    {date:"2026-02-01",weight:77,note:"Историческая точка · февраль 2026"},
    {date:"2026-08-01",weight:74,note:"Историческая точка · август 2026"},
    {date:today(),weight:69.8,note:"Текущий вес, сообщён пользователем"}
  ],
  workouts:[
    {date:"2026-04-01",exercise:"Жим штанги лёжа",load:70,reps:5,sets:1,note:"Уточнено пользователем: 70 кг × 5"},
    {date:"2026-06-01",exercise:"Жим гантелей на наклонной скамье",load:22.5,reps:9,sets:3,note:"На каждую руку; диапазон 8–10 повторений"}
  ],
  photos:[]
};
let data;
try{data=JSON.parse(localStorage.getItem(KEY))||seed}catch{data=seed}
function persist(){localStorage.setItem(KEY,JSON.stringify(data))}
function fmt(n){return Number(n).toLocaleString("ru-RU",{maximumFractionDigits:1})}
function dateFmt(d){return new Date(d+"T12:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"short",year:"numeric"})}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2100)}
function sortedWeights(){return [...data.weights].sort((a,b)=>a.date.localeCompare(b.date))}
function renderChart(target){
 const el=document.getElementById(target);if(!el)return;
 const arr=sortedWeights();if(!arr.length){el.innerHTML='<p class="muted">Пока нет измерений.</p>';return}
 const vals=arr.map(x=>x.weight),min=Math.min(...vals)-1,max=Math.max(...vals)+1,range=max-min||1;
 const W=330,H=150,L=28,R=10,T=12,B=28;
 const pts=arr.map((x,i)=>({x: L+(arr.length===1?(W-L-R)/2:i*(W-L-R)/(arr.length-1)),y:T+(max-x.weight)/range*(H-T-B),v:x.weight}));
 const poly=pts.map(p=>`${p.x},${p.y}`).join(" ");
 const labels=arr.map((x,i)=>`<text x="${pts[i].x}" y="${H-7}" fill="#9299a4" font-size="8" text-anchor="middle">${new Date(x.date+"T12:00:00").toLocaleDateString("ru-RU",{month:"short",year:"2-digit"})}</text>`).join("");
 const dots=pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#b8f36b" stroke="#111" stroke-width="2"/><text x="${p.x}" y="${p.y-10}" fill="#f4f5f6" font-size="9" text-anchor="middle">${fmt(p.v)}</text>`).join("");
 el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="График веса"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#b8f36b" stop-opacity=".22"/><stop offset="1" stop-color="#b8f36b" stop-opacity="0"/></linearGradient></defs><line x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}" stroke="#30353d"/><polyline points="${poly}" fill="none" stroke="#b8f36b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}</svg>`;
}
function renderWeights(){
 const arr=sortedWeights().reverse();
 const html=arr.map((x,i)=>`<div class="history-item"><span>${dateFmt(x.date)}${x.note?` · ${x.note}`:""}</span><b>${fmt(x.weight)} кг</b></div>`).join("")||'<p class="muted">Записей пока нет.</p>';
 ["weightHistory","weightList"].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html});
 const latest=arr[0];if(latest)document.getElementById("currentWeight").innerHTML=`${fmt(latest.weight)} <small>кг</small>`;
 const delta=arr.length>1?latest.weight-arr[1].weight:null;
 document.getElementById("weightDelta").textContent=delta===null?"Последняя запись":`${delta>0?"+":""}${fmt(delta)} кг к предыдущей записи`;
 renderChart("weightChart");renderChart("weightChartFull");
}
function renderWorkouts(){
 const el=document.getElementById("workoutList");
 const arr=[...data.workouts].sort((a,b)=>b.date.localeCompare(a.date));
 el.innerHTML=arr.map((x,i)=>`<div class="history-item"><span>${dateFmt(x.date)}<br>${escapeHtml(x.exercise)} · ${x.sets}×${x.reps}</span><b>${fmt(x.load)} кг</b></div>`).join("")||'<p class="muted">Пока нет тренировок.</p>';
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderPhotos(){
 const el=document.getElementById("photoGrid");
 el.innerHTML=data.photos.map((p,i)=>`<div class="photo-card"><img src="${p.data}" alt="Фото прогресса"><div><span>${dateFmt(p.date)}</span><button data-photo="${i}" aria-label="Удалить фото">Удалить</button></div></div>`).join("");
 el.querySelectorAll("[data-photo]").forEach(b=>b.addEventListener("click",()=>{data.photos.splice(Number(b.dataset.photo),1);persist();renderPhotos();toast("Фото удалено")}));
}
function render(){renderWeights();renderWorkouts();renderPhotos()}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
function showTab(id){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.goto)));
document.getElementById("weightDate").value=today();document.getElementById("workoutDate").value=today();document.getElementById("photoDate").value=today();
document.getElementById("weightForm").addEventListener("submit",e=>{e.preventDefault();const w=Number(document.getElementById("weightInput").value);if(!Number.isFinite(w)||w<20||w>300)return toast("Проверь вес");data.weights.push({date:document.getElementById("weightDate").value,weight:w,note:document.getElementById("weightNote").value.trim()});persist();render();e.target.reset();document.getElementById("weightDate").value=today();toast("Вес сохранён")});
document.getElementById("workoutForm").addEventListener("submit",e=>{e.preventDefault();data.workouts.push({date:document.getElementById("workoutDate").value,exercise:document.getElementById("exerciseInput").value.trim(),load:Number(document.getElementById("loadInput").value),reps:Number(document.getElementById("repsInput").value),sets:Number(document.getElementById("setsInput").value)});persist();renderWorkouts();e.target.reset();document.getElementById("workoutDate").value=today();document.getElementById("setsInput").value=3;toast("Упражнение сохранено")});
document.getElementById("savePhoto").addEventListener("click",()=>{const f=document.getElementById("photoFile").files[0];if(!f)return toast("Сначала выбери фото");if(f.size>8*1024*1024)return toast("Фото должно быть меньше 8 МБ");const reader=new FileReader();reader.onload=()=>{data.photos.push({date:document.getElementById("photoDate").value||today(),data:reader.result});persist();renderPhotos();document.getElementById("photoFile").value="";toast("Фото сохранено на устройстве")};reader.readAsDataURL(f)});
document.getElementById("exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`body-evolution-${today()}.json`;a.click();URL.revokeObjectURL(a.href);toast("Резервная копия скачана")});
document.getElementById("importFile").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{const obj=JSON.parse(await f.text());if(!Array.isArray(obj.weights)||!Array.isArray(obj.workouts)||!Array.isArray(obj.photos))throw Error();data=obj;persist();render();toast("Данные импортированы")}catch{toast("Не удалось прочитать JSON")}e.target.value=""});
document.getElementById("resetBtn").addEventListener("click",()=>{if(confirm("Удалить все записи приложения и восстановить исходную базу?")){data=JSON.parse(JSON.stringify(seed));persist();render();toast("Исходные данные восстановлены")}});
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;document.getElementById("installBtn").classList.remove("hidden")});
document.getElementById("installBtn").addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;document.getElementById("installBtn").classList.add("hidden")});
if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
persist();render();
