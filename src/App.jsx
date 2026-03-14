import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const EXERCISE_LIST = {
  Chest: ["Bench Press (Barbell)", "Incline Bench Press (Barbell)", "Incline Bench Press (Smith)", "Flat Press (Dumbbell)", "Incline Press (Dumbbell)", "Bench Press (Machine)", "Chest Flyes (Machine)", "Bench Press (Smith)", "Chest Flyes (Dumbbell)", "Dips", "Push-ups", "Crossovers (Dumbbell)", "Crossovers (Cable)"],
  Back: ["Pull-ups", "Close Grip Row (Cable)", "Wide Grip Row (Cable)", "Single-Arm Row (Cable)", "Row (Barbell)", "Back Extensions", "Lat Pulldown (Wide Grip)", "Kelso Shrugs (Machine)", "Kelso Shrugs (Barbell)", "Kelso Shrugs (Dumbbell)", "Chin-ups", "Keenan Flaps", "Shrugs", "Close Grip Row (Machine)", "Wide Grip Row (Machine)", "Neutral Grip Row (Machine)", "Lat Pulldown (Close Grip)", "Lat Pulldown (Neutral Grip)"],
  Legs: ["Squat (Barbell)", "Seated Calf Raise", "Standing Calf Raise", "Leg Extensions", "Lying Leg Curls", "Seated Leg Curls", "Bulgarian Split Squats", "Hack Squat", "Pendulum Squat", "Adductors", "Abductors", "Hip Thrusts", "Goblet Squat", "Romanian Deadlift", "Stiff-legged Deadlift", "Leg Press"],
  Arms: ["Shoulder Press (Dumbbell)", "Bicep Curls (Dumbbell)", "Hammer Curls (Dumbbell)", "Bicep Curls (Cable)", "Hammer Curls (Cable)", "Reverse Curls (Dumbbell)", "Reverse Curls (Cable)", "Shoulder Press (Machine)", "V-Bar Pushdowns", "Straight Bar Pushdowns", "Preacher Curls (Dumbbell)", "EZ Bar Preacher Curls", "Straight Bar Preacher Curls", "Lat Raises (Cable)", "JM Press (Smith)", "EZ Bar JM Press", "Rope Tricep Pushdowns", "French Press", "Skullcrushers (Dumbbell)", "EZ Bar Skullcrushers", "Rear Delt Flyes", "Face Pulls", "Shoulder Press (Barbell)", "Palms-up Wrist Curls (Dumbbell)", "Palms-down Wrist Curls (Dumbbell)", "Palms-up Wrist Curls (Cable)", "Palms-down Wrist Curls (Cable)", "Bayesian Curls (Cable)", "Spider Curls", "Overhead Cable Extensions", "Overhead Dumbbell Extensions", "Lat Raises (Machine)", "Front Raises (Dumbbell)"],
  Abs: ["Decline Sit-ups", "Sit-ups", "Hanging Leg Raises", "Dragon Flags", "Cable Crunches", "Russian Twists"],
  fullBody: ["Deadlift (Barbell)"]
};

