"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window { gtag?: (...args: unknown[]) => void; }
}
function fireConversion() {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "conversion", {
      send_to: process.env.NEXT_PUBLIC_ADS_CONVERSION_ID ?? "",
    });
  }
}

interface Dor { id: string; n: string; t: string; d: string; }

const DORES: Dor[] = [
  { id: "pedido", n: "01", t: "O pedido sumiu no grupo", d: "Combinaram, ninguém executou, ninguém cobrou." },
  { id: "margem", n: "02", t: "Vende bem, sobra pouco", d: "Você não sabe qual produto dá lucro de verdade." },
  { id: "lead",   n: "03", t: "Orçamento feito, cliente sumiu", d: "Ninguém fez follow-up. Comprou do concorrente." },
  { id: "relat",  n: "04", t: "Relatório só no fim do mês", d: "Problema visto tarde demais para resolver." },
];

function ScenePedido() {
  return (
    <div style={{background:"#111",borderRadius:10,padding:"14px 12px",display:"flex",flexDirection:"column",gap:8,fontFamily:"system-ui,sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <div style={{width:28,height:28,borderRadius:"50%",background:"#25d366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>G</div>
        <span style={{color:"#aaa",fontSize:12}}>Grupo Obras — 47 membros</span>
      </div>
      {[
        {msg:"Precisa de 50 sacos de cimento pra amanhã",time:"08:14",own:false},
        {msg:"Alguém viu isso? 👆",time:"10:32",own:false},
        {msg:"???",time:"13:55",own:false},
      ].map((m,i) => (
        <div key={i} style={{display:"flex",justifyContent:m.own?"flex-end":"flex-start"}}>
          <div style={{background:m.own?"#005c4b":"#2a2a2a",borderRadius:8,padding:"6px 10px",maxWidth:"80%"}}>
            <div style={{color:"#e9e9e9",fontSize:12,lineHeight:1.4}}>{m.msg}</div>
            <div style={{color:"#888",fontSize:10,textAlign:"right",marginTop:3}}>{m.time}</div>
          </div>
        </div>
      ))}
      <div style={{background:"#ff4d1c22",border:"1px solid #ff4d1c44",borderRadius:6,padding:"5px 10px",marginTop:4}}>
        <span style={{color:"#ff4d1c",fontSize:11,fontWeight:600}}>⚠ Sem resposta há 2 dias — ninguém comprou</span>
      </div>
    </div>
  );
}

function SceneMargem() {
  const bars = [
    {label:"Jan",venda:18400,lucro:612},
    {label:"Fev",venda:21200,lucro:430},
    {label:"Mar",venda:19800,lucro:890},
  ];
  const maxV = 22000;
  return (
    <div style={{background:"#111",borderRadius:10,padding:"14px 12px",fontFamily:"system-ui,sans-serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <span style={{color:"#aaa",fontSize:11}}>Vendas vs Lucro real</span>
        <div style={{display:"flex",gap:12}}>
          <span style={{color:"#4ade80",fontSize:10}}>● Vendas</span>
          <span style={{color:"#ff4d1c",fontSize:10}}>● Lucro</span>
        </div>
      </div>
      <div style={{display:"flex",gap:16,alignItems:"flex-end",height:80}}>
        {bars.map((b,i) => (
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{width:"100%",display:"flex",gap:3,alignItems:"flex-end",height:64}}>
              <div style={{flex:1,background:"#4ade8033",borderRadius:"3px 3px 0 0",height:`${(b.venda/maxV)*100}%`,border:"1px solid #4ade8066"}}/>
              <div style={{flex:1,background:"#ff4d1c55",borderRadius:"3px 3px 0 0",height:`${Math.max((b.lucro/maxV)*100,3)}%`,border:"1px solid #ff4d1c88"}}/>
            </div>
            <span style={{color:"#666",fontSize:10}}>{b.label}</span>
          </div>
        ))}
      </div>
      <div style={{marginTop:10,background:"#ff4d1c22",border:"1px solid #ff4d1c44",borderRadius:6,padding:"5px 10px"}}>
        <span style={{color:"#ff4d1c",fontSize:11,fontWeight:600}}>⚠ R$ 19.800 vendidos → R$ 890 sobraram (4,5%)</span>
      </div>
    </div>
  );
}

function SceneLead() {
  return (
    <div style={{background:"#111",borderRadius:10,padding:"14px 12px",display:"flex",flexDirection:"column",gap:8,fontFamily:"system-ui,sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <div style={{width:28,height:28,borderRadius:"50%",background:"#3b82f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700}}>C</div>
        <div>
          <div style={{color:"#e9e9e9",fontSize:12,fontWeight:600}}>Cliente Potencial</div>
          <div style={{color:"#666",fontSize:10}}>visto por último há 5 dias</div>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <div style={{background:"#005c4b",borderRadius:8,padding:"6px 10px",maxWidth:"85%"}}>
          <div style={{color:"#e9e9e9",fontSize:12,lineHeight:1.4}}>Segue o orçamento que conversamos! Qualquer dúvida é só falar 👍</div>
          <div style={{color:"#888",fontSize:10,textAlign:"right",marginTop:3,display:"flex",justifyContent:"flex-end",gap:4,alignItems:"center"}}>
            <span>Seg 09:14</span>
            <span style={{color:"#53bdeb"}}>✓✓</span>
          </div>
        </div>
      </div>
      <div style={{textAlign:"center",color:"#555",fontSize:11,padding:"4px 0"}}>— Seg · Ter · Qua · Qui · Sex —</div>
      <div style={{background:"#ff4d1c22",border:"1px solid #ff4d1c44",borderRadius:6,padding:"5px 10px"}}>
        <span style={{color:"#ff4d1c",fontSize:11,fontWeight:600}}>⚠ Lido. Sem resposta. Nenhum follow-up feito.</span>
      </div>
    </div>
  );
}

function SceneRelatorio() {
  const days = Array.from({length:31},(_,i)=>i+1);
  const problemDay = 8;
  const reportDay = 31;
  return (
    <div style={{background:"#111",borderRadius:10,padding:"14px 12px",fontFamily:"system-ui,sans-serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
        <span style={{color:"#aaa",fontSize:11}}>Março 2025</span>
        <div style={{display:"flex",gap:12}}>
          <span style={{color:"#ff4d1c",fontSize:10}}>● Problema surgiu</span>
          <span style={{color:"#facc15",fontSize:10}}>● Você descobriu</span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {["D","S","T","Q","Q","S","S"].map((d,i)=>(
          <div key={i} style={{color:"#555",fontSize:9,textAlign:"center",paddingBottom:2}}>{d}</div>
        ))}
        {Array.from({length:5}).map((_,i)=>(
          <div key={`e${i}`} style={{height:22}}/>
        ))}
        {days.map(d=>(
          <div key={d} style={{
            height:22,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,
            background: d===problemDay?"#ff4d1c33": d===reportDay?"#facc1533":"transparent",
            border: d===problemDay?"1px solid #ff4d1c": d===reportDay?"1px solid #facc15":"1px solid transparent",
            color: d===problemDay?"#ff4d1c": d===reportDay?"#facc15":"#666",
            fontWeight: d===problemDay||d===reportDay?700:400,
          }}>{d}</div>
        ))}
      </div>
      <div style={{marginTop:10,background:"#ff4d1c22",border:"1px solid #ff4d1c44",borderRadius:6,padding:"5px 10px"}}>
        <span style={{color:"#ff4d1c",fontSize:11,fontWeight:600}}>⚠ Problema no dia 8 — você viu só no dia 31</span>
      </div>
    </div>
  );
}

const SCENES = [ScenePedido, SceneMargem, SceneLead, SceneRelatorio];

export default function Home() {
  const [dor, setDor] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".r");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("v"); }),
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function maskZap(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (v.length >= 7) v = "(" + v.slice(0,2) + ") " + v.slice(2,7) + "-" + v.slice(7);
    else if (v.length >= 3) v = "(" + v.slice(0,2) + ") " + v.slice(2);
    e.target.value = v;
  }

  function pickDor(d: Dor) {
    setDor(d.t);
    setTimeout(() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth", block: "start" }), 280);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const WEBHOOK = process.env.NEXT_PUBLIC_WEBHOOK_URL;
    if (WEBHOOK) {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(console.error);
    }
    fireConversion();
    setSubmitted(true);
  }

  return (
    <>
      <style>{`
        :root {
          --black:#111110;--white:#faf9f7;--accent:#ff4d1c;--al:#fff2ee;
          --g50:#f5f4f1;--g100:#eceae5;--g300:#c5c2ba;--g500:#8c8980;--g700:#4e4c46;--g900:#1c1b19;
          --fd:'Bricolage Grotesque',sans-serif;--fb:'Instrument Sans',sans-serif;
        }
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:var(--fb);background:var(--white);color:var(--black);line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased}
        .c{max-width:1060px;margin:0 auto;padding:0 28px}
        nav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(250,249,247,.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--g100)}
        .ni{max-width:1060px;margin:0 auto;padding:0 28px;height:58px;display:flex;align-items:center;justify-content:space-between}
        .logo{font-family:var(--fd);font-weight:700;font-size:21px;letter-spacing:-.03em;color:var(--black);text-decoration:none}
        .logo span{color:var(--accent)}
        .nb{font-family:var(--fb);font-size:14px;font-weight:500;padding:9px 22px;background:var(--black);color:var(--white);border:none;border-radius:999px;cursor:pointer;text-decoration:none;transition:background .18s,transform .1s;display:inline-block}
        .nb:hover{background:var(--accent);transform:translateY(-1px)}
        section{padding:96px 0}
        #hero{padding:148px 0 96px}
        .pill{display:inline-flex;align-items:center;gap:7px;background:var(--al);color:var(--accent);font-size:13px;font-weight:500;padding:5px 13px;border-radius:999px;margin-bottom:32px;opacity:0;animation:up .55s .05s ease forwards}
        .pill i{width:7px;height:7px;background:var(--accent);border-radius:50%;flex-shrink:0;display:block;font-style:normal}
        h1{font-family:var(--fd);font-size:clamp(46px,6.5vw,76px);font-weight:700;line-height:1.0;letter-spacing:-.03em;margin-bottom:28px;opacity:0;animation:up .55s .15s ease forwards}
        h1 em{font-style:normal;color:var(--accent)}
        .hl{font-size:clamp(17px,2vw,19px);font-weight:400;color:var(--g700);max-width:520px;margin-bottom:44px;line-height:1.7;opacity:0;animation:up .55s .25s ease forwards}
        .ha{display:flex;gap:14px;align-items:center;flex-wrap:wrap;opacity:0;animation:up .55s .35s ease forwards}
        .bp{font-size:16px;font-weight:500;padding:15px 34px;background:var(--accent);color:#fff;border:none;border-radius:999px;cursor:pointer;text-decoration:none;display:inline-block;transition:transform .15s,box-shadow .15s}
        .bp:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(255,77,28,.28)}
        .bg{font-size:15px;color:var(--g700);font-weight:400;background:none;border:none;cursor:pointer;text-decoration:none;display:flex;align-items:center;gap:5px}
        .bg:hover{color:var(--black)}
        .lbl{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
        h2{font-family:var(--fd);font-size:clamp(30px,4vw,46px);font-weight:700;letter-spacing:-.03em;line-height:1.1;margin-bottom:18px}
        .lead{font-size:18px;font-weight:400;color:var(--g700);max-width:500px;line-height:1.7}

        /* DORES */
        #dores{background:var(--black)}
        #dores h2{color:var(--white)}
        #dores .lead{color:var(--g300)}
        .dh{margin-bottom:52px}
        .dg{display:grid;grid-template-columns:repeat(2,1fr);gap:2px}
        @media(max-width:640px){.dg{grid-template-columns:1fr}}

        .dcard{
          background:var(--g900);padding:28px;cursor:pointer;
          transition:background .18s,transform .15s;border-radius:3px;
          display:flex;flex-direction:column;gap:16px;
        }
        .dcard:hover{background:#202020;transform:translateY(-2px)}
        .dcard.on{background:#1a0d09;outline:1.5px solid var(--accent)}

        .scene-wrap{border-radius:8px;overflow:hidden;pointer-events:none;user-select:none}

        .dcard-body{display:flex;flex-direction:column;gap:8px}
        .dn{font-family:var(--fd);font-size:11px;font-weight:600;letter-spacing:.1em;color:var(--g500)}
        .dcard.on .dn{color:rgba(255,100,50,.7)}
        .dt{font-family:var(--fd);font-size:20px;font-weight:700;color:var(--white);letter-spacing:-.025em;line-height:1.2}
        .dd{font-size:13px;color:var(--g300);line-height:1.6}

        .dbtn{
          display:inline-flex;align-items:center;gap:6px;
          font-size:13px;font-weight:500;color:var(--g300);
          background:rgba(255,255,255,.07);border:none;padding:9px 16px;
          border-radius:999px;cursor:pointer;align-self:flex-start;
          transition:background .15s,color .15s;
        }
        .dbtn:hover{background:rgba(255,255,255,.13);color:var(--white)}
        .dcard.on .dbtn{background:var(--accent);color:#fff}

        /* COMO */
        #como{background:var(--g50)}
        .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:56px}
        @media(max-width:680px){.steps{grid-template-columns:1fr}}
        .step{background:var(--white);padding:36px 30px;border-radius:3px}
        .sn{font-family:var(--fd);font-size:56px;font-weight:800;color:var(--g100);line-height:1;letter-spacing:-.04em;margin-bottom:20px}
        .st{font-family:var(--fd);font-size:18px;font-weight:700;letter-spacing:-.02em;margin-bottom:8px}
        .sd{font-size:14px;color:var(--g700);line-height:1.7}
        .ba{display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-top:2px}
        @media(max-width:640px){.ba{grid-template-columns:1fr}}
        .bac{padding:36px 32px;border-radius:3px}
        .bac.b{background:var(--g100)}
        .bac.a{background:var(--black)}
        .bal{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;margin-bottom:24px;opacity:.45;color:var(--black)}
        .bac.a .bal{color:var(--white)}
        .blist{list-style:none;display:flex;flex-direction:column;gap:13px}
        .blist li{font-size:15px;display:flex;align-items:flex-start;gap:10px;line-height:1.5;color:var(--g700)}
        .bac.a .blist li{color:var(--g300)}
        .blist li::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--g300);flex-shrink:0;margin-top:8px}
        .bac.a .blist li::before{background:var(--accent)}

        /* PROVA */
        .cases{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:52px}
        @media(max-width:640px){.cases{grid-template-columns:1fr}}
        .case{background:var(--g50);border-radius:16px;padding:36px;position:relative;overflow:hidden}
        .case::before{content:'"';position:absolute;top:12px;right:28px;font-family:var(--fd);font-size:88px;font-weight:800;color:var(--g100);line-height:1;pointer-events:none}
        .cseg{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
        .cprob{font-size:13px;color:var(--g500);margin-bottom:14px;line-height:1.6}
        .cres{font-family:var(--fd);font-size:18px;font-weight:700;letter-spacing:-.02em;line-height:1.35;margin-bottom:24px}
        .tags{display:flex;flex-wrap:wrap;gap:6px}
        .tag{font-size:12px;padding:4px 11px;background:var(--white);border-radius:999px;color:var(--g700)}

        /* CONTATO */
        #contato{background:var(--g50)}
        .cw{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start}
        @media(max-width:760px){.cw{grid-template-columns:1fr;gap:48px}}
        .ben{display:flex;align-items:flex-start;gap:10px;font-size:15px;color:var(--g700);margin-bottom:14px}
        .ben::before{content:'✓';color:var(--accent);font-weight:600;flex-shrink:0;margin-top:1px}
        .fbox{background:var(--white);border-radius:20px;padding:40px;border:1px solid var(--g100)}
        .ptag{display:none;align-items:center;gap:8px;background:var(--al);color:var(--accent);font-size:13px;font-weight:500;padding:9px 14px;border-radius:10px;margin-bottom:20px}
        .ptag.on{display:flex}
        .ptag button{background:none;border:none;font-size:18px;line-height:1;cursor:pointer;color:var(--accent);margin-left:auto}
        .fg{margin-bottom:18px}
        label{display:block;font-size:13px;font-weight:500;color:var(--g700);margin-bottom:6px}
        input,select{width:100%;font-family:var(--fb);font-size:15px;color:var(--black);background:var(--g50);border:1px solid var(--g100);border-radius:10px;padding:13px 16px;outline:none;transition:border-color .15s,background .15s;-webkit-appearance:none}
        input:focus,select:focus{border-color:var(--accent);background:var(--white)}
        select{background-image:url("data:image/svg+xml,%3Csvg width='11' height='7' viewBox='0 0 11 7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5.5 6L10 1' stroke='%238c8980' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:38px;cursor:pointer}
        .fsub{width:100%;font-family:var(--fd);font-size:16px;font-weight:700;letter-spacing:-.01em;padding:16px;background:var(--accent);color:#fff;border:none;border-radius:12px;cursor:pointer;transition:transform .15s,box-shadow .15s;margin-top:8px}
        .fsub:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(255,77,28,.28)}
        .fdis{font-size:12px;color:var(--g500);text-align:center;margin-top:12px}
        .fsuc{display:none;text-align:center;padding:40px 16px}
        .fsuc.on{display:block}
        .fsuc h3{font-family:var(--fd);font-size:22px;font-weight:700;letter-spacing:-.02em;margin:16px 0 10px}
        .fsuc p{font-size:15px;color:var(--g700)}
        footer{background:var(--black);color:var(--g500);padding:36px 0;font-size:13px}
        .fi{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
        .fl{font-family:var(--fd);font-weight:700;font-size:17px;color:var(--white);letter-spacing:-.03em}
        .fl span{color:var(--accent)}
        @keyframes up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .r{opacity:0;transform:translateY(22px);transition:opacity .55s ease,transform .55s ease}
        .r.v{opacity:1;transform:translateY(0)}
        @media(max-width:580px){nav .nb{display:none}#hero{padding:108px 0 72px}}
      `}</style>

      <nav>
        <div className="ni">
          <a href="#" className="logo">qwip<span>.</span></a>
          <a href="#contato" className="nb">Falar com a gente</a>
        </div>
      </nav>

      <section id="hero">
        <div className="c">
          <div className="pill"><i />Para varejo e serviços</div>
          <h1>Do caos<br />ao controle,<br /><em>rápido.</em></h1>
          <p className="hl">Seu negócio roda no WhatsApp e na planilha — e você sabe que isso tem um limite. A gente constrói a ferramenta certa para o seu problema específico.</p>
          <div className="ha">
            <a href="#dores" className="bp">Qual é o seu problema?</a>
            <a href="#como" className="bg">Como funciona ↓</a>
          </div>
        </div>
      </section>

      <section id="dores">
        <div className="c">
          <div className="dh r">
            <div className="lbl">Você se identifica?</div>
            <h2>Escolha a dor<br />que mais dói.</h2>
            <p className="lead">Clique no cartão que mais parece com o seu dia a dia.</p>
          </div>
          <div className="dg">
            {DORES.map((d, i) => {
              const Scene = SCENES[i];
              return (
                <div key={d.id} className={`dcard r${dor === d.t ? " on" : ""}`}>
                  <div className="scene-wrap"><Scene /></div>
                  <div className="dcard-body">
                    <div className="dn">{d.n}</div>
                    <div className="dt">{d.t}</div>
                    <div className="dd">{d.d}</div>
                    <button className="dbtn" onClick={() => pickDor(d)}>Esse é o meu problema →</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="como">
        <div className="c">
          <div className="r">
            <div className="lbl">O processo</div>
            <h2>Simples do início ao fim.</h2>
          </div>
          <div className="steps">
            {[
              { n:"01", t:"Conversa de diagnóstico", d:"30 minutos entendendo como o seu negócio funciona hoje. Sem PowerPoint, sem proposta genérica. A gente ouve primeiro." },
              { n:"02", t:"Proposta em 48h", d:"Solução desenhada para o seu problema, com escopo claro, prazo definido e valor justo — sem surpresas." },
              { n:"03", t:"Entrega em semanas", d:"Não meses. A ferramenta entra funcionando no dia a dia da equipe rápido, com suporte direto." },
            ].map((s, i) => (
              <div key={s.n} className="step r" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="sn">{s.n}</div>
                <div className="st">{s.t}</div>
                <div className="sd">{s.d}</div>
              </div>
            ))}
          </div>
          <div className="ba r">
            <div className="bac b">
              <div className="bal">Antes</div>
              <ul className="blist">
                {["Pedido no grupo, sem confirmação","Planilha desatualizada ou inexistente","Relatório no fim do mês, tarde demais","Decisão na intuição, sem número","Processo que some quando a pessoa sai"].map(t => <li key={t}>{t}</li>)}
              </ul>
            </div>
            <div className="bac a">
              <div className="bal">Depois</div>
              <ul className="blist">
                {["Pedido registrado, rastreado, cobrado","Dados em tempo real, do celular","Alerta antes do problema virar crise","Dashboard com o que realmente importa","O processo roda independente de quem"].map(t => <li key={t}>{t}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="prova">
        <div className="c">
          <div className="r">
            <div className="lbl">Projetos reais</div>
            <h2>Quem já parou<br />de improvisar.</h2>
          </div>
          <div className="cases">
            <div className="case r">
              <div className="cseg">Construção civil — Goiás</div>
              <div className="cprob">Pedidos chegavam em grupo de WhatsApp. Itens se perdiam, cotações sem rastreio, ninguém sabia o status de nenhum pedido.</div>
              <div className="cres">&ldquo;Hoje cada pedido tem número, histórico e alerta de pendência. Sabemos o custo por equipamento em tempo real.&rdquo;</div>
              <div className="tags"><span className="tag">Leitor de WhatsApp</span><span className="tag">Dashboard de custos</span><span className="tag">Alertas automáticos</span></div>
            </div>
            <div className="case r" style={{ transitionDelay:"0.12s" }}>
              <div className="cseg">Varejo de moda — Minas Gerais</div>
              <div className="cprob">Compras no caderno, vendas anotadas à mão. Margem calculada na intuição. Estoque era uma estimativa.</div>
              <div className="cres">&ldquo;Em duas semanas descobrimos que dois produtos respondiam por 70% do lucro — e que vendia outros no prejuízo há meses.&rdquo;</div>
              <div className="tags"><span className="tag">Controle de estoque</span><span className="tag">Relatório de margem</span><span className="tag">Mini-ERP</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="contato">
        <div className="c">
          <div className="cw">
            <div className="r">
              <div className="lbl">Vamos conversar</div>
              <h2>30 minutos.<br />Sem compromisso.</h2>
              <p style={{ fontSize:16, color:"var(--g700)", marginBottom:36, lineHeight:1.75, maxWidth:400 }}>
                Manda o seu problema. A gente responde em até 24h com uma visão honesta de como resolver.
              </p>
              {["Diagnóstico gratuito e sem enrolação","Proposta em 48h com escopo e valor","Entrega em semanas, não meses","Suporte direto — sem intermediário","Sem contrato longo nem mensalidade surpresa"].map(b => (
                <div key={b} className="ben">{b}</div>
              ))}
            </div>
            <div className="r" style={{ transitionDelay:"0.15s" }}>
              <div className="fbox">
                {dor && (
                  <div className="ptag on">
                    <span>✓ {dor}</span>
                    <button onClick={() => setDor("")}>×</button>
                  </div>
                )}
                {!submitted ? (
                  <form onSubmit={handleSubmit}>
                    <input type="hidden" name="dor_selecionada" value={dor} />
                    <div className="fg"><label htmlFor="nome">Seu nome</label><input type="text" id="nome" name="nome" placeholder="Como posso te chamar?" required /></div>
                    <div className="fg"><label htmlFor="zap">WhatsApp</label><input type="tel" id="zap" name="whatsapp" placeholder="(11) 99999-9999" onChange={maskZap} required /></div>
                    <div className="fg">
                      <label htmlFor="setor">Seu negócio</label>
                      <select id="setor" name="setor" required defaultValue="">
                        <option value="" disabled>Selecione o setor</option>
                        {["Varejo / loja","Construção / obras","Serviços técnicos","Alimentação","Saúde / clínica","Logística / transporte","Outro"].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="fg">
                      <label htmlFor="problema">Maior problema hoje</label>
                      <select id="problema" name="problema" value={dor} onChange={e => setDor(e.target.value)} required>
                        <option value="" disabled>Selecione a dor principal</option>
                        {["Pedido sumiu no grupo","Vende bem, sobra pouco","Orçamento feito, cliente sumiu","Relatório só no fim do mês","Outro problema"].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="fsub">Quero resolver isso →</button>
                    <p className="fdis">Respondemos em até 24h por WhatsApp. Sem spam.</p>
                  </form>
                ) : (
                  <div className="fsuc on">
                    <div style={{ fontSize:44 }}>✓</div>
                    <h3>Recebemos!</h3>
                    <p>Entramos em contato em até 24h pelo WhatsApp.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="c">
          <div className="fi">
            <div className="fl">qwip<span>.</span></div>
            <div>Automação para pequenas empresas.</div>
            <div>qwip.pro</div>
          </div>
        </div>
      </footer>
    </>
  );
}
