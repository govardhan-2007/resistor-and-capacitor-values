const colours={
 black:{digit:0,multiplier:1,hex:"#171717"},
 brown:{digit:1,multiplier:10,tolerance:"±1%",tcr:100,hex:"#7b3f00"},
 red:{digit:2,multiplier:100,tolerance:"±2%",tcr:50,hex:"#d92323"},
 orange:{digit:3,multiplier:1000,tcr:15,hex:"#f57c00"},
 yellow:{digit:4,multiplier:10000,tcr:25,hex:"#f2c300"},
 green:{digit:5,multiplier:100000,tolerance:"±0.5%",tcr:20,hex:"#16823b"},
 blue:{digit:6,multiplier:1000000,tolerance:"±0.25%",tcr:10,hex:"#1769aa"},
 violet:{digit:7,multiplier:10000000,tolerance:"±0.1%",tcr:5,hex:"#7e3f98"},
 grey:{digit:8,multiplier:100000000,tolerance:"±0.05%",tcr:1,hex:"#777"},
 white:{digit:9,multiplier:1000000000,hex:"#eee"},
 gold:{multiplier:.1,tolerance:"±5%",hex:"#d4af37"},
 silver:{multiplier:.01,tolerance:"±10%",hex:"#c0c0c0"}
};
const digits=Object.keys(colours).filter(c=>colours[c].digit!==undefined);
const multipliers=Object.keys(colours);
const tolerances=["brown","red","green","blue","violet","grey","gold","silver"];
const $=id=>document.getElementById(id);
let bands=4;

function optionList(items){return items.map(c=>`<option value="${c}">${c[0].toUpperCase()+c.slice(1)}</option>`).join("")}
function buildSelectors(){
 let html=`<label>Band 1<select id="r1">${optionList(digits)}</select></label>
 <label>Band 2<select id="r2">${optionList(digits)}</select></label>`;
 if(bands>=5)html+=`<label>Band 3<select id="r3">${optionList(digits)}</select></label>`;
 html+=`<label>Multiplier<select id="rm">${optionList(multipliers)}</select></label>
 <label>Tolerance<select id="rt">${optionList(tolerances)}</select></label>`;
 if(bands===6)html+=`<label>TCR<select id="r6">${optionList(digits.filter(c=>colours[c].tcr))}</select></label>`;
 $("resistorSelectors").innerHTML=html;
 $("r1").value="brown";$("r2").value="black";
 if($("r3"))$("r3").value="black";
 $("rm").value="red";$("rt").value="gold";
 if($("r6"))$("r6").value="brown";
 document.querySelectorAll("#resistorSelectors select").forEach(e=>e.addEventListener("change",calculateResistor));
 drawBands();calculateResistor();
}
function formatOhms(v){
 if(v>=1e9)return Number((v/1e9).toPrecision(4))+" GΩ";
 if(v>=1e6)return Number((v/1e6).toPrecision(4))+" MΩ";
 if(v>=1e3)return Number((v/1e3).toPrecision(4))+" kΩ";
 return Number(v.toFixed(6)).toLocaleString()+" Ω";
}
function drawBands(){
 const body=$("resistorBody");
 body.innerHTML="";
 for(let i=1;i<=bands;i++){
  const d=document.createElement("div");
  d.className="band "+(i===bands?"tol":i===bands-1?"mult":"digit");
  d.id="visual"+i;body.appendChild(d);
 }
}
function calculateResistor(){
 const vals=[];
 for(let i=1;i<=(bands===4?2:3);i++)vals.push($(("r"+i)).value);
 const mult=$("rm").value,tol=$("rt").value;
 let significant=0;
 vals.forEach(c=>significant=significant*10+colours[c].digit);
 const value=significant*colours[mult].multiplier;
 const tolerance=parseFloat(colours[tol].tolerance);
 $("resistorResult").textContent=`${formatOhms(value)} ${colours[tol].tolerance}`;
 $("resistorRange").textContent=`Range: ${formatOhms(value*(1-tolerance/100))} – ${formatOhms(value*(1+tolerance/100))}`;
 $("resistorDetail").textContent=bands===6?`TCR: ${colours[$("r6").value].tcr} ppm/°C`:`${bands}-band resistor • ${vals.map(x=>x[0].toUpperCase()+x.slice(1)).join(" – ")}`;
 for(let i=1;i<=bands;i++){
  let c=i===bands?tol:i===bands-1?mult:vals[i-1];
  if(i===6)c=$("r6").value;
  $("visual"+i).style.background=colours[c].hex;
 }
}
document.querySelectorAll(".type-btn").forEach(btn=>btn.addEventListener("click",()=>{
 document.querySelectorAll(".type-btn").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 bands=Number(btn.dataset.bands);$("bandBadge").textContent=bands+" BAND";buildSelectors();
}));

