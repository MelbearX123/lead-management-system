import { afterAll, describe, expect, it } from "vitest";
import { sql } from "./db";
import { getLeadForUser, leadsVisibleTo } from "./leads";
import { findUserByEmail, type User } from "./users";

afterAll(() => sql.end());

async function seededUser(email: string) {
  const user = await findUserByEmail(email);
  if (!user) throw new Error(`No seeded user ${email}`);
  return user;
}

async function visibleLeadIds(user: User) {
  const rows = await sql<{ leadId: number }[]>`
    SELECT lead_id FROM leads WHERE ${leadsVisibleTo(user)} ORDER BY lead_id
  `;
  return rows.map((row) => row.leadId);
}

describe("leadsVisibleTo", () => {
  it.each([
    { who: "a plaintiff sees only their own leads", email: "maya@example.com", leadIds: [1, 3, 4, 5, 10] },
    { who: "another plaintiff sees only theirs", email: "jordan@example.com", leadIds: [2, 6, 7, 8, 9] },
    { who: "Firm A staff see only Firm A's leads", email: "avery@example.com", leadIds: [1, 3, 4] },
    { who: "Firm B staff see only Firm B's leads", email: "sam@example.com", leadIds: [2, 5, 6, 7] },
  ])("$who", async ({ email, leadIds }) => {
    expect(await visibleLeadIds(await seededUser(email))).toEqual(leadIds);
  });

  it("an admin sees every lead", async () => {
    const all = await sql<{ leadId: number }[]>`SELECT lead_id FROM leads`;
    const visible = await visibleLeadIds(await seededUser("riley@example.com"));
    expect(visible).toEqual(expect.arrayContaining(all.map((row) => row.leadId)));
  });
});

describe("getLeadForUser", () => {
  it("returns a lead the user can see", async () => {
    const avery = await seededUser("avery@example.com");
    await expect(getLeadForUser(avery, 1)).resolves.toMatchObject({ leadId: 1 });
  });

  it("returns 404 for a lead that was reassigned away from the user's firm", async () => {
    const avery = await seededUser("avery@example.com");
    await expect(getLeadForUser(avery, 5)).rejects.toMatchObject({ status: 404 });
  });

  it("returns 404 for a lead that doesn't exist", async () => {
    const riley = await seededUser("riley@example.com");
    await expect(getLeadForUser(riley, 999)).rejects.toMatchObject({ status: 404 });
  });
});
