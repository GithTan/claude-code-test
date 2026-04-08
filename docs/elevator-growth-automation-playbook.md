# Elevator Growth Automation Playbook

## What To Install For Codex

Current local skills:

- `.system` (already installed)
- `fiec-elevator-app` (already installed)

Best additional curated Codex skills for this project:

1. `playwright`
   Use for browser automation, competitor research, landing-page QA, and lead-form testing.
2. `spreadsheet`
   Use for lead lists, campaign analysis, quoting pipelines, and ROAS tracking.
3. `doc`
   Use for repeatable SOPs, campaign briefs, sales playbooks, and proposal templates.
4. `pdf`
   Use for brochures, maintenance proposals, modernization decks, and tender documents.
5. `screenshot`
   Use for ad creative reviews, landing-page audits, and competitor teardown snapshots.
6. `transcribe`
   Use for turning sales calls and site-visit notes into structured follow-up tasks.
7. `speech`
   Use for voice workflows, quick outbound scripts, and sales enablement content.
8. `chatgpt-apps`
   Useful if you want internal mini-tools for lead qualification or quote intake.

Helpful but optional:

- `notion-research-documentation`
- `notion-knowledge-capture`
- `notion-meeting-intelligence`
- `slides`

Note: I identified these from the current OpenAI curated skills catalog. I was able to verify the catalog online, but I could not run the local helper installer in this shell because neither `python` nor `py` is currently available on PATH.

## The Best Elevator Leads To Target

Your highest-value audiences are usually:

- Property managers
- Facility managers
- Building owners
- Developers and general contractors
- Architects and consultants
- Housing societies / HOAs / apartment associations
- Hospitals, hotels, malls, office buildings, and schools with aging equipment

The strongest buying triggers are:

- Frequent breakdowns
- Tenant complaints
- Slow response from current service vendor
- Rising repair costs
- Safety or code-compliance concerns
- Modernization planning for elevators older than 15 to 20+ years
- Need for AMC / preventive maintenance with faster turnaround

## Best Offers For Meta Ads

Do not run generic "contact us" ads first. Offer something easier to say yes to:

1. Free elevator health audit
2. Free modernization assessment
3. Free AMC cost comparison
4. Free response-time review for existing service contract
5. Free building site survey
6. Emergency breakdown support line

Best core message angles:

- Reduce breakdowns and tenant complaints
- Improve safety and compliance
- Cut repeat repair spend
- Modernize without full replacement
- Faster response times
- Better uptime for residents and tenants

## Meta Ads Strategy

Use a 3-layer funnel instead of one campaign.

### 1. Demand Creation

Run short video/image ads to local building decision-makers with pains like:

- "Frequent lift breakdowns?"
- "Older elevator costing too much to maintain?"
- "Planning modernization for your building?"

Creative should show:

- Before/after modernization
- Technician reliability
- Safety upgrades
- Real buildings, real equipment, real crews

### 2. Lead Capture

Use both:

- Meta instant forms
- Click-to-message ads to WhatsApp or Messenger

Use instant forms for:

- Audit requests
- Site surveys
- AMC quote requests

Use click-to-message for:

- Emergency service
- Faster qualification
- High-intent conversations

### 3. Retargeting

Retarget:

- Website visitors
- Video viewers
- Form openers who did not submit
- People who messaged but did not book
- Existing lead lists from CRM

Retargeting ads should push:

- Case studies
- Response-time proof
- Testimonials
- "Book your site visit this week"

## Why This Meta Setup Matters

Meta's own business pages say:

- Lead ads generated more than 1B instant form submissions in 2023.
- Lead ads that click to message can produce more leads than legacy channels.
- Advantage+ placements can lower cost per result by expanding delivery automatically.
- Advantage+ leads campaigns are promoted as lowering both CPL and qualified-lead cost.
- Using CRM data with Conversions API can improve lead quality optimization.

For your business, the practical takeaway is:

- Use `Advantage+ placements`
- Test `Advantage+ audience`
- Connect CRM + Conversions API
- Optimize for qualified leads, not just cheap leads

## Recommended Campaign Structure

Start simple:

1. Campaign A: Lead forms for audit / quote / AMC
2. Campaign B: Click-to-message for urgent inquiries
3. Campaign C: Retargeting for case study + booking

Suggested first test split:

- 50% lead forms
- 30% click-to-message
- 20% retargeting

If you only serve selected cities, keep targeting narrow around your actual service geography.

## Lead Qualification Questions

Add these in forms or chat automation:

1. Building type
2. City / area
3. Number of elevators
4. Current problem
5. Need type: maintenance, repair, modernization, new installation
6. Timeline
7. Phone and email

This is how you reduce junk leads and route them correctly.

## AI Automation Stack

Use this pipeline:

