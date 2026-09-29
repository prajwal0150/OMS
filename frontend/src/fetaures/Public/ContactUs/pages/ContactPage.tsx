import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import { Button, Card, ErrorState, Input, Textarea } from '../../../../components/ui';
import { PublicPageHeader } from '../../Layouts/components/publicSections';
import { usePublicDetail } from '../../hooks/usePublicData';
import { fetchDistrictPublic, submitContactMessage } from '../../services/publicService';
import { normalizeApiError } from '../../../../services/api/apiClient';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().max(30),
  subject: z.string().trim().min(3, 'Enter a subject'),
  message: z.string().trim().min(10, 'Tell us a little more (10 characters minimum)'),
  /** Honeypot - hidden from humans, filled in by naive bots. */
  website: z.string().max(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export function ContactPage() {
  const { data: district } = usePublicDetail(fetchDistrictPublic);
  const [reference, setReference] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', subject: '', message: '', website: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setFailure(null);
    try {
      const result = await submitContactMessage(values);
      setReference(result.reference);
      reset();
    } catch (caught) {
      const error = normalizeApiError(caught);
      setFailure(error.message);
      toast.error(error.message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <PublicPageHeader
        eyebrow="Get in touch"
        title="Contact us"
        description="Questions about membership, events or volunteering? Reach your unit or the district office."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3">
          {[
            { icon: MapPin, label: 'Address', value: district?.contact?.address ?? 'Sunsari, Koshi Province, Nepal' },
            { icon: Phone, label: 'Phone', value: district?.contact?.phone ?? 'Contact your nearest unit' },
            { icon: Mail, label: 'Email', value: district?.contact?.email ?? 'Contact your nearest unit' },
          ].map((item) => (
            <Card key={item.label}>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <item.icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted">{item.label}</p>
                  <p className="text-sm text-slate-700">{item.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-secondary">Send a message</h2>
          {reference ? (
            <div className="mt-3 flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
              <p className="text-sm font-medium text-slate-700">
                Thank you - your message has been received.
              </p>
              <p className="text-xs text-muted">
                Your reference is <span className="font-mono font-medium">{reference}</span>. Quote it
                if you contact the district office.
              </p>
              <p className="text-xs text-muted">We usually respond within two working days.</p>
              <Button variant="outline" size="sm" onClick={() => setReference(null)}>
                Send another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-3 grid gap-3 sm:grid-cols-2" noValidate>
              {failure && (
                <div className="sm:col-span-2">
                  <ErrorState message={failure} />
                </div>
              )}
              <Input label="Full name" error={errors.name?.message} {...register('name')} />
              <Input
                label="Email address"
                type="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Phone (optional)"
                containerClassName="sm:col-span-2"
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input
                label="Subject"
                containerClassName="sm:col-span-2"
                error={errors.subject?.message}
                {...register('subject')}
              />
              <Textarea
                label="Message"
                containerClassName="sm:col-span-2"
                rows={6}
                error={errors.message?.message}
                {...register('message')}
              />
              {/* Honeypot: visually hidden, ignored by screen readers and humans. */}
              <div className="absolute h-0 w-0 overflow-hidden" aria-hidden>
                <label>
                  Website
                  <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
                </label>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" size="sm" loading={isSubmitting}>
                  Send message
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ContactPage;
