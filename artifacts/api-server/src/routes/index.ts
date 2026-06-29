import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import masterRouter from "./master";
import usersRouter from "./users";
import bookingsRouter from "./bookings";
import fleetRouter from "./fleet";
import driversRouter from "./drivers";
import vendorsRouter from "./vendors";
import crmRouter from "./crm";
import customersRouter from "./customers";
import toursRouter from "./tours";
import financeRouter from "./finance";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(masterRouter);
router.use(usersRouter);
router.use(bookingsRouter);
router.use(fleetRouter);
router.use(driversRouter);
router.use(vendorsRouter);
router.use(crmRouter);
router.use(customersRouter);
router.use(toursRouter);
router.use(financeRouter);
router.use(dashboardRouter);

export default router;
