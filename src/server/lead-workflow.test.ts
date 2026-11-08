import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "./db";
import {
  acceptLead,
  assignLead,
  declineLead,
  getLeadForUser,
  listLeads,
  type NewLead,
  submitLead,
  updateProgress,
} from "./leads";
import { findUserByEmail, type User } from "./users";

let firmC: number;
let firmD: number;
let carla: User;
let dana: User;
let riley: User;

beforeAll(async () => {
  [{ firmId: firmC }] = await sql`INSERT INTO firms (name, region_id) VALUES ('Firm C', 'TX') RETURNING firm_id`;
  [{ firmId: firmD }] = await sql`INSERT INTO firms (name, region_id) VALUES ('Firm D', 'TX') RETURNING firm_id`;
  await sql`INSERT INTO routing_rules (region_id, category_id, firm_id) VALUES ('TX', 'consumer_protection', ${firmC})`;
  await sql`
    INSERT INTO users (role, firm_id, fname, lname, email) VALUES
      ('attorney', ${firmC}, 'Carla', 'C', 'carla@test.example'),
      ('paralegal', ${firmD}, 'Dana', 'D', 'dana@test.example')
  `;
  carla = await seededUser("carla@test.example");
  dana = await seededUser("dana@test.example");
  riley = await seededUser("riley@example.com");
});

afterAll(() => sql.end());

async function seededUser(email: string) {
  const user = await findUserByEmail(email);
  if (!user) throw new Error(`No user ${email}`);
  return user;
}

function submit(overrides: Partial<NewLead> = {}) {
  return submitLead({
    fname: "Test",
    lname: "Plaintiff",
    email: "plaintiff@test.example",
    regionId: "TX",
    categoryId: "consumer_protection",
    title: "Test lead",
    description: "Something happened.",
    ...overrides,
  });
}

function historyOf(leadId: number) {
  return sql`
    SELECT actor_id, field, old_value, new_value FROM history
    WHERE lead_id = ${leadId} ORDER BY created_at, history_id
  `;
}

describe("submitLead", () => {
  it("routes to the firm that covers its region and category", async () => {
    const lead = await submit();
    expect(lead).toMatchObject({ firmId: firmC, status: "pending", progress: null, isCase: false });
    expect(await historyOf(lead.leadId)).toEqual([
      { actorId: null, field: "firm", oldValue: null, newValue: String(firmC) },
    ]);
  });

  it("leaves unmatched leads with no firm", async () => {
    const lead = await submit({ categoryId: "employment" });
    expect(lead.firmId).toBeNull();
    expect(await historyOf(lead.leadId)).toEqual([]);
  });

  it("reuses the plaintiff for a repeat email, ignoring case", async () => {
    const first = await submit({ email: "Repeat@Test.example" });
    const second = await submit({ email: "repeat@test.example" });
    expect(second.plaintiffId).toBe(first.plaintiffId);
  });

  it("refuses an email that belongs to staff", async () => {
    await expect(submit({ email: "carla@test.example" })).rejects.toMatchObject({ status: 400 });
  });
});

describe("state changes", () => {
  it("accepting starts progress at intake and records who did it", async () => {
    const { leadId } = await submit();
    expect(await acceptLead(carla, leadId)).toMatchObject({ status: "accepted", progress: "intake", isCase: true });
    expect(await historyOf(leadId)).toEqual(
      expect.arrayContaining([
        { actorId: carla.userId, field: "status", oldValue: "pending", newValue: "accepted" },
        { actorId: carla.userId, field: "progress", oldValue: null, newValue: "intake" },
      ]),
    );
  });

  it("lets only one of two simultaneous accepts succeed", async () => {
    const { leadId } = await submit();
    const results = await Promise.allSettled([acceptLead(carla, leadId), acceptLead(carla, leadId)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected")).toMatchObject({ reason: { status: 409 } });
  });

  it("declining sends the lead to the admin queue and the firm loses access", async () => {
    const { leadId } = await submit();
    expect(await declineLead(carla, leadId)).toMatchObject({ firmId: null, status: "pending" });
    await expect(getLeadForUser(carla, leadId)).rejects.toMatchObject({ status: 404 });

    const { leads } = await listLeads(riley, { firmId: "unmatched", sort: "newest", page: 1 });
    expect(leads.map((lead) => lead.leadId)).toContain(leadId);
  });

  it("reassigning a case keeps its progress, needs re-acceptance, and cuts off the old firm", async () => {
    const { leadId } = await submit();
    await acceptLead(carla, leadId);
    await updateProgress(carla, leadId, "negotiation");

    expect(await assignLead(riley, leadId, firmD)).toMatchObject({
      firmId: firmD,
      status: "pending",
      progress: "negotiation",
      isCase: true,
    });
    await expect(getLeadForUser(carla, leadId)).rejects.toMatchObject({ status: 404 });
    expect(await acceptLead(dana, leadId)).toMatchObject({ status: "accepted", progress: "negotiation" });
  });

  it("only updates progress on accepted cases", async () => {
    const { leadId } = await submit();
    await expect(updateProgress(carla, leadId, "closed")).rejects.toMatchObject({ status: 409 });
  });

  it("refuses to assign a lead to the firm that already has it", async () => {
    const { leadId } = await submit();
    await expect(assignLead(riley, leadId, firmC)).rejects.toMatchObject({ status: 409 });
  });
});

describe("listLeads", () => {
  it("finds leads by part of the plaintiff's name", async () => {
    const lead = await submit({ fname: "Zebulon", email: "zebulon@test.example" });
    const { leads, total } = await listLeads(riley, { q: "zebul", sort: "newest", page: 1 });
    expect(total).toBe(1);
    expect(leads[0].leadId).toBe(lead.leadId);
  });

  it("only lists a firm's own leads to its staff", async () => {
    await submit();
    const { leads } = await listLeads(carla, { sort: "newest", page: 1 });
    expect(leads.length).toBeGreaterThan(0);
    expect(leads.every((lead) => lead.firmId === firmC)).toBe(true);
  });
});
