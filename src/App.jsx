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

const theme = { bg: '#000', card: '#1c1c1e', accent: '#0a84ff', success: '#30d158', danger: '#ff453a', gray: '#8e8e93', input: '#2c2c2e', radius: '16px' };

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

  const inputStyle = { backgroundColor: theme.input, border: 'none', borderRadius: '12px', color: '#fff', padding: '14px', fontSize: '16px', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const buttonTap = { scale: 0.96, transition: { type: "spring", stiffness: 400, damping: 17 } };

  return (
    <div style={{ backgroundColor: theme.bg, color: '#fff', minHeight: '100vh', fontFamily: '-apple-system, sans-serif', paddingBottom: '90px' }}>
      
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* --- ACTIVE WORKOUT OVERLAY --- */}
      <AnimatePresence>
        {isWorkingOut && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} style={{ position: 'fixed', inset: 0, backgroundColor: theme.bg, zIndex: 100, overflowY: 'auto', padding: '20px' }}>
            <div style={{ position: 'sticky', top: '-20px', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)', padding: '20px 0', zIndex: 101, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.card}`, marginBottom: '20px' }}>
              <button onClick={() => { if(window.confirm("Discard progress?")) { setIsWorkingOut(false); setActiveWorkout({title:'', exercises:[]}); } }} style={{ background: 'none', border: 'none', color: theme.gray, fontSize: '1.5rem' }}>✕</button>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{activeWorkout.title}</h2>
              <motion.button whileTap={buttonTap} onClick={finishWorkout} style={{ backgroundColor: theme.accent, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '24px', fontWeight: '800' }}>Finish</motion.button>
            </div>

            {activeWorkout.exercises.map((ex, exIdx) => {
              const lastMax = getProgression(ex.name, activeWorkout.title);
              return (
                <div key={exIdx} style={{ backgroundColor: theme.card, borderRadius: theme.radius, padding: '20px', marginBottom: '20px', border: '1px solid #2c2c2e' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ color: theme.accent, margin: 0, fontSize: '1rem', fontWeight: '800' }}>{ex.name}</h3>
                      {lastMax && <span style={{ fontSize: '0.7rem', color: theme.gray }}>Last Max: {lastMax.weight} lbs x {lastMax.reps}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <button onClick={() => moveActiveExercise(exIdx, -1)} style={{ background: 'none', border: 'none', color: theme.gray, fontSize: '0.9rem' }}>▲</button>
                      <button onClick={() => moveActiveExercise(exIdx, 1)} style={{ background: 'none', border: 'none', color: theme.gray, fontSize: '0.9rem' }}>▼</button>
                      <button onClick={() => setEditingExerciseIndex(exIdx)} style={{ background: 'none', border: 'none', color: theme.gray, fontSize: '0.85rem', fontWeight: '600' }}>Swap</button>
                      <button onClick={() => { const n = {...activeWorkout}; n.exercises.splice(exIdx,1); setActiveWorkout(n); }} style={{ background: 'none', border: 'none', color: theme.danger, fontSize: '0.85rem', fontWeight: '600' }}>Remove</button>
                    </div>
                  </div>
                  {ex.sets.map((set, sIdx) => {
                    const isUp = lastMax && Number(set.weight) > lastMax.weight;
                    const isDown = lastMax && Number(set.weight) < lastMax.weight;
                    const plateMath = getPlates(set.weight, ex.name);
                    return (
                      <div key={sIdx} style={{ marginBottom: '12px', opacity: set.completed ? 0.4 : 1 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 40px 30px', gap: '8px' }}>
                          <div style={{ alignSelf: 'center', fontSize: '0.8rem', color: theme.gray, fontWeight: '700' }}>{sIdx+1}</div>
                          <div style={{ position: 'relative' }}>
                            <input type="number" placeholder="LBS" value={set.weight} onChange={(e) => { const n = {...activeWorkout}; n.exercises[exIdx].sets[sIdx].weight = e.target.value; setActiveWorkout(n); }} style={{ ...inputStyle, paddingRight: '28px' }} />
                            {set.weight && lastMax && <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: isUp ? theme.success : isDown ? theme.danger : theme.gray }}>{isUp ? '▲' : isDown ? '▼' : '●'}</span>}
                          </div>
                          <input type="number" placeholder="REPS" value={set.reps} onChange={(e) => { const n = {...activeWorkout}; n.exercises[exIdx].sets[sIdx].reps = e.target.value; setActiveWorkout(n); }} style={inputStyle} />
                          <motion.button whileTap={{ scale: 1.2 }} onClick={() => { const n = {...activeWorkout}; n.exercises[exIdx].sets[sIdx].completed = !n.exercises[exIdx].sets[sIdx].completed; setActiveWorkout(n); }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: set.completed ? theme.success : theme.input }}>{set.completed ? '●' : '○'}</motion.button>
                          <button onClick={() => { const n = {...activeWorkout}; n.exercises[exIdx].sets.splice(sIdx,1); setActiveWorkout(n); }} style={{ color: theme.danger, background: 'none', border: 'none', fontSize: '1.2rem' }}>✕</button>
                        </div>
                        {plateMath && !set.completed && <div style={{ fontSize: '0.7rem', color: theme.accent, marginLeft: '38px', marginTop: '6px', fontWeight: '600' }}>{plateMath}</div>}
                      </div>
                    );
                  })}
                  <motion.button whileTap={buttonTap} onClick={() => { const n = {...activeWorkout}; n.exercises[exIdx].sets.push({weight:'', reps:'', completed:false}); setActiveWorkout(n); }} style={{ width: '100%', padding: '12px', backgroundColor: theme.input, color: theme.gray, borderRadius: '10px', border: 'none', fontSize: '0.85rem', fontWeight: '700', marginTop: '5px' }}>+ Add Set</motion.button>
                </div>
              );
            })}
            
            {editingExerciseIndex !== null && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: theme.bg, zIndex: 120, padding: '20px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3>Swap Exercise</h3><button onClick={() => setEditingExerciseIndex(null)} style={{ color: '#fff', background: 'none', border: 'none', fontSize: '1.5rem' }}>✕</button></div>
                <input placeholder="Search..." value={routineSearch} onChange={(e) => setRoutineSearch(e.target.value)} style={inputStyle} />
                {Object.entries(EXERCISE_LIST).map(([m, exs]) => (
                  <details key={m} open={routineSearch.length > 0} style={{ backgroundColor: theme.card, borderRadius: '10px', marginTop: '10px' }}>
                    <summary style={{ padding: '15px', fontWeight: '700' }}>{m}</summary>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '15px' }}>
                      {exs.filter(e => e.toLowerCase().includes(routineSearch.toLowerCase())).map(e => <button key={e} onClick={() => { const n = {...activeWorkout}; n.exercises[editingExerciseIndex].name = e; setActiveWorkout(n); setEditingExerciseIndex(null); }} style={{ padding: '8px 15px', borderRadius: '20px', background: theme.input, color: '#fff', border: '1px solid #444', fontSize: '0.9rem' }}>{e}</button>)}
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
                  <motion.button whileTap={buttonTap} onClick={() => setIsCreating(true)} style={{ width: '100%', padding: '18px', backgroundColor: theme.accent, color: '#fff', borderRadius: theme.radius, border: 'none', fontWeight: '800', fontSize: '1rem', marginBottom: '10px' }}>+ New Routine</motion.button>
                  {routines.map(r => (
                    <motion.div whileTap={buttonTap} key={r.id} onClick={() => startRoutine(r)} style={{ position: 'relative', marginTop: '12px', backgroundColor: theme.card, padding: '24px', borderRadius: theme.radius, border: '1px solid #2c2c2e' }}>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>{r.title}</h4>
                      <p style={{ color: theme.gray, fontSize: '0.85rem', marginTop: '8px', lineHeight: '1.4' }}>{r.exercises.join(' • ')}</p>
                      <button onClick={(e) => { e.stopPropagation(); if(window.confirm("Delete?")) setRoutines(routines.filter(x => x.id !== r.id)); }} style={{ position: 'absolute', top: '24px', right: '20px', color: '#666', background: 'none', border: 'none', fontSize: '1.2rem' }}>✕</button>
                    </motion.div>
                  ))}
                  
                  {isCreating && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: theme.bg, zIndex: 110, padding: '20px', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}><h3>Create Routine</h3><button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem' }}>✕</button></div>
                      <input placeholder="Routine Title" value={newRoutineTitle} onChange={(e) => setNewRoutineTitle(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />
                      <div style={{ marginBottom: '20px' }}>
                        {newRoutineExercises.map((ex, i) => (
                          <div key={ex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.card, padding: '12px 15px', borderRadius: '10px', marginBottom: '8px', border: `1px solid ${theme.accent}` }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{ex}</span>
                            <div style={{ display: 'flex', gap: '15px' }}>
                              <button onClick={() => moveExercise(i, -1)} style={{background:'none', border:'none', color:theme.gray}}>▲</button>
                              <button onClick={() => moveExercise(i, 1)} style={{background:'none', border:'none', color:theme.gray}}>▼</button>
                              <button onClick={() => setNewRoutineExercises(newRoutineExercises.filter(item => item !== ex))} style={{background:'none', border:'none', color:theme.danger}}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <input placeholder="Search exercises..." value={routineSearch} onChange={(e) => setRoutineSearch(e.target.value)} style={inputStyle} />
                      {Object.entries(EXERCISE_LIST).map(([m, exs]) => (
                        <details key={m} style={{ backgroundColor: theme.card, borderRadius: '12px', marginTop: '10px' }}>
                          <summary style={{ padding: '16px', fontWeight: '700' }}>{m}</summary>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '16px' }}>
                            {exs.filter(e => e.toLowerCase().includes(routineSearch.toLowerCase())).map(e => <button key={e} onClick={() => !newRoutineExercises.includes(e) && setNewRoutineExercises([...newRoutineExercises, e])} style={{ padding: '10px 14px', borderRadius: '20px', background: theme.input, color: '#fff', border: '1px solid #444' }}>{e}</button>)}
                          </div>
                        </details>
                      ))}
                      <button onClick={() => { if(!newRoutineTitle || !newRoutineExercises.length) return; setRoutines([...routines, {id: Date.now(), title: newRoutineTitle, exercises: newRoutineExercises}]); setIsCreating(false); setNewRoutineTitle(''); setNewRoutineExercises([]); }} style={{ width: '100%', padding: '18px', backgroundColor: theme.success, color: '#fff', borderRadius: theme.radius, border: 'none', fontWeight: '800', marginTop: '30px' }}>Save Routine</button>
                    </div>
                  )}
                </div>
              )}

              {/* --- PROFILE TAB --- */}
              {activeTab === 'profile' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Performance</h2>
                    <button onClick={() => {
                      let csv = "Date,Routine,Exercise,Weight,Reps\n";
                      history.forEach(h => h.exercises.forEach(ex => ex.sets.forEach(s => csv += `${h.date},${h.title},${ex.name},${s.weight},${s.reps}\n`)));
                      const blob = new Blob([csv], { type: 'text/csv' });
                      window.open(URL.createObjectURL(blob));
                    }} style={{ backgroundColor: '#217346', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700' }}>Export CSV</button>
                  </div>
                  {(() => {
                    const filteredHistory = [...history].reverse().filter(h => chartFilter === 'All' || h.title === chartFilter);
                    const availableExercises = [...new Set(filteredHistory.flatMap(h => h.exercises.map(ex => ex.name)))];
                    const effectiveExercise = availableExercises.includes(chartExercise) ? chartExercise : availableExercises[0] || '';
                    const chartData = filteredHistory.map(h => {
                      if (chartMetric === 'Volume') {
                        return { date: h.date, value: h.exercises.reduce((s, ex) => s + ex.sets.reduce((ss, set) => ss + (Number(set.weight) * Number(set.reps)), 0), 0) };
                      } else {
                        const ex = h.exercises.find(e => e.name === effectiveExercise);
                        if (!ex) return null;
                        return { date: h.date, value: Math.max(...ex.sets.map(s => Number(s.weight) * (36 / (37 - Math.min(Number(s.reps), 10))))) };
                      }
                    }).filter(Boolean);
                    return (
                      <div style={{ backgroundColor: theme.card, padding: '24px', borderRadius: theme.radius, height: chartMetric === '1RM' ? '360px' : '320px', marginBottom: '20px', border: '1px solid #2c2c2e' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <select value={chartMetric} onChange={(e) => setChartMetric(e.target.value)} style={{ backgroundColor: theme.input, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                            <option value="Volume">Volume Trend</option>
                            <option value="1RM">Est. 1RM Trend</option>
                          </select>
                          <select value={chartFilter} onChange={(e) => setChartFilter(e.target.value)} style={{ backgroundColor: theme.input, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                            <option value="All">All Routines</option>
                            {[...new Set(history.map(h => h.title))].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        {chartMetric === '1RM' && (
                          <select value={effectiveExercise} onChange={(e) => setChartExercise(e.target.value)} style={{ backgroundColor: theme.input, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '0.8rem', fontWeight: '700', width: '100%', marginBottom: '8px' }}>
                            {availableExercises.map(e => <option key={e} value={e}>{e}</option>)}
                          </select>
                        )}
                        <ResponsiveContainer width="100%" height="75%">
                          <LineChart data={chartData}>
                            <XAxis dataKey="date" hide />
                            <YAxis hide />
                            <Tooltip contentStyle={{backgroundColor: theme.card, border: '1px solid #444', borderRadius: '8px'}} formatter={(v) => [`${Math.round(v)} ${chartMetric === '1RM' ? 'lbs' : ''}`, chartMetric === '1RM' ? 'Est. 1RM' : 'Volume']} />
                            <Line type="monotone" dataKey="value" stroke={theme.accent} strokeWidth={4} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
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
                      days.push(<div key={d} onClick={() => setSelectedDate(has ? ds : null)} style={{ height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: has ? theme.accent : 'transparent', color: has ? '#fff' : theme.gray, fontSize: '0.9rem', cursor: has ? 'pointer' : 'default' }}>{d}</div>);
                    }
                    return (
                      <div style={{ backgroundColor: theme.card, padding: '24px', borderRadius: theme.radius, marginBottom: '24px', border: '1px solid #2c2c2e' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <button onClick={() => setCalendarOffset(o => o - 1)} style={{ background: 'none', border: 'none', color: theme.accent, fontSize: '1.2rem', fontWeight: '800', cursor: 'pointer' }}>‹</button>
                          <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{label}</span>
                          <button onClick={() => setCalendarOffset(o => o + 1)} disabled={calendarOffset >= 0} style={{ background: 'none', border: 'none', color: calendarOffset >= 0 ? theme.gray : theme.accent, fontSize: '1.2rem', fontWeight: '800', cursor: calendarOffset >= 0 ? 'default' : 'pointer' }}>›</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center' }}>
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={{ color: theme.accent, fontWeight: '800', fontSize: '0.75rem' }}>{d}</div>)}
                          {days}
                        </div>
                      </div>
                    );
                  })()}
                  {selectedDate && (
                    <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: theme.card, borderRadius: theme.radius, border: `1px solid ${theme.accent}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{selectedDate}</strong><button onClick={() => setSelectedDate(null)} style={{background:'none', border:'none', color:theme.gray}}>✕</button></div>
                      {history.filter(h => h.date === selectedDate).map((h, i) => (
                        <div key={i} style={{ marginTop: '10px' }}>
                          <div style={{ color: theme.accent, fontWeight: '800' }}>{h.title}</div>
                          {h.exercises.map((ex, exIdx) => <div key={exIdx} style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '4px' }}>• {ex.name}: {ex.sets.map(s => `${s.weight}x${s.reps}`).join(', ')}</div>)}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontWeight: '800' }}>Recent Activity</h3>
                    <button onClick={() => setShowAllActivity(v => !v)} style={{ color: theme.accent, fontSize: '0.9rem', background:'none', border:'none', fontWeight: '700' }}>{showAllActivity ? 'Show Less' : 'View All'}</button>
                  </div>
                  {(showAllActivity ? history : history.slice(0, 5)).map((h, i) => (
                    <div key={i} style={{ backgroundColor: theme.card, borderRadius: theme.radius, marginBottom: '12px', padding: '20px', borderLeft: `6px solid ${theme.accent}`, borderTop: '1px solid #2c2c2e', borderRight: '1px solid #2c2c2e', borderBottom: '1px solid #2c2c2e' }}>
                      <div onClick={() => setExpandedIndex(expandedIndex === i ? null : i)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                        <div><strong style={{fontSize: '1.1rem'}}>{h.title}</strong><div style={{ color: theme.gray, fontSize: '0.8rem', marginTop: '4px' }}>{h.date}</div></div>
                        <div style={{color: theme.gray}}>{expandedIndex === i ? '▲' : '▼'}</div>
                      </div>
                      {expandedIndex === i && (
                        <div style={{ marginTop: '15px', borderTop: '1px solid #2c2c2e', paddingTop: '15px' }}>
                          {h.exercises.map((ex, exIdx) => (
                            <div key={exIdx} style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '0.9rem', color: theme.accent, fontWeight: '800', marginBottom: '6px' }}>{ex.name}</div>
                              {ex.sets.map((s, sIdx) => <span key={sIdx} style={{ backgroundColor: theme.input, padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', marginRight: '6px', fontWeight: '600' }}>{s.weight}lb x {s.reps}</span>)}
                            </div>
                          ))}
                          <button onClick={() => { if(window.confirm("Delete log?")) setHistory(history.filter((_, idx) => idx !== i)) }} style={{ color: theme.danger, background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', marginTop: '10px' }}>Delete Log</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* --- BODY TAB --- */}
              {activeTab === 'body' && (
                <div>
                  <div style={{ backgroundColor: theme.card, padding: '24px', borderRadius: theme.radius, border: '1px solid #2c2c2e', marginBottom: '20px' }}>
                    <h3 style={{marginTop: 0, marginBottom: '15px'}}>Log Weight</h3>
                    <input type="number" placeholder="lbs" value={todayWeight} onChange={(e) => setTodayWeight(e.target.value)} style={inputStyle} />
                    <motion.button whileTap={buttonTap} onClick={() => { if(!todayWeight) return; setWeightHistory([{date: new Date().toLocaleDateString(), weight: Number(todayWeight), timestamp: new Date().toISOString()}, ...weightHistory]); setTodayWeight(''); }} style={{ width: '100%', backgroundColor: theme.success, color: '#fff', padding: '15px', borderRadius: '12px', border: 'none', marginTop: '15px', fontWeight: '800', fontSize: '1rem' }}>Log Weight</motion.button>
                  </div>
                  {weightHistory.length > 1 && (
                    <div style={{ backgroundColor: theme.card, padding: '24px', borderRadius: theme.radius, marginBottom: '24px', height: '220px', border: '1px solid #2c2c2e' }}>
                      <h4 style={{ margin: 0, color: theme.gray, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '15px' }}>Progress Trend</h4>
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
                          return Object.entries(weeks).map(([week, weights]) => ({ week: week.split(' ')[0], weight: Number((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2)) })).reverse();
                        })()}>
                          <defs><linearGradient id="cW" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.success} stopOpacity={0.3}/><stop offset="95%" stopColor={theme.success} stopOpacity={0}/></linearGradient></defs>
                          <XAxis dataKey="week" stroke={theme.gray} fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis width={45} stroke={theme.gray} fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} tickFormatter={(v) => Math.round(v)} />
                          <Tooltip contentStyle={{ backgroundColor: theme.card, border: '1px solid #444', borderRadius: '8px' }} />
                          <Area type="monotone" dataKey="weight" stroke={theme.success} strokeWidth={3} fill="url(#cW)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <h3 style={{ fontWeight: '800' }}>Weekly Averages</h3>
                  {Object.entries(weightHistory.reduce((acc, curr) => {
                    const d = new Date(curr.timestamp);
                    const s = new Date(d); s.setDate(d.getDate() - d.getDay());
                    const k = s.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                    if (!acc[k]) acc[k] = []; acc[k].push(curr.weight); return acc;
                  }, {})).map(([week, weights]) => (
                    <div key={week} style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', border: '1px solid #2c2c2e' }}>
                      <div><span style={{ color: theme.gray, fontSize: '0.75rem', fontWeight: '600' }}>Week of {week}</span><div style={{ fontWeight: '800', fontSize: '1.3rem' }}>{(weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2)} lbs</div></div>
                      <div style={{ color: theme.success, alignSelf: 'center', fontSize: '0.85rem', fontWeight: '700' }}>{weights.length} entries</div>
                    </div>
                  ))}
                  
                  <h3 style={{ marginTop: '40px', fontWeight: '800' }}>Log History</h3>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '30px' }}>
                    {weightHistory.map((w, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #1c1c1e' }}>
                        <span style={{ fontSize: '0.95rem' }}>{w.date} — <strong style={{ fontWeight: '800' }}>{w.weight} lbs</strong></span>
                        <motion.button whileTap={buttonTap} onClick={() => { if(window.confirm("Delete entry?")) setWeightHistory(weightHistory.filter((_, i) => i !== idx)) }} style={{ background: 'none', border: 'none', color: theme.danger, fontSize: '0.85rem', fontWeight: '700' }}>Delete</motion.button>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '1px solid #1c1c1e', textAlign: 'center' }}>
                    <h4 style={{ color: theme.gray, marginBottom: '20px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Data Management</h4>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button onClick={() => { const b = { routines, history, weightHistory }; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(b)], {type:'application/json'})); a.download=`fitness_backup.json`; a.click(); }} style={{ backgroundColor: theme.input, color: '#fff', border: 'none', padding: '14px 20px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', flex: 1 }}>Export Backup</button>
                      <label style={{ backgroundColor: theme.input, color: '#fff', padding: '14px 20px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'inline-block', flex: 1 }}>
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
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '15px 20px 25px', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 90, borderTop: '1px solid #1c1c1e' }}>
          {['workouts', 'profile', 'body'].map(tab => (
            <motion.div 
              key={tab} 
              whileTap={{ scale: 0.9 }} 
              onClick={() => setActiveTab(tab)} 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: activeTab === tab ? 1 : 0.4, cursor: 'pointer', flex: 1 }}
            >
              <span style={{ fontSize: '1.2rem', fontWeight: '800', textTransform: 'capitalize', color: activeTab === tab ? theme.accent : '#fff' }}>{tab}</span>
            </motion.div>
          ))}
        </nav>
      )}
    </div>
  );
}

export default App;