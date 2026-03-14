import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const EXERCISE_LIST = {
  Chest: ["Bench Press (Barbell)", "Incline Bench Press (Barbell)", "Incline Bench Press (Smith)", "Flat Press (Dumbbell)", "Incline Press (Dumbbell)", "Bench Press (Machine)", "Chest Flyes (Machine)", "Bench Press (Smith)", "Chest Flyes (Dumbbell)", "Dips", "Push-ups", "Crossovers (Dumbbell)", "Crossovers (Cable)"],
  Back: ["Pull-ups", "Close Grip Row (Cable)", "Wide Grip Row (Cable)", "Single-Arm Row (Cable)", "Row (Barbell)", "Back Extensions", "Lat Pulldown (Wide Grip)", "Kelso Shrugs (Machine)", "Kelso Shrugs (Barbell)", "Kelso Shrugs (Dumbbell)", "Chin-ups", "Keenan Flaps", "Shrugs", "Close Grip Row (Machine)", "Wide Grip Row (Machine)", "Neutral Grip Row (Machine)", "Lat Pulldown (Close Grip)", "Lat Pulldown (Neutral Grip)"],
  Legs: ["Squat (Barbell)", "Seated Calf Raise", "Standing Calf Raise", "Leg Extensions", "Lying Leg Curls", "Seated Leg Curls", "Bulgarian Split Squats", "Hack Squat", "Pendulum Squat", "Adductors", "Abductors", "Hip Thrusts", "Goblet Squat", "Romanian Deadlift", "Stiff-legged Deadlift", "Leg Press"],
  Arms: ["Shoulder Press (Dumbbell)", "Bicep Curls (Dumbbell)", "Hammer Curls (Dumbbell)", "Bicep Curls (Cable)", "Hammer Curls (Cable)", "Reverse Curls (Dumbbell)", "Reverse Curls (Cable)", "Shoulder Press (Machine)", "V-Bar Pushdowns", "Straight Bar Pushdowns", "Preacher Curls (Dumbbell)", "EZ Bar Preacher Curls", "Straight Bar Preacher Curls", "Lat Raises (Cable)", "JM Press (Smith)", "EZ Bar JM Press", "Rope Tricep Pushdowns", "French Press", "Skullcrushers (Dumbbell)", "EZ Bar Skullcrushers", "Rear Delt Flyes", "Face Pulls", "Shoulder Press (Barbell)", "Palms-up Wrist Curls (Dumbbell)", "Palms-down Wrist Curls (Dumbbell)", "Palms-up Wrist Curls (Cable)", "Palms-down Wrist Curls (Cable)", "Bayesian Curls (Cable)", "Spider Curls", "Overhead Cable Extensions", "Overhead Dumbbell Extensions", "Lat Raises (Machine)", "Front Raises (Dumbbell)"],
  Abs: ["Decline Sit-ups", "Sit-ups", "Hanging Leg Raises", "Dragon Flags", "Cable Crunches", "Russian Twists"],
  fullBody: ["Deadlift (Barbell)"]
};

const theme = {
  bg: '#000000',
  card: '#1c1c1e',
  accent: '#0a84ff',
  success: '#30d158',
  danger: '#ff453a',
  gray: '#8e8e93',
  input: '#2c2c2e',
  radius: '16px'
};

