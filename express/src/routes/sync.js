const { Router } = require('express');
const syncController = require('../controllers/sync.controller');
const { validate, pushSchema } = require('../middleware/validate');

const router = Router();

router.post('/push', validate(pushSchema), syncController.push);
router.get('/pull',  syncController.pull);

module.exports = router;
