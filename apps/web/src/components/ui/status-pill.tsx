export function StatusPill({ value }: { value: string }) {
  return <span className="status-pill">{value.replaceAll("_", " ")}</span>;
}
