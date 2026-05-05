import { useState, useMemo, useRef, useEffect } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────
const CATS = {
  receita: ["Salário","Freelance","Investimentos","Outros"],
  despesa: ["Alimentação","Moradia","Transporte","Saúde","Educação","Lazer","Roupas","Outros"],
};
const CAT_META = {
  Salário:      { icon:"💼", color:"#4ade80" },
  Freelance:    { icon:"💡", color:"#60a5fa" },
  Investimentos:{ icon:"📈", color:"#a78bfa" },
  Alimentação:  { icon:"🍽️", color:"#f87171" },
  Moradia:      { icon:"🏠", color:"#fb923c" },
  Transporte:   { icon:"🚗", color:"#fbbf24" },
  Saúde:        { icon:"❤️", color:"#f472b6" },
  Educação:     { icon:"📚", color:"#818cf8" },
  Lazer:        { icon:"🎮", color:"#38bdf8" },
  Roupas:       { icon:"👕", color:"#e879f9" },
  Outros:       { icon:"📦", color:"#94a3b8" },
};
const SUGGESTIONS = [
  "Gastei R$80 no mercado",
  "Paguei R$1500 de aluguel",
  "Recebi R$3000 de salário",
  "Ganhei R$500 de freela",
  "Como investir minha reserva?",
  "Onde estou gastando mais?",
  "Vale a pena o Tesouro Direto?",
];

const fmt      = v => v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtShort = v => v >= 1000 ? `R$${(v/1000).toFixed(1)}k` : fmt(v);
const fmtDate  = d => new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});
const todayStr = () => new Date().toISOString().slice(0,10);

// ─── Sub-components ───────────────────────────────────────────────────────────
function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value/max)*100,100) : 0;
  return (
    <div style={{background:"rgba(255,255,255,0.06)",borderRadius:99,height:5,overflow:"hidden"}}>
      <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width .5s ease"}}/>
    </div>
  );
}

function Sheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",background:"#13192b",borderRadius:"20px 20px 0 0",padding:"0 0 env(safe-area-inset-bottom,16px)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 2px"}}>
          <div style={{width:36,height:4,borderRadius:99,background:"rgba(255,255,255,0.15)"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px 16px"}}>
          <span style={{fontSize:16,fontWeight:800,color:"#f1f5f9"}}>{title}</span>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:99,width:30,height:30,color:"#94a3b8",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"0 20px 24px"}}>{children}</div>
      </div>
    </div>
  );
}

function Inp({ label, ...props }) {
  return (
    <div style={{marginBottom:12}}>
      {label && <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</div>}
      <input {...props} style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"13px 14px",color:"#f1f5f9",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit",...props.style}}/>
    </div>
  );
}

function Sel({ label, children, ...props }) {
  return (
    <div style={{marginBottom:12}}>
      {label && <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</div>}
      <select {...props} style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"13px 14px",color:"#f1f5f9",fontSize:15,outline:"none",fontFamily:"inherit",...props.style}}>
        {children}
      </select>
    </div>
  );
}

