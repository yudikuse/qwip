"use client";

import { useEffect, useRef, useState } from "react";

// ── Google Ads conversion helper ──────────────────────────────────────────────
declare global {
  interface Window { gtag?: (...args: unknown[]) => void; }
}
function fireConversion() {
  // Substitua AW-XXXXXXXXX/YYYYY pelo seu ID de conversão do Google Ads
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "conversion", {
      send_to: process.env.NEXT_PUBLIC_ADS_CONVERSION_ID ?? "AW-XXXXXXXXX/YYYYY",
    });
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Dor { id: string; n: string; t: string; d: string; }

const DORES: Dor[] = [
  { id: "pedido", n: "01", t: "O pedido sumiu no grupo", d: "Combinaram, ninguém executou, ninguém cobrou. Toda semana alguém pergunta \"mas isso foi pedido mesmo?\"" },
  { id: "margem", n: "02", t: "Vende bem, sobra pouco", d: "No fim do mês o saldo não bate com o movimento. Você não sabe ao certo qual produto ou serviço dá lucro de verdade." },
  { id: "lead",   n: "03", t: "Orçamento feito, cliente sumiu", d: "Ninguém fez follow-up. O cliente comprou do concorrente e você nem ficou sabendo. Acontece toda semana." },
  { id: "relat",  n: "04", t: "Relatório só no fim do mês", d: "Quando o problema aparece já passou. Você toma decisão olhando pro retrovisor, nunca pro para-brisa." },
];

export default function Home() {
  const [dor, setDor] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".r");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("v"); }),
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // WhatsApp mask
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

    // Webhook — substitua pela URL do n8n / Make / Zapier
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
          --black:#111110; --white:#faf9f7; --accent:#ff4d1c; --al:#fff2ee;
          --g50:#f5f4f1; --g100:#eceae5; --g300:#c5c2ba; --g500:#8c8980; --g700:#4e4c46; --g900:#1c1b19;
          --fd:'Bricolage Grotesque',sans-serif; --fb:'Instrument Sans',sans-serif;
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
        #dores{background:var(--black)}
        #dores h2{color:var(--white)}
        #dores .lead{color:var(--g300)}
        .dh{margin-bottom:52px}
        .dg{display:grid;grid-template-columns:repeat(2,1fr);gap:2px}
        @media(max-width:640px){.dg{grid-template-columns:1fr}}
        .dcard{background:var(--g900);padding:36px 32px 30px;cursor:pointer;transition:background .18s;border-radius:3px;display:flex;flex-direction:column}
        .dcard:hover{background:#252422}
        .dcard.on{background:var(--accent)}
        .dn{font-family:var(--fd);font-size:11px;font-weight:600;letter-spacing:.1em;color:var(--g500);margin-bottom:18px}
        .dcard.on .dn{color:rgba(255,255,255,.6)}
        .dt{font-family:var(--fd);font-size:22px;font-weight:700;color:var(--white);letter-spacing:-.025em;line-height:1.2;margin-bottom:10px}
        .dd{font-size:14px;color:var(--g300);line-height:1.65;margin-bottom:28px;flex:1}
        .dcard.on .dd{color:rgba(255,255,255,.8)}
        .dbtn{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;color:var(--g300);background:rgba(255,255,255,.07);border:none;padding:9px 16px;border-radius:999px;cursor:pointer;align-self:flex-start;transition:background .15s,color .15s}
        .dbtn:hover{background:rgba(255,255,255,.13);color:var(--white)}
        .dcard.on .dbtn{background:rgba(255,255,255,.25);color:#fff}
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
        .cases{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:52px}
        @media(max-width:640px){.cases{grid-template-columns:1fr}}
        .case{background:var(--g50);border-radius:16px;padding:36px;position:relative;overflow:hidden}
        .case::before{content:'"';position:absolute;top:12px;right:28px;font-family:var(--fd);font-size:88px;font-weight:800;color:var(--g100);line-height:1;pointer-events:none}
        .cseg{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
        .cprob{font-size:13px;color:var(--g500);margin-bottom:14px;line-height:1.6}
        .cres{font-family:var(--fd);font-size:18px;font-weight:700;letter-spacing:-.02em;line-height:1.35;margin-bottom:24px}
        .tags{display:flex;flex-wrap:wrap;gap:6px}
        .tag{font-size:12px;padding:4px 11px;background:var(--white);border-radius:999px;color:var(--g700)}
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

      {/* NAV */}
      <nav>
        <div className="ni">
          <a href="#" className="logo">qwip<span>.</span></a>
          <a href="#contato" className="nb">Falar com a gente</a>
        </div>
      </nav>

      {/* HERO */}
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

      {/* DORES */}
      <section id="dores">
        <div className="c">
          <div className="dh r">
            <div className="lbl">Você se identifica?</div>
            <h2>Escolha a dor<br />que mais dói.</h2>
            <p className="lead">Clique no cartão que mais parece com o seu dia a dia.</p>
          </div>
          <div className="dg">
            {DORES.map((d) => (
              <div key={d.id} className={`dcard r${dor === d.t ? " on" : ""}`} data-dor={d.t}>
                <div className="dn">{d.n}</div>
                <div className="dt">{d.t}</div>
                <div className="dd">{d.d}</div>
                <button className="dbtn" onClick={() => pickDor(d)}>Esse é o meu problema →</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
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

      {/* PROVA */}
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

      {/* CONTATO */}
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
                  <form ref={formRef} onSubmit={handleSubmit}>
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

      {/* FOOTER */}
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
