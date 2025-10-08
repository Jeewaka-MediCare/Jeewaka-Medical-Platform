🩺 Patient Side

In the hero section, add a new tab labeled “Medical Records” next to the existing “Appointments” tab.

When selected:

Fetch records from the backend (read-only).

Display record metadata (title, date, edited by).

Render Markdown content in a styled, read-only viewer using a Markdown display library (e.g. react-markdown).

No edit controls or write actions.

🧑‍⚕️ Doctor Side

In each appointment card, add a “Medical Records” button.

This button appears only for doctors who have that appointment.

When clicked:

Open the patient’s record in an editable Markdown interface.

Allow updates and saving through your existing backend APIs.

Hide this button for all other users.

🔐 Access & Permissions

Respect existing authentication/authorization logic:

Patients → read-only.

Doctors with appointment → read/write.

Backend continues to enforce access; frontend only reflects allowed actions.