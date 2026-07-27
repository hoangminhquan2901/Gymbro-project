const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');

router.get('/', goalController.getAllGoals);
router.get('/:id', goalController.getGoalById);
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

module.exports = router;