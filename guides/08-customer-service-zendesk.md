[← Back to Chapter 7 — Search orchestration](07-search-orchestration.md)

# 8. Customer service hand-over to Zendesk

The Clarity chat widget can hand specific conversation topics over to your Zendesk customer-service
setup and take the conversation back afterwards. This guide is for the Zendesk admin and the
developers who set the hand-over up on your side: what to create in Zendesk Admin Center, what to
hand to Bloomreach, what shoppers and agents will see, and the limits to know about.

---

## 1. What the hand-over does

Clarity is a shopping assistant — good at product discovery and product questions. Orders, returns
and complaints are outside its remit, and you most likely already run a complete process for them in
Zendesk. The hand-over sends those topics to that existing setup, through Zendesk's **Sunshine
Conversations** messaging API.

**Routing is by topic, not by "does this need a human".** During conversation design you agree with
Bloomreach on a list of topics that belong to Zendesk. On each shopper message an AI orchestrator
decides whether the message falls inside that list; if it does, the message goes to Zendesk.

**Whether a human agent gets involved is Zendesk's decision, not Clarity's.** Once a conversation
reaches Zendesk it is first handled by the bot you configured there. That bot may resolve the whole
thing itself, or decide a human is needed and hand over to an agent — that logic belongs to your
Zendesk configuration. Clarity only relays messages faithfully in both directions, and shows the
shopper whether a bot or a human is currently speaking.

### For the shopper

Everything happens inside the Clarity chat window; there is no redirect to another page. The shopper
sees:

- **"Connecting you to a live agent"** when Zendesk passes control to a human — a human is now
  eligible to answer;
- **"Connected to a live agent"** when that human actually sends their first message;
- **"The Live Agent session has ended"** when the session ends on the Zendesk side — the shopper is
  back with Clarity.

While a live session is running, every message the shopper types goes straight to Zendesk and does
not pass through Clarity.

