# Database Schema

## Core tables

```txt
organizations
profiles
organization_members
boards
columns
cards
customers
comments
checklists
checklist_items
attachments
activities
notifications
```

## Operations tables

```txt
quotes
quote_items
invoices
invoice_items
payments
schedules
work_orders
automations
automation_runs
```

## AI tables

```txt
ai_conversations
ai_messages
ai_tool_calls
ai_action_approvals
ai_memories
ai_summaries
ai_insights
ai_automation_suggestions
```

## Core relationships

```txt
organization has many users
organization has one default board
board has many columns
column has many cards
card can link to customer
card can have quote
card can have invoice
card can have schedule
card has many activities
card has many AI tool calls
```

## Card fields

```txt
id
organization_id
board_id
column_id
customer_id
title
description
status
priority
assigned_to
revenue_value
estimated_cost
estimated_profit
risk_score
customer_health
next_action
due_date
scheduled_start
scheduled_end
position
archived_at
created_at
updated_at
```

## AI tool call fields

```txt
id
organization_id
user_id
card_id
customer_id
tool_name
risk_level
input_json
output_json
status
approval_status
error_message
created_at
executed_at
```
