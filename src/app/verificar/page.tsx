// ... mantenha seus imports e estados

async function onCheck() {
  try {
    setBusy(true);
    setError("");

    const payload = {
      // use o que você tiver nos seus estados:
      to: phoneE164 || phoneRaw || undefined,
      code: code.trim(),
    };

    const r = await fetch("/api/otp/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data?.ok) {
      setError(data?.error || "Código inválido ou expirado.");
      setBusy(false);
      return;
    }

    const e164 = data.phoneE164 || payload.to;
    // ★ redundância: grava o cookie também no client
    document.cookie =
      `qwip_phone_e164=${encodeURIComponent(e164)}; ` +
      `Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`;

    // redireciona para o destino protegido
    const dest = (redirectTo && redirectTo.startsWith("/")) ? redirectTo : "/anuncio/novo";

    // tenta replace primeiro (mantém histórico mais limpo)
    try {
      window.location.replace(dest);
    } catch {
      window.location.href = dest;
    }
  } catch (err) {
    setError("Falha ao verificar código.");
  } finally {
    setBusy(false);
  }
}
