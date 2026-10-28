'use client';

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { LayoutDashboard, Users, BriefcaseBusiness, CheckSquare, LogOut, Plus, Search, CircleDollarSign, X, CreditCard, ShieldCheck } from "lucide-react";

type Customer = { id: string; name: string; email: string | null; company: string | null; status: string; created_at: string };
type Deal = { id: string; title: string; amount: number; stage: string; customer_id: string | null; created_at: string };
type Task = { id: string; title: string; due_date: string | null; completed: boolean; created_at: string };
const supabase = supabaseBrowser();

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [section, setSection] = useState<"Dashboard" | "Macaamiisha" | "Iibka" | "Hawlwaha" | "Qorshayaasha" | "Maamulka">("Dashboard");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<"customer" | "deal" | "task" | "">("");
  const [cName, setCName] = useState(""); const [cEmail, setCEmail] = useState(""); const [cCompany, setCCompany] = useState("");
  const [dTitle, setDTitle] = useState(""); const [dAmount, setDAmount] = useState("500"); const [dStage, setDStage] = useState("Cusub");
  const [tTitle, setTTitle] = useState(""); const [tDue, setTDue] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) { setIsAdmin(false); setAdminData(null); setProfile(null); return; }
    void loadData();
    fetch("/api/admin/overview").then(async r => {
      if (!r.ok) { setIsAdmin(false); setAdminData(null); return; }
      const data = await r.json(); setIsAdmin(true); setAdminData(data);
    }).catch(() => { setIsAdmin(false); setAdminData(null); });
  }, [session?.user?.id]);

  async function loadData() {
    setDataLoading(true);
    const [c, d, t, p] = await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("deals").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle()
    ]);
    if (c.error || d.error || t.error || p.error) setNotice("Xogta lama soo qaadi karin. Hubi inaad socodsiisay supabase/schema.sql.");
    setCustomers((c.data ?? []) as Customer[]); setDeals((d.data ?? []) as Deal[]); setTasks((t.data ?? []) as Task[]); setProfile(p.data);
    setDataLoading(false);
  }

  async function authSubmit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setNotice("");
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
        setNotice("Akoonka waa la sameeyay. Haddii email xaqiijin loo baahan yahay, eeg email-kaaga.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) { setNotice(e instanceof Error ? e.message : "Khalad ayaa dhacay."); }
    finally { setBusy(false); }
  }

  async function signOut() { await supabase.auth.signOut(); setSession(null); }

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("customers").insert({ user_id: session.user.id, name: cName, email: cEmail || null, company: cCompany || null });
    setBusy(false); if (error) { setNotice(error.message); return; }
    setForm(""); setCName(""); setCEmail(""); setCCompany(""); setNotice("Macmiilka waa la kaydiyey."); await loadData();
  }
  async function addDeal(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("deals").insert({ user_id: session.user.id, title: dTitle, amount: Number(dAmount), stage: dStage });
    setBusy(false); if (error) { setNotice(error.message); return; }
    setForm(""); setDTitle(""); setDAmount("500"); setNotice("Heshiiska waa la kaydiyey."); await loadData();
  }
  async function addTask(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("tasks").insert({ user_id: session.user.id, title: tTitle, due_date: tDue || null });
    setBusy(false); if (error) { setNotice(error.message); return; }
    setForm(""); setTTitle(""); setTDue(""); setNotice("Hawsha waa la kaydiyey."); await loadData();
  }
  async function toggleTask(task: Task) {
    const { error } = await supabase.from("tasks").update({ completed: !task.completed }).eq("id", task.id);
    if (error) setNotice(error.message); else await loadData();
  }
  async function deleteCustomer(id: string) {
    if (!confirm("Ma hubtaa inaad tirtirayso macmiilkan?")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) setNotice(error.message); else await loadData();
  }
  async function refreshAdmin() {
    const res = await fetch("/api/admin/overview");
    if (res.ok) setAdminData(await res.json());
  }
  async function suspendCustomer(userId: string, suspended: boolean) {
    const res = await fetch("/api/admin/customers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: userId, suspended }) });
    const data = await res.json();
    if (!res.ok) { setNotice(data.error || "Isbeddelka lama kaydin."); return; }
    setNotice(suspended ? "Akoonka waa la xannibay." : "Xannibaadda akoonka waa laga qaaday.");
    await refreshAdmin();
  }

  async function checkout(plan: "starter" | "pro") {
    setBusy(true); setNotice("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment lama bilaabi karin.");
      window.location.href = data.url;
    } catch (e) { setNotice(e instanceof Error ? e.message : "Payment error."); }
    finally { setBusy(false); }
  }

  const revenue = deals.filter(d => d.stage === "Guulaystay").reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const filteredCustomers = useMemo(() => customers.filter(c => [c.name, c.email, c.company].join(" ").toLowerCase().includes(search.toLowerCase())), [customers, search]);
  const money = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  if (loading || (session && dataLoading)) return <main className="center"><div className="loader"/><p>Waa la soo rarayaa…</p></main>;

  if (!session) return <main className="auth-shell">
    <div className="auth-brand"><div className="brand-mark">X</div><div><h1>Xirfad<span>CRM</span></h1><p>Maaree macaamiishaada. Kordhi ganacsigaaga.</p></div></div>
    <form className="auth-card" onSubmit={authSubmit}>
      <div className="eyebrow">KU SOO DHAWOW XIRFADCRM</div>
      <h2>{authMode === "signin" ? "Gal akoonkaaga" : "Samee akoon cusub"}</h2>
      <p className="muted">Hal meel ku maamul macaamiisha, iibka iyo hawlahaaga.</p>
      {authMode === "signup" && <label>Magacaaga<input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Magaca oo buuxa"/></label>}
      <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="adiga@shirkad.com"/></label>
      <label>Furaha sirta ah<input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Ugu yaraan 8 xaraf"/></label>
      <button className="primary full" disabled={busy}>{busy ? "Sug…" : authMode === "signin" ? "Gal akoonka" : "Isdiiwaangeli"}</button>
      {notice && <div className="notice">{notice}</div>}
      <p className="switch">{authMode === "signin" ? "Akoon ma lihid?" : "Hore ma u lahayd akoon?"} <button type="button" className="link" onClick={() => {setAuthMode(authMode === "signin" ? "signup" : "signin");setNotice("");}}>{authMode === "signin" ? "Samee akoon" : "Gal"}</button></p>
    </form>
    <p className="auth-foot">Xogtaadu waxay ku kaydsan tahay database kuu gaar ah.</p>
  </main>;

  if (session && !isAdmin && !(profile?.subscription_status === "active" && ["starter", "pro"].includes(profile?.plan) && !profile?.access_suspended)) {
    return <main className="auth-shell"><div className="auth-brand"><div className="brand-mark">X</div><div><h1>Xirfad<span>CRM</span></h1><p>Gelitaanka CRM-ku wuxuu u baahan yahay subscription firfircoon.</p></div></div><section className="auth-card"><div className="eyebrow">XIRFADCRM / QORSHEYAASHA</div><h2>Dooro qorshahaaga</h2><p className="muted">Akoonkaaga waa la sameeyay, laakiin CRM-ka lama furi karo ilaa lacag-bixintaada la xaqiijiyo.</p><div className="plan-mini"><b>Starter — $15 / bil</b><p>Macaamiil, heshiisyo iyo hawlo.</p><button className="primary full" disabled={busy} onClick={() => checkout("starter")}>Ku biir Starter</button></div><div className="plan-mini"><b>Pro — $39 / bil</b><p>Qorshaha ganacsiyada koraya.</p><button className="primary full" disabled={busy} onClick={() => checkout("pro")}>Ku biir Pro</button></div>{notice && <div className="notice">{notice}</div>}<button className="secondary full" onClick={signOut}>Ka bax akoonka</button></section><p className="auth-foot">Haddii aad lacag bixisay balse aan laguu oggolaan, la xiriir maamulka XirfadCRM.</p></main>;
  }

  const nav = [
    { label: "Dashboard", icon: LayoutDashboard }, { label: "Macaamiisha", icon: Users },
    { label: "Iibka", icon: BriefcaseBusiness }, { label: "Hawlwaha", icon: CheckSquare },
    ...(isAdmin ? [{ label: "Maamulka", icon: ShieldCheck }] : [])
  ] as const;

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">X</div><div><b>Xirfad<span>CRM</span></b><small>Maaree. Kobci. Guulayso.</small></div></div>
      <nav>{nav.map(n => <button key={n.label} className={section === n.label ? "nav-item active" : "nav-item"} onClick={() => setSection(n.label)}><n.icon size={18}/>{n.label}</button>)}</nav>
      <div className="side-bottom"><div className="upgrade"><b>Kor u qaad ganacsigaaga</b><p>Dooro qorshe ku habboon baahidaada.</p><button onClick={() => setSection("Qorshayaasha" as any)}>Eeg qorshayaasha</button></div><div className="user-row"><div className="avatar">{(session.user.email || "X").slice(0,1).toUpperCase()}</div><div className="user-info"><b>{profile?.full_name || session.user.email}</b><small>{profile?.plan || "free"} plan</small></div><button title="Ka bax" className="icon-button" onClick={signOut}><LogOut size={17}/></button></div></div>
    </aside>
    <section className="workspace">
      <header className="topbar"><div className="searchbox"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Raadi macaamiil, heshiis, ama hawl..."/></div><div className="top-actions"><span className="status-dot"/> <span>{session.user.email}</span></div></header>
      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow">XIRFADCRM / {section.toUpperCase()}</div><h1>{section === "Dashboard" ? "Ku soo dhawoow ganacsigaaga 👋" : section}</h1><p className="muted">Halkan ka maamul xogta ganacsigaaga si fudud.</p></div><div className="heading-actions"><button className="secondary" onClick={() => setSection("Qorshayaasha")}><CreditCard size={16}/> Qorshayaasha</button>{section !== "Maamulka" && section !== "Qorshayaasha" && <button className="primary" onClick={() => setForm(section === "Macaamiisha" ? "customer" : section === "Iibka" ? "deal" : "task")}><Plus size={17}/> Ku dar cusub</button>}</div></div>
        {notice && <div className="notice notice-inline">{notice}<button onClick={() => setNotice("")}><X size={15}/></button></div>}
        {section === "Maamulka" && isAdmin ? <AdminPanel data={adminData} onToggle={suspendCustomer} onRefresh={refreshAdmin}/> : section === "Qorshayaasha" ? <div className="plans-grid">
          <article className="plan-card featured"><div className="eyebrow">BILAABID</div><h2>$15 <small>/ bil</small></h2><p>Ganacsiyada yaryar.</p><ul><li>Macaamiil badan</li><li>Maareynta heshiisyada</li><li>Hawlaha iyo warbixinnada</li></ul><button className="primary full" disabled={busy} onClick={() => checkout("starter")}>{busy ? "Sug…" : "Ku biir Starter"}</button></article>
          <article className="plan-card"><div className="eyebrow">PRO</div><h2>$39 <small>/ bil</small></h2><p>Kooxaha koraya.</p><ul><li>Dhammaan sifooyinka</li><li>Warbixinno horumarsan</li><li>Taageero mudnaan leh</li></ul><button className="primary full" disabled={busy} onClick={() => checkout("pro")}>{busy ? "Sug…" : "Ku biir Pro"}</button></article>
        </div> : section === "Dashboard" ? <>
          <div className="metric-grid">
            <Metric title="Macaamiisha" value={String(customers.length)} icon={<Users/>} tone="blue" foot="Macaamiisha ku jira CRM-ka"/>
            <Metric title="Heshiisyada" value={String(deals.length)} icon={<BriefcaseBusiness/>} tone="purple" foot="Dhammaan fursadaha iibka"/>
            <Metric title="Iibka guulaystay" value={money(revenue)} icon={<CircleDollarSign/>} tone="green" foot="Heshiisyada guulaystay"/>
            <Metric title="Hawlo furan" value={String(tasks.filter(t => !t.completed).length)} icon={<CheckSquare/>} tone="orange" foot="Hawlo aan la dhammayn"/>
          </div>
          <div className="dashboard-grid"><section className="panel wide"><div className="panel-head"><div><h3>Heshiisyadii ugu dambeeyay</h3><p>La soco fursadaha iibka</p></div><button className="link" onClick={() => setSection("Iibka")}>Dhammaan</button></div><DealsTable deals={deals.slice(0,5)} money={money}/></section>
          <section className="panel"><div className="panel-head"><div><h3>Hawlaha kuu yaal</h3><p>Waxa mudnaanta leh</p></div><button className="link" onClick={() => setSection("Hawlwaha")}>Dhammaan</button></div>{tasks.filter(t=>!t.completed).slice(0,5).map(t=><div className="task-row" key={t.id}><button className="check" onClick={()=>toggleTask(t)} aria-label="Dhammaystir hawsha"/><div><b>{t.title}</b><small>{t.due_date || "Taariikh lama cayimin"}</small></div></div>)}{tasks.filter(t=>!t.completed).length===0 && <Empty text="Hawl furan ma jirto."/>}</section>
          <section className="panel wide"><div className="panel-head"><div><h3>Macaamiisha ugu dambeeyay</h3><p>Xiriirrada aad dhowaan kaydisay</p></div><button className="link" onClick={() => setSection("Macaamiisha")}>Dhammaan</button></div><CustomersTable customers={customers.slice(0,5)} onDelete={deleteCustomer}/></section>
          <section className="panel"><div className="panel-head"><div><h3>Bilow degdeg ah</h3><p>Tallaabada xigta ee CRM-ka</p></div></div><div className="quick-actions"><button onClick={()=>setForm("customer")}><Users size={17}/> Ku dar macmiil</button><button onClick={()=>setForm("deal")}><BriefcaseBusiness size={17}/> Diiwaangeli heshiis</button><button onClick={()=>setForm("task")}><CheckSquare size={17}/> Samee hawl</button></div></section></div>
        </> : section === "Macaamiisha" ? <section className="panel"><div className="panel-head"><div><h3>Dhammaan macaamiisha</h3><p>{filteredCustomers.length} macmiil</p></div><button className="primary" onClick={()=>setForm("customer")}><Plus size={16}/> Ku dar macmiil</button></div><CustomersTable customers={filteredCustomers} onDelete={deleteCustomer}/></section>
        : section === "Iibka" ? <section className="panel"><div className="panel-head"><div><h3>Heshiisyada iibka</h3><p>Wadarta heshiisyada: {money(deals.reduce((s,d)=>s+Number(d.amount),0))}</p></div><button className="primary" onClick={()=>setForm("deal")}><Plus size={16}/> Ku dar heshiis</button></div><DealsTable deals={deals} money={money}/></section>
        : <section className="panel"><div className="panel-head"><div><h3>Hawlaha</h3><p>Dhammaystir hawlaha oo la soco waqtiyada.</p></div><button className="primary" onClick={()=>setForm("task")}><Plus size={16}/> Ku dar hawl</button></div>{tasks.length===0?<Empty text="Weli hawl ma jirto."/>:tasks.map(t=><div className="task-row large-task" key={t.id}><button className={t.completed?"check checked":"check"} onClick={()=>toggleTask(t)}>{t.completed?"✓":""}</button><div className="task-copy"><b className={t.completed?"done":""}>{t.title}</b><small>{t.due_date || "Taariikh lama cayimin"}</small></div><span className={t.completed?"pill green":"pill amber"}>{t.completed?"Dhammaystiran":"Furan"}</span></div>)}</section>}
      </div>
    </section>
    {form && <div className="modal-backdrop" onClick={() => setForm("")}><form className="modal" onClick={e=>e.stopPropagation()} onSubmit={form==="customer"?addCustomer:form==="deal"?addDeal:addTask}>
      <div className="modal-head"><h2>{form==="customer"?"Ku dar macmiil":form==="deal"?"Ku dar heshiis":"Samee hawl cusub"}</h2><button type="button" className="icon-button" onClick={()=>setForm("")}><X size={18}/></button></div>
      {form==="customer" ? <><label>Magaca macmiilka<input required value={cName} onChange={e=>setCName(e.target.value)} placeholder="Magaca oo buuxa"/></label><label>Email<input type="email" value={cEmail} onChange={e=>setCEmail(e.target.value)} placeholder="macmiil@shirkad.com"/></label><label>Shirkadda<input value={cCompany} onChange={e=>setCCompany(e.target.value)} placeholder="Magaca shirkadda"/></label></>
      : form==="deal" ? <><label>Magaca heshiiska<input required value={dTitle} onChange={e=>setDTitle(e.target.value)} placeholder="Tusaale: Website shirkadeed"/></label><label>Qiimaha (USD)<input type="number" min="0" required value={dAmount} onChange={e=>setDAmount(e.target.value)}/></label><label>Marxaladda<select value={dStage} onChange={e=>setDStage(e.target.value)}><option>Cusub</option><option>La xiriiray</option><option>Soo-jeedin</option><option>Guulaystay</option><option>Luntay</option></select></label></>
      : <><label>Hawsha<input required value={tTitle} onChange={e=>setTTitle(e.target.value)} placeholder="Tusaale: Wac macmiilka"/></label><label>Taariikhda kama dambaysta ah<input type="date" value={tDue} onChange={e=>setTDue(e.target.value)}/></label></>}
      <button className="primary full" disabled={busy}>{busy?"Waa la kaydinayaa…":"Kaydi"}</button>
    </form></div>}
  </main>;
}

