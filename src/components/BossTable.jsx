import { useEffect, useState } from "react";

function parseRespawnTime(respawnStr) {
  const regex = /(\d+)([hm])/g;
  let totalSeconds = 0,
    match;
  while ((match = regex.exec(respawnStr)) !== null) {
    const value = parseInt(match[1], 10),
      unit = match[2];
    totalSeconds += unit === "h" ? value * 3600 : value * 60;
  }
  return totalSeconds;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

const defaultBosses = [
  { name: "Venatus", respawn: parseRespawnTime("10h") },
  { name: "Viorent", respawn: parseRespawnTime("10h") },
  { name: "Ego", respawn: parseRespawnTime("21h") },
  { name: "Livera", respawn: parseRespawnTime("24h") },
  { name: "Araneo", respawn: parseRespawnTime("24h") },
  { name: "Undomiel", respawn: parseRespawnTime("24h") },
  { name: "Lady Dalia", respawn: parseRespawnTime("18h") },
  { name: "General Aquleus", respawn: parseRespawnTime("29h") },
  { name: "Amentis", respawn: parseRespawnTime("29h") },
  { name: "Baron Braudmore", respawn: parseRespawnTime("32h") },
  { name: "Wannitas", respawn: parseRespawnTime("48h") },
  { name: "Metus", respawn: parseRespawnTime("48h") },
  { name: "Duplican", respawn: parseRespawnTime("48h") },
  { name: "Shuliar", respawn: parseRespawnTime("35h") },
];

export default function BossSpawnTimer() {
  const [bosses, setBosses] = useState(() => {
    const saved = localStorage.getItem("bossState");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultBosses.map((b) => ({ ...b, killedAt: null }));
      }
    }
    return defaultBosses.map((b) => ({ ...b, killedAt: null }));
  });

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newBoss, setNewBoss] = useState({ name: "", respawn: "" });
  const [editTime, setEditTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setBosses((b) => [...b]), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("bossState", JSON.stringify(bosses));
  }, [bosses]);

  const handleKill = (index) => {
    const updated = [...bosses];
    updated[index].killedAt = Date.now();
    setBosses(updated);
  };

  const handleReset = (index) => {
    const updated = [...bosses];
    updated[index].killedAt = null;
    setBosses(updated);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const [h, m] = editTime.split(":").map(Number);
    const now = new Date();
    let dt = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      h,
      m,
      0
    );
    if (dt > now) dt.setDate(dt.getDate() - 1);
    const updated = [...bosses];
    updated[editingIndex].killedAt = dt.getTime();
    setBosses(updated);
    setShowEditModal(false);
  };

  const handleAddBoss = () => {
    const sec = parseRespawnTime(newBoss.respawn);
    if (!newBoss.name || sec <= 0) {
      alert("Please enter valid boss name and respawn time (e.g. 2h 30m)");
      return;
    }
    setBosses([
      ...bosses,
      { name: newBoss.name, respawn: sec, killedAt: null },
    ]);
    setNewBoss({ name: "", respawn: "" });
    setShowAddModal(false);
  };

  const handleDelete = () => {
    if (selectedIndex !== null) {
      const updated = [...bosses];
      updated.splice(selectedIndex, 1);
      setBosses(updated);
      setSelectedIndex(null);
    }
  };

  return (
    <div>
      <h1>Cheesecake Boss Spawn Timer</h1>
      <table>
        <thead>
          <tr>
            <th>Boss Name</th>
            <th>Time Killed</th>
            <th>Respawn Countdown</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bosses.map((boss, idx) => {
            const elapsed = boss.killedAt
              ? Math.floor((Date.now() - boss.killedAt) / 1000)
              : null;
            const remaining = boss.killedAt ? boss.respawn - elapsed : null;
            const isReady = remaining !== null && remaining <= 0;
            return (
              <tr
                key={idx}
                className={selectedIndex === idx ? "selected" : ""}
                onClick={(e) => {
                  if (e.target.tagName !== "BUTTON") setSelectedIndex(idx);
                }}
              >
                <td>{boss.name}</td>
                <td>
                  {boss.killedAt
                    ? new Date(boss.killedAt).toLocaleTimeString()
                    : "-"}
                </td>
                <td className="countdown">
                  {boss.killedAt && !isReady ? formatTime(remaining) : ""}
                </td>
                <td className={`status ${isReady ? "ready" : "dead"}`}>
                  {boss.killedAt ? (isReady ? "READY" : "DEAD") : ""}
                </td>
                <td>
                  <button
                    onClick={() => handleKill(idx)}
                    disabled={boss.killedAt && !isReady}
                    className="killBtn"
                  >
                    Killed
                  </button>
                  <button onClick={() => handleReset(idx)} className="resetBtn">
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      setEditingIndex(idx);
                      setEditTime(
                        boss.killedAt
                          ? new Date(boss.killedAt).toTimeString().slice(0, 5)
                          : ""
                      );
                      setShowEditModal(true);
                    }}
                    className="editBtn"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="button-container">
        <button onClick={() => setShowAddModal(true)} id="addBossBtn">
          Add Boss
        </button>
        <button
          onClick={handleDelete}
          disabled={selectedIndex === null}
          id="deleteSelectedBtn"
        >
          Delete
        </button>
      </div>

      {showAddModal && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-content">
            <span className="close" onClick={() => setShowAddModal(false)}>
              &times;
            </span>
            <label>Boss Name:</label>
            <input
              type="text"
              value={newBoss.name}
              onChange={(e) => setNewBoss({ ...newBoss, name: e.target.value })}
              placeholder="Enter boss name"
            />
            <label>Respawn Time:</label>
            <input
              type="text"
              value={newBoss.respawn}
              onChange={(e) =>
                setNewBoss({ ...newBoss, respawn: e.target.value })
              }
              placeholder="e.g. 2h 30m"
            />
            <button onClick={handleAddBoss}>Add Boss</button>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-content">
            <span className="close" onClick={() => setShowEditModal(false)}>
              &times;
            </span>
            <label>Time Killed:</label>
            <input
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
            />
            <button onClick={handleSaveEdit}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
