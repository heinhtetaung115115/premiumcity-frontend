'use client';

export default function CopyField({ label, value }: { label: string; value: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      alert('Copied!');
    } catch {
      alert('Copy failed');
    }
  }

  return (
    <div className="mb-2">
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={value}
          className="w-full rounded-lg border bg-neutral-50 px-3 py-2 text-sm"
        />
        <button
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={copy}
        >
          Copy
        </button>
      </div>
    </div>
  );
}
