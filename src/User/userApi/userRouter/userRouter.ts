import express, { Router } from 'express';
import UserController from './userController';
import AuthenticateSession from '../../Middleware/authentication';

const router: Router = express.Router();
const user = new UserController();

router.post('/register-shiv-user', user.shivRegisterUser);

//Authentication
router.post('/signin', user.authUser);

/* Profile */
router.get('/get-user-details', AuthenticateSession, user.getUserDetails);
router.get('/get-particuleruser-details', AuthenticateSession, user.getParticulerUserDetails);
router.post('/correctionBalance',user.correctionBalance);

/* Manage User And Masters*/

router.post('/create-sub-user', AuthenticateSession, user.createSubUser);
router.get('/get-masters', AuthenticateSession, user.getMaster);
router.get('/downline-user', user.downlineUser);

export default router;