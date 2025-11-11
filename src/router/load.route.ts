import express, { Router } from "express";

const loadRoute: Router = express.Router();
import userRoute from "./user/auth/auth.route"
import otmRoute from "./user/otm/otm.route"
import shopifyRouter from "./user/shopify/shopify.route"
import otmPaymentRouter from "./user/otmPayment/otmPaymentRoute";

interface RouteConfig {
    prefix: string;
    route: Router;
    middleware?: any;
}

const defaultRoutes: RouteConfig[] = [
      {
        prefix:"/auth",
        route:userRoute
      },
      {
        prefix:"/otm",
        route:otmRoute
      },{
        prefix:"/shopifyRouter",
        route:shopifyRouter
      },{
        prefix:"/otmpayment",
        route:otmPaymentRouter
      }
   
];

defaultRoutes.forEach((route) => {
    if (route.middleware) {
        loadRoute.use(route.prefix, route.middleware, route.route);
    } else {
        loadRoute.use(route.prefix, route.route);
    }
});

export default loadRoute;
