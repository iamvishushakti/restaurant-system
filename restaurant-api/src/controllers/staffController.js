const { Staff } = require('../models');
const { getDB, saveDB } = require('../config/database');
const { sendPasswordResetEmail, sendStaffLoginCodeEmail } = require('../services/emailService');

const ENV_ROOT_EMAIL = (process.env.ROOT_EMAIL || 'vkshakti.office@gmail.com').toLowerCase().trim();
const ENV_ROOT_PASSCODE = process.env.ROOT_PASSCODE || '1234';

// Temporary in-memory OTP store for staff login codes
const staffLoginOtpCache = new Map();

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 3) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 3)}*****@${domain}`;
};

/**
 * Reset Staff PIN & Send to Registered Email
 * @route POST /api/staff/reset-pin
 */
const resetStaffPin = async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = (email || ENV_ROOT_EMAIL || 'vkshakti.office@gmail.com').toLowerCase().trim();

    // Generate random 4-digit PIN
    const generatedPin = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    staffLoginOtpCache.set(targetEmail, {
      code: generatedPin,
      expiresAt,
    });

    // Also update in DB default staff
    const db = getDB();
    db.staff = db.staff || [];
    let defaultStaff = db.staff.find((s) => s.email?.toLowerCase() === targetEmail);
    if (defaultStaff) {
      defaultStaff.passcode = generatedPin;
      saveDB();
    }

    console.log(`🔑 [Staff PIN Reset Generated]: ${generatedPin} for email ${targetEmail}`);

    // Send email
    const emailResult = await sendStaffLoginCodeEmail(targetEmail, {
      code: generatedPin,
      name: 'Restaurant Staff Member',
    });

    const masked = maskEmail(targetEmail);

    return res.status(200).json({
      success: true,
      message: `New 4-digit PIN has been generated and sent to: ${targetEmail}`,
      targetEmail,
      maskedEmail: masked,
      emailSent: emailResult.success,
      demoPin: generatedPin, // For dev testing
    });
  } catch (error) {
    console.error('❌ [Reset PIN Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate and email new PIN.',
      error: error.message,
    });
  }
};


/**
 * Staff Unified Login Handler
 * Verifies 4-digit PIN (email is optional, defaults to registered staff email)
 * @route POST /api/staff/login
 */
const staffLogin = async (req, res) => {
  try {
    const { email, passcode } = req.body;

    if (!passcode) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your 4-Digit Duty PIN.',
      });
    }

    const cleanPass = passcode.toString().trim();
    const cleanEmail = (email || ENV_ROOT_EMAIL || 'vkshakti.office@gmail.com').toLowerCase().trim();

    // 1. Check if temporary OTP code matches and is valid across any email or target email
    let isOtpValid = false;
    for (const [em, otpData] of staffLoginOtpCache.entries()) {
      if (otpData.code === cleanPass && otpData.expiresAt > Date.now()) {
        isOtpValid = true;
        break;
      }
    }

    // 2. Check if matches master environment passcode (1234)
    const isMasterPasscode = cleanPass === ENV_ROOT_PASSCODE || cleanPass === '1234';

    // 3. Check DB staff collection
    const db = getDB();
    const staffMatch = (db.staff || []).find((s) => s.passcode === cleanPass || s.email?.toLowerCase() === cleanEmail);
    const isDbStaffPasscode = staffMatch && staffMatch.passcode === cleanPass;

    if (!isOtpValid && !isMasterPasscode && !isDbStaffPasscode) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 4-digit PIN. Please enter your valid PIN or click Reset PIN.',
      });
    }

    const displayName = staffMatch?.name || 'Staff Operator';

    const unifiedStaffUser = {
      staffId: staffMatch?.staffId || 'staff_unified_master',
      name: displayName,
      email: cleanEmail,
      role: 'staff',
      title: 'Restaurant Operations & Kitchen Lead',
      department: 'Restaurant Command',
      avatar: '👨‍🍳',
      permissions: ['dashboard', 'kitchen', 'tables', 'billing', 'waiter'],
    };

    const token = `STAFF-UNIFIED-TOKEN-${Date.now()}`;
    console.log(`🔐 [Unified Staff Login]: ${displayName} authenticated via 4-Digit PIN!`);

    return res.status(200).json({
      success: true,
      message: `Welcome, ${displayName}! Logged into Restaurant Command Station.`,
      token,
      staff: unifiedStaffUser,
    });
  } catch (error) {
    console.error('❌ [Staff Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error occurred.',
      error: error.message,
    });
  }
};

/**
 * Get All Staff Accounts List
 * @route GET /api/staff/list
 */
const getStaffList = async (req, res) => {
  try {
    const db = getDB();
    const staffList = db.staff || [];

    const sanitized = staffList.map((s) => ({
      staffId: s.staffId,
      name: s.name,
      email: s.email,
      role: s.role,
      allowedRoles: [s.role],
      department: s.department,
      avatar: s.avatar,
      phone: s.phone,
      salary: s.salary || 25000,
      salaryStatus: s.salaryStatus || 'PENDING',
      lastPaidDate: s.lastPaidDate,
      salaryHistory: s.salaryHistory || [],
      hiredBy: s.hiredBy,
      hiredByName: s.hiredByName,
      isActive: s.isActive !== false,
      createdAt: s.createdAt || s.hiredAt,
    }));

    return res.status(200).json({
      success: true,
      count: sanitized.length,
      staff: sanitized,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve staff list',
      error: error.message,
    });
  }
};

// =========================================================================
// 👑 ROOT ADMIN CONTROLLERS (Only Root can hire/manage Managers & Manager Salaries)
// =========================================================================

/**
 * Get Root Account Status
 * @route GET /api/staff/root-status
 */
const getRootStatus = async (req, res) => {
  try {
    const db = getDB();
    const rootAdmin = (db.staff || []).find((s) => s.role === 'root');
    const hasRoot = Boolean(rootAdmin);
    return res.status(200).json({
      success: true,
      hasRootAccount: hasRoot,
      rootEmail: rootAdmin ? rootAdmin.email : ENV_ROOT_EMAIL,
      rootName: rootAdmin ? rootAdmin.name : ENV_ROOT_NAME,
      rootAvatar: rootAdmin ? rootAdmin.avatar : '👑',
      defaultEnvRootEmail: ENV_ROOT_EMAIL,
      defaultEnvRootName: ENV_ROOT_NAME,
      defaultEnvRootPhone: ENV_ROOT_PHONE,
      defaultEnvRootPasscode: ENV_ROOT_PASSCODE,
      defaultEnvRootTitle: ENV_ROOT_TITLE,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get root status' });
  }
};

/**
 * Setup / Register Root Account
 * @route POST /api/staff/root-setup
 */
const setupRootAdmin = async (req, res) => {
  try {
    const {
      name = ENV_ROOT_NAME,
      email = ENV_ROOT_EMAIL,
      passcode = ENV_ROOT_PASSCODE,
      phone = ENV_ROOT_PHONE,
      title = ENV_ROOT_TITLE,
      avatar = '👑',
    } = req.body;

    const finalName = (name || ENV_ROOT_NAME).trim();
    const finalEmail = (email || ENV_ROOT_EMAIL).toLowerCase().trim();
    const finalPasscode = (passcode || ENV_ROOT_PASSCODE).toString().trim();
    const finalPhone = (phone || ENV_ROOT_PHONE).toString().trim();
    const finalTitle = (title || ENV_ROOT_TITLE).trim();

    if (!finalName || !finalEmail || !finalPasscode) {
      return res.status(400).json({
        success: false,
        message: 'Proprietor Name, Email, and Passcode are required.',
      });
    }

    const db = getDB();
    db.staff = db.staff || [];

    const existingIdx = db.staff.findIndex((s) => s.role === 'root' || s.email?.toLowerCase() === finalEmail);
    const rootRecord = {
      staffId: existingIdx >= 0 ? db.staff[existingIdx].staffId : `ROOT-${Date.now().toString().slice(-4)}`,
      name: finalName,
      email: finalEmail,
      passcode: finalPasscode,
      role: 'root',
      allowedRoles: ['root'],
      title: finalTitle,
      department: 'Executive Ownership Desk',
      phone: finalPhone,
      avatar,
      permissions: ['manage_managers', 'system_root', 'audit_logs', 'override_all'],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      db.staff[existingIdx] = { ...db.staff[existingIdx], ...rootRecord };
    } else {
      db.staff.push(rootRecord);
    }
    saveDB();

    try {
      await Staff.findOneAndUpdate({ email: rootRecord.email }, { ...rootRecord, role: 'root' }, { upsert: true });
    } catch (e) {}

    console.log(`👑 [Root Account Configured]: ${finalName} (${finalEmail}) saved in staff collection`);

    return res.status(200).json({
      success: true,
      message: `Root Account for ${finalName} configured successfully!`,
      root: rootRecord,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to configure root account',
      error: error.message,
    });
  }
};

/**
 * Purge / Reset All Staff & Root Accounts
 * @route POST /api/staff/reset-all
 */
const resetAllStaff = async (req, res) => {
  try {
    const db = getDB();
    db.staff = [];
    saveDB();

    try {
      await Staff.deleteMany({});
    } catch (e) {}

    console.log(`🧹 [SYSTEM RESET]: All Staff accounts purged. Fresh setup required!`);

    return res.status(200).json({
      success: true,
      message: 'All staff and root accounts successfully deleted. System is ready for fresh setup.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reset accounts',
      error: error.message,
    });
  }
};

/**
 * Get All Executives / Managers & Payroll Officers (Root View)
 * @route GET /api/staff/managers
 */
const getManagers = async (req, res) => {
  try {
    const db = getDB();
    const managers = (db.staff || []).filter((s) => s.role === 'manager' || s.role === 'payroll');
    return res.status(200).json({
      success: true,
      count: managers.length,
      managers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve executives',
      error: error.message,
    });
  }
};

/**
 * Root Hires/Creates a New Executive (General Manager or Corporate Payroll Officer)
 * Exclusively controlled by CEO / Root
 * @route POST /api/staff/managers
 */
const createManager = async (req, res) => {
  try {
    const {
      name,
      email,
      role = 'manager', // 'manager' or 'payroll'
      passcode = '1234',
      phone = '9811000000',
      department,
      salary,
      avatar,
      rootEmail = 'root@chronicle.com',
      rootName = 'Lord Arthur Sterling (Root)',
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and Email are required',
      });
    }

    if (!['manager', 'payroll'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid executive role. Root can appoint: manager, payroll',
      });
    }

    const db = getDB();
    db.staff = db.staff || [];

    if (db.staff.some((s) => s.email.toLowerCase() === email.toLowerCase().trim())) {
      return res.status(400).json({
        success: false,
        message: `A staff member or executive with email ${email} already exists`,
      });
    }

    const isPayroll = role === 'payroll';
    const defaultSalary = isPayroll ? 65000 : 75000;
    const defaultAvatar = isPayroll ? '💰' : '👨‍💼';
    const defaultDept = isPayroll ? 'Corporate Payroll & Treasury' : 'Executive Administration';
    const rolePrefix = isPayroll ? 'PAY' : 'MGR';

    const staffId = `STF-${rolePrefix}-${Date.now().toString().slice(-4)}`;
    const newExecutive = {
      staffId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passcode: passcode.toString().trim(),
      role,
      allowedRoles: [role],
      department: department || defaultDept,
      phone,
      avatar: avatar || defaultAvatar,
      salary: Number(salary) || defaultSalary,
      salaryStatus: 'PENDING',
      lastPaidDate: null,
      salaryHistory: [],
      hiredBy: rootEmail,
      hiredByName: rootName,
      hiredAt: new Date().toISOString(),
      isActive: true,
    };

    db.staff.push(newExecutive);
    saveDB();

    try {
      await Staff.create(newExecutive);
    } catch (mErr) {}

    console.log(`👑 [Root Hired Executive]: ${name} (${email}) appointed as [${role.toUpperCase()}] with salary ₹${newExecutive.salary}/mo`);

    return res.status(201).json({
      success: true,
      message: `${isPayroll ? 'Corporate Payroll Officer' : 'General Manager'} ${name} commissioned successfully!`,
      manager: newExecutive,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to appoint executive',
      error: error.message,
    });
  }
};

/**
 * Root Updates Executive (Manager or Payroll Officer) Salary
 * @route PUT /api/staff/managers/:staffId/salary
 */
const updateManagerSalary = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { salary } = req.body;

    const db = getDB();
    const manager = (db.staff || []).find(
      (s) => s.staffId === staffId && (s.role === 'manager' || s.role === 'payroll')
    );

    if (!manager) {
      return res.status(404).json({ success: false, message: 'Executive not found' });
    }

    manager.salary = Number(salary) || manager.salary;
    saveDB();

    try {
      await Staff.findOneAndUpdate({ staffId }, { salary: manager.salary });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Monthly salary for ${manager.name} (${manager.role.toUpperCase()}) updated to ₹${manager.salary.toLocaleString('en-IN')}`,
      manager,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update executive salary' });
  }
};

