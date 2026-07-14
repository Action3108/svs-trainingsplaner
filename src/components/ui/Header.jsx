export default function Header({ subtitle }) {
  return (
    <header className="svs-header">
      <img
        src={`${import.meta.env.BASE_URL}assets/sv-schoening-logo.png`}
        alt="Vereinslogo SV Schöning 1926 e.V."
        className="svs-header__logo"
      />
      <div>
        <h1 className="svs-header__title">SV Schöning Trainingsplaner</h1>
        {subtitle && <p className="svs-header__subtitle">{subtitle}</p>}
      </div>
    </header>
  );
}
