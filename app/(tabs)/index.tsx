import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useMeetings } from '@/hooks/useMeetings';
import { MeetingCard } from '@/components/MeetingCard';
import { LoadingScreen } from '@/components/LoadingScreen';
import { MeetingListItem } from '@/types';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config';

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState} testID="empty-state">
      <Ionicons name="calendar-outline" size={40} color={COLORS.border} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, error, refresh } = useMeetings();

  function handleMeetingPress(id: string) {
    router.push(`/(tabs)/meetings/${id}`);
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  if (isLoading && !data) {
    return <LoadingScreen message="Loading your meetings…" />;
  }

  const myMeetings = data?.myMeetings ?? [];
  const invitedMeetings = data?.invitedMeetings ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {firstName} 👋</Text>
          <Text style={styles.subGreeting}>Your meetings</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/create-meeting')}
          style={styles.newButton}
          testID="new-meeting-fab"
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Error state */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
          />
        }
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {/* My Meetings */}
            <Text style={styles.sectionTitle}>Meetings I Created</Text>
            {myMeetings.length === 0 ? (
              <EmptyState message="No meetings yet. Tap + to create one." />
            ) : (
              myMeetings.map((m: MeetingListItem) => (
                <MeetingCard
                  key={m.id}
                  meeting={m}
                  onPress={() => handleMeetingPress(m.id)}
                />
              ))
            )}

            {/* Invited Meetings */}
            <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>
              Meetings I'm Invited To
            </Text>
            {invitedMeetings.length === 0 ? (
              <EmptyState message="No invitations yet." />
            ) : (
              invitedMeetings.map((m: MeetingListItem) => (
                <MeetingCard
                  key={m.id}
                  meeting={m}
                  onPress={() => handleMeetingPress(m.id)}
                />
              ))
            )}
          </>
        }
        testID="dashboard-list"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
  },
  subGreeting: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  newButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  list: { padding: SPACING.md, paddingBottom: SPACING['2xl'] },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.error,
    flex: 1,
  },
});
