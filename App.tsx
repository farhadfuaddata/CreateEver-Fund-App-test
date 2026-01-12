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
  CheckCircle2
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

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedProfileForHistory, setSelectedProfileForHistory] = useState<Profile | null>(null);
  const [isDueListModalOpen, setIsDueListModalOpen] = useState(false);
  const [isMemberPoolModalOpen, setIsMemberPoolModalOpen] = useState(false);
  
  // Custom Delete Confirmation Modal
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Transaction States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [txProfile, setTxProfile] = useState<Profile | null>(null);
  const [txAmount, setTxAmount] = useState('');

  // Login States
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
      const timer = setTimeout(() => setToast(null), 3000);
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
      else setLoginError('Identity not recognized.');
      return;
    }
    const user = profiles.find(p => (p.id.toLowerCase() === loginId.toLowerCase() || p.email.toLowerCase() === loginId.toLowerCase()) && p.pin === loginPin);
    if (user) {
      setCurrentUser(user);
      setLoginId('');
      setLoginPin('');
      setLoginStep('ID');
      if (user.role === 'employee') setActiveTab('Dashboard');
      showToast(`Welcome back, ${user.full_name}`);
    } else {
      setLoginError('Invalid Security PIN.');
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
    if (!txProfile || isNaN(amount) || amount <= 0) return alert("Invalid amount entered.");
    const newBalance = txType === 'deposit' ? txProfile.balance + amount : txProfile.balance - amount;
    const newTx: Transaction = {
      id: `${txType[0].toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      profile_id: txProfile.id,
      amount,
      type: txType,
      status: 'approved',
      description: `Manual ${txType.charAt(0).toUpperCase() + txType.slice(1)}`,
      created_at: new Date().toISOString()
    };
    MockSupabase.notify('transactions', newTx);
    MockSupabase.notify('profiles', { ...txProfile, balance: newBalance });
    setIsTxModalOpen(false);
    showToast(`${txType === 'deposit' ? 'Deposit' : 'Withdrawal'} successful`);
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
    showToast(`Member ${isEditing ? 'updated' : 'registered'} successfully`);
  };

  const initiateDelete = (p: Profile) => {
    if (p.id === '@admin') {
      showToast("Cannot delete root admin", "error");
      return;
    }
    setUserToDelete(p);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setProfiles(prev => prev.filter(p => p.id !== userToDelete.id));
      setIsDeleteConfirmOpen(false);
      showToast(`${userToDelete.full_name} removed from registry`);
      setUserToDelete(null);
    }
  };

  const openHistory = (profile: Profile) => {
    setSelectedProfileForHistory(profile);
    setIsHistoryModalOpen(true);
  };

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] p-4">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 blur-[140px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/5 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="glass-panel w-full max-w-[440px] rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10 border-white/[0.08] bg-white/[0.01] animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-12 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-600/30 to-blue-900/10 text-blue-400 mb-8 border border-blue-500/20 shadow-lg shadow-blue-500/10">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">CreateEver</h1>
            <p className="text-slate-500 text-sm font-medium tracking-wide uppercase tracking-[0.2em]">Institutional Access</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{loginStep === 'ID' ? 'Identity Credentials' : 'Authentication PIN'}</label>
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
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-sm uppercase tracking-[0.15em] py-4 md:py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
              {loginStep === 'ID' ? 'Initiate Clearance' : 'Confirm Identity'}
            </button>
            {loginStep === 'PIN' && <button type="button" onClick={() => { setLoginStep('ID'); setLoginPin(''); setLoginError(''); }} className="w-full text-slate-600 text-[10px] font-black uppercase tracking-[0.1em] hover:text-slate-300 transition-colors">Reset Session</button>}
          </form>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';
  const totalFundLiquidity = profiles.reduce((sum, p) => sum + p.balance, 0);
  const totalDueAmount = profiles.reduce((sum, p) => p.balance < 0 ? sum + Math.abs(p.balance) : sum, 0);
  const employeeCount = profiles.filter(p => p.role === 'employee').length;
  const debtorEmployees = profiles.filter(p => p.role === 'employee' && p.balance < 0);
  const allEmployees = profiles.filter(p => p.role === 'employee');

  return (
    <div className="min-h-screen bg-[#020617] flex overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 duration-500 pointer-events-none">
          <div className={`flex items-center gap-4 px-8 py-4 rounded-[1.5rem] border backdrop-blur-xl shadow-2xl ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {isDeleteConfirmOpen && userToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-sm rounded-[2.5rem] p-10 border-red-500/20 shadow-2xl animate-in zoom-in-95 duration-400 text-center">
             <div className="h-20 w-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-xl shadow-red-500/10 mx-auto mb-8">
               <Trash2 className="h-10 w-10 text-red-500" />
             </div>
             <h3 className="text-2xl font-black text-white tracking-tighter mb-4">Confirm Deletion</h3>
             <p className="text-slate-400 text-xs mb-10 leading-relaxed px-4 font-medium uppercase tracking-widest">
                Permanent purge of <span className="text-white font-black">{userToDelete.full_name}</span> from the central registry? This action is irreversible.
             </p>
             <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setIsDeleteConfirmOpen(false)} className="py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest transition-all">Cancel</button>
               <button onClick={confirmDelete} className="py-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-red-600/20 active:scale-95">Purge Member</button>
             </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[300px] border-r border-white/[0.05] bg-[#020617] p-8 h-screen transition-transform duration-300 transform lg:translate-x-0 lg:static ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between lg:block mb-12">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center border border-white/10 shadow-2xl shadow-blue-500/20">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter">CreateEver</h2>
              <p className="text-[9px] text-slate-500 font-black tracking-[0.2em] uppercase">Enterprise Suite</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400"><X className="h-6 w-6" /></button>
        </div>
        <nav className="space-y-2 flex-1 overflow-y-auto">
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
                className={`group flex items-center gap-4 w-full px-5 py-4 rounded-[1.25rem] transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`}
              >
                <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500'}`} />
                <span className="text-sm font-black uppercase tracking-widest">{item.id === 'Activities' && !isAdmin ? 'My History' : item.id}</span>
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white animate-pulse"></div>}
              </button>
            );
          })}
        </nav>
        <div className="pt-8 border-t border-white/[0.05]">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] mb-4 shadow-inner">
            <img src={currentUser.profilePic} className="h-10 w-10 rounded-full border border-blue-500/30 bg-slate-800 shadow-md" />
            <div className="overflow-hidden">
              <p className="text-xs font-black text-white truncate">{currentUser.full_name}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{currentUser.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 text-xs font-black text-red-400 hover:text-red-300 hover:bg-red-400/5 rounded-2xl transition-all border border-red-400/10 active:scale-95 shadow-lg">
            <LogOut className="h-4 w-4" /> TERMINATE SESSION
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative bg-[#020617] scroll-smooth">
        {/* Mobile Navbar */}
        <div className="lg:hidden flex items-center justify-between p-6 bg-[#020617]/80 backdrop-blur sticky top-0 z-40 border-b border-white/5 shadow-2xl">
           <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400 p-2"><Menu className="h-6 w-6" /></button>
           <h2 className="text-lg font-black text-white tracking-tighter">CreateEver</h2>
           <div className="h-8 w-8 rounded-full overflow-hidden border border-blue-500/30 bg-slate-800">
             <img src={currentUser.profilePic} className="w-full h-full object-cover" />
           </div>
        </div>

        <div className="p-4 md:p-8 lg:p-12 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-2">Institutional Platform</p>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none uppercase">
                {!isAdmin && activeTab === 'Activities' ? 'History' : activeTab}
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
               <div className="glass-panel px-6 py-4 rounded-[1.5rem] border-white/5 flex flex-col items-end min-w-[200px] md:min-w-[240px] shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2 relative z-10">
                    <Clock className="h-3 w-3 animate-spin-slow text-blue-400" /> GMT+6
                  </p>
                  <p className="text-sm md:text-lg font-black text-white tabular-nums tracking-wider relative z-10 drop-shadow-sm">
                    {GMT6_FORMATTER.format(now)}
                  </p>
               </div>
               {activeTab === 'User Management' && isAdmin && (
                 <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-6 md:px-8 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20 active:scale-95 group">
                   <UserPlus className="h-5 w-5 group-hover:scale-110 transition-transform" /> <span>NEW MEMBER</span>
                 </button>
               )}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-12">
              {isAdmin ? (
                <>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Available Balance" value={`$${totalFundLiquidity.toLocaleString()}`} icon={<Wallet className="text-blue-400" />} />
                    <StatCard label="Total Due" value={`$${totalDueAmount.toLocaleString()}`} icon={<AlertTriangle className="text-red-400" />} onClick={() => setIsDueListModalOpen(true)} />
                    <StatCard label="Member Pool" value={employeeCount.toString()} icon={<Users className="text-purple-400" />} onClick={() => setIsMemberPoolModalOpen(true)} />
                    <StatCard label="Vault Security" value="Optimal" icon={<ShieldCheck className="text-emerald-400" />} />
                  </div>
                  <div className="glass-panel rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border-white/[0.05] shadow-2xl animate-in fade-in duration-700 delay-200">
                    <h3 className="text-xl md:text-2xl font-black text-white mb-10 tracking-tight uppercase">Projected Index 2026</h3>
                    <div className="h-[300px] md:h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={CHART_DATA}>
                          <defs>
                            <linearGradient id="gLiq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                          <YAxis stroke="#64748b" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                          <Tooltip cursor={{ stroke: '#3b82f6', strokeWidth: 2 }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} />
                          <Area type="monotone" dataKey="liquidity" stroke="#3b82f6" strokeWidth={4} fill="url(#gLiq)" animationDuration={2000} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative overflow-hidden glass-panel rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 border-blue-500/10 bg-gradient-to-br from-blue-600/[0.05] via-transparent to-transparent shadow-2xl animate-in zoom-in duration-1000">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.03] blur-[140px] -mr-[250px] -mt-[250px]"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-5 mb-8 md:mb-12">
                      <div className="h-14 w-14 md:h-16 md:w-16 rounded-[1.25rem] md:rounded-[1.5rem] bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-xl shadow-blue-500/10">
                        <Wallet className="h-7 w-7 md:h-8 md:w-8 text-blue-400" />
                      </div>
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-slate-500">Liquid Assets</span>
                    </div>
                    <h2 className={`text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-none truncate ${currentUser.balance < 0 ? 'text-red-500' : 'text-white'}`}>
                      ${currentUser.balance.toLocaleString()}
                    </h2>
                    <div className="flex items-center gap-4 py-3 md:py-4 px-5 md:px-6 bg-white/[0.02] border border-white/5 rounded-2xl w-fit shadow-lg">
                      <div className={`h-2 md:h-2.5 w-2 md:w-2.5 rounded-full animate-pulse ${currentUser.balance < 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                      <p className="text-slate-500 font-black text-[9px] md:text-xs uppercase tracking-[0.2em]">Live Synchronized Vault</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Employee Status' && isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {profiles.filter(p => p.role !== 'admin').map(p => (
                <div key={p.id} className="glass-panel rounded-[2.5rem] p-6 md:p-10 border-white/5 hover:bg-white/[0.03] transition-all group relative overflow-hidden shadow-xl animate-in slide-in-from-bottom-4 duration-500">
                   <div className="absolute top-0 right-0 p-4 md:p-6 flex gap-3">
                      <button onClick={() => openHistory(p)} className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all hover:bg-blue-600 shadow-lg">
                        <HistoryIcon className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                      <span className={`text-[8px] md:text-[9px] font-black uppercase px-2 md:px-3 py-1 h-fit rounded-full flex items-center justify-center border ${p.balance < 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {p.balance < 0 ? 'DEBT' : 'CLEAR'}
                      </span>
                   </div>
                   <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-10 mt-2">
                     <div className="h-16 w-16 md:h-20 md:w-20 rounded-[1.25rem] md:rounded-[1.75rem] overflow-hidden border-2 border-white/10 group-hover:border-blue-500/40 transition-all shadow-lg bg-slate-800 shrink-0">
                       <img src={p.profilePic} className="w-full h-full object-cover" />
                     </div>
                     <div className="overflow-hidden">
                       <h4 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none mb-2 truncate">{p.full_name}</h4>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">{p.id}</p>
                     </div>
                   </div>
                   <div className="space-y-4 md:space-y-6 mb-8 md:mb-10">
                      <div className="flex justify-between items-center p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white/[0.02] border border-white/[0.05] shadow-inner">
                        <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance</span>
                        <span className={`text-2xl md:text-3xl font-black tracking-tighter ${p.balance < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                          ${p.balance.toLocaleString()}
                        </span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <button onClick={() => openTxModal(p, 'deposit')} className="flex items-center justify-center gap-2 py-4 md:py-5 rounded-2xl bg-emerald-500/10 text-emerald-400 font-black text-[10px] md:text-[11px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 active:scale-95">
                        <PlusCircle className="h-4 w-4" /> DEPOSIT
                      </button>
                      <button onClick={() => openTxModal(p, 'withdrawal')} className="flex items-center justify-center gap-2 py-4 md:py-5 rounded-2xl bg-red-500/10 text-red-400 font-black text-[10px] md:text-[11px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20 active:scale-95">
                        <MinusCircle className="h-4 w-4" /> WITHDRAW
                      </button>
                   </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'User Management' && isAdmin && (
            <div className="glass-panel rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border-white/5 shadow-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map(p => (
                  <div key={p.id} className="glass-card p-6 md:p-8 rounded-[2rem] flex items-center justify-between group shadow-lg border-white/[0.03] relative overflow-hidden animate-in fade-in duration-500 hover:translate-y-[-4px]">
                    <div className="flex items-center gap-4 md:gap-5 relative z-10 overflow-hidden">
                       <div className="h-14 w-14 md:h-16 md:w-16 rounded-[1.25rem] border border-white/10 bg-slate-800 shadow-md group-hover:scale-105 transition-transform shrink-0">
                         <img src={p.profilePic} className="w-full h-full object-cover" />
                       </div>
                       <div className="overflow-hidden">
                         <p className="text-base md:text-lg font-black text-white tracking-tight leading-none mb-1 truncate">{p.full_name}</p>
                         <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">{p.id}</p>
                       </div>
                    </div>
                    <div className="flex gap-2 md:gap-3 relative z-10 shrink-0">
                      <button onClick={() => { setEditingUser(p); setIsUserModalOpen(true); }} className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white/[0.03] text-slate-500 hover:text-white hover:bg-blue-600 transition-all flex items-center justify-center border border-white/5 active:scale-90 shadow-lg">
                        <Edit2 className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                      {p.id !== '@admin' && (
                        <button onClick={() => initiateDelete(p)} className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white/[0.03] text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all flex items-center justify-center border border-white/5 active:scale-90 shadow-lg group/btn">
                          <Trash2 className="h-4 w-4 md:h-5 md:w-5 group-hover/btn:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/0 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'All Data' && isAdmin && (
            <div className="glass-panel rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border-white/5 shadow-2xl overflow-hidden animate-in fade-in duration-700">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                 <div>
                   <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2 uppercase tracking-tighter">Fund Matrix Analysis</h3>
                   <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Full Ledger Control (2026+)</p>
                 </div>
                 <div className="flex flex-wrap gap-4">
                    <div className="relative flex-1 sm:flex-none">
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 md:py-4 px-6 md:px-8 text-[10px] md:text-xs font-black uppercase text-slate-300 outline-none hover:bg-white/[0.05] transition-all appearance-none pr-12 cursor-pointer shadow-lg">
                        {Array.from({length: 12}).map((_, i) => (
                          <option key={i} value={i} className="bg-slate-900 text-white">{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    </div>
                    <div className="relative flex-1 sm:flex-none">
                      <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 md:py-4 px-6 md:px-8 text-[10px] md:text-xs font-black uppercase text-slate-300 outline-none hover:bg-white/[0.05] transition-all appearance-none pr-12 cursor-pointer shadow-lg">
                        {[2026, 2027, 2028, 2029, 2030].map(y => (
                          <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    </div>
                 </div>
               </div>
               <div className="overflow-x-auto -mx-6 px-6">
                 <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[9px] md:text-[10px] uppercase text-slate-500 font-black tracking-[0.3em]">
                        <th className="pb-8 pl-6">Personnel</th>
                        <th className="pb-8">Liquidity</th>
                        <th className="pb-8">Deposits</th>
                        <th className="pb-8 pr-6 text-right">Withdrawals</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {profiles.filter(p => p.role !== 'admin').map(p => {
                        const monthlyTxs = transactions.filter(t => {
                          const date = new Date(t.created_at);
                          return t.profile_id === p.id && date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
                        });
                        const mDeposits = monthlyTxs.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
                        const mWithdrawals = monthlyTxs.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
                        return (
                          <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors relative">
                            <td className="py-6 md:py-8 pl-6">
                              <div className="flex items-center gap-4 md:gap-5">
                                <img src={p.profilePic} className="h-10 w-10 md:h-12 md:w-12 rounded-[1rem] border border-white/10 bg-slate-800 shadow-md" />
                                <div>
                                  <p className="text-sm md:text-base font-black text-white tracking-tight mb-1 truncate">{p.full_name}</p>
                                  <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">{p.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-6 md:py-8">
                               <p className={`text-lg md:text-xl font-black tracking-tighter tabular-nums ${p.balance < 0 ? 'text-red-500' : 'text-slate-100'}`}>
                                 ${p.balance.toLocaleString()}
                               </p>
                            </td>
                            <td className="py-6 md:py-8">
                               <p className="text-emerald-400 font-black text-base md:text-lg tracking-tighter flex items-center gap-2">
                                 <PlusCircle className="h-4 w-4 opacity-50" /> ${mDeposits.toLocaleString()}
                               </p>
                            </td>
                            <td className="py-6 md:py-8 pr-6 text-right">
                               <p className="text-red-400 font-black text-base md:text-lg tracking-tighter flex items-center justify-end gap-2">
                                 <MinusCircle className="h-4 w-4 opacity-50" /> ${mWithdrawals.toLocaleString()}
                               </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'Activities' && (
            <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 animate-in slide-in-from-bottom-8 duration-700">
              <div className="space-y-4 md:space-y-6">
                {transactions
                  .filter(t => isAdmin || t.profile_id === currentUser.id)
                  .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((t, idx) => (
                    <div key={t.id} style={{ animationDelay: `${idx * 100}ms` }} className="glass-panel p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border-white/5 flex flex-col sm:flex-row items-start gap-6 md:gap-10 hover:bg-white/[0.03] transition-all shadow-xl group relative overflow-hidden animate-in slide-in-from-right-4 duration-500 fill-mode-both">
                       <div className={`h-12 w-12 md:h-16 md:w-16 rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform ${t.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-red-500/10 text-red-400 border border-red-500/10'}`}>
                          {t.type === 'deposit' ? <ArrowDownLeft className="h-6 w-6 md:h-8 md:w-8" /> : <ArrowUpRight className="h-6 w-6 md:h-8 md:w-8" />}
                       </div>
                       <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                            <p className="text-lg md:text-xl font-black text-white tracking-tight leading-none truncate">{t.description}</p>
                            <p className={`${t.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'} font-black text-xl md:text-2xl tracking-tighter tabular-nums`}>
                              {t.type === 'deposit' ? '+' : '-'}${t.amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-4 md:mb-6">
                            <div className="flex items-center gap-2 md:gap-3">
                               <img src={profiles.find(p => p.id === t.profile_id)?.profilePic} className="h-5 w-5 md:h-6 md:w-6 rounded-lg border border-white/10 shadow-sm" />
                               <span className="text-[10px] md:text-xs font-bold text-slate-300">{profiles.find(p => p.id === t.profile_id)?.full_name}</span>
                            </div>
                            <div className="hidden sm:block h-1.5 w-1.5 rounded-full bg-slate-700"></div>
                            <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                              <Calendar className="h-3 w-3" /> {new Date(t.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                            <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/[0.02] border border-white/[0.05] shadow-inner tabular-nums">
                              <Clock className="h-3 w-3 text-blue-400" /> {GMT6_FORMATTER.format(new Date(t.created_at))}
                            </div>
                            <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/[0.02] border border-white/[0.05] shadow-inner">
                              <Lock className="h-3 w-3 text-slate-700" /> ID_{t.id.slice(0, 8)}
                            </div>
                          </div>
                       </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- DASHBOARD MODALS --- */}
      {/* Due List Modal */}
      {isDueListModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh]">
            <div className="p-6 md:p-10 border-b border-white/10 flex items-center justify-between bg-red-600/[0.02]">
               <div className="flex items-center gap-4 md:gap-5">
                 <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-red-600/10 text-red-500 flex items-center justify-center border border-red-500/20 shadow-xl shadow-red-500/10">
                   <AlertTriangle className="h-5 w-5 md:h-7 md:w-7" />
                 </div>
                 <div>
                   <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none mb-1">Liability Registry</h3>
                   <p className="text-[8px] md:text-[10px] text-slate-500 font-black tracking-[0.4em] uppercase">Negative Balances</p>
                 </div>
               </div>
               <button onClick={() => setIsDueListModalOpen(false)} className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 hover:bg-red-500 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-90"><X className="h-6 w-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4">
              {debtorEmployees.map(p => (
                <div key={p.id} className="glass-card p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-between group shadow-sm">
                  <div className="flex items-center gap-4 md:gap-6">
                    <img src={p.profilePic} className="h-10 w-10 md:h-12 md:w-12 rounded-2xl border border-white/10 bg-slate-800 shrink-0" />
                    <div>
                      <p className="text-sm md:text-base font-black text-white tracking-tight leading-none mb-1 truncate max-w-[120px] md:max-w-none">{p.full_name}</p>
                      <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">{p.id}</p>
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-black text-red-500 tracking-tighter tabular-nums">-${Math.abs(p.balance).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="p-6 md:p-8 border-t border-white/10 bg-white/[0.01] flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Global Debt Exposure</span>
                <p className="text-2xl md:text-3xl font-black text-red-500 tracking-tighter tabular-nums">${totalDueAmount.toLocaleString()}</p>
              </div>
              <button onClick={() => setIsDueListModalOpen(false)} className="w-full sm:w-auto px-10 py-4 md:py-5 rounded-2xl bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {isTxModalOpen && txProfile && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-md rounded-[2rem] md:rounded-[3rem] border-white/10 shadow-2xl animate-in zoom-in-95 duration-400 overflow-hidden">
            <div className={`p-6 md:p-8 flex items-center justify-between shrink-0 ${txType === 'deposit' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
               <div className="flex items-center gap-4">
                 <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg ${txType === 'deposit' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                   {txType === 'deposit' ? <ArrowDownLeft className="h-5 w-5 md:h-6 md:w-6" /> : <ArrowUpRight className="h-5 w-5 md:h-6 md:w-6" />}
                 </div>
                 <h3 className="text-lg md:text-xl font-black text-white tracking-tighter uppercase">{txType}</h3>
               </div>
               <button onClick={() => setIsTxModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2"><X className="h-6 w-6" /></button>
            </div>
            <div className="p-6 md:p-10 space-y-6 md:space-y-8">
               <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1">Amount (USD)</label>
                 <div className="relative group">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl md:text-2xl font-black text-slate-700transition-colors group-focus-within:text-blue-500">$</span>
                   <input autoFocus type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="0.00" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 md:py-6 pl-14 pr-6 text-2xl md:text-3xl font-black text-white focus:ring-2 focus:ring-blue-600/50 outline-none transition-all placeholder:text-slate-900 tabular-nums" />
                 </div>
               </div>
               <div className="p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4 md:space-y-5 shadow-inner">
                 <div className="flex justify-between items-center">
                   <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance</span>
                   <span className="text-base md:text-lg font-bold text-slate-400 tabular-nums">${txProfile.balance.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-center h-px bg-white/[0.05] relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 p-2 border border-white/5 rounded-full shadow-lg">
                       <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-slate-600 rotate-90" />
                    </div>
                 </div>
                 <div className="flex justify-between items-center pt-2">
                   <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Projected</span>
                   <span className={`text-xl md:text-2xl font-black tabular-nums tracking-tighter ${
                    (txType === 'deposit' ? txProfile.balance + Number(txAmount || 0) : txProfile.balance - Number(txAmount || 0)) < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                    ${(txType === 'deposit' ? txProfile.balance + Number(txAmount || 0) : txProfile.balance - Number(txAmount || 0)).toLocaleString()}
                   </span>
                 </div>
               </div>
               <div className="pt-2 grid grid-cols-2 gap-3 md:gap-4">
                 <button onClick={() => setIsTxModalOpen(false)} className="py-4 md:py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all">Abort</button>
                 <button onClick={handleConfirmTransaction} className={`py-4 md:py-5 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 text-white ${txType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'}`}>Confirm</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Memberregistry Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-lg rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8 md:mb-10">
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none">{editingUser ? 'EDIT MEMBER' : 'REGISTER MEMBER'}</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-500 hover:text-white transition-all p-2"><X className="h-6 w-6 md:h-7 md:w-7" /></button>
            </div>
            <form onSubmit={saveMember} className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2 md:space-y-3">
                   <label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                   <input defaultValue={editingUser?.full_name} name="full_name" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 md:py-5 px-5 md:px-6 text-white focus:ring-2 focus:ring-blue-600/50 outline-none transition-all font-bold shadow-inner" required />
                </div>
                <div className="space-y-2 md:space-y-3">
                   <label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">ID</label>
                   <input defaultValue={editingUser?.id} name="id" readOnly={!!editingUser} placeholder="e.g. EMP-101" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 md:py-5 px-5 md:px-6 text-white focus:ring-2 focus:ring-blue-600/50 disabled:opacity-50 outline-none font-bold shadow-inner" required />
                </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                 <label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email</label>
                 <input defaultValue={editingUser?.email} name="email" type="email" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 md:py-5 px-5 md:px-6 text-white focus:ring-2 focus:ring-blue-600/50 outline-none font-bold shadow-inner" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2 md:space-y-3">
                   <label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Security PIN</label>
                   <input defaultValue={editingUser?.pin} name="pin" maxLength={4} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 md:py-5 px-5 md:px-6 text-white focus:ring-2 focus:ring-blue-600/50 font-black tracking-[0.5em] outline-none shadow-inner" required />
                </div>
                {!editingUser && (
                  <div className="space-y-2 md:space-y-3">
                     <label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Initial Balance ($)</label>
                     <input defaultValue={0} name="balance" type="number" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 md:py-5 px-5 md:px-6 text-white focus:ring-2 focus:ring-blue-600/50 outline-none font-bold shadow-inner tabular-nums" />
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 md:py-6 rounded-3xl shadow-xl shadow-blue-900/40 transition-all uppercase tracking-[0.2em] active:scale-95 text-xs md:text-sm">COMMIT Registry</button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedProfileForHistory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-6 md:p-10 border-b border-white/10 flex items-center justify-between">
               <div className="flex items-center gap-4 md:gap-6">
                 <img src={selectedProfileForHistory.profilePic} className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl border border-white/20 bg-slate-800 shrink-0" />
                 <div>
                   <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase leading-none mb-1 truncate max-w-[150px] md:max-w-none">{selectedProfileForHistory.full_name}</h3>
                   <p className="text-[8px] md:text-[10px] text-slate-500 font-black tracking-[0.3em] uppercase leading-none">{selectedProfileForHistory.id}</p>
                 </div>
               </div>
               <button onClick={() => setIsHistoryModalOpen(false)} className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 hover:bg-red-500 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-90"><X className="h-6 w-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 md:space-y-6">
              {transactions.filter(t => t.profile_id === selectedProfileForHistory.id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(t => (
                <div key={t.id} className="glass-card p-4 md:p-6 rounded-[1.25rem] md:rounded-[2rem] flex items-center justify-between group">
                   <div className="flex items-center gap-4 md:gap-6 overflow-hidden">
                      <div className={`h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${t.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                         {t.type === 'deposit' ? <Plus className="h-5 w-5 md:h-6 md:w-6" /> : <MinusCircle className="h-5 w-5 md:h-6 md:w-6" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-black text-white text-sm md:text-lg tracking-tight mb-1 truncate">{t.description}</p>
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{GMT6_FORMATTER.format(new Date(t.created_at))}</p>
                      </div>
                   </div>
                   <p className={`text-base md:text-2xl font-black tracking-tighter tabular-nums ${t.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'deposit' ? '+' : '-'}${t.amount.toLocaleString()}
                   </p>
                </div>
              ))}
            </div>
            <div className="p-6 md:p-10 border-t border-white/10 bg-white/[0.02] flex justify-between items-center">
               <div>
                 <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Balance</span>
                 <p className={`text-xl md:text-3xl font-black tracking-tighter tabular-nums ${selectedProfileForHistory.balance < 0 ? 'text-red-500' : 'text-emerald-400'}`}>${selectedProfileForHistory.balance.toLocaleString()}</p>
               </div>
               <button onClick={() => setIsHistoryModalOpen(false)} className="px-10 py-4 md:py-5 rounded-2xl bg-blue-600 text-white font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] active:scale-95">CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* Member Pool Modal */}
      {isMemberPoolModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh]">
            <div className="p-6 md:p-10 border-b border-white/10 flex items-center justify-between bg-purple-600/[0.02]">
               <div className="flex items-center gap-4 md:gap-5">
                 <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-purple-600/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-xl shadow-purple-500/10">
                   <Users className="h-5 w-5 md:h-7 md:w-7" />
                 </div>
                 <div>
                   <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none mb-1">Member Pool</h3>
                   <p className="text-[8px] md:text-[10px] text-slate-500 font-black tracking-[0.4em] uppercase">{employeeCount} Active</p>
                 </div>
               </div>
               <button onClick={() => setIsMemberPoolModalOpen(false)} className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 hover:bg-purple-600 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-90"><X className="h-6 w-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4">
              {allEmployees.map(p => (
                <div key={p.id} className="glass-card p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-between group">
                  <div className="flex items-center gap-4 md:gap-6">
                    <img src={p.profilePic} className="h-10 w-10 md:h-12 md:w-12 rounded-2xl border border-white/10 bg-slate-800 shrink-0" />
                    <div>
                      <p className="text-sm md:text-base font-black text-white tracking-tight leading-none mb-1 truncate max-w-[120px] md:max-w-none">{p.full_name}</p>
                      <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">{p.id}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg md:text-xl font-black tracking-tighter tabular-nums ${p.balance < 0 ? 'text-red-500' : 'text-slate-100'}`}>${p.balance.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 md:p-8 border-t border-white/10 bg-white/[0.01] text-center">
              <button onClick={() => setIsMemberPoolModalOpen(false)} className="w-full sm:w-auto px-10 py-4 md:py-5 rounded-2xl bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest active:scale-95">CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; onClick?: () => void }> = ({ label, value, icon, onClick }) => (
  <div 
    onClick={onClick}
    className={`glass-panel p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border-white/[0.05] bg-white/[0.01] flex flex-col justify-between transition-all duration-500 shadow-xl group ${onClick ? 'cursor-pointer hover:translate-y-[-8px] hover:shadow-2xl hover:border-white/10' : ''}`}
  >
    <div className="flex items-center justify-between mb-6 md:mb-10">
      <div className="h-12 w-12 md:h-16 md:w-16 rounded-[1rem] md:rounded-[1.5rem] bg-white/[0.03] border border-white/[0.08] flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-inner shrink-0">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
          className: `${(icon.props as any).className || ''} h-6 w-6 md:h-8 md:w-8`.trim() 
        }) : icon}
      </div>
      {onClick && <Info className="h-4 w-4 md:h-5 md:w-5 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
    <div>
      <p className="text-[8px] md:text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] mb-2 md:mb-4">{label}</p>
      <h4 className="text-2xl md:text-4xl font-black text-white tracking-tighter leading-none truncate">{value}</h4>
    </div>
  </div>
);

export default App;
