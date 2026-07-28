import React, { useState, useMemo } from 'react';

// ---- Design tokens, matched to the Guestly logo gradient (cyan -> violet -> magenta) ----
const C = {
  ink: '#15131C',        // near-black text
  paper: '#FFFFFF',
  mist: '#F6F5FA',        // faint lavender-white surface
  line: '#E7E4F0',
  cyan: '#22E5EA',
  violet: '#5B21B6',
  magenta: '#E619C8',
  slate: '#6B6878',       // secondary text
  green: '#1F9D6B',
};

const GRAD = `linear-gradient(135deg, ${C.cyan} 0%, ${C.violet} 55%, ${C.magenta} 100%)`;

const ASPECTS = [
  { key: 'tisztasag', label: 'Tisztaság', icon: '✦' },
  { key: 'gyorsasag', label: 'Kiszolgálás gyorsasága', icon: '⚡' },
  { key: 'kiszolgalas', label: 'Kiszolgálás minősége', icon: '♥' },
  { key: 'etel', label: 'Étel-ital minősége', icon: '☕' },
  { key: 'hangulat', label: 'Hangulat', icon: '✺' },
];

function seedData() {
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const days = ['Hét', 'Ked', 'Sze', 'Csüt', 'Pén', 'Szo', 'Vas'];
  const hours = [8, 10, 12, 14, 16, 18, 20];
  const data = {};
  ASPECTS.forEach((a, ai) => {
    data[a.key] = days.map((d, di) =>
      hours.map((h) => {
        let base = 8.2 - ai * 0.15;
        if ((di === 4 || di === 5) && h >= 18) {
          if (a.key === 'gyorsasag') base -= 2.6;
          if (a.key === 'tisztasag') base -= 1.4;
        }
        if (h === 8) base += 0.6;
        const val = Math.max(1, Math.min(10, base + (rand() - 0.5) * 1.6));
        return Math.round(val * 10) / 10;
      })
    );
  });
  return { days, hours, data };
}

const DEMO = seedData();

function avg(arr) {
  const flat = arr.flat();
  return flat.reduce((s, v) => s + v, 0) / flat.length;
}

function heatColor(v) {
  // 1 -> magenta (needs attention), 10 -> green (great), through mist
  const t = (v - 1) / 9;
  const from = [230, 25, 200]; // magenta
  const mid = [246, 245, 250]; // mist
  const to = [31, 157, 107]; // green
  let r, g, b;
  if (t < 0.5) {
    const k = t / 0.5;
    r = from[0] + (mid[0] - from[0]) * k;
    g = from[1] + (mid[1] - from[1]) * k;
    b = from[2] + (mid[2] - from[2]) * k;
  } else {
    const k = (t - 0.5) / 0.5;
    r = mid[0] + (to[0] - mid[0]) * k;
    g = mid[1] + (to[1] - mid[1]) * k;
    b = mid[2] + (to[2] - mid[2]) * k;
  }
  return `rgb(${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)})`;
}

// ---- Shared brand mark: a small gradient glyph + tight, geometric wordmark ----
function Wordmark({ size = 22, dark = false }) {
  const textColor = dark ? C.paper : C.ink;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        width: size * 0.9, height: size * 0.9, borderRadius: 6, background: GRAD,
        flexShrink: 0,
      }} />
      <span style={{
        fontSize: size * 0.82, fontWeight: 700, letterSpacing: '-0.01em', color: textColor,
      }}>
        Guestly
      </span>
    </div>
  );
}

// ---- Screens ----

