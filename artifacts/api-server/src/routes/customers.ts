import { Router, type IRouter } from "express";
import { db, customersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { z } from "zod/v4";

const router: IRouter = Router();

const SIMULATED_FIRS_TIN_DATA: Record<string, { name: string; address: string; registrationStatus: string }> = {
  "12345678901": { name: "Dangote Industries Ltd", address: "1 Dangote House, Victoria Island, Lagos", registrationStatus: "Active" },
  "23456789012": { name: "MTN Nigeria Communications PLC", address: "MTN Plaza, Falomo, Ikoyi, Lagos", registrationStatus: "Active" },
  "34567890123": { name: "Zenith Bank PLC", address: "Plot 87, Ajose Adeogun Street, Victoria Island, Lagos", registrationStatus: "Active" },
  "45678901234": { name: "Nigerian Breweries PLC", address: "1 Abebe Village Road, Iganmu, Lagos", registrationStatus: "Active" },
  "56789012345": { name: "First Bank of Nigeria Ltd", address: "35 Marina Street, Lagos Island, Lagos", registrationStatus: "Active" },
  "67890123456": { name: "Flour Mills of Nigeria PLC", address: "2 Old Dock Road, Apapa, Lagos", registrationStatus: "Active" },
  "78901234567": { name: "Guaranty Trust Bank PLC", address: "Guaranty House, Plot 635, Akin Adesola Street, VI, Lagos", registrationStatus: "Active" },
  "89012345678": { name: "Access Bank PLC", address: "14/15 Prince Alaba Abiodun Oniru Road, Victoria Island, Lagos", registrationStatus: "Active" },
  "90123456789": { name: "United Bank for Africa PLC", address: "57 Marina Street, Lagos Island, Lagos", registrationStatus: "Active" },
};

const customerSchema = z.object({
  name: z.string().min(1),
  tin: z.string().min(8),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().min(1),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
});

router.get("/", requireAuth, async (req, res) => {
  const customers = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.userId, req.userId!))
    .orderBy(customersTable.createdAt);

  res.json(customers.map((c) => ({
    id: c.id,
    userId: c.userId,
    name: c.name,
    tin: c.tin,
    email: c.email,
    phone: c.phone,
    address: c.address,
    city: c.city,
    state: c.state,
    createdAt: c.createdAt,
  })));
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: "Invalid customer data" });
    return;
  }

  const [customer] = await db
    .insert(customersTable)
    .values({ userId: req.userId!, ...parsed.data })
    .returning();

  res.status(201).json({
    id: customer.id,
    userId: customer.userId,
    name: customer.name,
    tin: customer.tin,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    createdAt: customer.createdAt,
  });
});

router.get("/tin/:tin", requireAuth, async (req, res) => {
  const { tin } = req.params;

  await new Promise((resolve) => setTimeout(resolve, 1200));

  const localMatch = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.userId, req.userId!), eq(customersTable.tin, tin)))
    .limit(1);

  if (localMatch.length > 0) {
    const c = localMatch[0];
    res.json({
      found: true,
      tin,
      name: c.name,
      address: c.address,
      registrationStatus: "Active",
    });
    return;
  }

  const firsData = SIMULATED_FIRS_TIN_DATA[tin];
  if (firsData) {
    res.json({
      found: true,
      tin,
      name: firsData.name,
      address: firsData.address,
      registrationStatus: firsData.registrationStatus,
    });
    return;
  }

  const isValidFormat = /^\d{10,14}$/.test(tin);
  if (isValidFormat && tin.length >= 10) {
    res.json({
      found: false,
      tin,
      name: null,
      address: null,
      registrationStatus: null,
    });
    return;
  }

  res.json({ found: false, tin, name: null, address: null, registrationStatus: null });
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Bad Request", message: "Invalid ID" });
    return;
  }

  const updateSchema = z.object({
    name: z.string().min(1).optional(),
    tin: z.string().min(8).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().min(1).optional(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
  });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: "Invalid data" });
    return;
  }

  const [existing] = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.id, id), eq(customersTable.userId, req.userId!)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Not Found", message: "Customer not found" });
    return;
  }

  const [customer] = await db
    .update(customersTable)
    .set(parsed.data)
    .where(eq(customersTable.id, id))
    .returning();

  res.json({
    id: customer.id,
    userId: customer.userId,
    name: customer.name,
    tin: customer.tin,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    createdAt: customer.createdAt,
  });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Bad Request", message: "Invalid ID" });
    return;
  }

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.id, id), eq(customersTable.userId, req.userId!)))
    .limit(1);

  if (!customer) {
    res.status(404).json({ error: "Not Found", message: "Customer not found" });
    return;
  }

  res.json({
    id: customer.id,
    userId: customer.userId,
    name: customer.name,
    tin: customer.tin,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    createdAt: customer.createdAt,
  });
});

export default router;
