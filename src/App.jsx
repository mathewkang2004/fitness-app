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

  const addSet = (exIndex) => {
    const newWorkout = { ...activeWorkout };
    newWorkout.exercises[exIndex].sets.push({ weight: '', reps: '', completed: false });
    setActiveWorkout(newWorkout);
  };

  const updateSet = (exIndex, setIndex, field, value) => {
    const newWorkout = { ...activeWorkout };
    newWorkout.exercises[exIndex].sets[setIndex][field] = value;
    setActiveWorkout(newWorkout);
  };

  const deleteSet = (exIndex, setIndex) => {
    const newWorkout = { ...activeWorkout };
    if (newWorkout.exercises[exIndex].sets.length > 1) {
      newWorkout.exercises[exIndex].sets.splice(setIndex, 1);
      setActiveWorkout(newWorkout);
    } else {
      alert("Each exercise must have at least one set!");
    }
  };

  const toggleSet = (exIndex, setIndex) => {
    const newWorkout = { ...activeWorkout };
    const current = newWorkout.exercises[exIndex].sets[setIndex];
    current.completed = !current.completed;
    setActiveWorkout(newWorkout);
  };

  const finishWorkout = () => {
    const completed = { ...activeWorkout, date: new Date().toLocaleDateString(), timestamp: new Date().toISOString() };
    setHistory([completed, ...history]);
    setIsWorkingOut(false);
    alert("Workout Saved! 🚀");
  };

  const addExerciseToTemplate = (ex) => {
    if (!newRoutineExercises.includes(ex)) setNewRoutineExercises([...newRoutineExercises, ex]);
  };

  const saveNewRoutine = () => {
    if (!newRoutineTitle || newRoutineExercises.length === 0) return alert("Missing title or exercises!");
    setRoutines([...routines, { id: Date.now(), title: newRoutineTitle, exercises: newRoutineExercises }]);
    setIsCreating(false); setNewRoutineTitle(''); setNewRoutineExercises([]); setRoutineSearch('');
  };

  const deleteRoutine = (id) => {
    if (window.confirm("Delete this routine?")) {
      setRoutines(routines.filter(r => r.id !== id));
    }
  };

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: '-apple-system, sans-serif' }}>

      {/* --- ACTIVE WORKOUT OVERLAY --- */}
      {isWorkingOut && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#000', zIndex: 100, overflowY: 'auto', padding: '20px' }}>
          <div style={{ position: 'sticky', top: '-20px', backgroundColor: '#000', padding: '20px 0', zIndex: 101, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1c1c1e', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setIsWorkingOut(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.5rem' }}>✕</button>
              <h2 style={{ margin: 0 }}>{activeWorkout.title}</h2>
            </div>
            <button onClick={finishWorkout} style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold' }}>Finish</button>
          </div>
          {activeWorkout.exercises.map((ex, exIdx) => (
            <div key={exIdx} style={{ backgroundColor: '#1c1c1e', borderRadius: '12px', padding: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ color: '#007bff', marginTop: 0 }}>{ex.name}</h3>

                <button onClick={() => {
                  const newWorkout = { ...activeWorkout };
                  newWorkout.exercises.splice(exIdx, 1);
                  setActiveWorkout(newWorkout);
                }}
                  style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '0.75rem', cursor: 'pointer', opacity: 0.7 }}
                >
                  Remove Exercise
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 40px 40px', gap: '10px', alignItems: 'center', color: '#888', marginBottom: '10px', fontSize: '0.8rem' }}>
                <span>SET</span><span>LBS</span><span>REPS</span><span></span><span></span>
              </div>
              {ex.sets.map((set, sIdx) => (
                <div key={sIdx} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 40px 40px', gap: '10px', marginBottom: '10px', opacity: set.completed ? 0.6 : 1 }}>
                  <div style={{ textAlign: 'center', alignSelf: 'center' }}>{sIdx + 1}</div>
                  <input type="number" placeholder="LBS" value={set.weight} onChange={(e) => updateSet(exIdx, sIdx, 'weight', e.target.value)} style={{ backgroundColor: '#2c2c2e', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }} />
                  <input type="number" placeholder="REPS" value={set.reps} onChange={(e) => updateSet(exIdx, sIdx, 'reps', e.target.value)} style={{ backgroundColor: '#2c2c2e', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }} />
                  <button onClick={() => toggleSet(exIdx, sIdx)} style={{ background: 'none', border: 'none', fontSize: '1.1rem', color: set.completed ? '#34c759' : '#3a3a3c' }}>{set.completed ? '✅' : '✔️'}</button>
                  <button onClick={() => deleteSet(exIdx, sIdx)} style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '1rem' }}>✕</button>
                </div>
              ))}
              <button onClick={() => addSet(exIdx)} style={{ width: '100%', padding: '8px', backgroundColor: '#2c2c2e', color: '#888', border: 'none', borderRadius: '6px', marginTop: '10px' }}>+ Add Set</button>
            </div>
          ))}
          <button onClick={() => { if (window.confirm("Discard workout?")) setIsWorkingOut(false) }} style={{ color: '#ff3b30', width: '100%', background: 'none', border: 'none', marginTop: '20px', paddingBottom: '40px' }}>Discard Workout</button>
        </div>
      )}

      {/* --- NORMAL VIEW --- */}
      {!isWorkingOut && (
        <div style={{ padding: '20px' }}>
          <nav style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <h1 onClick={() => setActiveTab('workouts')} style={{ opacity: activeTab === 'workouts' ? 1 : 0.4, cursor: 'pointer' }}>Workouts</h1>
            <h1 onClick={() => setActiveTab('profile')} style={{ opacity: activeTab === 'profile' ? 1 : 0.4, cursor: 'pointer' }}>Profile</h1>
          </nav>

          {activeTab === 'workouts' ? (
            <div>
              <button onClick={() => setIsCreating(true)} style={{ width: '100%', padding: '15px', backgroundColor: '#007bff', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}>+ Custom Routine</button>
              {isCreating && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#000', zIndex: 110, padding: '20px', overflowY: 'auto', boxSizing: 'border-box' }}>
                  <h2>Create Routine</h2>
                  <input placeholder="Routine Title" value={newRoutineTitle} onChange={(e) => setNewRoutineTitle(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#1c1c1e', border: 'none', borderRadius: '8px', color: '#fff', marginBottom: '20px', fontSize: '16px', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
                    {newRoutineExercises.map(ex => <span key={ex} onClick={() => setNewRoutineExercises(newRoutineExercises.filter(i => i !== ex))} style={{ backgroundColor: '#007bff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem' }}>{ex} ✕</span>)}
                  </div>
                  <input placeholder="Search exercises..." value={routineSearch} onChange={(e) => setRoutineSearch(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#2c2c2e', border: 'none', borderRadius: '8px', color: '#fff', marginBottom: '15px', fontSize: '16px', boxSizing: 'border-box' }} />
                  {Object.entries(EXERCISE_LIST).map(([muscle, exercises]) => {
                    const filtered = exercises.filter(ex => ex.toLowerCase().includes(routineSearch.toLowerCase()));
                    if (routineSearch && filtered.length === 0) return null;
                    return (
                      <details key={muscle} open={routineSearch.length > 0} style={{ marginBottom: '10px', backgroundColor: '#1c1c1e', borderRadius: '8px' }}>
                        <summary style={{ padding: '12px', cursor: 'pointer' }}>{muscle} ({filtered.length})</summary>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px' }}>
                          {filtered.map(ex => <button key={ex} onClick={() => addExerciseToTemplate(ex)} style={{ padding: '6px 10px', borderRadius: '15px', background: newRoutineExercises.includes(ex) ? '#007bff' : '#2c2c2e', color: '#fff', border: '1px solid #444' }}>{ex}</button>)}
                        </div>
                      </details>
                    );
                  })}
                  <button onClick={saveNewRoutine} style={{ width: '100%', padding: '15px', backgroundColor: '#34c759', borderRadius: '12px', border: 'none', fontWeight: 'bold', marginTop: '20px' }}>Save Routine</button>
                  <button onClick={() => setIsCreating(false)} style={{ width: '100%', marginTop: '10px', color: '#888', background: 'none', border: 'none' }}>Cancel</button>
                </div>
              )}
              <h3 style={{ marginTop: '30px' }}>My Routines</h3>
              {routines.map(r => (
                <div key={r.id} style={{ position: 'relative', marginBottom: '15px' }}>
                  <div onClick={() => startRoutine(r)} style={{ backgroundColor: '#1c1c1e', padding: '20px', borderRadius: '12px', cursor: 'pointer' }}>
                    <h4 style={{ margin: 0 }}>{r.title}</h4>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>{r.exercises.join(', ')}</p>
                  </div>
                  <button onClick={() => deleteRoutine(r.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#444', fontSize: '1.2rem' }}>✕</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Performance Profile</h2>
                <button
                  onClick={() => {
                    let csv = "Date,Routine,Exercise,Weight,Reps\n";
                    history.forEach(h => h.exercises.forEach(ex => ex.sets.forEach(s => csv += `${h.date},${h.title},${ex.name},${s.weight},${s.reps}\n`)));
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'workout_data.csv'; a.click();
                  }}
                  style={{ backgroundColor: '#217346', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>Export CSV</button>
              </div>

              {/* 📈 VOLUME TREND CHART */}
              {/* --- FILTERED VOLUME CHART --- */}
              <div style={{ backgroundColor: '#1c1c1e', padding: '20px', borderRadius: '12px', marginBottom: '20px', height: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#888' }}>Volume Trend</h4>

                  {/* Dropdown to switch between Upper A, Lower B, etc. */}
                  <select
                    value={chartFilter}
                    onChange={(e) => setChartFilter(e.target.value)}
                    style={{ backgroundColor: '#2c2c2e', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    <option value="All">Total Volume</option>
                    {[...new Set(history.map(h => h.title))].map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                </div>

                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={[...history]
                    .reverse()
                    .filter(h => chartFilter === 'All' || h.title === chartFilter)
                    .map(h => ({
                      date: h.date,
                      volume: h.exercises.reduce((sum, ex) => sum + ex.sets.reduce((sSum, s) => sSum + (Number(s.weight) * Number(s.reps)), 0), 0)
                    }))}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1c1c1e', border: '1px solid #444', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#007bff' }}
                    />
                    {/* The main progress line */}
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="#007bff"
                      strokeWidth={3}
                      dot={{ fill: '#007bff', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Quick Stat Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px', fontSize: '0.75rem', color: '#888' }}>
                  <span>Sessions: {history.filter(h => chartFilter === 'All' || h.title === chartFilter).length}</span>
                  <span>Avg: {Math.round(history.filter(h => chartFilter === 'All' || h.title === chartFilter).reduce((acc, curr) => acc + curr.exercises.reduce((s, ex) => s + ex.sets.reduce((ss, set) => ss + (Number(set.weight) * Number(set.reps)), 0), 0), 0) / (history.filter(h => chartFilter === 'All' || h.title === chartFilter).length || 1))} lbs</span>
                </div>
              </div>

              {/* 📅 DYNAMIC TRAINING CALENDAR */}
              <div style={{ backgroundColor: '#1c1c1e', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '15px', fontWeight: 'bold' }}>
                  {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={{ color: '#007bff', fontWeight: 'bold', fontSize: '0.7rem' }}>{d}</div>)}
                  {(() => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = now.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const days = [];
                    for (let i = 0; i < firstDay; i++) { days.push(<div key={`empty-${i}`} />); }
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = `${month + 1}/${day}/${year}`;
                      const hasWorkout = history.some(h => h.date === dateStr);
                      days.push(
                        <div key={day} style={{
                          height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '50%', backgroundColor: hasWorkout ? '#007bff' : 'transparent',
                          color: hasWorkout ? '#fff' : '#888', fontSize: '0.8rem',
                          border: hasWorkout ? 'none' : '1px solid #2c2c2e'
                        }}>
                          {day}
                        </div>
                      );
                    }
                    return days;
                  })()}
                </div>
              </div>

              <h3>Recent Activity</h3>
              {history.length === 0 ? (
                <p style={{ color: '#888', textAlign: 'center' }}>No workouts logged yet. 💪</p>
              ) : (
                history.slice(0, 10).map((h, i) => (
                  <div key={i} style={{ backgroundColor: '#1c1c1e', borderRadius: '12px', marginBottom: '10px', borderLeft: '4px solid #007bff', overflow: 'hidden' }}>
                    <div onClick={() => setExpandedIndex(expandedIndex === i ? null : i)} style={{ padding: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.0rem' }}>{h.title}</h3>
                        <span style={{ color: '#888', fontSize: '0.8rem' }}>{h.date}</span>
                      </div>
                      <div style={{ color: '#888', fontSize: '0.7rem' }}>{expandedIndex === i ? '▲' : '▼'}</div>
                    </div>
                    {expandedIndex === i && (
                      <div style={{ padding: '0 15px 15px 15px', borderTop: '1px solid #2c2c2e', paddingTop: '10px' }}>
                        {h.exercises.map((ex, exIdx) => (
                          <div key={exIdx} style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#007bff', fontWeight: 'bold' }}>{ex.name}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', color: '#ccc', fontSize: '0.75rem' }}>
                              {ex.sets.map((s, sIdx) => <span key={sIdx} style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: '4px' }}>{s.weight}lb x {s.reps}</span>)}
                            </div>
                          </div>
                        ))}
                        <button onClick={() => { if (window.confirm("Delete log?")) setHistory(history.filter((_, idx) => idx !== i)) }} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#ff3b30', fontSize: '0.75rem', padding: 0, cursor: 'pointer' }}>Delete Workout</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;