import { useState, useEffect, useRef } from "react";

const C = {
  rausch: "#FF385C",
  babu:   "#00A699",
  arches: "#FC642D",
  hof:    "#222222",
  foggy:  "#717171",
  sand:   "#F7F7F7",
  white:  "#FFFFFF",
  border: "#DDDDDD",
};

const CATEGORIES = [
  { id:"all",   label:"All",       emoji:"✦" },
  { id:"food",  label:"Food",      emoji:"🍽️" },
  { id:"move",  label:"Transport", emoji:"🚌" },
  { id:"shop",  label:"Shopping",  emoji:"🛍️" },
  { id:"bills", label:"Bills",     emoji:"📋" },
  { id:"fun",   label:"Fun",       emoji:"🎉" },
  { id:"hlth",  label:"Health",    emoji:"💊" },
  { id:"other", label:"Other",     emoji:"📦" },
];

const CAT_COLOR = {
  food:"#FF385C", move:"#00A699", shop:"#FC642D",
  bills:"#8B5CF6", fun:"#F59E0B", hlth:"#10B981", other:"#6B7280",
};

const CAT_BG = {
  food:  "linear-gradient(135deg,#FF385C,#FF8FA3)",
  move:  "linear-gradient(135deg,#00A699,#4DD0C4)",
  shop:  "linear-gradient(135deg,#FC642D,#FFB36B)",
  bills: "linear-gradient(135deg,#8B5CF6,#C4B5FD)",
  fun:   "linear-gradient(135deg,#F59E0B,#FCD34D)",
  hlth:  "linear-gradient(135deg,#10B981,#6EE7B7)",
  other: "linear-gradient(135deg,#6B7280,#9CA3AF)",
};

const TIPS = [
  "Track every spend. Awareness is the first step to freedom.",
  "50/30/20 rule: 50% needs, 30% wants, 20% savings.",
  "Wait 48 hrs before any impulse buy over ₹1,000.",
  "Automate savings on payday — skip the willpower battle.",
  "Cancel subscriptions you forgot you had.",
  "Cook at home 5 days a week. Watch savings compound.",
  "A 3-month emergency fund changes everything.",
];

const fmt  = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n);
const fmtK = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(Math.round(n));

const DAYS  = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function groupByPeriod(exps, period) {
  const g = {};
  exps.forEach(e => {
    const d   = new Date(e.date);
    const key = period==="week"
      ? `W${Math.ceil(d.getDate()/7)} ${d.toLocaleString("en-IN",{month:"short"})}`
      : period==="month"
      ? d.toLocaleString("en-IN",{month:"short",year:"numeric"})
      : d.getFullYear().toString();
    g[key] = (g[key]||0) + e.amount;
  });
  return g;
}

