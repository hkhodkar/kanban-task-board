import { Board, BoardState, Card, Column, Label, Member } from '../models/board.models';
import { addDays, todayIso } from '../utils/date.utils';
import { createId } from '../utils/id';

export type BoardTemplate = 'basic' | 'scrum' | 'empty';

export const BOARD_TEMPLATES: { value: BoardTemplate; name: string; columns: string[] }[] = [
  { value: 'basic', name: 'Basic', columns: ['To do', 'In progress', 'Done'] },
  { value: 'scrum', name: 'Scrum', columns: ['Backlog', 'To do', 'In progress', 'Review', 'Done'] },
  { value: 'empty', name: 'Empty board', columns: [] },
];

export const DEFAULT_LABELS: Omit<Label, 'id'>[] = [
  { name: 'Bug', color: 'red' },
  { name: 'Feature', color: 'blue' },
  { name: 'Improvement', color: 'teal' },
  { name: 'Design', color: 'purple' },
  { name: 'Docs', color: 'green' },
  { name: 'Urgent', color: 'orange' },
];

export const DEMO_MEMBERS: Member[] = [
  { id: 'm-sara', name: 'Sara Lindqvist', color: '#d6409f' },
  { id: 'm-daniel', name: 'Daniel Okafor', color: '#2f80ed' },
  { id: 'm-mia', name: 'Mia Chen', color: '#8e4ec6' },
  { id: 'm-leo', name: 'Leo Martins', color: '#12a594' },
  { id: 'm-nora', name: 'Nora Fischer', color: '#f76b15' },
];

interface CardSeed {
  title: string;
  description?: string;
  labels?: string[];
  assignee?: string;
  /** due date relative to today, in days */
  due?: number;
  /** checklist items, prefix with "x " for done ones */
  checklist?: string[];
}

function buildCard(id: string, seed: CardSeed, today: string, createdOffset: number): Card {
  return {
    id,
    title: seed.title,
    description: seed.description ?? '',
    labelIds: seed.labels ?? [],
    assigneeId: seed.assignee ?? null,
    dueDate: seed.due === undefined ? null : addDays(today, seed.due),
    checklist: (seed.checklist ?? []).map((text, i) => ({
      id: `${id}-c${i + 1}`,
      done: text.startsWith('x '),
      text: text.replace(/^x /, ''),
    })),
    createdAt: addDays(today, createdOffset),
  };
}

function buildBoard(
  id: string,
  name: string,
  description: string,
  labels: Label[],
  columns: [string, CardSeed[]][],
  today: string,
): Board {
  let counter = 0;
  const builtColumns: Column[] = columns.map(([title, cards], i) => ({
    id: `${id}-col${i + 1}`,
    title,
    cards: cards.map((seed) => {
      counter++;
      return buildCard(`${id}-${counter}`, seed, today, -30 + counter);
    }),
  }));
  return {
    id,
    name,
    description,
    labels,
    columns: builtColumns,
    createdAt: addDays(today, -32),
    updatedAt: today,
  };
}