function Landing({ onScan }) {
  return (
    <div style={{
      minHeight: '100%', background: C.paper,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.slate, marginBottom: 22, fontWeight: 600 }}>
        Asztali kártya · Demó
      </div>
      <div style={{
        width: 168, height: 168, background: C.paper, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28, boxShadow: '0 1px 2px rgba(21,19,28,0.06)', border: `1px solid ${C.line}`,
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 3, background: GRAD, borderRadius: '12px 12px 0 0' }} />
        <QRGlyph />
      </div>
      <h1 style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1.3, letterSpacing: '-0.02em', margin: '0 0 12px', maxWidth: 300, color: C.ink }}>
        Milyen volt ma nálunk?
      </h1>
      <p style={{ color: C.slate, fontSize: 15, maxWidth: 290, lineHeight: 1.5, margin: '0 0 32px' }}>
        Ha valami nem stimmelt, nem kell odahívnod senkit — csak írd meg itt, 30 másodperc alatt.
        Egy szerencsés értékelő ma egy ingyen kávét is nyer.
      </p>
      <button onClick={onScan} style={btnPrimary}>
        QR-kód beolvasása (demó)
      </button>
      <div style={{ marginTop: 44 }}>
        <Wordmark size={17} />
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: C.slate }}>
        Kávézó Aroma · Asztal #7
      </div>
    </div>
  );
}

function QRGlyph() {
  const cells = [];
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const isFinder = (i < 2 && j < 2) || (i < 2 && j > 5) || (i > 5 && j < 2);
      cells.push(isFinder || rand() > 0.52);
    }
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,14px)', gridTemplateRows: 'repeat(8,14px)', gap: 2, position: 'relative' }}>
      {cells.map((on, i) => (
        <div key={i} style={{ width: 14, height: 14, background: on ? C.ink : 'transparent' }} />
      ))}
    </div>
  );
}

function ScalePicker({ value, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              style={{
                flex: 1, height: 46, borderRadius: 8, cursor: 'pointer',
                border: active ? `2px solid ${C.ink}` : `1px solid ${C.line}`,
                background: active ? C.ink : C.paper,
                color: active ? '#fff' : C.ink,
                fontSize: 14, fontWeight: 700, fontFamily: 'system-ui, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px', fontSize: 11, color: C.slate }}>
        <span>😞 Rossz</span>
        <span>😍 Kiváló</span>
      </div>
    </div>
  );
}

function ProgressDots({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: i < current ? GRAD : i === current ? C.ink : C.line,
          opacity: i < current ? 0.5 : 1,
        }} />
      ))}
    </div>
  );
}

