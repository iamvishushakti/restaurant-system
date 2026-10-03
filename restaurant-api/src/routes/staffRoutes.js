const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/staffController');

// Staff Unified Authentication & Directory
router.post('/reset-pin', resetStaffPin);
router.post('/login', staffLogin);
router.put('/profile', updateStaffProfile);
router.get('/list', getStaffList);
router.post('/reset-all', resetAllStaff);

// 👑 Root Admin Lifecycle & Operations (Lord Arthur Sterling managing General Managers & Manager Salaries)
router.get('/root-status', getRootStatus);
router.post('/root-setup', setupRootAdmin);
router.get('/managers', getManagers);
router.post('/managers', createManager);
router.put('/managers/:staffId/salary', updateManagerSalary);
router.post('/managers/:staffId/pay-salary', payManagerSalary);
router.delete('/managers/:staffId', deleteManager);

// 👨‍💼 Manager Operations (General Manager recruiting and managing Crew & Payroll)
router.get('/crew', getCrewMembers);
router.post('/crew', createCrewMember);
router.put('/crew/:staffId/salary', updateCrewSalary);
router.post('/crew/:staffId/pay-salary', payCrewSalary);
router.put('/crew/:staffId/status', updateCrewStatus);
router.delete('/crew/:staffId', deleteCrewMember);

module.exports = router;


