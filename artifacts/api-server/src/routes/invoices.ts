import { Router, type IRouter } from "express";
import { db, invoicesTable, customersTable, businessProfilesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { generateFirsReferenceId } from "../lib/auth";
import { z } from "zod/v4";

const router: IRouter = Router();

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  vatRate: z.number().nonnegative(),
  amount: z.number().nonnegative(),
});

const invoiceSchema = z.object({
  customerId: z.number().int().positive(),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string(),
  dueDate: z.string().optional().nullable(),
  lineItems: z.array(lineItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  vatAmount: z.number().nonnegative(),
  totalAmount: z.number().positive(),
  currency: z.string().optional().default("NGN"),
  notes: z.string().optional().nullable(),
});

function formatInvoice(inv: any, customer?: any) {
  return {
    id: inv.id,
    userId: inv.userId,
    customerId: inv.customerId,
    customer: customer || null,
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    lineItems: inv.lineItems,
    subtotal: parseFloat(inv.subtotal),
    vatAmount: parseFloat(inv.vatAmount),
    totalAmount: parseFloat(inv.totalAmount),
    currency: inv.currency,
    status: inv.status,
    firsReferenceId: inv.firsReferenceId,
    rejectionReasons: inv.rejectionReasons,
    notes: inv.notes,
    submittedAt: inv.submittedAt,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const invoices = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.userId, req.userId!))
    .orderBy(desc(invoicesTable.createdAt));

  const customerIds = [...new Set(invoices.map((i) => i.customerId))];
  const customers =
    customerIds.length > 0
      ? await db
          .select()
          .from(customersTable)
          .where(eq(customersTable.userId, req.userId!))
      : [];

  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]));

  res.json(invoices.map((inv) => formatInvoice(inv, customerMap[inv.customerId])));
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: "Invalid invoice data" });
    return;
  }

  const data = parsed.data;

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.id, data.customerId), eq(customersTable.userId, req.userId!)))
    .limit(1);

  if (!customer) {
    res.status(400).json({ error: "Bad Request", message: "Customer not found" });
    return;
  }

  const [invoice] = await db
    .insert(invoicesTable)
    .values({
      userId: req.userId!,
      customerId: data.customerId,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate,
      lineItems: data.lineItems as any,
      subtotal: data.subtotal.toFixed(2),
      vatAmount: data.vatAmount.toFixed(2),
      totalAmount: data.totalAmount.toFixed(2),
      currency: data.currency || "NGN",
      notes: data.notes,
      status: "draft",
    })
    .returning();

  res.status(201).json(formatInvoice(invoice, customer));
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Bad Request", message: "Invalid ID" });
    return;
  }

  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, req.userId!)))
    .limit(1);

  if (!invoice) {
    res.status(404).json({ error: "Not Found", message: "Invoice not found" });
    return;
  }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, invoice.customerId)).limit(1);

  res.json(formatInvoice(invoice, customer));
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Bad Request", message: "Invalid ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(invoicesTable)
    .where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, req.userId!)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Not Found", message: "Invoice not found" });
    return;
  }

  if (existing.status === "accepted") {
    res.status(400).json({ error: "Bad Request", message: "Accepted invoices cannot be modified" });
    return;
  }

  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: "Invalid invoice data" });
    return;
  }

  const data = parsed.data;

  const [invoice] = await db
    .update(invoicesTable)
    .set({
      customerId: data.customerId,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate,
      lineItems: data.lineItems as any,
      subtotal: data.subtotal.toFixed(2),
      vatAmount: data.vatAmount.toFixed(2),
      totalAmount: data.totalAmount.toFixed(2),
      currency: data.currency || "NGN",
      notes: data.notes,
      status: "draft",
      updatedAt: new Date(),
    })
    .where(eq(invoicesTable.id, id))
    .returning();

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, invoice.customerId)).limit(1);

  res.json(formatInvoice(invoice, customer));
});