function ReviewForm({ onSubmit }) {
  const [step, setStep] = useState(0);
  const [ratings, setRatings] = useState({});
  const [reasons, setReasons] = useState({});
  const [askingReason, setAskingReason] = useState(false);
  const [reasonDraft, setReasonDraft] = useState('');
  const aspect = ASPECTS[step];

  const advance = (finalRatings) => {
    if (step < ASPECTS.length - 1) {
      setStep(step + 1);
    } else {
      onSubmit(finalRatings, reasons);
    }
  };

  const pick = (val) => {
    const next = { ...ratings, [aspect.key]: val };
    setRatings(next);
    if (val <= 3) {
      setReasonDraft('');
      setAskingReason(true);
    } else {
      setTimeout(() => advance(next), 220);
    }
  };

  const submitReason = () => {
    const nextReasons = { ...reasons, [aspect.key]: reasonDraft.trim() };
    setReasons(nextReasons);
    setAskingReason(false);
    advance(ratings);
  };

  const skipReason = () => {
    setAskingReason(false);
    advance(ratings);
  };

  if (askingReason) {
    return (
      <div style={{ minHeight: '100%', background: C.paper, padding: '28px 20px 60px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.violet, marginBottom: 4, fontWeight: 700 }}>
          Kávézó Aroma
        </div>
        <div style={{ fontSize: 12, color: C.slate, marginBottom: 18 }}>
          {step + 1}. kérdés az {ASPECTS.length}-ból
        </div>
        <ProgressDots total={ASPECTS.length} current={step} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 240 }}>
          <div style={{ fontSize: 30, textAlign: 'center', marginBottom: 10 }}>💬</div>
          <h1 style={{
            fontFamily: 'system-ui, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em',
            color: C.ink, margin: '0 0 8px', textAlign: 'center',
          }}>
            Mi ment rosszul?
          </h1>
          <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', margin: '0 0 20px' }}>
            Pár szó sokat segít — teljesen opcionális.
          </p>
          <textarea
            value={reasonDraft}
            onChange={(e) => setReasonDraft(e.target.value)}
            placeholder="Pl. sokáig kellett várni, hideg volt az étel…"
            maxLength={200}
            style={{
              width: '100%', boxSizing: 'border-box', height: 90, borderRadius: 10,
              border: `1px solid ${C.line}`, padding: '10px 12px', fontSize: 14,
              fontFamily: 'system-ui, sans-serif', outline: 'none', color: C.ink, resize: 'none',
            }}
          />
          <button onClick={submitReason} style={{ ...btnPrimary, width: '100%', marginTop: 14 }}>
            Tovább
          </button>
          <button
            onClick={skipReason}
            style={{ background: 'none', border: 'none', color: C.slate, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}
          >
            Kihagyom
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: C.paper, padding: '28px 20px 60px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.violet, marginBottom: 4, fontWeight: 700 }}>
        Kávézó Aroma
      </div>
      <div style={{ fontSize: 12, color: C.slate, marginBottom: 18 }}>
        {step + 1}. kérdés az {ASPECTS.length}-ból
      </div>
      <ProgressDots total={ASPECTS.length} current={step} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 240 }}>
        <div style={{ fontSize: 34, textAlign: 'center', marginBottom: 10 }}>{aspect.icon}</div>
        <h1 style={{
          fontFamily: 'system-ui, sans-serif', fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em',
          color: C.ink, margin: '0 0 28px', textAlign: 'center',
        }}>
          {aspect.label}
        </h1>
        <ScalePicker value={ratings[aspect.key]} onChange={pick} />
      </div>

      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          style={{ background: 'none', border: 'none', color: C.slate, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 20, alignSelf: 'center' }}
        >
          ← Előző kérdés
        </button>
      )}
    </div>
  );
}

function Thanks({ ratings, onPrizeEntry, onSkip }) {
  const overall = useMemo(() => {
    const vals = Object.values(ratings);
    return (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);
  }, [ratings]);

  return (
    <div style={{
      minHeight: '100%', background: C.ink,
      color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>☕</div>
      <h1 style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Köszönjük!</h1>
      <p style={{ opacity: 0.85, fontSize: 15, maxWidth: 280, lineHeight: 1.5, margin: '0 0 28px' }}>
        Átlagos értékelésed:{' '}
        <strong style={{
          background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        }}>{overall} / 10</strong>
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14, padding: '20px 22px', maxWidth: 320, marginBottom: 24,
      }}>
        <div style={{ fontSize: 26, marginBottom: 6 }}>🎁</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Szeretnél nyerni egy ingyen kávét?</div>
        <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.5, margin: '0 0 16px' }}>
          Add meg az e-mail címed a sorsoláshoz. Ez teljesen opcionális — az értékelésed enélkül is beérkezett.
        </p>
        <button onClick={onPrizeEntry} style={{ ...btnPrimary, width: '100%' }}>
          Részt veszek
        </button>
      </div>

      <button onClick={onSkip} style={{ ...btnGhost, opacity: 0.6 }}>
        Kihagyom, köszönöm
      </button>
    </div>
  );
}

