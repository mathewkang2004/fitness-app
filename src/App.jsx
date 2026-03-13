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

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: '-apple-system, sans-serif' }}>
      {isWorkingOut && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#000', zIndex: 100, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{activeWorkout.title}</h2>
            <button onClick={finishWorkout} style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold' }}>Finish</button>
          </div>
          {activeWorkout.exercises.map((ex, exIdx) => (
            <div key={exIdx} style={{ backgroundColor: '#1c1c1e', borderRadius: '12px', padding: '15px', marginBottom: '20px' }}>
              <h3 style={{ color: '#007bff', marginTop: 0 }}>{ex.name}</h3>
              {ex.sets.map((set, sIdx) => (
                <div key={sIdx} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 40px', gap: '10px', marginBottom: '10px', opacity: set.completed ? 0.6 : 1 }}>
                  <div style={{ textAlign: 'center' }}>{sIdx + 1}</div>
                  <input type="number" placeholder="LBS" value={set.weight} onChange={(e) => updateSet(exIdx, sIdx, 'weight', e.target.value)} style={{ backgroundColor: '#2c2c2e', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px' }} />
                  <input type="number" placeholder="REPS" value={set.reps} onChange={(e) => updateSet(exIdx, sIdx, 'reps', e.target.value)} style={{ backgroundColor: '#2c2c2e', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px' }} />
                  <button onClick={() => toggleSet(exIdx, sIdx)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: set.completed ? '#34c759' : '#3a3a3c' }}>{set.completed ? '✅' : '✔️'}</button>
                </div>
              ))}
              <button onClick={() => addSet(exIdx)} style={{ width: '100%', padding: '8px', backgroundColor: '#2c2c2e', color: '#888', border: 'none', borderRadius: '6px' }}>+ Add Set</button>
            </div>
          ))}
          <button onClick={() => setIsWorkingOut(false)} style={{ color: '#ff3b30', width: '100%', background: 'none', border: 'none', marginTop: '20px' }}>Cancel</button>
        </div>
      )}

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
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#000', zIndex: 110, padding: '20px', overflowY: 'auto' }}>
                  <h2>Create Routine</h2>
                  <input placeholder="Title" value={newRoutineTitle} onChange={(e) => setNewRoutineTitle(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#1c1c1e', border: 'none', borderRadius: '8px', color: '#fff', marginBottom: '15px' }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
                    {newRoutineExercises.map(ex => <span key={ex} onClick={() => setNewRoutineExercises(newRoutineExercises.filter(i => i !== ex))} style={{ backgroundColor: '#007bff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem' }}>{ex} ✕</span>)}
                  </div>
                  <input placeholder="Search exercises..." value={routineSearch} onChange={(e) => setRoutineSearch(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#2c2c2e', border: 'none', borderRadius: '8px', color: '#fff', marginBottom: '15px' }} />
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
              {routines.map(r => <div key={r.id} onClick={() => startRoutine(r)} style={{ backgroundColor: '#1c1c1e', padding: '20px', borderRadius: '12px', marginBottom: '15px' }}><h4>{r.title}</h4><p style={{ color: '#888', fontSize: '0.9rem' }}>{r.exercises.join(', ')}</p></div>)}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>History</h2>
                <button 
                  onClick={() => {
                    let csv = "Date,Routine,Exercise,Weight,Reps\n";
                    history.forEach(h => h.exercises.forEach(ex => ex.sets.forEach(s => csv += `${h.date},${h.title},${ex.name},${s.weight},${s.reps}\n`)));
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'workout_data.csv'; a.click();
                  }}
                  style={{ backgroundColor: '#217346', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px' }}>Export CSV</button>
              </div>
              {history.map((h, i) => <div key={i} style={{ backgroundColor: '#1c1c1e', padding: '15px', borderRadius: '12px', marginBottom: '10px' }}><strong>{h.title}</strong> — {h.date}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;