const Icon = ({ name, size=22, stroke="currentColor" }) => {
  const paths = {
    home:     <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    stats:    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    trash:    <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></>,
    chevronL: <polyline points="15 18 9 12 15 6"/>,
    chevronR: <polyline points="9 18 15 12 9 6"/>,
    spark:    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
    trending: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    calc:     <><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/><line x1="16" y1="18" x2="16" y2="18"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

/* ── Calculator component ── */
function Calculator({ onClose }) {
  const [display, setDisplay]   = useState("0");
  const [expr, setExpr]         = useState("");
  const [justEvaled, setJustEvaled] = useState(false);
  const [flash, setFlash]       = useState(false);

  const triggerFlash = () => { setFlash(true); setTimeout(()=>setFlash(false), 120); };

  const safeEval = (str) => {
    try {
      // Replace × ÷ for eval, guard against dangerous input
      const clean = str.replace(/×/g,"*").replace(/÷/g,"/").replace(/[^0-9+\-*/.()%\s]/g,"");
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + clean + ')')();
      if (!isFinite(result)) return "Error";
      // Round to avoid floating point noise
      return parseFloat(result.toPrecision(12)).toString();
    } catch { return "Error"; }
  };

  const handleBtn = (val) => {
    triggerFlash();
    if (val === "AC") { setDisplay("0"); setExpr(""); setJustEvaled(false); return; }
    if (val === "⌫") {
      if (justEvaled) { setDisplay("0"); setExpr(""); setJustEvaled(false); return; }
      const next = expr.length <= 1 ? "" : expr.slice(0,-1);
      setExpr(next);
      setDisplay(next || "0");
      return;
    }
    if (val === "=") {
      if (!expr) return;
      const res = safeEval(expr);
      setDisplay(res);
      setExpr(res === "Error" ? "" : res);
      setJustEvaled(true);
      return;
    }
    const isOp = ["+","-","×","÷","%","(",")","."].includes(val);
    let newExpr = expr;
    if (justEvaled && !isOp) { newExpr = ""; }
    if (justEvaled && isOp)  { /* chain from result */ }
    setJustEvaled(false);
    newExpr += val;
    setExpr(newExpr);
    // live eval for display
    const live = safeEval(newExpr);
    setDisplay(live !== "Error" ? live : display);
  };

  // show the expression if typing, result on =
  const displayVal = justEvaled ? display : (expr || "0");

  // Format display nicely
  const formatDisplay = (s) => {
    if (s === "Error") return s;
    // If it's a pure number, format with commas
    const n = parseFloat(s);
    if (!isNaN(n) && !s.includes("+") && !s.includes("-") && !s.includes("×") && !s.includes("÷") && !s.includes("(") && !s.includes("%")) {
      if (justEvaled) return new Intl.NumberFormat("en-IN",{maximumFractionDigits:8}).format(n);
    }
    return s;
  };

  const rows = [
    ["AC","(  )","%","÷"],
    ["7","8","9","×"],
    ["4","5","6","-"],
    ["1","2","3","+"],
    ["0",".","⌫","="],
  ];

  const btnStyle = (v) => {
    const isOp    = ["÷","×","-","+","="].includes(v);
    const isEq    = v === "=";
    const isClear = v === "AC";
    const isDark  = ["(  )","⌫","%"].includes(v);
    return {
      flex: v==="0" ? "2 0 0" : "1 0 0",
      padding: "0",
      height: 58,
      borderRadius: 18,
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: v==="AC"||v==="⌫"||v==="(  )"||v==="%"||v==="." ? 16 : 22,
      fontWeight: isOp ? 700 : 600,
      background: isEq ? C.rausch
        : isOp ? C.hof
        : isClear ? "#FF6B6B"
        : isDark ? "#E8E8E8"
        : C.white,
      color: isOp||isClear ? C.white : C.hof,
      boxShadow: isEq ? "0 4px 14px rgba(255,56,92,0.35)" : isOp ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
      transition: "transform .08s, opacity .08s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };
  };

  // Handle () smartly
  const handleParens = () => {
    const open  = (expr.match(/\(/g)||[]).length;
    const close = (expr.match(/\)/g)||[]).length;
    handleBtn(open > close ? ")" : "(");
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s ease"}}
         onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:430,background:C.sand,borderRadius:"28px 28px 0 0",padding:"12px 16px 36px",animation:"sheetUp .35s cubic-bezier(.32,1.28,.64,1)"}}>
        {/* drag handle */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>
          <div style={{width:40,height:4,borderRadius:4,background:C.border}}/>
        </div>

        {/* header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 4px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>🧮</span>
            <span style={{fontSize:17,fontWeight:800,color:C.hof}}>Calculator</span>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:"50%",background:C.border,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:C.hof}}>✕</button>
        </div>

        {/* Display */}
        <div style={{margin:"14px 0 12px",background:C.white,borderRadius:20,padding:"16px 20px",minHeight:96,display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"flex-end",boxShadow:"inset 0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
          {/* expression */}
          <div style={{fontSize:13,color:C.foggy,fontWeight:500,marginBottom:6,height:18,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%",textAlign:"right"}}>
            {justEvaled ? expr : ""}
          </div>
          {/* main number */}
          <div style={{
            fontSize: displayVal.length > 12 ? 22 : displayVal.length > 8 ? 28 : 40,
            fontWeight:800, color: flash ? C.rausch : C.hof,
            letterSpacing:-1, lineHeight:1.1, transition:"color .12s",
            maxWidth:"100%", overflowX:"auto", whiteSpace:"nowrap", textAlign:"right",
          }}>
            {formatDisplay(displayVal)}
          </div>
        </div>

        {/* Buttons */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {rows.map((row,ri)=>(
            <div key={ri} style={{display:"flex",gap:10}}>
              {row.map(v=>{
                if (v==="(  )") return (
                  <button key={v} style={btnStyle(v)} onClick={handleParens}
                    onMouseDown={e=>e.currentTarget.style.transform="scale(.93)"}
                    onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
                    ( )
                  </button>
                );
                return (
                  <button key={v} style={btnStyle(v)} onClick={()=>handleBtn(v)}
                    onMouseDown={e=>e.currentTarget.style.transform="scale(.93)"}
                    onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
                    {v}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ */
export default function PaisaApp() {
  const [tab,      setTab]      = useState("home");
  const [expenses, setExpenses] = useState([]);
  const [selCat,   setSelCat]   = useState("all");
  const [period,   setPeriod]   = useState("month");
  const [tipIdx,   setTipIdx]   = useState(0);
  const [form,     setForm]     = useState({name:"",amount:"",category:"food",notes:""});
  const [toast,    setToast]    = useState("");
  const [delId,    setDelId]    = useState(null);
  const [showCalc,   setShowCalc]   = useState(false);
  const [totalView,  setTotalView]  = useState("day"); // "day" | "week" | "month"

  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selDay,   setSelDay]   = useState(null);

  useEffect(() => {
    try { const s=localStorage.getItem("paisa_v5"); if(s) setExpenses(JSON.parse(s)); } catch{}
    const t = setInterval(()=>setTipIdx(i=>(i+1)%TIPS.length), 5000);
    return ()=>clearInterval(t);
  },[]);

  const save = list => { setExpenses(list); localStorage.setItem("paisa_v5",JSON.stringify(list)); };

  const total    = expenses.reduce((s,e)=>s+e.amount,0);
  const todayStr = now.toISOString().slice(0,10);

  // ── Period total logic ──────────────────────────────────
  // Day: all expenses whose date string matches today
  const dayTotal = expenses
    .filter(e => e.date.slice(0,10) === todayStr)
    .reduce((s,e) => s+e.amount, 0);

  // Week: Mon–Sun of the current ISO week
  const startOfWeek = (() => {
    const d = new Date(now);
    const day = d.getDay(); // 0=Sun
    const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0,0,0,0);
    return d;
  })();
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23,59,59,999);

  const weekTotal = expenses
    .filter(e => { const d = new Date(e.date); return d >= startOfWeek && d <= endOfWeek; })
    .reduce((s,e) => s+e.amount, 0);

  // Month: current calendar month
  const monthTotalHome = expenses
    .filter(e => { const d = new Date(e.date); return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth(); })
    .reduce((s,e) => s+e.amount, 0);

  const PERIOD_DATA = {
    day:   { label:"Today",       sub: now.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"}), value: dayTotal },
    week:  { label:"This Week",   sub: `${startOfWeek.toLocaleDateString("en-IN",{day:"numeric",month:"short"})} – ${endOfWeek.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}`, value: weekTotal },
    month: { label:"This Month",  sub: now.toLocaleDateString("en-IN",{month:"long",year:"numeric"}), value: monthTotalHome },
  };

  const filtered = selCat==="all" ? expenses : expenses.filter(e=>e.category===selCat);

  const monthTotal = expenses
    .filter(e=>{ const d=new Date(e.date); return d.getFullYear()===calYear && d.getMonth()===calMonth; })
    .reduce((s,e)=>s+e.amount,0);

  const handleAdd = () => {
    if (!form.name.trim()||!form.amount) { showToastMsg("Fill in name & amount"); return; }
    const e = {id:Date.now(),...form,amount:parseFloat(form.amount),date:new Date().toISOString()};
    save([e,...expenses]);
    setForm({name:"",amount:"",category:"food",notes:""});
    setTab("home");
    showToastMsg("✓ Expense logged!");
  };

  const showToastMsg = msg => { setToast(msg); setTimeout(()=>setToast(""),2400); };

  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const firstDay    = new Date(calYear, calMonth, 1).getDay();

  const dayExpenses = day => {
    const ds = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return expenses.filter(e=>e.date.slice(0,10)===ds);
  };

  const selDayExps  = selDay ? expenses.filter(e=>e.date.slice(0,10)===selDay) : [];
  const selDayTotal = selDayExps.reduce((s,e)=>s+e.amount,0);

  const grouped  = groupByPeriod(expenses, period);
  const gKeys    = Object.keys(grouped).slice(-7);
  const maxG     = Math.max(...gKeys.map(k=>grouped[k]),1);

  const catTotals = CATEGORIES.filter(c=>c.id!=="all").map(c=>({
    ...c, total: expenses.filter(e=>e.category===c.id).reduce((s,e)=>s+e.amount,0)
  })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  const css = `
    @keyframes sheetUp  {from{transform:translateY(100%)}to{transform:translateY(0)}}
    @keyframes fadeIn   {from{opacity:0}to{opacity:1}}
    @keyframes slideUp  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes bounce2  {0%,100%{transform:translateY(0)}45%{transform:translateY(-10px)}70%{transform:translateY(-4px)}}
    @keyframes tipFade  {0%{opacity:0;transform:translateX(6px)}15%{opacity:1;transform:translateX(0)}85%{opacity:1}100%{opacity:0}}
    @keyframes toastPop {0%{transform:translateX(-50%) translateY(8px);opacity:0}12%{opacity:1;transform:translateX(-50%) translateY(0)}88%{opacity:1}100%{opacity:0}}
    @keyframes calcPop  {0%{transform:scale(0.7) rotate(-8deg);opacity:0}60%{transform:scale(1.08) rotate(2deg)}100%{transform:scale(1) rotate(0);opacity:1}}
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    ::-webkit-scrollbar{display:none}
    body{margin:0}
    .pill{display:inline-flex;align-items:center;gap:5px;padding:8px 15px;border-radius:30px;white-space:nowrap;font-size:13px;font-weight:600;cursor:pointer;border:1px solid #DDDDDD;background:#fff;color:#222;transition:all .18s;user-select:none;font-family:inherit}
    .pill.active{background:#222;color:#fff;border-color:#222}
    .lcard{background:#fff;border-radius:16px;border:1px solid #DDDDDD;overflow:hidden;cursor:pointer;transition:transform .15s;margin-bottom:18px}
    .lcard:active{transform:scale(0.985)}
    .nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 2px 4px;background:none;border:none;cursor:pointer;font-family:inherit;transition:color .15s}
    .nav-btn .lbl{font-size:10px;font-weight:700;letter-spacing:.3px;text-transform:uppercase}
    .inp{width:100%;padding:13px 16px;border-radius:12px;border:1.5px solid #DDDDDD;font-size:15px;font-family:inherit;outline:none;background:#fff;color:#222;transition:border-color .15s}
    .inp:focus{border-color:#222}
    .inp::placeholder{color:#BBBBBB}
    .submit{width:100%;padding:16px;border-radius:14px;border:none;background:#FF385C;color:#fff;font-size:16px;font-weight:800;font-family:inherit;cursor:pointer;letter-spacing:.2px;transition:opacity .15s}
    .submit:active{opacity:.88}
    .period-btn{flex:1;padding:9px;border-radius:10px;border:none;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer;transition:all .2s}
    .cal-day{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;border-radius:10px;padding:4px 2px;cursor:pointer;transition:all .15s;min-height:48px;position:relative}
    .cal-day:active{transform:scale(.93)}
    .calc-btn-wrap{animation:calcPop .35s cubic-bezier(.34,1.56,.64,1)}
  `;

  return (
    <div style={{fontFamily:"'Circular Std','Helvetica Neue',Helvetica,Arial,sans-serif",background:C.white,minHeight:"100vh",maxWidth:430,margin:"0 auto",display:"flex",flexDirection:"column",position:"relative",overflowX:"hidden"}}>
      <style>{css}</style>

      {toast && (
        <div style={{position:"fixed",bottom:96,left:"50%",background:C.hof,color:"#fff",padding:"12px 22px",borderRadius:30,fontSize:14,fontWeight:600,zIndex:300,whiteSpace:"nowrap",animation:"toastPop 2.4s ease forwards",pointerEvents:"none"}}>
          {toast}
        </div>
      )}

      {showCalc && <Calculator onClose={()=>setShowCalc(false)}/>}

      {/* ════ HOME ════ */}
      {tab==="home" && (
        <div style={{flex:1,overflowY:"auto",paddingBottom:110}}>
          <div style={{padding:"52px 24px 10px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:28,fontWeight:800,color:C.hof,letterSpacing:-.6}}>Paisa 💸</div>
                <div style={{fontSize:13,color:C.foggy,marginTop:1}}>{now.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div>
              </div>
              <div style={{width:46,height:46,borderRadius:14,background:C.sand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💸</div>
            </div>
          </div>

          {/* Total card — switchable period */}
          <div style={{padding:"6px 24px 20px"}}>
            <div style={{background:C.white,borderRadius:28,boxShadow:"0 2px 20px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.06)",padding:"18px 18px 14px",overflow:"hidden"}}>
              {/* Period toggle pills */}
              <div style={{display:"flex",gap:6,marginBottom:16}}>
                {["day","week","month"].map(p=>(
                  <button key={p} onClick={()=>setTotalView(p)} style={{flex:1,padding:"7px 0",borderRadius:20,border:"none",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .2s",
                    background: totalView===p ? C.rausch : C.sand,
                    color: totalView===p ? C.white : C.foggy,
                    boxShadow: totalView===p ? "0 3px 10px rgba(255,56,92,0.3)" : "none",
                  }}>
                    {p==="day"?"Today":p==="week"?"Week":"Month"}
                  </button>
                ))}
              </div>
              {/* Amount + meta */}
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:46,lineHeight:1,animation:"bounce2 3.5s ease infinite",flexShrink:0}}>💰</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.foggy,textTransform:"uppercase",letterSpacing:.8}}>{PERIOD_DATA[totalView].label}</div>
                  <div key={totalView} style={{fontSize:28,fontWeight:800,color:C.hof,letterSpacing:-1,lineHeight:1.2,marginTop:2,animation:"slideUp .25s ease"}}>{fmt(PERIOD_DATA[totalView].value)}</div>
                  <div style={{fontSize:11,fontWeight:500,color:C.foggy,marginTop:3}}>{PERIOD_DATA[totalView].sub}</div>
                </div>
                <div style={{background:C.sand,borderRadius:14,padding:"8px 10px",textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:18,fontWeight:800,color:C.hof}}>{expenses.length}</div>
                  <div style={{fontSize:9,fontWeight:600,color:C.foggy,textTransform:"uppercase",letterSpacing:.3}}>entries</div>
                </div>
              </div>
              {/* Subtle comparison line */}
              {totalView!=="month" && monthTotalHome>0 && (
                <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`,fontSize:12,color:C.foggy,fontWeight:500}}>
                  Month so far: <span style={{fontWeight:800,color:C.hof}}>{fmt(monthTotalHome)}</span>
                  {totalView==="week" && weekTotal>0 && monthTotalHome>0 &&
                    <span style={{marginLeft:8,color:weekTotal/monthTotalHome>0.5?C.rausch:C.babu,fontWeight:700}}>
                      ({Math.round(weekTotal/monthTotalHome*100)}% of month)
                    </span>
                  }
                </div>
              )}
            </div>
          </div>

          {/* Category filter pills */}
          <div style={{overflowX:"auto",display:"flex",gap:8,padding:"0 24px 16px"}}>
            {CATEGORIES.map(c=>(
              <button key={c.id} className={`pill${selCat===c.id?" active":""}`} onClick={()=>setSelCat(c.id)}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {/* Section header */}
          <div style={{padding:"0 24px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:18,fontWeight:800,color:C.hof}}>{selCat==="all"?`${expenses.length} expenses`:`${filtered.length} · ${CATEGORIES.find(c=>c.id===selCat)?.label}`}</div>
            {filtered.length>0&&<div style={{fontSize:14,fontWeight:700,color:C.foggy}}>{fmt(filtered.reduce((s,e)=>s+e.amount,0))}</div>}
          </div>

          {/* Expense cards */}
          <div style={{padding:"0 24px"}}>
            {filtered.length===0 ? (
              <div style={{textAlign:"center",padding:"40px 0",color:C.foggy}}>
                <div style={{fontSize:58,marginBottom:12}}>🏕️</div>
                <div style={{fontSize:17,fontWeight:700,color:C.hof}}>No expenses yet</div>
                <div style={{fontSize:14,marginTop:4}}>Tap + to log your first spend</div>
              </div>
            ) : filtered.map((e,i)=>(
              <div key={e.id} className="lcard" style={{animation:`slideUp .28s ease ${i*.03}s both`}} onClick={()=>setDelId(delId===e.id?null:e.id)}>
                <div style={{height:130,background:CAT_BG[e.category]||CAT_BG.other,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:52,filter:"drop-shadow(0 4px 14px rgba(0,0,0,0.18))"}}>{CATEGORIES.find(c=>c.id===e.category)?.emoji||"📦"}</div>
                  <div style={{position:"absolute",bottom:10,left:12,background:"rgba(255,255,255,.88)",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,color:C.hof}}>{CATEGORIES.find(c=>c.id===e.category)?.label}</div>
                  {delId===e.id&&(
                    <button onClick={ev=>{ev.stopPropagation();save(expenses.filter(x=>x.id!==e.id));setDelId(null);showToastMsg("Removed");}}
                      style={{position:"absolute",top:10,right:10,width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.95)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>
                      <Icon name="trash" size={16} stroke={C.rausch}/>
                    </button>
                  )}
                </div>
                <div style={{padding:"12px 14px 14px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:C.hof,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name}</div>
                    <div style={{fontSize:12,color:C.foggy,marginTop:2}}>{new Date(e.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>
                    {e.notes&&<div style={{fontSize:12,color:C.foggy,marginTop:3,fontStyle:"italic"}}>{e.notes}</div>}
                  </div>
                  <div style={{fontWeight:800,fontSize:15,color:C.hof,flexShrink:0}}>₹{e.amount.toLocaleString("en-IN")}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tip card */}
          <div style={{padding:"4px 24px 24px"}}>
            <div style={{fontSize:20,fontWeight:800,color:C.hof,marginBottom:12}}>Money wisdom 💡</div>
            <div style={{background:"linear-gradient(135deg,#FF385C,#FC642D)",borderRadius:20,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-14,right:-14,fontSize:70,opacity:.1}}>💡</div>
              <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.7)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Tip of the moment</div>
              <div key={tipIdx} style={{fontSize:14,fontWeight:600,color:"white",lineHeight:1.6,animation:"tipFade 5s ease forwards"}}>{TIPS[tipIdx]}</div>
            </div>
          </div>
        </div>
      )}

      {/* ════ ADD ════ */}
      {tab==="add" && (
        <div style={{flex:1,overflowY:"auto",paddingBottom:110}}>
          <div style={{padding:"52px 24px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:26,fontWeight:800,color:C.hof}}>Log expense</div>
            <button onClick={()=>setTab("home")} style={{width:34,height:34,borderRadius:"50%",background:C.sand,border:"none",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.hof}}>✕</button>
          </div>
          <div style={{padding:"0 24px"}}>
            <div style={{textAlign:"center",marginBottom:28,padding:"20px",background:C.sand,borderRadius:20}}>
              <div style={{fontSize:12,fontWeight:700,color:C.foggy,marginBottom:8,textTransform:"uppercase",letterSpacing:.6}}>Amount</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <span style={{fontSize:32,fontWeight:800,color:C.foggy}}>₹</span>
                <input type="number" placeholder="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}
                  style={{border:"none",fontSize:56,fontWeight:800,color:C.hof,width:190,textAlign:"center",outline:"none",fontFamily:"inherit",background:"transparent"}}/>
              </div>
              <div style={{height:2,width:120,background:C.border,margin:"8px auto 0"}}/>
            </div>

            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:700,color:C.foggy,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>What for?</label>
              <input className="inp" placeholder="e.g. Zomato, metro card, groceries…" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,fontWeight:700,color:C.foggy,display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:.5}}>Category</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {CATEGORIES.filter(c=>c.id!=="all").map(c=>(
                  <button key={c.id} onClick={()=>setForm({...form,category:c.id})} style={{padding:"9px 15px",borderRadius:30,border:`1.5px solid ${form.category===c.id?C.hof:C.border}`,background:form.category===c.id?C.hof:C.white,color:form.category===c.id?C.white:C.hof,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5,transition:"all .15s"}}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:28}}>
              <label style={{fontSize:12,fontWeight:700,color:C.foggy,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Notes <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></label>
              <textarea className="inp" rows={3} placeholder="Any extra details…" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{resize:"none"}}/>
            </div>
            <button className="submit" onClick={handleAdd}>Log expense 💸</button>
          </div>
        </div>
      )}

      {/* ════ STATS ════ */}
      {tab==="stats" && (
        <div style={{flex:1,overflowY:"auto",paddingBottom:110}}>
          <div style={{padding:"52px 24px 16px"}}>
            <div style={{fontSize:28,fontWeight:800,color:C.hof,letterSpacing:-.5}}>Insights ✨</div>
            <div style={{fontSize:13,color:C.foggy,marginTop:2}}>How are you spending?</div>
          </div>

          <div style={{display:"flex",gap:10,padding:"0 24px 20px",overflowX:"auto"}}>
            {[
              {emoji:"💸",label:"Total",      value:fmt(total),            bg:"linear-gradient(135deg,#FF385C,#FF7A95)"},
              {emoji:"📅",label:"Today",      value:fmt(todayAmt),         bg:"linear-gradient(135deg,#FC642D,#FFB36B)"},
              {emoji:"🧾",label:"Entries",    value:expenses.length,       bg:"linear-gradient(135deg,#00A699,#4DD0C4)"},
              {emoji:"📊",label:"Avg/entry",  value:fmt(expenses.length?total/expenses.length:0), bg:"linear-gradient(135deg,#8B5CF6,#C4B5FD)"},
            ].map(s=>(
              <div key={s.label} style={{flexShrink:0,width:136,borderRadius:18,padding:"16px 14px",background:s.bg,color:"white"}}>
                <div style={{fontSize:26,marginBottom:6}}>{s.emoji}</div>
                <div style={{fontSize:11,fontWeight:600,opacity:.8,textTransform:"uppercase",letterSpacing:.5}}>{s.label}</div>
                <div style={{fontSize:18,fontWeight:800,marginTop:3,letterSpacing:-.5}}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:8,padding:"0 24px 20px"}}>
            {["week","month","year"].map(p=>(
              <button key={p} className="period-btn" onClick={()=>setPeriod(p)} style={{background:period===p?C.hof:C.sand,color:period===p?C.white:C.foggy}}>
                {p==="week"?"Weekly":p==="month"?"Monthly":"Yearly"}
              </button>
            ))}
          </div>

          <div style={{margin:"0 24px 20px",background:C.white,border:`1px solid ${C.border}`,borderRadius:20,padding:"16px 14px 14px"}}>
            <div style={{fontSize:12,fontWeight:700,color:C.foggy,textTransform:"uppercase",letterSpacing:.8,marginBottom:16}}>Spend over time</div>
            {gKeys.length>0 ? (
              <div style={{display:"flex",alignItems:"flex-end",gap:6,height:140}}>
                {gKeys.map((k,i)=>{
                  const h=Math.max((grouped[k]/maxG)*118,6);
                  const isLast=i===gKeys.length-1;
                  return (
                    <div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{fontSize:9,fontWeight:700,color:isLast?C.rausch:C.foggy}}>{fmtK(grouped[k])}</div>
                      <div style={{width:"100%",height:h,borderRadius:"6px 6px 3px 3px",background:isLast?C.rausch:"#EBEBEB",transition:"height .5s cubic-bezier(.34,1.56,.64,1)"}}/>
                      <div style={{fontSize:9,fontWeight:600,color:isLast?C.rausch:C.foggy,textAlign:"center",lineHeight:1.2,wordBreak:"break-word"}}>{k}</div>
                    </div>
                  );
                })}
              </div>
            ):(
              <div style={{textAlign:"center",padding:"24px 0",color:C.foggy,fontSize:14}}>Add expenses to see your chart!</div>
            )}
          </div>

          {catTotals.length>0 && (
            <div style={{margin:"0 24px 20px",background:`${CAT_COLOR[catTotals[0].id]||C.rausch}14`,border:`1.5px solid ${CAT_COLOR[catTotals[0].id]||C.rausch}33`,borderRadius:20,padding:"18px 18px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <Icon name="spark" size={15} stroke={CAT_COLOR[catTotals[0].id]||C.rausch}/>
                <span style={{fontSize:11,fontWeight:700,color:CAT_COLOR[catTotals[0].id]||C.rausch,textTransform:"uppercase",letterSpacing:.6}}>Top category</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:40}}>{catTotals[0].emoji}</div>
                <div>
                  <div style={{fontSize:18,fontWeight:800,color:C.hof}}>{catTotals[0].label}</div>
                  <div style={{fontSize:13,color:C.foggy,marginTop:2}}>You've spent <span style={{fontWeight:800,color:CAT_COLOR[catTotals[0].id]||C.rausch}}>{fmt(catTotals[0].total)}</span> here</div>
                </div>
              </div>
            </div>
          )}

          {catTotals.length>0 && (
            <div style={{margin:"0 24px 20px"}}>
              <div style={{fontSize:18,fontWeight:800,color:C.hof,marginBottom:12}}>By category</div>
              {catTotals.map(c=>{
                const pct=total>0?Math.round(c.total/total*100):0;
                return (
                  <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:C.white,border:`1px solid ${C.border}`,borderRadius:14,marginBottom:8}}>
                    <div style={{width:40,height:40,borderRadius:12,background:CAT_BG[c.id],display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{c.emoji}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                        <span style={{fontSize:14,fontWeight:700,color:C.hof}}>{c.label}</span>
                        <span style={{fontSize:14,fontWeight:700,color:C.hof}}>{fmt(c.total)}</span>
                      </div>
                      <div style={{height:5,background:C.sand,borderRadius:4,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:CAT_COLOR[c.id]||C.rausch,borderRadius:4,transition:"width .6s ease"}}/>
                      </div>
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:C.foggy,flexShrink:0,minWidth:32,textAlign:"right"}}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          )}

          {expenses.length>=2&&(
            <div style={{margin:"0 24px 20px",background:C.sand,borderRadius:20,padding:"16px 18px",display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:44,height:44,borderRadius:14,background:C.babu,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Icon name="trending" size={20} stroke="white"/>
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.hof}}>Quick insight</div>
                <div style={{fontSize:13,color:C.foggy,marginTop:2,lineHeight:1.5}}>Biggest single spend: <span style={{fontWeight:700,color:C.hof}}>{fmt(Math.max(...expenses.map(e=>e.amount)))}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════ CALENDAR ════ */}
      {tab==="timeline" && (
        <div style={{flex:1,overflowY:"auto",paddingBottom:110}}>
          <div style={{padding:"52px 24px 10px"}}>
            <div style={{fontSize:28,fontWeight:800,color:C.hof,letterSpacing:-.5}}>Calendar 📅</div>
            <div style={{fontSize:13,color:C.foggy,marginTop:2}}>Tap a day to see its expenses</div>
          </div>

          <div style={{margin:"0 24px 16px",background:"linear-gradient(135deg,#FF385C,#FC642D)",borderRadius:20,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.75)",textTransform:"uppercase",letterSpacing:.8}}>{MONTH_NAMES[calMonth]} {calYear}</div>
              <div style={{fontSize:24,fontWeight:800,color:"white",marginTop:2,letterSpacing:-.5}}>{fmt(monthTotal)}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.7)",marginTop:2}}>total this month</div>
            </div>
            <div style={{fontSize:34}}>📆</div>
          </div>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px 12px"}}>
            <button onClick={()=>{ if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);setSelDay(null); }}
              style={{width:36,height:36,borderRadius:"50%",background:C.sand,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.hof}}>
              <Icon name="chevronL" size={18}/>
            </button>
            <div style={{fontSize:16,fontWeight:800,color:C.hof}}>{MONTH_NAMES[calMonth]} {calYear}</div>
            <button onClick={()=>{ if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);setSelDay(null); }}
              style={{width:36,height:36,borderRadius:"50%",background:C.sand,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.hof}}>
              <Icon name="chevronR" size={18}/>
            </button>
          </div>

          <div style={{padding:"0 18px 16px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
              {DAYS.map(d=>(
                <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:C.foggy,padding:"4px 0"}}>{d}</div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
              {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const day  = i+1;
                const ds   = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const exps = dayExpenses(day);
                const amt  = exps.reduce((s,e)=>s+e.amount,0);
                const isToday = ds===todayStr;
                const isSel   = ds===selDay;
                return (
                  <div key={day} className="cal-day" onClick={()=>setSelDay(isSel?null:ds)}
                    style={{background:isSel?C.hof:isToday?`${C.rausch}18`:"transparent"}}>
                    <div style={{fontSize:13,fontWeight:isToday||isSel?800:500,color:isSel?C.white:isToday?C.rausch:C.hof,lineHeight:1.3,paddingTop:4}}>{day}</div>
                    {amt>0&&(
                      <>
                        <div style={{width:5,height:5,borderRadius:"50%",background:isSel?"rgba(255,255,255,.7)":C.rausch,marginTop:2}}/>
                        <div style={{fontSize:8,fontWeight:700,color:isSel?"rgba(255,255,255,.75)":C.foggy,marginTop:1}}>{fmtK(amt)}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {selDay&&(
            <div style={{padding:"0 24px",animation:"slideUp .25s ease"}}>
              <div style={{height:1,background:C.border,marginBottom:16}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:17,fontWeight:800,color:C.hof}}>{new Date(selDay+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div>
                {selDayTotal>0&&<div style={{fontSize:15,fontWeight:800,color:C.rausch}}>{fmt(selDayTotal)}</div>}
              </div>
              {selDayExps.length===0 ? (
                <div style={{textAlign:"center",padding:"28px 0",color:C.foggy}}>
                  <div style={{fontSize:40,marginBottom:8}}>✨</div>
                  <div style={{fontSize:14,fontWeight:600}}>No spending on this day!</div>
                </div>
              ) : selDayExps.map((e,i)=>(
                <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:C.white,border:`1px solid ${C.border}`,borderRadius:14,marginBottom:8,animation:`slideUp .2s ease ${i*.04}s both`}}>
                  <div style={{width:40,height:40,borderRadius:12,background:CAT_BG[e.category]||CAT_BG.other,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{CATEGORIES.find(c=>c.id===e.category)?.emoji||"📦"}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:C.hof,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name}</div>
                    <div style={{fontSize:12,color:C.foggy,marginTop:1}}>{CATEGORIES.find(c=>c.id===e.category)?.label}</div>
                    {e.notes&&<div style={{fontSize:11,color:C.foggy,fontStyle:"italic"}}>{e.notes}</div>}
                  </div>
                  <div style={{fontWeight:800,fontSize:15,color:C.hof,flexShrink:0}}>₹{e.amount.toLocaleString("en-IN")}</div>
                </div>
              ))}
            </div>
          )}

          {!selDay&&expenses.length>0&&(
            <div style={{padding:"0 24px"}}>
              <div style={{height:1,background:C.border,marginBottom:16}}/>
              <div style={{fontSize:17,fontWeight:800,color:C.hof,marginBottom:12}}>All entries</div>
              {expenses.slice(0,30).map((e,i)=>(
                <div key={e.id} style={{display:"flex",gap:12,paddingBottom:14,position:"relative"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:CAT_COLOR[e.category]||C.rausch,marginTop:4,flexShrink:0}}/>
                    {i<Math.min(expenses.length,30)-1&&<div style={{width:2,flex:1,background:C.border,marginTop:4}}/>}
                  </div>
                  <div style={{flex:1,background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                      <span style={{fontSize:14,fontWeight:700,color:C.hof,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{e.name}</span>
                      <span style={{fontSize:14,fontWeight:800,color:C.hof,flexShrink:0}}>₹{e.amount.toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{fontSize:12,color:C.foggy,marginTop:3}}>
                      {CATEGORIES.find(c=>c.id===e.category)?.label} · {new Date(e.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════ BOTTOM NAV — floating pill ════ */}
      <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 48px)",maxWidth:360,zIndex:60}}>
        <div style={{background:"rgba(255,255,255,0.96)",backdropFilter:"blur(20px)",borderRadius:32,boxShadow:"0 8px 32px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px"}}>

          <button onClick={()=>setTab("home")} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 0",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",transition:"all .18s",color:tab==="home"?C.rausch:C.foggy}}>
            <Icon name="home" size={20}/>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:.3,textTransform:"uppercase"}}>Home</span>
          </button>

          <button onClick={()=>setTab("stats")} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 0",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",transition:"all .18s",color:tab==="stats"?C.rausch:C.foggy}}>
            <Icon name="stats" size={20}/>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:.3,textTransform:"uppercase"}}>Stats</span>
          </button>

          <div style={{padding:"0 8px"}}>
            <button onClick={()=>setTab("add")} style={{width:52,height:52,borderRadius:"50%",background:tab==="add"?C.hof:C.rausch,border:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"white",cursor:"pointer",transition:"all .2s",lineHeight:1,fontFamily:"inherit",outline:"none",boxShadow:"0 4px 16px rgba(255,56,92,0.45)"}}>
              +
            </button>
          </div>

          <button onClick={()=>setTab("timeline")} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 0",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",transition:"all .18s",color:tab==="timeline"?C.rausch:C.foggy}}>
            <Icon name="calendar" size={20}/>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:.3,textTransform:"uppercase"}}>Calendar</span>
          </button>

          <button onClick={()=>setShowCalc(true)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 0",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",transition:"all .18s",color:showCalc?C.rausch:C.foggy}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2"/>
              <line x1="8" y1="6" x2="16" y2="6"/>
              <line x1="8" y1="11" x2="8.01" y2="11" strokeWidth="3"/>
              <line x1="12" y1="11" x2="12.01" y2="11" strokeWidth="3"/>
              <line x1="16" y1="11" x2="16.01" y2="11" strokeWidth="3"/>
              <line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
              <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3"/>
            </svg>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:.3,textTransform:"uppercase"}}>Calc</span>
          </button>

        </div>
      </div>
    </div>
  );
}