function App() {
  const [routines, setRoutines] = useState(() => JSON.parse(localStorage.getItem('fitness_routines') || '[]'));
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('fitness_history') || '[]'));
  const [weightHistory, setWeightHistory] = useState(() => JSON.parse(localStorage.getItem('fitness_weight') || '[]'));
  const [isWorkingOut, setIsWorkingOut] = useState(() => JSON.parse(localStorage.getItem('fitness_active_status') || 'false'));
  const [activeWorkout, setActiveWorkout] = useState(() => JSON.parse(localStorage.getItem('fitness_active_workout') || '{"title":"","exercises":[]}'));

  const [activeTab, setActiveTab] = useState('workouts');
  const [isCreating, setIsCreating] = useState(false);
  const [routineSearch, setRoutineSearch] = useState('');
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineExercises, setNewRoutineExercises] = useState([]);
  const [todayWeight, setTodayWeight] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [chartFilter, setChartFilter] = useState('All');
  const [chartMetric, setChartMetric] = useState('Volume');
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    localStorage.setItem('fitness_routines', JSON.stringify(routines));
    localStorage.setItem('fitness_history', JSON.stringify(history));
    localStorage.setItem('fitness_weight', JSON.stringify(weightHistory));
    localStorage.setItem('fitness_active_status', JSON.stringify(isWorkingOut));
    localStorage.setItem('fitness_active_workout', JSON.stringify(activeWorkout));
  }, [routines, history, weightHistory, isWorkingOut, activeWorkout]);

  const getPlates = (lbs, name) => {
    if (!name.toLowerCase().includes('barbell') && !name.toLowerCase().includes('smith')) return null;
    let weight = (Number(lbs) - 45) / 2;
    if (isNaN(weight) || weight <= 0) return null;
    const plates = [45, 35, 25, 10, 5, 2.5];
    let result = [];
    plates.forEach(p => { while (weight >= p) { result.push(p); weight -= p; } });
    return result.length ? `Plates per side: ${result.join(', ')}` : null;
  };

  const getStrengthLevel = (oneRM) => {
    const currentWeight = weightHistory[0]?.weight || 150;
    const ratio = oneRM / currentWeight;
    if (ratio >= 1.5) return { label: "Elite", color: "#bf94ff" };
    if (ratio >= 1.2) return { label: "Advanced", color: theme.success };
    if (ratio >= 0.9) return { label: "Intermediate", color: theme.accent };
    return { label: "Novice", color: theme.gray };
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.routines) setRoutines(data.routines);
        if (data.history) setHistory(data.history);
        if (data.weightHistory) setWeightHistory(data.weightHistory);
        alert("Restore Complete!");
      } catch (err) { alert("Invalid File"); }
    };
    reader.readAsText(file);
  };

  const startRoutine = (routine) => {
    setActiveWorkout({
      title: routine.title,
      exercises: routine.exercises.map(ex => ({
        name: ex,
        sets: [{ weight: '', reps: '', completed: false }, { weight: '', reps: '', completed: false }]
      }))
    });
    setIsWorkingOut(true);
  };

  const finishWorkout = () => {
    const filtered = activeWorkout.exercises.map(ex => ({
      ...ex,
      sets: ex.sets.filter(s => s.completed && s.weight && s.reps)
    })).filter(ex => ex.sets.length > 0);
    if (filtered.length === 0) return alert("Log at least one set!");
    const completed = { ...activeWorkout, exercises: filtered, date: new Date().toLocaleDateString(), timestamp: new Date().toISOString() };
    setHistory([completed, ...history]);
    setIsWorkingOut(false);
    setActiveWorkout({title:"", exercises:[]});
  };

  const inputStyle = { backgroundColor: theme.input, border: 'none', borderRadius: '12px', color: '#fff', padding: '14px', fontSize: '16px', width: '100%', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ backgroundColor: theme.bg, color: '#fff', minHeight: '100vh', fontFamily: '-apple-system, sans-serif', width: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      
      {/* --- WORKOUT OVERLAY --- */}
      {isWorkingOut && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.bg, zIndex: 100, overflowY: 'auto', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ position: 'sticky', top: '-20px', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)', padding: '20px 0', zIndex: 101, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.card}`, marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setIsWorkingOut(false)} style={{ background: 'none', border: 'none', color: theme.gray, fontSize: '1.5rem' }}>✕</button>
              <h2 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>{activeWorkout.title}</h2>
            </div>
            <button onClick={finishWorkout} style={{ backgroundColor: theme.accent, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '24px', fontWeight: '800' }}>Finish</button>
          </div>

          {activeWorkout.exercises.map((ex, exIdx) => (
            <div key={exIdx} style={{ backgroundColor: theme.card, borderRadius: theme.radius, padding: '20px', marginBottom: '20px', border: '1px solid #2c2c2e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: theme.accent, margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>{ex.name}</h3>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button onClick={() => setEditingExerciseIndex(exIdx)} style={{ background: 'none', border: 'none', color: theme.gray, fontSize: '0.8rem' }}>Swap</button>
                  <button onClick={() => { const n = {...activeWorkout}; n.exercises.splice(exIdx,1); setActiveWorkout(n); }} style={{ background: 'none', border: 'none', color: theme.danger, fontSize: '0.8rem' }}>Remove</button>
                </div>
              </div>
              
              {ex.sets.map((set, sIdx) => (
                <div key={sIdx} style={{ marginBottom: '15px', opacity: set.completed ? 0.4 : 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '35px 1fr 1fr 45px 45px', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ textAlign: 'center', alignSelf: 'center', fontWeight: '700', color: theme.gray }}>{sIdx + 1}</div>
                    <input type="number" placeholder="LBS" value={set.weight} onChange={(e) => {
                      const n = {...activeWorkout}; n.exercises[exIdx].sets[sIdx].weight = e.target.value; setActiveWorkout(n);
                    }} style={inputStyle} />
                    <input type="number" placeholder="REPS" value={set.reps} onChange={(e) => {
                      const n = {...activeWorkout}; n.exercises[exIdx].sets[sIdx].reps = e.target.value; setActiveWorkout(n);
                    }} style={inputStyle} />
                    <button onClick={() => {
                      const n = {...activeWorkout}; n.exercises[exIdx].sets[sIdx].completed = !n.exercises[exIdx].sets[sIdx].completed; setActiveWorkout(n);
                    }} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: set.completed ? theme.success : theme.input }}>{set.completed ? '●' : '○'}</button>
                    <button onClick={() => {
                      const n = {...activeWorkout}; n.exercises[exIdx].sets.splice(sIdx,1); setActiveWorkout(n);
                    }} style={{ background: 'none', border: 'none', color: theme.danger }}>✕</button>
                  </div>
                  {set.weight && !set.completed && (
                    <div style={{ fontSize: '0.65rem', color: theme.gray, marginLeft: '43px', fontWeight: '600' }}>{getPlates(set.weight, ex.name)}</div>
                  )}
                </div>
              ))}
              <button onClick={() => { const n = {...activeWorkout}; n.exercises[exIdx].sets.push({weight:'', reps:'', completed:false}); setActiveWorkout(n); }} style={{ width: '100%', padding: '10px', backgroundColor: theme.input, color: theme.gray, border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '0.8rem' }}>+ Add Set</button>
            </div>
          ))}
          <button onClick={() => { if (window.confirm("Discard?")) setIsWorkingOut(false) }} style={{ color: theme.danger, width: '100%', background: 'none', border: 'none', marginTop: '20px', paddingBottom: '60px', fontWeight: '600' }}>Discard Workout</button>
        </div>
      )}

      {/* --- NORMAL VIEW --- */}
      {!isWorkingOut && (
        <div style={{ padding: '0 20px', maxWidth: '600px', margin: '0 auto', boxSizing: 'border-box' }}>
          <nav style={{ display: 'flex', gap: '24px', padding: '20px 0', position: 'sticky', top: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)', zIndex: 50, borderBottom: '1px solid #1c1c1e', marginBottom: '25px' }}>
            {['workouts', 'profile', 'body'].map(tab => (
              <h1 key={tab} onClick={() => setActiveTab(tab)} style={{ opacity: activeTab === tab ? 1 : 0.3, cursor: 'pointer', fontSize: '1.6rem', fontWeight: '800', textTransform: 'capitalize', letterSpacing: '-0.03em' }}>{tab}</h1>
            ))}
          </nav>

          {activeTab === 'workouts' ? (
            <div>
              <button onClick={() => setIsCreating(true)} style={{ width: '100%', padding: '18px', backgroundColor: theme.accent, color: '#fff', borderRadius: theme.radius, border: 'none', fontWeight: '800' }}>+ New Routine</button>
              {routines.map(r => (
                <div key={r.id} style={{ position: 'relative', marginTop: '16px' }}>
                  <div onClick={() => startRoutine(r)} style={{ backgroundColor: theme.card, padding: '24px', borderRadius: theme.radius, border: '1px solid #2c2c2e' }}>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>{r.title}</h4>
                    <p style={{ color: theme.gray, fontSize: '0.85rem', marginTop: '8px' }}>{r.exercises.join(' • ')}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); if(window.confirm("Delete?")) setRoutines(routines.filter(x => x.id !== r.id)); }} style={{ position: 'absolute', top: '24px', right: '20px', background: 'none', border: 'none', color: '#333' }}>✕</button>
                </div>
              ))}
              {isCreating && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.bg, zIndex: 110, padding: '20px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}><h2>Create Routine</h2><button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem' }}>✕</button></div>
                  <input placeholder="Title" value={newRoutineTitle} onChange={(e) => setNewRoutineTitle(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                    {newRoutineExercises.map(ex => <span key={ex} onClick={() => setNewRoutineExercises(newRoutineExercises.filter(i => i !== ex))} style={{ backgroundColor: theme.accent, padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600' }}>{ex} ✕</span>)}
                  </div>
                  <input placeholder="Search exercises..." value={routineSearch} onChange={(e) => setRoutineSearch(e.target.value)} style={inputStyle} />
                  {Object.entries(EXERCISE_LIST).map(([m, exs]) => (
                    <details key={m} style={{ marginTop: '10px', backgroundColor: theme.card, borderRadius: '12px' }}>
                      <summary style={{ padding: '16px', fontWeight: '700' }}>{m}</summary>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '16px' }}>
                        {exs.filter(e => e.toLowerCase().includes(routineSearch.toLowerCase())).map(e => <button key={e} onClick={() => !newRoutineExercises.includes(e) && setNewRoutineExercises([...newRoutineExercises, e])} style={{ padding: '10px 14px', borderRadius: '20px', background: theme.input, color: '#fff', border: '1px solid #444' }}>{e}</button>)}
                      </div>
                    </details>
                  ))}
                  <button onClick={saveNewRoutine} style={{ width: '100%', padding: '18px', backgroundColor: theme.success, color: '#fff', borderRadius: theme.radius, border: 'none', fontWeight: '800', marginTop: '30px' }}>Save Routine</button>
                </div>
              )}
            </div>
          ) : activeTab === 'profile' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ letterSpacing: '-0.02em' }}>Performance</h2>
                <button onClick={() => {
                  let csv = "Date,Routine,Exercise,Weight,Reps\n";
                  history.forEach(h => h.exercises.forEach(ex => ex.sets.forEach(s => csv += `${h.date},${h.title},${ex.name},${s.weight},${s.reps}\n`)));
                  const blob = new Blob([csv], { type: 'text/csv' });
                  window.open(URL.createObjectURL(blob));
                }} style={{ backgroundColor: '#217346', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700' }}>Export CSV</button>
              </div>

              <div style={{ backgroundColor: theme.card, padding: '24px', borderRadius: theme.radius, marginBottom: '24px', height: '320px', border: '1px solid #2c2c2e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: theme.gray, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{chartMetric} Trend</h4>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
                      <button onClick={() => setChartMetric('Volume')} style={{ fontSize: '0.75rem', fontWeight: '800', color: chartMetric === 'Volume' ? theme.accent : '#444', background: 'none', border: 'none' }}>VOLUME</button>
                      <button onClick={() => setChartMetric('1RM')} style={{ fontSize: '0.75rem', fontWeight: '800', color: chartMetric === '1RM' ? theme.accent : '#444', background: 'none', border: 'none' }}>EST. 1RM</button>
                    </div>
                  </div>
                  {chartMetric === '1RM' && history.length > 0 && (
                    <div style={{ alignSelf: 'center' }}>
                      {(() => {
                        const max1RM = Math.max(...history[0].exercises.flatMap(ex => ex.sets.map(s => Number(s.weight) * (36 / (37 - Math.min(Number(s.reps), 10))))), 0);
                        const lvl = getStrengthLevel(max1RM);
                        return <span style={{ backgroundColor: `${lvl.color}22`, color: lvl.color, padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900', border: `1px solid ${lvl.color}44` }}>{lvl.label}</span>;
                      })()}
                    </div>
                  )}
                </div>
                <ResponsiveContainer width="100%" height="75%">
                  <LineChart data={[...history].reverse().filter(h => chartFilter === 'All' || h.title === chartFilter).map(h => ({
                    date: h.date,
                    value: chartMetric === 'Volume' ? h.exercises.reduce((sum, ex) => sum + ex.sets.reduce((sSum, s) => sSum + (Number(s.weight) * Number(s.reps)), 0), 0) : Math.max(...h.exercises.flatMap(ex => ex.sets.map(s => Number(s.weight) * (36 / (37 - Math.min(Number(s.reps), 10))))), 0)
                  }))}>
                    <XAxis dataKey="date" hide /><YAxis hide /><Tooltip contentStyle={{ backgroundColor: theme.card, borderRadius: '12px', border: 'none' }} />
                    <Line type="monotone" dataKey="value" stroke={theme.accent} strokeWidth={4} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ backgroundColor: theme.card, padding: '24px', borderRadius: theme.radius, marginBottom: '24px', border: '1px solid #2c2c2e' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px', fontWeight: '800', fontSize: '1.1rem' }}>{new Date().toLocaleString('default', { month: 'long' })}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center' }}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={{ color: theme.accent, fontWeight: '800', fontSize: '0.75rem' }}>{d}</div>)}
                  {(() => {
                    const n = new Date(); const y = n.getFullYear(); const m = n.getMonth();
                    const f = new Date(y, m, 1).getDay(); const dM = new Date(y, m + 1, 0).getDate();
                    const days = [];
                    for (let i = 0; i < f; i++) days.push(<div key={`e-${i}`} />);
                    for (let d = 1; d <= dM; d++) {
                      const ds = `${m + 1}/${d}/${y}`; const has = history.some(h => h.date === ds); const isSel = selectedDate === ds;
                      days.push(<div key={d} onClick={() => setSelectedDate(isSel ? null : ds)} style={{ height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: isSel ? '#fff' : (has ? theme.accent : 'transparent'), color: isSel ? '#000' : (has ? '#fff' : theme.gray), fontSize: '0.9rem', fontWeight: (has || isSel) ? '700' : '400', border: has ? 'none' : '1px solid #2c2c2e' }}>{d}</div>);
                    }
                    return days;
                  })()}
                </div>
              </div>

              {selectedDate && (
                <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: theme.card, borderRadius: theme.radius, border: `1px solid ${theme.accent}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{selectedDate}</strong>
                    <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: theme.gray, fontSize: '1.2rem' }}>✕</button>
                  </div>
                  {history.filter(h => h.date === selectedDate).map((h, i) => (
                    <div key={i} style={{ marginTop: '10px' }}>
                      <div style={{ color: theme.accent, fontWeight: '800' }}>{h.title}</div>
                      {h.exercises.map((ex, exIdx) => <div key={exIdx} style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '6px' }}>• {ex.name}: {ex.sets.map(s => `${s.weight}x${s.reps}`).join(', ')}</div>)}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontWeight: '800' }}>Recent Activity</h3>
                {history.length > 5 && (
                  <button onClick={() => setExpandedIndex(expandedIndex === 'all' ? null : 'all')} style={{ background: 'none', border: 'none', color: theme.accent, fontSize: '0.9rem', fontWeight: '700' }}>{expandedIndex === 'all' ? 'Show Less' : 'View All'}</button>
                )}
              </div>
              {(expandedIndex === 'all' ? history : history.slice(0, 5)).map((h, i) => (
                <div key={i} style={{ backgroundColor: theme.card, borderRadius: theme.radius, marginBottom: '12px', borderLeft: `6px solid ${theme.accent}`, overflow: 'hidden', border: '1px solid #2c2c2e', borderLeftWidth: '6px' }}>
                  <div onClick={() => setExpandedIndex(expandedIndex === i ? null : i)} style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                    <div><h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{h.title}</h3><span style={{ color: theme.gray, fontSize: '0.8rem' }}>{h.date}</span></div>
                    <div>{expandedIndex === i ? '▲' : '▼'}</div>
                  </div>
                  {expandedIndex === i && (
                    <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #2c2c2e', paddingTop: '15px' }}>
                      {h.exercises.map((ex, exIdx) => (
                        <div key={exIdx} style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.9rem', color: theme.accent, fontWeight: '800' }}>{ex.name}</div>
                          {ex.sets.map((s, sIdx) => <span key={sIdx} style={{ backgroundColor: theme.input, padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', marginRight: '6px' }}>{s.weight}lb x {s.reps}</span>)}
                        </div>
                      ))}
                      <button onClick={() => { if(window.confirm("Delete?")) setHistory(history.filter((_, idx) => idx !== i)) }} style={{ color: theme.danger, background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '600', marginTop: '10px' }}>Delete Log</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ backgroundColor: theme.card, padding: '24px', borderRadius: theme.radius, marginBottom: '24px', border: '1px solid #2c2c2e' }}>
                <h3 style={{ marginTop: 0, fontWeight: '800' }}>Log Daily Weight</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <style>{`input::-webkit-outer-spin-button,input::-webkit-inner-spin-button {-webkit-appearance:none;margin:0;}input[type=number] {-moz-appearance:textfield;}`}</style>
                  <input type="number" step="0.1" placeholder="lbs" value={todayWeight} onChange={(e) => setTodayWeight(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => { if(!todayWeight) return; setWeightHistory([{ date: new Date().toLocaleDateString(), weight: Number(todayWeight), timestamp: new Date().toISOString() }, ...weightHistory]); setTodayWeight(''); }} style={{ backgroundColor: theme.success, color: '#fff', border: 'none', borderRadius: '12px', padding: '0 24px', fontWeight: '800' }}>Log</button>
                </div>
              </div>

              {weightHistory.length > 1 && (
                <div style={{ backgroundColor: theme.card, padding: '24px', borderRadius: theme.radius, marginBottom: '24px', height: '220px', border: '1px solid #2c2c2e' }}>
                  <h4 style={{ margin: 0, color: theme.gray, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '15px' }}>Weekly Progress Trend</h4>
                  <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={(() => {
                      const weeks = weightHistory.reduce((acc, curr) => {
                        const d = new Date(curr.timestamp);
                        const startOfWeek = new Date(d);
                        startOfWeek.setDate(d.getDate() - d.getDay());
                        const key = startOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(curr.weight);
                        return acc;
                      }, {});
                      return Object.entries(weeks).map(([week, weights]) => ({
                        week: week,
                        avgWeight: Number((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2))
                      })).reverse();
                    })()}>
                      <defs><linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.success} stopOpacity={0.3}/><stop offset="95%" stopColor={theme.success} stopOpacity={0}/></linearGradient></defs>
                      <Tooltip contentStyle={{ backgroundColor: theme.card, borderRadius: '12px', border: '1px solid #444', color: '#fff' }} />
                      <Area type="monotone" dataKey="avgWeight" stroke={theme.success} strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <h3 style={{ fontWeight: '800' }}>Weekly Averages</h3>
              {(() => {
                const weeks = weightHistory.reduce((acc, curr) => {
                  const d = new Date(curr.timestamp);
                  const startOfWeek = new Date(d);
                  startOfWeek.setDate(d.getDate() - d.getDay());
                  const key = startOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(curr.weight);
                  return acc;
                }, {});
                return Object.entries(weeks).map(([week, weights]) => {
                  const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
                  return (
                    <div key={week} style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', border: '1px solid #2c2c2e' }}>
                      <div><span style={{ color: theme.gray, fontSize: '0.75rem', fontWeight: '600' }}>Week of {week}</span><div style={{ fontWeight: '800', fontSize: '1.3rem', letterSpacing: '-0.02em' }}>{avg.toFixed(2)} lbs</div></div>
                      <div style={{ color: theme.success, alignSelf: 'center', fontSize: '0.85rem', fontWeight: '700' }}>{weights.length} entries</div>
                    </div>
                  );
                });
              })()}

              <h3 style={{ marginTop: '40px', fontWeight: '800' }}>Log History</h3>
              <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '30px' }}>
                {weightHistory.map((w, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #1c1c1e' }}>
                    <span style={{ fontSize: '0.95rem' }}>{w.date} — <strong style={{ fontWeight: '800' }}>{w.weight} lbs</strong></span>
                    <button onClick={() => { if(window.confirm("Delete?")) setWeightHistory(weightHistory.filter((_, i) => i !== idx)) }} style={{ background: 'none', border: 'none', color: theme.danger, fontSize: '0.85rem', fontWeight: '600' }}>Delete</button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '60px', padding: '30px 20px', borderTop: '1px solid #1c1c1e', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={() => { const b = { routines, history, weightHistory }; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(b)], {type:'application/json'})); a.download=`fitness_backup.json`; a.click(); }} style={{ backgroundColor: theme.input, color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700' }}>Export JSON</button>
                  <label style={{ backgroundColor: theme.input, color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Import JSON<input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} /></label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;