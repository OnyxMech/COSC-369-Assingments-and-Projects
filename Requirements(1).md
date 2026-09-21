# Campus Event Board: Requirements (Iteration 1)

## 1. Customer Statement of Requirements

Campus events are announced in scattered places: flyers, group chats, club email lists, and social media. As a result, students miss events they would have enjoyed, and organizers struggle to reach the right audience. **Campus Event Board** is a web application that gives a campus community one central place to discover, post, and RSVP to events.

Students can browse upcoming events, search and filter them by category, date, or keyword, and RSVP to the ones they plan to attend. Event organizers (student clubs, departments, and staff) can post and manage events, either one at a time through a form or in bulk by uploading a CSV file. To avoid re-entering events that already exist elsewhere, the app can also pull events from a public calendar feed (iCalendar/ICS) published by the university or a club. Administrators can review and remove inappropriate or duplicate listings.

**In scope (Iteration 1):** user accounts with roles, event posting and management, browsing and filtering, RSVPs with optional capacity limits, CSV import, ICS feed import, and basic moderation.

**Out of scope (Iteration 1):** ticket sales or payments, native mobile apps, social features such as comments and friend lists, and push notifications.

## 2. Requirements Specification

### 2.1 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | The system shall allow a visitor to register an account with a name, email address, and password. |
| FR-2 | The system shall allow a registered user to log in and log out securely. |
| FR-3 | The system shall support three roles: student, organizer, and administrator, with role-appropriate permissions. |
| FR-4 | The system shall allow an organizer to create an event with a title, description, category, location, start time, end time, and optional capacity. |
| FR-5 | The system shall allow an organizer to edit and cancel only their own events. |
| FR-6 | The system shall display a list of upcoming events, sorted by start time, to all visitors, including those not logged in. |
| FR-7 | The system shall allow users to search events by keyword and filter them by category, date range, and location. |
| FR-8 | The system shall provide an event detail page showing all event information, the organizer, and the current RSVP count. |
| FR-9 | The system shall allow a logged-in student to RSVP to an event and to cancel their RSVP. |
| FR-10 | The system shall prevent RSVPs once an event has reached its capacity and shall display the event as "Full". |
| FR-11 | The system shall allow a user to view a personal list of the events they have RSVP'd to. |
| FR-12 | The system shall allow an organizer to view the list of attendees who have RSVP'd to their events. |
| FR-13 | The system shall allow an organizer to bulk-import events by uploading a CSV file and shall report any rows that were rejected and why. |
| FR-14 | The system shall allow an administrator to register a public ICS calendar feed URL and shall import new events from that feed on request and on a daily schedule, skipping events that already exist. |
| FR-15 | The system shall allow a user to download an event as an .ics file to add it to their personal calendar. |
| FR-16 | The system shall allow an administrator to remove any event, deactivate any user account, and manage the list of event categories. |

### 2.2 Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-1 | Security | Passwords shall be stored only as salted hashes (e.g., bcrypt); plaintext passwords shall never be stored or logged. |
| NFR-2 | Security | All traffic shall use HTTPS, and all actions shall be checked against the user's role on the server, not only in the interface. |
| NFR-3 | Security | User input shall be validated and sanitized to protect against SQL injection and cross-site scripting (XSS). |
| NFR-4 | Performance | The event list and search results shall load within 2 seconds with up to 10,000 events in the database. |
| NFR-5 | Performance | A CSV import of 500 events shall complete within 10 seconds. |
| NFR-6 | Usability | The interface shall be responsive and usable on both desktop and mobile browsers. |
| NFR-7 | Usability | A student shall be able to find an event and RSVP to it in under 1 minute without instructions. |
| NFR-8 | Reliability | If an external calendar feed is unreachable or malformed, the system shall keep existing events unchanged and log the failure for administrators. |
| NFR-9 | Reliability | The database shall be backed up daily. |
| NFR-10 | Concurrency | Two users RSVPing at the same moment to the last available spot shall never cause the event to exceed its capacity. |
| NFR-11 | Compatibility | The application shall work in the current versions of Chrome, Firefox, Safari, and Edge. |
| NFR-12 | Accessibility | The interface shall meet WCAG 2.1 AA guidelines for color contrast, keyboard navigation, and screen reader labels. |
| NFR-13 | Maintainability | The codebase shall be version controlled on GitHub, follow a consistent style guide, and include automated tests for core logic such as RSVP capacity and CSV validation. |
| NFR-14 | Privacy | Attendee lists shall be visible only to the organizer of that event and to administrators. |

## 3. Data and Storage Blueprint

### 3.1 Data Input

Campus Event Board uses three input mechanisms:

1. **Manual entry:** users register, and organizers create and edit events, through web forms with client-side and server-side validation. Students RSVP with a single button click.
2. **Reading a dataset from a file:** organizers upload a CSV file (columns: title, description, category, location, start_time, end_time, capacity). The server parses the file, validates each row, saves valid events, and returns a report of rejected rows.
3. **Fetching from a website:** an administrator registers the URL of a public ICS calendar feed. The server downloads and parses the feed, creates events that are not already in the database (matched by the feed's unique event ID), and repeats this once per day.

### 3.2 Database or Storage

**Solution:** PostgreSQL (SQL relational database).

**Rationale:** The data is structured and strongly relational (organizers own events, students RSVP to events, events belong to categories). PostgreSQL provides foreign key constraints, unique constraints (one RSVP per user per event), and transactions with row locking, which are needed to enforce event capacity safely under concurrent RSVPs. It also supports fast date-range queries and full-text search for the browse and filter features.

**Planned tables:**

| Table | Key Columns |
|-------|-------------|
| `users` | id (PK), name, email (unique), password_hash, role (student / organizer / admin), is_active, created_at |
| `categories` | id (PK), name (unique) |
| `events` | id (PK), organizer_id (FK to users), category_id (FK to categories), title, description, location, start_time, end_time, capacity (nullable), status (active / cancelled), source (manual / csv / ics), external_uid (nullable, unique per feed), created_at |
| `rsvps` | id (PK), user_id (FK to users), event_id (FK to events), created_at; unique (user_id, event_id) |
| `feed_sources` | id (PK), name, url, last_synced_at, last_status |

**Relationships:** one organizer has many events; one category has many events; users and events are connected many-to-many through `rsvps`; imported events reference the feed they came from through their `source` and `external_uid` values.
