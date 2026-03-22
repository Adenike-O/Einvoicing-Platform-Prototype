import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import businessRouter from "./business";
import customersRouter from "./customers";
import invoicesRouter from "./invoices";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/business", businessRouter);
router.use("/customers", customersRouter);
router.use("/invoices", invoicesRouter);

export default router;
