import { CreateInvitationButton } from '../components/CreateInvitationButton';

// Pitch scheduler invitation — written either by the Outlook routine (via its
// Sanity MCP connector, for Yali-teammate-initiated email threads only) or by
// Pranav manually in Studio (WhatsApp-originated asks, or no founder email on
// file yet). See docs/pitch-scheduler-plan.md for the full design.
//
// Editable in Studio: contactMethod, whatsappNumber, founderEmail, companyName
// — the "who is this for" inputs Pranav provides before generating. Everything
// else (the code, slots, status, etc.) is system-generated and read-only —
// the API routes/routine write it via a service token, which bypasses
// `readOnly` (a Studio form restriction, not an API one).

const pitchSchedulerInvitation = {
  name: 'pitchSchedulerInvitation',
  title: 'Pitch Scheduler Invitation',
  type: 'document',
  groups: [
    { name: 'input', title: 'Who is this for' },
    { name: 'generated', title: 'Generated' },
  ],
  fields: [
    {
      name: 'contactMethod',
      title: 'Contact Method',
      type: 'string',
      group: 'input',
      initialValue: 'email',
      options: {
        list: [
          { title: 'Email', value: 'email' },
          { title: 'WhatsApp', value: 'whatsapp' },
        ],
      },
      description: 'Email: OTP delivered by this app. WhatsApp: Pranav sends the link and the plaintext code himself after generating below.',
    },
    {
      name: 'whatsappNumber',
      title: 'WhatsApp Number',
      type: 'string',
      group: 'input',
      hidden: ({ document }) => document?.contactMethod !== 'whatsapp',
      description: 'Only used to remember who this is for — not used for delivery by this app.',
    },
    {
      name: 'founderEmail',
      title: 'Founder Email',
      type: 'string',
      group: 'input',
      validation: (Rule) => Rule.email(),
      description: 'Required for email-contact invitations (the OTP is sent here). Leave blank for whatsapp-contact invitations with no email yet — the founder provides it in the slot-picker form on submit.',
    },
    {
      name: 'companyName',
      title: 'Startup Name',
      type: 'string',
      group: 'input',
      description: 'Optional at creation — fill in if known, otherwise the founder provides it on submit.',
    },
    // Generate action — reads the fields above via useFormValue, calls the
    // manual-invite API, and shows the resulting link (+ plaintext code for
    // whatsapp-contact invitations, shown once, never stored).
    {
      name: 'generateAction',
      title: 'Generate Invitation',
      type: 'string',
      group: 'input',
      readOnly: true,
      components: { input: CreateInvitationButton },
    },
    {
      name: 'invitationId',
      title: 'Invitation ID',
      type: 'string',
      group: 'generated',
      readOnly: true,
      description: 'Opaque, high-entropy ID. Matches the ?invite= param in the founder\'s link.',
    },
    {
      name: 'codeSalt',
      title: 'Code Salt',
      type: 'string',
      group: 'generated',
      readOnly: true,
      hidden: true,
      description: 'Random per-invitation salt. Paired with codeHash to verify the code without any shared secret.',
    },
    {
      name: 'codeHash',
      title: 'Code Hash',
      type: 'string',
      group: 'generated',
      readOnly: true,
      hidden: true,
      description: 'sha256(codeSalt + code). Never store the code itself. No shared secret needed — the random salt plus rate limiting is what makes this safe.',
    },
    {
      name: 'slots',
      title: 'Slot Snapshot',
      type: 'array',
      group: 'generated',
      readOnly: true,
      of: [
        {
          type: 'object',
          fields: [
            { name: 'slotId', title: 'Slot ID', type: 'string' },
            { name: 'startUTC', title: 'Start (UTC)', type: 'datetime' },
            { name: 'endUTC', title: 'End (UTC)', type: 'datetime' },
          ],
        },
      ],
      description: 'Snapshotted at creation time. Not a live calendar query.',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'generated',
      readOnly: true,
      initialValue: 'invited',
      options: {
        list: [
          { title: 'Invited', value: 'invited' },
          { title: 'Submitted', value: 'submitted' },
          { title: 'Expired', value: 'expired' },
          { title: 'Cancelled', value: 'cancelled' },
        ],
      },
    },
    {
      name: 'selectedSlotId',
      title: 'Selected Slot ID',
      type: 'string',
      group: 'generated',
      readOnly: true,
    },
    {
      name: 'teammateEmails',
      title: 'Teammate Emails',
      type: 'array',
      group: 'generated',
      readOnly: true,
      of: [{ type: 'string' }],
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      group: 'generated',
      readOnly: true,
    },
    {
      name: 'expiresAt',
      title: 'Expires At',
      type: 'datetime',
      group: 'generated',
      readOnly: true,
      description: 'Invitation/code validity — 48h from creation. Separate from the session cookie\'s own 48h clock, which starts at verification.',
    },
    {
      name: 'notificationStatus',
      title: 'Notification Status',
      type: 'string',
      group: 'generated',
      readOnly: true,
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Sent', value: 'sent' },
          { title: 'Failed', value: 'failed' },
        ],
      },
    },
    {
      name: 'source',
      title: 'Source',
      type: 'string',
      group: 'generated',
      readOnly: true,
      options: {
        list: [
          { title: 'Automated (routine)', value: 'routine' },
          { title: 'Manual (WhatsApp / Studio)', value: 'manual' },
        ],
      },
    },
    // The one manually-editable field post-creation — a deliberate override,
    // not a system field.
    {
      name: 'slotReleased',
      title: 'Slot Released',
      type: 'boolean',
      group: 'generated',
      initialValue: false,
      description: 'Toggle ON if this pitch doesn\'t go ahead, to free up the slot for other founders even though this invitation was already submitted. Does not touch status or any other field.',
    },
  ],
  preview: {
    select: {
      title: 'founderEmail',
      whatsapp: 'whatsappNumber',
      subtitle: 'status',
      company: 'companyName',
      released: 'slotReleased',
    },
    prepare({ title, whatsapp, subtitle, company, released }) {
      return {
        title: `${company ? company + ' — ' : ''}${title || whatsapp || 'Unnamed'}`,
        subtitle: `${subtitle || 'draft'}${released ? ' · released' : ''}`,
      };
    },
  },
};

export default pitchSchedulerInvitation;
