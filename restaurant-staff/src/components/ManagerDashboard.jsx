import React, { useState, useEffect } from 'react';
import {
  getSyncStatus,
  forceSync,
  verifyLocation,
  getBillingHistory,
  getDevicePasscodeApi,
  updateDevicePasscodeApi,
  getCrewMembersApi,
  createCrewMemberApi,
  updateCrewSalaryApi,
  payCrewSalaryApi,
  updateCrewStatusApi,
  deleteCrewMemberApi,
} from '../api/staffApi';
import { useStaffAuth } from '../context/StaffAuthContext';

const DEFAULT_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const DEFAULT_ROLE_SALARIES = {
  chef: 45000,
  cashier: 30000,
  waiter: 22000,
  carrier: 18000,
};

export const ManagerDashboard = ({ orders = [], waiterCalls = [], onSelectTable, onSwitchRole }) => {
  const { staffUser } = useStaffAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview, crew, payroll, settings
  const [syncData, setSyncData] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [bills, setBills] = useState([]);
  const [geofenceStatus, setGeofenceStatus] = useState(null);

  // Master Device Passcode state
  const [devicePasscode, setDevicePasscode] = useState('1234');
  const [newPasscodeInput, setNewPasscodeInput] = useState('');
  const [isUpdatingPasscode, setIsUpdatingPasscode] = useState(false);
  const [passcodeNotice, setPasscodeNotice] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);

  // 👨‍💼 Crew Recruitment & Roster state
  const [crewMembers, setCrewMembers] = useState([]);
  const [loadingCrew, setLoadingCrew] = useState(false);
  const [crewRoleFilter, setCrewRoleFilter] = useState('all');
  const [recruitingRole, setRecruitingRole] = useState('chef');
  const [recruitName, setRecruitName] = useState('');
  const [recruitEmail, setRecruitEmail] = useState('');
  const [recruitSalary, setRecruitSalary] = useState('45000');
  const [recruitPhone, setRecruitPhone] = useState('9800000000');
  const [recruitPasscode, setRecruitPasscode] = useState('1234');
  const [recruiting, setRecruiting] = useState(false);
  const [crewFeedback, setCrewFeedback] = useState({ type: '', message: '' });

  // Salary Edit Modal state
  const [editingCrew, setEditingCrew] = useState(null);
  const [editCrewSalaryAmount, setEditCrewSalaryAmount] = useState('');
  const [isUpdatingSalary, setIsUpdatingSalary] = useState(false);

  // Salary Disbursement Modal state
  const [payingCrew, setPayingCrew] = useState(null);
  const [payMonth, setPayMonth] = useState(
    new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
  );
  const [payNotes, setPayNotes] = useState('Monthly Crew Compensation Disbursed');
  const [isDisbursing, setIsDisbursing] = useState(false);

  // Payslip Viewer Modal state
  const [viewingSlip, setViewingSlip] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchCrewMembers();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Update default salary when changing role in recruitment form
  useEffect(() => {
    setRecruitSalary(String(DEFAULT_ROLE_SALARIES[recruitingRole] || 25000));
  }, [recruitingRole]);

  const fetchDashboardData = async () => {
    try {
      const [sRes, bRes, gRes, pRes] = await Promise.all([
        getSyncStatus().catch(() => null),
        getBillingHistory().catch(() => null),
        verifyLocation({ bypassDemo: true }).catch(() => null),
        getDevicePasscodeApi().catch(() => null),
      ]);

      if (sRes?.success) setSyncData(sRes);
      if (bRes?.success) setBills(bRes.bills || []);
      if (gRes?.success) setGeofenceStatus(gRes);
      if (pRes?.success && pRes.passcode) setDevicePasscode(pRes.passcode);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCrewMembers = async () => {
    try {
      setLoadingCrew(true);
      const res = await getCrewMembersApi();
      if (res.success) {
        setCrewMembers(res.crew || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCrew(false);
    }
  };

  const handleForceSync = async () => {
    try {
      setSyncing(true);
      await forceSync();
      await fetchDashboardData();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateMasterPasscode = async (e) => {
    if (e) e.preventDefault();
    if (!newPasscodeInput.trim()) return;

    try {
      setIsUpdatingPasscode(true);
      const res = await updateDevicePasscodeApi(
        newPasscodeInput.trim(),
        staffUser?.email || 'manager@chronicle.com'
      );
      if (res.success) {
        setDevicePasscode(newPasscodeInput.trim());
        setNewPasscodeInput('');
        setPasscodeNotice(
          `✓ Master Device Passcode updated to [${newPasscodeInput.trim()}]. All client devices updated!`
        );
        setTimeout(() => setPasscodeNotice(''), 5000);
      }
    } catch (err) {
      console.error(err);
      setPasscodeNotice('❌ Failed to update device passcode');
    } finally {
      setIsUpdatingPasscode(false);
    }
  };

  const handleRecruitCrewMember = async (e) => {
    e.preventDefault();
    setCrewFeedback({ type: '', message: '' });

    if (!recruitName.trim() || !recruitEmail.trim()) {
      setCrewFeedback({ type: 'error', message: 'Staff name and official telegraph email are required.' });
      return;
    }

    try {
      setRecruiting(true);
      const res = await createCrewMemberApi({
        name: recruitName.trim(),
        email: recruitEmail.trim(),
        role: recruitingRole,
        salary: Number(recruitSalary) || DEFAULT_ROLE_SALARIES[recruitingRole] || 25000,
        phone: recruitPhone.trim(),
        passcode: recruitPasscode.trim() || '1234',
        managerEmail: staffUser?.email || 'manager@chronicle.com',
        managerName: staffUser?.name || 'General Manager Vikram',
      });

      if (res.success) {
        setCrewFeedback({
          type: 'success',
          message: `👨‍💼 Recruitment Confirmed! ${res.staff.name} appointed as [${res.staff.role.toUpperCase()}] with Monthly Salary ₹${Number(res.staff.salary).toLocaleString('en-IN')}.`,
        });
        setRecruitName('');
        setRecruitEmail('');
        setRecruitPhone('9800000000');
        setRecruitPasscode('1234');
        setRecruitSalary(String(DEFAULT_ROLE_SALARIES[recruitingRole] || 25000));
        await fetchCrewMembers();
      } else {
        setCrewFeedback({ type: 'error', message: res.message || 'Failed to recruit staff.' });
      }
    } catch (err) {
      setCrewFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error recruiting crew member.',
      });
    } finally {
      setRecruiting(false);
    }
  };

  const handleUpdateCrewSalary = async (e) => {
    e.preventDefault();
    if (!editingCrew || !editCrewSalaryAmount) return;

    try {
      setIsUpdatingSalary(true);
      const res = await updateCrewSalaryApi(editingCrew.staffId, Number(editCrewSalaryAmount));
      if (res.success) {
        setCrewFeedback({
          type: 'success',
          message: `✓ Monthly salary for ${editingCrew.name} (${editingCrew.role.toUpperCase()}) updated to ₹${Number(editCrewSalaryAmount).toLocaleString('en-IN')}/mo.`,
        });
        setEditingCrew(null);
        await fetchCrewMembers();
      }
    } catch (err) {
      setCrewFeedback({ type: 'error', message: 'Failed to update crew salary.' });
    } finally {
      setIsUpdatingSalary(false);
    }
  };

  const handleDisburseCrewSalary = async (e) => {
    e.preventDefault();
    if (!payingCrew) return;

    try {
      setIsDisbursing(true);
      const res = await payCrewSalaryApi(payingCrew.staffId, {
        month: payMonth,
        notes: payNotes,
        paidBy: staffUser?.name || 'General Manager Vikram',
      });

      if (res.success) {
        setCrewFeedback({
          type: 'success',
          message: `💰 Salary of ₹${Number(payingCrew.salary || 25000).toLocaleString('en-IN')} disbursed to ${payingCrew.name} (${payingCrew.role.toUpperCase()}) for ${payMonth}! (Txn Ref: ${res.payment?.transactionRef})`,
        });
        setPayingCrew(null);
        await fetchCrewMembers();
      }
    } catch (err) {
      setCrewFeedback({ type: 'error', message: 'Failed to disburse salary.' });
    } finally {
      setIsDisbursing(false);
    }
  };

  const handleToggleCrewStatus = async (crew) => {
    try {
      const res = await updateCrewStatusApi(crew.staffId, !crew.isActive);
      if (res.success) {
        setCrewFeedback({
          type: 'success',
          message: `${crew.name} status changed to ${!crew.isActive ? 'Active' : 'On Leave'}.`,
        });
        await fetchCrewMembers();
      }
    } catch (err) {
      setCrewFeedback({ type: 'error', message: 'Failed to update crew status.' });
    }
  };

  const handleOffboardCrew = async (crew) => {
    if (
      !window.confirm(
        `Are you sure you want to offboard ${crew.name} (${crew.role.toUpperCase()}) from the restaurant crew?`
      )
    ) {
      return;
    }

    try {
      const res = await deleteCrewMemberApi(crew.staffId);
      if (res.success) {
        setCrewFeedback({
          type: 'success',
          message: `Staff member ${crew.name} (${crew.role.toUpperCase()}) has been offboarded.`,
        });
        await fetchCrewMembers();
      }
    } catch (err) {
      setCrewFeedback({ type: 'error', message: 'Failed to offboard crew member.' });
    }
  };

  // Calculations
  const activeOrders = orders.filter((o) => o.paymentStatus !== 'PAID');
  const cookingOrders = orders.filter((o) => o.status === 'In Preparation');
  const readyOrders = orders.filter((o) => o.status === 'Ready to Serve');
  const pendingCalls = waiterCalls.filter((c) => c.status === 'PENDING');

  const totalRevenue = bills.reduce((sum, b) => sum + (Number(b.finalPaid) || 0), 0);
  const totalCashbackGiven = bills.reduce((sum, b) => sum + (Number(b.cashbackEarned) || 0), 0);

  // Payroll Metrics
  const totalMonthlyCrewWage = crewMembers.reduce((sum, c) => sum + (Number(c.salary) || 0), 0);
  const paidCrewCount = crewMembers.filter((c) => c.salaryStatus === 'PAID').length;
  const pendingCrewCount = crewMembers.length - paidCrewCount;

  // Flatten all crew transactions for ledger
  const allCrewPayments = crewMembers
    .flatMap((c) =>
      (c.salaryHistory || []).map((h) => ({
        ...h,
        staffName: c.name,
        staffRole: c.role,
        staffEmail: c.email,
        staffAvatar: c.avatar,
        staffId: c.staffId,
        department: c.department,
      }))
    )
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));

  // Filtered Crew Members
  const filteredCrew = crewMembers.filter((c) => {
    if (crewRoleFilter === 'all') return true;
    return c.role === crewRoleFilter;
  });

  // Derive Table Status
  const getTableStatus = (tableNo) => {
    const tableOrders = activeOrders.filter((o) => o.tableNo === String(tableNo));
    const tableCall = pendingCalls.find((c) => c.tableNo === String(tableNo));

    if (tableCall) {
      return {
        label: `🛎️ Bell (${tableCall.requestLabel})`,
        color: 'bg-red-600 text-white animate-pulse',
        active: true,
      };
    }
    if (tableOrders.length > 0) {
      const hasReady = tableOrders.some((o) => o.status === 'Ready to Serve');
      const hasCooking = tableOrders.some((o) => o.status === 'In Preparation');
      if (hasReady) {
        return { label: '🍲 Food Ready', color: 'bg-green-600 text-white', active: true };
      }
      if (hasCooking) {
        return { label: '👨‍🍳 Cooking', color: 'bg-amber-600 text-white', active: true };
      }
      return { label: '⏳ Order Placed', color: 'bg-blue-700 text-white', active: true };
    }
    return { label: 'Available', color: 'bg-[#ded4be] text-[#554e45]', active: false };
  };

  return (
    <div className="font-editorial">
      <div className="flex flex-col md:flex-row gap-5 items-start w-full">
        {/* Left Sidebar Navigation Panel */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 space-y-4 font-typewriter">
        <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-4 rounded-2xl newspaper-shadow space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#71695f] border-b-2 border-[#1a1612] pb-2 flex items-center justify-between">
              <span>👨‍💼 OPERATIONS MENU</span>
              <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-black">MANAGER</span>
            </div>

            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-2 flex items-center justify-between ${
                  activeTab === 'overview'
                    ? 'bg-[#1a1612] text-amber-300 border-[#1a1612] shadow-md scale-[1.01]'
                    : 'bg-[#eee7d7] text-[#1a1612] hover:bg-[#e4dac5] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <span>Overview & Floor</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-black font-mono font-bold">
                  {new Set(activeOrders.map((o) => o.tableNo)).size}/12
                </span>
              </button>

              <button
                onClick={() => setActiveTab('crew')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-2 flex items-center justify-between ${
                  activeTab === 'crew'
                    ? 'bg-[#1a1612] text-amber-300 border-[#1a1612] shadow-md scale-[1.01]'
                    : 'bg-[#eee7d7] text-[#1a1612] hover:bg-[#e4dac5] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">👨‍🍳</span>
                  <span>Crew Recruitment</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1a1612] text-amber-300 font-mono font-bold">
                  {crewMembers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('payroll')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-2 flex items-center justify-between ${
                  activeTab === 'payroll'
                    ? 'bg-[#1a1612] text-amber-300 border-[#1a1612] shadow-md scale-[1.01]'
                    : 'bg-[#eee7d7] text-[#1a1612] hover:bg-[#e4dac5] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">💰</span>
                  <span>Crew Payroll Desk</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-700 text-white font-mono font-bold">
                  {paidCrewCount}/{crewMembers.length} Paid
                </span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-2 flex items-center justify-between ${
                  activeTab === 'settings'
                    ? 'bg-[#1a1612] text-amber-300 border-[#1a1612] shadow-md scale-[1.01]'
                    : 'bg-[#eee7d7] text-[#1a1612] hover:bg-[#e4dac5] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🔒</span>
                  <span>Security & Sync</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono">PIN</span>
              </button>
            </nav>
          </div>

          {/* Quick Station Jump Shortcuts */}
          <div className="bg-[#eee7d7] border-2 border-[#1a1612] p-4 rounded-2xl space-y-2.5">
            <div className="text-[10px] font-bold uppercase text-[#554e45]">
              ★ QUICK STATION SWITCH
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => onSwitchRole && onSwitchRole('chef')}
                className="bg-[#fffdf9] hover:bg-amber-100 border border-[#1a1612] p-2 rounded-lg text-left flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>👨‍🍳</span>
                <span>Chef KDS</span>
              </button>
              <button
                onClick={() => onSwitchRole && onSwitchRole('cashier')}
                className="bg-[#fffdf9] hover:bg-amber-100 border border-[#1a1612] p-2 rounded-lg text-left flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>🧾</span>
                <span>Cashier POS</span>
              </button>
              <button
                onClick={() => onSwitchRole && onSwitchRole('waiter')}
                className="bg-[#fffdf9] hover:bg-amber-100 border border-[#1a1612] p-2 rounded-lg text-left flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>🛎️</span>
                <span>Waiter Bell</span>
              </button>
              <button
                onClick={() => onSwitchRole && onSwitchRole('carrier')}
                className="bg-[#fffdf9] hover:bg-amber-100 border border-[#1a1612] p-2 rounded-lg text-left flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>📦</span>
                <span>Runner Desk</span>
              </button>
            </div>
          </div>

          {/* Manager Operations Status Card */}
          <div className="bg-[#1a1612] text-[#f7f3eb] border-3 border-amber-400 p-4 rounded-2xl newspaper-shadow text-xs space-y-2">
            <div className="text-[10px] text-amber-400 font-bold uppercase">
              ★ BRIGADE TELEMETRY
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Total Crew:</span>
              <span className="text-white font-bold">{crewMembers.length} Staff</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Crew Payroll:</span>
              <span className="text-emerald-400 font-bold">₹{totalMonthlyCrewWage.toLocaleString('en-IN')}/mo</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Active KDS Tickets:</span>
              <span className="text-amber-300 font-bold">{activeOrders.length}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Calling Bells:</span>
              <span className="text-red-400 font-bold">{pendingCalls.length}</span>
            </div>
          </div>
        </aside>

        {/* Right Main Content Workspace */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* General Manager Header & Compensation Seal */}
          <div className="bg-[#1a1612] text-[#f7f3eb] border-4 border-amber-400 p-5 rounded-2xl shadow-2xl newspaper-shadow flex flex-col md:flex-row items-center justify-between gap-5 font-typewriter">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-amber-400 text-black text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider shadow">
                  ★ GENERAL MANAGER OPERATIONS & PAYROLL COMMAND ★
                </span>
                <span className="text-[10px] bg-amber-900 text-amber-200 px-2 py-0.5 rounded">
                  APPOINTED BY: {staffUser?.hiredByName || 'Lord Arthur Sterling (Root)'}
                </span>
              </div>
              <h1 className="font-headline text-2xl sm:text-3xl font-black uppercase tracking-wide text-amber-300">
                General Manager Operations & Payroll Desk
              </h1>
              <p className="text-xs text-amber-100/80 mt-1 max-w-2xl leading-relaxed">
                Hires and commands the kitchen brigade, fiscal cashier counter, floor waiters & carriers. Manages monthly crew payroll, 5-minute database sync engine, and master device locking passcodes.
              </p>
            </div>

            {/* Manager's Own Salary & Compensation Badge */}
            <div className="bg-[#2c2620] border-2 border-amber-400/80 p-3.5 rounded-xl text-xs text-amber-100 min-w-[240px] flex flex-col justify-between shrink-0">
              <div>
                <div className="text-[10px] text-amber-400 uppercase font-bold mb-1">
                  Your Executive Compensation:
                </div>
                <div className="font-bold text-base text-white flex items-center justify-between">
                  <span>₹{Number(staffUser?.salary || 75000).toLocaleString('en-IN')}/mo</span>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                      staffUser?.salaryStatus === 'PAID'
                        ? 'bg-emerald-400 text-black'
                        : 'bg-amber-400 text-black'
                    }`}
                  >
                    {staffUser?.salaryStatus === 'PAID' ? '● SALARY PAID' : '○ SALARY PENDING'}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-zinc-400 mt-2 pt-2 border-t border-zinc-700">
                Disbursed by Root Authority Desk
              </div>
            </div>
          </div>

          {/* TAB 1: OPERATIONS OVERVIEW & TABLES */}
          {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Banner KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Active Tables */}
            <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-4 newspaper-shadow relative">
              <div className="text-[10px] font-typewriter font-bold uppercase tracking-wider text-[#554e45]">
                ★ FLOOR OCCUPANCY
              </div>
              <div className="text-3xl font-headline font-black text-[#1a1612] mt-1">
                {new Set(activeOrders.map((o) => o.tableNo)).size} / 12
              </div>
              <div className="text-xs font-typewriter text-[#776e65] mt-1 flex items-center justify-between">
                <span>Dining Tables Occupied</span>
                <span className="text-emerald-700 font-bold">● Active</span>
              </div>
            </div>

            {/* KPI 2: Kitchen KDS Pipeline */}
            <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-4 newspaper-shadow relative">
              <div className="text-[10px] font-typewriter font-bold uppercase tracking-wider text-[#554e45]">
                ★ KITCHEN PIPELINE (KDS)
              </div>
              <div className="text-3xl font-headline font-black text-[#1a1612] mt-1 flex items-center gap-2">
                <span>{activeOrders.length}</span>
                <span className="text-xs font-typewriter font-normal text-[#554e45]">
                  ({cookingOrders.length} Cooking, {readyOrders.length} Ready)
                </span>
              </div>
              <div className="text-xs font-typewriter text-[#776e65] mt-1 flex items-center justify-between">
                <span>Active Brigade Tickets</span>
                <button
                  onClick={() => onSwitchRole('chef')}
                  className="text-amber-900 font-bold underline cursor-pointer"
                >
                  Open KDS ➔
                </button>
              </div>
            </div>

            {/* KPI 3: Revenue & 10% Cashbacks */}
            <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-4 newspaper-shadow relative">
              <div className="text-[10px] font-typewriter font-bold uppercase tracking-wider text-[#554e45]">
                ★ REVENUE & 10% LOYALTY
              </div>
              <div className="text-3xl font-headline font-black text-[#1a1612] mt-1">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </div>
              <div className="text-xs font-typewriter text-[#776e65] mt-1 flex items-center justify-between">
                <span>Cashback Issued: ₹{totalCashbackGiven}</span>
                <button
                  onClick={() => onSwitchRole('cashier')}
                  className="text-amber-900 font-bold underline cursor-pointer"
                >
                  Billing Counter ➔
                </button>
              </div>
            </div>

            {/* KPI 4: Waiter Requests */}
            <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-4 newspaper-shadow relative">
              <div className="text-[10px] font-typewriter font-bold uppercase tracking-wider text-[#554e45]">
                ★ SERVICE BELL ALERTS
              </div>
              <div className="text-3xl font-headline font-black text-[#1a1612] mt-1 flex items-center gap-2">
                <span className={pendingCalls.length > 0 ? 'text-red-700 animate-pulse' : 'text-[#1a1612]'}>
                  {pendingCalls.length}
                </span>
                <span className="text-xs font-typewriter font-normal text-[#554e45]">
                  Unattended Calls
                </span>
              </div>
              <div className="text-xs font-typewriter text-[#776e65] mt-1 flex items-center justify-between">
                <span>Total Calls Today: {waiterCalls.length}</span>
                <button
                  onClick={() => onSwitchRole('waiter')}
                  className="text-red-900 font-bold underline cursor-pointer"
                >
                  Floor Dispatch ➔
                </button>
              </div>
            </div>
          </div>

          {/* Table Occupancy Matrix (Tables 1 - 12) */}
          <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-5 sm:p-6 newspaper-shadow">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-[#1a1612] pb-3 mb-4">
              <div>
                <h2 className="font-headline text-xl sm:text-2xl font-black uppercase text-[#1a1612]">
                  Live Dining Tables Matrix (1 - 12)
                </h2>
                <p className="font-typewriter text-xs text-[#554e45]">
                  Click any table to open Cashier Billing Machine or view orders
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-typewriter font-bold">
                <span className="bg-[#ded4be] px-2 py-0.5 rounded text-[#554e45]">Available</span>
                <span className="bg-blue-700 px-2 py-0.5 rounded text-white">Order Placed</span>
                <span className="bg-amber-600 px-2 py-0.5 rounded text-white">Cooking</span>
                <span className="bg-green-600 px-2 py-0.5 rounded text-white">Food Ready</span>
                <span className="bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">Bell Ringing</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {DEFAULT_TABLES.map((tNo) => {
                const status = getTableStatus(tNo);
                const tableOrders = activeOrders.filter((o) => o.tableNo === String(tNo));
                const tableTotal = tableOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

                return (
                  <div
                    key={tNo}
                    onClick={() => {
                      if (onSelectTable) onSelectTable(String(tNo));
                      onSwitchRole('cashier');
                    }}
                    className={`p-3 rounded-lg border-2 border-[#1a1612] transition cursor-pointer hover:shadow-lg flex flex-col justify-between min-h-[105px] ${
                      status.active ? 'bg-[#fffcf5] border-[#1a1612]' : 'bg-[#eee7d7]/60 hover:bg-[#eee7d7]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-headline text-base font-black text-[#1a1612]">
                        Table #{tNo}
                      </span>
                      {status.active && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      )}
                    </div>

                    <div className="my-1.5">
                      <span
                        className={`inline-block text-[9px] font-typewriter font-bold px-2 py-0.5 rounded ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="font-typewriter text-[10px] text-[#554e45] flex items-center justify-between pt-1 border-t border-[#d1c7b7]">
                      <span>{tableOrders.length > 0 ? `${tableOrders.length} ticket(s)` : 'Empty'}</span>
                      {tableTotal > 0 && <span className="font-bold text-[#1a1612]">₹{tableTotal}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREW RECRUITMENT & ROSTER */}
      {activeTab === 'crew' && (
        <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-6 newspaper-shadow animate-fadeIn">
          <div className="border-b-2 border-[#1a1612] pb-3 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-typewriter font-bold uppercase tracking-wider bg-[#1a1612] text-amber-300 px-2 py-0.5 rounded">
                  ★ GENERAL MANAGER RECRUITMENT DESK ★
                </span>
                <span className="text-[10px] font-typewriter font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded border border-amber-400">
                  HIRED BY: {staffUser?.hiredByName || 'Lord Arthur Sterling (Root)'}
                </span>
              </div>
              <h2 className="font-headline text-2xl font-black uppercase text-[#1a1612] mt-1">
                Crew Recruitment & Brigade Roster
              </h2>
            </div>
            <span className="font-typewriter text-xs text-[#71695f]">
              Manager hires Chefs, Cashiers, Waiters & Carriers with defined salary
            </span>
          </div>

          {/* Crew Feedback Notice */}
          {crewFeedback.message && (
            <div
              className={`mb-5 p-3.5 rounded-xl border-2 font-typewriter text-xs font-bold transition-all ${
                crewFeedback.type === 'success'
                  ? 'bg-emerald-100 border-emerald-900 text-emerald-950'
                  : 'bg-red-100 border-red-900 text-red-950'
              }`}
            >
              {crewFeedback.message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Recruitment Form (5 cols) */}
            <div className="lg:col-span-5 bg-[#eee7d7] p-5 rounded-2xl border-2 border-[#1a1612]">
              <div className="border-b border-[#c4b9a3] pb-2.5 mb-4">
                <span className="text-[9px] font-typewriter font-black bg-[#1a1612] text-amber-300 px-2 py-0.5 rounded uppercase">
                  NEW HIRE ENLISTMENT
                </span>
                <h3 className="font-headline text-lg font-black uppercase text-[#1a1612] mt-1">
                  Recruit Restaurant Crew Member
                </h3>
              </div>

              <form onSubmit={handleRecruitCrewMember} className="space-y-3.5 font-typewriter text-xs">
                <div>
                  <label className="font-bold uppercase text-[#1a1612] block mb-1">
                    Select Staff Role to Recruit:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'chef', label: '👨‍🍳 Chef', dept: 'Kitchen Brigade (₹45k)' },
                      { id: 'cashier', label: '🧾 Cashier', dept: 'Billing Counter (₹30k)' },
                      { id: 'waiter', label: '🛎️ Waiter', dept: 'Floor Service (₹22k)' },
                      { id: 'carrier', label: '📦 Carrier', dept: 'Food Runner (₹18k)' },
                    ].map((r) => (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setRecruitingRole(r.id)}
                        className={`p-2 rounded-lg border-2 text-left cursor-pointer transition ${
                          recruitingRole === r.id
                            ? 'bg-[#1a1612] text-amber-300 border-[#1a1612] font-bold shadow'
                            : 'bg-white text-[#1a1612] hover:bg-zinc-100 border-gray-400'
                        }`}
                      >
                        <div className="text-xs font-black">{r.label}</div>
                        <div className="text-[9px] opacity-75">{r.dept}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold uppercase text-[#1a1612] block mb-1">
                    Staff Member Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={recruitName}
                    onChange={(e) => setRecruitName(e.target.value)}
                    placeholder="e.g. Executive Chef Mario"
                    className="w-full bg-white border-2 border-[#1a1612] px-3 py-2 text-xs font-bold text-[#1a1612] placeholder-[#8a7c6a] focus:outline-none rounded"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-[#1a1612] block mb-1">
                    Staff Email (Login ID):
                  </label>
                  <input
                    type="email"
                    required
                    value={recruitEmail}
                    onChange={(e) => setRecruitEmail(e.target.value)}
                    placeholder={`e.g. ${recruitingRole}@chronicle.com`}
                    className="w-full bg-white border-2 border-[#1a1612] px-3 py-2 text-xs font-bold text-[#1a1612] placeholder-[#8a7c6a] focus:outline-none rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold uppercase text-[#1a1612] block mb-1">
                      Monthly Salary (₹):
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="500"
                      value={recruitSalary}
                      onChange={(e) => setRecruitSalary(e.target.value)}
                      placeholder="25000"
                      className="w-full bg-white border-2 border-[#1a1612] px-3 py-2 text-xs font-black text-emerald-900 focus:outline-none rounded"
                    />
                  </div>

                  <div>
                    <label className="font-bold uppercase text-[#1a1612] block mb-1">
                      Passcode (Default: 1234):
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      value={recruitPasscode}
                      onChange={(e) => setRecruitPasscode(e.target.value)}
                      placeholder="1234"
                      className="w-full bg-white border-2 border-[#1a1612] px-3 py-2 text-xs font-bold text-[#1a1612] focus:outline-none rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold uppercase text-[#1a1612] block mb-1">
                    Phone:
                  </label>
                  <input
                    type="text"
                    value={recruitPhone}
                    onChange={(e) => setRecruitPhone(e.target.value)}
                    placeholder="9800000000"
                    className="w-full bg-white border-2 border-[#1a1612] px-3 py-2 text-xs font-semibold text-[#1a1612] focus:outline-none rounded"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={recruiting}
                    className="w-full bg-[#1a1612] hover:bg-[#332c25] active:scale-98 text-amber-300 font-typewriter font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider border-2 border-amber-400 newspaper-shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {recruiting ? (
                      <span>RECRUITING CREW MEMBER...</span>
                    ) : (
                      <>
                        <span>🤝 RECRUIT {recruitingRole.toUpperCase()} (₹{Number(recruitSalary || 0).toLocaleString('en-IN')}/mo)</span>
                        <span>➔</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Active Crew Roster (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                {/* Role filter buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#1a1612]">
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                      { id: 'all', label: 'All Crew' },
                      { id: 'chef', label: '👨‍🍳 Chefs' },
                      { id: 'cashier', label: '🧾 Cashiers' },
                      { id: 'waiter', label: '🛎️ Waiters' },
                      { id: 'carrier', label: '📦 Carriers' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setCrewRoleFilter(tab.id)}
                        className={`text-[11px] font-typewriter font-bold px-2.5 py-1 rounded transition cursor-pointer ${
                          crewRoleFilter === tab.id
                            ? 'bg-[#1a1612] text-amber-300 shadow'
                            : 'bg-[#eee7d7] text-[#1a1612] hover:bg-[#e2d7c1]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <span className="font-typewriter text-[11px] font-bold text-[#554e45]">
                    {filteredCrew.length} Member{filteredCrew.length > 1 ? 's' : ''}
                  </span>
                </div>

                {loadingCrew ? (
                  <div className="text-center py-8 font-typewriter text-xs text-[#554e45]">
                    Loading Active Crew Roster...
                  </div>
                ) : filteredCrew.length === 0 ? (
                  <div className="text-center py-8 bg-[#eee7d7] rounded-xl border-2 border-dashed border-[#1a1612] p-4 font-typewriter text-xs">
                    <div className="text-3xl mb-1">📋</div>
                    <div className="font-bold">No Staff Found for This Filter</div>
                    <p className="text-[#71695f] mt-1">Use the recruitment form to hire crew members.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 font-typewriter">
                    {filteredCrew.map((crew) => (
                      <div
                        key={crew.staffId}
                        className="p-3.5 bg-[#eee7d7]/80 hover:bg-[#eee7d7] rounded-xl border-2 border-[#1a1612] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl p-1.5 bg-white rounded-lg border border-[#1a1612]">
                            {crew.avatar || '👤'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-headline font-black text-sm text-[#1a1612]">
                                {crew.name}
                              </span>
                              <span className="text-[9px] bg-[#1a1612] text-amber-300 px-1.5 py-0.2 rounded font-black uppercase">
                                {crew.role}
                              </span>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                                  crew.salaryStatus === 'PAID'
                                    ? 'bg-emerald-200 text-emerald-900 border border-emerald-400'
                                    : 'bg-amber-200 text-amber-900 border border-amber-400'
                                }`}
                              >
                                {crew.salaryStatus === 'PAID' ? '● PAID' : '○ PENDING'}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#554e45]">
                              📧 {crew.email} • 📞 {crew.phone || '9800000000'}
                            </div>
                            <div className="text-[10px] text-emerald-900 font-bold">
                              Monthly Salary: ₹{Number(crew.salary || 25000).toLocaleString('en-IN')}/mo
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleToggleCrewStatus(crew)}
                            className={`text-[10px] font-bold px-2 py-1 rounded border cursor-pointer ${
                              crew.isActive
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                : 'bg-zinc-300 text-zinc-700 border-zinc-500'
                            }`}
                          >
                            {crew.isActive ? '● Active' : '○ On Leave'}
                          </button>
                          <button
                            onClick={() => handleOffboardCrew(crew)}
                            title="Offboard crew member"
                            className="text-[10px] bg-red-800 hover:bg-red-700 text-white font-bold px-2 py-1 rounded border border-black cursor-pointer"
                          >
                            ✕ Offboard
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#d1c7b7] font-typewriter text-[11px] text-[#71695f] flex items-center justify-between">
                <span>All recruits can log in with their email & passcode.</span>
                <span className="font-bold text-emerald-800">✓ Real-Time Roster Synced</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CREW PAYROLL & SALARY DESK */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 animate-fadeIn font-typewriter">
          {/* Payroll KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-4 newspaper-shadow">
              <div className="text-[10px] font-bold uppercase text-[#554e45]">★ TOTAL CREW WAGE BILL</div>
              <div className="text-2xl font-headline font-black text-[#1a1612] mt-1">
                ₹{totalMonthlyCrewWage.toLocaleString('en-IN')}/mo
              </div>
              <div className="text-[11px] text-[#71695f] mt-1">{crewMembers.length} Crew Recruits</div>
            </div>

            <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-4 newspaper-shadow">
              <div className="text-[10px] font-bold uppercase text-[#554e45]">★ DISBURSEMENT STATUS</div>
              <div className="text-2xl font-headline font-black text-emerald-800 mt-1 flex items-center gap-2">
                <span>{paidCrewCount} Paid</span>
                {pendingCrewCount > 0 && (
                  <span className="text-amber-800 text-sm font-normal">({pendingCrewCount} Pending)</span>
                )}
              </div>
              <div className="text-[11px] text-[#71695f] mt-1">Current Cycle Disbursed</div>
            </div>

            <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-4 newspaper-shadow">
              <div className="text-[10px] font-bold uppercase text-[#554e45]">★ TOTAL DISBURSEMENTS</div>
              <div className="text-2xl font-headline font-black text-[#1a1612] mt-1">
                {allCrewPayments.length} Vouchers
              </div>
              <div className="text-[11px] text-[#71695f] mt-1">Logged in Ledger</div>
            </div>

            <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-4 newspaper-shadow">
              <div className="text-[10px] font-bold uppercase text-[#554e45]">★ MANAGER DISBURSER</div>
              <div className="text-lg font-headline font-black text-[#1a1612] mt-1 truncate">
                {staffUser?.name || 'General Manager'}
              </div>
              <div className="text-[11px] text-[#71695f] mt-1">Authorized Payroll Officer</div>
            </div>
          </div>

          {/* Crew Salary Disbursement Management Grid */}
          <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-6 newspaper-shadow">
            <div className="border-b-2 border-[#1a1612] pb-3 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="bg-emerald-800 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                  CREW SALARY DISBURSEMENT
                </span>
                <h2 className="font-headline text-2xl font-black uppercase text-[#1a1612] mt-1">
                  Manage & Disburse Crew Salaries
                </h2>
              </div>
              <span className="text-xs text-[#71695f]">
                Disburse monthly compensation to Chefs, Cashiers, Waiters, and Carriers
              </span>
            </div>

            {crewMembers.length === 0 ? (
              <div className="text-center py-8 bg-[#eee7d7] rounded-xl border-2 border-dashed border-[#1a1612] p-4 text-xs">
                <div className="text-3xl mb-1">👨‍🍳</div>
                <div className="font-bold">No Crew Members Recruited Yet</div>
                <p className="text-[#71695f] mt-1">
                  Switch to the "Crew Recruitment & Roster" tab to recruit staff.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {crewMembers.map((crew) => (
                  <div
                    key={crew.staffId}
                    className="p-4 bg-[#eee7d7]/80 hover:bg-[#eee7d7] rounded-xl border-2 border-[#1a1612] newspaper-shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl p-1.5 bg-white rounded-lg border border-[#1a1612]">
                        {crew.avatar || '👤'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-headline font-black text-base text-[#1a1612]">
                            {crew.name}
                          </span>
                          <span className="text-[9px] bg-[#1a1612] text-amber-300 px-1.5 py-0.2 rounded font-black uppercase">
                            {crew.role}
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                              crew.salaryStatus === 'PAID'
                                ? 'bg-emerald-200 text-emerald-900 border border-emerald-400'
                                : 'bg-amber-200 text-amber-900 border border-amber-400'
                            }`}
                          >
                            {crew.salaryStatus === 'PAID' ? '● SALARY PAID' : '○ SALARY PENDING'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#554e45] mt-0.5">
                          📧 {crew.email} • ID: <code>{crew.staffId}</code>
                        </div>
                        <div className="text-[10px] text-[#71695f] mt-0.5">
                          Jurisdiction: {crew.department}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between gap-2">
                      <div className="text-right">
                        <div className="text-[10px] text-[#71695f] uppercase font-bold">Monthly Salary:</div>
                        <div className="font-headline font-black text-lg text-emerald-900">
                          ₹{Number(crew.salary || 25000).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setPayingCrew(crew);
                            setPayMonth(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
                          }}
                          className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg border border-black cursor-pointer transition shadow-sm"
                        >
                          💰 Pay Salary
                        </button>
                        <button
                          onClick={() => {
                            setEditingCrew(crew);
                            setEditCrewSalaryAmount(String(crew.salary || 25000));
                          }}
                          className="bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-amber-400 cursor-pointer transition"
                        >
                          ✏️ Edit
                        </button>
                        {crew.salaryHistory && crew.salaryHistory.length > 0 && (
                          <button
                            onClick={() =>
                              setViewingSlip({
                                ...crew.salaryHistory[0],
                                staffName: crew.name,
                                staffRole: crew.role,
                                staffEmail: crew.email,
                              })
                            }
                            className="bg-white hover:bg-amber-50 text-[#1a1612] font-bold text-xs px-2 py-1.5 rounded-lg border border-[#1a1612] cursor-pointer"
                          >
                            📑 Slip
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 📑 Crew Payroll Ledger */}
          <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-6 newspaper-shadow">
            <div className="border-b-2 border-[#1a1612] pb-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="bg-[#1a1612] text-amber-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                  ★ CREW DISBURSEMENT ARCHIVE ★
                </span>
                <h2 className="font-headline text-2xl font-black uppercase text-[#1a1612] mt-1">
                  Crew Salary Disbursement Ledger
                </h2>
              </div>
              <span className="text-xs text-[#71695f]">
                {allCrewPayments.length} Total Vouchers Disbursed
              </span>
            </div>

            {allCrewPayments.length === 0 ? (
              <div className="text-center py-8 bg-[#eee7d7] rounded-xl border-2 border-dashed border-[#1a1612] text-xs">
                <div className="text-3xl mb-1">📜</div>
                <div className="font-bold">No Crew Salary Disbursements Logged Yet</div>
                <p className="text-[#71695f] mt-0.5">
                  Click "Pay Salary" on any staff card above to disburse monthly wages.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1a1612] text-amber-300 uppercase text-[10px] border-b-2 border-black">
                      <th className="p-3">Txn Reference</th>
                      <th className="p-3">Staff Name</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Payroll Month</th>
                      <th className="p-3">Amount Disbursed</th>
                      <th className="p-3">Disbursed At</th>
                      <th className="p-3 text-right">Payslip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d1c7b7]">
                    {allCrewPayments.map((p, idx) => (
                      <tr key={idx} className="hover:bg-[#f0e8d8] transition">
                        <td className="p-3 font-mono font-bold text-amber-900">{p.transactionRef}</td>
                        <td className="p-3 font-bold text-[#1a1612]">
                          {p.staffAvatar} {p.staffName}
                        </td>
                        <td className="p-3 uppercase font-semibold text-[10px]">
                          <span className="bg-[#1a1612] text-amber-300 px-1.5 py-0.5 rounded">
                            {p.staffRole}
                          </span>
                        </td>
                        <td className="p-3 font-semibold">{p.month}</td>
                        <td className="p-3 font-black text-emerald-900 text-sm">
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-[#554e45]">
                          {new Date(p.paidAt).toLocaleDateString()} {new Date(p.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setViewingSlip(p)}
                            className="bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-bold text-[11px] px-2.5 py-1 rounded border border-amber-400 cursor-pointer"
                          >
                            View Slip ➔
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & BULK SYNC CONTROLS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Security: Master Device Passcode & Table Locking Manager */}
          <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-5 newspaper-shadow">
            <div className="border-b-2 border-[#1a1612] pb-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-typewriter font-bold uppercase tracking-wider bg-red-900 text-white px-2 py-0.5 rounded">
                  🔒 DEVICE LOCKING SECURITY
                </span>
                <h2 className="font-headline text-xl font-black uppercase text-[#1a1612] mt-1">
                  Client Table Number Master Passcode Control
                </h2>
              </div>
              <span className="font-typewriter text-xs text-[#71695f]">
                Uniform PIN across all customer tablets & phones
              </span>
            </div>

            <p className="font-typewriter text-xs text-[#554e45] leading-relaxed mb-4">
              Customers are <strong>locked</strong> from changing table numbers on client devices.
              When a waiter needs to reassign a device or change a table number, they must enter this <strong>Manager Master Passcode</strong>.
              You can change this password at any time below.
            </p>

            {passcodeNotice && (
              <div className="mb-4 p-3 bg-green-100 border-2 border-green-800 text-green-900 font-typewriter text-xs font-bold rounded">
                {passcodeNotice}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-typewriter text-xs">
              {/* Active Passcode Display */}
              <div className="bg-[#eee7d7] p-4 rounded-xl border-2 border-[#1a1612] flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase text-[#71695f]">
                    Current Active Master Passcode:
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-headline font-black text-3xl tracking-widest text-[#1a1612]">
                      {showPasscode ? devicePasscode : '••••'}
                    </span>
                    <button
                      onClick={() => setShowPasscode((prev) => !prev)}
                      className="bg-[#1a1612] hover:bg-[#332c25] text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer"
                    >
                      {showPasscode ? 'Hide PIN 👁️' : 'Reveal PIN 👁️'}
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-[#71695f] mt-3 pt-2 border-t border-[#d1c7b7]">
                  Share this PIN with floor servers to authorize table number changes.
                </div>
              </div>

              {/* Update Passcode Form */}
              <form onSubmit={handleUpdateMasterPasscode} className="bg-[#eee7d7] p-4 rounded-xl border-2 border-[#1a1612] space-y-3">
                <label className="font-bold uppercase text-[#1a1612] block">
                  Change Master Device Passcode:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength="8"
                    value={newPasscodeInput}
                    onChange={(e) => setNewPasscodeInput(e.target.value)}
                    placeholder="Enter new PIN (e.g. 9999, 2026)"
                    className="flex-1 bg-white border-2 border-[#1a1612] px-3 py-2 text-sm font-bold text-[#1a1612] focus:outline-none focus:border-red-900 rounded"
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingPasscode || !newPasscodeInput.trim()}
                    className="bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-bold px-4 py-2 text-xs uppercase rounded border border-amber-400 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingPasscode ? 'Saving...' : '💾 Save PIN'}
                  </button>
                </div>
                <div className="text-[10px] text-[#71695f]">
                  Changes apply instantly across all client devices.
                </div>
              </form>
            </div>
          </div>

          {/* Middle Grid: 5-Minute Bulk Sync Engine & Geofencing Monitor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: 5-Minute Bulk Sync Engine */}
            <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-5 newspaper-shadow">
              <div className="flex items-center justify-between border-b-2 border-[#1a1612] pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-typewriter font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    ARCHITECTURE PIPELINE
                  </span>
                  <h2 className="font-headline text-lg sm:text-xl font-black uppercase text-[#1a1612] mt-1">
                    5-Minute Bulk Redis ➔ Database Sync Engine
                  </h2>
                </div>
                <button
                  onClick={handleForceSync}
                  disabled={syncing}
                  className="bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-typewriter font-bold text-xs uppercase px-3 py-2 rounded border border-amber-400 newspaper-shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {syncing ? 'Flushing DB...' : '↻ Force Bulk Flush'}
                </button>
              </div>

              <p className="font-typewriter text-xs text-[#554e45] leading-relaxed mb-4">
                Customer carts and active order buffers operate on in-memory <strong>Redis Tier</strong> for real-time speed.
                Every <strong>5 minutes (300 seconds)</strong>, the background bulk worker flushes all dirty carts and settled transactions into the <strong>Persistent Database</strong>.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-typewriter text-xs">
                <div className="bg-[#eee7d7] p-3 rounded border border-[#1a1612]">
                  <div className="text-[10px] text-[#71695f] uppercase">Next Bulk Batch:</div>
                  <div className="text-xl font-bold text-[#1a1612] mt-0.5">
                    {syncData?.sync?.nextSyncInSeconds !== undefined ? `${syncData.sync.nextSyncInSeconds}s` : '300s'}
                  </div>
                </div>

                <div className="bg-[#eee7d7] p-3 rounded border border-[#1a1612]">
                  <div className="text-[10px] text-[#71695f] uppercase">Redis Pending Carts:</div>
                  <div className="text-xl font-bold text-[#1a1612] mt-0.5">
                    {syncData?.sync?.pendingCartsInRedis || 0}
                  </div>
                </div>

                <div className="bg-[#eee7d7] p-3 rounded border border-[#1a1612]">
                  <div className="text-[10px] text-[#71695f] uppercase">Persisted In DB:</div>
                  <div className="text-xl font-bold text-[#1a1612] mt-0.5">
                    {syncData?.services?.database?.persistedOrdersCount || 0} Orders
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#d1c7b7] text-[11px] font-typewriter text-[#71695f] flex items-center justify-between">
                <span>Last Bulk Sync: {syncData?.sync?.lastSyncAt ? new Date(syncData.sync.lastSyncAt).toLocaleTimeString() : 'Active'}</span>
                <span className="text-emerald-700 font-bold">✓ Redis Connected</span>
              </div>
            </div>

            {/* Card 2: In-Restaurant Geofence Radar */}
            <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-5 newspaper-shadow">
              <div className="flex items-center justify-between border-b-2 border-[#1a1612] pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-typewriter font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    SECURITY & GEOFENCING
                  </span>
                  <h2 className="font-headline text-lg sm:text-xl font-black uppercase text-[#1a1612] mt-1">
                    In-Restaurant Dining Zone Verification
                  </h2>
                </div>
                <span className="bg-emerald-700 text-white font-typewriter text-[10px] font-bold px-2.5 py-1 rounded">
                  GEOFENCE ACTIVE
                </span>
              </div>

              <p className="font-typewriter text-xs text-[#554e45] leading-relaxed mb-4">
                System enforces table ordering and waiter calls only within the restaurant perimeter (200m radius of Heritage Dining Hall) or connected table access points.
              </p>

              <div className="bg-[#eee7d7] p-3.5 rounded border border-[#1a1612] space-y-2 font-typewriter text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1a1612]">📍 Restaurant Coordinates:</span>
                  <span>28.6315° N, 77.2167° E (Connaught Place)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1a1612]">📡 Allowed Radius:</span>
                  <span>200 Meters Boundary</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1a1612]">📶 Table Access Point:</span>
                  <span className="text-emerald-800 font-bold">Verified Local Network Dining</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#d1c7b7] text-[11px] font-typewriter text-[#71695f] flex items-center justify-between">
                <span>Status: {geofenceStatus?.message || 'In Dining Zone'}</span>
                <span className="text-emerald-700 font-bold">● Enforcement 100%</span>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>

      {/* Edit Crew Salary Modal */}
      {editingCrew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-typewriter">
          <div className="bg-[#fffdf9] border-4 border-[#1a1612] rounded-2xl p-6 max-w-md w-full newspaper-shadow-lg text-[#1a1612]">
            <div className="border-b-2 border-[#1a1612] pb-3 mb-4 flex items-center justify-between">
              <div>
                <span className="bg-[#1a1612] text-amber-300 text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                  CREW SALARY ADJUSTMENT
                </span>
                <h3 className="font-headline text-xl font-black uppercase text-[#1a1612] mt-0.5">
                  Update Monthly Salary
                </h3>
              </div>
              <button
                onClick={() => setEditingCrew(null)}
                className="text-xs bg-[#eee7d7] border border-[#1a1612] rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-red-800 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#eee7d7] p-3 rounded-lg border border-[#1a1612] mb-4 text-xs">
              <div className="font-bold">
                {editingCrew.avatar} {editingCrew.name} ({editingCrew.role.toUpperCase()})
              </div>
              <div className="text-[11px] text-[#554e45]">📧 {editingCrew.email}</div>
              <div className="text-[11px] text-[#554e45]">
                Current Salary: ₹{Number(editingCrew.salary || 25000).toLocaleString('en-IN')}/mo
              </div>
            </div>

            <form onSubmit={handleUpdateCrewSalary} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  New Monthly Salary (₹):
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="500"
                  value={editCrewSalaryAmount}
                  onChange={(e) => setEditCrewSalaryAmount(e.target.value)}
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3.5 py-2.5 text-base font-black text-emerald-900 rounded focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCrew(null)}
                  className="flex-1 bg-[#eee7d7] hover:bg-[#e4dac5] text-[#1a1612] font-bold py-2.5 px-4 rounded-xl text-xs uppercase border border-[#1a1612] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingSalary}
                  className="flex-1 bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-black py-2.5 px-4 rounded-xl text-xs uppercase border-2 border-amber-400 cursor-pointer shadow disabled:opacity-50"
                >
                  {isUpdatingSalary ? 'Saving...' : '💾 Save Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Crew Salary Modal */}
      {payingCrew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-typewriter">
          <div className="bg-[#fffdf9] border-4 border-[#1a1612] rounded-2xl p-6 max-w-md w-full newspaper-shadow-lg text-[#1a1612]">
            <div className="border-b-2 border-[#1a1612] pb-3 mb-4 flex items-center justify-between">
              <div>
                <span className="bg-emerald-800 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                  CREW PAYROLL DISBURSEMENT
                </span>
                <h3 className="font-headline text-xl font-black uppercase text-[#1a1612] mt-0.5">
                  Disburse Monthly Salary
                </h3>
              </div>
              <button
                onClick={() => setPayingCrew(null)}
                className="text-xs bg-[#eee7d7] border border-[#1a1612] rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-red-800 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#eee7d7] p-3 rounded-lg border border-[#1a1612] mb-4 text-xs space-y-1">
              <div className="font-bold text-sm">
                {payingCrew.avatar} {payingCrew.name} ({payingCrew.role.toUpperCase()})
              </div>
              <div className="text-[11px] text-[#554e45]">Brigade: {payingCrew.department}</div>
              <div className="text-emerald-900 font-black text-base pt-1">
                Disbursement Amount: ₹{Number(payingCrew.salary || 25000).toLocaleString('en-IN')}
              </div>
            </div>

            <form onSubmit={handleDisburseCrewSalary} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  Salary Month / Billing Period:
                </label>
                <input
                  type="text"
                  required
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  placeholder="e.g. September 2026"
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-bold rounded focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  Disbursement Notes / Remark:
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Monthly Staff Compensation"
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-semibold rounded focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingCrew(null)}
                  className="flex-1 bg-[#eee7d7] hover:bg-[#e4dac5] text-[#1a1612] font-bold py-2.5 px-4 rounded-xl text-xs uppercase border border-[#1a1612] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDisbursing}
                  className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase border border-black cursor-pointer shadow disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isDisbursing ? 'Disbursing...' : '💰 Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Viewer Modal */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-typewriter">
          <div className="bg-[#fffdf9] border-4 border-[#1a1612] rounded-2xl p-6 sm:p-8 max-w-md w-full newspaper-shadow-lg text-[#1a1612]">
            <div className="border-b-4 border-[#1a1612] pb-3 mb-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#554e45]">
                ★ THE DAILY CHRONICLE RESTAURANT OS ★
              </div>
              <h2 className="font-headline text-2xl font-black uppercase text-[#1a1612] mt-0.5">
                Staff Salary Payslip
              </h2>
              <div className="text-[11px] text-amber-900 font-bold">
                Voucher Ref: {viewingSlip.transactionRef}
              </div>
            </div>

            <div className="space-y-3 text-xs bg-[#eee7d7] p-4 rounded-xl border-2 border-[#1a1612] mb-5">
              <div className="flex justify-between border-b border-[#c4b9a3] pb-1.5">
                <span className="text-[#554e45]">Staff Member:</span>
                <span className="font-bold text-[#1a1612]">{viewingSlip.staffName}</span>
              </div>
              <div className="flex justify-between border-b border-[#c4b9a3] pb-1.5">
                <span className="text-[#554e45]">Designation / Role:</span>
                <span className="font-bold text-[#1a1612] uppercase">{viewingSlip.staffRole}</span>
              </div>
              <div className="flex justify-between border-b border-[#c4b9a3] pb-1.5">
                <span className="text-[#554e45]">Salary Period:</span>
                <span className="font-bold text-[#1a1612]">{viewingSlip.month}</span>
              </div>
              <div className="flex justify-between border-b border-[#c4b9a3] pb-1.5">
                <span className="text-[#554e45]">Disbursed By:</span>
                <span className="font-bold text-[#1a1612]">{viewingSlip.paidByName || viewingSlip.paidBy}</span>
              </div>
              <div className="flex justify-between border-b border-[#c4b9a3] pb-1.5">
                <span className="text-[#554e45]">Disbursed On:</span>
                <span className="font-bold text-[#1a1612]">{new Date(viewingSlip.paidAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-sm font-black text-emerald-950">
                <span>Net Disbursed:</span>
                <span>₹{Number(viewingSlip.amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-bold py-2.5 px-4 rounded-xl text-xs uppercase border border-amber-400 cursor-pointer"
              >
                🖨️ Print Slip
              </button>
              <button
                onClick={() => setViewingSlip(null)}
                className="flex-1 bg-[#eee7d7] hover:bg-[#e4dac5] text-[#1a1612] font-bold py-2.5 px-4 rounded-xl text-xs uppercase border border-[#1a1612] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
