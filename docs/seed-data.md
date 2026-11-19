# Demo Data

`scripts/seed.ts` fills the database with demo data, so the site looks like a real job board for demos. The companies, people and postings are made up.

```bash
pnpm db:seed --dry-run   # shows what it would add, saves nothing
pnpm db:seed             # adds it
```

It reads `DATABASE_URL`, `SUPABASE_URL` and `SUPABASE_SECRET_KEY` from `.env`. It is safe to run again: anything already there is skipped. It never changes or deletes existing rows, except that it fills in the empty profile fields of the two team accounts below.

## What it adds

- **4 recruiters** at fictional companies (Northwind Labs, Maple Health Analytics, Lumen Financial, Boreal Robotics), each with a company profile and 3 job postings. One posting is closed.
- **8 job seekers** with complete profiles (headline, about, skills, job preferences, experience, education) and a resume PDF the AI features can read.
- **Applications at every stage**, from Applied to Offered or Rejected. Offers and rejections include the recruiter's message, and each step has its notifications.
- **Follows** between job seekers and recruiters, and **3 feature suggestions** for the admin page.
- For the team accounts:
  - `recruiter@email.com` gets a company profile, 3 postings at its company, and applicants on them.
  - `test1@email.com` gets experience, education and job preferences if they're empty, plus 4 applications at different stages.

Dates are relative to the day it runs, so deadlines are always in the future.

## Demo accounts

Every demo account uses the password **`CareerConnect2026!`**.

| Name | Email | Role |
|---|---|---|
| Claire Fontaine | claire.fontaine@careerconnect.test | Recruiter, Northwind Labs |
| Daniel Okafor | daniel.okafor@careerconnect.test | Recruiter, Maple Health Analytics |
| Sofia Ramirez | sofia.ramirez@careerconnect.test | Recruiter, Lumen Financial |
| Marc-André Gagnon | marc-andre.gagnon@careerconnect.test | Recruiter, Boreal Robotics |
| Amira Haddad | amira.haddad@careerconnect.test | Job seeker, software engineering student |
| Lucas Bergeron | lucas.bergeron@careerconnect.test | Job seeker, backend developer |
| Priya Nair | priya.nair@careerconnect.test | Job seeker, data analyst |
| Ethan Chen | ethan.chen@careerconnect.test | Job seeker, machine learning student |
| Chloé Lavoie | chloe.lavoie@careerconnect.test | Job seeker, UX designer |
| Omar Benali | omar.benali@careerconnect.test | Job seeker, embedded engineer |
| Grace Thompson | grace.thompson@careerconnect.test | Job seeker, DevOps engineer |
| Noah Williams | noah.williams@careerconnect.test | Job seeker, mobile developer |

The `.test` addresses can't receive email, so these accounts can't reset their password. They are created already verified.
