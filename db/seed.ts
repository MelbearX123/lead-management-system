import { sql } from "../src/server/db.ts";
import { regions } from "./regions.ts";

type User = { userId: number; firmId: number | null };

type LeadState = {
  firmId: number | null;
  status: "pending" | "accepted";
  progress: "intake" | "investigation" | "negotiation" | "litigation" | "closed" | null;
};

type Step = [by: User | null, change: Partial<LeadState>];

type SeedLead = {
  plaintiff: User;
  regionId: string;
  categoryId: string;
  title: string;
  description: string;
  steps: Step[];
};

const historyField = { firmId: "firm", status: "status", progress: "progress" } as const;

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

  const maya = await insertUser("plaintiff", "Maya", "Chen", "maya@example.com", null);
  const jordan = await insertUser("plaintiff", "Jordan", "Ruiz", "jordan@example.com", null);
  const avery = await insertUser("attorney", "Avery", "Stone", "avery@example.com", firmA);
  const sam = await insertUser("paralegal", "Sam", "Patel", "sam@example.com", firmB);
  const riley = await insertUser("admin", "Riley", "Morgan", "riley@example.com", null);

  const leads: SeedLead[] = [
    {
      plaintiff: maya,
      regionId: "NY",
      categoryId: "personal_injury",
      title: "Rear-ended at a red light",
      description: "Another driver hit my car from behind. I have neck pain and missed two weeks of work.",
      steps: [[null, { firmId: firmA }]],
    },
    {
      plaintiff: jordan,
      regionId: "CA",
      categoryId: "family_law",
      title: "Custody schedule after separation",
      description: "My partner and I separated and need a custody schedule for our two kids.",
      steps: [[null, { firmId: firmB }]],
    },
    {
      plaintiff: maya,
      regionId: "NY",
      categoryId: "employment",
      title: "Unpaid overtime",
      description: "My employer has not paid overtime for six months of 50-hour weeks.",
      steps: [
        [null, { firmId: firmA }],
        [avery, { status: "accepted", progress: "intake" }],
      ],
    },
    {
      plaintiff: maya,
      regionId: "NY",
      categoryId: "personal_injury",
      title: "Slip and fall at a grocery store",
      description: "I slipped on an unmarked wet floor and broke my wrist.",
      steps: [
        [null, { firmId: firmA }],
        [avery, { status: "accepted", progress: "intake" }],
        [avery, { progress: "investigation" }],
      ],
    },
    {
      plaintiff: maya,
      regionId: "NY",
      categoryId: "personal_injury",
      title: "Hit by a delivery van while cycling",
      description: "A delivery van turned into the bike lane and hit me. I needed knee surgery.",
      steps: [
        [null, { firmId: firmA }],
        [avery, { status: "accepted", progress: "intake" }],
        [avery, { progress: "investigation" }],
        [riley, { firmId: firmB, status: "pending" }],
        [sam, { status: "accepted" }],
        [sam, { progress: "negotiation" }],
      ],
    },
    {
      plaintiff: jordan,
      regionId: "CA",
      categoryId: "personal_injury",
      title: "Dog bite at a neighbor's home",
      description: "A neighbor's dog bit my hand and I needed stitches.",
      steps: [
        [null, { firmId: firmB }],
        [sam, { status: "accepted", progress: "intake" }],
        [sam, { progress: "investigation" }],
        [sam, { progress: "negotiation" }],
        [sam, { progress: "litigation" }],
      ],
    },
    {
      plaintiff: jordan,
      regionId: "CA",
      categoryId: "family_law",
      title: "Child support modification",
      description: "My income dropped and I need the child support order changed.",
      steps: [
        [null, { firmId: firmB }],
        [sam, { status: "accepted", progress: "intake" }],
        [sam, { progress: "investigation" }],
        [sam, { progress: "negotiation" }],
        [sam, { progress: "closed" }],
      ],
    },
    {
      plaintiff: jordan,
      regionId: "TX",
      categoryId: "consumer_protection",
      title: "Dealer hid flood damage",
      description: "The used car I bought had flood damage the dealer never disclosed.",
      steps: [],
    },
    {
      plaintiff: jordan,
      regionId: "CA",
      categoryId: "personal_injury",
      title: "Injured by gym equipment",
      description: "A cable machine snapped during a workout and cut my arm.",
      steps: [
        [null, { firmId: firmB }],
        [sam, { firmId: null }],
      ],
    },
    {
      plaintiff: maya,
      regionId: "NY",
      categoryId: "employment",
      title: "Fired after reporting harassment",
      description: "I was let go a week after reporting my manager for harassment.",
      steps: [
        [null, { firmId: firmA }],
        [avery, { status: "accepted", progress: "intake" }],
        [avery, { progress: "investigation" }],
        [riley, { firmId: firmB, status: "pending" }],
        [sam, { firmId: null }],
      ],
    },
  ];

  for (const [i, lead] of leads.entries()) {
    await insertLead(lead, daysAgo(30 - 2 * i));
  }
}

async function insertLead({ plaintiff, steps, ...details }: SeedLead, submittedAt: Date) {
  let state: LeadState = { firmId: null, status: "pending", progress: null };
  const history = [];

  for (const [i, [by, change]] of steps.entries()) {
    for (const key of Object.keys(change) as (keyof LeadState)[]) {
      history.push({
        actorId: by?.userId ?? null,
        field: historyField[key],
        oldValue: toText(state[key]),
        newValue: toText(change[key] ?? null),
        createdAt: addHours(submittedAt, 24 * i),
      });
    }
    state = { ...state, ...change };
  }

  const [{ leadId }] = await sql<{ leadId: number }[]>`
    INSERT INTO leads ${sql({ ...details, ...state, plaintiffId: plaintiff.userId, timeSubmit: submittedAt })}
    RETURNING lead_id
  `;
  if (history.length > 0) {
    await sql`INSERT INTO history ${sql(history.map((row) => ({ ...row, leadId })))}`;
  }
  return leadId;
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

function toText(value: string | number | null) {
  return value === null ? null : String(value);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function daysAgo(days: number) {
  return addHours(new Date(), -24 * days);
}
