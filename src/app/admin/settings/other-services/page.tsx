"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import toast from "react-hot-toast";

const CURRENCIES = [
  { key:"GHS", label:"GHS (GH₵)", sym:"GH₵" },
  { key:"KES", label:"KES (KSh)",  sym:"KSh"  },
  { key:"USD", label:"USD ($)",    sym:"$"    },
  { key:"GBP", label:"GBP (£)",    sym:"£"    },
];
const DEGREES = [
  { key:"OND", label:"HND/OND" },
  { key:"BSC", label:"BSc/BEd" },
  { key:"PGD", label:"PGD/MSc" },
  { key:"PHD", label:"PhD"     },
];

// All 16 intl field names
const INTL_FIELDS = CURRENCIES.flatMap(c => DEGREES.map(d => `price${c.key}${d.key}`));

const BLANK: any = {
  label:"", value:"", description:"",
  priceOND:"", priceBSC:"", pricePGD:"", pricePHD:"",
  writerPayKobo:"",
  sortOrder:"0",
  ...Object.fromEntries(INTL_FIELDS.map(f => [f, ""])),
};

const C = {
  page:    { maxWidth:"1100px", margin:"0 auto" },
  h1:      { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:     { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  addBox:  { background:"#F0F9FF", border:"1.5px solid #BAE6FD", borderRadius:"16px", padding:"1.25rem", marginBottom:"1.5rem" },
  addT:    { fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1rem" },
  grid:    { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:".75rem", marginBottom:"1rem" },
  fg:      { display:"flex", flexDirection:"column" as const, gap:".3rem" },
  lbl:     { fontSize:".62rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6" },
  inp:     { padding:".5rem .75rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" as const },
  hint:    { fontSize:".65rem", color:"#5B7EA6", marginTop:".15rem" },
  secHdr:  { fontFamily:"'Syne',sans-serif", fontSize:".78rem", fontWeight:700, color:"#0369A1", marginBottom:".5rem", marginTop:"1rem", background:"#EFF6FF", padding:".35rem .75rem", borderRadius:"6px", display:"inline-block" },
  btnA:    { padding:".55rem 1.5rem", borderRadius:"10px", background:"#0C1A2E", color:"#38BDF8", fontSize:".82rem", fontWeight:700, border:"none", cursor:"pointer" },
  card:    { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", marginBottom:"1rem", overflow:"hidden" },
  cardHdr: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:".85rem 1.25rem", background:"#F8FBFF", borderBottom:"1px solid #E0F2FE", cursor:"pointer" },
  cardT:   { fontFamily:"'Syne',sans-serif", fontSize:".88rem", fontWeight:700, color:"#0C1A2E" },
  cardMeta:{ fontSize:".72rem", color:"#5B7EA6" },
  body:    { padding:"1.25rem" },
  degGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:".5rem", marginBottom:".75rem" },
  tdInp:   { padding:".4rem .6rem", borderRadius:"7px", border:"1.5px solid #BAE6FD", fontSize:".8rem", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" as const },
  badge:   { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700 },
  bGreen:  { background:"#D1FAE5", color:"#065F46" },
  bGrey:   { background:"#F1F5F9", color:"#64748B" },
  acts:    { display:"flex", gap:".5rem", flexWrap:"wrap" as const, marginTop:"1rem" },
  btnS:    { padding:".4rem 1rem", borderRadius:"8px", background:"#38BDF8", color:"#0C1A2E", fontSize:".78rem", fontWeight:700, border:"none", cursor:"pointer" },
  btnR:    { padding:".4rem 1rem", borderRadius:"8px", background:"#FEE2E2", color:"#991B1B", fontSize:".78rem", fontWeight:700, border:"none", cursor:"pointer" },
  btnT:    { padding:".4rem 1rem", borderRadius:"8px", background:"#F1F5F9", color:"#64748B", fontSize:".78rem", fontWeight:700, border:"none", cursor:"pointer" },
};

export default function AdminOtherServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState<string|null>(null);
  const [adding,   setAdding]   = useState(false);
  const [newSvc,   setNewSvc]   = useState({...BLANK});
  const [edits,    setEdits]    = useState<Record<string,any>>({});
  const [expanded, setExpanded] = useState<string|null>(null);

  async function load() {
    setLoading(true);
    const res  = await fetch("/api/admin/other-services?all=true");
    const data = await res.json();
    if (data.success) {
      setServices(data.data);
      const init: any = {};
      data.data.forEach((s: any) => {
        const e: any = {
          label:       s.label,
          description: s.description || "",
          priceOND:    s.priceOND/100,
          priceBSC:    s.priceBSC/100,
          pricePGD:    s.pricePGD/100,
          pricePHD:    s.pricePHD/100,
          sortOrder:   s.sortOrder,
          isActive:    s.isActive,
        };
        for (const f of INTL_FIELDS) e[f] = s[f] ? s[f]/100 : "";
        init[s.id] = e;
      });
      setEdits(init);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function upd(id: string, field: string, val: any) {
    setEdits(prev => ({...prev,[id]:{...prev[id],[field]:val}}));
  }

  async function save(id: string) {
    const e = edits[id];
    setSaving(id);
    const body: any = {
      id,
      label:         e.label,
      description:   e.description,
      priceOND:      parseFloat(e.priceOND)||0,
      priceBSC:      parseFloat(e.priceBSC)||0,
      pricePGD:      parseFloat(e.pricePGD)||0,
      pricePHD:      parseFloat(e.pricePHD)||0,
      writerPayKobo: parseFloat(e.writerPayKobo)||0,
      sortOrder:     parseInt(e.sortOrder)||0,
      isActive:      e.isActive,
    };
    for (const f of INTL_FIELDS) body[f] = parseFloat(e[f])||0;

    const res  = await fetch("/api/admin/other-services", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Saved!"); await load(); }
    else toast.error(data.error || "Failed");
    setSaving(null);
  }

  async function del(id: string, label: string) {
    toast((t) => (
      <span style={{display:"flex",alignItems:"center",gap:"1rem",fontSize:".82rem"}}>
        <span>Delete <strong>{label}</strong>?</span>
        <button style={{background:"#FEE2E2",color:"#991B1B",border:"none",padding:"4px 10px",borderRadius:"6px",cursor:"pointer",fontWeight:700}}
          onClick={async()=>{
            toast.dismiss(t.id);
            const res = await fetch("/api/admin/other-services",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
            if(res.ok){toast.success("Deleted.");load();}else toast.error("Failed");
          }}>Delete</button>
        <button style={{background:"#F1F5F9",border:"none",padding:"4px 10px",borderRadius:"6px",cursor:"pointer"}} onClick={()=>toast.dismiss(t.id)}>Cancel</button>
      </span>
    ), {duration:10000});
  }

  async function add() {
    if (!newSvc.label.trim() || !newSvc.value.trim()) { toast.error("Name and identifier required."); return; }
    setAdding(true);
    const body: any = {
      label:         newSvc.label.trim(),
      value:         newSvc.value.trim(),
      description:   newSvc.description.trim(),
      priceOND:      parseFloat(newSvc.priceOND)||0,
      priceBSC:      parseFloat(newSvc.priceBSC)||0,
      pricePGD:      parseFloat(newSvc.pricePGD)||0,
      pricePHD:      parseFloat(newSvc.pricePHD)||0,
      writerPayKobo: parseFloat(newSvc.writerPayKobo)||0,
      sortOrder:     parseInt(newSvc.sortOrder)||0,
    };
    for (const f of INTL_FIELDS) body[f] = parseFloat(newSvc[f])||0;

    const res  = await fetch("/api/admin/other-services", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Service added!"); setNewSvc({...BLANK}); await load(); }
    else toast.error(data.error || "Failed");
    setAdding(false);
  }

  const PriceGroup = ({label, fields, vals, onChange, isNew}: any) => (
    <div style={{marginBottom:"1rem"}}>
      <div style={C.secHdr}>{label}</div>
      <div style={C.degGrid}>
        {DEGREES.map(d => {
          const f = `${fields}${d.key}`;
          return (
            <div key={f} style={C.fg}>
              <label style={C.lbl}>{d.label}</label>
              <input style={C.tdInp} type="number" min="0" placeholder="0"
                value={isNew ? vals[f] : (vals[f] !== undefined ? vals[f] : "")}
                onChange={e => onChange(f, e.target.value)} />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Other Services</h1>
        <p style={C.sub}>Manage flat-rate services. Set NGN prices by degree level, and separate international prices per currency and degree.</p>

        {/* Add new */}
        <div style={C.addBox}>
          <div style={C.addT}>➕ Add New Service</div>
          <div style={C.grid}>
            <div style={C.fg}>
              <label style={C.lbl}>Service Name</label>
              <input style={C.inp} placeholder="e.g. Seminar Paper" value={newSvc.label}
                onChange={e=>setNewSvc((p:any)=>({...p,label:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Identifier</label>
              <input style={C.inp} placeholder="e.g. seminar" value={newSvc.value}
                onChange={e=>setNewSvc((p:any)=>({...p,value:e.target.value}))} />
              <span style={C.hint}>Lowercase, no spaces</span>
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Sort Order</label>
              <input style={C.inp} type="number" min="0" value={newSvc.sortOrder}
                onChange={e=>setNewSvc((p:any)=>({...p,sortOrder:e.target.value}))} />
            </div>
          </div>

          {/* NGN prices */}
          <div style={C.secHdr}>🇳🇬 NGN Prices (₦)</div>
          <div style={C.degGrid}>
            {[{key:"priceOND",label:"HND/OND"},{key:"priceBSC",label:"BSc/BEd"},{key:"pricePGD",label:"PGD/MSc"},{key:"pricePHD",label:"PhD"}].map(f=>(
              <div key={f.key} style={C.fg}>
                <label style={C.lbl}>{f.label}</label>
                <input style={C.tdInp} type="number" min="0" placeholder="0"
                  value={newSvc[f.key]} onChange={e=>setNewSvc((p:any)=>({...p,[f.key]:e.target.value}))} />
              </div>
            ))}
          </div>

          {/* Staff Pay Rate */}
          <div style={C.secHdr}>💰 Staff Pay Rate (₦)</div>
          <div style={{marginBottom:"1rem",maxWidth:"160px"}}>
            <div style={C.fg}>
              <label style={C.lbl}>Writer Pay (₦)</label>
              <input style={C.tdInp} type="number" min="0" placeholder="e.g. 2000"
                value={newSvc.writerPayKobo} onChange={e=>setNewSvc((p:any)=>({...p,writerPayKobo:e.target.value}))} />
            </div>
          </div>

          {/* International prices */}
          {CURRENCIES.map(c => (
            <PriceGroup key={c.key} label={`${c.label} Prices`} fields={`price${c.key}`}
              vals={newSvc} isNew={true}
              onChange={(f:string,v:string)=>setNewSvc((p:any)=>({...p,[f]:v}))} />
          ))}

          <button style={C.btnA} disabled={adding} onClick={add}>
            {adding ? "Adding..." : "+ Add Service"}
          </button>
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : services.length===0 ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>No services yet.</div>
        : services.map((s:any) => {
          const e = edits[s.id]||{};
          const isOpen = expanded===s.id;
          return (
            <div key={s.id} style={{...C.card,opacity:(e.isActive??s.isActive)?1:.6}}>
              <div style={C.cardHdr} onClick={()=>setExpanded(isOpen?null:s.id)}>
                <div>
                  <div style={C.cardT}>{s.label}</div>
                  <div style={C.cardMeta}>
                    {s.value} · ₦{(s.priceOND/100).toLocaleString()} / {(s.priceBSC/100).toLocaleString()} / {(s.pricePGD/100).toLocaleString()} / {(s.pricePHD/100).toLocaleString()}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:".75rem"}}>
                  <span style={{...C.badge,...((e.isActive??s.isActive)?C.bGreen:C.bGrey)}}>
                    {(e.isActive??s.isActive)?"Active":"Hidden"}
                  </span>
                  <span style={{color:"#5B7EA6",fontSize:"1.2rem"}}>{isOpen?"▲":"▼"}</span>
                </div>
              </div>

              {isOpen && (
                <div style={C.body}>
                  {/* Name */}
                  <div style={{...C.grid,marginBottom:"1rem"}}>
                    <div style={C.fg}>
                      <label style={C.lbl}>Service Name</label>
                      <input style={C.inp} value={e.label??s.label}
                        onChange={ev=>upd(s.id,"label",ev.target.value)} />
                    </div>
                    <div style={C.fg}>
                      <label style={C.lbl}>Sort Order</label>
                      <input style={C.inp} type="number" value={e.sortOrder??s.sortOrder}
                        onChange={ev=>upd(s.id,"sortOrder",ev.target.value)} />
                    </div>
                  </div>

                  {/* NGN prices */}
                  <div style={C.secHdr}>🇳🇬 NGN Prices (₦)</div>
                  <div style={C.degGrid}>
                    {[{key:"priceOND",label:"HND/OND"},{key:"priceBSC",label:"BSc/BEd"},{key:"pricePGD",label:"PGD/MSc"},{key:"pricePHD",label:"PhD"}].map(f=>(
                      <div key={f.key} style={C.fg}>
                        <label style={C.lbl}>{f.label}</label>
                        <input style={C.tdInp} type="number" min="0"
                          value={e[f.key]??s[f.key]/100}
                          onChange={ev=>upd(s.id,f.key,ev.target.value)} />
                      </div>
                    ))}
                  </div>

                  {/* Staff Pay Rates */}
                  <div style={C.secHdr}>💰 Staff Pay Rates (₦)</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".75rem",marginBottom:"1rem"}}>
                    <div style={C.fg}>
                      <label style={C.lbl}>Writer Pay (₦)</label>
                      <input style={C.tdInp} type="number" min="0" placeholder="e.g. 2000"
                        value={e.writerPayKobo??( s.writerPayKobo ? s.writerPayKobo/100 : "")}
                        onChange={ev=>upd(s.id,"writerPayKobo",ev.target.value)} />
                    </div>

                  </div>

                  {/* International prices */}
                  {CURRENCIES.map(c => (
                    <PriceGroup key={c.key} label={`${c.label} Prices`} fields={`price${c.key}`}
                      vals={e} isNew={false}
                      onChange={(f:string,v:string)=>upd(s.id,f,v)} />
                  ))}

                  <div style={C.acts}>
                    <button style={C.btnS} disabled={saving===s.id} onClick={()=>save(s.id)}>
                      {saving===s.id?"Saving...":"💾 Save Changes"}
                    </button>
                    <button style={C.btnT} onClick={()=>upd(s.id,"isActive",!(e.isActive??s.isActive))}>
                      {(e.isActive??s.isActive)?"⏸ Hide":"▶ Show"}
                    </button>
                    <button style={C.btnR} onClick={()=>del(s.id,s.label)}>🗑 Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
