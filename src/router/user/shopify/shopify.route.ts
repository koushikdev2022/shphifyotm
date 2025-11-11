import express,{Router} from "express";
const shopifyRouter:Router = express.Router();
import {
  initiateInstallation,
  handleOAuthCallback,
  getShopInfo,
  uninstallApp
} from "../../../controller/api/user/shppify/shopify.controller";


shopifyRouter.get('/install', initiateInstallation);
shopifyRouter.get('/auth/callback', handleOAuthCallback);
shopifyRouter.post('/webhooks/app-uninstalled', express.raw({ type: 'application/json' }), uninstallApp);
shopifyRouter.get('/shop/info', getShopInfo);


export default shopifyRouter;
