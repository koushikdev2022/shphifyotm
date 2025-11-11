import express, { Router } from 'express';
import {
  authenticateOMT,
  refreshTokenOMT,
  initiatePaymentOMT,
  getPaymentStatusOMT,
} from '../../../controller/api/user/otm/otm.controller';

const otmRoute: Router = express.Router();

otmRoute.post('/authenticate', authenticateOMT);
otmRoute.post('/refresh-token', refreshTokenOMT);
otmRoute.post('/payments/initiate', initiatePaymentOMT);
otmRoute.post('/payments/status', getPaymentStatusOMT);

export default otmRoute;
