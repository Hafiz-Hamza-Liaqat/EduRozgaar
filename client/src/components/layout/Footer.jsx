import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { NewsletterSubscribe } from '../newsletter/NewsletterSubscribe';

const quickLinks = [
  { label: 'Jobs', path: ROUTES.JOBS },
  { label: 'Scholarships', path: ROUTES.SCHOLARSHIPS },
  { label: 'Exam Preparation', path: ROUTES.EXAM_PREP },
  { label: 'Career Guidance', path: ROUTES.CAREER_GUIDANCE },
  { label: 'Blog', path: ROUTES.BLOG },
  { label: 'For Employers', path: ROUTES.EMPLOYER_LOGIN },
];

const studentResourcesLinks = [
  { label: 'Resume Builder', path: ROUTES.RESUME_BUILDER },
  { label: 'Admissions', path: ROUTES.ADMISSIONS },
  { label: 'Internships', path: ROUTES.INTERNSHIPS },
  { label: 'Help Center', path: ROUTES.HELP_CENTER },
  { label: 'FAQ', path: ROUTES.FAQ },
];

const socialLinks = [
  { label: 'X (Twitter)', href: 'https://twitter.com/edurozgaar' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/edurozgaar' },
  { label: 'Telegram', href: 'https://t.me/edurozgaar' },
];

function FooterLinkColumn({ title, links }) {
  return (
    <div>
      <h3 className="font-semibold text-[#CBD5F5] mb-4 text-sm uppercase tracking-wider">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map(({ label, path }) => (
          <li key={path}>
            <Link
              to={path}
              className="text-sm text-[#94A3B8] hover:text-primary transition-colors duration-200"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#020617] text-[#94A3B8] mt-auto safe-area-inset-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Logo + Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to={ROUTES.HOME} className="inline-block font-bold text-xl text-white hover:text-primary transition-colors mb-3">
              EduRozgaar
            </Link>
            <p className="text-sm text-[#94A3B8] max-w-xs leading-relaxed">
              Your gateway to jobs, scholarships, admissions, and study abroad opportunities in Pakistan.
            </p>
          </div>
          {/* Column 2: Quick Links (Platform) */}
          <FooterLinkColumn title="Platform" links={quickLinks} />
          {/* Column 3: Student Resources */}
          <FooterLinkColumn title="Student Resources" links={studentResourcesLinks} />
          {/* Column 4: Contact + Newsletter */}
          <div>
            <h3 className="font-semibold text-[#CBD5F5] mb-4 text-sm uppercase tracking-wider">
              Contact
            </h3>
            <p className="text-sm text-[#94A3B8] mb-2">
              <a href="mailto:contact@edurozgaar.pk" className="hover:text-primary transition-colors">
                contact@edurozgaar.pk
              </a>
            </p>
            <p className="text-sm text-[#94A3B8] mb-4">
              <Link to={ROUTES.ABOUT} className="hover:text-primary transition-colors">About Us</Link>
              {' · '}
              <Link to={ROUTES.CONTACT} className="hover:text-primary transition-colors">Contact</Link>
            </p>
            <div className="flex gap-3 mb-4">
              {socialLinks.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 text-[#94A3B8] hover:bg-primary hover:text-white transition-all duration-200"
                  aria-label={label}
                >
                  {label.includes('Twitter') && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  )}
                  {label.includes('LinkedIn') && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  )}
                  {label.includes('Telegram') && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
            <h3 className="font-semibold text-[#CBD5F5] text-sm uppercase tracking-wider mb-2 mt-4">
              Newsletter
            </h3>
            <p className="text-sm text-[#94A3B8] mb-3">
              Get jobs, scholarships & admission alerts.
            </p>
            <NewsletterSubscribe compact />
          </div>
        </div>
        {/* Copyright bar */}
        <div className="mt-12 pt-6 border-t border-white/10 text-center text-sm text-[#64748B] space-y-2">
          <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link to={ROUTES.PRIVACY_POLICY} className="hover:text-primary transition-colors">Privacy</Link>
            <Link to={ROUTES.TERMS} className="hover:text-primary transition-colors">Terms</Link>
            <Link to={ROUTES.COOKIES} className="hover:text-primary transition-colors">Cookies</Link>
            <Link to={ROUTES.LICENSE} className="hover:text-primary transition-colors">License</Link>
          </p>
          <p>© 2026 EduRozgaar. All rights reserved. · Open source under MIT License.</p>
        </div>
      </div>
    </footer>
  );
}
