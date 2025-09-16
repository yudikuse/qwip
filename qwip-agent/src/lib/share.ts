// src/lib/share.ts
export function shareToWhats(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function webShareOrCopy({ title, text, url }: { title?: string; text?: string; url?: string; }) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return true;
    }
    await navigator.clipboard.writeText([text, url].filter(Boolean).join(" "));
    alert("Link copiado!");
    return true;
  } catch {
    return false;
  }
}
