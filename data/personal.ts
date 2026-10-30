/**
 * Personal information — single source of truth.
 * Edit here and it propagates everywhere: nav, hero, footer, meta tags, contact.
 */

export const personal = {
  name: 'Ishan',
  fullName: 'Ishan Acharya-Gangopadhyay',
  role: 'Electrical Engineering',
  institution: 'Michigan State University',
  location: 'East Lansing, MI',

  // Hero headline; `em` is the italic accent phrase.
  headline: {
    before: 'I build ',
    em: 'backend infrastructure',
    after: ', robot simulation, and signal-processing tools.',
  },

  // One-line summary — used for meta descriptions.
  short: 'EE student at MSU. I build backend infrastructure, robot simulation, and signal-processing tools.',

  // About-section prose. Written as an array of paragraphs so the section
  // component can animate each paragraph independently.
  about: [
    'I’m a sophomore studying electrical engineering at Michigan State. Since January 2026 I’ve been the lead backend and infrastructure engineer at Wensura, a platform for battery-materials researchers that launched in April 2026 and is now in beta. I built its AWS infrastructure in Terraform, its multi-tenant data isolation, and its LLM peer-review pipeline, and I found and fixed a critical remote-code-execution bug in its AI Copilot.',
    'On campus I lead simulation for Spartan Autonomous Robotics, working on sim-to-real for a quadruped. Before college I was Director of Software for FRC Team 4829 and trained 10–15 students a year. I also write and review benchmark tasks for AI coding agents.',
    'On the side I build small models of how brains learn, like the violin practice model below, and read about efficient ML.',
  ],


  // Contact + socials
  email: 'achary27@msu.edu',
  github: 'Ishan1522',
  githubUrl: 'https://github.com/Ishan1522',
  linkedin:
    'https://www.linkedin.com/in/ishan-acharya-gangopadhyay-3966a8213/',

  resumeUrl: '/Ishan_Acharya-Gangopadhyay_Resume.pdf',
} as const;

export type Personal = typeof personal;
