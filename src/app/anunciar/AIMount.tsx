"use client";

import AIMagicBar from "@/components/ai/AIMagicBar";

export default function AIMount({
  onReplace,
}: {
  onReplace: (blob: Blob) => void;
}) {
  return (
    <AIMagicBar
      inputSelector='[data-ai="photo"]'
      hostSelector="#ai-under-preview"
      onReplaceFile={onReplace}
    />
  );
}
