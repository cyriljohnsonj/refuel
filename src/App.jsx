import { useState, useMemo, useEffect, useRef } from "react";
import {
  Gauge, Fuel, ReceiptText, Sparkles, CarFront, Bike, Truck, Zap,
  Plus, Pencil, Trash2, Check, ChevronLeft, Warehouse, FlaskConical,
  Download, Upload,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Refuel — minimal fuel expense & mileage tracker                    */
/*  v4: uniform layout system.                                        */
/*    · every card: 16px padding, 14px radius                          */
/*    · vertical rhythm: 12px between all stacked blocks (Stack)       */
/*    · all field/grid gaps: 12px                                      */
/*    · section titles: one shared style                               */
/*    · stat rows: strict 3-column grids, no ragged space-between      */
/* ------------------------------------------------------------------ */

const T = {
  bg: "radial-gradient(circle at 10% 6%, rgba(14,138,112,0.45) 0%, transparent 45%), radial-gradient(circle at 92% 10%, rgba(94,92,230,0.32) 0%, transparent 48%), radial-gradient(circle at 15% 55%, rgba(50,173,230,0.30) 0%, transparent 45%), radial-gradient(circle at 85% 90%, rgba(14,138,112,0.28) 0%, transparent 50%), #F5F6F3",
  card: "#FFFFFF",
  border: "#EBEBE8",
  ink: "#16181D",
  muted: "#8A8F98",
  faint: "#B4B8BE",
  accent: "#0E8A70",
  accentSoft: "#E6F4F0",
  danger: "#C2402A",
  dangerSoft: "#FBEAE6",
  glass: "rgba(255,255,255,0.6)",
  glassBorder: "rgba(255,255,255,0.8)",
};

const GAP = 12; // single vertical/horizontal rhythm used everywhere

const FUELS = {
  petrol: { label: "Petrol", unit: "L",   mUnit: "km/L",   tint: "#0E8A70", soft: "#E6F4F0" },
  diesel: { label: "Diesel", unit: "L",   mUnit: "km/L",   tint: "#B3671E", soft: "#F7EEE3" },
  cng:    { label: "CNG",    unit: "kg",  mUnit: "km/kg",  tint: "#2A63B8", soft: "#E9F0FA" },
  ev:     { label: "EV",     unit: "kWh", mUnit: "km/kWh", tint: "#6E4FB8", soft: "#F0EBFA" },
};

const GRADES = {
  petrol: [
    { id: "regular", label: "Regular", sub: "91 octane" },
    { id: "premium", label: "Premium", sub: "95 octane · XP95 / Speed / Power" },
    { id: "super",   label: "Premium 100", sub: "100 octane · XP100" },
  ],
  diesel: [
    { id: "regular", label: "Regular", sub: "" },
    { id: "premium", label: "Premium", sub: "Turbojet / Hi-Speed" },
  ],
  cng: [{ id: "regular", label: "CNG", sub: "" }],
  ev: [
    { id: "slow", label: "AC Slow", sub: "home / 3.3 kW" },
    { id: "fast", label: "DC Fast", sub: "public charger" },
  ],
};
const gradeLabel = (fuel, id) =>
  (GRADES[fuel] || []).find((g) => g.id === id)?.label || "Regular";

const BODY_ICONS = { bike: Bike, car: CarFront, commercial: Truck, ev: Zap };
const BRANDS = ["IndianOil", "HP", "Bharat Petroleum", "Shell", "Nayara", "Reliance"];

/* IDs must stay unique across page reloads now that data persists,
   so use a timestamp+random suffix instead of a resettable counter */
const nid = (p = "x") => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const seedVehicles = [
  { id: "v1", name: "Splendor Plus", reg: "TN 37 CK 4821", fuel: "petrol", body: "bike" },
  { id: "v2", name: "WagonR", reg: "TN 66 AQ 1104", fuel: "cng", body: "car" },
];

const seedFills = [
  { id: nid("f"), vehicleId: "v1", date: "2026-03-08", odo: 18240, price: 102.4, qty: 4.1, full: true, brand: "IndianOil", grade: "regular", city: "Coimbatore" },
  { id: nid("f"), vehicleId: "v1", date: "2026-03-24", odo: 18492, price: 102.4, qty: 4.3, full: true, brand: "HP", grade: "regular", city: "Coimbatore" },
  { id: nid("f"), vehicleId: "v1", date: "2026-04-11", odo: 18747, price: 103.1, qty: 4.2, full: true, brand: "IndianOil", grade: "regular", city: "Coimbatore" },
  { id: nid("f"), vehicleId: "v1", date: "2026-04-29", odo: 18991, price: 103.1, qty: 4.4, full: true, brand: "Nayara", grade: "regular", city: "Pollachi" },
  { id: nid("f"), vehicleId: "v1", date: "2026-05-16", odo: 19242, price: 104.0, qty: 4.1, full: true, brand: "IndianOil", grade: "regular", city: "Coimbatore" },
  { id: nid("f"), vehicleId: "v1", date: "2026-06-02", odo: 19488, price: 112.8, qty: 4.1, full: true, brand: "Shell", grade: "premium", city: "Coimbatore" },
  { id: nid("f"), vehicleId: "v1", date: "2026-06-19", odo: 19755, price: 113.4, qty: 4.2, full: true, brand: "Shell", grade: "premium", city: "Coimbatore" },
  { id: nid("f"), vehicleId: "v1", date: "2026-07-06", odo: 20011, price: 104.6, qty: 4.2, full: true, brand: "IndianOil", grade: "regular", city: "Coimbatore" },
  { id: nid("f"), vehicleId: "v2", date: "2026-03-15", odo: 41210, price: 89.5, qty: 8.4, full: true, brand: "IndianOil", grade: "regular", city: "Coimbatore" },
  { id: nid("f"), vehicleId: "v2", date: "2026-04-02", odo: 41448, price: 89.5, qty: 8.1, full: true, brand: "IndianOil", grade: "regular", city: "Coimbatore" },
  { id: nid("f"), vehicleId: "v2", date: "2026-04-20", odo: 41689, price: 91.0, qty: 8.6, full: true, brand: "HP", grade: "regular", city: "Coimbatore" },
  { id: nid("f"), vehicleId: "v2", date: "2026-05-09", odo: 41930, price: 91.0, qty: 8.3, full: true, brand: "IndianOil", grade: "regular", city: "Coimbatore" },
  { id: nid("f"), vehicleId: "v2", date: "2026-05-30", odo: 42186, price: 92.2, qty: 8.8, full: true, brand: "Bharat Petroleum", grade: "regular", city: "Tiruppur" },
  { id: nid("f"), vehicleId: "v2", date: "2026-06-21", odo: 42440, price: 92.2, qty: 8.5, full: true, brand: "IndianOil", grade: "regular", city: "Coimbatore" },
  { id: nid("f"), vehicleId: "v2", date: "2026-07-12", odo: 42701, price: 93.0, qty: 8.7, full: true, brand: "HP", grade: "regular", city: "Coimbatore" },
];

/* ---------- mileage engine: tankful-to-tankful ---------- */
function computeMileage(fills) {
  const sorted = [...fills].sort((a, b) => a.odo - b.odo);
  const out = [];
  let lastFull = null;
  let bucket = 0;
  for (const f of sorted) {
    if (f.full) {
      if (lastFull) {
        const dist = f.odo - lastFull.odo;
        const used = bucket + f.qty;
        out.push({
          ...f,
          dist,
          mileage: used > 0 ? dist / used : null,
          qtyUsed: used,
          // the distance was covered on the fuel poured in at the *opening*
          // fill of this stretch, not the fill that closes it — credit that pump/grade
          fuelBrand: lastFull.brand,
          fuelGrade: lastFull.grade,
          fuelPrice: lastFull.price,
        });
      } else out.push({ ...f, dist: null, mileage: null });
      lastFull = f;
      bucket = 0;
    } else {
      bucket += f.qty;
      out.push({ ...f, dist: null, mileage: null });
    }
  }
  return out.reverse();
}

const fmt = (n, d = 1) =>
  n == null ? "—" : n.toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d });