function websiteRelaunch(today: string): Board {
  const labels: Label[] = [
    { id: 'l-design', name: 'Design', color: 'purple' },
    { id: 'l-frontend', name: 'Frontend', color: 'blue' },
    { id: 'l-backend', name: 'Backend', color: 'teal' },
    { id: 'l-content', name: 'Content', color: 'green' },
    { id: 'l-seo', name: 'SEO', color: 'yellow' },
    { id: 'l-bug', name: 'Bug', color: 'red' },
    { id: 'l-urgent', name: 'Urgent', color: 'orange' },
  ];

  return buildBoard(
    'website-relaunch',
    'Website relaunch',
    'Redesign of the marketing site and move to the new headless CMS.',
    labels,
    [
      [
        'Backlog',
        [
          {
            title: 'Blog search with tag filters',
            description:
              'Client-side search over titles and tags. Keep the URL in sync so results can be shared.',
            labels: ['l-frontend'],
          },
          {
            title: 'Case study: Northwind Logistics',
            description:
              'Interview notes are in the shared drive. Needs approval from their marketing team before publishing.',
            labels: ['l-content'],
            assignee: 'm-nora',
            due: 14,
          },
          {
            title: 'A/B test for the new pricing page',
            labels: ['l-frontend', 'l-backend'],
          },
          {
            title: 'Translate key pages to German',
            description: 'Home, pricing, product overview and contact.',
            labels: ['l-content'],
            due: 21,
          },
        ],
      ],
      [
        'To do',
        [
          {
            title: 'Design 404 and empty states',
            labels: ['l-design'],
            assignee: 'm-mia',
            due: 4,
            checklist: ['404 page', 'Empty search results', 'Empty blog category'],
          },
          {
            title: 'Migrate blog posts from WordPress',
            description:
              'Export via WP REST API, convert to Markdown and import into the CMS. Keep the original publish dates and authors.',
            labels: ['l-backend', 'l-content'],
            assignee: 'm-daniel',
            due: 6,
            checklist: [
              'x Export script',
              'Image download',
              'Markdown conversion',
              'Import and spot check',
            ],
          },
          {
            title: 'Meta descriptions for top 30 pages',
            labels: ['l-seo', 'l-content'],
            assignee: 'm-nora',
            due: 2,
          },
          {
            title: 'Cookie banner does not remember choice',
            description:
              'After accepting, the banner shows up again on the next page in Safari. Probably the cookie domain.',
            labels: ['l-bug', 'l-urgent'],
            assignee: 'm-leo',
            due: -1,
          },
        ],
      ],
      [
        'In progress',
        [
          {
            title: 'Responsive navigation and mega menu',
            description:
              'Follow the Figma frames for desktop and mobile. Menu has to be fully keyboard accessible.',
            labels: ['l-frontend'],
            assignee: 'm-leo',
            due: 1,
            checklist: [
              'x Desktop layout',
              'x Mobile drawer',
              'x Keyboard navigation',
              'Focus trap in drawer',
              'Cross-browser check',
            ],
          },
          {
            title: 'Pricing page layout',
            labels: ['l-design', 'l-frontend'],
            assignee: 'm-mia',
            due: 0,
          },
          {
            title: 'Redirects from old URLs',
            description:
              'Map every old URL to its new path, 301 only. The export from Search Console has the full list.',
            labels: ['l-seo', 'l-backend'],
            assignee: 'm-daniel',
            due: -2,
            checklist: ['x Collect old URLs', 'x Mapping sheet', 'Add rules to the CDN'],
          },
          {
            title: 'Homepage hero copy',
            labels: ['l-content'],
            assignee: 'm-sara',
            due: 5,
          },
        ],
      ],
      [
        'Review',
        [
          {
            title: 'Contact form with spam protection',
            description:
              'Honeypot field plus rate limiting on the API. Sends to the sales inbox and the CRM.',
            labels: ['l-frontend', 'l-backend'],
            assignee: 'm-daniel',
            due: 3,
            checklist: ['x Form validation', 'x Honeypot', 'x Rate limit', 'x CRM webhook'],
          },
          {
            title: 'Image pipeline (WebP and AVIF)',
            labels: ['l-backend'],
            assignee: 'm-leo',
            due: 2,
          },
          {
            title: 'Accessibility fixes for forms',
            description:
              'Labels, error messages linked with aria-describedby, visible focus styles.',
            labels: ['l-frontend', 'l-bug'],
            assignee: 'm-mia',
            due: 1,
          },
        ],
      ],
      [
        'Done',
        [
          {
            title: 'Kickoff workshop and sitemap',
            labels: ['l-design'],
            assignee: 'm-sara',
            due: -14,
            checklist: ['x Stakeholder interviews', 'x Sitemap draft', 'x Sign-off'],
          },
          {
            title: 'Choose a headless CMS',
            description: 'Went with a hosted CMS, see the comparison doc for the reasoning.',
            labels: ['l-backend'],
            assignee: 'm-daniel',
            due: -10,
          },
          {
            title: 'Design system: colors, type and spacing',
            labels: ['l-design'],
            assignee: 'm-mia',
            due: -7,
            checklist: [
              'x Color tokens',
              'x Type scale',
              'x Spacing scale',
              'x Button and input styles',
            ],
          },
          {
            title: 'Staging environment and CI',
            labels: ['l-backend'],
            assignee: 'm-leo',
            due: -5,
          },
        ],
      ],
    ],
    today,
  );
}

