import { sql } from "../src/server/db.ts";
import { regions } from "./regions.ts";

type User = { userId: number; firmId: number | null };

export async function seed() {
  await sql`INSERT INTO regions ${sql(regions)}`;
  await sql`
    INSERT INTO categories (category_id, name) VALUES
      ('personal_injury', 'Personal Injury'),
      ('employment', 'Employment'),
      ('family_law', 'Family Law'),
      ('consumer_protection', 'Consumer Protection')
  `;

  const firmA = await insertFirm("Alder & Finch LLP", "NY");
  const firmB = await insertFirm("Pacific Shore Legal", "CA");

  await sql`
    INSERT INTO routing_rules (region_id, category_id, firm_id) VALUES
      ('NY', 'personal_injury', ${firmA}),
      ('NY', 'employment', ${firmA}),
      ('CA', 'personal_injury', ${firmB}),
      ('CA', 'family_law', ${firmB}),
      ('NY', 'family_law', ${firmB})
  `;

  await insertUser("plaintiff", "Maya", "Chen", "maya@example.com", null);
  await insertUser("plaintiff", "Jordan", "Ruiz", "jordan@example.com", null);
  await insertUser("attorney", "Avery", "Stone", "avery@example.com", firmA);
  await insertUser("paralegal", "Sam", "Patel", "sam@example.com", firmB);
  await insertUser("admin", "Riley", "Morgan", "riley@example.com", null);
}

async function insertFirm(name: string, regionId: string) {
  const [firm] = await sql<{ firmId: number }[]>`
    INSERT INTO firms ${sql({ name, regionId })} RETURNING firm_id
  `;
  return firm.firmId;
}

async function insertUser(
  role: string,
  fname: string,
  lname: string,
  email: string,
  firmId: number | null,
): Promise<User> {
  const [user] = await sql<{ userId: number }[]>`
    INSERT INTO users ${sql({ role, fname, lname, email, firmId })} RETURNING user_id
  `;
  return { userId: user.userId, firmId };
}
