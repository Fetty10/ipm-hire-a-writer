"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const C = {
  page:   { maxWidth:"1100px", margin:"0 auto" },
  h1:     { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:    { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  addBox: { background:"#F0F9FF", border:"1.5px solid #BAE6FD", borderRadius:"16px", padding:"1.25rem", marginBottom:"1.5rem" },
  addT:   { fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1rem" },
  grid:   { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:".75rem", marginBottom:"1rem" },
  fg:     { display:"flex", flexDirection:"column" as const, gap:".3rem" },
  lbl:    { fontSize:".62rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6" },
  inp:    { padding:".5rem .75rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" as const },
  hint:   { fontSize:".65rem", color:"#5B7EA6", marginTop:".15rem" },
  btnA:   { padding:".55rem 1.5rem", borderRadius:"10px", background:"#0C1A2E", color:"#38BDF8", fontSize:".82rem", fontWeight:700, border:"none", cursor:"pointer" },
  card:   { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden" },
  table:  { width:"100%", borderCollapse:"collapse" as const, fontSize:".78rem" },
  thead:  { background:"#F8FBFF" },
  th:     { textAlign:"left" as const, padding:".65rem 1rem", fontSize:".6rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", borderBottom:"1px solid #E0F2FE", whiteSpace:"nowrap" as const },
  td:     { padding:".6rem .9rem", borderBottom:"1px solid #F0F9FF", verticalAlign:"middle" as const },
  tdInp:  { padding:".4rem .6rem", borderRadius:"7px", border:"1.5px solid #BAE6FD", fontSize:".8rem", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"90px" },
  badge:  { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700 },
  bGreen: { background:"#D1FAE5", color:"#065F46" },
  bGrey:  { background:"#F1F5F9", color:"#64748B" },
  acts:   { display:"flex", gap:".35rem", flexWrap:"wrap" as const },
  btnS:   { padding:".3rem .7rem", borderRadius:"7px", background:"#38BDF8", color:"#0C1A2E", fontSize:".7rem", fontWeight:700, border:"none", cursor:"pointer" },
  btnR:   { padding:".3rem .7rem", borderRadius:"7px", background:"#FEE2E2", color:"#991B1B", fontSize:".7rem", fontWeight:700, border:"none", cursor:"pointer" },
  btnT:   { padding:".3rem .7rem", borderRadius:"7px", background:"#F1F5F9", color:"#64748B", fontSize:".7rem", fontWeight:700, border:"none", cursor:"pointer" },
  empty:  { textAlign:"center" as const, padding:"3rem", color:"#5B7EA6", fontSize:".85rem" },
};

const BLANK = { label:"", value:"", description:"", priceOND:"", priceBSC:"", pricePGD:"", pricePHD:"", sortOrder:"0" };

export default function AdminOtherServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState<string|null>(null);
  const [adding,   setAdding]   = useState(false);
  const [newSvc,   setNewSvc]   = useState({...BLANK});
  const [edits,    setEdits]    = useState<Record<string,any>>({});

  async function load() {
    setLoading(true);
    // Fetch all (including inactive) for admin view
    const res  = await fetch("/api/admin/other-services?all=true");
    const data = await res.json();
    if (data.success) {
      setServices(data.data);
      const init:any = {};
      data.data.forEach((s:any) => {
        init[s.id] = {
          label:       s.label,
          description: s.description || "",
          priceOND:    s.priceOND/100,
          priceBSC:    s.priceBSC/100,
          pricePGD:    s.pricePGD/100,
          pricePHD:    (s.pricePHD||s.pricePGD)/100,
          sortOrder:   s.sortOrder,
          isActive:    s.isActive,
        };
      });
      setEdits(init);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function upd(id:string, field:string, val:any) {
    setEdits(prev => ({...prev,[id]:{...prev[id],[field]:val}}));
  }

  async function save(id:string) {
    const e = edits[id];
    if (!e) return;
    setSaving(id);
    const res  = await fetch("/api/admin/other-services", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        id,
        label:       e.label,
        description: e.description,
        priceOND:    parseFloat(e.priceOND)||0,
        priceBSC:    parseFloat(e.priceBSC)||0,
        pricePGD:    parseFloat(e.pricePGD)||0,
        pricePHD:    parseFloat(e.pricePHD)||0,
        sortOrder:   parseInt(e.sortOrder)||0,
        isActive:    e.isActive,
      }),
    });
    const data = await res.json();
    if (res.ok) { await load(); }
    else toast.error(data.error || "Something went wrong");
    setSaving(null);
  }

  async function del(id:string, label:string) {
    let confirmed = false; await new Promise<void>(resolve => { toast((t) => (<span style={{display:"flex",alignItems:"center",gap:"1rem",fontSize:".82rem"}}><span>Delete this service?</span><button style={{background:"#FEE2E2",color:"#991B1B",border:"none",padding:"4px 10px",borderRadius:"6px",cursor:"pointer",fontWeight:700}} onClick={()=>{confirmed=true;toast.dismiss(t.id);resolve();}}>Delete</button><button style={{background:"#F1F5F9",border:"none",padding:"4px 10px",borderRadius:"6px",cursor:"pointer"}} onClick={()=>{toast.dismiss(t.id);resolve();}}>Cancel</button></span>), {duration:10000}); }); if (!confirmed) return;
    setSaving("del"+id);
    const res  = await fetch("/api/admin/other-services", {
      method:"DELETE", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok) { await load(); }
    else toast.error(data.error || "Something went wrong");
    setSaving(null);
  }

  async function add() {
    if (!newSvc.label.trim()) { toast.error("Enter a service name."); return; }
    if (!newSvc.value.trim()) { toast.error("Enter a service identifier."); return; }
    setAdding(true);
    const res  = await fetch("/api/admin/other-services", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        label:       newSvc.label.trim(),
        value:       newSvc.value.trim(),
        description: newSvc.description.trim(),
        priceOND:    parseFloat(newSvc.priceOND)||0,
        priceBSC:    parseFloat(newSvc.priceBSC)||0,
        pricePGD:    parseFloat(newSvc.pricePGD)||0,
        pricePHD:    parseFloat(newSvc.pricePHD)||0,
        sortOrder:   parseInt(newSvc.sortOrder)||0,
      }),
    });
    const data = await res.json();
    if (res.ok) { setNewSvc({...BLANK}); await load(); }
    else toast.error(data.error || "Something went wrong");
    setAdding(false);
  }

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Other Services</h1>
        <p style={C.sub}>Manage services on the Hire a Writer form. Prices are in ₦. PhD is now a separate tier from PGD/MSc.</p>

        {/* Add new */}
        <div style={C.addBox}>
          <div style={C.addT}>➕ Add New Service</div>
          <div style={C.grid}>
            <div style={C.fg}>
              <label style={C.lbl}>Service Name</label>
              <input style={C.inp} placeholder="e.g. Seminar Paper" value={newSvc.label}
                onChange={e=>setNewSvc(p=>({...p,label:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Identifier</label>
              <input style={C.inp} placeholder="e.g. seminar" value={newSvc.value}
                onChange={e=>setNewSvc(p=>({...p,value:e.target.value}))} />
              <span style={C.hint}>Lowercase, no spaces</span>
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>HND/OND (₦)</label>
              <input style={C.inp} type="number" min="0" placeholder="e.g. 10000" value={newSvc.priceOND}
                onChange={e=>setNewSvc(p=>({...p,priceOND:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>BSc/BEd (₦)</label>
              <input style={C.inp} type="number" min="0" placeholder="e.g. 10000" value={newSvc.priceBSC}
                onChange={e=>setNewSvc(p=>({...p,priceBSC:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>PGD/MSc (₦)</label>
              <input style={C.inp} type="number" min="0" placeholder="e.g. 20000" value={newSvc.pricePGD}
                onChange={e=>setNewSvc(p=>({...p,pricePGD:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>PhD (₦)</label>
              <input style={C.inp} type="number" min="0" placeholder="e.g. 30000" value={newSvc.pricePHD}
                onChange={e=>setNewSvc(p=>({...p,pricePHD:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Sort Order</label>
              <input style={C.inp} type="number" min="0" placeholder="0" value={newSvc.sortOrder}
                onChange={e=>setNewSvc(p=>({...p,sortOrder:e.target.value}))} />
              <span style={C.hint}>Lower = first</span>
            </div>
          </div>
          <button style={C.btnA} disabled={adding} onClick={add}>
            {adding ? "Adding..." : "+ Add Service"}
          </button>
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : services.length===0 ? <div style={C.empty}>No services yet.</div>
        : (
          <div style={C.card}>
            <div style={{overflowX:"auto"}}>
              <table style={C.table}>
                <thead style={C.thead}>
                  <tr>
                    {["Service Name","ID","HND/OND","BSc/BEd","PGD/MSc","PhD","Order","Status","Actions"].map(h=>
                      <th key={h} style={C.th}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {services.map((s:any) => {
                    const e = edits[s.id]||{};
                    return (
                      <tr key={s.id} style={{opacity:(e.isActive??s.isActive)?1:.55}}>
                        <td style={{...C.td,minWidth:"150px"}}>
                          <input style={{...C.tdInp,width:"130px"}} value={e.label??s.label}
                            onChange={ev=>upd(s.id,"label",ev.target.value)} />
                        </td>
                        <td style={{...C.td,color:"#5B7EA6",fontSize:".7rem",fontFamily:"monospace"}}>{s.value}</td>
                        <td style={C.td}>
                          <input style={C.tdInp} type="number" min="0" value={e.priceOND??s.priceOND/100}
                            onChange={ev=>upd(s.id,"priceOND",ev.target.value)} />
                        </td>
                        <td style={C.td}>
                          <input style={C.tdInp} type="number" min="0" value={e.priceBSC??s.priceBSC/100}
                            onChange={ev=>upd(s.id,"priceBSC",ev.target.value)} />
                        </td>
                        <td style={C.td}>
                          <input style={C.tdInp} type="number" min="0" value={e.pricePGD??s.pricePGD/100}
                            onChange={ev=>upd(s.id,"pricePGD",ev.target.value)} />
                        </td>
                        <td style={C.td}>
                          <input style={C.tdInp} type="number" min="0" value={e.pricePHD??((s.pricePHD||s.pricePGD)/100)}
                            onChange={ev=>upd(s.id,"pricePHD",ev.target.value)} />
                        </td>
                        <td style={C.td}>
                          <input style={{...C.tdInp,width:"50px"}} type="number" min="0" value={e.sortOrder??s.sortOrder}
                            onChange={ev=>upd(s.id,"sortOrder",ev.target.value)} />
                        </td>
                        <td style={C.td}>
                          <span style={{...C.badge,...((e.isActive??s.isActive)?C.bGreen:C.bGrey)}}>
                            {(e.isActive??s.isActive)?"Active":"Hidden"}
                          </span>
                        </td>
                        <td style={C.td}>
                          <div style={C.acts}>
                            <button style={C.btnS} disabled={saving===s.id} onClick={()=>save(s.id)}>
                              {saving===s.id?"...":"💾 Save"}
                            </button>
                            <button style={C.btnT} onClick={()=>upd(s.id,"isActive",!(e.isActive??s.isActive))}>
                              {(e.isActive??s.isActive)?"⏸ Hide":"▶ Show"}
                            </button>
                            <button style={C.btnR} disabled={saving==="del"+s.id} onClick={()=>del(s.id,s.label)}>
                              {saving==="del"+s.id?"...":"🗑"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
