[← Back to Chapter 5 — Search orchestration](05-search-orchestration.md)

# 6. Customer service hand-over to Zendesk

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
is "The customer has ended this chat." Note that this does **not** end the agent's messaging session
or ticket; see [Known limits](#8-known-limits).

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

**One conversation per customer — the default.** An identified customer has **one** Sunshine
conversation, however many chats they open over time. The agent sees one continuous thread per
customer, across chats, devices and sessions, with the context summary refreshed at every hand-off.
If the previous ticket is still open, a new hand-off threads into it rather than opening another.
Two devices used at once take the conversation from each other with every message routed to Zendesk
— a shopper with the same login on a second device sees the first device's live session end.

**One conversation per live phase.** Every hand-off that does not continue a live phase opens a new
Sunshine conversation: a chat's first one, and a new one after every ending, whether the shopper or
Zendesk ended it. Nothing is ever re-entered, so there is no cross-device continuity — a second
device of the same customer opens its own conversation, and the agent sees one thread per live phase,
each with its own ticket. An open ticket is never re-entered; the price is several tickets per
customer. This mode **requires Multi-Conversations enabled on the Sunshine app** — see
[Multi-Conversations](#36-multi-conversations-on-the-sunshine-app).

Anonymous shoppers (no customer id) are one Sunshine user per chat in both modes.

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
- Your storefront passes an **unguessable customer id** to the widget — see
  [The customer id must be unguessable](#5-the-customer-id-must-be-unguessable).

---

## 3. What to set up in Zendesk Admin Center

### 3.1 Conversations API key — app-scoped

Admin Center hands out two kinds of Sunshine key, and only one of them works:

| Created under | Scope | Usable |
|---|---|---|
| **Apps and integrations → APIs → Conversations API** → *Create API key* | app | **Yes** |
| Apps and integrations → Integrations → Conversations integrations (the page the webhook is on) | integration | No |

The difference is the switchboard. In the default mode (one conversation per customer), when the
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

Needed only if a form answered in the widget (typically a *Name + Email* form in front of the
hand-off to a human) should also set the **ticket requester's email**; the requester's name can be
set without it — see [How the email is written](#how-the-email-is-written). Without
it the hand-over works as described everywhere else in this guide.

Admin Center → Apps and integrations → APIs → OAuth clients → *Add OAuth client*:

- a **confidential** client;
- `users:read` and `users:write` among its allowed scopes.

Bloomreach requests short-lived access tokens from this client. The token lifetime defaults to 24
hours; tell Bloomreach if you want another value between 5 minutes and 48 hours (Zendesk's own
bounds).

Why an OAuth client rather than an API token: the Conversations API and the Support API take
different credentials, and Zendesk is retiring Support API tokens (none can be created from
2026-10-27, all stop working on 2027-04-30).

Hand the **client id** and **client secret** to Bloomreach.

### 3.4 A trigger: solving the ticket must end the messaging session

Zendesk hands a conversation back to its AI agent when the ticket's **messaging session** ends
([About ending messaging
sessions](https://support.zendesk.com/hc/en-us/articles/8009788438042-About-ending-messaging-sessions)):
the next end-user message then opens a new session and a new ticket, in the AI agent's queue, and
the shopper sees "The Live Agent session has ended". The agent's *End session* button does that.
*Submit as Solved* on its own does not, and neither does the shopper's *End live support
conversation*. So every account needs a trigger that ends the session when the agent solves the
ticket:

| | |
|---|---|
| **Admin Center** | Objects and rules → Business rules → Triggers → *Add trigger* |
| **Conditions** (meet all) | `Ticket > Status category` · *Changed to* · `Solved` |
| **Actions** | `Ticket > Messaging session` · `End session` |

Do **not** add a `Ticket > Channel is Messaging` condition: tickets opened through this integration
are *via Sunshine Conversations API*, not *Messaging*, and the trigger never fires. The same applies
to any view or trigger you scope by channel. With the trigger in place the session ends within
seconds of the solve, and the shopper's next message is answered by the AI agent in a new ticket.

### 3.5 Messaging settings

Two account settings, both under Messaging → *Manage settings*, decide whether an ending on the
Zendesk side ever reaches the shopper:

- **Advanced → Ending sessions → *Agents can end messaging sessions at any time* must be on.** With
  it off, the trigger still marks the ticket's session ended, but the Agent Workspace does not
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
first: from the first ending on, every message routed to Zendesk fails and the shopper sees an error.
Choose that mode only for an app that has the feature on.

In the default mode a second conversation for the same customer is the exception, needed only when:

- your own Sunshine channel (Web Widget, WhatsApp, ...) already opened a conversation for that
  customer — Clarity never reuses a conversation it did not open;
- two Clarity agents, or two projects, share one Sunshine app — each opens its own conversation.

If either applies to you, enable Multi-Conversations in the default mode too; otherwise the same
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
| Zendesk subdomain | The bare subdomain only — `acme` for `acme.zendesk.com`, never the full host or a URL | Every call to Zendesk goes to `<subdomain>.zendesk.com`; the integration only ever sends your credentials to that host |
| Sunshine app id | Conversations API page, see [3.1](#31-conversations-api-key--app-scoped) | Identifies the Sunshine app whose conversations the hand-over creates and reads |
| API key id and secret | The **app-scoped** key of [3.1](#31-conversations-api-key--app-scoped) | Authenticates the messages Clarity sends into Zendesk and the release of control when a live chat ends |
| Webhook secret | The value in the `x-api-key` header of [3.2](#32-webhook) | Lets Clarity verify that a webhook delivery really comes from your Zendesk account; a delivery with another value is rejected |
| OAuth client id and secret | Optional, both or neither — [3.3](#33-support-api-oauth-client--optional), with the token lifetime if not 24 hours | Only needed if a form answered in the widget should set the ticket requester's email (the name is also written through it) — see [How the email is written](#how-the-email-is-written) |
| Mode | One conversation per customer (default) or one per live phase | Decides whether a shopper's next hand-over re-enters the open ticket or opens a new one — see [One conversation per customer, or one per live phase](#one-conversation-per-customer-or-one-per-live-phase); the per-live-phase mode also requires [3.6](#36-multi-conversations-on-the-sunshine-app) |
| AI agent takeover wait | Optional. Milliseconds, 0 to 10000; defaults to 2000 | How long the first message of a new conversation waits for your AI agent to take the conversation over — see [One conversation per customer, or one per live phase](#one-conversation-per-customer-or-one-per-live-phase). Raise it if first messages still get only the welcome reply; 0 if your channel's default responder is not an AI agent |
| End notice text | Optional. The message the agent gets when the shopper ends the chat; defaults to "The customer has ended this chat." | Posted into the conversation on your behalf; it is the agent's only notice that the customer left, so you may want it in your own words and language |
| Topics | The list of conversation topics that belong to Zendesk | This list *is* the routing rule: a shopper message is handed over when the orchestrator judges it to fall inside one of these topics |

Hand these to your Bloomreach customer success contact, who configures them on your Clarity agent.
If any value is invalid, the hand-over is off
entirely — messages do not go out and replies do not come back — rather than half-working. Share
the secrets over a secure channel, not in a ticket or an email.

---

## 5. The customer id must be unguessable

With one Sunshine conversation per customer, the customer's identity is what gives a chat access to
that conversation — the agent's replies included. The customer id is what your storefront returns
from [`getCurrentCustomerId`](../reference/widget-config.md#getcurrentcustomerid-string) in the
widget configuration. A storefront that passes an enumerable value, such as a sequential account id,
lets anyone who guesses it read and continue another customer's support conversation from a fresh
chat — and, with the Support API OAuth client configured, rename that customer's ticket requester
and attach email identities to it through a form.

**Pass a random or hashed value** — an Engagement cookie id, a UUID, an HMAC of the account id —
never the raw account id. Anonymous shoppers are not exposed: their Sunshine user is the chat itself.

---

## 6. Supported message types

Your bot or a human agent can send several message shapes from the Zendesk side, but only these
reach the shopper:

| Zendesk content type | What the shopper sees |
|---|---|
| `text` | An ordinary message bubble |
| `image` | An image; any caption becomes its own message |
| `file` | A clickable download link |
| `carousel` | A horizontally scrollable card group (image + title + description + buttons) |
| `form` | A form card with text / email / select inputs and a Send button; with `blockChatInput` the widget's own input is disabled until it is answered |
| `list`, `location`, `formResponse`, `template` | **Nothing at all** |

Buttons attached to a message are filtered too:

| Button type | Supported |
|---|---|
| Link types (`link`, `webview`) | ✅ Opens the target URL |
| Quick reply (`reply`) | ✅ Sends the preset value back to Zendesk as the shopper's reply |
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
3. optionally, fields named `name`, `givenName`, `surname` and `email` also update the customer's
   profile — see [How the name is written](#how-the-name-is-written) and
   [How the email is written](#how-the-email-is-written).

The answer does **not** arrive as a Sunshine `formResponse` (the Conversations API refuses that
content type), so **your dialogue cannot reference the answers as session parameters** the way a
dialogue written for Web Messenger does (`{{Name}}`). Read them from the metadata instead: a *Get
conversation* action — *Field to retrieve* `<Metadata>`, *Key* = the template's field name, *Save
as parameter* — and reference the parameter as `{{parameter}}` from there (the `%{{…}}%` form is the
template shorthand and resolves to nothing there).

Three things to know about your template:

- only the fields of the form the agent actually sent are written: a text field within its
  `maxSize` (default 128, at most 256), an email or select answer within 128 characters, a select
  only with one of its options — anything else in the submission is dropped. Field **names** must not be `externalChatId` or start with `clarity`: those are
  reserved and such a field is never written;
- if writing the answers fails on the Zendesk side, the shopper sees an error and can resubmit — the
  text is deliberately **not** sent on its own, since it would move the dialogue past the form with
  nothing to read;
- the answer has to arrive while the dialogue is still waiting — a dialogue waits for it only for a
  limited time and re-sends the form on the next message. The widget sends immediately on *Send*, so
  this only matters for a shopper who leaves the form open for a long time.

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

The profile's **email never reaches the requester**: Zendesk ignores an unverified email on a user
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
  secondary one next to the existing ones; the same address again changes nothing. This happens only
  for identified shoppers (a known customer id), never for anonymous ones;
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
> (a JWT-signed email) instead.

The requester update is best effort: if the Support API is slow or refuses, the shopper's message
still goes through and the answers are still in the transcript.

---

## 7. Rotating the webhook secret

**Tell Bloomreach the new secret first, then update the `x-api-key` header on the Zendesk webhook**,
back to back.

Doing it in the other order, or leaving too long between the two steps, means Zendesk keeps getting
`401` responses; once it exhausts its retries (up to 5 attempts over 15 minutes), replies from that
window are lost for good.

---

## 8. Known limits

| Limit | What you will notice |
|---|---|
| Unsupported message types are lost silently | Zendesk shows the message as delivered, the shopper sees nothing — see [Supported message types](#6-supported-message-types) |
| The shopper's ending does not end the agent's session | The widget's *End live support conversation* ends the live phase for the shopper, but the agent's messaging session and the ticket stay open until the agent ends the session or solves the ticket. In the default mode the shopper's next message routed to Zendesk re-enters that open ticket: the human agent answers if they are still active on it, otherwise Zendesk's AI agent steps in — into the same ticket, which never moves to the AI agent's queue. When the AI agent takes over is Zendesk's behaviour and not configurable. With one conversation per live phase the next hand-off opens a new conversation and a new ticket instead, and the old ticket merely stays open |
| A human agent can reply until the session ends | After the shopper ends the chat the agent may keep typing into the ticket; those replies are never shown to the shopper. The end notice message is what tells the agent the customer left |
| Two devices at once (default mode) | A shopper on two devices at once has each device end the other's live session with every message routed to Zendesk |
| One thread per live phase, no cross-device continuity (per-live-phase mode) | Every ending leaves the agent's ticket open and the next hand-off opens another; a second device of the same customer opens its own conversation; the agent sees several threads per customer |
| Multi-Conversations required on the Sunshine app (per-live-phase mode) | Without it every message after the first ending fails for the shopper — see [3.6](#36-multi-conversations-on-the-sunshine-app) |
| The account settings of [3.5](#35-messaging-settings) gate the agent's ending | With *Agents can end messaging sessions* off, no ending ever reaches the shopper and the chat stays live until the shopper ends it; on *Pass control* the next integration does not answer the shopper. Neither is detectable before the first live chat |
| No proactive outreach | Once the shopper is back with Clarity, a later Zendesk message is not pushed to them |
| No file upload in a Zendesk session | A shopper who needs to show a photo has to describe it instead |
| Conversation metadata is shared | Sunshine caps a conversation's metadata at 4 KB for the whole object. If your own metadata keys leave too little room, the context summary is dropped for that hand-off |
| Ending a live chat is widget-only | Only the widget offers the end button; the agent side can always end the session |

---

## 9. Troubleshooting

| What you see | Likely cause | What to do |
|---|---|---|
| The webhook's delivery log shows `401 {"error":"invalid api key"}` | The `x-api-key` header does not match the secret Bloomreach has, or the target URL is not the one Bloomreach gave you. A wrong secret, a URL pointing at another project or agent, and an invalid configuration on the Bloomreach side all return exactly this response; a malformed URL returns 400 or 404 | Compare the header with the secret you handed over; after a rotation, check the order of [section 7](#7-rotating-the-webhook-secret). If both match, ask Bloomreach to check the configuration |
| Shoppers' messages arrive in Zendesk, nothing comes back | The webhook is missing, disabled or not subscribed to the three events of [3.2](#32-webhook) | Check the integration's webhook and its event subscriptions |
| After the shopper ends a live chat, their next hand-off goes straight back to the human instead of the AI agent | Either the key is integration-scoped ([3.1](#31-conversations-api-key--app-scoped)), or the agent's messaging session is still open ([Known limits](#8-known-limits)) | Check where the key was created. If it is app-scoped, the agent has to end the session or solve the ticket with the trigger of [3.4](#34-a-trigger-solving-the-ticket-must-end-the-messaging-session) in place |
| The agent ended the session or solved the ticket, but the widget still shows the live agent | *Agents can end messaging sessions at any time* is off, or the trigger of [3.4](#34-a-trigger-solving-the-ticket-must-end-the-messaging-session) is missing or has a *Channel is Messaging* condition | Fix the setting or the trigger; meanwhile the shopper's only way out is the widget's own end button |
| The solve created a new ticket that nobody answers | The account is on *Pass control* | Switch Conversation control to *Release control* ([3.5](#35-messaging-settings)) |
| A shopper gets an error on every message routed to Zendesk | The Sunshine app refuses a second conversation for that user: Multi-Conversations is off while the mode or your own channels need it | Enable Multi-Conversations ([3.6](#36-multi-conversations-on-the-sunshine-app)) or switch to one conversation per customer |
| The shopper's first message after a hand-off gets only the AI agent's welcome reply; repeating it works | The message reached the conversation before your AI agent took it over; Zendesk's conversation log marks it *Not processed* | Ask Bloomreach to raise the AI agent takeover wait ([section 4](#4-what-to-hand-to-bloomreach)) |
| A form is answered but the dialogue does not escalate | The dialogue has no *Free text written* block after the form, or the field names collide with the reserved ones, or the dialogue timed out | Review the dialogue against [Forms](#forms-how-an-answer-reaches-the-ticket) |
| The requester is named `User <id>` or the *Update user* action writes nothing | The *Update user* action references session parameters that the widget's submission does not produce | Add a *Get conversation* action reading `<Metadata>` in front of it |
| The requester has no email after a form | No Support API OAuth client is configured, the shopper is anonymous, or the address already belongs to another Support user | Configure the client ([3.3](#33-support-api-oauth-client--optional)); for an address held by another user, the agent can merge the profiles by hand |
| A message shows as delivered in Zendesk but the shopper saw nothing | An unsupported content type or button type | Use the types of [section 6](#6-supported-message-types) |
| The agent's reply after the customer left never reached the shopper | Expected: the shopper ended the live chat | The end notice is what tells the agent; end the session or solve the ticket |
| A shopper on two devices sees the live session end on one of them | Expected in the default mode: the other device took the conversation over | Nothing to do; see [the two modes](#one-conversation-per-customer-or-one-per-live-phase) |

---

[← Chapter 5 — Search orchestration](05-search-orchestration.md) · [Back to Getting Started →](README.md)