function PrizeEntry({ onDone, onBack }) {
  const [email, setEmail] = useState('');
  return (
    <div style={{
      minHeight: '100%', background: C.paper, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🎁</div>
      <h1 style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', color: C.ink, margin: '0 0 8px' }}>
        Add meg az e-mail címed
      </h1>
      <p style={{ fontSize: 13.5, color: C.slate, maxWidth: 280, lineHeight: 1.5, margin: '0 0 8px' }}>
        Minden nap egy vendég nyer egy ingyen kávét az aznap értékelők között — csak a sorsoláshoz
        használjuk az e-mail címed, máshova nem kerül, nem küldünk hírlevelet.
      </p>
      <input
        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="nev@email.hu"
        style={{
          width: '100%', maxWidth: 300, boxSizing: 'border-box', height: 46, borderRadius: 10,
          border: `1px solid ${C.line}`, padding: '0 14px', fontSize: 14, marginBottom: 16, marginTop: 8,
          fontFamily: 'system-ui, sans-serif', outline: 'none', color: C.ink,
        }}
      />
      <button
        disabled={!email.includes('@')}
        onClick={onDone}
        style={{ ...btnPrimary, width: '100%', maxWidth: 300, opacity: email.includes('@') ? 1 : 0.4, cursor: email.includes('@') ? 'pointer' : 'not-allowed' }}
      >
        Jelentkezés a sorsolásra
      </button>
      <button onClick={onBack} style={{ ...navlessGhost, marginTop: 14 }}>
        ← Mégsem
      </button>
    </div>
  );
}

const navlessGhost = {
  background: 'none', border: 'none', color: '#6B6878', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

function PrizeConfirmed() {
  return (
    <div style={{
      minHeight: '100%', background: C.ink, color: '#fff', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>✓</div>
      <h1 style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
        Sikeres jelentkezés!
      </h1>
      <p style={{ opacity: 0.7, fontSize: 14, maxWidth: 300, lineHeight: 1.5, margin: '0 0 20px' }}>
        A mai nap végén kisorsolunk egy nyertest az aznap értékelők között.
      </p>
      <div style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14, padding: '16px 20px', maxWidth: 300, textAlign: 'left',
      }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.cyan, marginBottom: 8 }}>Ha nyersz, mi történik?</div>
        <div style={{ fontSize: 12.5, opacity: 0.8, lineHeight: 1.6 }}>
          E-mailben kapsz egy egyedi kupon-kódot. Legközelebbi látogatásodnál csak mutasd meg
          a pultnál — nincs szükség appra vagy regisztrációra.
        </div>
      </div>
      <div style={{ marginTop: 36 }}>
        <Wordmark size={16} dark />
      </div>
    </div>
  );
}
function Done() {
  return (
    <div style={{
      minHeight: '100%', background: C.ink, color: '#fff', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>☕</div>
      <h1 style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
        Köszönjük az időt!
      </h1>
      <p style={{ opacity: 0.7, fontSize: 14, maxWidth: 260, lineHeight: 1.5 }}>
        Az értékelésed megérkezett.
      </p>
      <div style={{ marginTop: 36 }}>
        <Wordmark size={16} dark />
      </div>
    </div>
  );
}

function Heatmap({ aspectKey }) {
  const { days, hours, data } = DEMO;
  const grid = data[aspectKey];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${hours.length}, 1fr)`, gap: 3, marginBottom: 6 }}>
        <div />
        {hours.map((h) => (
          <div key={h} style={{ fontSize: 10, color: C.slate, textAlign: 'center' }}>{h}h</div>
        ))}
      </div>
      {days.map((d, di) => (
        <div key={d} style={{ display: 'grid', gridTemplateColumns: `44px repeat(${hours.length}, 1fr)`, gap: 3, marginBottom: 3 }}>
          <div style={{ fontSize: 11, color: C.slate, display: 'flex', alignItems: 'center' }}>{d}</div>
          {grid[di].map((v, hi) => (
            <div
              key={hi}
              title={`${d} ${hours[hi]}h: ${v}`}
              style={{
                aspectRatio: '1', borderRadius: 5, background: heatColor(v),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: v < 5 ? '#fff' : C.ink,
              }}
            >
              {v.toFixed(1)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---- Synthetic per-submission log, for the admin entry-level view ----
const VENUES = ['Kávézó Aroma', 'Bisztró Nap', 'Sör & Prézli Bár'];

function seedSubmissions() {
  let seed = 1337;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const rows = [];
  const now = new Date('2026-07-25T21:00:00');
  for (let i = 0; i < 48; i++) {
    const minutesAgo = Math.floor(rand() * 60 * 24 * 7); // within the last 7 days
    const ts = new Date(now.getTime() - minutesAgo * 60000);
    const venue = VENUES[Math.floor(rand() * VENUES.length)];
    const scores = {};
    ASPECTS.forEach((a) => {
      scores[a.key] = Math.max(1, Math.min(10, Math.round(7.5 + (rand() - 0.5) * 5)));
    });
    const hasPrizeEntry = rand() > 0.4;
    rows.push({
      id: `SUB-${(1000 + i).toString(36).toUpperCase()}`,
      prizeId: hasPrizeEntry ? `PRZ-${(2000 + i).toString(36).toUpperCase()}` : null,
      email: hasPrizeEntry ? `vendeg${i}@example.com` : null,
      venue,
      ts,
      scores,
    });
  }
  return rows.sort((a, b) => b.ts - a.ts);
}
const SUBMISSIONS = seedSubmissions();

function fmtTs(d) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}. ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function AdminLog() {
  const [venueFilter, setVenueFilter] = useState('all');
  const [onlyPrize, setOnlyPrize] = useState(false);

  const rows = SUBMISSIONS.filter((r) => {
    if (venueFilter !== 'all' && r.venue !== venueFilter) return false;
    if (onlyPrize && !r.prizeId) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <select
          value={venueFilter}
          onChange={(e) => setVenueFilter(e.target.value)}
          style={{
            height: 34, borderRadius: 8, border: `1px solid ${C.line}`, background: C.paper,
            fontSize: 12, padding: '0 10px', color: C.ink, fontFamily: 'system-ui, sans-serif',
          }}
        >
          <option value="all">Összes egység</option>
          {VENUES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <button
          onClick={() => setOnlyPrize(!onlyPrize)}
          style={{
            height: 34, borderRadius: 8, border: onlyPrize ? `1px solid ${C.ink}` : `1px solid ${C.line}`,
            background: onlyPrize ? C.ink : C.paper, color: onlyPrize ? '#fff' : C.ink,
            fontSize: 12, fontWeight: 600, padding: '0 12px', cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
          }}
        >
          Csak sorsolásra jelentkezettek
        </button>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: C.slate, alignSelf: 'center' }}>
          {rows.length} találat
        </div>
      </div>

      <div style={{ overflowX: 'auto', background: C.paper, borderRadius: 12, border: `1px solid ${C.line}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 720 }}>
          <thead>
            <tr style={{ background: C.mist, textAlign: 'left' }}>
              <th style={th}>Szavazat ID</th>
              <th style={th}>Sorsolás ID</th>
              <th style={th}>E-mail</th>
              <th style={th}>Egység</th>
              <th style={th}>Időpont</th>
              {ASPECTS.map((a) => <th key={a.key} style={{ ...th, textAlign: 'center' }}>{a.label.split(' ')[0]}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: `1px solid ${C.line}` }}>
                <td style={{ ...td, fontFamily: 'monospace', color: C.violet, fontWeight: 700 }}>{r.id}</td>
                <td style={{ ...td, fontFamily: 'monospace', color: r.prizeId ? C.ink : C.slate }}>
                  {r.prizeId || '—'}
                </td>
                <td style={{ ...td, color: r.email ? C.ink : C.slate }}>{r.email || '—'}</td>
                <td style={td}>{r.venue}</td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, color: C.slate }}>{fmtTs(r.ts)}</td>
                {ASPECTS.map((a) => (
                  <td key={a.key} style={{ ...td, textAlign: 'center', fontWeight: 700, color: r.scores[a.key] < 6 ? C.magenta : C.ink }}>
                    {r.scores[a.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { padding: '9px 12px', fontSize: 11, fontWeight: 700, color: C.slate, whiteSpace: 'nowrap' };
const td = { padding: '9px 12px', whiteSpace: 'nowrap' };

function Dashboard({ onBack }) {
  const [view, setView] = useState('overview'); // overview | log
  const [selected, setSelected] = useState('gyorsasag');
  const overallByAspect = ASPECTS.map((a) => ({ ...a, avg: avg(DEMO.data[a.key]) }));
  const worst = [...overallByAspect].sort((a, b) => a.avg - b.avg)[0];

  return (
    <div style={{ minHeight: '100%', background: C.mist, padding: '20px 16px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Wordmark size={16} />
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.slate, fontSize: 13, cursor: 'pointer' }}>
          ← Vissza
        </button>
      </div>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.violet, fontWeight: 700, marginBottom: 8 }}>
        Tulajdonosi nézet
      </div>
      <h1 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: C.ink, margin: '0 0 4px' }}>
        Kávézó Aroma
      </h1>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 16 }}>
        Elmúlt 7 nap · 342 értékelés
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: C.line, borderRadius: 10, padding: 3, width: 'fit-content' }}>
        {[['overview', 'Áttekintés'], ['log', 'Napló']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            style={{
              border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              background: view === k ? C.paper : 'transparent', color: view === k ? C.ink : C.slate,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {view === 'log' ? (
        <AdminLog />
      ) : (
        <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
        {overallByAspect.map((a) => (
          <button
            key={a.key}
            onClick={() => setSelected(a.key)}
            style={{
              textAlign: 'left', border: selected === a.key ? `2px solid ${C.violet}` : `2px solid transparent`,
              background: C.paper, borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
              boxShadow: selected === a.key ? '0 4px 16px rgba(91,33,182,0.12)' : 'none',
            }}
          >
            <div style={{ fontSize: 12, color: C.slate, marginBottom: 4 }}>{a.icon} {a.label}</div>
            <div style={{
              fontFamily: 'system-ui, sans-serif', fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em',
              color: a.avg < 6.5 ? C.magenta : C.ink,
            }}>
              {a.avg.toFixed(1)}
            </div>
          </button>
        ))}
      </div>

      <div style={{ background: C.ink, color: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 18 }}>⚠</span>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          <strong style={{ color: C.cyan }}>{worst.label}</strong> gyengébb péntek–szombat 18–20h között — érdemes ilyenkor erősíteni a személyzetet.
        </div>
      </div>

      <div style={{ background: C.paper, borderRadius: 14, padding: 16, border: `1px solid ${C.line}` }}>
        <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: C.ink, marginBottom: 12 }}>
          {ASPECTS.find((a) => a.key === selected).label} — óránkénti bontás
        </div>
        <Heatmap aspectKey={selected} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 10, color: C.slate }}>
          <span>Figyelendő</span>
          <div style={{ flex: 1, height: 6, margin: '0 8px', borderRadius: 3, background: `linear-gradient(90deg, ${C.magenta}, ${C.mist}, ${C.green})` }} />
          <span>Erős</span>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

const btnPrimary = {
  background: C.ink, color: '#fff', border: 'none', borderRadius: 8,
  padding: '14px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.01em',
};

const btnGhost = {
  background: 'transparent', color: '#fff', border: `1px solid rgba(255,255,255,0.3)`,
  borderRadius: 8, padding: '10px 22px', fontSize: 13, cursor: 'pointer',
  fontFamily: 'system-ui, sans-serif', fontWeight: 600,
};

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [ratings, setRatings] = useState({});

  return (
    <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {screen === 'landing' && <Landing onScan={() => setScreen('form')} />}
      {screen === 'form' && <ReviewForm onSubmit={(r, reasons) => { setRatings(r); setScreen('thanks'); }} />}
      {screen === 'thanks' && (
        <Thanks
          ratings={ratings}
          onPrizeEntry={() => setScreen('prizeEntry')}
          onSkip={() => setScreen('done')}
        />
      )}
      {screen === 'prizeEntry' && (
        <PrizeEntry onDone={() => setScreen('prizeConfirmed')} onBack={() => setScreen('thanks')} />
      )}
      {screen === 'prizeConfirmed' && <PrizeConfirmed />}
      {screen === 'done' && <Done />}
      {screen === 'dashboard' && <Dashboard onBack={() => setScreen('landing')} />}
    </div>
  );
}
