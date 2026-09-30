import { Link } from 'react-router-dom';
import { Facebook, Linkedin, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';
import { usePublicDetail } from '../../hooks/usePublicData';
import { fetchOrganizationPublic } from '../../services/publicService';
import {
  DEFAULT_DISTRICT_NAME,
  DEFAULT_PROVINCE,
  ORGANIZATION_SHORT_NAME,
} from '../../../../constants';
import { OrganizationLogo } from './OrganizationLogo';

const SOCIALS = [
  { key: 'facebook', Icon: Facebook, label: 'Facebook' },
  { key: 'youtube', Icon: Youtube, label: 'YouTube' },
  { key: 'twitter', Icon: Twitter, label: 'Twitter' },
  { key: 'linkedin', Icon: Linkedin, label: 'LinkedIn' },
] as const;

/** Dark public footer: brand, contact details, socials and the legal bar. */
export function PublicFooter() {
  const { data: organization } = usePublicDetail(fetchOrganizationPublic);

  const email = organization?.email ?? 'info@heavenlypath.org.np';
  const phone = organization?.phone ?? '+977-25-xxxxxxx';
  const socialLinks = organization?.socialLinks;

  return (
    <footer className="mt-6 bg-secondary text-slate-300">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-5 px-4 py-8">
        <Link to="/" className="flex items-center gap-2.5">
          <OrganizationLogo className="h-10 w-10" />
          <span>
            <span className="block text-sm leading-tight font-bold text-white">
              {ORGANIZATION_SHORT_NAME}
            </span>
            <span className="block text-[10px] leading-tight font-semibold tracking-wide text-slate-400">
              {DEFAULT_DISTRICT_NAME.toUpperCase()} DISTRICT
            </span>
          </span>
        </Link>

        <span className="flex items-start gap-2 text-xs leading-snug text-slate-300">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <span>
            {DEFAULT_DISTRICT_NAME}, {DEFAULT_PROVINCE}
            <span className="block">Nepal</span>
          </span>
        </span>

        <a
          href={`mailto:${email}`}
          className="flex items-center gap-2 text-xs text-slate-300 transition-colors hover:text-white"
        >
          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          {email}
        </a>

        <a
          href={`tel:${phone.replace(/[^+\d]/g, '')}`}
          className="flex items-center gap-2 text-xs text-slate-300 transition-colors hover:text-white"
        >
          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          {phone}
        </a>

        <div className="flex items-center gap-2">
          {SOCIALS.map(({ key, Icon, label: socialLabel }) => {
            const href = socialLinks?.[key];
            const inner = (
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors group-hover:bg-white/20 group-hover:text-white"
                aria-label={socialLabel}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
            );
            return href ? (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="group"
                aria-label={socialLabel}
              >
                {inner}
              </a>
            ) : (
              <span key={key} className="group" role="presentation">
                {inner}
              </span>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3.5 text-xs text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} Heavenly Path Sunsari District. All rights reserved.
          </p>
          <p className="flex items-center gap-2">
            <span>Privacy Policy</span>
            <span aria-hidden className="text-slate-600">
              |
            </span>
            <span>Terms of Service</span>
            <span aria-hidden className="text-slate-600">
              |
            </span>
            <Link to="/contact" className="transition-colors hover:text-white">
              Contact
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
