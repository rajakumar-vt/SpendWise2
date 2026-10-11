import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownLeft, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown,
  CircleHelp, Coffee, CreditCard, Download, Gauge, HeartPulse, Home, LayoutDashboard,
  Lightbulb, Menu, Plus, RotateCcw, Settings2, ShieldAlert, ShoppingBag, Sparkles,
  Target, TrendingDown, TrendingUp, Wallet, X, Zap
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";

const INITIAL_BUDGET = 10000;
const seedTransactions = [
  { id: 1, title: "Groceries", category: "Food", amount: 680, date: "Today", kind: "expense", icon: "food" },
  { id: 2, title: "Metro card", category: "Transport", amount: 240, date: "Today", kind: "expense", icon: "transport" },
  { id: 3, title: "Coffee with friends", category: "Lifestyle", amount: 180, date: "Yesterday", kind: "expense", icon: "coffee" },
  { id: 4, title: "Monthly stipend", category: "Income", amount: 10000, date: "Oct 1", kind: "income", icon: "income" },
  { id: 5, title: "Music subscription", category: "Subscriptions", amount: 119, date: "Oct 2", kind: "expense", icon: "subscription" },
  { id: 6, title: "Notebook & pens", category: "Education", amount: 260, date: "Oct 3", kind: "expense", icon: "education" }
];
const initialGoals = [
  { id: 1, name: "New headphones", target: 3000, saved: 1200, emoji: "🎧" },
  { id: 2, name: "Emergency cushion", target: 2000, saved: 600, emoji: "🛟" }
];
const initialSubscriptions = [
  { id: 1, name: "Music Plus", detail: "Renews in 4 days", amount: 119, emoji: "🎵", active: true },
  { id: 2, name: "Video Club", detail: "Renews in 9 days", amount: 199, emoji: "🎬", active: true },
  { id: 3, name: "Cloud storage", detail: "Renews in 17 days", amount: 79, emoji: "☁️", active: true }
];
const chartSeed = [
  { day: "Oct 1", spend: 0, forecast: 0 }, { day: "Oct 5", spend: 950, forecast: 1400 },
  { day: "Oct 9", spend: 1680, forecast: 2300 }, { day: "Oct 13", spend: 2480, forecast: 3200 },
  { day: "Oct 17", spend: 0, forecast: 4200 }, { day: "Oct 21", spend: 0, forecast: 5400 },
  { day: "Oct 25", spend: 0, forecast: 6500 }, { day: "Oct 30", spend: 0, forecast: 7900 }
];
const money = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const percent = (a, b) => b ? Math.min(100, Math.round(a / b * 100)) : 0;
const categoryColors = { Food: "#b9f36a", Transport: "#7ad9c2", Lifestyle: "#c7b7ff", Education: "#ffbf7b", Subscriptions: "#ff8d9c", Bills: "#82aaff", Health: "#77c8f2", Other: "#b6c1b9" };