function AdminPanel({data,onToggle,onRefresh}:{data:any;onToggle:(id:string,suspended:boolean)=>void;onRefresh:()=>void}) {
  if (!data) return <section className="panel"><p>Maamulka waa la soo rarayaa…</p></section>;
  const totals = data.totals || {};
  const money = (v:number) => new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:2 }).format(v || 0);
  return <div className="admin-area">
    <div className="admin-banner"><div><div className="eyebrow">MILKIILAHA / SUPER ADMIN</div><h2>Maamulka guud ee XirfadCRM</h2><p>Qaybtan waxaa geli kara oo keliya email-ka milkiilaha ee lagu dejiyey server-ka.</p></div><button className="secondary" onClick={onRefresh}>Cusboonaysii</button></div>
    <div className="metric-grid">
      <Metric title="Akoonnada guud" value={String(totals.registered || 0)} icon={<Users/>} tone="blue" foot="Dhammaan profiles-ka"/>
      <Metric title="Macaamiil lacag-bixiyey" value={String(totals.activePaid || 0)} icon={<CreditCard/>} tone="green" foot="Subscription firfircoon"/>
      <Metric title="Starter" value={String(totals.starter || 0)} icon={<CircleDollarSign/>} tone="purple" foot="Qorshaha $15/bil"/>
      <Metric title="Pro" value={String(totals.pro || 0)} icon={<ShieldCheck/>} tone="orange" foot="Qorshaha $39/bil"/>
    </div>
    <section className="panel"><div className="panel-head"><div><h3>Maamulka macaamiisha</h3><p>Illaa 500 akoon ee ugu dambeeyay</p></div><span className="pill blue">{totals.suspended || 0} xanniban</span></div>
    <div className="table-wrap"><table><thead><tr><th>Magac</th><th>Email</th><th>Qorshe</th><th>Xaalad</th><th>La diiwaangeliyey</th><th>Ficil</th></tr></thead><tbody>{(data.customers || []).map((c:any)=><tr key={c.id}><td><b>{c.full_name || "Magac lama hayo"}</b></td><td>{c.email || "—"}</td><td>{c.plan || "free"}</td><td><span className={c.access_suspended?"pill red":c.subscription_status === "active"?"pill green":"pill amber"}>{c.access_suspended?"Xanniban":c.subscription_status === "active"?"Firfircoon":"Aan lacag-bixin"}</span></td><td>{new Date(c.created_at).toLocaleDateString("so-SO")}</td><td>{c.access_suspended?<button className="secondary" onClick={()=>onToggle(c.id,false)}>Fur akoonka</button>:<button className="delete" onClick={()=>onToggle(c.id,true)}>Xannib</button>}</td></tr>)}</tbody></table></div>
    </section>
    <section className="panel admin-revenue"><div><h3>Lacagta la ururiyey bishan</h3><p>Waxaa laga soo xisaabiyey invoices-ka Stripe ee la bixiyey bishan.</p><strong>{money(totals.collectedThisMonth)}</strong>{data.invoiceNote && <small>{data.invoiceNote}</small>}</div></section>
  </div>;
}