router.post("/:id/validate", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Bad Request", message: "Invalid ID" });
    return;
  }

  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, req.userId!)))
    .limit(1);

  if (!invoice) {
    res.status(404).json({ error: "Not Found", message: "Invoice not found" });
    return;
  }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, invoice.customerId)).limit(1);
  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.userId, req.userId!))
    .limit(1);

  const errors: Array<{ field: string; message: string; code: string }> = [];
  const lineItems = invoice.lineItems as any[];

  if (!profile || !profile.tin) {
    errors.push({
      field: "businessTin",
      message: "Your business TIN is not configured. Please update your business profile.",
      code: "MISSING_BUSINESS_TIN",
    });
  }

  if (!customer || !customer.tin) {
    errors.push({
      field: "customerTin",
      message: "Customer TIN is missing. Please update the customer record.",
      code: "MISSING_CUSTOMER_TIN",
    });
  }

  if (!invoice.invoiceNumber) {
    errors.push({ field: "invoiceNumber", message: "Invoice number is required.", code: "MISSING_INVOICE_NUMBER" });
  }

  if (!invoice.invoiceDate) {
    errors.push({ field: "invoiceDate", message: "Invoice date is required.", code: "MISSING_INVOICE_DATE" });
  }

  if (!lineItems || lineItems.length === 0) {
    errors.push({ field: "lineItems", message: "At least one line item is required.", code: "NO_LINE_ITEMS" });
  }

  const subtotal = parseFloat(invoice.subtotal);
  const vatAmount = parseFloat(invoice.vatAmount);
  const totalAmount = parseFloat(invoice.totalAmount);
  const expectedTotal = parseFloat((subtotal + vatAmount).toFixed(2));

  if (Math.abs(totalAmount - expectedTotal) > 0.01) {
    errors.push({
      field: "totalAmount",
      message: `Invoice total (₦${totalAmount.toFixed(2)}) does not match subtotal + VAT (₦${expectedTotal.toFixed(2)}). Please recalculate.`,
      code: "TOTAL_MISMATCH",
    });
  }

  if (lineItems && lineItems.length > 0) {
    lineItems.forEach((item: any, idx: number) => {
      if (!item.description) {
        errors.push({ field: `lineItems[${idx}].description`, message: `Line item ${idx + 1}: Description is required.`, code: "MISSING_DESCRIPTION" });
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push({ field: `lineItems[${idx}].quantity`, message: `Line item ${idx + 1}: Quantity must be greater than zero.`, code: "INVALID_QUANTITY" });
      }
      if (item.unitPrice < 0) {
        errors.push({ field: `lineItems[${idx}].unitPrice`, message: `Line item ${idx + 1}: Unit price cannot be negative.`, code: "NEGATIVE_PRICE" });
      }
      const expectedAmt = parseFloat((item.quantity * item.unitPrice).toFixed(2));
      if (Math.abs(parseFloat(item.amount) - expectedAmt) > 0.02) {
        errors.push({
          field: `lineItems[${idx}].amount`,
          message: `Line item ${idx + 1}: Amount (₦${parseFloat(item.amount).toFixed(2)}) does not match calculated value (₦${expectedAmt.toFixed(2)}).`,
          code: "ITEM_AMOUNT_MISMATCH",
        });
      }
    });
  }

  if (!profile?.firsConnected) {
    errors.push({
      field: "firsConnection",
      message: "Your FIRS integration is not connected. Please complete FIRS setup in your business profile.",
      code: "FIRS_NOT_CONNECTED",
    });
  }

  res.json({ valid: errors.length === 0, errors });
});

router.post("/:id/submit", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Bad Request", message: "Invalid ID" });
    return;
  }

  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, req.userId!)))
    .limit(1);

  if (!invoice) {
    res.status(404).json({ error: "Not Found", message: "Invoice not found" });
    return;
  }

  if (invoice.status === "accepted") {
    res.status(400).json({ error: "Bad Request", message: "This invoice has already been accepted by FIRS." });
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, invoice.customerId)).limit(1);
  const [profile] = await db.select().from(businessProfilesTable).where(eq(businessProfilesTable.userId, req.userId!)).limit(1);

  const submittedAt = new Date();
  const rejectionReasons: string[] = [];

  if (!profile?.firsConnected) {
    rejectionReasons.push("Submitter's FIRS account is not active or authorized");
  }

  if (!profile?.tin) {
    rejectionReasons.push("Business Tax Identification Number (TIN) is missing");
  }

  if (!customer?.tin) {
    rejectionReasons.push("Customer Tax Identification Number (TIN) is missing or invalid");
  }

  const totalAmount = parseFloat(invoice.totalAmount);
  if (isNaN(totalAmount) || totalAmount <= 0) {
    rejectionReasons.push("Invoice total amount must be greater than zero");
  }

  const lineItems = invoice.lineItems as any[];
  if (!lineItems || lineItems.length === 0) {
    rejectionReasons.push("Invoice must contain at least one line item");
  }

  const shouldReject = rejectionReasons.length > 0 || Math.random() < 0.05;

  if (shouldReject && rejectionReasons.length === 0) {
    rejectionReasons.push("Duplicate invoice number detected in the FIRS system for this tax period");
  }

  if (rejectionReasons.length > 0) {
    await db
      .update(invoicesTable)
      .set({ status: "rejected", rejectionReasons: rejectionReasons as any, submittedAt, updatedAt: new Date() })
      .where(eq(invoicesTable.id, id));

    res.json({
      success: false,
      status: "rejected",
      firsReferenceId: null,
      message: "Your invoice was rejected by FIRS. Please review the errors below and resubmit.",
      rejectionReasons,
      submittedAt: submittedAt.toISOString(),
    });
    return;
  }

  const firsReferenceId = generateFirsReferenceId();

  await db
    .update(invoicesTable)
    .set({
      status: "accepted",
      firsReferenceId,
      rejectionReasons: null,
      submittedAt,
      updatedAt: new Date(),
    })
    .where(eq(invoicesTable.id, id));

  res.json({
    success: true,
    status: "accepted",
    firsReferenceId,
    message: "Invoice successfully submitted and accepted by FIRS.",
    rejectionReasons: null,
    submittedAt: submittedAt.toISOString(),
  });
});

export default router;
