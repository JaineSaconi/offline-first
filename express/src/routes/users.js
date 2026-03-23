const { Router } = require('express');
const usersController = require('../controllers/users.controller');
const { validate, userCreateSchema, userUpdateSchema } = require('../middleware/validate');

const router = Router();

router.get('/',     usersController.list);
router.post('/',    validate(userCreateSchema), usersController.create);
router.put('/:id',  validate(userUpdateSchema), usersController.update);
router.delete('/:id', usersController.remove);

module.exports = router;
