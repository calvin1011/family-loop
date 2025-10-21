/*
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
  Switch
} from 'react-native';

interface Contact {
  id: string;
  name?: string;
  relationship?: string;
  group?: string;
}

interface CommunicationGoal {
  id: string;
  contactId: string;
  contactName: string;
  frequency: string;
  frequencyDays: number;
  method: string;
  isActive: boolean;
  lastContacted?: Date;
  nextDue?: Date;
  customNote?: string;
}

interface Props {
  contacts: Contact[];
  interactions: Array<{
    id: string;
    contactId: string;
    type: string;
    date: Date;
  }>;
  goals: CommunicationGoal[];
  onGoalsChange: (goals: CommunicationGoal[]) => void;
  onGoalCreated?: () => void;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Every day', days: 1 },
  { value: 'every-3-days', label: 'Every 3 days', days: 3 },
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'monthly', label: 'Monthly', days: 30 },
];

const METHOD_OPTIONS = [
  { value: 'any', label: 'Any contact', icon: '💬' },
  { value: 'call', label: 'Phone calls', icon: '📞' },
  { value: 'text', label: 'Messages', icon: '💬' },
];

export function CommunicationGoalsSimple({
  contacts,
  interactions,
  goals,
  onGoalsChange,
  onGoalCreated
}: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<string>('weekly');
  const [selectedMethod, setSelectedMethod] = useState<string>('any');
  const [customNote, setCustomNote] = useState('');

  const createGoal = () => {
    if (!selectedContact) return;

    const frequency = FREQUENCY_OPTIONS.find(f => f.value === selectedFrequency);
    if (!frequency) return;

    const newGoal: CommunicationGoal = {
      id: Date.now().toString(),
      contactId: selectedContact.id,
      contactName: selectedContact.name || 'Unknown',
      frequency: selectedFrequency,
      frequencyDays: frequency.days,
      method: selectedMethod,
      isActive: true,
      customNote: customNote.trim() || undefined,
    };

    const updatedGoals = [...goals, newGoal];
    onGoalsChange(updatedGoals);

    // Reset form
    setSelectedContact(null);
    setSelectedFrequency('weekly');
    setSelectedMethod('any');
    setCustomNote('');
    setShowCreateModal(false);

    Alert.alert('Goal Created!', `You'll be reminded to contact ${newGoal.contactName} ${frequency.label.toLowerCase()}`);
    onGoalCreated?.();
  };

  const toggleGoal = (goalId: string) => {
    const updatedGoals = goals.map(goal =>
      goal.id === goalId ? { ...goal, isActive: !goal.isActive } : goal
    );
    onGoalsChange(updatedGoals);
  };

  const deleteGoal = (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this communication goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedGoals = goals.filter(goal => goal.id !== goalId);
            onGoalsChange(updatedGoals);
          }
        }
      ]
    );
  };

  const getGoalStatus = (goal: CommunicationGoal) => {
    // Find most recent interaction with this contact
    const contactInteractions = interactions
      .filter(interaction => interaction.contactId === goal.contactId)
      .filter(interaction => {
        if (goal.method === 'any') return true;
        if (goal.method === 'call') return interaction.type === 'call' || interaction.type === 'video-call';
        if (goal.method === 'text') return interaction.type === 'text';
        return true;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const lastInteraction = contactInteractions[0];

    if (!lastInteraction || !goal.isActive) {
      return { status: 'inactive', color: '#95a5a6', text: goal.isActive ? 'No contact yet' : 'Inactive' };
    }

    const nextDue = new Date(lastInteraction.date.getTime() + (goal.frequencyDays * 24 * 60 * 60 * 1000));
    const now = new Date();
    const timeDiff = nextDue.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return { status: 'overdue', color: '#e74c3c', text: `${Math.abs(daysDiff)} days overdue` };
    } else if (daysDiff === 0) {
      return { status: 'due', color: '#f39c12', text: 'Due today' };
    } else if (daysDiff === 1) {
      return { status: 'due-soon', color: '#f39c12', text: 'Due tomorrow' };
    } else {
      return { status: 'on-track', color: '#27ae60', text: `Due in ${daysDiff} days` };
    }
  };

  const getMethodIcon = (method: string) => {
    const icons = { any: '💬', call: '📞', text: '💬' };
    return icons[method as keyof typeof icons] || '💬';
  };

  const getDueGoalsCount = () => {
    const now = new Date();
    return goals.filter(goal => {
      if (!goal.isActive) return false;

      const contactInteractions = interactions
        .filter(interaction => interaction.contactId === goal.contactId)
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      const lastInteraction = contactInteractions[0];
      if (!lastInteraction) return true; // No contact yet, so it's due

      const nextDue = new Date(lastInteraction.date.getTime() + (goal.frequencyDays * 24 * 60 * 60 * 1000));
      return nextDue.getTime() <= now.getTime();
    }).length;
  };

  const dueCount = getDueGoalsCount();

  // Goal Card Component
  const GoalCard = ({ goal }: { goal: CommunicationGoal }) => {
    const status = getGoalStatus(goal);
    const frequency = FREQUENCY_OPTIONS.find(f => f.value === goal.frequency);

    return (
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <Text style={styles.goalContactName}>{goal.contactName}</Text>
            <View style={styles.goalDetails}>
              <Text style={styles.goalFrequency}>
                {getMethodIcon(goal.method)} {frequency?.label}
              </Text>
              <Text style={[styles.goalStatus, { color: status.color }]}>
                {status.text}
              </Text>
            </View>
            {goal.customNote && (
              <Text style={styles.goalNote}>"{goal.customNote}"</Text>
            )}
          </View>
          <View style={styles.goalActions}>
            <Switch
              value={goal.isActive}
              onValueChange={() => toggleGoal(goal.id)}
              trackColor={{ false: '#e0e0e0', true: '#3498db' }}
              thumbColor={goal.isActive ? '#ffffff' : '#f4f3f4'}
            />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteGoal(goal.id)}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/!* Summary Card *!/}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Communication Goals</Text>
          {goals.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setShowGoalsModal(true)}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{goals.filter(g => g.isActive).length}</Text>
            <Text style={styles.statLabel}>Active Goals</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: dueCount > 0 ? '#e74c3c' : '#27ae60' }]}>
              {dueCount}
            </Text>
            <Text style={styles.statLabel}>Due Now</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.createGoalButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createGoalText}>+ Set New Goal</Text>
        </TouchableOpacity>
      </View>

      {/!* Show due goals *!/}
      {dueCount > 0 && (
        <View style={styles.dueGoalsSection}>
          <Text style={styles.dueGoalsTitle}>Goals Due Now</Text>
          {goals
            .filter(goal => {
              if (!goal.isActive) return false;

              const contactInteractions = interactions
                .filter(interaction => interaction.contactId === goal.contactId)
                .sort((a, b) => b.date.getTime() - a.date.getTime());

              const lastInteraction = contactInteractions[0];
              if (!lastInteraction) return true;

              const nextDue = new Date(lastInteraction.date.getTime() + (goal.frequencyDays * 24 * 60 * 60 * 1000));
              return nextDue.getTime() <= new Date().getTime();
            })
            .slice(0, 3)
            .map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
        </View>
      )}

      {/!* Create Goal Modal *!/}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Set Communication Goal</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/!* Contact Selection *!/}
            <Text style={styles.sectionTitle}>Choose Contact</Text>
            <FlatList
              data={contacts.slice(0, 10)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.contactOption,
                    selectedContact?.id === item.id && styles.contactOptionSelected
                  ]}
                  onPress={() => setSelectedContact(item)}
                >
                  <Text style={[
                    styles.contactOptionText,
                    selectedContact?.id === item.id && styles.contactOptionTextSelected
                  ]}>
                    {item.name} ({item.relationship})
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.contactList}
            />

            {/!* Frequency Selection *!/}
            <Text style={styles.sectionTitle}>How often?</Text>
            <View style={styles.optionsGrid}>
              {FREQUENCY_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    selectedFrequency === option.value && styles.optionButtonSelected
                  ]}
                  onPress={() => setSelectedFrequency(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedFrequency === option.value && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/!* Method Selection *!/}
            <Text style={styles.sectionTitle}>Contact method</Text>
            <View style={styles.methodOptions}>
              {METHOD_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.methodButton,
                    selectedMethod === option.value && styles.methodButtonSelected
                  ]}
                  onPress={() => setSelectedMethod(option.value)}
                >
                  <Text style={styles.methodIcon}>{option.icon}</Text>
                  <Text style={[
                    styles.methodText,
                    selectedMethod === option.value && styles.methodTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/!* Custom Note *!/}
            <Text style={styles.sectionTitle}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={customNote}
              onChangeText={setCustomNote}
              placeholder="e.g., Check on their health"
              placeholderTextColor="#95a5a6"
              maxLength={100}
            />

            {/!* Create Button *!/}
            <TouchableOpacity
              style={[
                styles.createButton,
                !selectedContact && styles.createButtonDisabled
              ]}
              onPress={createGoal}
              disabled={!selectedContact}
            >
              <Text style={styles.createButtonText}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/!* All Goals Modal *!/}
      <Modal
        visible={showGoalsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Communication Goals</Text>
            <TouchableOpacity onPress={() => setShowGoalsModal(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={goals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <GoalCard goal={item} />}
            contentContainerStyle={styles.goalsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyGoals}>
                <Text style={styles.emptyGoalsText}>No communication goals yet</Text>
                <Text style={styles.emptyGoalsSubtext}>Create your first goal to start tracking!</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 16,
  },
  viewAllText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  createGoalButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  createGoalText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  dueGoalsSection: {
    marginTop: 16,
  },
  dueGoalsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
    marginLeft: 4,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  goalInfo: {
    flex: 1,
  },
  goalContactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  goalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalFrequency: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  goalStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  goalNote: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  goalActions: {
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteButton: {
    marginTop: 8,
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalClose: {
    fontSize: 16,
    color: '#e74c3c',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    marginTop: 20,
  },
  contactList: {
    maxHeight: 120,
    marginBottom: 10,
  },
  contactOption: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contactOptionSelected: {
    backgroundColor: '#e8f4fd',
    borderColor: '#3498db',
  },
  contactOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  contactOptionTextSelected: {
    color: '#3498db',
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionButtonSelected: {
    backgroundColor: '#e8f4fd',
    borderColor: '#3498db',
  },
  optionText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  optionTextSelected: {
    color: '#3498db',
    fontWeight: '600',
  },
  methodOptions: {
    gap: 8,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  methodButtonSelected: {
    backgroundColor: '#e8f4fd',
    borderColor: '#3498db',
  },
  methodIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  methodText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  methodTextSelected: {
    color: '#3498db',
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  createButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  goalsList: {
    padding: 20,
  },
  emptyGoals: {
    alignItems: 'center',
    padding: 40,
  },
  emptyGoalsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyGoalsSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});*/
