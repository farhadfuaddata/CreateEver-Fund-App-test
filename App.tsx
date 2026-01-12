
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  FileText, 
  Plus, 
  Check, 
  X,
  CreditCard,
  PieChart as PieChartIcon,
  LayoutDashboard,
  LogOut,
  Lock,
  User,
  Eye, 
  EyeOff,
  AlertCircle,
  Activity,
  UserPlus,
  Calendar,
  Clock,
  Filter,
  Edit2,
  Trash2,
  Menu,
  MinusCircle,
  PlusCircle,
  ChevronDown,
  History as HistoryIcon,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Profile, Transaction, Loan } from './types';
import { MockSupabase } from './supabase';

type NavigationTab = 'Dashboard' | 'Employee Status' | 'All Data' | 'Activities' | 'User Management';

const GMT6_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Dhaka',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

const date2026 = (month: number = 0, day: number = 1) => new Date(2026, month, day).toISOString();

const MOCK_PROFILES: Profile[] = [
  { id: '@admin', full_name: 'Master Administrator', email: 'admin@createever.com', role: 'admin', balance: 0, pin: '1234', profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', created_at: date2026(0, 1) },
  { id: 'EMP-001', full_name: 'Sarah Chen', email: 'sarah@createever.com', role: 'employee', balance: 4200, pin: '1111', profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', created_at: date2026(0, 5) },
  { id: 'EMP-002', full_name: 'Marcus Bell', email: 'marcus@createever.com', role: 'employee', balance: 2100, pin: '2222', profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', created_at: date2026(0, 10) },
  { id: 'EMP-003', full_name: 'Elena Vance', email: 'elena@createever.com', role: 'employee', balance: -500, pin: '3333', profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', created_at: date2026(0, 15) },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', profile_id: 'EMP-001', amount: 500, type: 'deposit', status: 'approved', description: 'Monthly Contribution', created_at: date2026(0, 20) },
  { id: 't2', profile_id: 'EMP-002', amount: 300, type: 'deposit', status: 'approved', description: 'Monthly Contribution', created_at: date2026(0, 22) },
  { id: 't3', profile_id: 'EMP-003', amount: 500, type: 'withdrawal', status: 'approved', description: 'Emergency Advance', created_at: date2026(0, 25) },
];

const CHART_DATA = [
  { name: 'Jan', liquidity: 45000 },
  { name: 'Feb', liquidity: 52000 },
  { name: 'Mar', liquidity: 48000 },
  { name: 'Apr', liquidity: 61000 },
  { name: 'May', liquidity: 59000 },
  { name: 'Jun', liquidity: 75000 },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<NavigationTab>('Dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(2026);

  // Modal Visibility
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedProfileForHistory, setSelectedProfileForHistory] = useState<Profile | null>(null);
  const [isDueListModalOpen, setIsDueListModalOpen] = useState(false);
  const [isMemberPoolModalOpen, setIsMemberPoolModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  // Toast System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Transaction States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [txProfile, setTxProfile] = useState<Profile | null>(null);
  const [txAmount, setTxAmount] = useState('');

  // Authentication
  const [loginStep, setLoginStep] = useState<'ID' | 'PIN'>('ID');
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const unsubProfiles = MockSupabase.subscribe('profiles', (newProfile) => {
      setProfiles(prev => {
        const exists = prev.some(p => p.id === newProfile.id);
        if (exists) return prev.map(p => p.id === newProfile.id ? newProfile : p);
        return [...prev, newProfile];
      });
      if (currentUser?.id === newProfile.id) setCurrentUser(newProfile);
    });
    const unsubTransactions = MockSupabase.subscribe('transactions', (newTx) => {
      setTransactions(prev => [newTx, ...prev.filter(t => t.id !== newTx.id)]);
    });
    return () => { unsubProfiles(); unsubTransactions(); };
  }, [currentUser]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (loginStep === 'ID') {
      const found = profiles.find(p => p.id.toLowerCase() === loginId.toLowerCase() || p.email.toLowerCase() === loginId.toLowerCase());
      if (found) setLoginStep('PIN');
      else setLoginError('Clearance Failed: ID not found.');
      return;
    }
    const user = profiles.find(p => (p.id.toLowerCase() === loginId.toLowerCase() || p.email.toLowerCase() === loginId.toLowerCase()) && p.pin === loginPin);
    if (user) {
      setCurrentUser(user);
      setLoginId('');
      setLoginPin('');
      setLoginStep('ID');
      if (user.role === 'employee') setActiveTab('Dashboard');
      showToast(`Access Granted: Welcome ${user.full_name}`);
    } else {
      setLoginError('Authentication Pin Invalid.');
      setLoginPin('');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('Dashboard');
    setIsMobileMenuOpen(false);
  };

  const openTxModal = (profile: Profile, type: 'deposit' | 'withdrawal') => {
    setTxProfile(profile);
    setTxType(type);
    setTxAmount('');
    setIsTxModalOpen(true);
  };

  const handleConfirmTransaction = () => {
    const amount = Number(txAmount);
    if (!txProfile || isNaN(amount) || amount <= 0) return alert("Quantum amount invalid.");
    const newBalance = txType === 'deposit' ? txProfile.balance + amount : txProfile.balance - amount;
    const newTx: Transaction = {
      id: `${txType[0].toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      profile_id: txProfile.id,
      amount,
      type: txType,
      status: 'approved',
      description: `Disbursement: ${txType.toUpperCase()}`,
      created_at: new Date().toISOString()
    };
    MockSupabase.notify('transactions', newTx);
    MockSupabase.notify('profiles', { ...txProfile, balance: newBalance });
    setIsTxModalOpen(false);
    showToast(`Transaction Finalized Successfully`);
  };

  const saveMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') return;
    const formData = new FormData(e.currentTarget);
    const id = (formData.get('id') as string);
    const isEditing = !!editingUser;
    const newMember: Profile = {
      id: id || `EMP-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      full_name: formData.get('full_name') as string,
      email: formData.get('email') as string,
      role: 'employee',
      balance: Number(formData.get('balance') || 0),
      pin: formData.get('pin') as string,
      profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.get('full_name')}`,
      created_at: editingUser?.created_at || date2026()
    };
    MockSupabase.notify('profiles', newMember);
    setIsUserModalOpen(false);
    setEditingUser(null);
    showToast(`Registry Updated: ${newMember.full_name}`);
  };

  const initiateDelete = (p: Profile) => {
    if (p.id === '@admin') {
      showToast("Operation Denied: Cannot delete Root Admin", "error");
      return;
    }
    setUserToDelete(p);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setProfiles(prev => prev.filter(p => p.id !== userToDelete.id));
      setIsDeleteConfirmOpen(false);
      showToast(`Personnel Purged: ${userToDelete.full_name}`, 'success');
      setUserToDelete(null);
    }
  };

  const openHistory = (profile: Profile) => {
    setSelectedProfileForHistory(profile);
    setIsHistoryModalOpen(true);
  };

  const isAdmin = currentUser?.role === 'admin';
  const totalFundLiquidity = profiles.reduce((sum, p) => sum + p.balance, 0);
  const totalDueAmount = profiles.reduce((sum, p) => p.balance < 0 ? sum + Math.abs(p.balance) : sum, 0);
  const employeeCount = profiles.filter(p => p.role === 'employee').length;
  const debtorEmployees = profiles.filter(p => p.role === 'employee' && p.balance < 0);
  const allEmployees = profiles.filter(p => p.role === 'employee');

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] p-4">
        <div className="glass-panel w-full max-w-[440px] rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="mb-12 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-800 text-white mb-8 border border-white/10 shadow-xl">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">CreateEver</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Vault Authentication</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{loginStep === 'ID' ? 'Identity ID' : 'Secret PIN'}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500 group-focus-within:text-blue-400 transition-all duration-300">
                  {loginStep === 'ID' ? <User className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                {loginStep === 'ID' ? (
                  <input autoFocus type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="@admin or Employee ID" className="w-full bg-white/[0.03] border border-white/[0.1] rounded-2xl py-4 md:py-5 pl-14 pr-5 text-white focus:ring-2 focus:ring-blue-500/30 transition-all outline-none" required />
                ) : (
                  <div className="relative">
                    <input autoFocus type={showPin ? "text" : "password"} maxLength={4} value={loginPin} onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="w-full bg-white/[0.03] border border-white/[0.1] rounded-2xl py-4 md:py-5 pl-14 pr-14 text-white text-2xl tracking-[0.6em] focus:ring-2 focus:ring-blue-500/30 transition-all font-bold outline-none" required />
                    <button type="button" onClick={() => setShowPin(!showPin)} className="absolute inset-y-0 right-0 flex items-center pr-5 text-slate-500 hover:text-white">{showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                  </div>
                )}
              </div>
            </div>
            {loginError && <div className="flex items-center gap-3 text-red-400 text-xs bg-red-400/5 p-4 rounded-2xl border border-red-400/20"><AlertCircle className="h-4 w-4 shrink-0" /><span>{loginError}</span></div>}
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:scale-[1.02] text-white font-black text-sm uppercase tracking-[0.2em] py-4 md:py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
              {loginStep === 'ID' ? 'Verify Identity' : 'Unlock Vault'}
            </button>
            {loginStep === 'PIN' && <button type="button" onClick={() => { setLoginStep('ID'); setLoginPin(''); setLoginError(''); }} className="w-full text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] hover:text-slate-300 transition-colors">Abort Access</button>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex overflow-hidden font-inter">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-toast pointer-events-none w-full max-w-[90%] md:max-w-md">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] border backdrop-blur-2xl shadow-2xl ${toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {toast.type === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">{toast.type.toUpperCase()}</p>
              <p className="text-sm font-bold tracking-tight">{toast.message}</p>
            </div>
            <X className="h-4 w-4 opacity-40" />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && userToDelete && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-sm rounded-[3rem] p-10 border-red-500/20 shadow-2xl animate-in zoom-in-95 duration-400 text-center">
             <div className="h-24 w-24 rounded-[2.5rem] bg-red-600/10 flex items-center justify-center border border-red-500/20 shadow-2xl shadow-red-500/10 mx-auto mb-8 animate-pulse">
               <Trash2 className="h-12 w-12 text-red-500" />
             </div>
             <h3 className="text-3xl font-black text-white tracking-tighter mb-4">PURGE RECORD</h3>
             <p className="text-slate-400 text-xs mb-10 leading-relaxed font-medium uppercase tracking-[0.2em] px-2">
                System will permanently remove <span className="text-red-400 font-black">{userToDelete.full_name}</span>. This deletion is atomic and irreversible.
             </p>
             <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setIsDeleteConfirmOpen(false)} className="py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest transition-all">Cancel</button>
               <button onClick={confirmDelete} className="py-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95">Purge Now</button>
             </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[300px] border-r border-white/[0.05] bg-[#020617] p-8 h-screen transition-all duration-500 transform lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full shadow-none'}`}>
        <div className="flex items-center justify-between lg:block mb-12">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center border border-white/10 shadow-xl">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter leading-none">CreateEver</h2>
              <p className="text-[9px] text-slate-500 font-black tracking-[0.3em] uppercase mt-1">Institutional</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 p-2"><X className="h-6 w-6" /></button>
        </div>
        <nav className="space-y-2 flex-1 overflow-y-auto pr-2">
          {[
            { id: 'Dashboard', icon: LayoutDashboard },
            { id: 'Employee Status', icon: Users },
            { id: 'All Data', icon: Calendar },
            { id: 'Activities', icon: Clock },
            { id: 'User Management', icon: UserPlus }
          ].map(item => {
            const allowed = isAdmin || ['Dashboard', 'Activities'].includes(item.id);
            if (!allowed) return null;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as NavigationTab); setIsMobileMenuOpen(false); }}
                className={`group flex items-center gap-4 w-full px-5 py-4 rounded-[1.5rem] transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500'}`} />
                <span className="text-[13px] font-black uppercase tracking-widest leading-none">{item.id === 'Activities' && !isAdmin ? 'Ledger' : item.id}</span>
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white animate-pulse"></div>}
              </button>
            );
          })}
        </nav>
        <div className="pt-8 border-t border-white/[0.05]">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] mb-4 shadow-inner">
            <img src={currentUser.profilePic} className="h-10 w-10 rounded-full border border-blue-500/30 bg-slate-800 shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs font-black text-white truncate">{currentUser.full_name}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{currentUser.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 text-xs font-black text-red-400 hover:text-white hover:bg-red-500/20 rounded-2xl transition-all border border-red-400/10 active:scale-95">
            <LogOut className="h-4 w-4" /> TERMINATE SESSION
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative bg-[#020617] scroll-smooth">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-6 bg-[#020617]/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-white/5">
           <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400 p-2"><Menu className="h-6 w-6" /></button>
           <h2 className="text-lg font-black text-white tracking-tighter leading-none">CreateEver</h2>
           <div className="h-8 w-8 rounded-full overflow-hidden border border-blue-500/30">
             <img src={currentUser.profilePic} className="w-full h-full object-cover" />
           </div>
        </div>

        <div className="p-4 md:p-12 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-500 mb-2">Vault Console</p>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none uppercase">
                {!isAdmin && activeTab === 'Activities' ? 'History' : activeTab}
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
               <div className="glass-panel px-8 py-5 rounded-[2rem] flex flex-col items-end min-w-[240px] shadow-2xl group transition-all">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Clock className="h-3 w-3 animate-spin-slow text-blue-500" /> SYSTEM TIME
                  </p>
                  <p className="text-lg md:text-xl font-black text-white tabular-nums tracking-widest">
                    {GMT6_FORMATTER.format(now)}
                  </p>
               </div>
               {activeTab === 'User Management' && isAdmin && (
                 <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-5 px-10 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/40 active:scale-95">
                   <UserPlus className="h-5 w-5" /> <span>REGISTER NEW</span>
                 </button>
               )}
            </div>
          </div>

          {/* Tab Content Logic */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-12">
              {isAdmin ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Vault Assets" value={`$${totalFundLiquidity.toLocaleString()}`} icon={<Wallet className="text-blue-400" />} />
                    <StatCard label="Total Debt" value={`$${totalDueAmount.toLocaleString()}`} icon={<AlertTriangle className="text-red-400" />} onClick={() => setIsDueListModalOpen(true)} />
                    <StatCard label="Active Personnel" value={employeeCount.toString()} icon={<Users className="text-purple-400" />} onClick={() => setIsMemberPoolModalOpen(true)} />
                    <StatCard label="Status" value="SECURE" icon={<ShieldCheck className="text-emerald-400" />} />
                  </div>
                  <div className="glass-panel rounded-[3rem] p-10 shadow-2xl">
                    <h3 className="text-2xl font-black text-white mb-10 tracking-tight uppercase">Growth Projection</h3>
                    <div className="h-[350px] md:h-[450px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={CHART_DATA}>
                          <defs>
                            <linearGradient id="gLiq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                          <YAxis stroke="#64748b" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} />
                          <Area type="monotone" dataKey="liquidity" stroke="#3b82f6" strokeWidth={5} fill="url(#gLiq)" animationDuration={3000} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative overflow-hidden glass-panel rounded-[4rem] p-10 md:p-20 border-blue-500/10 shadow-3xl animate-in zoom-in duration-1000">
                  <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/[0.05] blur-[140px] -mr-[300px] -mt-[300px]"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-12">
                      <div className="h-20 w-20 rounded-[2rem] bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-2xl">
                        <Wallet className="h-10 w-10 text-blue-400" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.6em] text-slate-500">Asset Liquidity</span>
                    </div>
                    <h2 className={`text-6xl sm:text-8xl md:text-[10rem] font-black tracking-tighter mb-12 leading-none truncate ${currentUser.balance < 0 ? 'text-red-500' : 'text-white'}`}>
                      ${currentUser.balance.toLocaleString()}
                    </h2>
                    <div className="flex items-center gap-4 py-4 px-8 bg-white/[0.02] border border-white/10 rounded-3xl w-fit shadow-2xl">
                      <div className={`h-3 w-3 rounded-full animate-pulse ${currentUser.balance < 0 ? 'bg-red-500 shadow-red-500' : 'bg-emerald-500 shadow-emerald-500'}`}></div>
                      <p className="text-slate-500 font-black text-xs uppercase tracking-[0.4em]">Vault Synchronized</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'User Management' && isAdmin && (
            <div className="animate-in slide-in-from-bottom-8 duration-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {profiles.map((p, idx) => (
                  <div key={p.id} style={{ animationDelay: `${idx * 50}ms` }} className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-between group relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-start justify-between mb-8 relative z-10">
                       <div className="h-20 w-20 rounded-[2rem] border-2 border-white/5 bg-slate-900 group-hover:scale-110 group-hover:border-blue-500/30 transition-all duration-500 shadow-xl shrink-0 overflow-hidden">
                         <img src={p.profilePic} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex gap-3">
                          <button onClick={() => { setEditingUser(p); setIsUserModalOpen(true); }} className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-blue-600 text-slate-500 hover:text-white transition-all flex items-center justify-center active:scale-90">
                            <Edit2 className="h-5 w-5" />
                          </button>
                          {p.id !== '@admin' && (
                            <button onClick={() => initiateDelete(p)} className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-red-600 text-slate-500 hover:text-white transition-all flex items-center justify-center active:scale-90 group/trash">
                              <Trash2 className="h-5 w-5 group-hover/trash:scale-110 transition-transform" />
                            </button>
                          )}
                       </div>
                    </div>
                    <div className="relative z-10">
                       <p className="text-lg font-black text-white tracking-tight leading-tight mb-1 truncate">{p.full_name}</p>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-6">{p.id}</p>
                       
                       <div className={`px-4 py-3 rounded-2xl border ${p.balance < 0 ? 'bg-red-600/5 border-red-500/20' : 'bg-emerald-600/5 border-emerald-500/20'} flex items-center justify-between`}>
                          <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Balance</span>
                          <span className={`text-xl font-black tracking-tighter ${p.balance < 0 ? 'text-red-500' : 'text-emerald-400'}`}>${p.balance.toLocaleString()}</span>
                       </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback for other tabs */}
          {['Employee Status', 'All Data', 'Activities'].includes(activeTab) && (
            <div className="text-center py-40 animate-pulse">
               <Activity className="h-20 w-20 text-slate-800 mx-auto mb-8" />
               <p className="text-slate-500 font-black text-xs uppercase tracking-[0.5em]">Synchronizing Registry Modules...</p>
            </div>
          )}
        </div>
      </main>

      {/* Transaction Modal (Reused for deposit/withdraw) */}
      {isTxModalOpen && txProfile && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-md rounded-[3rem] border-white/10 shadow-3xl animate-in zoom-in-95 duration-500 overflow-hidden">
            <div className={`p-8 flex items-center justify-between ${txType === 'deposit' ? 'bg-emerald-600/10' : 'bg-red-600/10'}`}>
               <div className="flex items-center gap-5">
                 <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl ${txType === 'deposit' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                   {txType === 'deposit' ? <ArrowDownLeft className="h-8 w-8" /> : <ArrowUpRight className="h-8 w-8" />}
                 </div>
                 <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{txType}</h3>
               </div>
               <button onClick={() => setIsTxModalOpen(false)} className="text-slate-400 hover:text-white transition-all p-3"><X className="h-7 w-7" /></button>
            </div>
            <div className="p-10 space-y-10">
               <div className="space-y-4 text-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Asset Allocation (USD)</p>
                 <div className="relative">
                   <span className="absolute left-0 top-1/2 -translate-y-1/2 text-5xl font-black text-slate-800 tracking-tighter opacity-50">$</span>
                   <input autoFocus type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-b-2 border-white/10 focus:border-blue-500 text-6xl font-black text-white text-center py-6 outline-none transition-all placeholder:text-slate-900 tabular-nums" />
                 </div>
               </div>
               <button onClick={handleConfirmTransaction} className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-3xl active:scale-95 text-white ${txType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40' : 'bg-red-600 hover:bg-red-500 shadow-red-900/40'}`}>Authorize Discharge</button>
            </div>
          </div>
        </div>
      )}

      {/* Registry Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-lg rounded-[3rem] p-10 md:p-14 shadow-3xl animate-in zoom-in-95 duration-400">
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{editingUser ? 'UPDATE' : 'REGISTER'} Personnel</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-500 hover:text-white transition-all p-3"><X className="h-8 w-8" /></button>
            </div>
            <form onSubmit={saveMember} className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                   <input defaultValue={editingUser?.full_name} name="full_name" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 px-6 text-white focus:ring-2 focus:ring-blue-600/50 outline-none font-bold" required />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Unique Terminal ID</label>
                   <input defaultValue={editingUser?.id} name="id" readOnly={!!editingUser} placeholder="e.g. EMP-101" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 px-6 text-white focus:ring-2 focus:ring-blue-600/50 disabled:opacity-50 outline-none font-bold" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Security PIN (4 Digit)</label>
                   <input defaultValue={editingUser?.pin} name="pin" maxLength={4} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 px-6 text-white focus:ring-2 focus:ring-blue-600/50 font-black tracking-[1em] outline-none" required />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Opening Assets ($)</label>
                   <input defaultValue={editingUser?.balance || 0} name="balance" type="number" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 px-6 text-white focus:ring-2 focus:ring-blue-600/50 outline-none font-black tabular-nums" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-3xl shadow-3xl shadow-blue-900/40 transition-all uppercase tracking-[0.3em] active:scale-95 text-xs">Verify & COMMIT</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; onClick?: () => void }> = ({ label, value, icon, onClick }) => (
  <div 
    onClick={onClick}
    className={`glass-panel p-10 rounded-[2.5rem] flex flex-col justify-between transition-all duration-500 shadow-2xl group ${onClick ? 'cursor-pointer hover:bg-white/[0.06] hover:-translate-y-2' : ''}`}
  >
    <div className="flex items-center justify-between mb-12">
      <div className="h-16 w-16 rounded-[1.75rem] bg-white/[0.03] border border-white/[0.08] flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-2xl shrink-0">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: `${(icon.props as any).className || ''} h-8 w-8`.trim() }) : icon}
      </div>
      {onClick && <Info className="h-5 w-5 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
    <div>
      <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] mb-4">{label}</p>
      <h4 className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-none truncate">{value}</h4>
    </div>
  </div>
);

export default App;
