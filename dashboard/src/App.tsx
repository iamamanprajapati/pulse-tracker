import { useState, useEffect } from 'react';

// TypeScript Declarations for API data structures
interface ActivityItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    photoUrl: string;
  };
  type: 'run' | 'gym' | 'swim' | 'walk' | 'cycle' | 'other';
  title: string;
  duration: number;
  steps: number;
  calories: number;
  distance: number;
  timestamp: string;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  photoUrl: string;
  level: number;
  xp: number;
  dailyStepGoal: number;
  lifetimeSteps: number;
  lifetimeKilometers: number;
  lifetimeCalories: number;
  role: string;
}

interface QuestItem {
  _id?: string;
  title: string;
  description: string;
  targetSteps: number;
  rewardName: string;
  rewardImage: string;
  rewardType: 'gear' | 'badge';
  limitedEdition: boolean;
}

interface AnalyticsData {
  totalUsers: number;
  totalSteps: number;
  totalKilometers: number;
  totalCalories: number;
  totalActivities: number;
  activeQuests: number;
  quests: QuestItem[];
  activitiesByType: {
    run: number;
    gym: number;
    swim: number;
    walk: number;
    cycle: number;
    other: number;
  };
  recentActivities: ActivityItem[];
}

const API_BASE_URL = 'http://127.0.0.1:5001/api';