The shopper can end the session too, with the *End live support conversation* button the widget
shows while connecting or connected. A message from the business side is then posted into the
conversation telling the agent that the customer left — the wording is yours to choose, the default
is "The customer has ended this chat." With the Support API OAuth client of
[3.3](#33-support-api-oauth-client--optional) configured, the ticket is then solved — with one conversation per customer once a human agent has
replied in that live session, with one conversation per live phase on every ending — so the trigger of
[3.4](#34-control-must-return-to-your-ai-agent-when-the-human-agent-is-done) ends the agent's
messaging session: the agent can no longer reply in the conversation, and the shopper's next message routed to Zendesk
starts a new ticket at your AI agent. A ticket solved while unassigned is assigned to the admin who
created the OAuth client, as Zendesk does for any solve.

With one conversation per customer, a chat the shopper ends while still waiting for an agent
("Connecting") keeps its ticket open: Zendesk's AI agent does not appear to answer a conversation it
escalated and no human picked up (observed, not documented by Zendesk), so the escalated ticket is
what brings the shopper's next message to your agents. With one conversation per live phase nothing
returns to that conversation, so the ticket is solved like any other and the next hand-off opens a
new conversation at your AI agent. Without the client the agent's session and ticket stay open after
any ending; see [Known limits](#7-known-limits).

A shopper cannot upload files during a Zendesk session.

### For the agent

Tickets opened through the hand-over are *via Sunshine Conversations API*, not *Messaging*, and
start in the AI agent's queue. **A summary of the conversation so far** travels with each hand-off,
so the Zendesk side does not start from nothing. It is carried in the Sunshine conversation's
metadata (field `clarityContext`, plus a `clarityContextUpdatedAt` timestamp) and is capped at about
3000 bytes — roughly 3000 Latin characters, fewer for other scripts. Whether the summary is actually used depends on whether your Zendesk flow reads
conversation metadata; a flow that never reads it makes this a no-op.

### One conversation per customer, or one per live phase

You choose one of two modes; Bloomreach configures it on your Clarity agent.

**One conversation per customer — the default.** A customer has **one** Sunshine conversation,
however many chats they open over time. A customer is identified by the id the widget passes. Delivered through
the weblayer, that id is kept per browser, so the agent sees one continuous thread per browser,
across chats and sessions, with the context summary refreshed at every hand-off. If the previous
ticket is still open, a new hand-off threads into it rather than opening another. The same shopper on
another device has another id, and therefore another conversation.

A [standalone integration](README.md#standalone-integration-without-a-weblayer) can pass the same id
on every device through [`getCurrentCustomerId`](../reference/widget-config.md#getcurrentcustomerid-string),
so that the conversation follows the customer. Two devices used at once then take the conversation
from each other with every message routed to Zendesk: the first device sees its live session end.

**One conversation per live phase.** Every hand-off that does not continue a live phase opens a new
Sunshine conversation: a chat's first one, and a new one after every ending, whether the shopper or
Zendesk ended it. Nothing is ever re-entered, so the agent sees one thread per live phase, each with
its own ticket. An open ticket is never re-entered; the price is several tickets per
customer. This mode **requires Multi-Conversations enabled on the Sunshine app** — see
[Multi-Conversations](#36-multi-conversations-on-the-sunshine-app).

In both modes, anonymous shoppers, who are not logged in and have no identity on your site, are
handled the same way through the weblayer: they get a random id that is kept in their browser, for
as long as the browser keeps the site's data, and are one Sunshine user per browser like any other
shopper. A standalone integration that leaves `getCurrentCustomerId` unset sends no id at all; each
chat is then its own Sunshine user, a conversation is reused only within that chat, and no email
identity is written from a form.

In both modes, the first message of each new conversation is held back for **2 seconds** by
default. Zendesk hands a new conversation to your AI agent shortly after it is created, and the AI
agent does not process a message that arrived before that: it answers with its welcome reply alone,
and Zendesk's conversation log marks the message *Not processed*. The wait gives the AI agent time to
take over, so the shopper's first message is answered. The welcome reply arrives during the wait and
therefore shows above the shopper's hand-off message in the chat. Messages into a conversation that
already exists are not delayed. The length is a setting on the Bloomreach side — see [What to hand to
Bloomreach](#4-what-to-hand-to-bloomreach).

---

## 2. Prerequisites

- A Zendesk **Suite Professional** plan or above: both the Conversations API page and the
  Conversations integrations page need it.
- For a [standalone integration](README.md#standalone-integration-without-a-weblayer) only:
  [`getCurrentCustomerId`](../reference/widget-config.md#getcurrentcustomerid-string) returns a
  random or hashed value (a UUID, an HMAC of the account id), never the raw account id. The id is
  what gives a chat access to that customer's Sunshine conversation, the agent's replies included,
  so an enumerable value lets anyone who guesses it read and continue another customer's support
  conversation. Through the weblayer the id is generated for you.

---

## 3. What to set up in Zendesk Admin Center

### 3.1 Conversations API key — app-scoped

Admin Center hands out two kinds of Sunshine key, and only one of them works:

| Created under | Scope | Usable |
|---|---|---|
| **Apps and integrations → APIs → Conversations API** → *Create API key* | app | **Yes** |
| Apps and integrations → Integrations → Conversations integrations (the page the webhook is on) | integration | No |

The difference is the switchboard. With one conversation per customer, when the
shopper ends a live chat Clarity releases control of the conversation so that the next hand-off
starts with your AI agent again. Sunshine refuses that release from an integration-scoped key unless
that integration currently holds the conversation — which it never does; control sits with the AI
agent or the Agent Workspace. An app-scoped key is not subject to that rule.

With the wrong key everything else still works — messages, replies — so the misconfiguration only
shows when a shopper ends a live chat: the Agent Workspace keeps the conversation, and the shopper's
next hand-off goes straight back to the human instead of re-entering the AI agent. With one
conversation per live phase nothing is ever released, so a wrong key goes unnoticed there; use the
app-scoped key anyway, so that switching modes later does not break.

Note the **app id**, the **key id** and the **secret**; Bloomreach needs all three.

### 3.2 Webhook

Under Apps and integrations → Integrations → Conversations integrations, create an integration with
a webhook:

- **Target URL** — provided by Bloomreach. It is specific to your project and Clarity agent; ask for
  it rather than deriving it.
- **Custom header** — `x-api-key: <webhook secret>`. **Generate** the webhook secret (at least 16
  characters) with a password generator; do not type one by hand. Hand the same value to Bloomreach.
- **Subscribed events** — exactly these three:

  ```
  conversation:message
  switchboard:passControl
  switchboard:releaseControl
  ```

Every reply from your bot or agents, and every transfer to and from a human, reaches the shopper
only through this webhook. Without it the shopper's messages arrive in Zendesk but nothing ever
comes back.

The webhook stays on the conversations integration; the API key of [3.1](#31-conversations-api-key--app-scoped)
is created elsewhere and swapping it does not touch the webhook.

### 3.3 Support API OAuth client — optional

Needed for two things:

- the shopper's *End live support conversation* **solves the ticket** (with one conversation per
  customer, once a human agent has replied in that live session), which ends the agent's messaging
  session through the trigger of
  [3.4](#34-control-must-return-to-your-ai-agent-when-the-human-agent-is-done);
- a form answered in the widget (typically a *Name + Email* form in front of the hand-off to a
  human) also sets the **ticket requester's email**; the requester's name can be set without it —
  see [How the email is written](#how-the-email-is-written).

Without it the hand-over works as described everywhere else in this guide, and the agent's session
stays open after the shopper's ending ([Known limits](#7-known-limits)).

Admin Center → Apps and integrations → APIs → OAuth clients → *Add OAuth client*:

- a **confidential** client;
- `users:read`, `users:write`, `tickets:read` and `tickets:write` among its allowed scopes. The user
  scopes are always needed; a client allowed only those keeps the email working, and only the solve
  fails.

Bloomreach requests short-lived access tokens from this client. The token lifetime defaults to 24
hours; tell Bloomreach if you want another value between 5 minutes and 48 hours (Zendesk's own
bounds).

Why an OAuth client rather than an API token: the Conversations API and the Support API take
different credentials, and Zendesk is retiring Support API tokens (none can be created from
2026-10-27, all stop working on 2027-04-30).

Hand the **client id** and **client secret** to Bloomreach.

### 3.4 Control must return to your AI agent when the human agent is done

Clarity's live phase ends when Sunshine reports that the Agent Workspace released the
conversation (*Release control*, [3.5](#35-messaging-settings)). The shopper sees "The Live Agent
session has ended", and their next message routed to Zendesk goes to your AI agent: with one conversation
per customer in the same Sunshine conversation, as a new session and a new ticket in the AI agent's queue;
with one conversation per live phase in a new conversation and ticket. Until then the widget keeps
showing the live agent, and every message the shopper sends lands in the human agent's ticket, even
after it was solved.

The usual way to return control is ending the ticket's **messaging session** ([About ending
messaging
sessions](https://support.zendesk.com/hc/en-us/articles/8009788438042-About-ending-messaging-sessions)),
which on an account set to *Release control* ([3.5](#35-messaging-settings)) releases the
conversation. A session ends when the agent uses *End session*, when a trigger or automation of
yours runs the *Messaging session → End session* action, when *Capacity release* with *End
messaging session after conversation becomes inactive* is set up ([3.5](#35-messaging-settings))
after 3–15 minutes without a message from the shopper, or when the ticket is closed; Zendesk's
default automation closes a solved ticket after 4 days. *Submit as Solved* on its own does not end
it. The shopper's *End live support conversation* solves the ticket (with one conversation per customer, after a human agent's reply)
when the OAuth client of [3.3](#33-support-api-oauth-client--optional) is configured, so it too ends
the session only through the trigger below.

You need the *Solved → End session* trigger unless your agents, or a trigger or automation of
yours, always end the session when they finish. With the OAuth client of
[3.3](#33-support-api-oauth-client--optional) configured, only a trigger on *Solved* covers the
solve of the shopper's ending: an automation runs hourly, and no agent is there to click when the
shopper ends the chat. *Capacity release* does not replace it: a message
the shopper sends before it fires still lands in the solved ticket. Closing the ticket, 4 days
after the solve by default, is far too late. The trigger:

| | |
|---|---|
| **Admin Center** | Objects and rules → Business rules → Triggers → *Add trigger* |
| **Conditions** (meet all) | `Ticket > Status category` · *Changed to* · `Solved` |
| **Actions** | `Ticket > Messaging session` · `End session` |

With the trigger in place the session ends within seconds of the solve, and the shopper's next message
is answered by the AI agent in a new ticket.

### 3.5 Messaging settings

Two account settings, both under Messaging → *Manage settings*, decide whether an ending on the
Zendesk side ever reaches the shopper:

- **Advanced → Ending sessions → *Agents can end messaging sessions at any time* must be on.** With
  it off, the session is still marked ended on the ticket, but the Agent Workspace does not
  release the conversation and nothing reaches Clarity: the widget keeps showing the live agent, and
  every further message of that shopper bypasses Clarity for your Zendesk AI agent. See [Allowing
  end users to end messaging
  sessions](https://support.zendesk.com/hc/en-us/articles/10046732687770-Allowing-end-users-to-end-messaging-sessions)
  for the background; the agent-side switch has no Multi-Conversations prerequisite.
- **Conversation control must be *Release control*.** On *Release control* the shopper's next
  message goes to the channel's default responder, your AI agent. On *Pass control* the ending hands
  the conversation to the Agent Workspace's next switchboard integration, which opens a new ticket
  and does not answer the shopper. *Pass control* is not supported.

Optional, for tickets the agent never solves: *Capacity release* on the same settings page marks a
conversation inactive after 3–15 minutes without an end-user message (default 10); with *End messaging
session after conversation becomes inactive* selected there, that also ends the session.

### 3.6 Multi-Conversations on the Sunshine app

**Required for one conversation per live phase.** Every live phase opens a new conversation for the
same Sunshine user, and without Multi-Conversations the Sunshine app refuses every one after the
customer's first: from the first ending on, and in any later chat of the same customer, every message routed to
Zendesk fails and the shopper sees an error.
Choose that mode only for an app that has the feature on.

With one conversation per customer a second conversation for the same customer is the exception, needed only when:

- your own Sunshine channel (Web Widget, WhatsApp, ...) already opened a conversation for that
  customer — Clarity never reuses a conversation it did not open;
- two Clarity agents, or two projects, share one Sunshine app — each opens its own conversation.

If either applies to you, enable Multi-Conversations with one conversation per customer too; otherwise the same
error appears for those customers on every message routed to Zendesk.

### 3.7 Your AI agent's dialogue

The hand-over lands with the bot you configured on the channel. If that bot collects details through
a form before escalating, read [Forms](#forms-how-an-answer-reaches-the-ticket) — the widget
answers a form differently from Zendesk's own Web Messenger, and the dialogue needs one extra action
to read the answers.

---

## 4. What to hand to Bloomreach

| Value | Where it comes from | Why Bloomreach needs it |
|---|---|---|
| Zendesk subdomain | The bare subdomain only, in lowercase — `acme` for `acme.zendesk.com`, never the full host or a URL | Every call to Zendesk goes to `<subdomain>.zendesk.com`; the integration only ever sends your credentials to that host |
| Sunshine app id | Conversations API page, see [3.1](#31-conversations-api-key--app-scoped) | Identifies the Sunshine app whose conversations the hand-over creates and reads |
| API key id and secret | The **app-scoped** key of [3.1](#31-conversations-api-key--app-scoped) | Authenticates the messages Clarity sends into Zendesk and the release of control when a live chat ends |
| Webhook secret | The value in the `x-api-key` header of [3.2](#32-webhook) | Lets Clarity verify that a webhook delivery really comes from your Zendesk account; a delivery with another value is rejected |
| OAuth client id and secret | Optional, both or neither — [3.3](#33-support-api-oauth-client--optional), with the token lifetime if not 24 hours | Lets the shopper's ending solve the ticket (with one conversation per customer, once a human agent has replied in that live session), so the trigger of [3.4](#34-control-must-return-to-your-ai-agent-when-the-human-agent-is-done) ends the agent's session with it, and lets a form answered in the widget set the ticket requester's email (the name is also written through it) — see [How the email is written](#how-the-email-is-written) |
| Mode | One conversation per customer (default) or one per live phase | Decides whether a shopper's next hand-over re-enters the open ticket or opens a new one — see [One conversation per customer, or one per live phase](#one-conversation-per-customer-or-one-per-live-phase); the per-live-phase mode also requires [3.6](#36-multi-conversations-on-the-sunshine-app) |
| AI agent takeover wait | Optional. Milliseconds, 0 to 10000; defaults to 2000 | How long the first message of a new conversation waits for your AI agent to take the conversation over — see [One conversation per customer, or one per live phase](#one-conversation-per-customer-or-one-per-live-phase). Raise it if first messages still get only the welcome reply; 0 if your channel's default responder is not an AI agent |
| Satisfaction survey app | Optional. The app that messages the shopper after the ticket is solved, such as Simplesat, with a survey answered through its link; Bloomreach reads the source it posts under from a test conversation | Once a live session has ended, nothing Zendesk sends into the conversation reaches the shopper ([Known limits](#7-known-limits)); messages from the sources listed here are the exception, so the shopper sees the survey while the chat stays back with Clarity |
| End notice text | Optional. The message the agent gets when the shopper ends the chat; defaults to "The customer has ended this chat." | Posted into the conversation on your behalf; it is the agent's only notice that the customer left, so you may want it in your own words and language |
| Topics | The list of conversation topics that belong to Zendesk | This list *is* the routing rule: a shopper message is handed over when the orchestrator judges it to fall inside one of these topics |

Hand these to your Bloomreach customer success contact, who configures them on your Clarity agent.
If any value is invalid, the hand-over is off
entirely — messages do not go out and replies do not come back — rather than half-working. Share
the secrets over a secure channel, not in a ticket or an email.

---

## 5. Supported message types

Your bot or a human agent can send several message shapes from the Zendesk side, but only these
reach the shopper:

| Zendesk content type | What the shopper sees |
|---|---|
| `text` | An ordinary message bubble |
| `image` | An image; any caption becomes its own message |
| `file` | A clickable download link |
| `carousel` | A horizontally scrollable card group (image + title + description + buttons) |
| `form` | A form card with text / email / select inputs and a Send button; every field must be filled in, an email field with a valid address. With `blockChatInput` the widget's own input is disabled until it is answered. A form with a field of another type, or a field without a name or label, is not shown; only its text, if any, arrives |
| `list`, `location`, `formResponse`, `template` | **Nothing at all** |

Buttons attached to a message are filtered too:

| Button type | Supported |
|---|---|
| Link types (`link`, `webview`) | ✅ Opens the target URL |
| Quick reply (`reply`) | ✅ Sends the button label back to Zendesk as the shopper's reply, with the button's payload attached if it has one |
| `buy`, `locationRequest`, `postback` | ❌ Not rendered |

Carousel card buttons support link navigation only, never quick replies — that is a limit of the
Zendesk specification itself.

> **Unsupported types are lost silently.** Zendesk shows the message as delivered while the shopper
> sees nothing. Keep your AI agent's replies and your agents' macros to the supported types.

### Forms: how an answer reaches the ticket

A `form` is how a Zendesk AI agent collects details before escalating. A *Name + Email* form in
front of the hand-off to a human is the typical case, but every form is handled the same way. On
the Zendesk side (AI agents – Advanced) it is a **structured message template** of type *Forms*
(*Settings → CRM integration → Templates*), sent from a dialogue through an *AI agent message* block
holding the template shorthand (`%{{template:TemplateName}}%`), followed by a *Customer message →
Free text written* block and an *Escalation* block. Since an explicit "I want a human" is routed to
the **Escalation reply** system reply by the AI agent itself, that is the dialogue to put the form
in; a custom use case is only reached when its intent is matched.

What the widget's *Send* does, for every form:

1. the answers are written as **conversation metadata**, `{ <field name>: <value> }` — the same
   place Web Messenger's own submission leaves them;
2. a plain text message follows, `Label: value` per line, which is what fires the dialogue's *Free
   text written* block and moves it on to the escalation;
3. optionally, fields named `name`, `givenName` and `surname` also update the Sunshine user's profile
   and, like `email`, the ticket's requester — see [How the name is written](#how-the-name-is-written) and
   [How the email is written](#how-the-email-is-written).

The answer does **not** arrive as a Sunshine `formResponse` (the Conversations API refuses that
content type), so **your dialogue cannot reference the answers as session parameters** the way a
dialogue written for Web Messenger does (`{{Name}}`). Read them from the metadata instead: a *Get
conversation* action — *Field to retrieve* `<Metadata>`, *Key* = the template's field name, *Save
as parameter* — and reference the parameter as `{{parameter}}` from there (the `%{{…}}%` form is the
template shorthand and resolves to nothing there).

Two things to know about your template:

- only the fields of the form the agent actually sent are written: a text field within its
  `maxSize` (default 128, at most 256), an email or select answer within 128 characters, a select
  only with one of its options — anything else in the submission is dropped. Field **names** must not be `externalChatId` or start with `clarity`: those are
  reserved and such a field is never written;
- if writing the answers fails on the Zendesk side, the shopper sees an error and can resubmit — the
  text is deliberately **not** sent on its own, since it would move the dialogue past the form with
  nothing to read.

Field names are matched regardless of case, so `Name` and `Email` work. A field under any other
name (`Full name`, `customer_email`) reaches the conversation metadata only.

#### How the name is written

Zendesk sets the requester's **name** (and the ticket subject, *Conversation with …*) from the
**Sunshine user's profile** (`givenName` + `surname`) when it creates the Support user, at the
Sunshine user's first message, and again at the hand-off to an agent. A profile with no name leaves
the placeholder `User <id>`.

Clarity fills the profile from the form before the answer is sent, with no extra configuration. A
`name` field goes **whole** into `givenName` — it is not split on whitespace — the same convention
the *Update user* action uses, so the two never produce a doubled surname. The half a submission does
not carry is **cleared**: a template that collects only a first name leaves the requester with the
first name only, whatever surname the profile carried before, and a `name`-only template leaves
`surname` empty.

If your dialogue also fills the profile with an *Update user* action (Sunshine Conversations →
Update user, `givenName` = the collected name) in the escalation reply, it runs after Clarity's
write and wins, so the profile is yours. **With the Clarity widget that action needs a *Get
conversation* action in front of it**, as described above, because the answers are only in the
conversation metadata.

#### How the email is written

An email on the Sunshine profile would **never reach the requester**, so Clarity does not write it there: Zendesk ignores an unverified email on a user
that carries an external id ([Requester email is not getting
updated](https://support.zendesk.com/hc/en-us/articles/9532993403546)), and every Sunshine user the
hand-over creates carries one — unlike Web Messenger's unauthenticated users, whose profile email
does come across.

The only route by which a typed email reaches the requester is the [Support API OAuth
client](#33-support-api-oauth-client--optional), whose id and secret you hand to Bloomreach (see
[4](#4-what-to-hand-to-bloomreach)). With it configured, alongside the message:

- a `name` field, or `givenName` + `surname`, replaces the Support user's name — on every
  submission, whatever the current name is;
- an `email` field is added as an **unverified** identity: primary if the user had none, otherwise a
  secondary one next to the existing ones; the same address again changes nothing. Anonymous shoppers
  through the weblayer are included, the identity going onto the Support user of their browser's id;
  a standalone integration that sends no customer id gets none;
- an email is unique across your Support users. One that already belongs to another Support user —
  the ordinary case for a customer who has emailed you before — or that is not an address is refused
  by Zendesk; the name is then written on its own. Nothing is merged or re-assigned: the agent, who
  sees the answer in the transcript, can merge the profiles by hand.

> **An unverified email is still a claim.** Nothing checks that the shopper owns the address they
> typed. Once it is on this requester, Zendesk refuses it on every other Support user — a typo, or
> somebody else's address, is held by this customer until an agent removes the identity by hand
> (user profile → the identity's *Remove*), and the real owner's next hand-off has the email
> refused and only the name written. Each distinct address a customer submits over time is added as
> one more identity; none is ever removed by Clarity. If you want only verified addresses on
> requesters, leave the Support API OAuth client unconfigured and rely on messaging authentication
> (a JWT-signed email) instead; the shopper's ending then no longer solves the ticket.

The requester update is best effort: if the Support API is slow or refuses, the shopper's message
still goes through and the answers are still in the transcript.

---

## 6. Rotating the webhook secret

**Tell Bloomreach the new secret first, then update the `x-api-key` header on the Zendesk webhook**,
back to back.

Doing it in the other order, or leaving too long between the two steps, means Zendesk keeps getting
`401` responses; once it exhausts its retries (up to 5 attempts over 15 minutes), replies from that
window are lost for good.

---

## 7. Known limits

| Limit | What you will notice |
|---|---|
| Unsupported message types are lost silently | Zendesk shows the message as delivered, the shopper sees nothing — see [Supported message types](#5-supported-message-types) |
| Without the OAuth client, the shopper's ending does not end the agent's session | Without the Support API OAuth client of [3.3](#33-support-api-oauth-client--optional), or with a client lacking the ticket scopes, or without the trigger of [3.4](#34-control-must-return-to-your-ai-agent-when-the-human-agent-is-done), or, with one conversation per customer, when the shopper ends before a human agent replied, the widget's *End live support conversation* ends the live phase for the shopper, but the agent's messaging session stays open until the agent ends it or, with the trigger in place, solves the ticket, and so does the ticket (with the client but without the trigger, it is already solved and only *End session* helps). With one conversation per customer the shopper's next message routed to Zendesk re-enters that conversation and lands in that ticket: after a human had replied, the human agent answers if they are still active on it, otherwise Zendesk's AI agent steps in — into the same ticket, which never moves to the AI agent's queue, and when it takes over is Zendesk's behaviour and not configurable; after an ending while still "Connecting", the message waits for your agents in that ticket ([For the shopper](#for-the-shopper)). With one conversation per live phase the next hand-off opens a new conversation and a new ticket instead, and without the client the old ticket merely stays open |
| A human agent's messages after the ending are not delivered | Once a live phase has ended, whoever ended it, nothing Zendesk sends into the conversation reaches the shopper until their next message is handed over, and it is not delivered afterwards either. Your AI agent only answers the shopper's messages, so in practice what is lost is what a human agent sends after the ending: replies still typed into the ticket, or a later follow-up on it. A survey app's message is delivered when you name the app in [section 4](#4-what-to-hand-to-bloomreach), unless the shopper's next hand-off already opened a new conversation (one conversation per live phase); one sent minutes after the ending may appear only once the shopper returns to the page's tab, reloads the page, or sends a message that is handed over to Zendesk again. From the next hand-off on, replies arrive again, in the same Clarity chat and, with one conversation per customer, the same Sunshine conversation. When the shopper ended the chat, the end notice message tells the agent so; an ending on the Zendesk side posts nothing into the conversation |
| No conversation across devices through the weblayer (one conversation per customer) | The id is kept per browser, so a shopper on another device starts another conversation and the agent sees one thread per browser. Only a standalone integration passing the same id on every device links them; two such devices used at once then end each other's live session with every message routed to Zendesk |
| One thread per live phase (one conversation per live phase) | Every hand-off after an ending opens another ticket, and the agent sees several threads per customer. Without an OAuth client allowed the ticket scopes ([3.3](#33-support-api-oauth-client--optional)), each ending by the shopper also leaves the previous ticket open |
| Multi-Conversations required on the Sunshine app (one conversation per live phase) | Without it every message routed to Zendesk after the customer's first conversation fails for the shopper — see [3.6](#36-multi-conversations-on-the-sunshine-app) |
| The account settings of [3.5](#35-messaging-settings) gate the agent's ending | With *Agents can end messaging sessions* off, no ending ever reaches the shopper and the chat stays live until the shopper ends it; on *Pass control* the next integration does not answer the shopper. Neither is detectable before the first live chat |
| No file upload in a Zendesk session | A shopper who needs to show a photo has to describe it instead |
| Conversation metadata is shared | Sunshine caps a conversation's metadata at 4 KB for the whole object. If your own metadata keys leave too little room, the context summary is dropped for that hand-off |
| Ending a live chat is widget-only | Only the widget offers the end button; the agent side can always end the session |

---

## 8. Troubleshooting

Every symptom below shows in the widget or in Zendesk, and most causes can be checked in Zendesk Admin
Center. Where only Bloomreach's logs show the cause, the row says so: send Bloomreach the time of the
failure, with its time zone.

| What you see | Likely cause | What to do |
|---|---|---|
| The webhook's delivery log shows `401 {"error":"invalid api key"}` | The `x-api-key` header does not match the secret Bloomreach has, or the target URL is not the one Bloomreach gave you. A wrong secret, a URL pointing at another project or agent, and an invalid configuration on the Bloomreach side all return exactly this response; a malformed URL returns 400 or 404 | Compare the header with the secret you handed over; after a rotation, check the order of [section 6](#6-rotating-the-webhook-secret). If both match, ask Bloomreach to check the configuration: which of the three causes applies shows only in Bloomreach's logs |
| Shoppers' messages arrive in Zendesk, nothing comes back | The webhook is missing, disabled or not subscribed to the three events of [3.2](#32-webhook) | Check the integration's webhook and its event subscriptions. If they are correct, ask Bloomreach: the cause then shows only in Bloomreach's logs |
| After the shopper ends a live chat, their next hand-off goes straight back to the human instead of the AI agent | Either the key is integration-scoped ([3.1](#31-conversations-api-key--app-scoped)), or the agent's messaging session is still open: no OAuth client is configured ([Known limits](#7-known-limits)), the client lacks `tickets:read` / `tickets:write`, the trigger of [3.4](#34-control-must-return-to-your-ai-agent-when-the-human-agent-is-done) is missing, or, with one conversation per customer, the shopper ended the chat while still "Connecting", before any human reply, in which case the ticket is left open on purpose ([For the shopper](#for-the-shopper)) | Check where the key was created, the client's scopes ([3.3](#33-support-api-oauth-client--optional)) and the trigger. If the shopper ended after a human reply and the ticket still shows open, a ticket field your account requires before a solve may have refused it: ask Bloomreach, the refusal shows only in Bloomreach's logs |
| The agent ended the session or solved the ticket, but the widget still shows the live agent | *Agents can end messaging sessions at any time* is off, or the solve returned no control: the trigger of [3.4](#34-control-must-return-to-your-ai-agent-when-the-human-agent-is-done) is missing | Fix the setting or the trigger; meanwhile the shopper's only way out is the widget's own end button |
| The solve created a new ticket that nobody answers | The account is on *Pass control* | Switch Conversation control to *Release control* ([3.5](#35-messaging-settings)) |
| A shopper gets an error on every message routed to Zendesk | The Sunshine app refuses a second conversation for that user: Multi-Conversations is off while the mode or your own channels need it | Check Multi-Conversations on the Sunshine app ([3.6](#36-multi-conversations-on-the-sunshine-app)) and enable it, or switch to one conversation per customer. If it is already on, ask Bloomreach: the refusal Zendesk returns is visible only in Bloomreach's logs |
| The shopper's first message after a hand-off gets only the AI agent's welcome reply; repeating it works | The message reached the conversation before your AI agent took it over; Zendesk's conversation log marks it *Not processed* | Ask Bloomreach to raise the AI agent takeover wait ([section 4](#4-what-to-hand-to-bloomreach)) |
| A form is answered but the dialogue does not escalate | The dialogue has no *Free text written* block after the form | Review the dialogue against [Forms](#forms-how-an-answer-reaches-the-ticket) |
| The dialogue reads no value for one form field | The field's name is reserved, so its answer is not written to the conversation metadata | Rename the field ([Forms](#forms-how-an-answer-reaches-the-ticket)) |
| The requester is named `User <id>` or the *Update user* action writes nothing | The *Update user* action references session parameters that the widget's submission does not produce | Add a *Get conversation* action reading `<Metadata>` in front of it |
| The requester has no email after a form | No Support API OAuth client is configured, the address already belongs to another Support user, or a standalone integration sends no customer id | Configure the client ([3.3](#33-support-api-oauth-client--optional)); for an address held by another user, the agent can merge the profiles by hand; for a standalone integration, set `getCurrentCustomerId` |
| A message shows as delivered in Zendesk but the shopper saw nothing | An unsupported content type or button type | Use the types of [section 5](#5-supported-message-types) |
| A human agent's message after the live chat ended never reached the shopper | Expected after any ending, by the shopper or by the agent: nothing the agent sends into the conversation reaches the shopper until their next hand-off, and it is not delivered then either ([Known limits](#7-known-limits)) | Nothing to recover. When the shopper ended the chat, the end notice told the agent; an ending on the Zendesk side posts nothing into the conversation. A follow-up that must reach the customer has to go another way |
| A shopper on two devices sees the live session end on one of them | Expected with one conversation per customer when a standalone integration passes the same id on both devices: the other device took the conversation over | Nothing to do; see [the two modes](#one-conversation-per-customer-or-one-per-live-phase) |

---

[← Chapter 7 — Search orchestration](07-search-orchestration.md) · [Back to Getting Started →](README.md)