1. Meta Lead Form or Click-to-Message
2. Webhook into `n8n` or similar automation tool
3. Save lead in CRM / Supabase
4. AI agent classifies lead
5. Auto-assign to sales or service team
6. Send instant WhatsApp/email/SMS response
7. Book site visit or callback
8. Push offline qualified-lead / won-deal events back to Meta via Conversions API

Best automations to build:

1. Lead capture agent
   Cleans and classifies incoming leads.
2. Qualification agent
   Scores leads by building type, urgency, job size, and service area.
3. Follow-up agent
   Sends reminders until a site survey is booked.
4. Proposal agent
   Drafts AMC, modernization, or repair proposals from templates.
5. Research agent
   Monitors competitor offers, local projects, and target accounts.
6. Sales ops agent
   Tracks CPL, qualified leads, booked surveys, quotes, wins, and revenue.

## What To Automate First

Highest ROI first:

1. Meta lead ingestion
2. Instant lead routing
3. Auto-reply within 1 to 5 minutes
4. Site survey booking
5. Quote follow-up reminders
6. Won / lost tracking back into ads data

If your team replies slowly, automation will usually improve results before any ad optimization does.

## Landing Pages You Should Have

You should not send all traffic to one generic homepage.

Create separate pages for:

- Elevator maintenance / AMC
- Elevator modernization
- Elevator repair / emergency support
- New elevator installation
- Annual service contract comparison

Each page should include:

- Strong local headline
- Building types served
- Certifications / trust markers
- Response-time promise
- Photos of real work
- Short form
- Click-to-call / WhatsApp button
- Case study or testimonial

## Content That Will Sell Better

Best content ideas for this industry:

- "5 signs your elevator needs modernization"
- "Why your lift keeps breaking down"
- "AMC vs repeated repair cost"
- "How to prepare your building for elevator modernization"
- "What property managers should check in an elevator maintenance contract"
- Before/after modernization reels
- Technician walkthrough videos

## Metrics That Actually Matter

Do not judge ads only by cheap leads.

Track:

- Cost per lead
- Cost per qualified lead
- Site surveys booked
- Quotes sent
- Quote-to-close rate
- Revenue per campaign
- Response time
- Close rate by building type
- Close rate by service line

## Stronger Positioning For Your Elevator Company

Your ads and landing pages should repeatedly answer:

- Why trust your team?
- How fast do you respond?
- Do you handle breakdowns, AMC, modernization, and installation?
- What kinds of buildings do you specialize in?
- What proof do you have?

The market usually responds better to concrete promises like:

- "24/7 breakdown support"
- "Free site survey"
- "Specialists in aging elevators"
- "Modernization without full replacement"
- "Fast service for apartments, hospitals, offices, and commercial buildings"

## 30-Day Execution Plan

Week 1:

- Build 3 offers
- Create 3 landing pages
- Set up CRM fields
- Set up lead routing

Week 2:

- Launch lead-form campaign
- Launch click-to-message campaign
- Install retargeting assets

Week 3:

- Review lead quality
- Kill bad audiences
- Improve form questions
- Add testimonials and case studies

Week 4:

- Push offline conversions back to Meta
- Shift budget toward qualified-lead sources
- Create second round of creatives by service line

## What I Recommend You Do Next

1. Install the Codex skills above.
2. Build one dedicated landing page each for AMC, modernization, and repair.
3. Launch one lead-form campaign and one click-to-message campaign.
4. Connect your CRM to Meta Conversions API.
5. Automate response and booking immediately after lead capture.

## Sources

- OpenAI skills catalog: https://github.com/openai/skills/tree/main/skills/.curated
- Meta lead ads overview: https://www.facebook.com/business/ads/ad-objectives/lead-generation
- Meta lead ads with forms: https://www.facebook.com/business/ads/ad-objectives/lead-generation/lead-ads-with-forms
- Meta lead ads with messaging: https://www.facebook.com/business/ads/ad-objectives/lead-generation/lead-ads-with-messaging
- Meta click-to-message ads: https://www.facebook.com/business/ads/click-to-message-ads
- Meta Advantage+ placements: https://www.facebook.com/business/ads/meta-advantage-plus/placements
- Meta Advantage+ audience: https://www.facebook.com/business/ads/meta-advantage-plus/audience
- Meta Advantage+ leads: https://www.facebook.com/business/ads/meta-advantage-plus/leads
- Meta Conversions API: https://www.facebook.com/business/help/AboutConversionsAPI
- KONE modernization overview: https://www.kone.com/en/products-and-services/maintenance-and-modernization/elevator-modernization.aspx
- Otis modernization overview: https://www.otis.com/en/us/products-services/modernization-upgrades/modernization
- Otis article on aging elevator stock: https://www.otis.com/en/us/our-company/innovation/elevator-modernization
