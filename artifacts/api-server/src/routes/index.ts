import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import { getUserFromToken } from "./auth";
import masterRouter from "./master";
import usersRouter from "./users";
import bookingsRouter from "./bookings";
import fleetRouter from "./fleet";
import fastagRouter from "./fastag";
import driversRouter from "./drivers";
import vendorsRouter from "./vendors";
import crmRouter from "./crm";
import customersRouter from "./customers";
import toursRouter from "./tours";
import financeRouter from "./finance";
import dashboardRouter from "./dashboard";
import cmsRouter from "./cms";

const router: IRouter = Router();

// Global auth middleware — attaches req.user from Bearer token on every request.
// Routes that need authentication check req.user themselves; public routes ignore it.
router.use(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = await getUserFromToken(token);
    if (user) {
      (req as any).user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId ?? null,
      };
    }
  }
  next();
});

router.use(healthRouter);
router.use(authRouter);
router.use(masterRouter);
router.use(usersRouter);
router.use(bookingsRouter);
router.use(fleetRouter);
router.use(fastagRouter);
router.use(driversRouter);
router.use(vendorsRouter);
router.use(crmRouter);
router.use(customersRouter);
router.use(toursRouter);
router.use(financeRouter);
router.use(dashboardRouter);
router.use(cmsRouter);

export default router;