const fmtInt = (n) => (n == null ? "—" : Math.round(n).toLocaleString("en-IN"));
const shortDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/* ---------- layout atoms (single source of spacing truth) ---------- */
function Stack({ children, style }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: GAP, ...style }}>{children}</div>;
}

function Card({ children, style }) {
  return (
    <div className="glass" style={{ borderRadius: 20, padding: 16, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, icon: Icon }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
      {Icon && <Icon size={14} strokeWidth={2} style={{ color: T.accent }} />}
      {children}
    </div>
  );
}

/* strict 3-column stat grid — identical alignment everywhere it appears */
function StatRow({ stats, divider }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        borderTop: divider ? `1px solid ${T.border}` : "none",
        paddingTop: divider ? GAP : 0,
      }}
    >
      {stats.map((x, i) => (
        <div key={x.l} style={{ borderLeft: i ? `1px solid ${T.border}` : "none", paddingLeft: i ? GAP : 0 }}>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>{x.l}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span className="num" style={{ fontSize: 17, fontWeight: 600 }}>{x.v}</span>
            {x.u && <span style={{ fontSize: 10.5, color: T.faint }}>{x.u}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${T.border}`,
  fontSize: 15,
  fontFamily: "'Inter', sans-serif",
  background: T.card,
  color: T.ink,
  outline: "none",
  boxSizing: "border-box",
};

function Field({ label, children, hint }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: T.muted, marginBottom: 6 }}>
        {label}
        {hint && <span style={{ color: T.faint }}> · {hint}</span>}
      </div>
      {children}
    </label>
  );
}

function Row2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP }}>{children}</div>;
}

function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", background: "rgba(20,30,25,0.05)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 12, padding: 3, gap: 2 }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            flex: 1,
            padding: "8px 6px",
            borderRadius: 9,
            border: "none",
            background: value === o.value ? T.card : "transparent",
            color: value === o.value ? T.ink : T.muted,
            fontWeight: value === o.value ? 600 : 500,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: value === o.value ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            fontFamily: "'Inter', sans-serif",
            transition: "all 120ms",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PrimaryButton({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "13px 0",
        borderRadius: 999,
        border: "none",
        background: `linear-gradient(180deg, #14A382 0%, ${T.accent} 65%)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 18px rgba(14,138,112,0.32)",
        color: "#fff",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function FuelBadge({ fuel }) {
  const f = FUELS[fuel];
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: f.tint, background: f.soft, padding: "3px 9px", borderRadius: 999 }}>
      {f.label}
    </span>
  );
}

/* three-step progress toward the trend line: tank 1 = baseline,
   tank 2 = first reading, tank 3 = trend begins */
function TankProgress({ step }) {
  const labels = ["Baseline", "First reading", "Trend"];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
      {labels.map((l, i) => {
        const done = step > i;
        const current = step === i;
        return (
          <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: done ? T.accent : "transparent",
                border: `1.5px solid ${done || current ? T.accent : T.faint}`,
              }}
            />
            <div style={{ fontSize: 10, color: done ? T.accent : T.faint, fontWeight: done ? 600 : 500 }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
}

function GradeTag({ fuel, grade }) {
  if (!grade || grade === "regular" || (GRADES[fuel] || []).length < 2) return null;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: "#8A6A12", background: "#FBF3DC", padding: "2px 7px", borderRadius: 999, marginLeft: 6 }}>
      {gradeLabel(fuel, grade)}
    </span>
  );
}

/* ---------- vehicle add / edit form ---------- */
function VehicleForm({ initial, onSave, onCancel, onBack, onDelete }) {
  const [v, setV] = useState(initial || { name: "", reg: "", fuel: "petrol", body: "bike" });
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));
  const editing = Boolean(initial);
  const [armDelete, setArmDelete] = useState(false);
  const armThenDelete = () => {
    if (armDelete) { onDelete(); return; }
    setArmDelete(true);
    setTimeout(() => setArmDelete(false), 3000);
  };

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: GAP }}>
        <button onClick={onBack} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: T.muted, display: "flex" }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 600 }}>
          {editing ? "Edit vehicle" : "Add a vehicle"}
        </div>
      </div>

      <Stack>
        <Field label="Vehicle name">
          <input style={inputStyle} placeholder="e.g. Splendor Plus" value={v.name} onChange={(e) => set("name", e.target.value)} />
        </Field>

        <Field label="Registration number" hint="optional">
          <input style={inputStyle} placeholder="TN 37 AB 1234" value={v.reg} onChange={(e) => set("reg", e.target.value)} />
        </Field>

        <Field label="Vehicle type">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { value: "bike", label: "Bike" },
              { value: "car", label: "Car" },
              { value: "commercial", label: "Truck" },
              { value: "ev", label: "EV" },
            ].map((o) => {
              const Icon = BODY_ICONS[o.value];
              const active = v.body === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => set("body", o.value)}
                  style={{
                    padding: "11px 4px",
                    borderRadius: 12,
                    border: `1.5px solid ${active ? T.ink : T.border}`,
                    background: active ? "#F6F6F4" : T.card,
                    color: active ? T.ink : T.muted,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <Icon size={20} strokeWidth={1.8} />
                  {o.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Fuel type" hint="sets units — km/L, km/kg or km/kWh">
          <Segmented value={v.fuel} onChange={(val) => set("fuel", val)} options={Object.entries(FUELS).map(([value, f]) => ({ value, label: f.label }))} />
        </Field>

        <div style={{ display: "flex", gap: GAP }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.ink, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            Cancel
          </button>
          <PrimaryButton style={{ flex: 2, opacity: v.name.trim() ? 1 : 0.4 }} onClick={() => v.name.trim() && onSave(v)}>
            <Check size={16} /> {editing ? "Save changes" : "Add vehicle"}
          </PrimaryButton>
        </div>

        {editing && onDelete && (
          <button
            onClick={armThenDelete}
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: 12,
              border: `1px solid ${armDelete ? T.danger : T.border}`,
              background: armDelete ? T.dangerSoft : "transparent",
              color: T.danger,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            <Trash2 size={14} />
            {armDelete ? "Tap again to confirm — its fill-ups go too" : "Delete this vehicle"}
          </button>
        )}
      </Stack>
    </Card>
  );
}

/* ---------- edit an existing fill-up ---------- */
function FillEditForm({ fill, meta, grades, onSave, onCancel }) {
  const [d, setD] = useState({
    date: fill.date,
    odo: String(fill.odo),
    qty: String(fill.qty),
    amount: String(Math.round(fill.price * fill.qty)),
    full: fill.full,
    brand: fill.brand,
    city: fill.city || "",
    grade: fill.grade || "regular",
  });
  const set = (k, val) => setD((p) => ({ ...p, [k]: val }));
  const amount = +d.amount || 0;
  const qty = +d.qty || 0;
  const odo = +d.odo || 0;
  const valid = amount > 0 && qty > 0 && odo > 0;
  const price = valid ? amount / qty : null;

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: GAP }}>
        <button onClick={onCancel} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: T.muted, display: "flex" }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 600 }}>
          Edit fill-up · {shortDate(fill.date)}
        </div>
      </div>

      <Stack>
        <Row2>
          <Field label="Date">
            <input type="date" style={inputStyle} value={d.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <Field label="Odometer (km)">
            <input type="number" style={inputStyle} value={d.odo} onChange={(e) => set("odo", e.target.value)} />
          </Field>
        </Row2>

        {grades.length > 1 && (
          <Field label="Fuel grade">
            <Segmented value={d.grade} onChange={(v) => set("grade", v)} options={grades.map((g) => ({ value: g.id, label: g.label }))} />
          </Field>
        )}

        <Row2>
          <Field label="Amount paid (₹)">
            <input type="number" style={inputStyle} value={d.amount} onChange={(e) => set("amount", e.target.value)} />
          </Field>
          <Field label={`Quantity (${meta.unit})`}>
            <input type="number" style={inputStyle} value={d.qty} onChange={(e) => set("qty", e.target.value)} />
          </Field>
        </Row2>

        <Row2>
          <Field label="Pump brand">
            <select style={inputStyle} value={d.brand} onChange={(e) => set("brand", e.target.value)}>
              {BRANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="City">
            <input style={inputStyle} value={d.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
        </Row2>

        <Field label="Tank" hint="full computes mileage">
          <Segmented
            value={d.full ? "full" : "partial"}
            onChange={(v) => set("full", v === "full")}
            options={[{ value: "full", label: "Full" }, { value: "partial", label: "Partial" }]}
          />
        </Field>

        <div style={{ fontSize: 12.5, color: T.muted, textAlign: "center" }}>
          {price ? `Works out to ₹${fmt(price, 2)} per ${meta.unit}` : "Enter amount and quantity"}
        </div>

        <div style={{ display: "flex", gap: GAP }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.ink, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            Cancel
          </button>
          <PrimaryButton style={{ flex: 2, opacity: valid ? 1 : 0.4 }} onClick={() => valid && onSave(d)}>
            <Check size={16} /> Save changes
          </PrimaryButton>
        </div>
      </Stack>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  QuickLog — the signature interaction. One question per screen,     */
/*  one giant number, UPI-style. Three numbers in, everything else     */
/*  defaults from your last fill. Target: logged in under 15 seconds.  */
/* ------------------------------------------------------------------ */
function QuickLog({ vehicle, meta, grades, lastFill, defaults, onSave }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState({
    amount: "",
    qty: "",
    odo: "",
    date: "2026-07-18",
    full: true,
    brand: defaults.brand,
    city: defaults.city,
    grade: defaults.grade,
  });
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const [showDetails, setShowDetails] = useState(false);

  const amount = +d.amount || 0;
  const qty = +d.qty || 0;
  const odo = +d.odo || 0;
  const price = amount > 0 && qty > 0 ? amount / qty : null;
  const dist = lastFill && odo > lastFill.odo ? odo - lastFill.odo : null;
  const mileage = d.full && dist && qty > 0 ? dist / qty : null;

  const steps = [
    {
      key: "amount",
      q: "How much did you pay?",
      prefix: "₹",
      placeholder: "500",
      valid: amount > 0,
      helper: lastFill ? `Last fill was ₹${fmt(lastFill.price * lastFill.qty, 0)}` : "Straight off the pump receipt",
    },
    {
      key: "qty",
      q: `How much ${meta.label.toLowerCase() === "ev" ? "energy" : meta.label.toLowerCase()} went in?`,
      suffix: meta.unit,
      placeholder: "4.2",
      valid: qty > 0,
      helper: price ? `That's ₹${fmt(price, 2)} per ${meta.unit}` : "Also on the receipt",
    },
    {
      key: "odo",
      q: "Odometer reading?",
      suffix: "km",
      placeholder: lastFill ? String(lastFill.odo + 200) : "20250",
      valid: odo > 0 && (!lastFill || odo > lastFill.odo),
      helper: dist
        ? `${fmtInt(dist)} km since your last fill`
        : lastFill
        ? `Last reading was ${fmtInt(lastFill.odo)} km`
        : "From the dashboard",
    },
  ];

  const stepDots = (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: step === i ? 18 : 6,
            height: 6,
            borderRadius: 99,
            background: step >= i ? T.ink : T.border,
            transition: "all 180ms",
          }}
        />
      ))}
    </div>
  );

  const navButtons = (nextLabel, nextAction, nextEnabled) => (
    <div style={{ display: "flex", gap: GAP, marginTop: 22 }}>
      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.ink, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
        >
          Back
        </button>
      )}
      <PrimaryButton style={{ flex: 2, opacity: nextEnabled ? 1 : 0.35 }} onClick={() => nextEnabled && nextAction()}>
        {nextLabel}
      </PrimaryButton>
    </div>
  );

  /* ---- steps 0–2: one giant number each ---- */
  if (step < 3) {
    const s = steps[step];
    return (
      <Card style={{ padding: "26px 20px 20px" }}>
        {stepDots}
        <div style={{ textAlign: "center", fontSize: 15, fontWeight: 600, marginBottom: 18 }}>{s.q}</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, borderBottom: `2px solid ${T.ink}`, maxWidth: 240, margin: "0 auto", paddingBottom: 6 }}>
          {s.prefix && <span className="num" style={{ fontSize: 26, color: T.muted }}>{s.prefix}</span>}
          <input
            key={s.key}
            type="number"
            inputMode="decimal"
            placeholder={s.placeholder}
            value={d[s.key]}
            onChange={(e) => set(s.key, e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && s.valid && setStep(step + 1)}
            className="num"
            style={{
              fontSize: 40,
              fontWeight: 600,
              border: "none",
              outline: "none",
              background: "transparent",
              textAlign: "center",
              width: "100%",
              maxWidth: 170,
              color: T.ink,
              padding: 0,
            }}
          />
          {s.suffix && <span style={{ fontSize: 15, color: T.muted }}>{s.suffix}</span>}
        </div>
        <div style={{ textAlign: "center", fontSize: 12.5, color: T.muted, marginTop: 12, minHeight: 18 }}>{s.helper}</div>
        {navButtons("Next", () => setStep(step + 1), s.valid)}
      </Card>
    );
  }

  /* ---- step 3: confirm. defaults shown, details tucked away ---- */
  return (
    <Card style={{ padding: "26px 20px 20px" }}>
      {stepDots}
      {mileage ? (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: T.muted }}>This tank</div>
          <div className="num" style={{ fontSize: 40, fontWeight: 600, color: T.accent }}>
            {fmt(mileage)}<span style={{ fontSize: 14, color: T.muted, fontWeight: 400 }}> {meta.mUnit}</span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{d.full && !lastFill ? "Baseline tank" : "Partial fill"}</div>
          <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>
            {d.full && !lastFill ? "Mileage starts from your next full tank." : "Counts toward your next full-tank mileage."}
          </div>
        </div>
      )}

      <div style={{ background: "#F6F6F4", borderRadius: 12, padding: "12px 14px", marginBottom: GAP }}>
        <StatRow
          stats={[
            { l: "Paid", v: `₹${fmt(amount, 0)}` },
            { l: `${meta.label}`, v: fmt(qty, 2), u: meta.unit },
            { l: `Price / ${meta.unit}`, v: `₹${fmt(price, 2)}` },
          ]}
        />
      </div>

      {/* defaults line — tap to open details only if something needs changing */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "2px 0 0", fontFamily: "'Inter', sans-serif", textAlign: "center" }}
      >
        <span style={{ fontSize: 12.5, color: T.muted }}>
          {gradeLabel(vehicle.fuel, d.grade)} · {d.brand}{d.city ? ` · ${d.city}` : ""} · {d.full ? "full tank" : "partial"} · {shortDate(d.date)}
        </span>
        <span style={{ fontSize: 12.5, color: T.accent, fontWeight: 600 }}> {showDetails ? "· done" : "· change"}</span>
      </button>

      {showDetails && (
        <Stack style={{ marginTop: GAP }}>
          {grades.length > 1 && (
            <Field label="Fuel grade">
              <Segmented value={d.grade} onChange={(v) => set("grade", v)} options={grades.map((g) => ({ value: g.id, label: g.label }))} />
            </Field>
          )}
          <Field label="Tank">
            <Segmented
              value={d.full ? "full" : "partial"}
              onChange={(v) => set("full", v === "full")}
              options={[{ value: "full", label: "Full" }, { value: "partial", label: "Partial" }]}
            />
          </Field>
          <Row2>
            <Field label="Pump brand">
              <select style={inputStyle} value={d.brand} onChange={(e) => set("brand", e.target.value)}>
                {BRANDS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="City">
              <input style={inputStyle} placeholder="e.g. Coimbatore" value={d.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
          </Row2>
          <Field label="Date">
            <input type="date" style={inputStyle} value={d.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
        </Stack>
      )}

      {navButtons(
        <>
          <Check size={16} /> Save fill-up
        </>,
        () => onSave(d),
        amount > 0 && qty > 0 && odo > 0
      )}
    </Card>
  );
}

/* ---------- persistence: vehicles + fills survive refreshes ---------- */
const LS_KEY = "refuel-data-v1";

function loadPersisted() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (Array.isArray(d.vehicles) && Array.isArray(d.fills) && d.vehicles.length) return d;
  } catch {
    /* corrupt or unavailable storage — fall back to seeds */
  }
  return null;
}

