import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import * as Haptics from 'expo-haptics';

// Mock project data - in a real app, you would fetch this based on the ID
const getProjectById = (id: string) => {
  return {
    id,
    title: `Project ${id}`,
    description: 'This is a detailed description of the project. It includes information about goals, timeline, and expected outcomes.',
    progress: 65,
    dueDate: '2023-08-15',
    category: 'Development',
    members: [
      { id: '1', name: 'Alex Johnson', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', role: 'Project Lead' },
      { id: '2', name: 'Sarah Williams', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', role: 'Designer' },
      { id: '3', name: 'Miguel Rodriguez', avatar: 'https://randomuser.me/api/portraits/men/46.jpg', role: 'Developer' },
    ],
    tasks: [
      { id: '1', title: 'Design UI mockups', status: 'completed', assignee: '2' },
      { id: '2', title: 'Implement authentication', status: 'in-progress', assignee: '3' },
      { id: '3', title: 'QA Testing', status: 'pending', assignee: '1' },
      { id: '4', title: 'Documentation', status: 'pending', assignee: '1' },
    ]
  };
};

export default function ProjectDetail() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const project = getProjectById(id as string);

  useEffect(() => {
    // You could fetch project details here
  }, [id]);

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const renderTaskStatus = (status: string) => {
    const statusColors: Record<string, { bg: string, text: string }> = {
      'completed': { bg: '#ddf4e8', text: '#2a9d63' },
      'in-progress': { bg: '#e5f1ff', text: '#2d7fd3' },
      'pending': { bg: '#fff5e5', text: '#e6a23c' },
    };
    
    const style = statusColors[status] || { bg: '#f0f0f0', text: '#666666' };
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
        <Text style={[styles.statusText, { color: style.text }]}>
          {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Text>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#1a1a1a', '#121212'] : ['#f5f5f5', '#ffffff']}
          style={styles.header}
        >
          <Pressable style={styles.backButton} onPress={handleGoBack}>
            <FontAwesome5 
              name="arrow-left" 
              size={18} 
              color={Colors[colorScheme].text}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>
            Project Details
          </Text>
          <View style={styles.headerRight} />
        </LinearGradient>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.titleContainer}>
            <Text style={[styles.projectTitle, { color: Colors[colorScheme].text }]}>
              {project.title}
            </Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{project.category}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: Colors[colorScheme].text }]}>
              Progress: {project.progress}%
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
            </View>
          </View>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
              Description
            </Text>
            <Text style={[styles.description, { color: Colors[colorScheme].secondaryText }]}>
              {project.description}
            </Text>
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
              Team Members
            </Text>
            {project.members.map(member => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.memberName, { color: Colors[colorScheme].text }]}>
                      {member.name}
                    </Text>
                    <Text style={[styles.memberRole, { color: Colors[colorScheme].secondaryText }]}>
                      {member.role}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
              Tasks
            </Text>
            {project.tasks.map(task => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, { color: Colors[colorScheme].text }]}>
                    {task.title}
                  </Text>
                  {renderTaskStatus(task.status)}
                </View>
                <Text style={[styles.taskAssignee, { color: Colors[colorScheme].secondaryText }]}>
                  Assigned to: {project.members.find(m => m.id === task.assignee)?.name || 'Unassigned'}
                </Text>
              </View>
            ))}
          </Card>

          <View style={styles.actions}>
            <Button 
              title="Edit Project" 
              variant="outlined"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Add edit logic
              }}
              style={{ flex: 1, marginRight: 10 }}
            />
            <Button 
              title="Add Task" 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Add task logic
              }}
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#e0f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#0077cc',
    fontWeight: '600',
    fontSize: 12,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  card: {
    marginBottom: 20,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0077cc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontWeight: '600',
  },
  memberName: {
    fontWeight: '500',
    fontSize: 16,
  },
  memberRole: {
    fontSize: 12,
  },
  taskItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  taskTitle: {
    fontWeight: '500',
    fontSize: 15,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskAssignee: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
  },
}); 