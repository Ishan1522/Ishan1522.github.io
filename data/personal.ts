/**
 * Personal information — single source of truth.
 * Edit here and it propagates everywhere: nav, hero, footer, meta tags, contact.
 */

export const personal = {
  name: 'Ishan',
  role: 'Electrical Engineering',
  institution: 'Michigan State University',
  location: 'East Lansing, MI',

  // Short one-liner (fallback — the hero intentionally stays sparse)
  short: 'EE @ MSU. I build at the edge of electricity and thought.',

  // About-section prose. Written as an array of paragraphs so the section
  // component can animate each paragraph independently.
  about: [
    'Freshman electrical engineering student at Michigan State University. I co-built a production B2B SaaS platform for battery materials research, write Rust DSP tools for FRC robotics, and run the electrical subteam’s dashboard CI pipeline.',
    'My research interests live in the space between hardware, efficient machine learning, and computational neuroscience — I keep an elaborate second-brain system to track all of it.',
    'When I’m not shipping code, I’m usually thinking about how the brain pulls off general intelligence on 20 watts, and whether our models can learn anything from it.',
  ],

  // Contact + socials
  email: 'achary27@msu.edu',
  github: 'Ishan1522',
  githubUrl: 'https://github.com/Ishan1522',
  linkedin:
    'https://www.linkedin.com/in/ishan-acharya-gangopadhyay-3966a8213/',

  // Resume — drop your file at /public/resume.pdf
  resumeUrl: '/resume.pdf',
} as const;

export type Personal = typeof personal;
