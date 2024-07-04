import { Application } from 'express';
 import router from './userApi/userRouter/userRouter'

/**
 * RequestHandler extends app to handle routes using specific express router
 * 
 * @param app Application
 * @returns void
 */
const RequestHandler = (app: Application): void => {
	app.use('/api/user', router);
};

export default RequestHandler;