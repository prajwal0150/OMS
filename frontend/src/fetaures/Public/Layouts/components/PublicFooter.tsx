import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { ORGANIZATION_NAME, ORGANIZATION_SHORT_NAME, DEFAULT_PROVINCE } from '../../../../constants';

const COLUMNS = [
  {
    heading: 'Organization',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'District profile', to: '/district' },
      { label: 'Our units', to: '/units' },
      { label: 'Communities', to: '/communities' },
    ],
  },
  {
    heading: 'What we do',
    links: [
      { label: 'Activities', to: '/content' },
      { label: 'Events', to: '/events' },
      { label: 'Announcements', to: '/announcements' },
      { label: 'Photo gallery', to: '/gallery' },
    ],
  },
  {
    heading: 'Members',
    links: [
      { label: 'Member sign in', to: '/login' },
      { label: 'Change password', to: '/change-password' },
      { label: 'Contact us', to: '/contact' },
    ],
  },
];

/** Public footer with the organization identity and quick links. */
export function PublicFooter() {
  return (
    <footer className="mt-8 border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
              HP
            </span>
            <p className="text-sm font-semibold text-secondary">{ORGANIZATION_SHORT_NAME}</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {ORGANIZATION_NAME} - serving {DEFAULT_PROVINCE} through our units, communities and
            committees.
          </p>
          <div className="mt-3 flex items-center gap-2">
            {[
              { icon: Facebook, label: 'Facebook' },
              { icon: Instagram, label: 'Instagram' },
              { icon: Youtube, label: 'YouTube' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-slate-400"
                aria-label={label}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
            ))}
          </div>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.heading}>
            <p className="text-sm font-semibold text-secondary">{column.heading}</p>
            <ul className="mt-2 space-y-1.5">
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-xs text-muted hover:text-primary hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-muted">
          <p>&copy; {new Date().getFullYear()} {ORGANIZATION_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden />
              {DEFAULT_PROVINCE}, Nepal
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" aria-hidden />
              Contact via page
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" aria-hidden />
              Email us
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