/**
 * Root Disburses / Pays Salary to an Executive (Manager or Payroll Officer)
 * @route POST /api/staff/managers/:staffId/pay-salary
 */
const payManagerSalary = async (req, res) => {
  try {
    const { staffId } = req.params;
    const {
      month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      notes = 'Monthly Executive Salary Disbursement',
      paidBy = 'Lord Arthur Sterling (Root)',
    } = req.body;

    const db = getDB();
    const manager = (db.staff || []).find(
      (s) => s.staffId === staffId && (s.role === 'manager' || s.role === 'payroll')
    );

    if (!manager) {
      return res.status(404).json({ success: false, message: 'Executive not found' });
    }

    const paymentRecord = {
      month,
      amount: manager.salary || (manager.role === 'payroll' ? 65000 : 75000),
      paidAt: new Date().toISOString(),
      paidBy,
      paidByName: paidBy,
      transactionRef: `PAY-${manager.role.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`,
      notes,
    };

    manager.salaryHistory = manager.salaryHistory || [];
    manager.salaryHistory.unshift(paymentRecord);
    manager.salaryStatus = 'PAID';
    manager.lastPaidDate = paymentRecord.paidAt;
    saveDB();

    try {
      await Staff.findOneAndUpdate(
        { staffId },
        {
          salaryStatus: 'PAID',
          lastPaidDate: new Date(),
          $push: { salaryHistory: paymentRecord },
        }
      );
    } catch (e) {}

    console.log(`💰 [Salary Paid to Executive]: ₹${paymentRecord.amount} disbursed to ${manager.name} (${manager.role}) for ${month}`);

    return res.status(200).json({
      success: true,
      message: `Salary of ₹${paymentRecord.amount.toLocaleString('en-IN')} paid to ${manager.name} for ${month}!`,
      payment: paymentRecord,
      manager,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to pay executive salary' });
  }
};

/**
 * Root Deletes/Offboards an Executive (Manager or Payroll Officer)
 * @route DELETE /api/staff/managers/:staffId
 */
const deleteManager = async (req, res) => {
  try {
    const { staffId } = req.params;
    const db = getDB();
    const idx = (db.staff || []).findIndex(
      (s) => s.staffId === staffId && (s.role === 'manager' || s.role === 'payroll')
    );

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Executive not found' });
    }

    const removed = db.staff.splice(idx, 1)[0];
    saveDB();

    try {
      await Staff.findOneAndDelete({ staffId });
    } catch (e) {}

    console.log(`👑 [Root Offboarded Executive]: ${removed.name} (${removed.role}) removed by Root`);

    return res.status(200).json({
      success: true,
      message: `Executive ${removed.name} (${removed.role.toUpperCase()}) has been offboarded`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete executive',
      error: error.message,
    });
  }
};

// =========================================================================
// 👨‍💼 MANAGER RECRUITMENT & PAYROLL CONTROLLERS (Chefs, Cashiers, Waiters, Carriers)
// =========================================================================

/**
 * Get All Crew Members Hired by Manager
 * @route GET /api/staff/crew
 */
const getCrewMembers = async (req, res) => {
  try {
    const db = getDB();
    const crew = (db.staff || []).filter((s) => s.role !== 'manager');
    return res.status(200).json({
      success: true,
      count: crew.length,
      crew,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve crew members',
      error: error.message,
    });
  }
};

/**
 * Manager Hires a New Crew Member (Chef, Cashier, Waiter, Carrier)
 * @route POST /api/staff/crew
 */
const createCrewMember = async (req, res) => {
  try {
    const {
      name,
      email,
      role, // chef, cashier, waiter, carrier
      passcode = '1234',
      phone = '9800000000',
      department,
      salary,
      managerEmail = 'manager@chronicle.com',
      managerName = 'General Manager Vikram',
    } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, Email, and Staff Role are required',
      });
    }

    if (!['chef', 'cashier', 'waiter', 'carrier'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Managers can hire: chef, cashier, waiter, carrier',
      });
    }

    const db = getDB();
    db.staff = db.staff || [];

    if (db.staff.some((s) => s.email.toLowerCase() === email.toLowerCase().trim())) {
      return res.status(400).json({
        success: false,
        message: `A staff member with email ${email} already exists`,
      });
    }

    const defaultSalaries = {
      chef: 45000,
      cashier: 30000,
      waiter: 22000,
      carrier: 18000,
    };

    const roleAvatars = {
      chef: '👨‍🍳',
      cashier: '🧾',
      waiter: '🛎️',
      carrier: '📦',
    };

    const roleDepts = {
      chef: 'Gourmet Kitchen Brigade',
      cashier: 'Front Billing & Fiscal Counter',
      waiter: 'Dining Hall Floor Service',
      carrier: 'Expediter & Runner Team',
    };

    const rolePrefixes = {
      chef: 'CHF',
      cashier: 'CSH',
      waiter: 'WTR',
      carrier: 'CAR',
    };

    const staffId = `STF-${rolePrefixes[role]}-${Date.now().toString().slice(-4)}`;
    const newStaff = {
      staffId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passcode: passcode.toString().trim(),
      role,
      allowedRoles: [role],
      department: department || roleDepts[role],
      phone,
      avatar: roleAvatars[role],
      salary: Number(salary) || defaultSalaries[role] || 25000,
      salaryStatus: 'PENDING',
      lastPaidDate: null,
      salaryHistory: [],
      hiredBy: managerEmail,
      hiredByName: managerName,
      hiredAt: new Date().toISOString(),
      isActive: true,
    };

    db.staff.push(newStaff);
    saveDB();

    try {
      await Staff.create(newStaff);
    } catch (mErr) {}

    console.log(`👨‍💼 [Manager Hired Staff]: ${name} recruited as [${role.toUpperCase()}] with salary ₹${newStaff.salary}/mo`);

    return res.status(201).json({
      success: true,
      message: `${role.toUpperCase()} ${name} recruited successfully by ${managerName}!`,
      staff: newStaff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to recruit staff member',
      error: error.message,
    });
  }
};

