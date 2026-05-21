# End-to-End Workflows

> **MVP:** Use the 9-column landscaping pipeline in `docs/product/DEFAULT_PIPELINE.md`. The full lifecycle below is the long-term model; unlisted states map to MVP columns or are post-MVP.

## Universal lifecycle pipeline

```txt
Inbound
→ Qualified
→ Discovery
→ Estimate Drafting
→ Estimate Sent
→ Negotiation
→ Approved
→ Scheduling
→ Ready
→ In Progress
→ Blocked
→ Quality Review
→ Completed
→ Invoice Pending
→ Invoice Sent
→ Payment Pending
→ Paid
→ Retention
→ Archived
```

## Workflow 1: Lead to paid customer

```txt
New lead arrives
→ create customer record
→ create card in Inbound
→ qualify request
→ collect job details
→ draft estimate
→ send estimate
→ negotiate or revise
→ customer approves
→ schedule job
→ prepare work checklist
→ perform work
→ quality review
→ mark completed
→ create invoice
→ send invoice
→ collect payment
→ request review or upsell
→ archive card
```

## Workflow 2: Internal operation task

```txt
Need identified
→ create card
→ assign owner
→ define next action
→ work started
→ blocker handled if needed
→ review
→ complete
→ archive
```

## Workflow 3: Support issue

```txt
Customer issue received
→ link to customer
→ create or update card
→ classify urgency
→ assign owner
→ investigate
→ resolve
→ confirm with customer
→ close
```

## Workflow 4: AI-assisted quote

```txt
User adds job notes
→ AI extracts service details
→ AI identifies missing info
→ AI drafts quote line items
→ user reviews quote
→ quote saved as draft
→ user approves sending
```

## Workflow 5: AI-assisted daily operations

```txt
User asks: What should I do first today?
→ AI checks overdue cards
→ AI checks unpaid invoices
→ AI checks scheduled jobs
→ AI checks blocked cards
→ AI ranks tasks by urgency and money impact
→ AI presents recommended order
```