function Metric({title,value,icon,tone,foot}:{title:string;value:string;icon:React.ReactNode;tone:string;foot:string}) {
  return <article className={`metric ${tone}`}><div className="metric-top"><span>{title}</span><span className="metric-icon">{icon}</span></div><strong>{value}</strong><small>{foot}</small></article>;
}
function Empty({text}:{text:string}) { return <div className="empty">{text}</div>; }
function CustomersTable({customers,onDelete}:{customers:Customer[];onDelete:(id:string)=>void}) {
  if (!customers.length) return <Empty text="Weli macmiil lama diiwaangelin. Ku dar macmiilkaaga koowaad." />;
  return <div className="table-wrap"><table><thead><tr><th>Magaca</th><th>Email</th><th>Shirkad</th><th>Xaalad</th><th></th></tr></thead><tbody>{customers.map(c=><tr key={c.id}><td><b>{c.name}</b></td><td>{c.email||"—"}</td><td>{c.company||"—"}</td><td><span className="pill green">{c.status}</span></td><td><button className="delete" onClick={()=>onDelete(c.id)}>Tirtir</button></td></tr>)}</tbody></table></div>;
}
function DealsTable({deals,money}:{deals:Deal[];money:(v:number)=>string}) {
  if (!deals.length) return <Empty text="Heshiisyo ma jiraan. Ku dar fursadda iibka koowaad." />;
  return <div className="table-wrap"><table><thead><tr><th>Heshiis</th><th>Qiime</th><th>Marxalad</th><th>Taariikh</th></tr></thead><tbody>{deals.map(d=><tr key={d.id}><td><b>{d.title}</b></td><td>{money(Number(d.amount))}</td><td><span className={d.stage==="Guulaystay"?"pill green":d.stage==="Luntay"?"pill red":"pill blue"}>{d.stage}</span></td><td>{new Date(d.created_at).toLocaleDateString("so-SO")}</td></tr>)}</tbody></table></div>;
}
