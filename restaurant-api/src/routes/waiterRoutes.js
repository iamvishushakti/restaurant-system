const express = require('express');
const router = express.Router();
const { getCalls, createCall, updateCallStatus } = require('../controllers/waiterCallController');

router.get('/calls', getCalls);
router.post('/call', createCall);
router.put('/calls/:callId/status', updateCallStatus);

module.exports = router;
