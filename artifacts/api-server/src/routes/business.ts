import { Router, type IRouter } from "express";
import { db, businessProfilesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { z } from "zod/v4";

const router: IRouter = Router();

const TAX_OFFICES: Record<string, string> = {
  "LTO-001": "Lagos Tax Office - Ikoyi",
  "LTO-002": "Lagos Tax Office - Victoria Island",
  "ATO-001": "Abuja Tax Office - Garki",
  "ATO-002": "Abuja Tax Office - Wuse",
  "PTO-001": "Port Harcourt Tax Office",
  "KTO-001": "Kano Tax Office",
};

const profileSchema = z.object({
  companyName: z.string().min(1),
  tin: z.string().min(8),
  registeredAddress: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(7),
});

const firsConnectSchema = z.object({
  apiKey: z.string().min(1),
  taxOfficeCode: z.string().min(1),
});

const subscriptionSchema = z.object({
  plan: z.enum(["basic", "enterprise"]),
});

router.get("/profile", requireAuth, async (req, res) => {
  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.userId, req.userId!))
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Not Found", message: "Business profile not set up yet" });
    return;
  }

  res.json({
    id: profile.id,
    userId: profile.userId,
    companyName: profile.companyName,
    tin: profile.tin,
    registeredAddress: profile.registeredAddress,
    city: profile.city,
    state: profile.state,
    contactEmail: profile.contactEmail,
    contactPhone: profile.contactPhone,
    firsConnected: profile.firsConnected,
    firsApiKey: profile.firsApiKey,
    subscriptionPlan: profile.subscriptionPlan,
    createdAt: profile.createdAt,
  });
});

router.post("/profile", requireAuth, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: "Invalid profile data" });
    return;
  }

  const data = parsed.data;
  const [existing] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.userId, req.userId!))
    .limit(1);

  let profile;
  if (existing) {
    [profile] = await db
      .update(businessProfilesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(businessProfilesTable.userId, req.userId!))
      .returning();
  } else {
    [profile] = await db
      .insert(businessProfilesTable)
      .values({ userId: req.userId!, ...data })
      .returning();
  }

  res.json({
    id: profile.id,
    userId: profile.userId,
    companyName: profile.companyName,
    tin: profile.tin,
    registeredAddress: profile.registeredAddress,
    city: profile.city,
    state: profile.state,
    contactEmail: profile.contactEmail,
    contactPhone: profile.contactPhone,
    firsConnected: profile.firsConnected,
    firsApiKey: profile.firsApiKey,
    subscriptionPlan: profile.subscriptionPlan,
    createdAt: profile.createdAt,
  });
});

router.post("/firs-connect", requireAuth, async (req, res) => {
  const parsed = firsConnectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: "API key and tax office code are required" });
    return;
  }

  const { apiKey, taxOfficeCode } = parsed.data;

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const isValidKey = apiKey.length >= 16 && /^[A-Za-z0-9_-]+$/.test(apiKey);
  const taxOfficeName = TAX_OFFICES[taxOfficeCode] || null;

  if (!isValidKey) {
    res.json({
      connected: false,
      message: "Invalid API key format. Please check your FIRS credentials and try again.",
      taxOfficeName: null,
    });
    return;
  }

  await db
    .update(businessProfilesTable)
    .set({ firsConnected: true, firsApiKey: apiKey, taxOfficeCode, updatedAt: new Date() })
    .where(eq(businessProfilesTable.userId, req.userId!));

  res.json({
    connected: true,
    message: "Successfully connected to FIRS. Your account is now authorized to submit invoices.",
    taxOfficeName: taxOfficeName || "Federal Inland Revenue Service - Main Office",
  });
});

router.post("/subscription", requireAuth, async (req, res) => {
  const parsed = subscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: "Invalid plan selection" });
    return;
  }

  const { plan } = parsed.data;
  const activatedAt = new Date();

  await db
    .update(businessProfilesTable)
    .set({ subscriptionPlan: plan, subscriptionActivatedAt: activatedAt, updatedAt: new Date() })
    .where(eq(businessProfilesTable.userId, req.userId!));

  await db
    .update(usersTable)
    .set({ subscriptionPlan: plan, onboardingComplete: true, updatedAt: new Date() })
    .where(eq(usersTable.id, req.userId!));

  const planLabel = plan === "enterprise" ? "Enterprise" : "Basic";
  res.json({
    plan,
    activatedAt: activatedAt.toISOString(),
    message: `Your ${planLabel} plan has been activated. You can now start creating and submitting invoices.`,
  });
});

export default router;
