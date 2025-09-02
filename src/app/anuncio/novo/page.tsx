// --- Mantém seus imports e estados exatamente como estão ---
// Substitua apenas esta função:
async function locateByCEP() {
  try {
    const cepDigits = cep.replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      alert("CEP inválido. Informe 8 dígitos.");
      return;
    }

    // 1) Tenta BrasilAPI (CEP v2) – costuma trazer lat/lng
    // Docs: https://brasilapi.com.br/docs#tag/CEP/operation/cepV2
    try {
      const r = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepDigits}`, {
        cache: "no-store",
      });
      if (r.ok) {
        const d = await r.json();
        const lat = d?.location?.coordinates?.latitude;
        const lng = d?.location?.coordinates?.longitude;
        if (typeof lat === "number" && typeof lng === "number") {
          setCoords({ lat, lng });
          const cityStr =
            d?.city && d?.state ? `${d.city} - ${d.state}` : "Atual";
          setCity(cityStr);
          return; // sucesso ✅
        }
      }
    } catch {
      // segue para fallback
    }

    // 2) Tenta ViaCEP -> monta endereço e busca no Nominatim
    // Docs ViaCEP: https://viacep.com.br
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
        cache: "no-store",
      });
      if (r.ok) {
        const d = await r.json();
        if (!d.erro) {
          const cidade = d.localidade;
          const uf = d.uf;
          // Preferimos logradouro; se vazio, cai para bairro/cidade
          const pedacoRua =
            d.logradouro || d.bairro || ""; // pode estar vazio, tudo bem
          const query = [pedacoRua, cidade && uf ? `${cidade} - ${uf}` : ""]
            .filter(Boolean)
            .join(", ");

          if (query) {
            const nq = encodeURIComponent(`${query}, Brasil`);
            const n = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${nq}`,
              {
                headers: {
                  // Nominatim exige um User-Agent identificável:
                  "User-Agent": "qwip.pro/1.0 (contato@qwip.pro)",
                },
                cache: "no-store",
              }
            );
            if (n.ok) {
              const arr = await n.json();
              if (Array.isArray(arr) && arr.length > 0) {
                const lat = parseFloat(arr[0].lat);
                const lng = parseFloat(arr[0].lon);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                  setCoords({ lat, lng });
                  setCity(
                    cidade && uf ? `${cidade} - ${uf}` : d?.uf || "Atual"
                  );
                  return; // sucesso ✅
                }
              }
            }
          }
        }
      }
    } catch {
      // segue para fallback
    }

    // 3) Último fallback: Nominatim só com postalcode (o que você já fazia)
    try {
      const n2 = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&country=BR&postalcode=${encodeURIComponent(
          cepDigits
        )}&limit=1`,
        {
          headers: {
            "User-Agent": "qwip.pro/1.0 (contato@qwip.pro)",
          },
          cache: "no-store",
        }
      );
      if (n2.ok) {
        const arr = await n2.json();
        if (Array.isArray(arr) && arr.length > 0) {
          const lat = parseFloat(arr[0].lat);
          const lng = parseFloat(arr[0].lon);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            setCoords({ lat, lng });
            // tenta extrair cidade do display_name quando possível
            const display = String(arr[0].display_name || "");
            const m = display.split(",").map((s) => s.trim());
            // heurística simples pra cidade/uf
            const cityFromDisplay =
              m.length >= 3 ? `${m[m.length - 4]} - ${m[m.length - 3]}` : "Atual";
            setCity(cityFromDisplay);
            return; // sucesso ✅
          }
        }
      }
    } catch {
      // ignora, vai pro erro final
    }

    alert("CEP não encontrado. Tente outro CEP ou use 'Usar minha localização'.");
  } catch (err) {
    console.error(err);
    alert("Não foi possível localizar este CEP no momento.");
  }
}
