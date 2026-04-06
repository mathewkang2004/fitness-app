import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

const EXERCISE_LIST = {
  Chest: ["Bench Press (Barbell)", "Incline Bench Press (Barbell)", "Incline Bench Press (Smith)", "Flat Press (Dumbbell)", "Incline Press (Dumbbell)", "Bench Press (Machine)", "Chest Flyes (Machine)", "Bench Press (Smith)", "Chest Flyes (Dumbbell)", "Dips", "Push-ups", "Crossovers (Dumbbell)", "Crossovers (Cable)"],
  Back: ["Pull-ups", "Close Grip Row (Cable)", "Wide Grip Row (Cable)", "Single-Arm Row (Cable)", "Row (Barbell)", "Back Extensions", "Lat Pulldown (Wide Grip)", "Kelso Shrugs (Machine)", "Kelso Shrugs (Barbell)", "Kelso Shrugs (Dumbbell)", "Chin-ups", "Keenan Flaps", "Shrugs", "Close Grip Row (Machine)", "Wide Grip Row (Machine)", "Neutral Grip Row (Machine)", "Lat Pulldown (Close Grip)", "Lat Pulldown (Neutral Grip)"],
  Legs: ["Squat (Barbell)", "Seated Calf Raise", "Standing Calf Raise", "Leg Extensions", "Lying Leg Curls", "Seated Leg Curls", "Bulgarian Split Squats", "Hack Squat", "Pendulum Squat", "Adductors", "Abductors", "Hip Thrusts", "Goblet Squat", "Romanian Deadlift", "Stiff-legged Deadlift", "Leg Press"],
  Arms: ["Shoulder Press (Dumbbell)", "Bicep Curls (Dumbbell)", "Hammer Curls (Dumbbell)", "Bicep Curls (Cable)", "Hammer Curls (Cable)", "Reverse Curls (Dumbbell)", "Reverse Curls (Cable)", "Shoulder Press (Machine)", "V-Bar Pushdowns", "Straight Bar Pushdowns", "Preacher Curls (Dumbbell)", "EZ Bar Preacher Curls", "Straight Bar Preacher Curls", "Lat Raises (Cable)", "JM Press (Smith)", "EZ Bar JM Press", "Rope Tricep Pushdowns", "French Press", "Skullcrushers (Dumbbell)", "EZ Bar Skullcrushers", "Rear Delt Flyes", "Face Pulls", "Shoulder Press (Barbell)", "Palms-up Wrist Curls (Dumbbell)", "Palms-down Wrist Curls (Dumbbell)", "Palms-up Wrist Curls (Cable)", "Palms-down Wrist Curls (Cable)", "Bayesian Curls (Cable)", "Spider Curls", "Overhead Cable Extensions", "Overhead Dumbbell Extensions", "Lat Raises (Machine)", "Front Raises (Dumbbell)"],
  Abs: ["Decline Sit-ups", "Sit-ups", "Hanging Leg Raises", "Dragon Flags", "Cable Crunches", "Russian Twists"],
  fullBody: ["Deadlift (Barbell)"]
};

const theme = {
  bg: '#09090f',
  card: '#12121c',
  accent: '#0a84ff',
  success: '#30d158',
  danger: '#ff453a',
  gray: '#5a5a6e',
  grayLight: '#9090a8',
  input: '#1a1a28',
  border: '#22223a',
  radius: '20px',
  radiusSm: '14px',
};

