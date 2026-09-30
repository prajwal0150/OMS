import type { UseFormRegister } from 'react-hook-form';
import { z } from 'zod';
import { Input, Select, Textarea, FileUploader } from '../../../../../components';
import { toFilterOptions } from '../../../../../hooks/useScopeOptions';
import type { OptionItem } from '../../../../../types';

export const contentFormSchema = z.object({
  title: z.string().trim().min(5, 'Enter a descriptive title').max(200),
  slug: z.string().trim().max(200),
  summary: z.string().trim().min(10, 'Write a short summary').max(500),
  content: z.string().trim().min(20, 'The body must be at least 20 characters'),
  contentType: z.string(),
  language: z.string(),
  unit: z.string(),
  community: z.string(),
  visibility: z.string(),
  featured: z.boolean(),
  allowComments: z.boolean(),
  tags: z.string(),
});

export type ContentFormValues = z.infer<typeof contentFormSchema>;

export const contentFormDefaults: ContentFormValues = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  contentType: 'NEWS',
  language: 'en',
  unit: '',
  community: '',
  visibility: 'UNIT',
  featured: false,
  allowComments: false,
  tags: '',
};

/** "hello-world" -> "hello-world" (the backend de-duplicates the slug). */
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 200);

export const toContentPayload = (values: ContentFormValues) => ({
  ...values,
  slug: values.slug || slugify(values.title),
  tags: values.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean),
  unit: values.unit || undefined,
  community: values.community || undefined,
});

export interface ContentFormFieldsProps {
  register: UseFormRegister<ContentFormValues>;
  errors: Record<string, { message?: string } | undefined>;
  units: OptionItem[];
  communities: OptionItem[];
  editing?: boolean;
}

const CONTENT_TYPES = [
  { value: 'NEWS', label: 'News' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'ARTICLE', label: 'Article' },
  { value: 'STORY', label: 'Story' },
  { value: 'ACHIEVEMENT', label: 'Achievement' },
  { value: 'EVENT_RECAP', label: 'Event recap' },
  { value: 'AWARENESS', label: 'Awareness' },
  { value: 'DOCUMENT', label: 'Document' },
];

const VISIBILITIES = [
  { value: 'PUBLIC', label: 'Public website' },
  { value: 'DISTRICT', label: 'District only' },
  { value: 'UNIT', label: 'Unit only' },
  { value: 'COMMUNITY', label: 'Community only' },
  { value: 'PRIVATE', label: 'Private (staff only)' },
];

/** Shared content authoring fields, used by both the create and edit screens. */
export function ContentFormFields({
  register,
  errors,
  units,
  communities,
  editing = false,
}: ContentFormFieldsProps) {
  return (
    <div className="space-y-3">
      <Input label="Title" required error={errors.title?.message} {...register('title')} />
      <Input
        label="Slug"
        hint="Leave blank to generate from the title"
        error={errors.slug?.message}
        {...register('slug')}
      />
      <Textarea
        label="Summary"
        required
        rows={2}
        hint="Shown on listing cards and in search results"
        error={errors.summary?.message}
        {...register('summary')}
      />
      <Textarea
        label="Body"
        required
        rows={12}
        hint="Plain text. Line breaks are preserved on the public page."
        error={errors.content?.message}
        {...register('content')}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Content type"
          options={CONTENT_TYPES}
          error={errors.contentType?.message}
          {...register('contentType')}
        />
        <Select
          label="Visibility"
          hint="Controls who can read this content"
          options={VISIBILITIES}
          error={errors.visibility?.message}
          {...register('visibility')}
        />
        <Select
          label="Language"
          options={[
            { value: 'en', label: 'English' },
            { value: 'ne', label: 'Nepali' },
            { value: 'mop', label: 'Limbu' },
          ]}
          error={errors.language?.message}
          {...register('language')}
        />
        <Select
          label="Unit"
          options={toFilterOptions(units)}
          placeholder="No specific unit"
          disabled={editing}
          error={errors.unit?.message}
          {...register('unit')}
        />
        <Select
          label="Community"
          options={toFilterOptions(communities)}
          placeholder="No specific community"
          disabled={editing}
          error={errors.community?.message}
          {...register('community')}
        />
        <Input
          label="Tags"
          hint="Comma separated"
          error={errors.tags?.message}
          {...register('tags')}
        />
      </div>

      <div className="flex flex-wrap gap-4 border-t border-line pt-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-line accent-primary"
            {...register('featured')}
          />
          <span className="text-sm text-slate-700">Feature on the public homepage</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-line accent-primary"
            {...register('allowComments')}
          />
          <span className="text-sm text-slate-700">Allow comments</span>
        </label>
      </div>
    </div>
  );
}

export { FileUploader };
