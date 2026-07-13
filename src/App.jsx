export default function App() {
  return (
    <main className="app">
      <header className="app-header">
        <img
          src={`${import.meta.env.BASE_URL}assets/sv-schoening-logo.png`}
          alt="Vereinslogo SV Schöning 1926 e.V."
          className="app-logo"
        />
        <h1>SV Schöning Trainingsplaner</h1>
      </header>
      <p className="app-status">
        Projektgerüst steht. Designsystem, Datenanbindung und Generator folgen
        in den nächsten Phasen.
      </p>
    </main>
  );
}