function App() {
  const [page, setPage] = useState("Overview");
  const [transactions, setTransactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sw-transactions")) || seedTransactions; } catch { return seedTransactions; }
  });
  const [goals, setGoals] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sw-goals")) || initialGoals; } catch { return initialGoals; }
  });
  const [subscriptions, setSubscriptions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sw-subs")) || initialSubscriptions; } catch { return initialSubscriptions; }
  });
  const [modal, setModal] = useState("");
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [txForm, setTxForm] = useState({ title: "", amount: "", category: "Food", kind: "expense" });
  const [sim, setSim] = useState({ type: "purchase", amount: 1500, label: "New sneakers" });
  const [committed, setCommitted] = useState([ { id: 1, title: "Phone bill", amount: 399, date: "Oct 15" }, { id: 2, title: "Transport pass", amount: 500, date: "Oct 18" } ]);
  const [newGoal, setNewGoal] = useState({ name: "", target: "", emoji: "🎯" });
  const [goalContribution, setGoalContribution] = useState({});
  const [day, setDay] = useState(11);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { localStorage.setItem("sw-transactions", JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem("sw-goals", JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem("sw-subs", JSON.stringify(subscriptions)); }, [subscriptions]);
  useEffect(() => { if (toast) { const id = setTimeout(() => setToast(""), 2600); return () => clearTimeout(id); } }, [toast]);

  const income = transactions.filter(t => t.kind === "income").reduce((s,t) => s + Number(t.amount), 0);
  const expenses = transactions.filter(t => t.kind === "expense").reduce((s,t) => s + Number(t.amount), 0);
  const startingIncome = Math.max(INITIAL_BUDGET, income);
  const activeSubs = subscriptions.filter(s => s.active);
  const subscriptionTotal = activeSubs.reduce((s,x) => s + x.amount, 0);
  const committedTotal = committed.reduce((s,x) => s + x.amount, 0);
  const remaining = startingIncome - expenses;
  const safeBalance = remaining - committedTotal - subscriptionTotal;
  const daysLeft = Math.max(1, 30 - day + 1);
  const dailyAllowance = Math.floor(Math.max(0, safeBalance) / daysLeft);
  const goalTarget = goals.reduce((s,g) => s + g.target, 0);
  const goalSaved = goals.reduce((s,g) => s + g.saved, 0);
  const savingsProgress = percent(goalSaved, goalTarget);
  const risk = safeBalance < 1000 ? "High" : safeBalance < 2500 ? "Watch" : "Low";
  const healthScore = Math.max(12, Math.min(98, Math.round(50 + (safeBalance / INITIAL_BUDGET) * 35 + savingsProgress * .13 - (risk === "High" ? 15 : risk === "Watch" ? 5 : 0))));
  const projectedSpend = expenses + committedTotal + subscriptionTotal + dailyAllowance * daysLeft;
  const categoryData = useMemo(() => {
    const grouped = {};
    transactions.filter(t => t.kind === "expense").forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount); });
    return Object.entries(grouped).map(([name, value]) => ({ name, value, color: categoryColors[name] || categoryColors.Other })).sort((a,b) => b.value-a.value);
  }, [transactions]);
  const trendData = useMemo(() => chartSeed.map((d, i) => ({ ...d, spend: i <= 2 ? Math.round(expenses * (i + 1) / 3) : 0, forecast: Math.round((expenses + committedTotal + subscriptionTotal) * (i + 1) / 8 + (INITIAL_BUDGET - remaining) * .3) })), [expenses, committedTotal, subscriptionTotal, remaining]);
  const simEffect = sim.type === "cancel" ? -Math.min(sim.amount, subscriptionTotal) : sim.type === "income" ? -sim.amount : sim.amount;
  const simBalance = safeBalance - simEffect;
  const simAllowance = Math.floor(Math.max(0, simBalance) / daysLeft);
  const simRisk = simBalance < 1000 ? "High" : simBalance < 2500 ? "Watch" : "Low";

  function notify(message) { setToast(message); }
  function addTransaction(e) {
    e.preventDefault();
    const amount = Number(txForm.amount);
    if (!txForm.title.trim() || !Number.isFinite(amount) || amount <= 0) { notify("Enter a title and a valid amount."); return; }
    setTransactions(prev => [{ id: Date.now(), title: txForm.title.trim(), category: txForm.kind === "income" ? "Income" : txForm.category, amount, date: "Just now", kind: txForm.kind, icon: txForm.kind === "income" ? "income" : "other" }, ...prev]);
    setTxForm({ title: "", amount: "", category: "Food", kind: "expense" });
    setModal(""); notify("Transaction added. Your budget has been updated.");
  }
  function confirmSimulation() {
    const amount = Number(sim.amount);
    if (!amount || amount <= 0) { notify("Choose a valid simulation amount."); return; }
    if (sim.type === "cancel") {
      const sub = activeSubs.find(s => s.amount <= amount) || activeSubs[0];
      if (!sub) { notify("No active subscription to cancel."); return; }
      setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, active: false } : s));
      notify(`${sub.name} cancelled. Your future commitments are lower.`);
    } else {
      const value = sim.type === "income" ? -amount : amount;
      setTransactions(prev => [{ id: Date.now(), title: sim.label || (sim.type === "income" ? "Extra income" : "Simulated purchase"), category: sim.type === "income" ? "Income" : "Lifestyle", amount, date: "Just now", kind: sim.type === "income" ? "income" : "expense", icon: sim.type === "income" ? "income" : "other" }, ...prev]);
      notify(sim.type === "income" ? "Income added to your budget." : "Decision applied to your budget.");
    }
    setModal(""); setPage("Overview");
  }
  function addGoal(e) {
    e.preventDefault();
    const target = Number(newGoal.target);
    if (!newGoal.name.trim() || target <= 0) { notify("Add a goal name and target."); return; }
    setGoals(prev => [...prev, { id: Date.now(), name: newGoal.name.trim(), target, saved: 0, emoji: newGoal.emoji || "🎯" }]);
    setNewGoal({ name: "", target: "", emoji: "🎯" }); setModal(""); notify("Savings goal created.");
  }
  function contribute(id) {
    const amount = Number(goalContribution[id] || 100);
    const goal = goals.find(g => g.id === id);
    if (!goal || amount <= 0 || amount > Math.max(0, safeBalance)) { notify("Contribution exceeds your safe-to-spend balance."); return; }
    setGoals(prev => prev.map(g => g.id === id ? { ...g, saved: Math.min(g.target, g.saved + amount) } : g));
    setTransactions(prev => [{ id: Date.now(), title: `Saved for ${goal.name}`, category: "Education", amount, date: "Just now", kind: "expense", icon: "other" }, ...prev]);
    setGoalContribution(prev => ({ ...prev, [id]: "" })); notify(`${money(amount)} added to ${goal.name}.`);
  }
  function resetDemo() {
    setTransactions(seedTransactions); setGoals(initialGoals); setSubscriptions(initialSubscriptions);
    setCommitted([{ id: 1, title: "Phone bill", amount: 399, date: "Oct 15" }, { id: 2, title: "Transport pass", amount: 500, date: "Oct 18" }]);
    setDay(11); localStorage.removeItem("sw-transactions"); localStorage.removeItem("sw-goals"); localStorage.removeItem("sw-subs");
    notify("Demo data restored.");
  }
  function exportData() {
    const data = { budget: INITIAL_BUDGET, transactions, goals, subscriptions, commitments: committed };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "spendwise-data.json"; a.click(); URL.revokeObjectURL(url);
    notify("Your data export is ready.");
  }

  const nav = [
    { label: "Overview", icon: LayoutDashboard }, { label: "Transactions", icon: Activity },
    { label: "Savings goals", icon: Target }, { label: "Subscriptions", icon: CreditCard },
    { label: "Decision lab", icon: Sparkles }
  ];
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Wallet size={21}/></div><span>spendwise<span className="brand-dot">.</span></span></div>
      <div className="workspace-label">YOUR MONEY SPACE</div>
      <nav>{nav.map(({label, icon: Icon}) => <button key={label} className={`nav-item ${page === label ? "active" : ""}`} onClick={() => {setPage(label);setMobileNav(false);}}><Icon size={18}/><span>{label}</span>{label === "Decision lab" && <span className="nav-new">TRY</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="coach-card"><div className="coach-icon"><Sparkles size={17}/></div><strong>A little money wisdom</strong><p>Small choices today make more room for tomorrow.</p><button onClick={() => {setPage("Decision lab");setMobileNav(false)}}>Explore decisions <span>↗</span></button></div>
        <button className="nav-item" onClick={exportData}><Download size={18}/><span>Export my data</span></button>
        <button className="nav-item" onClick={resetDemo}><RotateCcw size={18}/><span>Reset demo</span></button>
        <div className="profile"><div className="avatar">M</div><div className="profile-copy"><strong>Your money era</strong><span>Personal workspace</span></div><Settings2 size={17} className="muted"/></div>
      </div>
    </aside>
    {mobileNav && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={20}/></button>
        <div className="breadcrumb">Your space <span>/</span> <strong>{page}</strong></div>
        <div className="top-actions"><span className="month-pill"><CalendarDays size={15}/> October 2026 <ChevronDown size={14}/></span><button className="icon-button notification" aria-label="Notifications" onClick={() => notify("You're all caught up. No new alerts.")}><Bell size={18}/><i/></button><div className="top-avatar">M</div></div>
      </header>
      <div className="page-content">
        {page === "Overview" && <Overview {...{income, expenses, remaining, safeBalance, dailyAllowance, daysLeft, committedTotal, subscriptionTotal, savingsProgress, goalSaved, goalTarget, risk, healthScore, projectedSpend, categoryData, trendData, transactions, committed, goals, activeSubs, setModal, setPage, setShowAll, showAll, day, setDay, notify}}/>}
        {page === "Transactions" && <Transactions {...{transactions, setModal, setTransactions, showAll, setShowAll}}/>}
        {page === "Savings goals" && <Goals {...{goals, safeBalance, goalContribution, setGoalContribution, contribute, setModal}}/>}
        {page === "Subscriptions" && <Subscriptions {...{subscriptions, setSubscriptions, setTransactions, notify, subscriptionTotal, committed, setCommitted}}/>}
        {page === "Decision lab" && <DecisionLab {...{sim, setSim, safeBalance, remaining, committedTotal, subscriptionTotal, daysLeft, dailyAllowance, risk, simEffect, simBalance, simAllowance, simRisk, confirmSimulation, setModal}}/>}
      </div>
      <footer className="footer"><span>Made for your next money move <span className="footer-heart">♥</span></span><span>SpendWise · Demo workspace · No bank connection</span></footer>
    </main>
    {modal === "transaction" && <Modal title="Add a transaction" onClose={() => setModal("")}><form className="modal-form" onSubmit={addTransaction}><label>What was it for?<input autoFocus value={txForm.title} onChange={e => setTxForm({...txForm,title:e.target.value})} placeholder="e.g. Lunch with friends" required/></label><label>Amount (₹)<input type="number" min="1" value={txForm.amount} onChange={e => setTxForm({...txForm,amount:e.target.value})} placeholder="350" required/></label><label>Transaction type<select value={txForm.kind} onChange={e => setTxForm({...txForm,kind:e.target.value})}><option value="expense">Expense</option><option value="income">Income</option></select></label>{txForm.kind === "expense" && <label>Category<select value={txForm.category} onChange={e => setTxForm({...txForm,category:e.target.value})}>{["Food","Transport","Lifestyle","Education","Subscriptions","Bills","Health","Other"].map(c=><option key={c}>{c}</option>)}</select></label>}<button className="primary-button full-button" type="submit"><Plus size={17}/> Save transaction</button></form></Modal>}
    {modal === "goal" && <Modal title="Create a savings goal" onClose={() => setModal("")}><form className="modal-form" onSubmit={addGoal}><label>Goal name<input autoFocus value={newGoal.name} onChange={e => setNewGoal({...newGoal,name:e.target.value})} placeholder="e.g. Concert tickets" required/></label><label>Target amount (₹)<input type="number" min="1" value={newGoal.target} onChange={e => setNewGoal({...newGoal,target:e.target.value})} placeholder="2500" required/></label><label>Choose an emoji<select value={newGoal.emoji} onChange={e => setNewGoal({...newGoal,emoji:e.target.value})}><option>🎯</option><option>🎧</option><option>✈️</option><option>🛟</option><option>🎓</option><option>🎉</option></select></label><button className="primary-button full-button" type="submit"><Target size={17}/> Create goal</button></form></Modal>}
    {toast && <div className="toast"><span className="toast-check"><Check size={15}/></span>{toast}<button aria-label="Dismiss message" onClick={() => setToast("")}><X size={15}/></button></div>}
  </div>;
}

function Overview(p) {
  const { income, expenses, remaining, safeBalance, dailyAllowance, daysLeft, committedTotal, subscriptionTotal, savingsProgress, goalSaved, goalTarget, risk, healthScore, projectedSpend, categoryData, trendData, transactions, committed, goals, activeSubs, setModal, setPage, setShowAll, showAll, day, setDay, notify } = p;
  const recent = showAll ? transactions : transactions.slice(0,4);
  return <>
    <div className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> YOUR FINANCIAL SNAPSHOT</div><h1>Your money, <span>your moves.</span></h1><p className="subtitle">Every rupee has a job. Let's make yours count.</p></div><button className="primary-button" onClick={() => setModal("transaction")}><Plus size={17}/> Add transaction</button></div>
    <section className="hero-grid">
      <div className="balance-card">
        <div className="balance-top"><div><span className="label-light">AVAILABLE BALANCE</span><div className="balance-amount">{money(remaining)}</div><div className="balance-caption"><span className="positive-chip"><TrendingUp size={13}/> Budget remaining</span><span>of {money(income || INITIAL_BUDGET)}</span></div></div><div className="balance-symbol"><Wallet size={23}/></div></div>
        <div className="balance-progress"><div className="progress-label"><span>Budget used</span><strong>{percent(expenses, income || INITIAL_BUDGET)}%</strong></div><div className="progress-track"><div style={{width:`${percent(expenses, income || INITIAL_BUDGET)}%`}}/></div></div>
        <div className="balance-bottom"><div><span>Spent so far</span><strong>{money(expenses)}</strong></div><div><span>Safe to spend</span><strong>{money(Math.max(0,safeBalance))}</strong></div><div><span>Days left</span><strong>{daysLeft} days</strong></div></div>
        <div className="balance-decoration decoration-one"/><div className="balance-decoration decoration-two"/>
      </div>
      <div className="allowance-card">
        <div className="card-heading"><div><span className="label-muted">YOUR DAILY PACE</span><h3>Spend with ease.</h3></div><div className="allowance-icon"><Zap size={19}/></div></div>
        <div className="allowance-number">{money(dailyAllowance)}<small>/ day</small></div>
        <p className="muted-text">Your suggested daily allowance after upcoming commitments.</p>
        <div className="allowance-rule"><span className="rule-dot"/><span>{risk === "Low" ? "You're in a comfortable spot." : risk === "Watch" ? "Keep an eye on extra spending." : "Consider pausing non-essentials."}</span></div>
        <button className="text-button" onClick={() => setPage("Decision lab")}>Test a money decision <span>↗</span></button>
      </div>
    </section>
    <section className="stat-grid">
      <StatCard icon={ArrowDownLeft} label="Income this month" value={money(income || INITIAL_BUDGET)} note="Your starting budget" tone="mint"/>
      <StatCard icon={ArrowUpRight} label="Total spent" value={money(expenses)} note={`${percent(expenses,income||INITIAL_BUDGET)}% of your budget`} tone="peach"/>
      <StatCard icon={CalendarDays} label="Upcoming commitments" value={money(committedTotal + subscriptionTotal)} note="Bills + subscriptions" tone="lavender"/>
      <StatCard icon={Target} label="Savings progress" value={`${savingsProgress}%`} note={`${money(goalSaved)} of ${money(goalTarget)} goals`} tone="blue"/>
    </section>
    <section className="content-grid main-content-grid">
      <div className="panel spending-panel"><div className="panel-header"><div><h3>Spending & forecast</h3><p>Where you are vs. where you're heading</p></div><span className="select-static">30 days <ChevronDown size={14}/></span></div>
        <div className="chart-legend"><span><i className="legend-spend"/> Actual spending</span><span><i className="legend-forecast"/> Projected spend</span></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{top:8,right:8,left:-18,bottom:0}}><defs><linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b9f36a" stopOpacity={0.28}/><stop offset="100%" stopColor="#b9f36a" stopOpacity={0}/></linearGradient><linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b6a5ef" stopOpacity={0.16}/><stop offset="100%" stopColor="#b6a5ef" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9eee9"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:"#8a958d",fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"#8a958d",fontSize:11}} tickFormatter={v=>v===0?"₹0":`₹${v/1000}k`}/><Tooltip formatter={v=>money(v)} contentStyle={{borderRadius:12,border:"1px solid #e6ebe6",fontSize:12}}/><Area type="monotone" dataKey="forecast" name="Projected spend" stroke="#b6a5ef" strokeWidth={2} strokeDasharray="5 5" fill="url(#forecastFill)"/><Area type="monotone" dataKey="spend" name="Actual spending" stroke="#77a83a" strokeWidth={2.5} fill="url(#spendFill)"/></AreaChart></ResponsiveContainer></div>
        <div className="forecast-callout"><div className="callout-icon"><Lightbulb size={17}/></div><p><strong>{projectedSpend > INITIAL_BUDGET ? "Heads up: your plan may stretch your budget." : "You're building a little breathing room."}</strong><span>{projectedSpend > INITIAL_BUDGET ? `Your current pace could put you ${money(projectedSpend-INITIAL_BUDGET)} over budget. Try the Decision Lab to explore options.` : `Based on known commitments, keep checking your daily pace to stay on track.`}</span></p><button aria-label="Open decision lab" onClick={() => setPage("Decision lab")}>↗</button></div>
      </div>
      <div className="panel health-panel"><div className="panel-header"><div><h3>Financial health</h3><p>A snapshot of your money habits</p></div><span className={`risk-pill risk-${risk.toLowerCase()}`}>{risk === "Low" ? "On track" : risk === "Watch" ? "Keep watch" : "At risk"}</span></div>
        <div className="health-score-wrap"><div className="health-ring" style={{"--score":`${healthScore*3.6}deg`}}><div><strong>{healthScore}</strong><span>out of 100</span></div></div><div className="health-copy"><strong>{healthScore >= 75 ? "Looking good!" : healthScore >= 50 ? "Room to improve" : "Let's rebalance"}</strong><p>{healthScore >= 75 ? "Your budget has room for the unexpected." : healthScore >= 50 ? "A few thoughtful choices can strengthen your month." : "Protect essentials and pause optional spending."}</p></div></div>
        <div className="health-factors"><HealthFactor label="Budget control" value={Math.max(10,100-percent(expenses,INITIAL_BUDGET))} color="green"/><HealthFactor label="Savings momentum" value={savingsProgress} color="purple"/><HealthFactor label="Commitment load" value={Math.max(8,100-percent(committedTotal+subscriptionTotal,INITIAL_BUDGET))} color="orange"/></div>
        <button className="outline-button full-button" onClick={() => setPage("Decision lab")}><HeartPulse size={16}/> Improve my financial health</button>
      </div>
    </section>
    <section className="content-grid lower-grid">
      <div className="panel transactions-panel"><div className="panel-header"><div><h3>Recent activity</h3><p>Your money story, one move at a time</p></div><button className="text-button" onClick={() => setPage("Transactions")}>View all <span>↗</span></button></div>
        <div className="transaction-list">{recent.map(t=><TransactionRow key={t.id} transaction={t}/>)}</div>
        {transactions.length > 4 && <button className="show-more" onClick={() => setShowAll(!showAll)}>{showAll ? "Show less" : "Show more activity"}</button>}
      </div>
      <div className="panel breakdown-panel"><div className="panel-header"><div><h3>Spending mix</h3><p>Know what takes the biggest slice</p></div></div>
        {categoryData.length ? <><div className="donut-area"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none">{categoryData.map((entry,i)=><Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip formatter={v=>money(v)} contentStyle={{borderRadius:12,fontSize:12}}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{money(expenses)}</strong><span>total spent</span></div></div><div className="category-list">{categoryData.slice(0,4).map(c=><div className="category-line" key={c.name}><span className="category-name"><i style={{background:c.color}}/>{c.name}</span><strong>{money(c.value)}</strong><span className="category-percent">{percent(c.value,expenses)}%</span></div>)}</div></> : <EmptyState text="Add an expense to see your spending mix."/>}
      </div>
    </section>
    <section className="panel commitments-panel"><div className="panel-header"><div><h3>Coming up next</h3><p>Money already spoken for — plan around it</p></div><button className="text-button" onClick={() => setPage("Subscriptions")}>Manage <span>↗</span></button></div>
      <div className="commitment-list">{committed.map(c=><div className="commitment-item" key={c.id}><div className="commitment-icon"><Home size={17}/></div><div className="commitment-copy"><strong>{c.title}</strong><span>Due {c.date}</span></div><strong className="commitment-amount">{money(c.amount)}</strong></div>)}{activeSubs.slice(0,2).map(s=><div className="commitment-item" key={`s${s.id}`}><div className="commitment-icon subscription-icon">{s.emoji}</div><div className="commitment-copy"><strong>{s.name}</strong><span>{s.detail}</span></div><strong className="commitment-amount">{money(s.amount)}</strong></div>)}</div>
    </section>
  </>;
}

function StatCard({icon:Icon,label,value,note,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18}/></div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-note">{note}</span></div>; }
function HealthFactor({label,value,color}) { return <div className="health-factor"><div><span>{label}</span><strong>{value}%</strong></div><div className="factor-track"><i className={color} style={{width:`${value}%`}}/></div></div>; }
function TransactionRow({transaction:t}) {
  const icon = t.kind === "income" ? <ArrowDownLeft size={17}/> : t.category === "Food" ? <Coffee size={17}/> : t.category === "Transport" ? <Activity size={17}/> : t.category === "Lifestyle" ? <ShoppingBag size={17}/> : t.category === "Subscriptions" ? <CreditCard size={17}/> : <Wallet size={17}/>;
  return <div className="transaction-row"><div className={`transaction-icon ${t.kind==="income"?"income-icon":""}`}>{icon}</div><div className="transaction-copy"><strong>{t.title}</strong><span>{t.category} · {t.date}</span></div><strong className={`transaction-amount ${t.kind==="income"?"income-text":""}`}>{t.kind==="income"?"+":"−"}{money(t.amount)}</strong></div>;
}
function EmptyState({text}) { return <div className="empty-state"><Wallet size={25}/><p>{text}</p></div>; }

function Transactions({transactions,setModal,setTransactions,showAll,setShowAll}) {
  const [filter,setFilter] = useState("All");
  const [search,setSearch] = useState("");
  const filtered = transactions.filter(t=>(filter==="All" || t.kind===filter.toLowerCase()) && t.title.toLowerCase().includes(search.toLowerCase()));
  return <><div className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> YOUR MONEY TRAIL</div><h1>Every move <span>counts.</span></h1><p className="subtitle">A clear view of what came in and what went out.</p></div><button className="primary-button" onClick={()=>setModal("transaction")}><Plus size={17}/> Add transaction</button></div>
    <div className="panel transactions-page-panel"><div className="toolbar"><div className="filter-tabs">{["All","Expense","Income"].map(f=><button key={f} className={filter===f?"selected":""} onClick={()=>setFilter(f)}>{f}</button>)}</div><input className="search-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions…"/></div>
      <div className="transaction-list">{filtered.map(t=><TransactionRow key={t.id} transaction={t}/>)}</div>{!filtered.length&&<EmptyState text="No transactions match this view."/>}
      <div className="transaction-page-footer"><span>{filtered.length} transactions shown</span><button className="text-button" onClick={()=>{setTransactions([...transactions].sort((a,b)=>b.id-a.id));setShowAll(!showAll)}}>Sort newest first ↕</button></div>
    </div>
  </>;
}

function Goals({goals,safeBalance,goalContribution,setGoalContribution,contribute,setModal}) {
  const totalTarget = goals.reduce((s,g)=>s+g.target,0), totalSaved=goals.reduce((s,g)=>s+g.saved,0);
  return <><div className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> FUTURE YOU SAYS THANKS</div><h1>Make room for <span>what matters.</span></h1><p className="subtitle">Little by little is still progress. Give your goals a place in your budget.</p></div><button className="primary-button" onClick={()=>setModal("goal")}><Plus size={17}/> New goal</button></div>
    <div className="goals-summary"><div><span>Total saved toward goals</span><strong>{money(totalSaved)}</strong><p>Out of {money(totalTarget)} across {goals.length} goals</p></div><div className="goals-summary-progress"><div className="progress-track"><div style={{width:`${percent(totalSaved,totalTarget)}%`}}/></div><span>{percent(totalSaved,totalTarget)}% overall progress</span></div></div>
    <div className="goal-grid">{goals.map(g=>{const pct=percent(g.saved,g.target);return <div className="goal-card" key={g.id}><div className="goal-top"><div className="goal-emoji">{g.emoji}</div><span className={`goal-status ${pct===100?"complete":""}`}>{pct===100?"Goal reached":"In progress"}</span></div><h3>{g.name}</h3><div className="goal-amounts"><strong>{money(g.saved)}</strong><span>of {money(g.target)}</span></div><div className="goal-progress"><div style={{width:`${pct}%`}}/></div><div className="goal-meta"><span>{pct}% saved</span><span>{money(Math.max(0,g.target-g.saved))} to go</span></div>{pct<100&&<div className="goal-contribute"><label className="sr-only" htmlFor={`contrib-${g.id}`}>Contribution amount</label><div className="contribute-input"><span>₹</span><input id={`contrib-${g.id}`} type="number" min="1" max={Math.max(0,safeBalance)} value={goalContribution[g.id]??"100"} onChange={e=>setGoalContribution({...goalContribution,[g.id]:e.target.value})}/></div><button onClick={()=>contribute(g.id)} disabled={safeBalance<=0}>Add savings <ArrowUpRight size={15}/></button></div>}</div>})}
      <button className="goal-add-card" onClick={()=>setModal("goal")}><span><Plus size={22}/></span><strong>Give a new dream a number.</strong><small>Create another savings goal</small></button>
    </div>
  </>;
}

function Subscriptions({subscriptions,setSubscriptions,setTransactions,notify,subscriptionTotal,committed,setCommitted}) {
  const active = subscriptions.filter(s=>s.active);
  const [newSub,setNewSub] = useState({name:"",amount:"",emoji:"📦",detail:"Renews next month"});
  const [showAdd,setShowAdd] = useState(false);
  function cancel(s) { setSubscriptions(prev=>prev.map(x=>x.id===s.id?{...x,active:false}:x)); notify(`${s.name} marked as cancelled. Future cost removed.`); }
  function add(e) { e.preventDefault(); if(!newSub.name.trim()||Number(newSub.amount)<=0){notify("Enter subscription name and amount.");return;}setSubscriptions(prev=>[...prev,{id:Date.now(),name:newSub.name,amount:Number(newSub.amount),emoji:newSub.emoji,detail:newSub.detail,active:true}]);setNewSub({name:"",amount:"",emoji:"📦",detail:"Renews next month"});setShowAdd(false);notify("Subscription added."); }
  return <><div className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> RECURRING MONEY</div><h1>Know what <span>renews.</span></h1><p className="subtitle">Subscriptions are small until they all show up together.</p></div><button className="primary-button" onClick={()=>setShowAdd(!showAdd)}><Plus size={17}/> Add subscription</button></div>
    <div className="subscription-summary"><div className="sub-summary-icon"><CreditCard size={22}/></div><div><span>Monthly subscription spend</span><strong>{money(subscriptionTotal)}</strong><p>{active.length} active subscriptions · {money(subscriptionTotal*12)} yearly run rate</p></div><div className="sub-summary-badge"><TrendingDown size={15}/> Keep it intentional</div></div>
    {showAdd&&<form className="inline-add-form" onSubmit={add}><label>Name<input value={newSub.name} onChange={e=>setNewSub({...newSub,name:e.target.value})} placeholder="e.g. Music app" required/></label><label>Monthly cost (₹)<input type="number" min="1" value={newSub.amount} onChange={e=>setNewSub({...newSub,amount:e.target.value})} placeholder="149" required/></label><label>Emoji<select value={newSub.emoji} onChange={e=>setNewSub({...newSub,emoji:e.target.value})}><option>📦</option><option>🎵</option><option>🎬</option><option>☁️</option><option>🎮</option><option>📚</option></select></label><button className="primary-button" type="submit">Save subscription</button></form>}
    <div className="panel subscriptions-panel"><div className="panel-header"><div><h3>Your subscriptions</h3><p>Cancel anything that isn't earning its place</p></div><span className="count-pill">{active.length} active</span></div>{subscriptions.map(s=><div className={`subscription-row ${!s.active?"subscription-inactive":""}`} key={s.id}><div className="subscription-emoji">{s.emoji}</div><div className="subscription-copy"><strong>{s.name}</strong><span>{s.active?s.detail:"Cancelled · no future charge"}</span></div><strong className="subscription-price">{money(s.amount)}<small>/month</small></strong>{s.active?<button className="cancel-button" onClick={()=>cancel(s)}>Cancel</button>:<span className="cancelled-tag"><Check size={13}/> Cancelled</span>}</div>)}</div>
    <div className="tip-banner"><div><Lightbulb size={20}/></div><p><strong>Quick money move</strong><span>Review subscriptions once a month. Redirecting even ₹199 a month adds ₹2,388 to your year.</span></p></div>
  </>;
}

function DecisionLab({sim,setSim,safeBalance,remaining,committedTotal,subscriptionTotal,daysLeft,dailyAllowance,risk,simEffect,simBalance,simAllowance,simRisk,confirmSimulation}) {
  const presets = [
    {title:"New sneakers",amount:2500,type:"purchase",icon:"👟",copy:"A little treat"},
    {title:"Unexpected repair",amount:1800,type:"purchase",icon:"🛠️",copy:"Life happens"},
    {title:"Extra freelance pay",amount:2000,type:"income",icon:"💸",copy:"A little boost"},
    {title:"Cancel a subscription",amount:199,type:"cancel",icon:"✂️",copy:"Cut a recurring cost"}
  ];
  function choose(p) { setSim({type:p.type,amount:p.amount,label:p.title}); }
  return <><div className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> THE WHAT-IF WORKSHOP</div><h1>Think it through. <span>Then do it.</span></h1><p className="subtitle">Test a decision before it touches your real budget.</p></div><span className="lab-badge"><Sparkles size={15}/> Interactive simulator</span></div>
    <div className="lab-intro"><div className="lab-intro-icon"><Zap size={22}/></div><div><strong>Your money sandbox</strong><p>Nothing changes until you choose <b>Apply this decision</b>. Explore the ripple effects without the risk.</p></div></div>
    <div className="decision-layout"><div className="panel simulator-panel"><div className="panel-header"><div><h3>What are you thinking about?</h3><p>Pick a scenario or make your own</p></div><span className="step-count">01 / 02</span></div>
      <div className="scenario-grid">{presets.map(p=><button key={p.title} className={`scenario-card ${sim.label===p.title?"scenario-selected":""}`} onClick={()=>choose(p)}><span className="scenario-emoji">{p.icon}</span><strong>{p.title}</strong><small>{p.copy}</small></button>)}</div>
      <div className="sim-divider"/>
      <label className="sim-label" htmlFor="sim-label">Decision name</label><input id="sim-label" className="sim-text-input" value={sim.label} onChange={e=>setSim({...sim,label:e.target.value})} placeholder="Name your decision"/>
      <div className="sim-type-row"><span>Decision type</span><div className="filter-tabs">{[{v:"purchase",t:"Spend"},{v:"income",t:"Earn"},{v:"cancel",t:"Cancel cost"}].map(x=><button key={x.v} className={sim.type===x.v?"selected":""} onClick={()=>setSim({...sim,type:x.v})}>{x.t}</button>)}</div></div>
      <div className="amount-heading"><label htmlFor="sim-amount">Amount</label><strong>{money(Number(sim.amount)||0)}</strong></div>
      <input id="sim-amount" className="amount-slider" type="range" min="100" max="5000" step="100" value={sim.amount} onChange={e=>setSim({...sim,amount:Number(e.target.value)})} aria-label="Simulation amount"/>
      <div className="slider-labels"><span>₹100</span><span>₹5,000</span></div>
      <div className="sim-action-note"><CircleHelp size={16}/><span>{sim.type==="income"?"Extra income increases your balance.":sim.type==="cancel"?"Cancelling a subscription reduces recurring commitments.":"Spending reduces the money available for the rest of the month."}</span></div>
    </div>
    <div className="panel impact-panel"><div className="panel-header"><div><h3>Your decision's ripple effect</h3><p>Live preview · not yet applied</p></div><span className="preview-dot"><i/> LIVE</span></div>
      <div className="impact-balance"><span>Projected safe-to-spend</span><div className="impact-number">{money(Math.max(0,simBalance))}</div><div className={`impact-change ${simEffect<0?"change-positive":simEffect>0?"change-negative":"change-neutral"}`}>{simEffect<0?"+":simEffect>0?"−":""}{money(Math.abs(simEffect))} {simEffect<0?"more room":simEffect>0?"less room":"change"}</div></div>
      <div className="impact-rows"><ImpactRow label="Current safe-to-spend" before={money(Math.max(0,safeBalance))} after={money(Math.max(0,simBalance))} good={simBalance>=safeBalance}/><ImpactRow label="Daily allowance" before={money(dailyAllowance)} after={money(simAllowance)} good={simAllowance>=dailyAllowance}/><ImpactRow label="Financial risk" before={risk} after={simRisk} good={simRisk==="Low" || (simRisk==="Watch"&&risk==="High")}/><ImpactRow label="Days to plan for" before={`${daysLeft} days`} after={`${daysLeft} days`} good={true}/></div>
      <div className={`impact-warning ${simBalance<0?"warning-danger":simBalance<1000?"warning-caution":"warning-good"}`}><div>{simBalance<1000?<ShieldAlert size={18}/>:<Lightbulb size={18}/>}</div><p><strong>{simBalance<0?"This move puts you over your available budget.":simBalance<1000?"This move leaves a very small cushion.":"You have some room to make this move."}</strong><span>{simBalance<1000?"Consider a smaller amount, delaying the purchase, or adjusting a non-essential commitment.":"Check upcoming bills and keep a little money aside for surprises."}</span></p></div>
      <button className="primary-button full-button apply-decision" onClick={confirmSimulation}><Check size={17}/> Apply this decision</button><p className="apply-caption">Applying adds a transaction or updates recurring costs.</p>
    </div></div>
    <div className="panel presets-footer"><div><div className="preset-icon"><Activity size={18}/></div><div><strong>Try a different angle</strong><p>See what small changes do over the full month.</p></div></div><div className="preset-actions"><button onClick={()=>setSim({type:"purchase",amount:500,label:"Weekend plans"})}>Weekend plans <span>↗</span></button><button onClick={()=>setSim({type:"purchase",amount:1200,label:"Unexpected expense"})}>Unexpected expense <span>↗</span></button><button onClick={()=>setSim({type:"income",amount:1000,label:"Side hustle income"})}>Side hustle <span>↗</span></button></div></div>
  </>;
}
function ImpactRow({label,before,after,good}) { return <div className="impact-row"><span>{label}</span><div><small>{before}</small><ArrowUpRight size={13}/><strong className={good?"impact-good":"impact-bad"}>{after}</strong></div></div>; }
function Modal({title,onClose,children}) { return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Close modal" onClick={onClose}><X size={19}/></button></div>{children}</div></div>; }

export default App;
