import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getOrganizerProfile,
  updateOrganizerProfile,
  uploadOrganizerProfileImage,
  uploadOrganizerCoverImage,
  setExperience,
  setAchievements,
} from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import Button from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import {
  Tag,
  Notice,
  PageLoading,
  PageError,
  SectionLabel,
} from '../../components/ui/Surface';

const ADDRESS_FIELDS = [
  ['street', 'Street'],
  ['city', 'City'],
  ['state', 'State'],
  ['postalCode', 'Postal code'],
  ['country', 'Country'],
];

/**
 * Organizer profile.
 *
 * Four independent saves — identity, experience, achievements — because they hit
 * different endpoints and each succeeds on its own. A failure in one does not
 * roll back the others.
 */
export default function OrganizerProfile() {
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [experience, setExperienceList] = useState([]);
  const [achievements, setAchievementList] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [savingExperience, setSavingExperience] = useState(false);
  const [savingAchievements, setSavingAchievements] = useState(false);

  const reload = async () => {
    const data = await getOrganizerProfile();
    setProfile(data);
    return data;
  };

  React.useEffect(() => {
    let cancelled = false;

    getOrganizerProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setDraft({
          username: data.username || '',
          email: data.email || '',
          mobileNumber: data.mobileNumber || '',
          about: data.about || '',
          address: Object.fromEntries(ADDRESS_FIELDS.map(([key]) => [key, data[key] || ''])),
        });
        setExperienceList(data.experiences || []);
        setAchievementList((data.achievements || []).join('\n'));
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load your profile')))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await updateOrganizerProfile({
        username: draft.username.trim() || undefined,
        email: draft.email.trim() || undefined,
        mobile_number: draft.mobileNumber.trim() || undefined,
        about: draft.about.trim() || undefined,
        // The API expects snake_case for the postal code, unlike the rest.
        address: {
          street: draft.address.street.trim(),
          city: draft.address.city.trim(),
          state: draft.address.state.trim(),
          postal_code: draft.address.postalCode.trim(),
          country: draft.address.country.trim(),
        },
      });
      await reload();
      setNotice({ tone: '', text: 'Profile saved.' });
      toast.success('Profile updated');
    } catch (err) {
      setNotice({ tone: 'alert', text: errorMessage(err, 'Could not save your profile') });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExperience = async () => {
    setSavingExperience(true);
    setNotice(null);
    try {
      await setExperience(experience);
      await reload();
      setNotice({ tone: '', text: 'Experience saved.' });
      toast.success('Experience updated');
    } catch (err) {
      setNotice({ tone: 'alert', text: errorMessage(err, 'Could not save experience') });
    } finally {
      setSavingExperience(false);
    }
  };

  const handleSaveAchievements = async () => {
    setSavingAchievements(true);
    setNotice(null);
    try {
      await setAchievements(
        achievements
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      );
      await reload();
      setNotice({ tone: '', text: 'Achievements saved.' });
      toast.success('Achievements updated');
    } catch (err) {
      setNotice({ tone: 'alert', text: errorMessage(err, 'Could not save achievements') });
    } finally {
      setSavingAchievements(false);
    }
  };

  const handleImage = async (e, kind) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(kind);
    try {
      if (kind === 'profile') await uploadOrganizerProfileImage(file);
      else await uploadOrganizerCoverImage(file);
      await reload();
      toast.success('Image updated');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not upload the image'));
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  if (loading) return <PageLoading label="Loading profile" />;
  if (error || !draft) return <PageError message={error || 'Could not load your profile.'} />;

  const updateExperience = (index, key, value) => {
    setExperienceList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  return (
    <div className="app-page">
      <div className="container">
        <PageHeader eyebrow="Organizer" title="Your profile">
          This is what attendees and admins see. A complete profile makes event
          submissions easier to approve.
        </PageHeader>

        {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

        <div className="split" style={{ alignItems: 'start' }}>
          {/* Cover and identity, in the editorial plate. */}
          <div>
            <div style={{ position: 'relative' }}>
              <img
                className="card__media"
                src={profile.coverImage || '/images/banner.webp'}
                alt=""
                style={{ borderRadius: 'var(--radius)', minHeight: 180 }}
              />
              <label
                htmlFor="coverUpload"
                className="btn btn--outline btn--sm"
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  cursor: uploading === 'cover' ? 'progress' : 'pointer',
                }}
              >
                {uploading === 'cover' ? 'Uploading…' : 'Change cover'}
              </label>
              <input
                id="coverUpload"
                type="file"
                accept="image/*"
                className="visually-hidden"
                disabled={uploading === 'cover'}
                onChange={(e) => handleImage(e, 'cover')}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-24)',
                alignItems: 'center',
                marginTop: 'var(--spacing-24)',
              }}
            >
              <label className="avatar-upload" htmlFor="profileUpload">
                <img
                  className="avatar avatar--lg"
                  src={profile.profileImg || '/images/sampleProfile.webp'}
                  alt=""
                />
                <span className="avatar-upload__badge">
                  {uploading === 'profile' ? 'Saving' : 'Edit'}
                </span>
              </label>
              <input
                id="profileUpload"
                type="file"
                accept="image/*"
                className="visually-hidden"
                disabled={uploading === 'profile'}
                onChange={(e) => handleImage(e, 'profile')}
              />

              <div>
                <div className="tag-list">
                  <Tag>{profile.eventCount ?? 0} events</Tag>
                  <Tag plain>Rating {profile.rating || '—'}</Tag>
                </div>
                <p className="t-body-sm u-graphite" style={{ marginTop: 'var(--spacing-8)' }}>
                  {profile.email}
                </p>
              </div>
            </div>

            {draft.about && (
              <p className="t-serif u-iron measure" style={{ marginTop: 'var(--spacing-24)' }}>
                {draft.about}
              </p>
            )}

            {profile.achievements?.length > 0 && (
              <div style={{ marginTop: 'var(--spacing-32)' }}>
                <SectionLabel>Achievements</SectionLabel>
                <ul className="stack-sm" style={{ marginTop: 'var(--spacing-12)' }}>
                  {profile.achievements.map((item, index) => (
                    <li className="t-body-sm u-iron" key={index}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="stack">
            <form className="card" onSubmit={handleSave} noValidate>
              <SectionLabel>Identity</SectionLabel>

              <div className="stack" style={{ marginTop: 'var(--spacing-20)' }}>
                <Input
                  label="Username"
                  value={draft.username}
                  onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
                />
                <Input
                  label="Email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                />
                <Input
                  label="Mobile"
                  type="tel"
                  value={draft.mobileNumber}
                  onChange={(e) => setDraft((d) => ({ ...d, mobileNumber: e.target.value }))}
                />
                <Textarea
                  label="About"
                  rows={3}
                  maxLength={300}
                  value={draft.about}
                  onChange={(e) => setDraft((d) => ({ ...d, about: e.target.value }))}
                  hint={`${draft.about.length}/300`}
                />
              </div>

              <SectionLabel className="u-mt-32">Address</SectionLabel>

              <div className="stack" style={{ marginTop: 'var(--spacing-20)' }}>
                {ADDRESS_FIELDS.map(([key, label]) => (
                  <Input
                    key={key}
                    label={label}
                    value={draft.address[key]}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        address: { ...d.address, [key]: e.target.value },
                      }))
                    }
                  />
                ))}
              </div>

              <div
                className="btn-row"
                style={{
                  marginTop: 'var(--spacing-32)',
                  paddingTop: 'var(--spacing-24)',
                  borderTop: '1px solid var(--color-hairline)',
                  justifyContent: 'flex-end',
                }}
              >
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save profile'}
                </Button>
              </div>
            </form>

            <div className="card">
              <SectionLabel>Experience</SectionLabel>

              <div className="stack" style={{ marginTop: 'var(--spacing-20)' }}>
                {!experience.length && (
                  <p className="t-body-sm u-smoke">
                    No entries yet. Add where you have worked before.
                  </p>
                )}

                {experience.map((item, index) => (
                  <div
                    key={item.id ?? index}
                    style={{
                      paddingBottom: 'var(--spacing-16)',
                      borderBottom: '1px solid var(--color-hairline)',
                    }}
                  >
                    <Input
                      label="Organisation"
                      value={item.organization || ''}
                      onChange={(e) => updateExperience(index, 'organization', e.target.value)}
                    />
                    <div className="grid grid--2" style={{ marginTop: 'var(--spacing-16)' }}>
                      <Input
                        label="Years"
                        type="number"
                        min="0"
                        value={item.years ?? 0}
                        onChange={(e) => updateExperience(index, 'years', Number(e.target.value))}
                      />
                      <Input
                        label="Months"
                        type="number"
                        min="0"
                        max="11"
                        value={item.months ?? 0}
                        onChange={(e) => updateExperience(index, 'months', Number(e.target.value))}
                      />
                    </div>
                    <div style={{ marginTop: 'var(--spacing-12)' }}>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setExperienceList(experience.filter((_, i) => i !== index))
                        }
                      >
                        Remove entry
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="btn-row">
                  <Button
                    variant="hairline"
                    size="sm"
                    onClick={() =>
                      setExperienceList([...experience, { organization: '', years: 0, months: 0 }])
                    }
                  >
                    Add entry
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={savingExperience}
                    onClick={handleSaveExperience}
                  >
                    {savingExperience ? 'Saving…' : 'Save experience'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="card">
              <SectionLabel>Achievements</SectionLabel>

              <div style={{ marginTop: 'var(--spacing-20)' }}>
                <Textarea
                  label="One per line"
                  rows={5}
                  value={achievements}
                  onChange={(e) => setAchievementList(e.target.value)}
                />
                <div
                  className="btn-row"
                  style={{ marginTop: 'var(--spacing-20)', justifyContent: 'flex-end' }}
                >
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={savingAchievements}
                    onClick={handleSaveAchievements}
                  >
                    {savingAchievements ? 'Saving…' : 'Save achievements'}
                  </Button>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <Link to="/organizer/events" className="link t-body-sm">
                Back to my events
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}