function PrimaryBtn({ children, color="#6366f1", ...props }) {
  return (
    <button {...props} style={{width:"100%",background:`linear-gradient(135deg,${color},${color}cc)`,border:"none",borderRadius:14,padding:"15px",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",letterSpacing:"0.2px",...props.style}}>
      {children}
    </button>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((s,d)=>s+d.value,0);
  if (!total) return null;
  let cum = 0;
  const r=54,cx=60,cy=60,sw=18,circ=2*Math.PI*r;
  const segs = data.map(d=>{const pct=(d.value/total)*100;const s=cum;cum+=pct;return{...d,pct,s}});
  return (
    <svg viewBox="0 0 120 120" style={{width:120,height:120,flexShrink:0}}>
      {segs.map((s,i)=>(
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw}
          strokeDasharray={`${(s.pct/100)*circ} ${circ}`}
          strokeDashoffset={-(s.s/100)*circ}
          transform={`rotate(-90 ${cx} ${cy})`}/>
      ))}
      <text x={cx} y={cy-5} textAnchor="middle" fill="#f1f5f9" fontSize="10" fontWeight="800">{fmtShort(total)}</text>
      <text x={cx} y={cy+9} textAnchor="middle" fill="#64748b" fontSize="7">total</text>
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]         = useState("home");
  const [txs, setTxs]         = useState([]);
  const [debts, setDebts]     = useState([]);
  const [budgets, setBudgets] = useState({});
  const [loaded, setLoaded]   = useState(false);
  const [apiKey, setApiKey]   = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const [showDebt, setShowDebt]   = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [form, setForm]       = useState({type:"despesa",category:"Alimentação",amount:"",description:"",date:todayStr()});
  const [debtForm, setDebtForm]   = useState({name:"",total:"",installments:""});
  const [budgetCat, setBudgetCat] = useState("Alimentação");
  const [budgetVal, setBudgetVal] = useState("");
  const [txFilter, setTxFilter]   = useState("todos");
  const [aiMsgs, setAiMsgs]   = useState([{role:"assistant",text:"Olá! 👋 Sou seu Assessor Financeiro IA.\n\nPosso registrar seus gastos e ganhos automaticamente:\n\n💬 \"Gastei R$80 no mercado\"\n💬 \"Recebi R$3000 de salário\"\n💬 \"Paguei R$1500 de aluguel\"\n\nOu me faça perguntas sobre finanças e investimentos! 🚀"}]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatRef = useRef(null);

  // ── localStorage: carrega ao iniciar ─────────────────────────────────────
  useEffect(()=>{
    try {
      const saved = localStorage.getItem("financaspro-v1");
      if (saved) {
        const d = JSON.parse(saved);
        if (d.txs)     setTxs(d.txs);
        if (d.debts)   setDebts(d.debts);
        if (d.budgets) setBudgets(d.budgets);
      }
      const key = localStorage.getItem("financaspro-apikey");
      if (key) setApiKey(key);
    } catch{}
    setLoaded(true);
  },[]);

  // ── localStorage: salva automaticamente ──────────────────────────────────
  useEffect(()=>{
    if (!loaded) return;
    try { localStorage.setItem("financaspro-v1", JSON.stringify({txs,debts,budgets})); } catch{}
  },[txs,debts,budgets,loaded]);

  useEffect(()=>{
    if (apiKey) try { localStorage.setItem("financaspro-apikey", apiKey); } catch{}
  },[apiKey]);

  useEffect(()=>{ chatRef.current?.scrollTo({top:chatRef.current.scrollHeight,behavior:"smooth"}); },[aiMsgs,aiLoading]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(()=>{
    const rec = txs.filter(t=>t.type==="receita").reduce((s,t)=>s+t.amount,0);
    const exp = txs.filter(t=>t.type==="despesa").reduce((s,t)=>s+t.amount,0);
    const bycat={};
    txs.filter(t=>t.type==="despesa").forEach(t=>{bycat[t.category]=(bycat[t.category]||0)+t.amount});
    const mmap={};
    txs.forEach(t=>{const k=t.date.slice(0,7);if(!mmap[k])mmap[k]={r:0,e:0};mmap[k][t.type==="receita"?"r":"e"]+=t.amount});
    const months=Object.keys(mmap).sort().slice(-5).map(k=>({label:k.slice(5),...mmap[k]}));
    const expData=Object.entries(bycat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({name:k,value:v,color:(CAT_META[k]||CAT_META.Outros).color}));
    return {rec,exp,saldo:rec-exp,bycat,months,expData};
  },[txs]);

  // ── AI ────────────────────────────────────────────────────────────────────
  const buildCtx = () => {
    const bycat = Object.entries(stats.bycat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}: ${fmt(v)}`).join(", ")||"Sem dados";
    const recent = txs.slice(0,12).map(t=>`${t.date} ${t.type==="receita"?"+":"-"}${fmt(t.amount)} ${t.category} ${t.description||""}`).join("\n")||"Nenhuma";
    const dividas = debts.map(d=>`${d.name}: ${fmt((d.total/d.installments)*(d.installments-d.paid))} restante`).join(", ")||"Nenhuma";
    const taxa = stats.rec>0?(((stats.rec-stats.exp)/stats.rec)*100).toFixed(1):0;
    return `Você é um assessor financeiro pessoal especializado no Brasil. Responda em português, de forma direta, empática e prática. Máximo 3 parágrafos. Ao sugerir investimentos mencione perfil de risco. Nunca garanta rentabilidade.

DADOS: Saldo ${fmt(stats.saldo)} | Receitas ${fmt(stats.rec)} | Despesas ${fmt(stats.exp)} | Taxa de economia ${taxa}%
Gastos: ${bycat} | Dívidas: ${dividas}
Recentes:\n${recent}`;
  };

  const sendAI = async () => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;
    if (!apiKey) { setShowApiKey(true); return; }
    setAiInput("");
    setAiMsgs(m=>[...m,{role:"user",text}]);
    setAiLoading(true);
    const today = todayStr();
    const history = aiMsgs.map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
    const sys = buildCtx()+`\n\nREGISTRO AUTOMÁTICO: Quando o usuário mencionar gasto, compra, pagamento, receita ou ganho, inclua este bloco ANTES da resposta:\n<TX>{"type":"despesa ou receita","amount":numero,"category":"Alimentação|Moradia|Transporte|Saúde|Educação|Lazer|Roupas|Salário|Freelance|Investimentos|Outros","description":"texto curto","date":"${today}"}</TX>\nDepois escreva confirmação breve. Se for pergunta sem transação, responda normalmente sem o bloco.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:sys,messages:[...history,{role:"user",content:text}]})
      });
      const data = await res.json();
      if (data.error) { setAiMsgs(m=>[...m,{role:"assistant",text:`⚠️ Erro: ${data.error.message}`}]); setAiLoading(false); return; }
      const reply = data.content?.find(b=>b.type==="text")?.text||"Erro ao processar.";
      const match = reply.match(/<TX>([\s\S]*?)<\/TX>/);
      if (match) {
        try {
          const tx = JSON.parse(match[1].trim());
          if (tx.amount>0&&tx.type&&tx.category) setTxs(prev=>[{id:Date.now(),type:tx.type,category:tx.category,description:tx.description||"",amount:tx.amount,date:tx.date||today},...prev]);
        } catch{}
        setAiMsgs(m=>[...m,{role:"assistant",text:reply.replace(/<TX>[\s\S]*?<\/TX>/,"").trim(),action:true}]);
      } else {
        setAiMsgs(m=>[...m,{role:"assistant",text:reply}]);
      }
    } catch(e) {
      setAiMsgs(m=>[...m,{role:"assistant",text:"⚠️ Erro de conexão. Verifique sua internet e tente novamente."}]);
    }
    setAiLoading(false);
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const addTx = () => {
    const amount = parseFloat(form.amount.replace(",","."));
    if (!amount||amount<=0) return;
    setTxs(prev=>[{...form,amount,id:Date.now()},...prev]);
    setForm(f=>({...f,amount:"",description:""}));
    setShowAdd(false);
  };
  const addDebt = () => {
    const total=parseFloat(debtForm.total.replace(",","."));
    const inst=parseInt(debtForm.installments);
    if (!debtForm.name||!total||!inst) return;
    setDebts(prev=>[{...debtForm,total,installments:inst,paid:0,id:Date.now()},...prev]);
    setDebtForm({name:"",total:"",installments:""});
    setShowDebt(false);
  };
  const payInst = id => setDebts(prev=>prev.map(d=>d.id===id&&d.paid<d.installments?{...d,paid:d.paid+1}:d));
  const rmTx    = id => setTxs(prev=>prev.filter(t=>t.id!==id));
  const rmDebt  = id => setDebts(prev=>prev.filter(d=>d.id!==id));
  const filtTx  = txFilter==="todos"?txs:txs.filter(t=>t.type===txFilter);

  const NAV = [
    {id:"home",  icon:"⊞", label:"Início"},
    {id:"txs",   icon:"↕", label:"Gastos"},
    {id:"budget",icon:"🎯",label:"Orçamento"},
    {id:"debts", icon:"💳",label:"Dívidas"},
    {id:"ai",    icon:"✦", label:"IA"},
  ];

  const glass = (extra={}) => ({background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:16,...extra});

  if (!loaded) return (
    <div style={{minHeight:"100dvh",background:"#080e1a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,fontFamily:"system-ui"}}>
      <div style={{width:56,height:56,borderRadius:18,background:"linear-gradient(135deg,#6366f1,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>💰</div>
      <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9"}}>FinançasPRO</div>
      <div style={{width:28,height:28,border:"3px solid rgba(99,102,241,0.2)",borderTop:"3px solid #6366f1",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{minHeight:"100dvh",background:"#080e1a",fontFamily:"'SF Pro Display','Inter',system-ui,sans-serif",color:"#f1f5f9",overflowX:"hidden"}}>
      <style>{`
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
        ::-webkit-scrollbar{display:none}
        input,select,textarea{color-scheme:dark}
        @keyframes blink{0%,100%{opacity:.25}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .msg{animation:fadeUp .25s ease}
      `}</style>

      <div style={{paddingBottom:80}}>

        {/* ══ HOME ══ */}
        {tab==="home" && (
          <div>
            <div style={{background:"linear-gradient(160deg,#1a1060 0%,#0d1a3a 60%,#080e1a 100%)",padding:"52px 20px 28px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,#6366f133,transparent 70%)"}}/>
              <div style={{position:"absolute",bottom:-40,left:-20,width:150,height:150,borderRadius:"50%",background:"radial-gradient(circle,#06b6d422,transparent 70%)"}}/>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:"1px",textTransform:"uppercase"}}>SALDO TOTAL</div>
                <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.15)",borderRadius:99,padding:"3px 9px"}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:"#4ade80"}}/>
                  <span style={{fontSize:10,color:"#4ade80",fontWeight:700}}>Salvo</span>
                </div>
              </div>
              <div style={{fontSize:38,fontWeight:900,letterSpacing:"-1.5px",color:"#f8fafc",lineHeight:1,marginBottom:4}}>{fmt(stats.saldo)}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.35)",marginBottom:24}}>Atualizado agora</div>
              <div style={{display:"flex",gap:12}}>
                <div style={{flex:1,...glass({padding:"12px 14px",borderRadius:14})}}>
                  <div style={{fontSize:10,color:"#4ade80",fontWeight:700,marginBottom:3}}>↑ RECEITAS</div>
                  <div style={{fontSize:17,fontWeight:800}}>{fmtShort(stats.rec)}</div>
                </div>
                <div style={{flex:1,...glass({padding:"12px 14px",borderRadius:14})}}>
                  <div style={{fontSize:10,color:"#f87171",fontWeight:700,marginBottom:3}}>↓ DESPESAS</div>
                  <div style={{fontSize:17,fontWeight:800}}>{fmtShort(stats.exp)}</div>
                </div>
              </div>
            </div>

            <div style={{padding:"16px 16px 0"}}>
              <button onClick={()=>setShowAdd(true)} style={{width:"100%",...glass({padding:"14px 18px",borderRadius:16,display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:"1px dashed rgba(99,102,241,0.4)",background:"rgba(99,102,241,0.06)",marginBottom:16})}}>
                <div style={{width:36,height:36,borderRadius:12,background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>+</div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#a5b4fc"}}>Novo lançamento</div>
                  <div style={{fontSize:11,color:"#475569"}}>Adicione receita ou despesa</div>
                </div>
              </button>

              {stats.months.length>0 && (
                <div style={{...glass(),marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:14}}>Evolução Mensal</div>
                  <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
                    {stats.months.map((m,i)=>{
                      const maxV=Math.max(...stats.months.map(x=>Math.max(x.r||0,x.e||0)),1);
                      return (
                        <div key={i} style={{flex:1,display:"flex",gap:2,alignItems:"flex-end",height:"100%"}}>
                          <div style={{flex:1,background:"#4ade8066",borderRadius:"3px 3px 0 0",height:`${((m.r||0)/maxV)*100}%`,minHeight:2}}/>
                          <div style={{flex:1,background:"#f8717166",borderRadius:"3px 3px 0 0",height:`${((m.e||0)/maxV)*100}%`,minHeight:2}}/>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                    {stats.months.map((m,i)=><span key={i} style={{flex:1,textAlign:"center",fontSize:9,color:"#475569"}}>{m.label}</span>)}
                  </div>
                  <div style={{display:"flex",gap:14,marginTop:10}}>
                    <span style={{fontSize:10,color:"#4ade80",fontWeight:700}}>■ Receita</span>
                    <span style={{fontSize:10,color:"#f87171",fontWeight:700}}>■ Despesa</span>
                  </div>
                </div>
              )}

              {stats.expData.length>0 && (
                <div style={{...glass(),marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <DonutChart data={stats.expData.slice(0,5)}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Top Gastos</div>
                      {stats.expData.slice(0,4).map(d=>(
                        <div key={d.name} style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div style={{width:7,height:7,borderRadius:"50%",background:d.color}}/>
                            <span style={{fontSize:11,color:"#94a3b8"}}>{d.name}</span>
                          </div>
                          <span style={{fontSize:11,fontWeight:700,color:"#f1f5f9"}}>{fmtShort(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {txs.length>0 && (
                <div style={{...glass(),marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px"}}>Recentes</div>
                    <button onClick={()=>setTab("txs")} style={{background:"none",border:"none",fontSize:12,color:"#6366f1",fontWeight:700,cursor:"pointer"}}>Ver tudo</button>
                  </div>
                  {txs.slice(0,4).map(t=>{
                    const m=CAT_META[t.category]||CAT_META.Outros;
                    return (
                      <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                        <div style={{width:38,height:38,borderRadius:12,background:m.color+"1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{m.icon}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{t.description||t.category}</div>
                          <div style={{fontSize:11,color:"#475569"}}>{fmtDate(t.date)}</div>
                        </div>
                        <div style={{fontSize:14,fontWeight:800,color:t.type==="receita"?"#4ade80":"#f87171"}}>
                          {t.type==="receita"?"+":"-"}{fmtShort(t.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button onClick={()=>setTab("ai")} style={{width:"100%",...glass({padding:"14px 18px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:"1px solid rgba(99,102,241,0.2)",background:"linear-gradient(135deg,rgba(99,102,241,0.1),rgba(6,182,212,0.05))",marginBottom:4})}}>
                <div style={{width:40,height:40,borderRadius:14,background:"linear-gradient(135deg,#6366f1,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>✦</div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#a5b4fc"}}>Assessor Financeiro IA</div>
                  <div style={{fontSize:11,color:"#475569"}}>"Onde posso economizar este mês?"</div>
                </div>
                <div style={{marginLeft:"auto",color:"#6366f1",fontSize:20}}>›</div>
              </button>
            </div>
          </div>
        )}

        {/* ══ TRANSAÇÕES ══ */}
        {tab==="txs" && (
          <div style={{padding:"20px 16px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{margin:0,fontSize:22,fontWeight:900,letterSpacing:"-0.5px"}}>Lançamentos</h2>
              <button onClick={()=>setShowAdd(true)} style={{background:"linear-gradient(135deg,#6366f1,#818cf8)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Novo</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[["todos","Todos"],["receita","Receitas"],["despesa","Despesas"]].map(([v,l])=>(
                <button key={v} onClick={()=>setTxFilter(v)} style={{flex:1,padding:"9px",borderRadius:12,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:txFilter===v?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.05)",color:txFilter===v?"#a5b4fc":"#64748b"}}>
                  {l}
                </button>
              ))}
            </div>
            {filtTx.length===0 ? (
              <div style={{textAlign:"center",padding:"60px 0",color:"#334155"}}>
                <div style={{fontSize:40,marginBottom:8}}>📭</div>
                <div style={{fontSize:14}}>Nenhum lançamento</div>
              </div>
            ) : (
              <div style={glass()}>
                {filtTx.map((t,i)=>{
                  const m=CAT_META[t.category]||CAT_META.Outros;
                  return (
                    <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 0",borderBottom:i<filtTx.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                      <div style={{width:40,height:40,borderRadius:13,background:m.color+"1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{m.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{t.description||t.category}</div>
                        <div style={{display:"flex",gap:6,marginTop:2}}>
                          <span style={{fontSize:10,background:m.color+"22",color:m.color,borderRadius:6,padding:"1px 7px",fontWeight:700}}>{t.category}</span>
                          <span style={{fontSize:10,color:"#475569"}}>{fmtDate(t.date)}</span>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:15,fontWeight:800,color:t.type==="receita"?"#4ade80":"#f87171"}}>
                          {t.type==="receita"?"+":"-"}{fmt(t.amount)}
                        </span>
                        <button onClick={()=>rmTx(t.id)} style={{background:"rgba(255,255,255,0.05)",border:"none",borderRadius:8,width:28,height:28,color:"#475569",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ ORÇAMENTO ══ */}
        {tab==="budget" && (
          <div style={{padding:"20px 16px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{margin:0,fontSize:22,fontWeight:900,letterSpacing:"-0.5px"}}>Orçamento</h2>
              <button onClick={()=>setShowBudget(true)} style={{background:"linear-gradient(135deg,#059669,#34d399)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Definir</button>
            </div>
            {Object.keys(budgets).length===0 ? (
              <div style={{textAlign:"center",padding:"60px 0",color:"#334155"}}>
                <div style={{fontSize:40,marginBottom:8}}>🎯</div>
                <div style={{fontSize:14}}>Nenhum limite definido</div>
                <div style={{fontSize:12,marginTop:4}}>Toque em "Definir" para começar</div>
              </div>
            ) : Object.entries(budgets).map(([cat,limit])=>{
              const spent=txs.filter(t=>t.type==="despesa"&&t.category===cat).reduce((s,t)=>s+t.amount,0);
              const pct=limit>0?Math.min((spent/limit)*100,100):0;
              const color=pct>90?"#f87171":pct>70?"#fbbf24":"#4ade80";
              const m=CAT_META[cat]||CAT_META.Outros;
              return (
                <div key={cat} style={{...glass(),marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:36,height:36,borderRadius:11,background:m.color+"1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>{m.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{cat}</div>
                      <div style={{fontSize:11,color:"#475569"}}>{fmt(spent)} de {fmt(limit)}</div>
                    </div>
                    <div style={{fontSize:14,fontWeight:800,color}}>{pct.toFixed(0)}%</div>
                  </div>
                  <Bar value={spent} max={limit} color={color}/>
                  {spent>limit&&<div style={{fontSize:11,color:"#f87171",marginTop:6}}>⚠️ Excedido em {fmt(spent-limit)}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ DÍVIDAS ══ */}
        {tab==="debts" && (
          <div style={{padding:"20px 16px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{margin:0,fontSize:22,fontWeight:900,letterSpacing:"-0.5px"}}>Dívidas</h2>
              <button onClick={()=>setShowDebt(true)} style={{background:"linear-gradient(135deg,#7c3aed,#a78bfa)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Nova</button>
            </div>
            {debts.length===0 ? (
              <div style={{textAlign:"center",padding:"60px 0",color:"#334155"}}>
                <div style={{fontSize:40,marginBottom:8}}>🎉</div>
                <div style={{fontSize:14}}>Sem dívidas cadastradas</div>
              </div>
            ) : debts.map(d=>{
              const instVal=d.total/d.installments;
              const rem=instVal*(d.installments-d.paid);
              const done=d.paid>=d.installments;
              return (
                <div key={d.id} style={{...glass({marginBottom:10}),opacity:done?.6:1,borderColor:done?"rgba(74,222,128,0.2)":"rgba(167,139,250,0.15)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:800,color:"#e2e8f0",marginBottom:2}}>{d.name}</div>
                      <div style={{fontSize:11,color:"#475569"}}>{fmt(instVal)}/parcela · {d.paid}/{d.installments} pagas</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:16,fontWeight:800,color:done?"#4ade80":"#f87171"}}>{done?"✓ Quitado":fmt(rem)}</div>
                      {!done&&<div style={{fontSize:10,color:"#475569"}}>restante</div>}
                    </div>
                  </div>
                  <Bar value={d.paid} max={d.installments} color={done?"#4ade80":"#a78bfa"}/>
                  <div style={{display:"flex",gap:8,marginTop:12}}>
                    {!done&&<button onClick={()=>payInst(d.id)} style={{flex:1,background:"rgba(5,150,105,0.2)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:12,padding:"10px",color:"#4ade80",fontSize:13,fontWeight:700,cursor:"pointer"}}>✓ Pagar parcela</button>}
                    <button onClick={()=>rmDebt(d.id)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 14px",color:"#64748b",fontSize:13,fontWeight:700,cursor:"pointer"}}>Remover</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ IA ══ */}
        {tab==="ai" && (
          <div style={{display:"flex",flexDirection:"column",height:"calc(100dvh - 80px)"}}>
            <div style={{background:"linear-gradient(135deg,#1e1b4b,#0d1a3a)",padding:"20px 20px 14px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:42,height:42,borderRadius:14,background:"linear-gradient(135deg,#6366f1,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>✦</div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:800,color:"#e0e7ff"}}>Assessor Financeiro IA</div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 6px #4ade80"}}/>
                  <span style={{fontSize:11,color:"#64748b"}}>Especialista em finanças • Online</span>
                </div>
              </div>
              <button onClick={()=>setShowApiKey(true)} style={{background:"rgba(255,255,255,0.07)",border:"none",borderRadius:10,padding:"6px 10px",color:"#64748b",fontSize:11,cursor:"pointer",fontWeight:700}}>
                {apiKey?"🔑 API":"⚙️ Config"}
              </button>
            </div>

            <div style={{padding:"10px 14px",display:"flex",gap:7,overflowX:"auto",background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              {SUGGESTIONS.map(s=>(
                <button key={s} onClick={()=>setAiInput(s)} style={{flexShrink:0,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:99,padding:"6px 13px",fontSize:11,color:"#94a3b8",cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>{s}</button>
              ))}
            </div>

            <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"16px 14px",display:"flex",flexDirection:"column",gap:12}}>
              {aiMsgs.map((m,i)=>(
                <div key={i} className="msg" style={{display:"flex",flexDirection:m.role==="user"?"row-reverse":"row",alignItems:"flex-end",gap:8}}>
                  {m.role==="assistant"&&<div style={{width:30,height:30,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>✦</div>}
                  <div style={{maxWidth:"83%",display:"flex",flexDirection:"column",gap:5}}>
                    {m.action&&<div style={{background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:10,padding:"5px 10px",fontSize:11,color:"#4ade80",fontWeight:700}}>✅ Lançamento registrado</div>}
                    <div style={{background:m.role==="user"?"linear-gradient(135deg,#4f46e5,#6366f1)":"rgba(255,255,255,0.05)",color:"#f1f5f9",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"12px 15px",fontSize:14,lineHeight:1.6,border:m.role==="assistant"?"1px solid rgba(255,255,255,0.06)":"none",whiteSpace:"pre-wrap"}}>
                      {m.text.replace(/\*\*(.*?)\*\*/g,"$1")}
                    </div>
                  </div>
                </div>
              ))}
              {aiLoading&&(
                <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
                  <div style={{width:30,height:30,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>✦</div>
                  <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"18px 18px 18px 4px",padding:"14px 18px",display:"flex",gap:5}}>
                    {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#6366f1",animation:`blink 1.2s ${i*.2}s infinite`}}/>)}
                  </div>
                </div>
              )}
              <div style={{height:4}}/>
            </div>

            <div style={{padding:"10px 14px calc(10px + env(safe-area-inset-bottom,0px))",background:"rgba(8,14,26,0.95)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:8,alignItems:"flex-end"}}>
              <textarea
                style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"12px 15px",color:"#f1f5f9",fontSize:14,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.4,maxHeight:110}}
                placeholder="Pergunte ou diga o que gastou…"
                rows={1}
                value={aiInput}
                onChange={e=>setAiInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendAI()}}}
              />
              <button onClick={sendAI} disabled={aiLoading||!aiInput.trim()} style={{width:46,height:46,borderRadius:14,background:(aiLoading||!aiInput.trim())?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#6366f1,#818cf8)",border:"none",color:(aiLoading||!aiInput.trim())?"#334155":"#fff",fontSize:18,cursor:(aiLoading||!aiInput.trim())?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
                {aiLoading?"…":"➤"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"rgba(8,14,26,0.92)",backdropFilter:"blur(24px)",borderTop:"1px solid rgba(255,255,255,0.06)",padding:"8px 8px calc(8px + env(safe-area-inset-bottom,0px))",display:"flex"}}>
        {NAV.map(n=>{
          const active=tab===n.id;
          return (
            <button key={n.id} onClick={()=>setTab(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"6px 4px",borderRadius:12}}>
              <div style={{width:32,height:32,borderRadius:10,background:active?"rgba(99,102,241,0.2)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>
                <span style={{filter:active?"none":"grayscale(1)",opacity:active?1:.5}}>{n.icon}</span>
              </div>
              <span style={{fontSize:9,fontWeight:700,color:active?"#a5b4fc":"#334155",letterSpacing:"0.3px"}}>{n.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Sheet: Novo Lançamento ── */}
      <Sheet open={showAdd} onClose={()=>setShowAdd(false)} title="Novo Lançamento">
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {["despesa","receita"].map(t=>(
            <button key={t} onClick={()=>setForm(f=>({...f,type:t,category:CATS[t][0]}))} style={{flex:1,padding:"12px",borderRadius:14,border:`2px solid ${form.type===t?(t==="receita"?"#4ade80":"#f87171"):"rgba(255,255,255,0.07)"}`,background:form.type===t?(t==="receita"?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)"):"rgba(255,255,255,0.03)",color:form.type===t?(t==="receita"?"#4ade80":"#f87171"):"#475569",fontSize:14,fontWeight:800,cursor:"pointer"}}>
              {t==="receita"?"↑ Receita":"↓ Despesa"}
            </button>
          ))}
        </div>
        <Sel label="Categoria" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
          {CATS[form.type].map(c=><option key={c}>{c}</option>)}
        </Sel>
        <Inp label="Valor (R$)" type="number" min="0" step="0.01" placeholder="0,00" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
        <Inp label="Descrição" placeholder="Opcional" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
        <Inp label="Data" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
        <PrimaryBtn color={form.type==="receita"?"#059669":"#6366f1"} onClick={addTx}>
          Adicionar {form.type==="receita"?"Receita":"Despesa"}
        </PrimaryBtn>
      </Sheet>

      {/* ── Sheet: Nova Dívida ── */}
      <Sheet open={showDebt} onClose={()=>setShowDebt(false)} title="Nova Dívida">
        <Inp label="Nome" placeholder="Ex: Cartão de crédito" value={debtForm.name} onChange={e=>setDebtForm(f=>({...f,name:e.target.value}))}/>
        <Inp label="Valor total (R$)" type="number" min="0" step="0.01" placeholder="0,00" value={debtForm.total} onChange={e=>setDebtForm(f=>({...f,total:e.target.value}))}/>
        <Inp label="Número de parcelas" type="number" min="1" placeholder="12" value={debtForm.installments} onChange={e=>setDebtForm(f=>({...f,installments:e.target.value}))}/>
        {debtForm.total&&debtForm.installments&&(
          <div style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:12,padding:"12px 14px",marginBottom:16,fontSize:13,color:"#a78bfa",fontWeight:600}}>
            Parcela: {fmt(parseFloat(debtForm.total||0)/parseInt(debtForm.installments||1))}/mês
          </div>
        )}
        <PrimaryBtn color="#7c3aed" onClick={addDebt}>Adicionar Dívida</PrimaryBtn>
      </Sheet>

      {/* ── Sheet: Orçamento ── */}
      <Sheet open={showBudget} onClose={()=>setShowBudget(false)} title="Definir Orçamento">
        <Sel label="Categoria" value={budgetCat} onChange={e=>setBudgetCat(e.target.value)}>
          {CATS.despesa.map(c=><option key={c}>{c}</option>)}
        </Sel>
        <Inp label="Limite mensal (R$)" type="number" min="0" step="0.01" placeholder="0,00" value={budgetVal} onChange={e=>setBudgetVal(e.target.value)}/>
        <PrimaryBtn color="#059669" onClick={()=>{
          const v=parseFloat(budgetVal.replace(",","."));
          if(v>0){setBudgets(b=>({...b,[budgetCat]:v}));setBudgetVal("");setShowBudget(false);}
        }}>Salvar Limite</PrimaryBtn>
      </Sheet>

      {/* ── Sheet: API Key ── */}
      <Sheet open={showApiKey} onClose={()=>setShowApiKey(false)} title="Configurar IA">
        <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:12,padding:"12px 14px",marginBottom:16,fontSize:13,color:"#94a3b8",lineHeight:1.6}}>
          Para usar o Assessor IA, você precisa de uma chave da API da Anthropic.<br/><br/>
          Acesse <span style={{color:"#a5b4fc",fontWeight:700}}>console.anthropic.com</span>, crie uma conta gratuita e gere sua API Key.
        </div>
        <Inp
          label="Sua API Key"
          type="password"
          placeholder="sk-ant-..."
          value={apiKey}
          onChange={e=>setApiKey(e.target.value)}
        />
        <PrimaryBtn onClick={()=>setShowApiKey(false)}>Salvar e fechar</PrimaryBtn>
      </Sheet>
    </div>
  );
}
