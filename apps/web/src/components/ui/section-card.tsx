export function SectionCard({
  title,
  description,
  children,
  eyebrow,
  dark = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  eyebrow?: string;
  dark?: boolean;
}) {
  return (
    <section className={`section-card ${dark ? "section-card--dark" : ""}`}>
      <div className="section-card__header">
        {eyebrow ? <span className="section-card__eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