const gradBlue = 'linear-gradient(135deg, #0a84ff 0%, #5856d6 100%)';
const gradGreen = 'linear-gradient(135deg, #30d158 0%, #25a244 100%)';

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
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [chartMetric, setChartMetric] = useState('Volume');
  const [chartFilter, setChartFilter] = useState('All');
  const [chartExercise, setChartExercise] = useState('');
  const [selectedVolumePoint, setSelectedVolumePoint] = useState(null);

  useEffect(() => {
    localStorage.setItem('fitness_routines', JSON.stringify(routines));
    localStorage.setItem('fitness_history', JSON.stringify(history));
    localStorage.setItem('fitness_weight', JSON.stringify(weightHistory));
    localStorage.setItem('fitness_active_status', JSON.stringify(isWorkingOut));
    localStorage.setItem('fitness_active_workout', JSON.stringify(activeWorkout));
  }, [routines, history, weightHistory, isWorkingOut, activeWorkout]);

  // --- UTILITIES ---
  const handleImport = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const d = JSON.parse(event.target.result);
        if (d.routines) setRoutines(d.routines);
        if (d.history) setHistory(d.history);
        if (d.weightHistory) setWeightHistory(d.weightHistory);
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

  const getProgression = (exerciseName, routineTitle) => {
    const lastSession = history.find(h => h.title === routineTitle);
    if (!lastSession) return null;
    const lastEx = lastSession.exercises.find(ex => ex.name === exerciseName);
    if (!lastEx) return null;
    const maxWeight = Math.max(...lastEx.sets.map(s => Number(s.weight)));
    const maxReps = Math.max(...lastEx.sets.filter(s => Number(s.weight) === maxWeight).map(s => Number(s.reps)));
    return { weight: maxWeight, reps: maxReps };
  };

  const getPlates = (lbs, name) => {
    if (!name.toLowerCase().includes('barbell') && !name.toLowerCase().includes('smith')) return null;
    let w = (Number(lbs) - 45) / 2;
    if (isNaN(w) || w <= 0) return null;
    const p = [45, 35, 25, 10, 5, 2.5];
    let res = [];
    p.forEach(plate => { while (w >= plate) { res.push(plate); w -= plate; } });
    return res.length ? `Side: ${res.join(', ')}` : "Bar Only";
  };

  const moveExercise = (index, direction) => {
    const newArr = [...newRoutineExercises];
    const target = index + direction;
    if (target < 0 || target >= newArr.length) return;
    [newArr[index], newArr[target]] = [newArr[target], newArr[index]];
    setNewRoutineExercises(newArr);
  };

  const moveActiveExercise = (index, direction) => {
    const newWorkout = { ...activeWorkout };
    const newExercises = [...newWorkout.exercises];
    const target = index + direction;
    if (target < 0 || target >= newExercises.length) return;
    [newExercises[index], newExercises[target]] = [newExercises[target], newExercises[index]];
    newWorkout.exercises = newExercises;
    setActiveWorkout(newWorkout);
  };

  const finishWorkout = () => {
    const filtered = activeWorkout.exercises.map(ex => ({
      ...ex,
      sets: ex.sets.filter(s => s.completed && s.weight && s.reps)
    })).filter(ex => ex.sets.length > 0);

    if (filtered.length === 0) return alert("Log at least one set!");

    let gains = [];
    let maintained = 0;

    filtered.forEach(ex => {
      const lastSession = history.find(h => h.title === activeWorkout.title);
      const lastEx = lastSession?.exercises.find(e => e.name === ex.name);

      if (lastEx) {
        const lastMaxW = Math.max(...lastEx.sets.map(s => Number(s.weight)));
        const currMaxW = Math.max(...ex.sets.map(s => Number(s.weight)));

        if (currMaxW > lastMaxW) {
          gains.push(`🚀 ${ex.name}: +${currMaxW - lastMaxW} lbs`);
        } else if (currMaxW === lastMaxW) {
          const lastMaxR = Math.max(...lastEx.sets.filter(s => Number(s.weight) === currMaxW).map(s => Number(s.reps)));
          const currMaxR = Math.max(...ex.sets.filter(s => Number(s.weight) === currMaxW).map(s => Number(s.reps)));
          if (currMaxR > lastMaxR) gains.push(`📈 ${ex.name}: +${currMaxR - lastMaxR} reps`);
          else maintained++;
        }
      }
    });

    const summaryMsg = [
      gains.length > 0 ? `MARKET REPORT:\n${gains.join('\n')}` : "Steady market. No new PRs.",
      `● Maintained: ${maintained} exercises`,
      "\nSave to history?"
    ].join('\n');

    if (window.confirm(summaryMsg)) {
      setHistory([{ ...activeWorkout, exercises: filtered, date: new Date().toLocaleDateString(), timestamp: new Date().toISOString() }, ...history]);
      setIsWorkingOut(false);
      setActiveWorkout({title:"", exercises:[]});
    }
  };

  const inputStyle = { backgroundColor: theme.input, border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm, color: '#fff', padding: '14px', fontSize: '16px', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const buttonTap = { scale: 0.96, transition: { type: "spring", stiffness: 400, damping: 17 } };
  const cardStyle = { backgroundColor: theme.card, borderRadius: theme.radius, border: `1px solid ${theme.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' };

  return (
    <div style={{ backgroundColor: theme.bg, color: '#fff', minHeight: '100vh', fontFamily: '-apple-system, sans-serif', paddingBottom: '90px' }}>

      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        details > summary::after { content: ' ›'; float: right; color: #5a5a6e; }
        details[open] > summary::after { content: ' ‹'; }
        select option { background-color: #1a1a28; }
      `}</style>

      {/* --- ACTIVE WORKOUT OVERLAY --- */}
      <AnimatePresence>
        {isWorkingOut && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} style={{ position: 'fixed', inset: 0, backgroundColor: theme.bg, zIndex: 100, overflowY: 'auto', padding: '20px' }}>
            <div style={{ position: 'sticky', top: '-20px', backgroundColor: 'rgba(9,9,15,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px 0 18px', zIndex: 101, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, marginBottom: '24px' }}>
              <button onClick={() => { if(window.confirm("Discard progress?")) { setIsWorkingOut(false); setActiveWorkout({title:'', exercises:[]}); } }} style={{ background: 'none', border: 'none', color: theme.gray, fontSize: '1.5rem', lineHeight: 1 }}>✕</button>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', letterSpacing: '-0.02em' }}>{activeWorkout.title}</h2>
              <motion.button whileTap={buttonTap} onClick={finishWorkout} style={{ background: gradGreen, color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '24px', fontWeight: '800', fontSize: '0.9rem', boxShadow: '0 2px 12px rgba(48,209,88,0.35)' }}>Finish</motion.button>
            </div>

            {activeWorkout.exercises.map((ex, exIdx) => {
              const lastMax = getProgression(ex.name, activeWorkout.title);
              return (
                <div key={exIdx} style={{ ...cardStyle, padding: '0', marginBottom: '20px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px 14px', borderBottom: `1px solid ${theme.border}`, background: 'linear-gradient(135deg, rgba(10,132,255,0.08) 0%, rgba(88,86,214,0.05) 100%)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: '800', letterSpacing: '-0.01em' }}>{ex.name}</h3>
                        {lastMax && (
                          <span style={{ fontSize: '0.72rem', color: theme.grayLight, marginTop: '3px', display: 'block' }}>
                            Last Max: <span style={{ color: theme.accent, fontWeight: '700' }}>{lastMax.weight} lbs × {lastMax.reps}</span>
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button onClick={() => moveActiveExercise(exIdx, -1)} style={{ background: 'none', border: 'none', color: theme.gray, fontSize: '0.9rem', padding: '4px' }}>▲</button>
                        <button onClick={() => moveActiveExercise(exIdx, 1)} style={{ background: 'none', border: 'none', color: theme.gray, fontSize: '0.9rem', padding: '4px' }}>▼</button>
                        <button onClick={() => setEditingExerciseIndex(exIdx)} style={{ background: 'none', border: 'none', color: theme.grayLight, fontSize: '0.8rem', fontWeight: '700' }}>Swap</button>
                        <button onClick={() => { const n = {...activeWorkout}; n.exercises.splice(exIdx,1); setActiveWorkout(n); }} style={{ background: 'none', border: 'none', color: theme.danger, fontSize: '0.8rem', fontWeight: '700' }}>Remove</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '14px 18px 18px' }}>
                    {ex.sets.map((set, sIdx) => {
                      const isUp = lastMax && Number(set.weight) > lastMax.weight;
                      const isDown = lastMax && Number(set.weight) < lastMax.weight;
                      const plateMath = getPlates(set.weight, ex.name);
                      return (
                        <div key={sIdx} style={{ marginBottom: '10px', opacity: set.completed ? 0.38 : 1, transition: 'opacity 0.2s' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 44px 30px', gap: '8px', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.78rem', color: theme.gray, fontWeight: '800', textAlign: 'center' }}>{sIdx+1}</div>
                            <div style={{ position: 'relative' }}>
                              <input type="number" placeholder="LBS" value={set.weight} onChange={(e) => { const n = {...activeWorkout}; n.exercises[exIdx].sets[sIdx].weight = e.target.value; setActiveWorkout(n); }} style={{ ...inputStyle, paddingRight: '30px' }} />
                              {set.weight && lastMax && <span style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: isUp ? theme.success : isDown ? theme.danger : theme.gray }}>{isUp ? '▲' : isDown ? '▼' : '●'}</span>}
                            </div>
                            <input type="number" placeholder="REPS" value={set.reps} onChange={(e) => { const n = {...activeWorkout}; n.exercises[exIdx].sets[sIdx].reps = e.target.value; setActiveWorkout(n); }} style={inputStyle} />
                            <motion.button whileTap={{ scale: 1.2 }} onClick={() => { const n = {...activeWorkout}; n.exercises[exIdx].sets[sIdx].completed = !n.exercises[exIdx].sets[sIdx].completed; setActiveWorkout(n); }} style={{ background: set.completed ? 'rgba(48,209,88,0.15)' : theme.input, border: `1px solid ${set.completed ? theme.success : theme.border}`, borderRadius: '10px', fontSize: '1.1rem', color: set.completed ? theme.success : theme.gray, height: '48px', cursor: 'pointer' }}>{set.completed ? '✓' : '○'}</motion.button>
                            <button onClick={() => { const n = {...activeWorkout}; n.exercises[exIdx].sets.splice(sIdx,1); setActiveWorkout(n); }} style={{ color: theme.danger, background: 'none', border: 'none', fontSize: '1.1rem', padding: '4px' }}>✕</button>
                          </div>
                          {plateMath && !set.completed && <div style={{ fontSize: '0.7rem', color: theme.accent, marginLeft: '36px', marginTop: '5px', fontWeight: '600', opacity: 0.9 }}>🏋️ {plateMath}</div>}
                        </div>
                      );
                    })}
                    <motion.button whileTap={buttonTap} onClick={() => { const n = {...activeWorkout}; n.exercises[exIdx].sets.push({weight:'', reps:'', completed:false}); setActiveWorkout(n); }} style={{ width: '100%', padding: '11px', backgroundColor: 'transparent', color: theme.grayLight, borderRadius: theme.radiusSm, border: `1px dashed ${theme.border}`, fontSize: '0.85rem', fontWeight: '700', marginTop: '6px', cursor: 'pointer' }}>+ Add Set</motion.button>
                  </div>
                </div>
              );
            })}

            {editingExerciseIndex !== null && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: theme.bg, zIndex: 120, padding: '20px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontWeight: '800' }}>Swap Exercise</h3>
                  <button onClick={() => setEditingExerciseIndex(null)} style={{ color: theme.grayLight, background: 'none', border: 'none', fontSize: '1.5rem', lineHeight: 1 }}>✕</button>
                </div>
                <input placeholder="Search exercises..." value={routineSearch} onChange={(e) => setRoutineSearch(e.target.value)} style={{ ...inputStyle, marginBottom: '12px' }} />
                {Object.entries(EXERCISE_LIST).map(([m, exs]) => (
                  <details key={m} open={routineSearch.length > 0} style={{ ...cardStyle, marginTop: '10px', overflow: 'hidden' }}>
                    <summary style={{ padding: '14px 18px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' }}>{m}</summary>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '14px 18px 18px', borderTop: `1px solid ${theme.border}` }}>
                      {exs.filter(e => e.toLowerCase().includes(routineSearch.toLowerCase())).map(e => <button key={e} onClick={() => { const n = {...activeWorkout}; n.exercises[editingExerciseIndex].name = e; setActiveWorkout(n); setEditingExerciseIndex(null); }} style={{ padding: '8px 14px', borderRadius: '20px', background: theme.input, color: '#fff', border: `1px solid ${theme.border}`, fontSize: '0.85rem', cursor: 'pointer' }}>{e}</button>)}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT AREA --- */}
      {!isWorkingOut && (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>

              {/* --- WORKOUTS TAB --- */}
              {activeTab === 'workouts' && (
                <div>
                  <motion.button whileTap={buttonTap} onClick={() => setIsCreating(true)} style={{ width: '100%', padding: '17px', background: gradBlue, color: '#fff', borderRadius: theme.radius, border: 'none', fontWeight: '800', fontSize: '1rem', marginBottom: '6px', boxShadow: '0 4px 20px rgba(10,132,255,0.3)', cursor: 'pointer' }}>+ New Routine</motion.button>
                  {routines.map(r => (
                    <motion.div whileTap={buttonTap} key={r.id} onClick={() => startRoutine(r)} style={{ position: 'relative', marginTop: '12px', ...cardStyle, padding: '22px 20px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, paddingRight: '32px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{r.title}</h4>
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: theme.accent, backgroundColor: 'rgba(10,132,255,0.12)', padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{r.exercises.length} exercises</span>
                          </div>
                          <p style={{ color: theme.gray, fontSize: '0.82rem', margin: 0, lineHeight: '1.5' }}>{r.exercises.join(' · ')}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); if(window.confirm("Delete?")) setRoutines(routines.filter(x => x.id !== r.id)); }} style={{ position: 'absolute', top: '20px', right: '18px', color: theme.gray, background: 'none', border: 'none', fontSize: '1.1rem', lineHeight: 1 }}>✕</button>
                      </div>
                    </motion.div>
                  ))}

                  {isCreating && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: theme.bg, zIndex: 110, padding: '20px', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.3rem' }}>Create Routine</h3>
                        <button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', color: theme.grayLight, fontSize: '1.5rem', lineHeight: 1 }}>✕</button>
                      </div>
                      <input placeholder="Routine Title" value={newRoutineTitle} onChange={(e) => setNewRoutineTitle(e.target.value)} style={{ ...inputStyle, marginBottom: '16px', fontSize: '17px', fontWeight: '700' }} />
                      <div style={{ marginBottom: '16px' }}>
                        {newRoutineExercises.map((ex, i) => (
                          <div key={ex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(10,132,255,0.08)', border: `1px solid rgba(10,132,255,0.25)`, padding: '12px 15px', borderRadius: theme.radiusSm, marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{ex}</span>
                            <div style={{ display: 'flex', gap: '14px' }}>
                              <button onClick={() => moveExercise(i, -1)} style={{background:'none', border:'none', color:theme.gray, cursor:'pointer'}}>▲</button>
                              <button onClick={() => moveExercise(i, 1)} style={{background:'none', border:'none', color:theme.gray, cursor:'pointer'}}>▼</button>
                              <button onClick={() => setNewRoutineExercises(newRoutineExercises.filter(item => item !== ex))} style={{background:'none', border:'none', color:theme.danger, cursor:'pointer'}}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <input placeholder="Search exercises..." value={routineSearch} onChange={(e) => setRoutineSearch(e.target.value)} style={{ ...inputStyle, marginBottom: '4px' }} />
                      {Object.entries(EXERCISE_LIST).map(([m, exs]) => (
                        <details key={m} style={{ ...cardStyle, marginTop: '10px', overflow: 'hidden' }}>
                          <summary style={{ padding: '14px 18px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' }}>{m}</summary>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '14px 18px 18px', borderTop: `1px solid ${theme.border}` }}>
                            {exs.filter(e => e.toLowerCase().includes(routineSearch.toLowerCase())).map(e => <button key={e} onClick={() => !newRoutineExercises.includes(e) && setNewRoutineExercises([...newRoutineExercises, e])} style={{ padding: '9px 14px', borderRadius: '20px', background: newRoutineExercises.includes(e) ? 'rgba(10,132,255,0.15)' : theme.input, color: '#fff', border: `1px solid ${newRoutineExercises.includes(e) ? 'rgba(10,132,255,0.4)' : theme.border}`, cursor: 'pointer', fontSize: '0.85rem' }}>{e}</button>)}
                          </div>
                        </details>
                      ))}
                      <button onClick={() => { if(!newRoutineTitle || !newRoutineExercises.length) return; setRoutines([...routines, {id: Date.now(), title: newRoutineTitle, exercises: newRoutineExercises}]); setIsCreating(false); setNewRoutineTitle(''); setNewRoutineExercises([]); }} style={{ width: '100%', padding: '17px', background: gradGreen, color: '#fff', borderRadius: theme.radius, border: 'none', fontWeight: '800', marginTop: '28px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(48,209,88,0.25)' }}>Save Routine</button>
                    </div>
                  )}
                </div>
              )}

              {/* --- PROFILE TAB --- */}
              {activeTab === 'profile' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontWeight: '800', letterSpacing: '-0.03em' }}>Performance</h2>
                    <button onClick={() => {
                      let csv = "Date,Routine,Exercise,Weight,Reps\n";
                      history.forEach(h => h.exercises.forEach(ex => ex.sets.forEach(s => csv += `${h.date},${h.title},${ex.name},${s.weight},${s.reps}\n`)));
                      const blob = new Blob([csv], { type: 'text/csv' });
                      window.open(URL.createObjectURL(blob));
                    }} style={{ backgroundColor: '#1a3d28', color: '#30d158', border: '1px solid rgba(48,209,88,0.3)', padding: '9px 16px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>Export CSV</button>
                  </div>
                  {(() => {
                    const filteredHistory = [...history].reverse().filter(h => chartFilter === 'All' || h.title === chartFilter);
                    const availableExercises = [...new Set(filteredHistory.flatMap(h => h.exercises.map(ex => ex.name)))];
                    const effectiveExercise = availableExercises.includes(chartExercise) ? chartExercise : availableExercises[0] || '';
                    const chartData = filteredHistory.map(h => {
                      if (chartMetric === 'Volume') {
                        const breakdown = h.exercises.map(ex => ({ name: ex.name, vol: ex.sets.reduce((ss, set) => ss + (Number(set.weight) * Number(set.reps) * (ex.name.includes('(Dumbbell)') ? 2 : 1)), 0) })).filter(b => b.vol > 0).sort((a, b) => b.vol - a.vol);
                        return { date: h.date, value: breakdown.reduce((s, b) => s + b.vol, 0), breakdown };
                      } else {
                        const ex = h.exercises.find(e => e.name === effectiveExercise);
                        if (!ex) return null;
                        return { date: h.date, value: Math.max(...ex.sets.map(s => Number(s.weight) * (36 / (37 - Math.min(Number(s.reps), 10))))) };
                      }
                    }).filter(Boolean);
                    return (
                      <div style={{ ...cardStyle, padding: '20px', height: chartMetric === '1RM' ? '360px' : '320px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
                          <select value={chartMetric} onChange={(e) => { setChartMetric(e.target.value); setSelectedVolumePoint(null); }} style={{ backgroundColor: theme.input, color: '#fff', border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '8px 12px', fontSize: '0.78rem', fontWeight: '700', flex: 1 }}>
                            <option value="Volume">Volume Trend</option>
                            <option value="1RM">Est. 1RM Trend</option>
                          </select>
                          <select value={chartFilter} onChange={(e) => { setChartFilter(e.target.value); setSelectedVolumePoint(null); }} style={{ backgroundColor: theme.input, color: '#fff', border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '8px 12px', fontSize: '0.78rem', fontWeight: '700', flex: 1 }}>
                            <option value="All">All Routines</option>
                            {[...new Set(history.map(h => h.title))].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        {chartMetric === '1RM' && (
                          <select value={effectiveExercise} onChange={(e) => setChartExercise(e.target.value)} style={{ backgroundColor: theme.input, color: '#fff', border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '8px 12px', fontSize: '0.78rem', fontWeight: '700', width: '100%', marginBottom: '8px' }}>
                            {availableExercises.map(e => <option key={e} value={e}>{e}</option>)}
                          </select>
                        )}
                        <div onClick={() => { if (chartMetric === 'Volume' && chartFilter !== 'All') setSelectedVolumePoint({ isComparison: true }); }} style={{ width: '100%', height: '75%', cursor: chartFilter !== 'All' && chartMetric === 'Volume' ? 'pointer' : 'default' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} onClick={(d) => { if (chartMetric === 'Volume' && chartFilter === 'All' && d && d.activePayload) setSelectedVolumePoint(d.activePayload[0].payload); }} style={{ cursor: 'inherit' }}>
                            <defs>
                              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#0a84ff" />
                                <stop offset="100%" stopColor="#5856d6" />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" hide />
                            <YAxis hide />
                            <Tooltip contentStyle={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '10px', fontSize: '0.8rem' }} formatter={(v) => [`${Math.round(v)} ${chartMetric === '1RM' ? 'lbs' : ''}`, chartMetric === '1RM' ? 'Est. 1RM' : 'Volume']} />
                            <Line type="monotone" dataKey="value" stroke="url(#lineGrad)" strokeWidth={3} dot={chartMetric === 'Volume' ? { r: 3, fill: theme.accent, strokeWidth: 0 } : false} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })()}
                  {selectedVolumePoint && chartMetric === 'Volume' && (() => {
                    if (selectedVolumePoint.isComparison) {
                      const fl = [...history].reverse().filter(h => h.title === chartFilter);
                      const recent = fl[0], prev = fl[1];
                      if (!recent || !prev) return null;
                      const getBest = (ex) => ex.sets.reduce((b, s) => { const w = Number(s.weight), r = Number(s.reps); return (w > b.w || (w === b.w && r > b.r)) ? { w, r } : b; }, { w: 0, r: 0 });
                      const allNames = [...new Set([...recent.exercises.map(e => e.name), ...prev.exercises.map(e => e.name)])];
                      return (
                        <div style={{ ...cardStyle, padding: '18px 20px', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>Workout Comparison</span>
                            <button onClick={() => setSelectedVolumePoint(null)} style={{ background: 'none', border: 'none', color: theme.gray, fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr', textAlign: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.72rem', color: theme.gray }}>{prev.date}</span>
                            <span />
                            <span style={{ fontSize: '0.72rem', color: theme.gray }}>{recent.date}</span>
                          </div>
                          {allNames.map((name, i) => {
                            const recentEx = recent.exercises.find(e => e.name === name);
                            const prevEx = prev.exercises.find(e => e.name === name);
                            const rb = recentEx ? getBest(recentEx) : null;
                            const pb = prevEx ? getBest(prevEx) : null;
                            let arrow = '→', arrowColor = theme.gray;
                            if (rb && pb) {
                              if (rb.w > pb.w || (rb.w === pb.w && rb.r > pb.r)) { arrow = '↑'; arrowColor = '#30d158'; }
                              else if (rb.w < pb.w || (rb.w === pb.w && rb.r < pb.r)) { arrow = '↓'; arrowColor = '#ff453a'; }
                            } else if (rb && !pb) { arrow = 'NEW'; arrowColor = '#0a84ff'; }
                            else if (!rb && pb) { arrow = '—'; arrowColor = theme.gray; }
                            return (
                              <div key={i} style={{ padding: '8px 0', borderBottom: i < allNames.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                                <div style={{ fontSize: '0.72rem', color: theme.grayLight, marginBottom: '4px', textAlign: 'center' }}>{name}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr', alignItems: 'center', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.82rem', color: pb ? '#fff' : theme.gray }}>{pb ? `${pb.w} × ${pb.r}` : '—'}</span>
                                  <span style={{ fontWeight: '800', fontSize: '0.88rem', color: arrowColor }}>{arrow}</span>
                                  <span style={{ fontSize: '0.82rem', color: rb ? '#fff' : theme.gray }}>{rb ? `${rb.w} × ${rb.r}` : '—'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    return (
                      <div style={{ ...cardStyle, padding: '18px 20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>{selectedVolumePoint.date}</span>
                          <button onClick={() => setSelectedVolumePoint(null)} style={{ background: 'none', border: 'none', color: theme.gray, fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                        </div>
                        {selectedVolumePoint.breakdown.map((b, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < selectedVolumePoint.breakdown.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                            <span style={{ fontSize: '0.85rem', color: theme.grayLight }}>{b.name}</span>
                            <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{Math.round(b.vol)} lbs</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', marginTop: '4px', borderTop: `1px solid ${theme.border}` }}>
                          <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>Total</span>
                          <span style={{ fontWeight: '800', fontSize: '0.85rem', color: theme.accent }}>{Math.round(selectedVolumePoint.value)} lbs</span>
                        </div>
                      </div>
                    );
                  })()}
                  {(() => {
                    const n = new Date(); const cy = n.getFullYear(); const cm = n.getMonth();
                    const total = cy * 12 + cm + calendarOffset;
                    const y = Math.floor(total / 12); const m = total % 12;
                    const label = new Date(y, m, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                    const f = new Date(y, m, 1).getDay(); const dM = new Date(y, m + 1, 0).getDate();
                    const days = [];
                    for (let i = 0; i < f; i++) days.push(<div key={`e-${i}`} />);
                    for (let d = 1; d <= dM; d++) {
                      const ds = `${m + 1}/${d}/${y}`; const has = history.some(h => h.date === ds);
                      days.push(<div key={d} onClick={() => setSelectedDate(has ? ds : null)} style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: has ? gradBlue : 'transparent', color: has ? '#fff' : theme.gray, fontSize: '0.88rem', fontWeight: has ? '700' : '400', cursor: has ? 'pointer' : 'default', boxShadow: has ? '0 2px 8px rgba(10,132,255,0.3)' : 'none' }}>{d}</div>);
                    }
                    return (
                      <div style={{ ...cardStyle, padding: '22px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                          <button onClick={() => setCalendarOffset(o => o - 1)} style={{ background: 'none', border: 'none', color: theme.accent, fontSize: '1.4rem', fontWeight: '800', cursor: 'pointer', lineHeight: 1 }}>‹</button>
                          <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.01em' }}>{label}</span>
                          <button onClick={() => setCalendarOffset(o => o + 1)} disabled={calendarOffset >= 0} style={{ background: 'none', border: 'none', color: calendarOffset >= 0 ? theme.gray : theme.accent, fontSize: '1.4rem', fontWeight: '800', cursor: calendarOffset >= 0 ? 'default' : 'pointer', lineHeight: 1 }}>›</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} style={{ color: theme.accent, fontWeight: '700', fontSize: '0.7rem', marginBottom: '4px' }}>{d}</div>)}
                          {days}
                        </div>
                      </div>
                    );
                  })()}
                  {selectedDate && (
                    <div style={{ ...cardStyle, marginBottom: '20px', padding: '18px', border: `1px solid rgba(10,132,255,0.35)`, background: 'rgba(10,132,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <strong style={{ fontSize: '0.9rem', color: theme.grayLight }}>{selectedDate}</strong>
                        <button onClick={() => setSelectedDate(null)} style={{background:'none', border:'none', color:theme.gray, fontSize: '1.1rem', lineHeight: 1}}>✕</button>
                      </div>
                      {history.filter(h => h.date === selectedDate).map((h, i) => (
                        <div key={i} style={{ marginTop: i > 0 ? '12px' : 0 }}>
                          <div style={{ color: theme.accent, fontWeight: '800', fontSize: '0.95rem', marginBottom: '6px' }}>{h.title}</div>
                          {h.exercises.map((ex, exIdx) => <div key={exIdx} style={{ fontSize: '0.82rem', color: theme.grayLight, marginTop: '3px' }}>· {ex.name}: {ex.sets.map(s => `${s.weight}×${s.reps}`).join(', ')}</div>)}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '36px', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontWeight: '800', letterSpacing: '-0.02em' }}>Recent Activity</h3>
                    <button onClick={() => setShowAllActivity(v => !v)} style={{ color: theme.accent, fontSize: '0.85rem', background:'none', border:'none', fontWeight: '700', cursor: 'pointer' }}>{showAllActivity ? 'Show Less' : 'View All'}</button>
                  </div>
                  {(showAllActivity ? history : history.slice(0, 5)).map((h, i) => (
                    <div key={i} style={{ ...cardStyle, marginBottom: '10px', overflow: 'hidden' }}>
                      <div onClick={() => setExpandedIndex(expandedIndex === i ? null : i)} style={{ cursor: 'pointer', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '4px', height: '36px', borderRadius: '4px', background: gradBlue, flexShrink: 0 }} />
                          <div>
                            <strong style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '-0.01em' }}>{h.title}</strong>
                            <div style={{ color: theme.gray, fontSize: '0.78rem', marginTop: '3px' }}>{h.date}</div>
                          </div>
                        </div>
                        <span style={{ color: theme.gray, fontSize: '0.8rem' }}>{expandedIndex === i ? '▲' : '▼'}</span>
                      </div>
                      {expandedIndex === i && (
                        <div style={{ borderTop: `1px solid ${theme.border}`, padding: '16px 20px 18px' }}>
                          {h.exercises.map((ex, exIdx) => (
                            <div key={exIdx} style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '0.85rem', color: theme.accent, fontWeight: '800', marginBottom: '6px' }}>{ex.name}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {ex.sets.map((s, sIdx) => <span key={sIdx} style={{ backgroundColor: theme.input, border: `1px solid ${theme.border}`, padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '600' }}>{s.weight}lb × {s.reps}</span>)}
                              </div>
                            </div>
                          ))}
                          <button onClick={() => { if(window.confirm("Delete log?")) setHistory(history.filter((_, idx) => idx !== i)) }} style={{ color: theme.danger, background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', marginTop: '6px', cursor: 'pointer' }}>Delete Log</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* --- BODY TAB --- */}
              {activeTab === 'body' && (
                <div>
                  <div style={{ ...cardStyle, padding: '22px', marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '14px', fontWeight: '800', letterSpacing: '-0.02em' }}>Log Weight</h3>
                    <input type="number" placeholder="lbs" value={todayWeight} onChange={(e) => setTodayWeight(e.target.value)} style={{ ...inputStyle, fontSize: '22px', fontWeight: '700', textAlign: 'center' }} />
                    <motion.button whileTap={buttonTap} onClick={() => { if(!todayWeight) return; setWeightHistory([{date: new Date().toLocaleDateString(), weight: Number(todayWeight), timestamp: new Date().toISOString()}, ...weightHistory]); setTodayWeight(''); }} style={{ width: '100%', background: gradGreen, color: '#fff', padding: '15px', borderRadius: theme.radiusSm, border: 'none', marginTop: '14px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(48,209,88,0.25)' }}>Log Weight</motion.button>
                  </div>
                  {weightHistory.length > 1 && (
                    <div style={{ ...cardStyle, padding: '22px', marginBottom: '20px', height: '220px' }}>
                      <h4 style={{ margin: '0 0 14px', color: theme.grayLight, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Progress Trend</h4>
                      <ResponsiveContainer width="100%" height="80%">
                        <AreaChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }} data={(() => {
                          const weeks = weightHistory.reduce((acc, curr) => {
                            const d = new Date(curr.timestamp);
                            const startOfWeek = new Date(d);
                            startOfWeek.setDate(d.getDate() - d.getDay());
                            const key = startOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(curr.weight);
                            return acc;
                          }, {});
                          return Object.entries(weeks).map(([week, weights]) => ({ week, weight: Number((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2)) })).reverse();
                        })()}>
                          <defs><linearGradient id="cW" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.success} stopOpacity={0.3}/><stop offset="95%" stopColor={theme.success} stopOpacity={0}/></linearGradient></defs>
                          <XAxis dataKey="week" stroke={theme.gray} fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis width={45} stroke={theme.gray} fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} tickFormatter={(v) => Math.round(v)} />
                          <Tooltip contentStyle={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '10px', fontSize: '0.8rem' }} />
                          <Area type="monotone" dataKey="weight" stroke={theme.success} strokeWidth={3} fill="url(#cW)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <h3 style={{ fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '12px' }}>Weekly Averages</h3>
                  {Object.entries(weightHistory.reduce((acc, curr) => {
                    const d = new Date(curr.timestamp);
                    const s = new Date(d); s.setDate(d.getDate() - d.getDay());
                    const k = s.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                    if (!acc[k]) acc[k] = []; acc[k].push(curr.weight); return acc;
                  }, {})).map(([week, weights]) => (
                    <div key={week} style={{ ...cardStyle, padding: '18px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: theme.gray, fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Week of {week}</div>
                        <div style={{ fontWeight: '800', fontSize: '1.3rem', letterSpacing: '-0.02em', marginTop: '2px' }}>{(weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2)} <span style={{ fontSize: '0.85rem', color: theme.grayLight, fontWeight: '600' }}>lbs</span></div>
                      </div>
                      <div style={{ color: theme.success, fontSize: '0.82rem', fontWeight: '700', backgroundColor: 'rgba(48,209,88,0.1)', padding: '6px 12px', borderRadius: '20px' }}>{weights.length} entries</div>
                    </div>
                  ))}

                  <h3 style={{ marginTop: '36px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '4px' }}>Log History</h3>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '30px' }}>
                    {weightHistory.map((w, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${theme.border}` }}>
                        <span style={{ fontSize: '0.9rem', color: theme.grayLight }}>{w.date} — <strong style={{ fontWeight: '800', color: '#fff' }}>{w.weight} lbs</strong></span>
                        <motion.button whileTap={buttonTap} onClick={() => { if(window.confirm("Delete entry?")) setWeightHistory(weightHistory.filter((_, i) => i !== idx)) }} style={{ background: 'none', border: 'none', color: theme.danger, fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}>Delete</motion.button>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '44px', paddingTop: '28px', borderTop: `1px solid ${theme.border}`, textAlign: 'center' }}>
                    <h4 style={{ color: theme.gray, marginBottom: '16px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>Data Management</h4>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => { const b = { routines, history, weightHistory }; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(b)], {type:'application/json'})); a.download=`fitness_backup.json`; a.click(); }} style={{ backgroundColor: theme.input, color: theme.grayLight, border: `1px solid ${theme.border}`, padding: '13px 16px', borderRadius: theme.radiusSm, fontSize: '0.85rem', fontWeight: '700', flex: 1, cursor: 'pointer' }}>Export Backup</button>
                      <label style={{ backgroundColor: theme.input, color: theme.grayLight, border: `1px solid ${theme.border}`, padding: '13px 16px', borderRadius: theme.radiusSm, fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'inline-block', flex: 1, textAlign: 'center' }}>
                        Import Backup
                        <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* --- BOTTOM NAVIGATION BAR --- */}
      {!isWorkingOut && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '10px 20px 30px', backgroundColor: 'rgba(9,9,15,0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 90, borderTop: `1px solid ${theme.border}` }}>
          {[
            { id: 'workouts', label: 'Train', icon: '💪' },
            { id: 'profile',  label: 'Stats', icon: '📈' },
            { id: 'body',     label: 'Body',  icon: '⚖️' },
          ].map(tab => (
            <motion.div
              key={tab.id}
              whileTap={{ scale: 0.88 }}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flex: 1, gap: '3px', paddingTop: '4px' }}
            >
              <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{tab.icon}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', color: activeTab === tab.id ? theme.accent : theme.gray }}>{tab.label}</span>
              {activeTab === tab.id && <div style={{ width: '18px', height: '3px', borderRadius: '2px', background: gradBlue, marginTop: '1px' }} />}
            </motion.div>
          ))}
        </nav>
      )}
    </div>
  );
}

export default App;