function App() {
  const [activeTab, setActiveTab] = useState('workouts');
  const [isWorkingOut, setIsWorkingOut] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [routineSearch, setRoutineSearch] = useState('');
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineExercises, setNewRoutineExercises] = useState([]);
  const [routines, setRoutines] = useState(() => JSON.parse(localStorage.getItem('fitness_routines') || '[]'));
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('fitness_history') || '[]'));
  const [activeWorkout, setActiveWorkout] = useState({ title: '', exercises: [] });
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [chartFilter, setChartFilter] = useState('All');
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null); const addExerciseToTemplate = (ex) => {
    if (!newRoutineExercises.includes(ex)) {
      setNewRoutineExercises([...newRoutineExercises, ex]);
    }
  };

  const saveNewRoutine = () => {
    if (!newRoutineTitle || newRoutineExercises.length === 0) return alert("Add a title and exercises!");
    setRoutines([...routines, { id: Date.now(), title: newRoutineTitle, exercises: newRoutineExercises }]);
    setIsCreating(false);
    setNewRoutineTitle('');
    setNewRoutineExercises([]);
    setRoutineSearch(''); // Reset search so it's clean for next time
  };

  useEffect(() => {
    localStorage.setItem('fitness_routines', JSON.stringify(routines));
    localStorage.setItem('fitness_history', JSON.stringify(history));
  }, [routines, history]);

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

  const addSet = (exIdx) => {
    const newWorkout = { ...activeWorkout };
    newWorkout.exercises[exIdx].sets.push({ weight: '', reps: '', completed: false });
    setActiveWorkout(newWorkout);
  };

  const updateSet = (exIdx, sIdx, field, value) => {
    const newWorkout = { ...activeWorkout };
    newWorkout.exercises[exIdx].sets[sIdx][field] = value;
    setActiveWorkout(newWorkout);
  };

  const deleteSet = (exIdx, sIdx) => {
    const newWorkout = { ...activeWorkout };
    if (newWorkout.exercises[exIdx].sets.length > 1) {
      newWorkout.exercises[exIdx].sets.splice(sIdx, 1);
      setActiveWorkout(newWorkout);
    }
  };

  const toggleSet = (exIdx, sIdx) => {
    const newWorkout = { ...activeWorkout };
    newWorkout.exercises[exIdx].sets[sIdx].completed = !newWorkout.exercises[exIdx].sets[sIdx].completed;
    setActiveWorkout(newWorkout);
  };

  const replaceExercise = (newName) => {
    const newWorkout = { ...activeWorkout };
    newWorkout.exercises[editingExerciseIndex].name = newName;
    setActiveWorkout(newWorkout);
    setEditingExerciseIndex(null);
    setRoutineSearch('');
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
  };

  const deleteRoutine = (id) => { if (window.confirm("Delete routine?")) setRoutines(routines.filter(r => r.id !== id)); };

  const inputStyle = { backgroundColor: '#2c2c2e', border: 'none', borderRadius: '6px', color: '#fff', padding: '10px', fontSize: '16px', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: '-apple-system, sans-serif', width: '100%', overflowX: 'hidden' }}>

      {/* --- ACTIVE WORKOUT OVERLAY --- */}
      {isWorkingOut && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 100, overflowY: 'auto', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ position: 'sticky', top: '-20px', backgroundColor: '#000', padding: '20px 0', zIndex: 101, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1c1c1e', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setIsWorkingOut(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.5rem' }}>✕</button>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{activeWorkout.title}</h2>
            </div>
            <button onClick={finishWorkout} style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold' }}>Finish</button>
          </div>

          {activeWorkout.exercises.map((ex, exIdx) => (
            <div key={exIdx} style={{ backgroundColor: '#1c1c1e', borderRadius: '12px', padding: '15px', marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#007bff', margin: 0, fontSize: '1.1rem' }}>{ex.name}</h3>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button onClick={() => setEditingExerciseIndex(exIdx)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.85rem' }}>Edit</button>
                  <button onClick={() => { const n = { ...activeWorkout }; n.exercises.splice(exIdx, 1); setActiveWorkout(n); }} style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '0.85rem' }}>Remove</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '35px 1fr 1fr 45px 45px', gap: '8px', alignItems: 'center', color: '#888', marginBottom: '10px', fontSize: '0.75rem' }}>
                <span>SET</span><span>LBS</span><span>REPS</span><span></span><span></span>
              </div>
              {ex.sets.map((set, sIdx) => (
                <div key={sIdx} style={{ display: 'grid', gridTemplateColumns: '35px 1fr 1fr 45px 45px', gap: '8px', marginBottom: '10px', opacity: set.completed ? 0.6 : 1 }}>
                  <div style={{ textAlign: 'center', alignSelf: 'center' }}>{sIdx + 1}</div>
                  <input type="number" placeholder="LBS" value={set.weight} onChange={(e) => updateSet(exIdx, sIdx, 'weight', e.target.value)} style={inputStyle} />
                  <input type="number" placeholder="REPS" value={set.reps} onChange={(e) => updateSet(exIdx, sIdx, 'reps', e.target.value)} style={inputStyle} />
                  <button onClick={() => toggleSet(exIdx, sIdx)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: set.completed ? '#34c759' : '#3a3a3c' }}>{set.completed ? '✅' : '✔️'}</button>
                  <button onClick={() => deleteSet(exIdx, sIdx)} style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '1.1rem' }}>✕</button>
                </div>
              ))}
              <button onClick={() => addSet(exIdx)} style={{ width: '100%', padding: '10px', backgroundColor: '#2c2c2e', color: '#888', border: 'none', borderRadius: '8px', marginTop: '10px', fontWeight: '600' }}>+ Add Set</button>
            </div>
          ))}
          <button onClick={() => { if (window.confirm("Discard?")) setIsWorkingOut(false) }} style={{ color: '#ff3b30', width: '100%', background: 'none', border: 'none', marginTop: '20px', paddingBottom: '60px' }}>Discard Workout</button>

          {/* --- REPLACE OVERLAY --- */}
          {editingExerciseIndex !== null && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 120, padding: '20px', boxSizing: 'border-box', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Replace Exercise</h2>
                <button onClick={() => setEditingExerciseIndex(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '2rem' }}>✕</button>
              </div>
              <input placeholder="Search..." value={routineSearch} onChange={(e) => setRoutineSearch(e.target.value)} style={inputStyle} />
              <div style={{ marginTop: '20px' }}>
                {Object.entries(EXERCISE_LIST).map(([muscle, exercises]) => {
                  const filtered = exercises.filter(ex => ex.toLowerCase().includes(routineSearch.toLowerCase()));
                  if (routineSearch && filtered.length === 0) return null;
                  return (
                    <details key={muscle} open={routineSearch.length > 0} style={{ marginBottom: '10px', backgroundColor: '#1c1c1e', borderRadius: '10px' }}>
                      <summary style={{ padding: '15px', cursor: 'pointer', fontWeight: 'bold' }}>{muscle}</summary>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '15px' }}>
                        {filtered.map(ex => <button key={ex} onClick={() => replaceExercise(ex)} style={{ padding: '10px 14px', borderRadius: '20px', background: '#2c2c2e', color: '#fff', border: '1px solid #444', fontSize: '0.9rem' }}>{ex}</button>)}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- NORMAL VIEW --- */}
      {!isWorkingOut && (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', boxSizing: 'border-box' }}>
          <nav style={{ display: 'flex', gap: '25px', marginBottom: '30px' }}>
            <h1 onClick={() => setActiveTab('workouts')} style={{ opacity: activeTab === 'workouts' ? 1 : 0.4, cursor: 'pointer', fontSize: '1.8rem' }}>Workouts</h1>
            <h1 onClick={() => setActiveTab('profile')} style={{ opacity: activeTab === 'profile' ? 1 : 0.4, cursor: 'pointer', fontSize: '1.8rem' }}>Profile</h1>
          </nav>

          {activeTab === 'workouts' ? (
            <div>
              <button onClick={() => setIsCreating(true)} style={{ width: '100%', padding: '18px', backgroundColor: '#007bff', color: '#fff', borderRadius: '14px', border: 'none', fontWeight: 'bold', fontSize: '1rem' }}>+ Custom Routine</button>
              {isCreating && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 110, padding: '20px', overflowY: 'auto', boxSizing: 'border-box' }}>
                  <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h2>Create Routine</h2>
                      <button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.5rem' }}>✕</button>
                    </div>

                    <input
                      placeholder="Routine Title (e.g. Upper A)"
                      value={newRoutineTitle}
                      onChange={(e) => setNewRoutineTitle(e.target.value)}
                      style={{ ...inputStyle, marginBottom: '20px' }}
                    />

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                      {newRoutineExercises.map(ex => (
                        <span key={ex} onClick={() => setNewRoutineExercises(newRoutineExercises.filter(i => i !== ex))} style={{ backgroundColor: '#007bff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                          {ex} ✕
                        </span>
                      ))}
                    </div>

                    <input
                      placeholder="Search exercises..."
                      value={routineSearch}
                      onChange={(e) => setRoutineSearch(e.target.value)}
                      style={inputStyle}
                    />

                    <div style={{ marginTop: '20px' }}>
                      {Object.entries(EXERCISE_LIST).map(([muscle, exercises]) => {
                        const filtered = exercises.filter(ex => ex.toLowerCase().includes(routineSearch.toLowerCase()));
                        if (routineSearch && filtered.length === 0) return null;
                        return (
                          <details key={muscle} open={routineSearch.length > 0} style={{ marginBottom: '10px', backgroundColor: '#1c1c1e', borderRadius: '10px', border: '1px solid #2c2c2e' }}>
                            <summary style={{ padding: '15px', cursor: 'pointer', fontWeight: 'bold' }}>{muscle} ({filtered.length})</summary>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '15px' }}>
                              {filtered.map(ex => (
                                <button
                                  key={ex}
                                  onClick={() => addExerciseToTemplate(ex)}
                                  style={{
                                    padding: '10px 14px', borderRadius: '20px',
                                    background: newRoutineExercises.includes(ex) ? '#007bff' : '#2c2c2e',
                                    color: '#fff', border: '1px solid #444', fontSize: '0.9rem'
                                  }}
                                >
                                  {ex}
                                </button>
                              ))}
                            </div>
                          </details>
                        );
                      })}
                    </div>

                    <button onClick={saveNewRoutine} style={{ width: '100%', padding: '18px', backgroundColor: '#34c759', borderRadius: '14px', border: 'none', fontWeight: 'bold', marginTop: '30px', fontSize: '1rem' }}>
                      Save Routine
                    </button>
                  </div>
                </div>
              )}
              <h3 style={{ marginTop: '35px', color: '#888' }}>My Routines</h3>
              {routines.map(r => (
                <div key={r.id} style={{ position: 'relative', marginBottom: '15px' }}>
                  <div onClick={() => startRoutine(r)} style={{ backgroundColor: '#1c1c1e', padding: '20px', borderRadius: '15px', cursor: 'pointer', border: '1px solid #2c2c2e' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{r.title}</h4>
                    <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '8px' }}>{r.exercises.join(' • ')}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteRoutine(r.id); }} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#3a3a3c', fontSize: '1.2rem' }}>✕</button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2>Performance</h2>
                <button onClick={() => {
                  let csv = "Date,Routine,Exercise,Weight,Reps\n";
                  history.forEach(h => h.exercises.forEach(ex => ex.sets.forEach(s => csv += `${h.date},${h.title},${ex.name},${s.weight},${s.reps}\n`)));
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'workout_data.csv'; a.click();
                }} style={{ backgroundColor: '#217346', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '0.85rem' }}>Export CSV</button>
              </div>

              {/* Volume Chart */}
              <div style={{ backgroundColor: '#1c1c1e', padding: '20px', borderRadius: '15px', marginBottom: '20px', height: '280px', border: '1px solid #2c2c2e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#888' }}>Volume Trend</h4>
                  <select value={chartFilter} onChange={(e) => setChartFilter(e.target.value)} style={{ backgroundColor: '#2c2c2e', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px' }}>
                    <option value="All">All sessions</option>
                    {[...new Set(history.map(h => h.title))].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={[...history].reverse().filter(h => chartFilter === 'All' || h.title === chartFilter).map(h => ({ date: h.date, volume: h.exercises.reduce((sum, ex) => sum + ex.sets.reduce((sSum, s) => sSum + (Number(s.weight) * Number(s.reps)), 0), 0) }))}>
                    <XAxis dataKey="date" hide /><YAxis hide /><Tooltip contentStyle={{ backgroundColor: '#1c1c1e', border: '1px solid #444', color: '#fff' }} />
                    <Line type="monotone" dataKey="volume" stroke="#007bff" strokeWidth={3} dot={{ fill: '#007bff', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Dynamic Calendar */}
              <div style={{ backgroundColor: '#1c1c1e', padding: '20px', borderRadius: '15px', marginBottom: '25px', border: '1px solid #2c2c2e' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold', fontSize: '1.1rem' }}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center' }}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={{ color: '#007bff', fontWeight: 'bold', fontSize: '0.75rem' }}>{d}</div>)}
                  {(() => {
                    const n = new Date(); const y = n.getFullYear(); const m = n.getMonth();
                    const f = new Date(y, m, 1).getDay(); const dM = new Date(y, m + 1, 0).getDate();
                    const days = [];
                    for (let i = 0; i < f; i++) days.push(<div key={`e-${i}`} />);
                    for (let d = 1; d <= dM; d++) {
                      const ds = `${m + 1}/${d}/${y}`; const has = history.some(h => h.date === ds);
                      days.push(<div key={d} style={{ height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: has ? '#007bff' : 'transparent', color: has ? '#fff' : '#888', fontSize: '0.9rem', border: has ? 'none' : '1px solid #2c2c2e' }}>{d}</div>);
                    }
                    return days;
                  })()}
                </div>
              </div>

              <h3>History</h3>
              {history.slice(0, 10).map((h, i) => (
                <div key={i} style={{ backgroundColor: '#1c1c1e', borderRadius: '15px', marginBottom: '12px', borderLeft: '5px solid #007bff', overflow: 'hidden' }}>
                  <div onClick={() => setExpandedIndex(expandedIndex === i ? null : i)} style={{ padding: '18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><h3 style={{ margin: 0, fontSize: '1.05rem' }}>{h.title}</h3><span style={{ color: '#888', fontSize: '0.85rem' }}>{h.date}</span></div>
                    <div style={{ color: '#444' }}>{expandedIndex === i ? '▲' : '▼'}</div>
                  </div>
                  {expandedIndex === i && (
                    <div style={{ padding: '0 18px 18px 18px', borderTop: '1px solid #2c2c2e', paddingTop: '15px' }}>
                      {h.exercises.map((ex, exIdx) => (
                        <div key={exIdx} style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.9rem', color: '#007bff', fontWeight: 'bold' }}>{ex.name}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', color: '#ccc', fontSize: '0.8rem', marginTop: '5px' }}>
                            {ex.sets.map((s, sIdx) => <span key={sIdx} style={{ backgroundColor: '#2c2c2e', padding: '3px 8px', borderRadius: '5px' }}>{s.weight}lb x {s.reps}</span>)}
                          </div>
                        </div>
                      ))}
                      <button onClick={() => { if (window.confirm("Delete?")) setHistory(history.filter((_, idx) => idx !== i)) }} style={{ marginTop: '15px', background: 'none', border: 'none', color: '#ff3b30', fontSize: '0.85rem', padding: 0 }}>Delete Log</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;