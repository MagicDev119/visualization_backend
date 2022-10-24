const router = require("express").Router()
const userController = require('../controllers/userController')
const { verifyAuthenticateToken } = require('../utils/jwt.utils');

router.post('/', userController.store)
router.post('/login', userController.login)
router.get('/', verifyAuthenticateToken, userController.getUser)
router.put('/', verifyAuthenticateToken, userController.update)
router.get('/logout', verifyAuthenticateToken, userController.logout)

module.exports = router