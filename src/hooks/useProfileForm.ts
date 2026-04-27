import { useState } from 'react';
import { Alert } from 'react-native';
import { updateProfile, submitFeedback } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { useFlash } from '@/hooks/useFlash';

export const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'UTC',
] as const;

export function useProfileForm() {
  const { user, refreshUser, logout } = useAuth();
  const { flash, showFlash, clearFlash } = useFlash();

  const [name, setName] = useState(user?.name ?? '');
  const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC');
  const [isSaving, setIsSaving] = useState(false);
  const [showTzPicker, setShowTzPicker] = useState(false);

  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('other');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  async function handleSaveProfile() {
    if (!name.trim()) {
      showFlash('Name cannot be empty', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ name: name.trim(), timezone });
      await refreshUser();
      showFlash('Profile saved!', 'success');
    } catch (err: unknown) {
      showFlash(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  async function handleSendFeedback() {
    if (!feedbackText.trim()) {
      showFlash('Please enter a message', 'error');
      return;
    }
    if (!user?.email) return;

    setIsSendingFeedback(true);
    try {
      await submitFeedback(feedbackText.trim(), feedbackType, user.email);
      setFeedbackText('');
      showFlash('Feedback sent — thank you!', 'success');
    } catch (err: unknown) {
      showFlash(err instanceof Error ? err.message : 'Failed to send feedback', 'error');
    } finally {
      setIsSendingFeedback(false);
    }
  }

  function selectTimezone(tz: string) {
    setTimezone(tz);
    setShowTzPicker(false);
  }

  return {
    user,
    // Profile fields
    name, setName,
    timezone,
    isSaving,
    showTzPicker,
    setShowTzPicker,
    selectTimezone,
    handleSaveProfile,
    handleLogout,
    // Feedback fields
    feedbackText, setFeedbackText,
    feedbackType, setFeedbackType,
    isSendingFeedback,
    handleSendFeedback,
    // Flash
    flash, clearFlash,
  };
}
