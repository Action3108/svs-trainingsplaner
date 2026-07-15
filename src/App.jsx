import { useEffect, useState } from 'react';
import Header from './components/ui/Header.jsx';
import ComponentPreview from './ComponentPreview.jsx';
import DataStatus from './components/DataStatus.jsx';
import PrintView from './components/PrintView.jsx';
import TrainingForm from './components/TrainingForm.jsx';
import TrainingPlan from './components/TrainingPlan.jsx';
import { useDatabase } from './logic/useDatabase.js';
import { generateTraining } from './logic/generator.js';
import { applyExchange } from './logic/exchange.js';

export default function App() {
  // Komponenten-Vorschau: /?preview=1 aufrufen
  if (new URLSearchParams(window.location.search).get('preview') === '1') {
    return <ComponentPreview />;
  }
  return <MainApp />;
}

function defaultInputs(db) {
  const lists = db?.lists ?? {};
  const first = (name, fallback) => lists[name]?.[0]?.value ?? fallback;
  return {
    ageGroup: lists.ageGroups?.some((a) => a.value === 'E') ? 'E' : first('ageGroups', 'E'),
    duration: Number(db?.settings?.defaultDuration ?? first('durations', 90)),
    focus: first('focusAreas', 'Passspiel'),
    players: 14,
  };
}

function MainApp() {
  const { status, db, source, updatedAt, errors } = useDatabase();
  const [inputs, setInputs] = useState(null);
  const [plan, setPlan] = useState(null);
  const [planInputs, setPlanInputs] = useState(null);
  const [variant, setVariant] = useState(0);
  const [planBeforeExchange, setPlanBeforeExchange] = useState(null);

  // Formular-Voreinstellungen, sobald die Datenbank geladen ist
  useEffect(() => {
    if (status === 'ready' && db) setInputs(defaultInputs(db));
  }, [status, db]);

  const create = (v = 0) => {
    const used = { ...inputs };
    setVariant(v);
    setPlanInputs(used);
    setPlanBeforeExchange(null);
    setPlan(generateTraining(db, { ...used, variant: v }));
  };

  const exchange = (phaseIndex, exercise) => {
    setPlanBeforeExchange(plan);
    setPlan(applyExchange(plan, phaseIndex, exercise, planInputs.players));
  };

  const undoExchange = () => {
    setPlan(planBeforeExchange);
    setPlanBeforeExchange(null);
  };

  // Designsystem V2 „Modern Coaching Workspace“ ist das aktive Design der App.
  return (
    <main className="theme-scope" data-theme="v2">
      <Header subtitle="SV Schöning 1926 e.V." />
      <div className="app">
        <DataStatus status={status} source={source} updatedAt={updatedAt} db={db} errors={errors} />
        {inputs && (
          <TrainingForm
            db={db}
            value={inputs}
            onChange={(next) => setInputs(next)}
            onSubmit={() => create(0)}
          />
        )}
        <TrainingPlan
          plan={plan}
          inputs={planInputs ?? {}}
          db={db}
          showSources={String(db?.settings?.showSources ?? 'true') !== 'false'}
          onExchange={exchange}
          canUndo={planBeforeExchange !== null}
          onUndo={undoExchange}
          onVariant={() =>
            create(plan?.variantsAvailable ? (variant + 1) % plan.variantsAvailable : 0)
          }
        />
      </div>
      <PrintView plan={plan} inputs={planInputs} />
    </main>
  );
}