function savePersisted(vehicles, fills) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(LS_KEY, JSON.stringify({ vehicles, fills }));
  } catch {
    /* storage full or blocked — app keeps working in memory */
  }
}

/* ================================================================ */
export default function App() {
  const persisted = useMemo(loadPersisted, []);
  const [vehicles, setVehicles] = useState(persisted?.vehicles || seedVehicles);
  const [fills, setFills] = useState(persisted?.fills || seedFills);
  const [activeVehicle, setActiveVehicle] = useState((persisted?.vehicles || seedVehicles)[0].id);
  const [tab, setTab] = useState("home");
  const [garageMode, setGarageMode] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedFill, setExpandedFill] = useState(null);
  const [editingFill, setEditingFill] = useState(null);
  const [armDeleteFill, setArmDeleteFill] = useState(null);

  useEffect(() => {
    savePersisted(vehicles, fills);
  }, [vehicles, fills]);

  const vehicle = vehicles.find((v) => v.id === activeVehicle) || vehicles[0];
  const meta = FUELS[vehicle.fuel];
  const grades = GRADES[vehicle.fuel] || [];

  const vFills = useMemo(() => fills.filter((f) => f.vehicleId === vehicle.id), [fills, vehicle.id]);
  const computed = useMemo(() => computeMileage(vFills), [vFills]);
  const lastFill = vFills.length ? [...vFills].sort((a, b) => a.odo - b.odo).at(-1) : null;

  const stats = useMemo(() => {
    const monthKey = "2026-07";
    const monthSpend = vFills.filter((f) => f.date.startsWith(monthKey)).reduce((s, f) => s + f.price * f.qty, 0);
    const withM = computed.filter((f) => f.mileage);
    const avgMileage = withM.length ? withM.reduce((s, f) => s + f.mileage, 0) / withM.length : null;
    const dist = withM.reduce((s, f) => s + f.dist, 0);
    const cost = withM.reduce((s, f) => s + f.price * f.qty, 0);
    return { monthSpend, avgMileage, costPerKm: dist ? cost / dist : null };
  }, [vFills, computed]);

  const monthlySpend = useMemo(() => {
    const m = {};
    vFills.forEach((f) => {
      const k = f.date.slice(0, 7);
      m[k] = (m[k] || 0) + f.price * f.qty;
    });
    return Object.entries(m).sort().map(([k, v]) => ({
      month: new Date(k + "-01").toLocaleDateString("en-IN", { month: "short" }),
      spend: Math.round(v),
    }));
  }, [vFills]);

  const mileageTrend = useMemo(
    () => [...computed].reverse().filter((f) => f.mileage).map((f) => ({ date: shortDate(f.date), mileage: +f.mileage.toFixed(1) })),
    [computed]
  );

  const brandStats = useMemo(() => {
    const m = {};
    computed.filter((f) => f.mileage).forEach((f) => {
      if (!m[f.fuelBrand]) m[f.fuelBrand] = { total: 0, n: 0 };
      m[f.fuelBrand].total += f.mileage;
      m[f.fuelBrand].n += 1;
    });
    return Object.entries(m).map(([brand, { total, n }]) => ({ brand, avg: total / n, n })).sort((a, b) => b.avg - a.avg);
  }, [computed]);

  const gradeStats = useMemo(() => {
    const m = {};
    computed.filter((f) => f.mileage).forEach((f) => {
      const g = f.fuelGrade || "regular";
      if (!m[g]) m[g] = { dist: 0, cost: 0, mSum: 0, pSum: 0, n: 0 };
      m[g].dist += f.dist;
      m[g].cost += f.fuelPrice * f.qtyUsed;
      m[g].mSum += f.mileage;
      m[g].pSum += f.fuelPrice;
      m[g].n += 1;
    });
    return Object.entries(m).map(([grade, s]) => ({
      grade,
      label: gradeLabel(vehicle.fuel, grade),
      avgMileage: s.mSum / s.n,
      avgPrice: s.pSum / s.n,
      costPerKm: s.dist ? s.cost / s.dist : null,
      n: s.n,
    }));
  }, [computed, vehicle.fuel]);

  const gradeVerdict = useMemo(() => {
    const reg = gradeStats.find((g) => g.grade === "regular");
    const prem = gradeStats.find((g) => g.grade !== "regular");
    if (!reg || !prem || !reg.costPerKm || !prem.costPerKm) return null;
    const mGain = ((prem.avgMileage - reg.avgMileage) / reg.avgMileage) * 100;
    const pGain = ((prem.avgPrice - reg.avgPrice) / reg.avgPrice) * 100;
    const cheaper = prem.costPerKm < reg.costPerKm ? "premium" : "regular";
    const diff = Math.abs(prem.costPerKm - reg.costPerKm);
    return { reg, prem, mGain, pGain, cheaper, diff };
  }, [gradeStats]);

  /* ---------- quick log: stepper collects data, this saves it ---------- */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const importInputRef = useRef(null);

  function exportData() {
    const blob = new Blob(
      [JSON.stringify({ vehicles, fills, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `refuel-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup downloaded");
  }

  function importData(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.vehicles) || !Array.isArray(data.fills)) throw new Error("bad shape");
        setVehicles(data.vehicles);
        setFills(data.fills);
        showToast("Backup restored");
      } catch {
        showToast("Couldn't read that file");
      }
    };
    reader.readAsText(file);
  }

  const lastDefaults = {
    brand: lastFill?.brand || "IndianOil",
    city: lastFill?.city || "",
    grade: lastFill?.grade || grades[0]?.id || "regular",
  };

  function addFill(d) {
    setFills((p) => [
      ...p,
      {
        id: nid("f"),
        vehicleId: vehicle.id,
        date: d.date,
        odo: +d.odo,
        price: +(+d.amount / +d.qty).toFixed(2),
        qty: +(+d.qty).toFixed(2),
        full: d.full,
        brand: d.brand,
        grade: d.grade,
        city: d.city.trim(),
      },
    ]);
    showToast(`Saved — ${fmt(+d.qty, 2)} ${meta.unit} of ${gradeLabel(vehicle.fuel, d.grade).toLowerCase()}`);
    setTab("history");
  }

  function updateFill(id, d) {
    setFills((p) =>
      p.map((f) =>
        f.id === id
          ? {
              ...f,
              date: d.date,
              odo: +d.odo,
              qty: +(+d.qty).toFixed(2),
              price: +(+d.amount / +d.qty).toFixed(2),
              full: d.full,
              brand: d.brand,
              city: d.city.trim(),
              grade: d.grade,
            }
          : f
      )
    );
    setEditingFill(null);
    showToast("Fill-up updated");
  }

  function deleteFill(id) {
    setFills((p) => p.filter((f) => f.id !== id));
    setArmDeleteFill(null);
    setExpandedFill(null);
    showToast("Fill-up deleted");
  }

  function armOrDeleteFill(id) {
    if (armDeleteFill === id) {
      deleteFill(id);
      return;
    }
    setArmDeleteFill(id);
    setTimeout(() => setArmDeleteFill((cur) => (cur === id ? null : cur)), 3000);
  }

  function deleteVehicle(id) {
    if (vehicles.length <= 1) {
      showToast("Add another vehicle before deleting this one");
      return;
    }
    const name = vehicles.find((v) => v.id === id)?.name;
    const remaining = vehicles.filter((v) => v.id !== id);
    setVehicles(remaining);
    setFills((p) => p.filter((f) => f.vehicleId !== id));
    if (activeVehicle === id) setActiveVehicle(remaining[0].id);
    setGarageMode("list");
    setEditingId(null);
    showToast(`${name} deleted`);
  }

  function saveVehicle(v) {
    if (garageMode === "edit") {
      setVehicles((p) => p.map((x) => (x.id === editingId ? { ...x, ...v } : x)));
      showToast("Vehicle updated");
    } else {
      const id = nid("v");
      setVehicles((p) => [...p, { ...v, id }]);
      setActiveVehicle(id);
      showToast(`${v.name} added to your garage`);
    }
    setGarageMode("list");
    setEditingId(null);
  }

  const vehicleStats = (vid) => {
    const c = computeMileage(fills.filter((f) => f.vehicleId === vid)).filter((f) => f.mileage);
    const avg = c.length ? c.reduce((s, f) => s + f.mileage, 0) / c.length : null;
    return { avg, fills: fills.filter((f) => f.vehicleId === vid).length };
  };

  /* ---------------------------------------------------------------- */
  const tabs = [
    { id: "home", label: "Home", icon: Gauge },
    { id: "add", label: "Fill up", icon: Fuel },
    { id: "history", label: "History", icon: ReceiptText },
    { id: "insights", label: "Insights", icon: Sparkles },
    { id: "garage", label: "Garage", icon: Warehouse },
  ];

  const chartAxis = { fontSize: 10.5, fill: T.faint };
  const chartTooltip = { borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12 };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');
        input:focus, select:focus { border-color: ${T.ink} !important; }
        button:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }
        .num { font-family: 'Space Grotesk', sans-serif; font-variant-numeric: tabular-nums; }
        * { -webkit-tap-highlight-color: transparent; }
        .glass {
          background: ${T.glass};
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid ${T.glassBorder};
          box-shadow: 0 1px 0 rgba(255,255,255,0.7) inset, 0 10px 30px rgba(20,40,32,0.08);
        }
        .glass-dark {
          background: rgba(22,24,29,0.78);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
      `}</style>

      <div style={{ maxWidth: 460, margin: "0 auto", padding: "calc(20px + env(safe-area-inset-top)) 16px 112px" }}>
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: GAP }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
              <rect width="64" height="64" rx="14" fill={T.ink} />
              <path
                d="M32 12 C27 19 18 29.5 18 38.5 a14 14 0 0 0 28 0 C46 29.5 37 19 32 12 Z"
                fill="none"
                stroke="#FAFAF9"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle cx="32" cy="39" r="5.5" fill={T.accent} />
            </svg>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 21, letterSpacing: "-0.01em" }}>
              Refuel<span style={{ color: T.accent }}>.</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </div>
        </div>

        {/* vehicle switcher */}
        {!(tab === "garage" && garageMode !== "list") && (
          <div style={{ display: "flex", gap: 8, marginBottom: GAP, flexWrap: "wrap" }}>
            {vehicles.map((v) => {
              const Icon = BODY_ICONS[v.body] || CarFront;
              const active = v.id === vehicle.id;
              return (
                <button
                  key={v.id}
                  onClick={() => { setActiveVehicle(v.id); setEditingFill(null); setExpandedFill(null); setArmDeleteFill(null); }}
                  className={active ? "" : "glass"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: active ? "1.5px solid transparent" : undefined,
                    background: active ? `linear-gradient(180deg, #14A382 0%, ${T.accent} 65%)` : undefined,
                    boxShadow: active ? "0 6px 14px rgba(14,138,112,0.3)" : undefined,
                    color: active ? "#fff" : T.ink,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <Icon size={15} strokeWidth={2} />
                  {v.name}
                </button>
              );
            })}
            <button
              onClick={() => { setTab("garage"); setGarageMode("add"); }}
              aria-label="Add vehicle"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 35, height: 35, borderRadius: 999, border: `1.5px dashed ${T.faint}`, background: "transparent", color: T.muted, cursor: "pointer" }}
            >
              <Plus size={16} />
            </button>
          </div>
        )}

        {/* ---------------- HOME ---------------- */}
        {tab === "home" && (
          <Stack>
            <Card>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>Spent this month</div>
              <div className="num" style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em", margin: "2px 0 12px" }}>
                ₹{fmtInt(stats.monthSpend)}
              </div>
              <StatRow
                divider
                stats={[
                  { l: "Avg mileage", v: fmt(stats.avgMileage), u: meta.mUnit },
                  { l: "Running cost", v: `₹${fmt(stats.costPerKm, 2)}`, u: "/km" },
                  { l: "Odometer", v: fmtInt(lastFill?.odo), u: "km" },
                ]}
              />
            </Card>

            {vFills.length === 0 ? (
              <Card style={{ textAlign: "center", padding: "28px 16px" }}>
                <Fuel size={22} strokeWidth={1.6} style={{ color: T.faint, margin: "0 auto 10px" }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No fill-ups yet</div>
                <div style={{ fontSize: 13, color: T.muted, margin: "4px 0 14px" }}>
                  Log your first full tank to start tracking mileage for the {vehicle.name}.
                </div>
                <PrimaryButton onClick={() => setTab("add")} style={{ maxWidth: 200, margin: "0 auto" }}>
                  <Plus size={15} /> Log fill-up
                </PrimaryButton>
              </Card>
            ) : (
              <>
                <Card>
                  <SectionTitle>Mileage trend</SectionTitle>
                  {mileageTrend.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={mileageTrend} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                        <XAxis dataKey="date" tick={chartAxis} axisLine={false} tickLine={false} />
                        <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={chartAxis} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v) => [`${v} ${meta.mUnit}`, "Mileage"]} contentStyle={chartTooltip} />
                        <Line type="monotone" dataKey="mileage" stroke={T.accent} strokeWidth={2} dot={{ r: 3, fill: T.accent, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : mileageTrend.length === 1 ? (
                    <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
                      <div className="num" style={{ fontSize: 30, fontWeight: 600, color: T.accent }}>
                        {fmt(mileageTrend[0].mileage)}
                        <span style={{ fontSize: 13, color: T.muted, fontWeight: 400 }}> {meta.mUnit}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: T.muted, margin: "6px auto 10px", maxWidth: 280, lineHeight: 1.55 }}>
                        First reading in — one more full tank and your trend line begins.
                      </div>
                      <TankProgress step={2} />
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "14px 0 8px" }}>
                      <Gauge size={22} strokeWidth={1.6} style={{ color: T.faint, margin: "0 auto 8px" }} />
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {vFills.some((f) => f.full) ? "Baseline recorded" : "No full tank yet"}
                      </div>
                      <div style={{ fontSize: 12.5, color: T.muted, margin: "4px auto 10px", maxWidth: 280, lineHeight: 1.55 }}>
                        {vFills.some((f) => f.full)
                          ? "Your first mileage number arrives with your next full tank."
                          : "Mileage is measured between full tanks — mark a fill-up as Full to start."}
                      </div>
                      <TankProgress step={vFills.some((f) => f.full) ? 1 : 0} />
                    </div>
                  )}
                </Card>

                <Card>
                  <SectionTitle>Monthly spend</SectionTitle>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={monthlySpend} barCategoryGap="35%" margin={{ top: 4, right: 8, bottom: 0, left: -14 }}>
                      <XAxis dataKey="month" tick={chartAxis} axisLine={false} tickLine={false} />
                      <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Spend"]} contentStyle={chartTooltip} />
                      <Bar dataKey="spend" fill={T.ink} radius={[5, 5, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>
            )}
          </Stack>
        )}

        {/* ---------------- FILL UP (quick log stepper) ---------------- */}
        {tab === "add" && (
          <QuickLog
            key={vehicle.id}
            vehicle={vehicle}
            meta={meta}
            grades={grades}
            lastFill={lastFill}
            defaults={lastDefaults}
            onSave={addFill}
          />
        )}

        {/* ---------------- HISTORY ---------------- */}
        {tab === "history" && editingFill && (
          <FillEditForm
            key={editingFill.id}
            fill={editingFill}
            meta={meta}
            grades={grades}
            onSave={(d) => updateFill(editingFill.id, d)}
            onCancel={() => setEditingFill(null)}
          />
        )}
        {tab === "history" && !editingFill && (
          <Card style={{ paddingTop: 4, paddingBottom: 4 }}>
            {computed.length === 0 && (
              <div style={{ padding: "24px 0", textAlign: "center", color: T.muted, fontSize: 13 }}>
                Nothing logged yet for the {vehicle.name}.
              </div>
            )}
            {computed.map((f, i) => (
              <div key={f.id} style={{ borderBottom: i < computed.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div
                  onClick={() => {
                    setExpandedFill(expandedFill === f.id ? null : f.id);
                    setArmDeleteFill(null);
                  }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: GAP,
                    padding: "12px 0",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                      {shortDate(f.date)}
                      <span style={{ color: T.muted, fontWeight: 400 }}>
                        &nbsp;· {fmt(f.qty, 2)} {meta.unit} @ ₹{fmt(f.price, 1)}
                      </span>
                      <GradeTag fuel={vehicle.fuel} grade={f.grade} />
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                      {f.brand}{f.city ? ` · ${f.city}` : ""} · {fmtInt(f.odo)} km{!f.full && " · partial"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="num" style={{ fontSize: 15, fontWeight: 600, color: f.mileage ? T.accent : T.faint }}>
                      {f.mileage ? fmt(f.mileage) : "—"}
                      {f.mileage && <span style={{ fontSize: 10.5, color: T.muted, fontWeight: 400 }}> {meta.mUnit}</span>}
                    </div>
                    {!f.mileage && (
                      <div style={{ fontSize: 10, color: T.faint }}>{f.full ? "baseline" : "partial"}</div>
                    )}
                    <div className="num" style={{ fontSize: 12.5, color: T.muted, marginTop: 1 }}>₹{fmt(f.price * f.qty, 0)}</div>
                  </div>
                </div>

                {expandedFill === f.id && (
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingBottom: 12 }}>
                    <button
                      onClick={() => { setEditingFill(f); setExpandedFill(null); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.card, color: T.ink, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => armOrDeleteFill(f.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
                        borderRadius: 10,
                        border: `1px solid ${armDeleteFill === f.id ? T.danger : T.border}`,
                        background: armDeleteFill === f.id ? T.dangerSoft : T.card,
                        color: T.danger,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      <Trash2 size={13} /> {armDeleteFill === f.id ? "Tap to confirm" : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </Card>
        )}

        {/* ---------------- INSIGHTS ---------------- */}
        {tab === "insights" && (
          <Stack>
            {gradeStats.length > 1 && gradeVerdict && (
              <Card>
                <SectionTitle icon={FlaskConical}>Regular vs premium — is it worth it?</SectionTitle>
                <Row2>
                  {[gradeVerdict.reg, gradeVerdict.prem].map((g) => {
                    const winner = gradeVerdict.cheaper === (g.grade === "regular" ? "regular" : "premium");
                    return (
                      <div
                        key={g.grade}
                        style={{
                          border: `1.5px solid ${winner ? T.accent : T.border}`,
                          background: winner ? T.accentSoft : T.card,
                          borderRadius: 12,
                          padding: "12px 14px",
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                          {g.label}
                          {winner && <span style={{ color: T.accent, fontSize: 10.5 }}>cheaper / km</span>}
                        </div>
                        <div className="num" style={{ fontSize: 19, fontWeight: 600 }}>
                          ₹{fmt(g.costPerKm, 2)}<span style={{ fontSize: 11, color: T.muted, fontWeight: 400 }}>/km</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: T.muted, marginTop: 5, lineHeight: 1.5 }}>
                          {fmt(g.avgMileage)} {meta.mUnit} · ₹{fmt(g.avgPrice, 1)}/{meta.unit} · {g.n} tank{g.n > 1 ? "s" : ""}
                        </div>
                      </div>
                    );
                  })}
                </Row2>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: "#3C4148", marginTop: GAP }}>
                  Premium gave <b className="num">{gradeVerdict.mGain >= 0 ? "+" : ""}{fmt(gradeVerdict.mGain)}%</b> mileage
                  but costs <b className="num">+{fmt(gradeVerdict.pGain)}%</b> per {meta.unit} — so{" "}
                  <b>{gradeVerdict.cheaper}</b> works out ~<b className="num">₹{fmt(gradeVerdict.diff, 2)}/km</b> cheaper for
                  this vehicle so far.{gradeVerdict.prem.n < 3 && " Log a few more premium tanks before trusting this fully."}
                </div>
              </Card>
            )}
            {gradeStats.length <= 1 && grades.length > 1 && (() => {
              const used = gradeStats[0];
              const untried = grades.find((g) => g.id !== used?.grade) || grades[0];
              return (
                <Card style={{ background: "rgba(14,138,112,0.08)" }}>
                  <SectionTitle>Try {untried.label.toLowerCase()}</SectionTitle>
                  <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                    You've only used {used?.label.toLowerCase() || "one grade"} so far. Fill 2–3 tanks of {untried.label.toLowerCase()} and
                    Refuel will tell you whether it's worth it on this engine.
                  </div>
                </Card>
              );
            })()}

            <Card>
              <SectionTitle>Mileage by pump brand</SectionTitle>
              {brandStats.length === 0 && <div style={{ fontSize: 13, color: T.muted }}>Log a few full tanks to compare brands.</div>}
              {brandStats.map((b, i) => (
                <div key={b.brand} style={{ display: "grid", gridTemplateColumns: "112px 1fr 74px", alignItems: "center", gap: 10, marginBottom: i < brandStats.length - 1 ? 9 : 0 }}>
                  <div style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? T.ink : T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {b.brand}
                  </div>
                  <div style={{ height: 6, background: "#F1F1EF", borderRadius: 99 }}>
                    <div style={{ width: `${(b.avg / brandStats[0].avg) * 100}%`, height: "100%", background: i === 0 ? T.accent : T.faint, borderRadius: 99 }} />
                  </div>
                  <div className="num" style={{ textAlign: "right", fontSize: 13, fontWeight: 600 }}>
                    {fmt(b.avg)} <span style={{ fontSize: 10, color: T.faint, fontWeight: 400 }}>{meta.mUnit}</span>
                  </div>
                </div>
              ))}
              {brandStats.length > 0 && (
                <div style={{ fontSize: 11.5, color: T.faint, marginTop: 10 }}>
                  Averaged over full-tank cycles — more fills, more reliable.
                </div>
              )}
            </Card>

            <Card>
              <SectionTitle>Cost of driving</SectionTitle>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#3C4148" }}>
                Every 100 km on the {vehicle.name} costs about{" "}
                <b className="num">₹{fmt(stats.costPerKm ? stats.costPerKm * 100 : null, 0)}</b>. At the current pace,
                July's fuel bill for this vehicle lands near <b className="num">₹{fmt(stats.monthSpend * 1.7, 0)}</b>.
              </div>
            </Card>
          </Stack>
        )}

        {/* ---------------- GARAGE ---------------- */}
        {tab === "garage" && garageMode === "list" && (
          <Stack>
            {vehicles.map((v) => {
              const Icon = BODY_ICONS[v.body] || CarFront;
              const s = vehicleStats(v.id);
              return (
                <Card key={v.id} style={{ display: "grid", gridTemplateColumns: "44px 1fr 34px", alignItems: "center", gap: GAP }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: FUELS[v.fuel].soft, color: FUELS[v.fuel].tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={21} strokeWidth={1.8} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{v.name}</span>
                      <FuelBadge fuel={v.fuel} />
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {v.reg || "No reg. number"} · {s.fills} fill-ups
                      {s.avg && <> · <span className="num" style={{ fontWeight: 600, color: T.ink }}>{fmt(s.avg)}</span> {FUELS[v.fuel].mUnit}</>}
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditingId(v.id); setGarageMode("edit"); }}
                    aria-label={`Edit ${v.name}`}
                    style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.border}`, background: T.card, color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Pencil size={14} />
                  </button>
                </Card>
              );
            })}
            <button
              onClick={() => setGarageMode("add")}
              style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: `1.5px dashed ${T.faint}`, background: "transparent", color: T.muted, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'Inter', sans-serif" }}
            >
              <Plus size={16} /> Add a vehicle
            </button>

            <Card>
              <SectionTitle>Backup</SectionTitle>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 12 }}>
                Everything is stored only on this device. Export a backup before clearing browser data, or import one to restore.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={exportData}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.ink, fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'Inter', sans-serif" }}
                >
                  <Download size={15} /> Export
                </button>
                <button
                  onClick={() => importInputRef.current?.click()}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.ink, fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'Inter', sans-serif" }}
                >
                  <Upload size={15} /> Import
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json"
                  onChange={importData}
                  style={{ display: "none" }}
                />
              </div>
            </Card>
          </Stack>
        )}

        {tab === "garage" && garageMode !== "list" && (
          <VehicleForm
            key={editingId || "new"}
            initial={garageMode === "edit" ? vehicles.find((v) => v.id === editingId) : null}
            onSave={saveVehicle}
            onCancel={() => { setGarageMode("list"); setEditingId(null); }}
            onBack={() => { setGarageMode("list"); setEditingId(null); }}
            onDelete={garageMode === "edit" ? () => deleteVehicle(editingId) : undefined}
          />
        )}
      </div>

      {/* toast */}
      {toast && (
        <div className="glass-dark" style={{ position: "fixed", bottom: "calc(90px + env(safe-area-inset-bottom))", left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "10px 18px", borderRadius: 999, fontSize: 13, fontWeight: 500, zIndex: 60, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* bottom nav */}
      <div
        className="glass"
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "calc(14px + env(safe-area-inset-bottom))",
          borderRadius: 999,
          display: "flex",
          justifyContent: "center",
          padding: "8px 14px",
          zIndex: 50,
          width: "calc(100% - 24px)",
          maxWidth: 420,
        }}
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setEditingFill(null); setExpandedFill(null); setArmDeleteFill(null); if (t.id !== "garage") { setGarageMode("list"); setEditingId(null); } }}
              style={{
                flex: "1 1 0",
                minWidth: 0,
                padding: "9px 4px 7px",
                border: "none",
                background: "transparent",
                color: active ? T.ink : T.faint,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                fontSize: 10.5,
                fontWeight: active ? 600 : 500,
                fontFamily: "'Inter', sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={21} strokeWidth={active ? 2.1 : 1.7} />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