/**
 * Manager Updates Crew Salary
 * @route PUT /api/staff/crew/:staffId/salary
 */
const updateCrewSalary = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { salary } = req.body;

    const db = getDB();
    const staff = (db.staff || []).find((s) => s.staffId === staffId && s.role !== 'manager');

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Crew member not found' });
    }

    staff.salary = Number(salary) || staff.salary;
    saveDB();

    try {
      await Staff.findOneAndUpdate({ staffId }, { salary: staff.salary });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Monthly salary for ${staff.name} (${staff.role.toUpperCase()}) updated to ₹${staff.salary.toLocaleString('en-IN')}`,
      staff,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update crew salary' });
  }
};

/**
 * Manager Disburses / Pays Salary to a Crew Member
 * @route POST /api/staff/crew/:staffId/pay-salary
 */
const payCrewSalary = async (req, res) => {
  try {
    const { staffId } = req.params;
    const {
      month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      notes = 'Monthly Crew Staff Salary Disbursement',
      paidBy = 'General Manager Vikram',
    } = req.body;

    const db = getDB();
    const staff = (db.staff || []).find((s) => s.staffId === staffId && s.role !== 'manager');

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Crew member not found' });
    }

    const paymentRecord = {
      month,
      amount: staff.salary || 25000,
      paidAt: new Date().toISOString(),
      paidBy,
      paidByName: paidBy,
      transactionRef: `PAY-${staff.role.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`,
      notes,
    };

    staff.salaryHistory = staff.salaryHistory || [];
    staff.salaryHistory.unshift(paymentRecord);
    staff.salaryStatus = 'PAID';
    staff.lastPaidDate = paymentRecord.paidAt;
    saveDB();

    try {
      await Staff.findOneAndUpdate(
        { staffId },
        {
          salaryStatus: 'PAID',
          lastPaidDate: new Date(),
          $push: { salaryHistory: paymentRecord },
        }
      );
    } catch (e) {}

    console.log(`💰 [Salary Paid to Crew]: ₹${paymentRecord.amount} disbursed to ${staff.name} (${staff.role.toUpperCase()}) for ${month}`);

    return res.status(200).json({
      success: true,
      message: `Salary of ₹${paymentRecord.amount.toLocaleString('en-IN')} paid to ${staff.name} for ${month}!`,
      payment: paymentRecord,
      staff,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to pay crew salary' });
  }
};

/**
 * Manager Toggles Crew Active / Inactive Status
 * @route PUT /api/staff/crew/:staffId/status
 */
const updateCrewStatus = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { isActive } = req.body;
    const db = getDB();
    const staff = (db.staff || []).find((s) => s.staffId === staffId);

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    staff.isActive = Boolean(isActive);
    saveDB();

    try {
      await Staff.findOneAndUpdate({ staffId }, { isActive: Boolean(isActive) });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Staff member ${staff.name} is now ${staff.isActive ? 'Active' : 'Deactivated'}`,
      staff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update staff status',
      error: error.message,
    });
  }
};

