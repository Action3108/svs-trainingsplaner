export default function TrainingCard({
  phaseLabel,
  title,
  meta,
  defaultOpen = false,
  children,
}) {
  return (
    <details className="svs-card" open={defaultOpen}>
      <summary className="svs-card__summary">
        <span className="svs-card__phase">{phaseLabel}</span>
        <h3 className="svs-card__title">{title}</h3>
        {meta && <span className="svs-card__meta">{meta}</span>}
        <svg
          className="svs-card__chevron"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            d="M5 8l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </summary>
      <div className="svs-card__body">{children}</div>
    </details>
  );
}
