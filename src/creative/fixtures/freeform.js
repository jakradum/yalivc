// Freeform examples: each is what Claude produced from ONE plain-language
// instruction (the prompt is kept alongside), validated by the same guardrails.
// Next.js only (JSON imports); the Node test script doesn't load these.
import thesis from './freeform/thesis.json';
import factsheet from './freeform/factsheet.json';
import process from './freeform/process.json';
import story from './freeform/story.json';

export const FREEFORM = [thesis, factsheet, process, story];
