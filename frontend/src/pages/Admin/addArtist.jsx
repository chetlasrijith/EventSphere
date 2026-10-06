import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { createArtist } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import Button from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import { SectionLabel } from '../../components/ui/Surface';

const EMPTY = {
  artistName: '',
  genre: '',
  bio: '',
  birthDate: '',
  website: '',
  instagram: '',
  twitter: '',
};

/** Add an artist to the platform's reference data. */
export default function AddArtist() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.artistName.trim()) next.artistName = 'Artist name is required.';
    if (!form.genre.trim()) next.genre = 'Genre is required.';
    if (form.birthDate && new Date(form.birthDate) > new Date())
      next.birthDate = 'Birth date cannot be in the future.';
    if (form.website && !/^https?:\/\//i.test(form.website))
      next.website = 'Include the full URL, starting with http:// or https://';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await createArtist({
        artist_name: form.artistName.trim(),
        genre: form.genre.trim(),
        bio: form.bio.trim() || undefined,
        birth_date: form.birthDate || undefined,
        social_links: {
          website: form.website.trim() || undefined,
          instagram: form.instagram.trim() || undefined,
          twitter: form.twitter.trim() || undefined,
        },
      });
      toast.success(`${form.artistName.trim()} added`);
      setForm(EMPTY);
      setErrors({});
    } catch (err) {
      toast.error(errorMessage(err, 'Could not add the artist'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-page">
      <div className="container container--narrow">
        <PageHeader eyebrow="Admin" title="Add an artist">
          Artists appear as reference data on events and in attendee search.
        </PageHeader>

        <form className="card card--pad-lg" onSubmit={handleSubmit} noValidate>
          <SectionLabel>Identity</SectionLabel>

          <div style={{ marginTop: 'var(--spacing-20)' }}>
            <Input
              label="Artist name"
              value={form.artistName}
              onChange={update('artistName')}
              error={errors.artistName}
            />
            <Input
              label="Genre"
              value={form.genre}
              onChange={update('genre')}
              error={errors.genre}
              placeholder="Jazz, techno, spoken word…"
            />
            <Textarea
              label="Biography"
              rows={4}
              value={form.bio}
              onChange={update('bio')}
            />
            <Input
              label="Birth date"
              type="date"
              value={form.birthDate}
              onChange={update('birthDate')}
              error={errors.birthDate}
            />
          </div>

          <SectionLabel className="u-mt-24" />

          <div style={{ marginTop: 'var(--spacing-20)' }}>
            <Input
              label="Website"
              type="url"
              value={form.website}
              onChange={update('website')}
              error={errors.website}
              placeholder="https://"
            />
            <Input
              label="Instagram"
              value={form.instagram}
              onChange={update('instagram')}
              placeholder="@handle"
            />
            <Input
              label="Twitter"
              value={form.twitter}
              onChange={update('twitter')}
              placeholder="@handle"
            />
          </div>

          <div
            className="btn-row"
            style={{ marginTop: 'var(--spacing-32)', justifyContent: 'flex-end' }}
          >
            <Button
              variant="ghost"
              onClick={() => {
                setForm(EMPTY);
                setErrors({});
              }}
              disabled={submitting}
            >
              Reset
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Add artist'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}