/**
 * Manager Deletes/Offboards a Crew Member
 * @route DELETE /api/staff/crew/:staffId
 */
const deleteCrewMember = async (req, res) => {
  try {
    const { staffId } = req.params;
    const db = getDB();
    const idx = (db.staff || []).findIndex((s) => s.staffId === staffId && s.role !== 'manager');

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Crew member not found' });
    }

    const removed = db.staff.splice(idx, 1)[0];
    saveDB();

    try {
      await Staff.findOneAndDelete({ staffId });
    } catch (e) {}

    console.log(`👨‍💼 [Manager Offboarded Staff]: ${removed.name} removed from crew`);

    return res.status(200).json({
      success: true,
      message: `Staff member ${removed.name} (${removed.role.toUpperCase()}) has been offboarded`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete crew member',
      error: error.message,
    });
  }
};

/**
 * Update Profile for Logged-In User (Root CEO, Manager, or Crew Member)
 * @route PUT /api/staff/profile
 */
const updateStaffProfile = async (req, res) => {
  try {
    const {
      email,
      name,
      phone,
      department,
      avatar,
      currentPasscode,
      newPasscode,
    } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email identifier is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = getDB();
    db.staff = db.staff || [];

    // Check Staff Account (includes Root CEO, General Managers, and Crew)
    const staff = db.staff.find((s) => s.email?.toLowerCase() === cleanEmail);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    if (newPasscode) {
      if (!currentPasscode || staff.passcode !== currentPasscode.toString().trim()) {
        return res.status(401).json({ success: false, message: 'Current passcode is incorrect.' });
      }
      staff.passcode = newPasscode.toString().trim();
      sendPasswordResetEmail(staff.email, {
        name: name || staff.name,
        role: staff.role === 'root' ? 'Company Owner & CEO' : staff.role,
        newPasscode: staff.passcode,
        resetTime: new Date(),
      }).catch((e) => {});
    }

    if (name) staff.name = name.trim();
    if (phone !== undefined) staff.phone = phone.toString().trim();
    if (department) staff.department = department.trim();
    if (avatar) staff.avatar = avatar;

    saveDB();
    try {
      await Staff.findOneAndUpdate({ email: staff.email }, staff, { upsert: true });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `${staff.role === 'root' ? 'CEO' : 'Staff'} Profile updated successfully!`,
      staff: {
        staffId: staff.staffId,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        allowedRoles: staff.allowedRoles || [staff.role],
        department: staff.department,
        avatar: staff.avatar,
        phone: staff.phone,
        salary: staff.salary || 25000,
        salaryStatus: staff.salaryStatus || 'PENDING',
        lastPaidDate: staff.lastPaidDate,
        hiredBy: staff.hiredBy,
        hiredByName: staff.hiredByName,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

module.exports = {
  resetStaffPin,
  staffLogin,
  updateStaffProfile,
  getStaffList,
  getRootStatus,
  setupRootAdmin,
  resetAllStaff,
  getManagers,
  createManager,
  updateManagerSalary,
  payManagerSalary,
  deleteManager,
  getCrewMembers,
  createCrewMember,
  updateCrewSalary,
  payCrewSalary,
  updateCrewStatus,
  deleteCrewMember,
};


