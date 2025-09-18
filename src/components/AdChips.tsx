type Props = {
  city: string | null;
  uf: string | null;
  radiusKm: number | null;
  createdAtISO: string; // ISO vindo do backend
};

// formata "há 2 h", "há 5 min", "há 3 d"
function timeAgo(ptISO: string) {
  const t = Date.parse(ptISO);
  if (!Number.isFinite(t)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return `há ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD} d`;
}

export default function AdChips({ city, uf, radiusKm, createdAtISO }: Props) {
  const chips: string[] = [];

  const loc =
    (city && uf && `${city}, ${uf}`) ||
    (city && `${city}`) ||
    (uf && `${uf}`) ||
    null;
  if (loc) chips.push(loc);

  if (typeof radiusKm === "number" && radiusKm > 0) {
    chips.push(`alcança ${radiusKm} km`);
  }

  const ago = timeAgo(createdAtISO);
  if (ago) chips.push(`publicado ${ago}`);

  if (chips.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {chips.map((c, i) => (
        <span
          key={`${c}-${i}`}
          className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs text-muted-foreground"
        >
          {c}
        </span>
      ))}
    </div>
  );
}