function reverseBands(value){
 if(value<=0)return null;
 const sigCount=bands===4?2:3;
 let exp=Math.floor(Math.log10(value))-(sigCount-1);
 let sig=Math.round(value/10**exp);
 if(sig>=10**sigCount){sig=Math.round(sig/10);exp++}
 if(sig<10**(sigCount-1)||sig>=10**sigCount)return null;
 const s=String(sig).padStart(sigCount,"0");
 const multiplier=multipliers.find(c=>Math.abs(colours[c].multiplier-10**exp)<Math.max(1,10**exp)*1e-10);
 if(!multiplier)return null;
 return {digits:[...s].map(Number).map(n=>digits[n]),multiplier};
}
function chip(c,label){
 const light=["yellow","white","gold","silver"].includes(c);
 return `<span class="colour-chip" style="background:${colours[c].hex};color:${light?"#111":"#fff"}">${label}: ${c}</span>`;
}
$("convertBtn").addEventListener("click",()=>{
 const value=Number($("resistanceInput").value),tol=$("reverseTolerance").value;
 const r=reverseBands(value);
 if(!r){$("reverseResult").textContent="This value is outside the representable range for the selected resistor type.";return}
 r.digits.forEach((c,i)=>{if($("r"+(i+1)))$("r"+(i+1)).value=c});
 $("rm").value=r.multiplier;$("rt").value=tol;calculateResistor();
 let out=r.digits.map((c,i)=>chip(c,`Band ${i+1}`)).join("")+chip(r.multiplier,"Multiplier")+chip(tol,"Tolerance");
 if(bands===6)out+=chip($("r6").value,"TCR");
 $("reverseResult").innerHTML=`<strong>${formatOhms(value)}</strong><br>${out}`;
});

$("referenceTable").innerHTML=Object.entries(colours).map(([c,x])=>{
 const light=["yellow","white","gold","silver"].includes(c);
 return `<tr><td><span class="colour-chip" style="background:${x.hex};color:${light?"#111":"#fff"}">${c}</span></td><td>${x.digit??"—"}</td><td>×${x.multiplier}</td><td>${x.tolerance||"—"}</td><td>${x.tcr?x.tcr+" ppm/°C":"—"}</td></tr>`;
}).join("");

/* Sidebar navigation */
const pageData={
 resistor:["Resistor Colour Code Calculator","Decode resistor bands, calculate resistance, and learn the colour code."],
 capacitor:["Capacitor Calculator","Decode capacitor markings and convert capacitance values."]
};
document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>{
 document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 const page=btn.dataset.page;
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active-page"));
 $(page+"Page").classList.add("active-page");
 $("pageTitle").textContent=pageData[page][0];$("pageSubtitle").textContent=pageData[page][1];
 $("sidebar").classList.remove("open");$("overlay").classList.remove("show");
}));
$("mobileMenu").addEventListener("click",()=>{$("sidebar").classList.toggle("open");$("overlay").classList.toggle("show")});
$("overlay").addEventListener("click",()=>{$("sidebar").classList.remove("open");$("overlay").classList.remove("show")});

/* Capacitor calculator */
function capFormat(pf){
 if(pf>=1e6)return `${Number((pf/1e6).toPrecision(5))} µF`;
 if(pf>=1e3)return `${Number((pf/1e3).toPrecision(5))} nF`;
 return `${Number(pf.toPrecision(5))} pF`;
}
document.querySelectorAll(".cap-tab").forEach(btn=>btn.addEventListener("click",()=>{
 document.querySelectorAll(".cap-tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 $("capCodeMode").classList.toggle("hidden",btn.dataset.capmode!=="code");
 $("capValueMode").classList.toggle("hidden",btn.dataset.capmode!=="value");
}));
$("decodeCapBtn").addEventListener("click",()=>{
 const code=$("capCode").value.trim();
 if(!/^\d{3}$/.test(code)){$("capCodeResult").textContent="Enter a valid 3-digit code, for example 104.";return}
 const base=Number(code.slice(0,2)),exp=Number(code[2]);
 const pf=base*10**exp;
 const voltage=$("capVoltage").value;
 $("capCodeResult").innerHTML=`<strong>${code}</strong> = ${capFormat(pf)}${voltage?` • ${voltage} V`:""}`;
});
$("encodeCapBtn").addEventListener("click",()=>{
 const value=Number($("capValue").value),unit=$("capUnit").value;
 const factors={"pF":1,"nF":1e3,"µF":1e6,"mF":1e9};
 const pf=value*factors[unit];
 if(!Number.isFinite(pf)||pf<=0){$("capValueResult").textContent="Enter a valid capacitance.";return}
 const exponent=Math.floor(Math.log10(pf))-1;
 const base=Math.round(pf/10**exponent);
 if(exponent<0||exponent>9||base<10||base>99){$("capValueResult").textContent="This value cannot be represented accurately with a simple 3-digit code.";return}
 $("capValueResult").innerHTML=`Common 3-digit code: <strong>${base}${exponent}</strong> • ${capFormat(pf)}`;
});

buildSelectors();
