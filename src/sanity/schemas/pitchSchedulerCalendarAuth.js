// Singleton (fixed _id: "pitchSchedulerCalendarAuth") holding the refresh
// token for reading Pranav's calendar via a DELEGATED Graph permission,
// consented by him directly at /api/pitch-scheduler-calendar-connect rather
// than an Application permission needing Global Admin consent (which wasn't
// available). Written only by the connect/callback route and graphCalendar.js
// (which rotates the token on each refresh) - never edited by hand in Studio,
// hence everything here is readOnly. Visible in Studio only to confirm it's
// connected, not to manage it.
const pitchSchedulerCalendarAuth = {
  name: 'pitchSchedulerCalendarAuth',
  title: 'Pitch Scheduler Calendar Connection',
  type: 'document',
  fields: [
    {
      name: 'refreshToken',
      title: 'Refresh Token',
      type: 'string',
      readOnly: true,
      hidden: true,
    },
    {
      name: 'connectedBy',
      title: 'Connected By',
      type: 'string',
      readOnly: true,
      description: 'Which Microsoft account completed the consent flow. Should be pranav@yali.vc.',
    },
    {
      name: 'updatedAt',
      title: 'Last Refreshed',
      type: 'datetime',
      readOnly: true,
    },
  ],
  preview: {
    select: { subtitle: 'connectedBy', date: 'updatedAt' },
    prepare({ subtitle, date }) {
      return {
        title: 'Calendar connection',
        subtitle: subtitle ? `Connected as ${subtitle} · last refreshed ${date || 'never'}` : 'Not connected — visit /api/pitch-scheduler-calendar-connect',
      };
    },
  },
};

export default pitchSchedulerCalendarAuth;
