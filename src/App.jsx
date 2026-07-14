import Header from './components/ui/Header.jsx';
import ComponentPreview from './ComponentPreview.jsx';

export default function App() {
  // Komponenten-Vorschau: /?preview=1 aufrufen
  if (new URLSearchParams(window.location.search).get('preview') === '1') {
    return <ComponentPreview />;
  }
  return (
    <main>
      <Header subtitle="SV Schöning 1926 e.V." />
      <div className="app">
        <p className="app-status">
          Designsystem steht. Datenanbindung und Generator folgen in den
          nächsten Phasen.
        </p>
      </div>
    </main>
  );
}
