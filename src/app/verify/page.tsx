'use client';
import { useState } from 'react';

export default function VerifyPage() {
  const [to, setTo] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  async function sendCode() {
    setMsg('');
    const r = await fetch('/api/otp/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to })
    });
    const data = await r.json();
    if (r.ok) { setSent(true); setMsg('Código enviado no WhatsApp.'); }
    else setMsg(data.error || 'Falhou ao enviar.');
  }

  async function checkCode() {
    setMsg('');
    const r = await fetch('/api/otp/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, code })
    });
    const data = await r.json();
    if (data.valid) {
      setMsg('Verificado! Redirecionando...');
      // aqui você pode salvar cookie/localStorage e mandar pra criação de anúncio
      window.location.href = '/criar'; // ajuste para sua rota
    } else {
      setMsg('Código inválido.');
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-bold">Confirmar seu WhatsApp</h1>
      <p className="text-sm opacity-80">Insira seu número com +55…</p>

      <input
        className="w-full rounded border p-3 bg-transparent"
        placeholder="+55DDDNÚMERO"
        value={to}
        onChange={e => setTo(e.target.value)}
      />

      {!sent ? (
        <button onClick={sendCode} className="w-full rounded bg-green-600 p-3 font-medium">
          Enviar código por WhatsApp
        </button>
      ) : (
        <>
          <input
            className="w-full rounded border p-3 bg-transparent"
            placeholder="Código de 6 dígitos"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <button onClick={checkCode} className="w-full rounded bg-green-600 p-3 font-medium">
            Confirmar código
          </button>
        </>
      )}

      {msg && <p className="text-sm">{msg}</p>}
      <p className="text-xs opacity-70">Usamos seu WhatsApp só para verificar. O código expira em alguns minutos.</p>
    </main>
  );
}