const IMAGE_PRESETS = [
  {
    name: 'UltraPulse Pro Watch',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHlj9ed06EGvVTX-TAzNl3aVKoLD0xsfOyVDgeLkc8L58MufBoj-Z8lEyfCdMCDxmCc7JJoGOcMbckMyEAgpPSTvFgcO_IA9tz2VgFErod5NFF7XZ__T_2QHTYHAJMVd3S-vKQyu6f77oaJix4dRMzFMYBqjHEnTnQmSR9dgVSn-e-PkHRf9zAHnkPRhaJq3dxfmwk5DHnBIUMrzFP1hWR6pBMtLC2pFVde5ul4NHEuQxxcAFU2VHqzlKxWFDz-16t2dzlnlVSNrKE'
  },
  {
    name: 'Viper Streak Shoes',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZq5K_czAj2NSZzvDauORPhWGRb1I0XhoWwrhx9NLa_oPTM3h88WEqO9kh_4joxataKxq_pXssl4ILRpP9IJ2tvrMwtSGc_18v6NTmlUWAW0rsstBoEvqmvGXoy7Y0xttXHBPdlNR7ApQmBnI6a2boFK_ZyEAHJiTIFheRuOjRtWvn8bKcEB0G6Tpl_kOdQ1XtT_WUo2yx7yd01xFWWkkXpnMY6_s8k8FFMdguM3vgxnDGAovRBblGvrrOhBrkJhe80w-nB3LDY4GL'
  },
  {
    name: 'HydroFlow 1L Bottle',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKyl8d7e1foLsqxaytBdLRY4a0SihsecQSEsx513G8B52HdWFPhCNfUDG3bVilYNZKvIo8IMzAGPIarHXffohvJThaAq9CXqXErca4hCgazl-_nigM-LHj5KR4vVqw7qENfkl1VFlEjn4GSkhwTYIMffgGAf7o4ht9r63Jv3Iw352-HsYiMk8ZnHWMbKI-fAl5lM7bVEy21pGf_nMcO7BU4R2Fg0kc-wH93hXYQDzgUCSFS8Ya8kaMMepm3lby9IqoFGj8tKwcsJ1_'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'simulator'>('dashboard');
  
  // Data States
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campaign Form State
  const [campTitle, setCampTitle] = useState('Tour de Pulse Marathon');
  const [campDesc, setCampDesc] = useState('Complete 50,000 steps this week to claim your exclusive gear reward.');
  const [campTargetSteps, setCampTargetSteps] = useState('50000');
  const [campRewardName, setCampRewardName] = useState('UltraPulse Pro Watch');
  const [campRewardImage, setCampRewardImage] = useState(IMAGE_PRESETS[0].url);
  const [campRewardType, setCampRewardType] = useState<'gear' | 'badge'>('gear');
  const [campLimited, setCampLimited] = useState(true);
  const [editingQuestOldTitle, setEditingQuestOldTitle] = useState<string | null>(null);
  const [editingQuestOldRewardName, setEditingQuestOldRewardName] = useState<string | null>(null);

  // Simulator Modal/Form State
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [simType, setSimType] = useState<'run' | 'gym' | 'swim' | 'walk' | 'cycle'>('run');
  const [simTitle, setSimTitle] = useState('');
  const [simSteps, setSimSteps] = useState('8000');
  const [simCals, setSimCals] = useState('400');
  const [simDur, setSimDur] = useState('30');
  const [simDist, setSimDist] = useState('5.0');

  // Load Dashboard Data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/analytics`),
        fetch(`${API_BASE_URL}/admin/users`)
      ]);

      if (!analyticsRes.ok || !usersRes.ok) {
        throw new Error('Could not fetch administrative statistics. Please check if your server is running.');
      }

      const analyticsData = await analyticsRes.json();
      const usersData = await usersRes.json();

      setAnalytics(analyticsData);
      setUsers(usersData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connection lost to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Quick Preset Workout Selector
  const applyPreset = (preset: {
    title: string;
    steps: number;
    calories: number;
    duration: number;
    distance: number;
    type: 'run' | 'gym' | 'swim' | 'walk' | 'cycle';
  }) => {
    setSimTitle(preset.title);
    setSimSteps(preset.steps.toString());
    setSimCals(preset.calories.toString());
    setSimDur(preset.duration.toString());
    setSimDist(preset.distance.toString());
    setSimType(preset.type);
  };

  // Start editing campaign details
  const handleStartEdit = (quest: QuestItem) => {
    setEditingQuestOldTitle(quest.title);
    setEditingQuestOldRewardName(quest.rewardName);
    setCampTitle(quest.title);
    setCampDesc(quest.description);
    setCampTargetSteps(quest.targetSteps.toString());
    setCampRewardName(quest.rewardName);
    setCampRewardImage(quest.rewardImage);
    setCampRewardType(quest.rewardType);
    setCampLimited(quest.limitedEdition);
  };

  // Cancel edit mode and reset form to default
  const handleCancelEdit = () => {
    setEditingQuestOldTitle(null);
    setEditingQuestOldRewardName(null);
    setCampTitle('Tour de Pulse Marathon');
    setCampDesc('Complete 50,000 steps this week to claim your exclusive gear reward.');
    setCampRewardName('UltraPulse Pro Watch');
    setCampTargetSteps('50000');
    setCampRewardImage(IMAGE_PRESETS[0].url);
    setCampRewardType('gear');
    setCampLimited(true);
  };

  // Toggle quest Pause/Resume status
  const handleTogglePause = async (title: string, rewardName: string, currentPausedState: boolean) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/quests/pause`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          rewardName,
          isPaused: !currentPausedState
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change quest status.');

      alert(data.message);
      loadDashboardData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete quest campaign
  const handleDeleteCampaign = async (title: string, rewardName: string) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${title}" (${rewardName})? This will remove the quest for all users permanently.`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/quests`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, rewardName })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete campaign.');

      alert(data.message);
      loadDashboardData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Launch or Update Campaign (Quest) for all users
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campTitle.trim() || !campDesc.trim() || !campRewardName.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      setActionLoading(true);
      const isEditing = editingQuestOldTitle !== null;
      const url = `${API_BASE_URL}/admin/quests`;
      const method = isEditing ? 'PUT' : 'POST';

      const payload = isEditing 
        ? {
            oldTitle: editingQuestOldTitle,
            oldRewardName: editingQuestOldRewardName,
            title: campTitle.trim(),
            description: campDesc.trim(),
            targetSteps: campTargetSteps,
            rewardName: campRewardName.trim(),
            rewardImage: campRewardImage,
            rewardType: campRewardType,
            limitedEdition: campLimited
          }
        : {
            title: campTitle.trim(),
            description: campDesc.trim(),
            targetSteps: campTargetSteps,
            rewardName: campRewardName.trim(),
            rewardImage: campRewardImage,
            rewardType: campRewardType,
            limitedEdition: campLimited
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save campaign.');

      alert(data.message);
      handleCancelEdit();
      loadDashboardData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Simulator Activity Log
  const handleSimulateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      alert('Please select an athlete to simulate first.');
      return;
    }
    if (!simTitle.trim()) {
      alert('Workout title is required.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/users/add-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser._id,
          type: simType,
          title: simTitle.trim(),
          duration: simDur,
          calories: simCals,
          steps: simType === 'gym' || simType === 'swim' ? 0 : simSteps,
          distance: simDist
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Simulation failed.');

      alert(data.message);
      // Reset workout title
      setSimTitle('');
      // Reload stats
      loadDashboardData();
    } catch (err: any) {
      alert(`Simulation Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Render Charts based on activity breakdown
  const renderActivityChart = () => {
    if (!analytics) return null;
    const { activitiesByType } = analytics;
    const maxVal = Math.max(...Object.values(activitiesByType), 1);

    const types = [
      { key: 'run', label: 'Run', color: '#22c55e' },
      { key: 'gym', label: 'Gym', color: '#3b82f6' },
      { key: 'swim', label: 'Swim', color: '#ec4899' },
      { key: 'walk', label: 'Walk', color: '#eab308' },
      { key: 'cycle', label: 'Cycle', color: '#a855f7' }
    ] as const;

    return (
      <div className="chart-container">
        {types.map((type) => {
          const val = activitiesByType[type.key] || 0;
          const pct = Math.round((val / maxVal) * 100);
          return (
            <div key={type.key} className="chart-bar-wrapper">
              <span className="chart-val-hint">{val}</span>
              <div className="chart-bar-outer">
                <div 
                  className="chart-bar-inner" 
                  style={{ height: `${pct}%`, backgroundColor: type.color }} 
                />
              </div>
              <span className="chart-label">{type.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="material-icons" style={{ fontSize: '28px', color: '#22c55e' }}>bolt</span>
            <span>PulseTrack Hub</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="material-icons">analytics</span>
            <span>Analytics Dashboard</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            <span className="material-icons">campaign</span>
            <span>Campaign Manager</span>
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <span className="material-icons">sports_esports</span>
            <span>Athlete Simulator</span>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="dev-badge">DEVELOPER DEMO MODE</div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="main-content">
        <div className="header-row">
          <div>
            <h1 className="page-title">
              {activeTab === 'dashboard' && 'Platform Analytics'}
              {activeTab === 'campaigns' && 'Campaign & Quest Management'}
              {activeTab === 'simulator' && 'Athlete Activity Simulator'}
            </h1>
            <p className="page-subtitle">
              {activeTab === 'dashboard' && 'Real-time overview of athlete metrics, lifetime stats, and logged activities.'}
              {activeTab === 'campaigns' && 'Launch new fitness quests and rewards system-wide.'}
              {activeTab === 'simulator' && 'Test the React Native mobile UI by logging mock workouts for athlete users.'}
            </p>
          </div>

          <button 
            className="btn-primary" 
            style={{ width: 'auto', marginTop: 0, padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={loadDashboardData}
            disabled={loading}
          >
            <span className={`material-icons ${loading ? 'spinning' : ''}`}>refresh</span>
            <span>Refresh Data</span>
          </button>
        </div>

        {error && (
          <div className="glass-card" style={{ marginBottom: '24px', borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#b91c1c' }}>
              <span className="material-icons">error_outline</span>
              <span style={{ fontWeight: '600' }}>{error}</span>
            </div>
          </div>
        )}

        {loading && !analytics ? (
          <div className="loading-indicator">
            <span className="material-icons spinning">autorenew</span>
            <span>Loading admin hub statistics...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: ANALYTICS DASHBOARD */}
            {activeTab === 'dashboard' && analytics && (
              <>
                {/* Metrics Grid */}
                <div className="kpi-grid">
                  <div className="glass-card kpi-card">
                    <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                      <span className="material-icons">people</span>
                    </div>
                    <div className="kpi-details">
                      <span className="kpi-label">Total Users</span>
                      <span className="kpi-value">{analytics.totalUsers}</span>
                    </div>
                  </div>

                  <div className="glass-card kpi-card">
                    <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                      <span className="material-icons">directions_walk</span>
                    </div>
                    <div className="kpi-details">
                      <span className="kpi-label">Steps Walked</span>
                      <span className="kpi-value">{analytics.totalSteps.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="glass-card kpi-card">
                    <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                      <span className="material-icons">local_fire_department</span>
                    </div>
                    <div className="kpi-details">
                      <span className="kpi-label">Calories Burned</span>
                      <span className="kpi-value">{analytics.totalCalories.toLocaleString()} kcal</span>
                    </div>
                  </div>

                  <div className="glass-card kpi-card">
                    <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                      <span className="material-icons">military_tech</span>
                    </div>
                    <div className="kpi-details">
                      <span className="kpi-label">Active Quests</span>
                      <span className="kpi-value">{analytics.activeQuests}</span>
                    </div>
                  </div>
                </div>

                <div className="bento-row">
                  {/* Activity Log */}
                  <div className="glass-card">
                    <div className="section-header">
                      <h2 className="section-title">Live Activities Log</h2>
                      <span className="badge badge-success">{analytics.totalActivities} Workouts</span>
                    </div>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Athlete</th>
                            <th>Workout</th>
                            <th>Metrics</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.recentActivities.length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af' }}>No activities logged yet.</td>
                            </tr>
                          ) : (
                            analytics.recentActivities.map((act) => (
                              <tr key={act._id}>
                                <td>
                                  <div className="athlete-row">
                                    <img 
                                      src={act.user?.photoUrl || 'https://via.placeholder.com/150'} 
                                      className="athlete-avatar" 
                                      alt="" 
                                    />
                                    <div className="athlete-name-wrapper">
                                      <span className="athlete-name">{act.user?.name || 'Unknown Athlete'}</span>
                                      <span className="athlete-email">{act.user?.email || ''}</span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span 
                                      className="material-icons" 
                                      style={{ 
                                        fontSize: '18px', 
                                        color: act.type === 'run' ? '#22c55e' : act.type === 'gym' ? '#3b82f6' : '#ec4899' 
                                      }}
                                    >
                                      {act.type === 'run' ? 'directions_run' : act.type === 'gym' ? 'fitness_center' : act.type === 'swim' ? 'pool' : 'bolt'}
                                    </span>
                                    <span style={{ fontWeight: '500' }}>{act.title}</span>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontSize: '13px' }}>
                                    {act.steps > 0 && <div>{act.steps.toLocaleString()} steps</div>}
                                    <div style={{ color: '#6b7280' }}>
                                      {act.duration} mins • {act.calories} kcal
                                    </div>
                                  </div>
                                </td>
                                <td style={{ fontSize: '13px', color: '#6b7280' }}>
                                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Chart & Standings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card">
                      <h2 className="section-title" style={{ marginBottom: '16px' }}>Workout Distribution</h2>
                      {renderActivityChart()}
                    </div>

                    <div className="glass-card">
                      <h2 className="section-title" style={{ marginBottom: '16px' }}>Athlete Leaderboard</h2>
                      <div className="table-container">
                        <table className="data-table">
                          <tbody>
                            {users.slice(0, 4).map((user, idx) => (
                              <tr key={user._id}>
                                <td style={{ width: '40px', fontWeight: '700', color: '#22c55e' }}>#{idx + 1}</td>
                                <td>
                                  <div className="athlete-row">
                                    <img src={user.photoUrl} className="athlete-avatar" alt="" />
                                    <div className="athlete-name-wrapper">
                                      <span className="athlete-name">{user.name}</span>
                                      <span className="athlete-email">Level {user.level}</span>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                  {user.lifetimeSteps.toLocaleString()} steps
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: CAMPAIGN MANAGER */}
            {activeTab === 'campaigns' && (
              <div className="bento-row">
                {/* Form Creation */}
                <div className="glass-card">
                  <h2 className="form-title">{editingQuestOldTitle ? 'Edit Quest / Campaign' : 'Launch New Quest / Campaign'}</h2>
                  <form onSubmit={handleCreateCampaign}>
                    <div className="form-group">
                      <label className="form-label">Quest Title</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={campTitle}
                        onChange={(e) => setCampTitle(e.target.value)}
                        placeholder="e.g. Tour de Pulse Marathon"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea 
                        className="form-control" 
                        value={campDesc}
                        onChange={(e) => setCampDesc(e.target.value)}
                        placeholder="Explain the rules and target steps for athletes..."
                      />
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label className="form-label">Target Step Count</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={campTargetSteps}
                          onChange={(e) => setCampTargetSteps(e.target.value)}
                          placeholder="e.g. 50000"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Reward Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={campRewardName}
                          onChange={(e) => setCampRewardName(e.target.value)}
                          placeholder="e.g. Pulse Hydration Duffel Bag"
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label className="form-label">Reward Type</label>
                        <select 
                          className="form-control"
                          value={campRewardType}
                          onChange={(e) => setCampRewardType(e.target.value as any)}
                        >
                          <option value="gear">Physical Gear (Item)</option>
                          <option value="badge">Digital Badge</option>
                        </select>
                      </div>

                      <div className="form-group checkbox-group">
                        <input 
                          type="checkbox" 
                          className="checkbox-input" 
                          id="campLimited"
                          checked={campLimited}
                          onChange={(e) => setCampLimited(e.target.checked)}
                        />
                        <label htmlFor="campLimited" className="form-label" style={{ cursor: 'pointer' }}>
                          Limited Edition Rewards
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Reward Image Preset</label>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                        {IMAGE_PRESETS.map((preset) => (
                          <div 
                            key={preset.name}
                            onClick={() => {
                              setCampRewardImage(preset.url);
                              setCampRewardName(preset.name);
                            }}
                            style={{
                              flex: 1,
                              border: `2px solid ${campRewardImage === preset.url ? '#22c55e' : 'transparent'}`,
                              borderRadius: '8px',
                              padding: '8px',
                              cursor: 'pointer',
                              textAlign: 'center',
                              background: '#ffffff'
                            }}
                          >
                            <img 
                              src={preset.url} 
                              alt={preset.name}
                              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                            />
                            <div style={{ fontSize: '11px', fontWeight: '600', marginTop: '4px' }}>{preset.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={actionLoading}
                        style={{ flex: 1, marginTop: 0 }}
                      >
                        {actionLoading 
                          ? (editingQuestOldTitle ? 'Updating Campaign...' : 'Launching Campaign...') 
                          : (editingQuestOldTitle ? 'Update Campaign' : 'Deploy Global Quest')
                        }
                      </button>
                      {editingQuestOldTitle && (
                        <button 
                          type="button" 
                          className="btn-primary" 
                          onClick={handleCancelEdit}
                          style={{ flex: 1, marginTop: 0, backgroundColor: '#6b7280', boxShadow: 'none' }}
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Displaying Live Quests */}
                <div className="glass-card">
                  <h2 className="section-title" style={{ marginBottom: '16px' }}>Active System Quests</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {!analytics || !analytics.quests || analytics.quests.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                        No active quests found in the database.
                      </div>
                    ) : (
                      analytics.quests.map((quest) => (
                        <div 
                          key={quest._id || quest.title} 
                          style={{ 
                            display: 'flex', 
                            gap: '12px', 
                            alignItems: 'center', 
                            background: '#ffffff', 
                            borderRadius: '12px', 
                            padding: '14px', 
                            border: '1px solid rgba(0,0,0,0.04)' 
                          }}
                        >
                          <img 
                            src={quest.rewardImage || 'https://via.placeholder.com/150'} 
                            style={{ width: '50px', height: '50px', objectFit: 'contain' }} 
                            alt="" 
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', fontSize: '15px', textTransform: 'capitalize' }}>{quest.title}</div>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                              {quest.description}
                            </p>
                            <div style={{ fontSize: '11px', color: '#22c55e', fontWeight: '600', marginTop: '4px' }}>
                              Target: {quest.targetSteps.toLocaleString()} steps • Reward: {quest.rewardName} ({quest.rewardType})
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span className={`badge ${quest.limitedEdition ? 'badge-success' : 'badge-info'}`}>
                                {quest.limitedEdition ? 'Limited Edition' : 'Standard'}
                              </span>
                              {quest.isPaused && (
                                <span className="badge badge-danger">Paused</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(quest)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#3b82f6', padding: '2px' }}
                                title="Edit Campaign"
                              >
                                <span className="material-icons" style={{ fontSize: '18px' }}>edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePause(quest.title, quest.rewardName, !!quest.isPaused)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', color: quest.isPaused ? '#22c55e' : '#eab308', padding: '2px' }}
                                title={quest.isPaused ? "Resume Campaign" : "Pause Campaign"}
                              >
                                <span className="material-icons" style={{ fontSize: '18px' }}>
                                  {quest.isPaused ? 'play_arrow' : 'pause'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCampaign(quest.title, quest.rewardName)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#ef4444', padding: '2px' }}
                                title="Delete Campaign"
                              >
                                <span className="material-icons" style={{ fontSize: '18px' }}>delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ATHLETE SIMULATOR */}
            {activeTab === 'simulator' && (
              <div className="bento-col-full">
                {/* Instructions Alert */}
                <div className="glass-card" style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: '#22c55e' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span className="material-icons" style={{ color: '#22c55e' }}>help_outline</span>
                    <div>
                      <h4 style={{ fontWeight: '700', fontSize: '15px', color: '#006e2f' }}>Athlete Simulation Testing Hub</h4>
                      <p style={{ fontSize: '13px', color: '#3d4a3d', marginTop: '4px', lineHeight: '18px' }}>
                        To test how the React Native Expo app updates steps, level progress rings, and claims rewards: 
                        Select an athlete from the list below, select a workout preset (or enter custom numbers), and click **Record Simulated Workout**. 
                        The backend will automatically record the workout, increment the user's statistics, and process step quest completions instantly!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bento-row">
                  {/* Select Athlete */}
                  <div className="glass-card">
                    <h2 className="section-title" style={{ marginBottom: '16px' }}>1. Select Athlete</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {users.map((user) => (
                        <div 
                          key={user._id}
                          onClick={() => setSelectedUser(user)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: `2px solid ${selectedUser?._id === user._id ? '#22c55e' : 'rgba(0,0,0,0.04)'}`,
                            cursor: 'pointer',
                            background: selectedUser?._id === user._id ? 'rgba(34, 197, 94, 0.04)' : '#ffffff',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <img src={user.photoUrl} className="athlete-avatar" style={{ width: '40px', height: '40px' }} alt="" />
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ fontWeight: '700', fontSize: '14px' }}>{user.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              Level {user.level} Athlete • {user.email}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '700', fontSize: '13px' }}>{user.lifetimeSteps.toLocaleString()} steps</div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>{user.lifetimeCalories.toLocaleString()} kcal</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulator Controls */}
                  <div className="glass-card">
                    <h2 className="section-title" style={{ marginBottom: '16px' }}>2. Simulate Workout for {selectedUser?.name || '...'}</h2>
                    
                    {selectedUser ? (
                      <form onSubmit={handleSimulateWorkout}>
                        <div className="form-group">
                          <label className="form-label">Workout Presets</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                            <button 
                              type="button" 
                              className="badge badge-success" 
                              style={{ border: 'none', cursor: 'pointer', padding: '6px 12px' }}
                              onClick={() => applyPreset({ title: 'Morning 5k Run', steps: 5200, calories: 450, duration: 35, distance: 5.2, type: 'run' })}
                            >
                              5k Run
                            </button>
                            <button 
                              type="button" 
                              className="badge badge-success" 
                              style={{ border: 'none', cursor: 'pointer', padding: '6px 12px' }}
                              onClick={() => applyPreset({ title: 'Athlete 10k Run', steps: 10400, calories: 900, duration: 65, distance: 10.4, type: 'run' })}
                            >
                              10k Run
                            </button>
                            <button 
                              type="button" 
                              className="badge badge-info" 
                              style={{ border: 'none', cursor: 'pointer', padding: '6px 12px' }}
                              onClick={() => applyPreset({ title: 'Gym Workout', steps: 1200, calories: 320, duration: 45, distance: 0, type: 'gym' })}
                            >
                              Gym (Weights)
                            </button>
                            <button 
                              type="button" 
                              className="badge badge-info" 
                              style={{ border: 'none', cursor: 'pointer', padding: '6px 12px' }}
                              onClick={() => applyPreset({ title: 'Swim Session', steps: 0, calories: 280, duration: 30, distance: 0.8, type: 'swim' })}
                            >
                              Swim Laps
                            </button>
                            <button 
                              type="button" 
                              className="badge" 
                              style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', background: '#e5e7eb', color: '#374151' }}
                              onClick={() => applyPreset({ title: 'Quick walk', steps: 3500, calories: 150, duration: 25, distance: 2.8, type: 'walk' })}
                            >
                              Walk
                            </button>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Workout Title</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={simTitle}
                            onChange={(e) => setSimTitle(e.target.value)}
                            placeholder="e.g. Afternoon Power Walk"
                          />
                        </div>

                        <div className="form-row-2">
                          <div className="form-group">
                            <label className="form-label">Workout Type</label>
                            <select 
                              className="form-control"
                              value={simType}
                              onChange={(e) => setSimType(e.target.value as any)}
                            >
                              <option value="run">Running</option>
                              <option value="gym">Gym Training</option>
                              <option value="swim">Swimming</option>
                              <option value="walk">Walking</option>
                              <option value="cycle">Cycling</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Duration (mins)</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={simDur}
                              onChange={(e) => setSimDur(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-row-2">
                          <div className="form-group">
                            <label className="form-label">Steps (will be ignored for Gym/Swim)</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={simSteps}
                              disabled={simType === 'gym' || simType === 'swim'}
                              onChange={(e) => setSimSteps(e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Calories Burned (kcal)</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={simCals}
                              onChange={(e) => setSimCals(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Distance (km)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            className="form-control" 
                            value={simDist}
                            onChange={(e) => setSimDist(e.target.value)}
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="btn-primary" 
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Simulating Activity...' : 'Record Simulated Workout'}
                        </button>
                      </form>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                        <span className="material-icons" style={{ fontSize: '48px', marginBottom: '8px' }}>arrow_back</span>
                        <div>Select an athlete from the left panel to begin.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
