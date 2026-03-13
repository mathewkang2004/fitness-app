import { useState, useEffect } from 'react'
import { db } from './firebase' // Import the database connection
import { collection, addDoc, query, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function App() {
  const [weight, setWeight] = useState(0)
  const [reps, setReps] = useState(0)
  const [sets, setSets] = useState(0)
  const [history, setHistory] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [userName, setUserName] = useState("")

  const volume = weight * reps * sets

  // --- NEW: Load Leaderboard Data from Cloud ---
  useEffect(() => {
    const q = query(collection(db, "leaderboard"), orderBy("totalVolume", "desc"), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboard(entries);
    });
    return () => unsubscribe();
  }, []);

  // --- UPDATED: Save to Cloud instead of just locally ---
  const saveWorkout = async () => {
    if (volume === 0) return alert("Enter some weights first!");

    const newEntry = {
      name: userName || "Anonymous", // Later you can add a 'Name' input for your friends
      date: new Date().toLocaleDateString(),
      totalVolume: volume,
      timestamp: new Date()
    };

    try {
      await addDoc(collection(db, "leaderboard"), newEntry);
      setHistory([...history, newEntry]); // Keep updating your local chart too
      alert("Sent to Leaderboard! 🚀");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#121212', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1>💪 Volume Tracker</h1>
      
      {/* Inputs (Same as before) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto' }}>
        <input type="number" placeholder="Weight (lbs)" style={{padding: '12px', borderRadius: '8px', border: 'none'}} onChange={(e) => setWeight(Number(e.target.value))} />
        <input type="number" placeholder="Reps" style={{padding: '12px', borderRadius: '8px', border: 'none'}} onChange={(e) => setReps(Number(e.target.value))} />
        <input type="number" placeholder="Sets" style={{padding: '12px', borderRadius: '8px', border: 'none'}} onChange={(e) => setSets(Number(e.target.value))} />
        <input type="text" placeholder="Your Name" style={{padding: '12px', borderRadius: '8px', border: 'none'}} onChange={(e) => setUserName(e.target.value)} />
        
        <button onClick={saveWorkout} style={{ padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
          Save & Sync
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Session: <span style={{ color: '#007bff' }}>{volume.toLocaleString()} lbs</span></h2>
      </div>

      {/* --- NEW: Leaderboard UI --- */}
      <div style={{ marginTop: '40px', backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '12px', maxWidth: '400px', margin: '40px auto' }}>
        <h3>🏆 Friend Leaderboard</h3>
        {leaderboard.map((user, index) => (
          <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #333' }}>
            <span>{index + 1}. {user.name}</span>
            <span style={{ fontWeight: 'bold', color: '#007bff' }}>{user.totalVolume.toLocaleString()} lbs</span>
          </div>
        ))}
      </div>

      {/* Chart (Same as before) */}
      <div style={{ width: '100%', height: 250, marginTop: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{backgroundColor: '#222', border: 'none'}} />
            <Line type="monotone" dataKey="totalVolume" stroke="#007bff" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default App
