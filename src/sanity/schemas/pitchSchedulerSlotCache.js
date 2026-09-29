// Singleton (fixed _id: "pitchSchedulerSlotCache") holding the current list
// of pitch-slot placeholder events, refreshed on a schedule (cron-job.org
// hits /api/cron/pitch-scheduler-refresh-slots) rather than on every
// invitation generation or founder page load. This is what makes an
// already-sent invitation's slots go stale gracefully instead of forever:
// the founder-facing routes intersect an invitation's originally-offered
// slots against this cache's current contents on every visit, so a deleted
// placeholder disappears from what they see within an hour (or on refresh,
// once the next cron tick has run) without anyone patching the invitation
// by hand.
//
// Written only by the cron route - never edited by hand in Studio.
const pitchSchedulerSlotCache = {
  name: 'pitchSchedulerSlotCache',
  title: 'Pitch Scheduler Slot Cache',
  type: 'document',
  fields: [
    {
      name: 'slots',
      title: 'Current Placeholder Slots',
      type: 'array',
      readOnly: true,
      of: [
        {
          type: 'object',
          fields: [
            { name: 'startUTC', title: 'Start (UTC)', type: 'datetime' },
            { name: 'endUTC', title: 'End (UTC)', type: 'datetime' },
          ],
        },
      ],
    },
    {
      name: 'updatedAt',
      title: 'Last Refreshed',
      type: 'datetime',
      readOnly: true,
    },
  ],
  preview: {
    select: { count: 'slots', date: 'updatedAt' },
    prepare({ count, date }) {
      return {
        title: 'Slot cache',
        subtitle: `${count?.length || 0} slots · last refreshed ${date || 'never'}`,
      };
    },
  },
};

export default pitchSchedulerSlotCache;
