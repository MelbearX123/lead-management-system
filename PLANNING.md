# Terminology
plaintiff: person seeking help
lead: plaintiff's inquiry
case: work recorded when a firm accepts the lead
attorneys/paralegals: staff at law firm

# Functional Requirements
1. plaintiff must be able to submit a lead describing their situation with region, and category
2. system must route lead to a law firm using category/region mapping. assigned firms staff see it in inbox, admins can see it across system. if no matching firm, lead waits for an admin to assign it
3. firm must be able to review lead and accept/decline. accpeting creates case. declining leaves lead up for admint to resolve/reassign
4. firm works on case, updates progess, adds private notes, exchanges pdfs with plaintiff. plaintiff can see progress/documents
5. admins oversee leads and cases across firms, reassign when needed

Plaintiff:
- submit a lead with name, email, region, category, description
- access own leads/cases to see progress and upload/view PDFs
- keepother plaintiff's info and firm-private notes inaccessible

Law Firm:
- route new lead to one firm using category/region mapping. may seed this mapping (mapping editor not required). unmatched leads remain pending for an admin
- attorneys/paralegals can view and filter firm invoc, inspect lead, accept/decline. acceptance creates case, declined leads remain available for admin resolution

Admin:
- search leads and cases across firms
- resolve unmatched/declined leads and reassign leads/cases
- record who changed an assignment or important status, what changed + when, history inspectable
- on reassignment, old form loses future access to lead/case. new firm receives case info + plaintiff docs
- firm-private notes retain their authoring firm's ownership. new firm does not inherit, plaintiffs cannot see, authorized admins can inspect. no new separact archive ui for old firm required

# Non-func Requirements
Assume must handle at least
- 100 firms,
- 1,000 leads/day
- 100,000 stored leads

# Key entities/objects

split user into 3 different types (a table for each) for ease of implementation (all three hold different info)

for all locations make them pick out of a dropdown provided. if their place not on it maybe provide an "other" option? doesnt seem to work for location though maybe just have them pick the closest place

for all categories make them pick out of a dropdown

plaintiff: uid, fname, lname, email
staff: uid, fname, lname, email, firmid
admin: uid, fname, lname, email

firms: firmId, fName, location

treat leads and cases as same with a bool check since they have the same properties anyway
lead: id, plaintiffId, isCase, name, region, category, description, status, firmID, time

how to store files such as pdfs and notes and such?


Use Next.js or React with Python Javascript/Typescript backend