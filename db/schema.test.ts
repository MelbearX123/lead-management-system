import { afterAll, describe, expect, it } from "vitest";
import { sql } from "../src/server/db.ts";

afterAll(() => sql.end());

function addUser(role: string, email: string, firmId: number | null) {
  return sql`INSERT INTO users ${sql({ role, fname: "Test", lname: "User", email, firmId })}`;
}

describe("users", () => {
  it("requires staff to belong to a firm", async () => {
    await expect(addUser("attorney", "no-firm@example.com", null)).rejects.toMatchObject({
      constraint_name: "firm_matches_role",
    });
  });

  it("keeps plaintiffs out of firms", async () => {
    await expect(addUser("plaintiff", "in-firm@example.com", 1)).rejects.toMatchObject({
      constraint_name: "firm_matches_role",
    });
  });

  it("stores emails in lowercase", async () => {
    await expect(addUser("plaintiff", "Mixed@Example.com", null)).rejects.toMatchObject({
      constraint_name: "users_email_check",
    });
  });

  it("allows each email only once", async () => {
    await expect(addUser("plaintiff", "maya@example.com", null)).rejects.toMatchObject({
      constraint_name: "users_email_key",
    });
  });
});

describe("leads", () => {
  it("requires accepted leads to have a firm and progress", async () => {
    const [accepted] = await sql`SELECT lead_id FROM leads WHERE status = 'accepted' LIMIT 1`;
    await expect(
      sql`UPDATE leads SET firm_id = NULL WHERE lead_id = ${accepted.leadId}`,
    ).rejects.toMatchObject({ constraint_name: "accepted_leads_have_firm_and_progress" });
  });

  it("only accepts known progress stages", async () => {
    await expect(sql`UPDATE leads SET progress = 'done'`).rejects.toMatchObject({
      constraint_name: "leads_progress_check",
    });
  });

  it("doesn't allow is_case to be set directly", async () => {
    await expect(sql`UPDATE leads SET is_case = false`).rejects.toThrow(/can only be updated to DEFAULT/);
  });

  it("only accepts regions that exist", async () => {
    await expect(sql`UPDATE leads SET region_id = 'ZZ'`).rejects.toMatchObject({
      constraint_name: "leads_region_id_fkey",
    });
  });
});

describe("routing rules", () => {
  it("maps each region and category to at most one firm", async () => {
    await expect(
      sql`INSERT INTO routing_rules (region_id, category_id, firm_id) VALUES ('NY', 'employment', 2)`,
    ).rejects.toMatchObject({ constraint_name: "routing_rules_pkey" });
  });
});
