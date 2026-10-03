import React, { useState, useEffect, useMemo } from 'react';
import {
  getManagersApi,
  createManagerApi,
  updateManagerSalaryApi,
  payManagerSalaryApi,
  deleteManagerApi,
  getStaffListApi,
  updateCrewSalaryApi,
  payCrewSalaryApi,
  updateCrewStatusApi,
  deleteCrewMemberApi,
  resetAllStaffApi,
} from '../api/staffApi';
import { useStaffAuth } from '../context/StaffAuthContext';

export const RootExecutiveConsole = ({ onSwitchRole }) => {
  const { staffUser, logoutStaff } = useStaffAuth();
  const [managers, setManagers] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Active Tab View: 'tree' | 'analytics' | 'roster' | 'appoint' | 'ledger'
  const [activeTab, setActiveTab] = useState('tree');

  // Search & Filter for Roster
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // CEO Data Reset state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Appointment Form state (CEO can appoint General Manager OR Corporate Payroll Officer)
  const [appointRole, setAppointRole] = useState('manager'); // 'manager' or 'payroll'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('9811002233');
  const [department, setDepartment] = useState('Executive Administration');
  const [salary, setSalary] = useState('75000');
  const [passcode, setPasscode] = useState('1234');
  const [avatar, setAvatar] = useState('👨‍💼');

  // Universal Salary Edit Modal state
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editSalaryAmount, setEditSalaryAmount] = useState('');
  const [isUpdatingSalary, setIsUpdatingSalary] = useState(false);

  // Universal Salary Disbursement Modal state
  const [payingEmployee, setPayingEmployee] = useState(null);
  const [payMonth, setPayMonth] = useState(
    new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
  );
  const [payNotes, setPayNotes] = useState('Monthly Compensation Disbursed by Root Authority');
  const [isDisbursing, setIsDisbursing] = useState(false);

  // Payslip Viewer Modal state
  const [viewingSlip, setViewingSlip] = useState(null);

  // Collapsed Manager Branches in Tree View
  const [collapsedBranches, setCollapsedBranches] = useState({});

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [mgrRes, staffRes] = await Promise.all([
        getManagersApi().catch(() => ({ success: false, managers: [] })),
        getStaffListApi().catch(() => ({ success: false, staff: [] })),
      ]);

      if (mgrRes.success) {
        setManagers(mgrRes.managers || []);
      }
      if (staffRes.success) {
        setAllStaff(staffRes.staff || []);
      }
    } catch (err) {
      console.error('Error fetching root console data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleTypeChange = (newRole) => {
    setAppointRole(newRole);
    if (newRole === 'payroll') {
      setDepartment('Corporate Payroll & Treasury');
      setSalary('65000');
      setAvatar('💰');
    } else {
      setDepartment('Executive Administration');
      setSalary('75000');
      setAvatar('👨‍💼');
    }
  };

  const toggleBranch = (managerId) => {
    setCollapsedBranches((prev) => ({
      ...prev,
      [managerId]: !prev[managerId],
    }));
  };

  // Group Executives and Crew
  const payrollOfficers = useMemo(() => {
    return allStaff.filter((s) => s.role === 'payroll');
  }, [allStaff]);

  const generalManagers = useMemo(() => {
    return allStaff.filter((s) => s.role === 'manager');
  }, [allStaff]);

  const crewMembers = useMemo(() => {
    return allStaff.filter((s) => s.role !== 'manager' && s.role !== 'payroll' && s.role !== 'root');
  }, [allStaff]);

  const treeStructure = useMemo(() => {
    const mgrMap = generalManagers.map((mgr) => {
      const subordinates = crewMembers.filter(
        (c) =>
          (c.hiredBy && c.hiredBy.toLowerCase() === mgr.email.toLowerCase()) ||
          (c.hiredByName && c.hiredByName.toLowerCase().includes(mgr.name.toLowerCase()))
      );
      return {
        manager: mgr,
        crew: subordinates,
      };
    });

    const allAssignedIds = new Set(
      mgrMap.flatMap((m) => m.crew.map((c) => c.staffId))
    );
    const unassignedCrew = crewMembers.filter((c) => !allAssignedIds.has(c.staffId));

    return {
      payrollOfficers,
      managerTrees: mgrMap,
      unassignedCrew,
    };
  }, [payrollOfficers, generalManagers, crewMembers]);

  // Salary & Disparity Calculations
  const analytics = useMemo(() => {
    const totalEmployees = allStaff.length;
    const totalManagers = generalManagers.length;
    const totalPayrollOfficers = payrollOfficers.length;
    const totalCrew = crewMembers.length;

    const totalManagerPayroll = generalManagers.reduce((sum, m) => sum + (Number(m.salary) || 0), 0);
    const totalPayrollSpend = payrollOfficers.reduce((sum, p) => sum + (Number(p.salary) || 0), 0);
    const totalCrewPayroll = crewMembers.reduce((sum, c) => sum + (Number(c.salary) || 0), 0);
    const grandTotalPayroll = totalManagerPayroll + totalPayrollSpend + totalCrewPayroll;

    const avgManagerSalary = totalManagers > 0 ? Math.round(totalManagerPayroll / totalManagers) : 0;
    const avgCrewSalary = totalCrew > 0 ? Math.round(totalCrewPayroll / totalCrew) : 0;
    const salaryDifference = avgManagerSalary - avgCrewSalary;
    const salaryRatio = avgCrewSalary > 0 ? (avgManagerSalary / avgCrewSalary).toFixed(1) : '1.0';

    const rolesList = ['manager', 'payroll', 'chef', 'cashier', 'waiter', 'carrier'];
    const roleStats = rolesList.map((r) => {
      const staffInRole = allStaff.filter((s) => s.role === r);
      const count = staffInRole.length;
      const totalSalary = staffInRole.reduce((sum, s) => sum + (Number(s.salary) || 0), 0);
      const avg = count > 0 ? Math.round(totalSalary / count) : 0;
      return {
        role: r,
        count,
        totalSalary,
        avgSalary: avg,
        percentageOfTotal: grandTotalPayroll > 0 ? Math.round((totalSalary / grandTotalPayroll) * 100) : 0,
      };
    });

    const paidCount = allStaff.filter((s) => s.salaryStatus === 'PAID').length;
    const pendingCount = allStaff.filter((s) => s.salaryStatus !== 'PAID').length;

    const allSalaries = allStaff.map((s) => Number(s.salary) || 0);
    const highestSalary = allSalaries.length > 0 ? Math.max(...allSalaries) : 0;
    const lowestSalary = allSalaries.length > 0 ? Math.min(...allSalaries) : 0;

    return {
      totalEmployees,
      totalManagers,
      totalPayrollOfficers,
      totalCrew,
      totalManagerPayroll,
      totalPayrollSpend,
      totalCrewPayroll,
      grandTotalPayroll,
      avgManagerSalary,
      avgCrewSalary,
      salaryDifference,
      salaryRatio,
      roleStats,
      paidCount,
      pendingCount,
      highestSalary,
      lowestSalary,
    };
  }, [allStaff, generalManagers, payrollOfficers, crewMembers]);

  // Ledger
  const allSalaryLedger = useMemo(() => {
    return allStaff
      .flatMap((s) =>
        (s.salaryHistory || []).map((h) => ({
          ...h,
          employeeName: s.name,
          employeeEmail: s.email,
          employeeRole: s.role,
          employeeAvatar: s.avatar,
          staffId: s.staffId,
          department: s.department,
        }))
      )
      .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
  }, [allStaff]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return allStaff.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'all' || s.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [allStaff, searchTerm, roleFilter]);

  // Handlers
  const handleCEOResetDatabase = async () => {
    try {
      setIsResetting(true);
      const res = await resetAllStaffApi();
      if (res.success) {
        alert('All staff & manager records purged. Redirecting to first-time CEO setup.');
        logoutStaff();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to reset database.' });
    } finally {
      setIsResetting(false);
      setIsResetModalOpen(false);
    }
  };

  const handleAppointExecutive = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!name.trim() || !email.trim()) {
      setFeedback({ type: 'error', message: 'Name and official email are required.' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await createManagerApi({
        name: name.trim(),
        email: email.trim(),
        role: appointRole,
        phone: phone.trim(),
        department: department.trim(),
        salary: Number(salary) || (appointRole === 'payroll' ? 65000 : 75000),
        passcode: passcode.trim() || '1234',
        avatar,
        rootEmail: staffUser?.email || 'root@chronicle.com',
        rootName: staffUser?.name || 'Lord Arthur Sterling (Root)',
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `👑 Royal Commission Enacted! ${res.manager.name} appointed as ${appointRole === 'payroll' ? 'Corporate Payroll Officer' : 'General Manager'} (Salary: ₹${Number(res.manager.salary).toLocaleString('en-IN')}/mo).`,
        });
        setName('');
        setEmail('');
        setPhone('9811002233');
        setSalary(appointRole === 'payroll' ? '65000' : '75000');
        setPasscode('1234');
        await fetchAllData();
        setActiveTab('tree');
      } else {
        setFeedback({ type: 'error', message: res.message || 'Failed to appoint executive.' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error communicating with Root Authority API.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSalary = async (e) => {
    e.preventDefault();
    if (!editingEmployee || !editSalaryAmount) return;

    try {
      setIsUpdatingSalary(true);
      const isExecutive = editingEmployee.role === 'manager' || editingEmployee.role === 'payroll';
      const res = isExecutive
        ? await updateManagerSalaryApi(editingEmployee.staffId, Number(editSalaryAmount))
        : await updateCrewSalaryApi(editingEmployee.staffId, Number(editSalaryAmount));

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `✓ Monthly salary for ${editingEmployee.name} (${editingEmployee.role.toUpperCase()}) updated to ₹${Number(editSalaryAmount).toLocaleString('en-IN')}/mo.`,
        });
        setEditingEmployee(null);
        await fetchAllData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to update salary.' });
    } finally {
      setIsUpdatingSalary(false);
    }
  };

  const handleDisburseSalary = async (e) => {
    e.preventDefault();
    if (!payingEmployee) return;

    try {
      setIsDisbursing(true);
      const isExecutive = payingEmployee.role === 'manager' || payingEmployee.role === 'payroll';
      const paymentPayload = {
        month: payMonth,
        notes: payNotes,
        paidBy: staffUser?.name || 'Lord Arthur Sterling (Root Authority)',
      };

      const res = isExecutive
        ? await payManagerSalaryApi(payingEmployee.staffId, paymentPayload)
        : await payCrewSalaryApi(payingEmployee.staffId, paymentPayload);

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `💰 Salary of ₹${Number(payingEmployee.salary || 25000).toLocaleString('en-IN')} disbursed to ${payingEmployee.name} (${payingEmployee.role.toUpperCase()}) for ${payMonth}! (Txn Ref: ${res.payment?.transactionRef})`,
        });
        setPayingEmployee(null);
        await fetchAllData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to disburse salary.' });
    } finally {
      setIsDisbursing(false);
    }
  };

  const handleToggleStatus = async (staffMember) => {
    try {
      const res = await updateCrewStatusApi(staffMember.staffId, !staffMember.isActive);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Staff member ${staffMember.name} is now ${!staffMember.isActive ? 'Active' : 'Deactivated'}.`,
        });
        await fetchAllData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to toggle status.' });
    }
  };

  const handleOffboard = async (staffMember) => {
    if (!window.confirm(`Are you sure you want to offboard ${staffMember.name} (${staffMember.role.toUpperCase()})?`)) {
      return;
    }

    try {
      const isExecutive = staffMember.role === 'manager' || staffMember.role === 'payroll';
      const res = isExecutive
        ? await deleteManagerApi(staffMember.staffId)
        : await deleteCrewMemberApi(staffMember.staffId);

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `${staffMember.role.toUpperCase()} ${staffMember.name} has been formally offboarded.`,
        });
        await fetchAllData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to offboard employee.' });
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'root':
        return { bg: 'bg-amber-400 text-black border-black', label: '👑 ROOT CEO' };
      case 'payroll':
        return { bg: 'bg-emerald-950 text-emerald-300 border-emerald-500', label: '💰 PAYROLL OFFICER' };
      case 'manager':
        return { bg: 'bg-zinc-900 text-amber-300 border-amber-400', label: '👨‍💼 GENERAL MANAGER' };
      case 'chef':
        return { bg: 'bg-red-800 text-white border-red-950', label: '👨‍🍳 MASTER CHEF' };
      case 'cashier':
        return { bg: 'bg-amber-800 text-amber-100 border-black', label: '🧾 MASTER CASHIER' };
      case 'waiter':
        return { bg: 'bg-blue-900 text-white border-blue-950', label: '🛎️ FLOOR WAITER' };
      case 'carrier':
        return { bg: 'bg-purple-900 text-white border-purple-950', label: '📦 EXPEDITER' };
      default:
        return { bg: 'bg-zinc-800 text-white border-black', label: role?.toUpperCase() };
    }
  };

  return (
    <div className="font-editorial">
      {/* 2-Column Left Navigation Layout */}
      <div className="flex flex-col md:flex-row gap-5 items-start w-full">
        {/* Left Sidebar Navigation Panel */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 space-y-4 font-typewriter">
          <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-4 rounded-2xl newspaper-shadow space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#71695f] border-b-2 border-[#1a1612] pb-2 flex items-center justify-between">
              <span>👑 EXECUTIVE SECTIONS</span>
              <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-black">ROOT OS</span>
            </div>

            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab('tree')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-2 flex items-center justify-between ${
                  activeTab === 'tree'
                    ? 'bg-[#1a1612] text-amber-300 border-[#1a1612] shadow-md scale-[1.01]'
                    : 'bg-[#eee7d7] text-[#1a1612] hover:bg-[#e4dac5] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🌳</span>
                  <span>Org Tree</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-black font-mono font-bold">
                  {allStaff.length + 1}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-2 flex items-center justify-between ${
                  activeTab === 'analytics'
                    ? 'bg-[#1a1612] text-amber-300 border-[#1a1612] shadow-md scale-[1.01]'
                    : 'bg-[#eee7d7] text-[#1a1612] hover:bg-[#e4dac5] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <span>Salary Diff</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {analytics.salaryRatio}x
                </span>
              </button>

              <button
                onClick={() => setActiveTab('roster')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-2 flex items-center justify-between ${
                  activeTab === 'roster'
                    ? 'bg-[#1a1612] text-amber-300 border-[#1a1612] shadow-md scale-[1.01]'
                    : 'bg-[#eee7d7] text-[#1a1612] hover:bg-[#e4dac5] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">👥</span>
                  <span>All Staff</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1a1612] text-amber-300 font-mono font-bold">
                  {allStaff.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('appoint')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-2 flex items-center justify-between ${
                  activeTab === 'appoint'
                    ? 'bg-[#1a1612] text-amber-300 border-[#1a1612] shadow-md scale-[1.01]'
                    : 'bg-[#eee7d7] text-[#1a1612] hover:bg-[#e4dac5] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">👑</span>
                  <span>Appoint Exec</span>
                </div>
                <span className="text-[9px] bg-amber-400 text-black font-bold uppercase px-1 rounded">New</span>
              </button>

              <button
                onClick={() => setActiveTab('ledger')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-2 flex items-center justify-between ${
                  activeTab === 'ledger'
                    ? 'bg-[#1a1612] text-amber-300 border-[#1a1612] shadow-md scale-[1.01]'
                    : 'bg-[#eee7d7] text-[#1a1612] hover:bg-[#e4dac5] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📑</span>
                  <span>Master Ledger</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-700 text-white font-mono font-bold">
                  {allSalaryLedger.length}
                </span>
              </button>
            </nav>

            {/* CEO Danger Zone */}
            <div className="pt-2 border-t-2 border-[#1a1612]/30">
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer border border-red-900 bg-red-950/10 text-red-900 hover:bg-red-900 hover:text-white flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>🛡️</span>
                  <span>CEO Danger Zone</span>
                </div>
                <span className="text-[9px] bg-red-900 text-white px-1.5 py-0.2 rounded">RESET</span>
              </button>
            </div>
          </div>

          {/* Quick Summary Telemetry Card */}
          <div className="bg-[#14110e] text-[#f7f3eb] border-3 border-amber-400 p-4 rounded-2xl newspaper-shadow text-xs space-y-2.5">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              ★ ENTERPRISE TELEMETRY
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Grand Payroll:</span>
              <span className="text-emerald-400 font-bold">₹{analytics.grandTotalPayroll.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Disbursed:</span>
              <span className="text-amber-300 font-bold">{analytics.paidCount} / {allStaff.length} Staff</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Managers Appointed:</span>
              <span className="text-white font-bold">{generalManagers.length} MGR</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Payroll Officers:</span>
              <span className="text-white font-bold">{payrollOfficers.length} PAYROLL</span>
            </div>
          </div>
        </aside>

        {/* Right Main Content Workspace */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Proprietor Royal Seal Header Banner */}
          <div className="bg-[#14110e] text-[#f7f3eb] border-4 border-amber-400 p-5 sm:p-6 rounded-2xl shadow-2xl newspaper-shadow relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-10 text-9xl select-none pointer-events-none">
              👑
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="bg-amber-400 text-black font-typewriter text-[9px] font-black uppercase px-2.5 py-0.5 rounded tracking-widest shadow">
                    ★ SEPARATE ROOT DB TABLE: [root_admins] ★
                  </span>
                  <span className="bg-emerald-800 text-emerald-100 font-typewriter text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                    SUPREME PROPRIETOR AUTHORITY
                  </span>
                </div>
                <h2 className="font-headline text-xl sm:text-2xl font-black uppercase tracking-wide text-amber-300">
                  Lord Arthur Sterling • Company Executive Console
                </h2>
                <p className="font-typewriter text-xs text-amber-100/80 mt-1 max-w-xl leading-relaxed">
                  Proprietor authority over The Daily Culinary Chronicle enterprise. Oversee complete organizational hierarchy,
                  appoint General Managers and Corporate Payroll Officers, regulate wage differences, and audit disbursements.
                </p>
              </div>

              <div className="bg-[#24201b] border-2 border-amber-400/70 p-3.5 rounded-xl font-typewriter text-xs text-amber-100 min-w-[240px] shadow-lg">
                <div className="text-[10px] text-amber-400 uppercase font-bold mb-1 flex justify-between items-center">
                  <span>Root Crown Desk</span>
                  <span className="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded">CEO</span>
                </div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span>👑</span>
                  <span>Lord Arthur Sterling</span>
                </div>
                <div className="text-[11px] text-amber-300 mt-0.5">{staffUser?.email || 'root@chronicle.com'}</div>
                <div className="text-[10px] text-zinc-300 mt-1.5 pt-1.5 border-t border-zinc-700 flex justify-between items-center">
                  <span>Total Personnel:</span>
                  <span className="font-bold text-amber-300 text-xs">{allStaff.length + 1} Staff</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback.message && (
            <div
              className={`p-3.5 rounded-xl border-2 font-typewriter text-xs font-bold transition-all flex items-center justify-between ${
                feedback.type === 'success'
                  ? 'bg-emerald-100 border-emerald-900 text-emerald-950 newspaper-shadow-sm'
                  : 'bg-red-100 border-red-900 text-red-950 newspaper-shadow-sm'
              }`}
            >
              <span>{feedback.message}</span>
              <button
                onClick={() => setFeedback({ type: '', message: '' })}
                className="text-xs font-bold px-2 py-0.5 rounded bg-black/10 hover:bg-black/20 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick KPI Bar in Right Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 font-typewriter">
            <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-3.5 rounded-xl newspaper-shadow">
              <div className="text-[10px] font-bold uppercase text-[#554e45]">★ TOTAL MONTHLY PAYROLL</div>
              <div className="text-xl font-headline font-black text-emerald-900 mt-0.5">
                ₹{analytics.grandTotalPayroll.toLocaleString('en-IN')}/mo
              </div>
              <div className="text-[10px] text-[#71695f] mt-0.5">
                Exec: ₹{(analytics.totalManagerPayroll + analytics.totalPayrollSpend).toLocaleString('en-IN')} • Crew: ₹{analytics.totalCrewPayroll.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-3.5 rounded-xl newspaper-shadow">
              <div className="text-[10px] font-bold uppercase text-[#554e45]">★ SALARY DIFFERENCE DELTA</div>
              <div className="text-xl font-headline font-black text-[#1a1612] mt-0.5">
                +₹{analytics.salaryDifference.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-[#71695f] mt-0.5">
                Mgr (₹{analytics.avgManagerSalary.toLocaleString('en-IN')}) vs Crew [{analytics.salaryRatio}x]
              </div>
            </div>

            <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-3.5 rounded-xl newspaper-shadow">
              <div className="text-[10px] font-bold uppercase text-[#554e45]">★ DIRECT APPOINTMENTS</div>
              <div className="text-xl font-headline font-black text-[#1a1612] mt-0.5">
                {generalManagers.length} MGR • {payrollOfficers.length} PAYROLL
              </div>
              <div className="text-[10px] text-[#71695f] mt-0.5">
                C-Suite Commissioned by CEO
              </div>
            </div>

            <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-3.5 rounded-xl newspaper-shadow">
              <div className="text-[10px] font-bold uppercase text-[#554e45]">★ DISBURSEMENT CYCLE</div>
              <div className="text-xl font-headline font-black text-emerald-800 mt-0.5 flex items-center gap-1.5">
                <span>{analytics.paidCount} Paid</span>
                {analytics.pendingCount > 0 && (
                  <span className="text-amber-800 text-xs font-normal">({analytics.pendingCount} Pending)</span>
                )}
              </div>
              <div className="text-[10px] text-[#71695f] mt-0.5">{allSalaryLedger.length} Total Vouchers</div>
            </div>
          </div>
          {/* ========================================================================= */}
          {/* TAB 1: 🌳 VISUAL ORGANIZATIONAL TREE HIERARCHY                            */}
          {/* ========================================================================= */}
          {activeTab === 'tree' && (
        <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-6 sm:p-8 newspaper-shadow rounded-2xl animate-fadeIn">
          <div className="border-b-2 border-[#1a1612] pb-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-typewriter">
            <div>
              <span className="bg-amber-400 text-black text-[9px] font-black uppercase px-2.5 py-0.5 rounded">
                ★ VISUAL CHAIN OF COMMAND TREE ★
              </span>
              <h3 className="font-headline text-2xl font-black uppercase text-[#1a1612] mt-1">
                Company Organizational Tree Structure
              </h3>
              <p className="text-xs text-[#554e45] mt-0.5">
                CEO oversees Corporate Payroll Officers and General Managers. General Managers oversee Kitchen & Floor Brigade.
              </p>
            </div>

            <button
              onClick={fetchAllData}
              disabled={loading}
              className="bg-[#eee7d7] hover:bg-[#e4dac5] text-[#1a1612] font-bold text-xs px-3 py-1.5 rounded-lg border border-[#1a1612] cursor-pointer"
            >
              🔄 Refresh Tree
            </button>
          </div>

          {/* TREE CONTAINER */}
          <div className="flex flex-col items-center space-y-8 font-typewriter">
            {/* LEVEL 0: ROOT OWNER / CEO (Apex Node) */}
            <div className="relative flex flex-col items-center">
              <div className="bg-[#14110e] text-[#f7f3eb] border-4 border-amber-400 rounded-2xl p-5 newspaper-shadow-lg max-w-xl w-full text-center relative z-10 transition hover:scale-[1.01]">
                <div className="inline-flex items-center gap-1.5 bg-amber-400 text-black text-[9px] font-black uppercase px-3 py-0.5 rounded-full mb-2 tracking-widest shadow">
                  <span>👑 APEX PROPRIETOR • [root_admins] TABLE</span>
                </div>
                <h3 className="font-headline text-2xl font-black uppercase text-amber-300">
                  Lord Arthur Sterling
                </h3>
                <div className="text-xs text-amber-100 font-semibold mt-0.5">
                  Company Owner & Chief Executive Officer (CEO)
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Telegraph ID: <strong>{staffUser?.email || 'root@chronicle.com'}</strong> • Phone: <strong>9800000000</strong>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-700 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#24201b] p-2 rounded-lg border border-amber-400/40">
                    <div className="text-[8px] text-amber-400 uppercase font-bold">Total Payroll</div>
                    <div className="font-black text-amber-200 text-sm">₹{analytics.grandTotalPayroll.toLocaleString('en-IN')}/mo</div>
                  </div>
                  <div className="bg-[#24201b] p-2 rounded-lg border border-amber-400/40">
                    <div className="text-[8px] text-amber-400 uppercase font-bold">Payroll Officers</div>
                    <div className="font-black text-emerald-300 text-sm">{payrollOfficers.length} CFO Desk</div>
                  </div>
                  <div className="bg-[#24201b] p-2 rounded-lg border border-amber-400/40">
                    <div className="text-[8px] text-amber-400 uppercase font-bold">General Managers</div>
                    <div className="font-black text-amber-200 text-sm">{generalManagers.length} Active</div>
                  </div>
                </div>
              </div>

              {/* Vertical Trunk Line */}
              {(payrollOfficers.length > 0 || generalManagers.length > 0) && (
                <div className="w-1 h-8 bg-[#1a1612] my-0"></div>
              )}
            </div>

            {/* LEVEL 1: C-SUITE EXECUTIVES (Payroll Officers & General Managers) */}
            <div className="w-full space-y-8">
              {/* DIVISION A: CORPORATE PAYROLL & TREASURY WING (Managed Exclusively by CEO) */}
              {payrollOfficers.length > 0 && (
                <div className="bg-emerald-50/70 border-3 border-emerald-800 rounded-2xl p-5 newspaper-shadow">
                  <div className="border-b-2 border-emerald-800 pb-2 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💰</span>
                      <div>
                        <span className="bg-emerald-800 text-white text-[8px] font-bold uppercase px-2 py-0.5 rounded">
                          EXCLUSIVELY APPOINTED BY CEO
                        </span>
                        <h4 className="font-headline font-black text-base uppercase text-emerald-950">
                          Corporate Payroll & Treasury Officers ({payrollOfficers.length})
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-bold">
                      Direct Executive Report to CEO
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payrollOfficers.map((po) => (
                      <div
                        key={po.staffId}
                        className="bg-white border-2 border-emerald-800 rounded-xl p-4 flex flex-col justify-between gap-3 newspaper-shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl p-1.5 bg-emerald-100 rounded-xl border border-emerald-800">
                              {po.avatar || '💰'}
                            </span>
                            <div>
                              <div className="font-bold text-sm text-[#1a1612] flex items-center gap-1.5">
                                <span>{po.name}</span>
                                <span className="bg-emerald-900 text-emerald-200 text-[8px] font-bold px-1.5 py-0.2 rounded">
                                  PAYROLL OFFICER
                                </span>
                              </div>
                              <div className="text-[11px] text-[#554e45]">📧 {po.email} • 📞 {po.phone || '9800000000'}</div>
                              <div className="text-[10px] text-emerald-900 font-semibold">{po.department}</div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-[9px] text-[#71695f] uppercase">Salary:</div>
                            <div className="font-black text-base text-emerald-900">
                              ₹{Number(po.salary || 65000).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-emerald-100 flex items-center justify-between gap-2">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                              po.salaryStatus === 'PAID'
                                ? 'bg-emerald-200 text-emerald-950'
                                : 'bg-amber-200 text-amber-950'
                            }`}
                          >
                            {po.salaryStatus === 'PAID' ? '● SALARY PAID' : '○ SALARY PENDING'}
                          </span>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                setPayingEmployee(po);
                                setPayMonth(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
                              }}
                              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1 rounded border border-black cursor-pointer"
                            >
                              💰 Pay
                            </button>
                            <button
                              onClick={() => {
                                setEditingEmployee(po);
                                setEditSalaryAmount(String(po.salary || 65000));
                              }}
                              className="bg-[#1a1612] text-amber-300 font-bold text-xs px-2.5 py-1 rounded border border-amber-400 cursor-pointer"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleOffboard(po)}
                              className="bg-red-800 hover:bg-red-700 text-white font-bold text-xs px-2 py-1 rounded border border-black cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DIVISION B: GENERAL MANAGERS & THEIR KITCHEN/FLOOR SUBORDINATES */}
              {generalManagers.length === 0 ? (
                <div className="text-center py-10 bg-[#eee7d7] rounded-xl border-2 border-dashed border-[#1a1612] p-8 max-w-md mx-auto text-xs">
                  <div className="text-4xl mb-2">👨‍💼</div>
                  <div className="font-bold text-sm">No General Managers Commissioned Yet</div>
                  <p className="text-[#71695f] mt-1 mb-4">
                    Appoint General Managers or Payroll Officers using the royal commission form.
                  </p>
                  <button
                    onClick={() => setActiveTab('appoint')}
                    className="bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-bold px-4 py-2 rounded-xl text-xs uppercase border border-amber-400 cursor-pointer shadow"
                  >
                    👑 Appoint Executive ➔
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                  {treeStructure.managerTrees.map(({ manager: mgr, crew }) => {
                    const isCollapsed = collapsedBranches[mgr.staffId];
                    return (
                      <div
                        key={mgr.staffId}
                        className="bg-[#eee7d7]/70 border-3 border-[#1a1612] rounded-2xl p-5 newspaper-shadow flex flex-col items-center relative"
                      >
                        {/* MANAGER CARD */}
                        <div className="bg-[#fffdf9] border-3 border-[#1a1612] rounded-xl p-4 w-full newspaper-shadow-sm">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className="text-3xl p-2 bg-amber-100 rounded-xl border border-[#1a1612]">
                                {mgr.avatar || '👨‍💼'}
                              </span>
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <h4 className="font-headline font-black text-base text-[#1a1612]">
                                    {mgr.name}
                                  </h4>
                                  <span className="text-[9px] bg-zinc-900 text-amber-300 px-1.5 py-0.2 rounded font-black uppercase">
                                    GENERAL MANAGER
                                  </span>
                                  <span
                                    className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                                      mgr.salaryStatus === 'PAID'
                                        ? 'bg-emerald-200 text-emerald-900 border border-emerald-400'
                                        : 'bg-amber-200 text-amber-900 border border-amber-400'
                                    }`}
                                  >
                                    {mgr.salaryStatus === 'PAID' ? '● PAID' : '○ PENDING'}
                                  </span>
                                </div>
                                <div className="text-xs text-[#554e45] mt-0.5">
                                  📧 {mgr.email} • 📞 {mgr.phone || '9811000000'}
                                </div>
                                <div className="text-[10px] text-[#71695f] mt-0.5">
                                  🏛️ {mgr.department} • Subordinates: <strong>{crew.length} Crew</strong>
                                </div>
                              </div>
                            </div>

                            <div className="text-right bg-[#eee7d7] p-2.5 rounded-lg border border-[#1a1612] min-w-[120px]">
                              <div className="text-[9px] text-[#71695f] uppercase font-bold">Monthly Wage:</div>
                              <div className="font-headline font-black text-lg text-emerald-900">
                                ₹{Number(mgr.salary || 75000).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons for Manager */}
                          <div className="mt-3 pt-3 border-t border-[#d1c7b7] flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setPayingEmployee(mgr);
                                  setPayMonth(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
                                }}
                                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg border border-black cursor-pointer shadow-sm"
                              >
                                💰 Disburse
                              </button>
                              <button
                                onClick={() => {
                                  setEditingEmployee(mgr);
                                  setEditSalaryAmount(String(mgr.salary || 75000));
                                }}
                                className="bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-bold text-xs px-3 py-1.5 rounded-lg border border-amber-400 cursor-pointer"
                              >
                                ✏️ Edit Salary
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleBranch(mgr.staffId)}
                                className="bg-[#eee7d7] hover:bg-[#e4dac5] text-[#1a1612] font-bold text-xs px-2.5 py-1.5 rounded-lg border border-[#1a1612] cursor-pointer"
                              >
                                {isCollapsed ? `▼ Show Crew (${crew.length})` : `▲ Hide Crew (${crew.length})`}
                              </button>
                              <button
                                onClick={() => handleOffboard(mgr)}
                                className="text-xs bg-red-800 hover:bg-red-700 text-white font-bold px-2 py-1.5 rounded-lg border border-black cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* LEVEL 2: CREW MEMBERS UNDER THIS MANAGER */}
                        {!isCollapsed && (
                          <div className="w-full flex flex-col items-center mt-3">
                            <div className="w-0.5 h-4 bg-[#1a1612]"></div>

                            {crew.length === 0 ? (
                              <div className="bg-[#fffdf9] border-2 border-dashed border-[#1a1612] rounded-xl p-3.5 text-center text-xs text-[#71695f] w-full">
                                <span>No crew members recruited under this Manager yet.</span>
                              </div>
                            ) : (
                              <div className="space-y-2.5 w-full">
                                {crew.map((staff) => {
                                  const badge = getRoleBadge(staff.role);
                                  return (
                                    <div
                                      key={staff.staffId}
                                      className="p-3 bg-[#fffdf9] border-2 border-[#1a1612] rounded-xl newspaper-shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <span className="text-2xl p-1.5 bg-[#eee7d7] rounded-lg border border-[#1a1612]">
                                          {staff.avatar || '👤'}
                                        </span>
                                        <div>
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="font-bold text-xs text-[#1a1612]">{staff.name}</span>
                                            <span className={`text-[8px] font-black px-1.5 py-0.2 rounded border ${badge.bg}`}>
                                              {badge.label}
                                            </span>
                                            <span
                                              className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                                staff.salaryStatus === 'PAID'
                                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                                              }`}
                                            >
                                              {staff.salaryStatus === 'PAID' ? '● PAID' : '○ PENDING'}
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-[#554e45]">
                                            📧 {staff.email} • 📞 {staff.phone || '9800000000'}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#eee7d7]">
                                        <div className="text-left sm:text-right">
                                          <div className="text-[9px] text-[#71695f] uppercase">Salary:</div>
                                          <div className="font-bold text-sm text-emerald-900">
                                            ₹{Number(staff.salary || 25000).toLocaleString('en-IN')}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => {
                                              setPayingEmployee(staff);
                                              setPayMonth(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
                                            }}
                                            className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] px-2 py-1 rounded border border-black cursor-pointer shadow-sm"
                                          >
                                            💰 Pay
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingEmployee(staff);
                                              setEditSalaryAmount(String(staff.salary || 25000));
                                            }}
                                            className="bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-bold text-[11px] px-2 py-1 rounded border border-amber-400 cursor-pointer"
                                          >
                                            ✏️
                                          </button>
                                          <button
                                            onClick={() => handleToggleStatus(staff)}
                                            className="font-bold text-[11px] px-2 py-1 rounded border border-black cursor-pointer bg-gray-100"
                                          >
                                            {staff.isActive !== false ? '⏸' : '▶'}
                                          </button>
                                          <button
                                            onClick={() => handleOffboard(staff)}
                                            className="bg-red-800 hover:bg-red-700 text-white font-bold text-[11px] px-1.5 py-1 rounded border border-black cursor-pointer"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 📊 SALARY DIFFERENCES & ANALYTICS                                  */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fadeIn font-typewriter text-xs">
          <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-6 sm:p-8 newspaper-shadow rounded-2xl">
            <div className="border-b-2 border-[#1a1612] pb-4 mb-6">
              <span className="bg-amber-400 text-black text-[9px] font-black uppercase px-2.5 py-0.5 rounded">
                ★ COMPANY PAYROLL & SALARY DISPARITY MATRIX ★
              </span>
              <h3 className="font-headline text-2xl font-black uppercase text-[#1a1612] mt-1">
                Executive vs Floor Brigade Salary Comparison
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-zinc-900 text-amber-100 p-5 rounded-xl border-3 border-amber-400 newspaper-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-amber-400">MANAGEMENT & PAYROLL TIER</span>
                  <span className="text-xl">👨‍💼 💰</span>
                </div>
                <div className="text-3xl font-headline font-black text-amber-300">
                  ₹{(analytics.totalManagerPayroll + analytics.totalPayrollSpend).toLocaleString('en-IN')}/mo
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Average Executive Wage: <strong>₹{analytics.avgManagerSalary.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="bg-amber-100 border-3 border-[#1a1612] p-5 rounded-xl newspaper-shadow text-[#1a1612] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-[#854d0e]">SALARY DIFFERENCE DELTA</span>
                    <span className="text-xl">⚖️</span>
                  </div>
                  <div className="text-3xl font-headline font-black text-[#1a1612]">
                    +₹{analytics.salaryDifference.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-[#554e45] mt-1">
                    Executives earn <strong>{analytics.salaryRatio}x</strong> of average crew staff wages.
                  </div>
                </div>
              </div>

              <div className="bg-red-950 text-white p-5 rounded-xl border-3 border-red-800 newspaper-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-red-300">KITCHEN & FLOOR BRIGADE</span>
                  <span className="text-xl">👨‍🍳 🧾 🛎️</span>
                </div>
                <div className="text-3xl font-headline font-black text-red-200">
                  ₹{analytics.totalCrewPayroll.toLocaleString('en-IN')}/mo
                </div>
                <div className="text-xs text-red-300/80 mt-1">
                  Average Crew Wage: <strong>₹{analytics.avgCrewSalary.toLocaleString('en-IN')}</strong> ({analytics.totalCrew} Staff)
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border-t-2 border-[#1a1612] pt-6">
              <h4 className="font-headline text-xl font-black uppercase text-[#1a1612] mb-4">
                ★ Role-By-Role Salary Distribution
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1a1612] text-amber-300 uppercase text-[10px] border-b-2 border-black">
                      <th className="p-3">Role Designation</th>
                      <th className="p-3">Staff Count</th>
                      <th className="p-3">Average Monthly Salary</th>
                      <th className="p-3">Total Monthly Spend</th>
                      <th className="p-3">Share of Payroll</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d1c7b7]">
                    {analytics.roleStats.map((st) => {
                      const badge = getRoleBadge(st.role);
                      return (
                        <tr key={st.role} className="hover:bg-[#eee7d7] transition">
                          <td className="p-3">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-sm text-[#1a1612]">{st.count} Staff</td>
                          <td className="p-3 font-black text-sm text-emerald-900">
                            ₹{st.avgSalary.toLocaleString('en-IN')}/mo
                          </td>
                          <td className="p-3 font-bold text-[#1a1612]">
                            ₹{st.totalSalary.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 font-bold text-[10px]">{st.percentageOfTotal}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 👥 ALL PERSONNEL ROSTER                                            */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-6 newspaper-shadow rounded-2xl animate-fadeIn font-typewriter text-xs">
          <div className="border-b-2 border-[#1a1612] pb-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="bg-[#1a1612] text-amber-300 text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                ★ MASTER PERSONNEL DIRECTORY ★
              </span>
              <h3 className="font-headline text-2xl font-black uppercase text-[#1a1612] mt-1">
                All Company Staff & Executive Accounts ({filteredRoster.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by name or email..."
                className="bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-1.5 rounded text-xs font-semibold focus:bg-white focus:outline-none min-w-[200px]"
              />

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-1.5 rounded text-xs font-bold focus:bg-white focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="manager">General Managers</option>
                <option value="payroll">Payroll Officers</option>
                <option value="chef">Chefs</option>
                <option value="cashier">Cashiers</option>
                <option value="waiter">Waiters</option>
                <option value="carrier">Carriers</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1a1612] text-amber-300 uppercase text-[10px] border-b-2 border-black">
                  <th className="p-3">Staff Details</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Appointed By</th>
                  <th className="p-3">Monthly Wage</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Root Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d1c7b7]">
                {filteredRoster.map((s) => {
                  const badge = getRoleBadge(s.role);
                  return (
                    <tr key={s.staffId} className="hover:bg-[#eee7d7] transition">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl p-1 bg-white rounded border border-[#1a1612]">
                            {s.avatar || '👤'}
                          </span>
                          <div>
                            <div className="font-bold text-[#1a1612]">{s.name}</div>
                            <div className="text-[11px] text-[#554e45]">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3 text-[#554e45]">
                        <div className="font-bold text-[11px]">{s.hiredByName || 'Lord Arthur Sterling (CEO)'}</div>
                      </td>
                      <td className="p-3 font-black text-sm text-emerald-900">
                        ₹{Number(s.salary || 25000).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                            s.salaryStatus === 'PAID'
                              ? 'bg-emerald-200 text-emerald-900'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {s.salaryStatus === 'PAID' ? '● PAID' : '○ PENDING'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setPayingEmployee(s);
                              setPayMonth(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
                            }}
                            className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1 rounded border border-black cursor-pointer shadow-sm"
                          >
                            💰 Pay
                          </button>
                          <button
                            onClick={() => {
                              setEditingEmployee(s);
                              setEditSalaryAmount(String(s.salary || 25000));
                            }}
                            className="bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-bold text-xs px-2 py-1 rounded border border-amber-400 cursor-pointer"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleOffboard(s)}
                            className="bg-red-800 hover:bg-red-700 text-white font-bold text-xs px-2 py-1 rounded border border-black cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: 👑 APPOINT EXECUTIVE (GENERAL MANAGER OR PAYROLL OFFICER)           */}
      {/* ========================================================================= */}
      {activeTab === 'appoint' && (
        <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-6 sm:p-8 newspaper-shadow rounded-2xl max-w-2xl mx-auto animate-fadeIn font-typewriter text-xs">
          <div className="border-b-2 border-[#1a1612] pb-4 mb-5">
            <span className="bg-amber-400 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded">
              ★ ROYAL PROPRIETOR COMMISSION (CEO EXCLUSIVE) ★
            </span>
            <h3 className="font-headline text-2xl font-black uppercase text-[#1a1612] mt-1">
              Appoint Executive Leadership
            </h3>
            <p className="text-xs text-[#554e45] mt-0.5">
              Only the Company CEO can commission General Managers and Corporate Payroll Officers.
            </p>
          </div>

          <form onSubmit={handleAppointExecutive} className="space-y-4 text-xs">
            {/* Executive Role Selection Switch */}
            <div>
              <label className="font-bold uppercase text-[#1a1612] block mb-1">
                Executive Commission Designation:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleTypeChange('manager')}
                  className={`p-3 rounded-xl border-2 font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                    appointRole === 'manager'
                      ? 'bg-zinc-900 text-amber-300 border-black shadow'
                      : 'bg-[#eee7d7] text-[#1a1612] border-gray-400'
                  }`}
                >
                  <span className="text-xl">👨‍💼</span>
                  <span>General Manager</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleTypeChange('payroll')}
                  className={`p-3 rounded-xl border-2 font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                    appointRole === 'payroll'
                      ? 'bg-emerald-950 text-emerald-300 border-black shadow'
                      : 'bg-[#eee7d7] text-[#1a1612] border-gray-400'
                  }`}
                >
                  <span className="text-xl">💰</span>
                  <span>Payroll Officer</span>
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold uppercase text-[#1a1612] block mb-1">
                Executive Full Name:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={appointRole === 'payroll' ? 'e.g. Fiscal Officer Priya' : 'e.g. General Manager Vikram'}
                className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3.5 py-2.5 text-xs font-bold rounded focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold uppercase text-[#1a1612] block mb-1">
                Official Telegraph Email (Login ID):
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={appointRole === 'payroll' ? 'payroll@chronicle.com' : 'manager@chronicle.com'}
                className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3.5 py-2.5 text-xs font-bold rounded focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  Monthly Executive Wage (₹):
                </label>
                <input
                  type="number"
                  required
                  min="5000"
                  step="500"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder={appointRole === 'payroll' ? '65000' : '75000'}
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-black text-amber-950 rounded focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  Initial Passcode (Default: 1234):
                </label>
                <input
                  type="text"
                  maxLength="8"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="1234"
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-bold rounded focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  Contact Phone:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9811002233"
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-semibold rounded focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  Department:
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder={appointRole === 'payroll' ? 'Corporate Payroll & Treasury' : 'Executive Administration'}
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-semibold rounded focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1a1612] hover:bg-[#332c25] active:scale-98 text-amber-300 font-typewriter font-black py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider border-2 border-amber-400 newspaper-shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>ENACTING ROYAL DECREE...</span>
                ) : (
                  <>
                    <span>👑 APPOINT {appointRole === 'payroll' ? 'PAYROLL OFFICER' : 'GENERAL MANAGER'} (₹{Number(salary || 0).toLocaleString('en-IN')}/mo)</span>
                    <span>➔</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: 📑 MASTER SALARY DISBURSEMENT LEDGER                               */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-6 newspaper-shadow rounded-2xl animate-fadeIn font-typewriter text-xs">
          <div className="border-b-2 border-[#1a1612] pb-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="bg-[#1a1612] text-amber-300 text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                ★ MASTER COMPANY PAYROLL LEDGER ★
              </span>
              <h3 className="font-headline text-2xl font-black uppercase text-[#1a1612] mt-1">
                Company-Wide Salary Disbursements Archive
              </h3>
            </div>
            <span className="text-xs text-[#71695f]">
              {allSalaryLedger.length} Total Payment Vouchers Recorded
            </span>
          </div>

          {allSalaryLedger.length === 0 ? (
            <div className="text-center py-10 bg-[#eee7d7] rounded-xl border-2 border-dashed border-[#1a1612]">
              <div className="text-3xl mb-1">📜</div>
              <div className="font-bold">No Salary Disbursements Recorded Yet</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1a1612] text-amber-300 uppercase text-[10px] border-b-2 border-black">
                    <th className="p-3">Txn Reference</th>
                    <th className="p-3">Beneficiary</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Month</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Disbursed At</th>
                    <th className="p-3 text-right">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1c7b7]">
                  {allSalaryLedger.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#f0e8d8] transition">
                      <td className="p-3 font-mono font-bold text-amber-900">{p.transactionRef}</td>
                      <td className="p-3 font-bold text-[#1a1612]">
                        {p.employeeAvatar} {p.employeeName}
                      </td>
                      <td className="p-3">
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-amber-300 border border-black">
                          {p.employeeRole}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{p.month}</td>
                      <td className="p-3 font-black text-emerald-900 text-sm">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-[#554e45]">
                        {new Date(p.paidAt).toLocaleDateString()}
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
      )}
        </div>
      </div>

      {/* UNIVERSAL MODAL: EDIT SALARY */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-typewriter">
          <div className="bg-[#fffdf9] border-4 border-[#1a1612] rounded-2xl p-6 max-w-md w-full newspaper-shadow-lg text-[#1a1612]">
            <div className="border-b-2 border-[#1a1612] pb-3 mb-4 flex items-center justify-between">
              <div>
                <span className="bg-[#1a1612] text-amber-300 text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                  COMPENSATION REGULATION
                </span>
                <h3 className="font-headline text-xl font-black uppercase text-[#1a1612] mt-0.5">
                  Update Monthly Salary
                </h3>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-xs bg-[#eee7d7] border border-[#1a1612] rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-red-800 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#eee7d7] p-3 rounded-lg border border-[#1a1612] mb-4 text-xs">
              <div className="font-bold text-sm">{editingEmployee.avatar} {editingEmployee.name}</div>
              <div className="text-[11px] text-[#554e45]">Role: <strong>{editingEmployee.role?.toUpperCase()}</strong></div>
              <div className="text-[11px] text-[#554e45]">Current Salary: ₹{Number(editingEmployee.salary || 25000).toLocaleString('en-IN')}/mo</div>
            </div>

            <form onSubmit={handleUpdateSalary} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  New Monthly Salary (₹):
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="500"
                  value={editSalaryAmount}
                  onChange={(e) => setEditSalaryAmount(e.target.value)}
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3.5 py-2.5 text-base font-black text-emerald-900 rounded focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
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

      {/* UNIVERSAL MODAL: DISBURSE SALARY */}
      {payingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-typewriter">
          <div className="bg-[#fffdf9] border-4 border-[#1a1612] rounded-2xl p-6 max-w-md w-full newspaper-shadow-lg text-[#1a1612]">
            <div className="border-b-2 border-[#1a1612] pb-3 mb-4 flex items-center justify-between">
              <div>
                <span className="bg-emerald-800 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                  OFFICIAL DISBURSEMENT
                </span>
                <h3 className="font-headline text-xl font-black uppercase text-[#1a1612] mt-0.5">
                  Disburse Monthly Salary
                </h3>
              </div>
              <button
                onClick={() => setPayingEmployee(null)}
                className="text-xs bg-[#eee7d7] border border-[#1a1612] rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-red-800 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#eee7d7] p-3 rounded-lg border border-[#1a1612] mb-4 text-xs space-y-1">
              <div className="font-bold text-sm">{payingEmployee.avatar} {payingEmployee.name}</div>
              <div className="text-[11px] text-[#554e45]">Role: <strong>{payingEmployee.role?.toUpperCase()}</strong> • {payingEmployee.department}</div>
              <div className="text-emerald-900 font-black text-base pt-1">
                Disbursement Amount: ₹{Number(payingEmployee.salary || 25000).toLocaleString('en-IN')}
              </div>
            </div>

            <form onSubmit={handleDisburseSalary} className="space-y-3.5 text-xs">
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
                  Disbursement Notes:
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Monthly Compensation"
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-semibold rounded focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingEmployee(null)}
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

      {/* PAYSLIP MODAL */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-typewriter">
          <div className="bg-[#fffdf9] border-4 border-[#1a1612] rounded-2xl p-6 sm:p-8 max-w-md w-full newspaper-shadow-lg text-[#1a1612]">
            <div className="border-b-4 border-[#1a1612] pb-3 mb-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#554e45]">
                ★ THE DAILY CULINARY CHRONICLE • PAYROLL DESK ★
              </div>
              <h3 className="font-headline text-2xl font-black uppercase text-[#1a1612] mt-0.5">
                Official Salary Voucher
              </h3>
              <div className="text-[10px] text-[#71695f] mt-0.5">
                Txn Ref: <code>{viewingSlip.transactionRef}</code>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-[#eee7d7] p-4 rounded-xl border border-[#1a1612] mb-4">
              <div className="flex justify-between border-b border-[#d1c7b7] pb-1.5">
                <span className="text-[#554e45]">Beneficiary Name:</span>
                <span className="font-bold text-[#1a1612]">{viewingSlip.employeeName || viewingSlip.managerName}</span>
              </div>
              <div className="flex justify-between border-b border-[#d1c7b7] pb-1.5">
                <span className="text-[#554e45]">Role:</span>
                <span className="font-bold uppercase text-[#1a1612]">{viewingSlip.employeeRole || 'Executive'}</span>
              </div>
              <div className="flex justify-between border-b border-[#d1c7b7] pb-1.5">
                <span className="text-[#554e45]">Billing Month:</span>
                <span className="font-bold text-[#1a1612]">{viewingSlip.month}</span>
              </div>
              <div className="flex justify-between border-b border-[#d1c7b7] pb-1.5">
                <span className="text-[#554e45]">Authorized By:</span>
                <span className="font-bold text-[#1a1612]">{viewingSlip.paidByName || viewingSlip.paidBy}</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-sm">
                <span className="font-black uppercase text-[#1a1612]">Net Paid:</span>
                <span className="font-headline font-black text-emerald-900 text-lg">
                  ₹{Number(viewingSlip.amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setViewingSlip(null)}
              className="w-full bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-bold py-2.5 rounded-xl text-xs uppercase border border-amber-400 cursor-pointer"
            >
              Close Voucher
            </button>
          </div>
        </div>
      )}

      {/* CEO DANGER ZONE MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn font-typewriter">
          <div className="bg-[#fffdf9] border-4 border-red-900 rounded-2xl p-6 sm:p-8 max-w-md w-full newspaper-shadow-lg text-[#1a1612]">
            <div className="border-b-2 border-red-900 pb-3 mb-4 text-center">
              <span className="text-3xl">⚠️</span>
              <h3 className="font-headline text-2xl font-black uppercase text-red-900 mt-1">
                CEO System Purge
              </h3>
              <p className="text-xs text-red-800 mt-1 font-bold">
                Irreversible Database Purge of All Accounts
              </p>
            </div>

            <div className="bg-red-50 border-2 border-red-800 p-4 rounded-xl text-xs text-red-950 space-y-2 mb-5">
              <p className="font-bold">This will permanently purge:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Root Account from <code>root_admins</code> table</li>
                <li>All General Managers & Payroll Officers</li>
                <li>All Chefs, Cashiers, Waiters, Carriers & Payroll history</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 bg-[#eee7d7] hover:bg-[#e4dac5] text-[#1a1612] font-bold py-2.5 px-4 rounded-xl text-xs uppercase border border-[#1a1612] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCEOResetDatabase}
                disabled={isResetting}
                className="flex-1 bg-red-900 hover:bg-red-800 text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase border-2 border-black cursor-pointer shadow disabled:opacity-50"
              >
                {isResetting ? 'Purging Database...' : '🔥 Purge Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RootExecutiveConsole;