function mobileApp(today: string): Board {
  const labels: Label[] = [
    { id: 'l-ios', name: 'iOS', color: 'blue' },
    { id: 'l-android', name: 'Android', color: 'green' },
    { id: 'l-design', name: 'Design', color: 'purple' },
    { id: 'l-bug', name: 'Bug', color: 'red' },
  ];

  return buildBoard(
    'mobile-app',
    'Mobile app 2.0',
    'Next major release of the customer app.',
    labels,
    [
      [
        'To do',
        [
          { title: 'Offline mode for saved orders', labels: ['l-ios', 'l-android'], due: 12 },
          {
            title: 'Push notification settings screen',
            labels: ['l-design'],
            assignee: 'm-mia',
            due: 8,
          },
          {
            title: 'Crash on login with expired token',
            labels: ['l-bug', 'l-android'],
            assignee: 'm-leo',
            due: 1,
          },
        ],
      ],
      [
        'In progress',
        [
          {
            title: 'Dark mode',
            labels: ['l-ios', 'l-android', 'l-design'],
            assignee: 'm-mia',
            due: 6,
            checklist: ['x Color tokens', 'Settings toggle', 'QA on both platforms'],
          },
          { title: 'Biometric login', labels: ['l-ios'], assignee: 'm-daniel', due: 3 },
        ],
      ],
      [
        'Done',
        [{ title: 'New onboarding flow', labels: ['l-design'], assignee: 'm-sara', due: -6 }],
      ],
    ],
    today,
  );
}

function marketing(today: string): Board {
  const labels: Label[] = [
    { id: 'l-social', name: 'Social', color: 'pink' },
    { id: 'l-email', name: 'Email', color: 'teal' },
    { id: 'l-event', name: 'Event', color: 'orange' },
  ];

  return buildBoard(
    'marketing-q1',
    'Marketing Q1',
    'Campaigns and content for the first quarter.',
    labels,
    [
      ['Ideas', [{ title: 'Customer story video series', labels: ['l-social'] }]],
      [
        'Planned',
        [
          { title: 'January newsletter', labels: ['l-email'], assignee: 'm-nora', due: 9 },
          {
            title: 'Booth for the spring trade fair',
            labels: ['l-event'],
            assignee: 'm-sara',
            due: 25,
          },
        ],
      ],
      [
        'Published',
        [
          {
            title: 'Launch post for the new website',
            labels: ['l-social'],
            assignee: 'm-nora',
            due: -3,
          },
        ],
      ],
    ],
    today,
  );
}

export function createDemoState(today = todayIso()): BoardState {
  return {
    version: 1,
    boards: [websiteRelaunch(today), mobileApp(today), marketing(today)],
    members: DEMO_MEMBERS,
  };
}

export function createBoardFromTemplate(
  name: string,
  template: BoardTemplate,
  now = todayIso(),
): Board {
  const id = createId('b');
  const columns = BOARD_TEMPLATES.find((t) => t.value === template)?.columns ?? [];
  return {
    id,
    name,
    description: '',
    columns: columns.map((title) => ({ id: createId('col'), title, cards: [] })),
    labels: DEFAULT_LABELS.map((label) => ({ ...label, id: createId('l') })),
    createdAt: now,
    updatedAt: now,
  };
}
