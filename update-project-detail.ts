/**
 * Script to implement Supabase integration for the Project detail screen
 * 
 * This script will:
 * 1. Update the Project detail screen to fetch real data from Supabase
 * 2. Implement proper error handling and loading states
 * 3. Add functionality for project actions (edit, add task)
 */

import fs from 'fs';
import path from 'path';

// Path to the project detail screen
const projectDetailPath = path.join(process.cwd(), 'app/projects/[id].tsx');

// Read the current implementation
const currentImplementation = fs.readFileSync(projectDetailPath, 'utf-8');

// Updated implementation with Supabase integration
const updatedImplementation = `import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/src/services/supabase';
import { Project, Task, ProjectMember, Profile } from '@/src/types/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = colorScheme || 'light';
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<(ProjectMember & { profile: Profile })[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id) return;
    
    const fetchProjectData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
          
        if (projectError) {
          throw new Error(\`Error fetching project: \${projectError.message}\`);
        }
        
        setProject(projectData);
        
        // Fetch project members with profiles
        const { data: memberData, error: memberError } = await supabase
          .from('project_members')
          .select(\`
            *,
            profile:profiles(*)
          \`)
          .eq('project_id', id);
          
        if (memberError) {
          console.error('Error fetching members:', memberError.message);
          // Don't throw here, continue with partial data
        } else {
          setMembers(memberData as any[]);
        }
        
        // Fetch project tasks
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });
          
        if (taskError) {
          console.error('Error fetching tasks:', taskError.message);
          // Don't throw here, continue with partial data
        } else {
          setTasks(taskData);
        }
      } catch (err: any) {
        console.error('Error loading project:', err);
        setError(err.message || 'Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjectData();
  }, [id]);
  
  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleEditProject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to edit project screen
    router.push(\`/projects/\${id}/edit\`);
  };
  
  const handleAddTask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to add task screen
    router.push(\`/projects/\${id}/tasks/new\`);
  };
  
  const renderTaskStatus = (status: string) => {
    const statusColors: Record<string, { bg: string, text: string }> = {
      'completed': { bg: '#ddf4e8', text: '#2a9d63' },
      'in_progress': { bg: '#e5f1ff', text: '#2d7fd3' },
      'todo': { bg: '#fff5e5', text: '#e6a23c' },
      'review': { bg: '#f8e1ff', text: '#9d3fa9' },
    };
    
    const style = statusColors[status] || { bg: '#f0f0f0', text: '#666666' };
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
        <Text style={[styles.statusText, { color: style.text }]}>
          {status.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
        </Text>
      </View>
    );
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[theme].primary} />
        <Text style={[styles.loadingText, { color: Colors[theme].text }]}>Loading project...</Text>
      </View>
    );
  }
  
  // Render error state
  if (error || !project) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome5 name="exclamation-circle" size={50} color={Colors[theme].error} />
        <Text style={[styles.errorText, { color: Colors[theme].error }]}>
          {error || 'Project not found'}
        </Text>
        <Button onPress={handleGoBack}>Go Back</Button>
      </View>
    );
  }
  
  // Calculate progress based on tasks
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const progressPercentage = tasks.length > 0 
    ? Math.round((completedTasks / tasks.length) * 100) 
    : 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient
          colors={theme === 'dark' ? ['#1a1a1a', '#121212'] : ['#f5f5f5', '#ffffff']}
          style={styles.header}
        >
          <Pressable style={styles.backButton} onPress={handleGoBack}>
            <FontAwesome5 
              name="arrow-left" 
              size={18} 
              color={Colors[theme].text}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: Colors[theme].text }]}>
            Project Details
          </Text>
          <View style={styles.headerRight} />
        </LinearGradient>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.titleContainer}>
            <Text style={[styles.projectTitle, { color: Colors[theme].text }]}>
              {project.name}
            </Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{project.status}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: Colors[theme].text }]}>
              Progress: {progressPercentage}%
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: \`\${progressPercentage}%\` }]} />
            </View>
          </View>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>
              Description
            </Text>
            <Text style={[styles.description, { color: Colors[theme].muted }]}>
              {project.description || 'No description provided.'}
            </Text>
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>
              Team Members
            </Text>
            {members.length > 0 ? (
              members.map(member => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={styles.memberInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {member.profile.full_name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.memberName, { color: Colors[theme].text }]}>
                        {member.profile.full_name}
                      </Text>
                      <Text style={[styles.memberRole, { color: Colors[theme].muted }]}>
                        {member.role}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: Colors[theme].muted }]}>
                No team members yet.
              </Text>
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>
              Tasks
            </Text>
            {tasks.length > 0 ? (
              tasks.map(task => (
                <Pressable
                  key={task.id}
                  style={styles.taskItem}
                  onPress={() => router.push(\`/projects/\${id}/tasks/\${task.id}\`)}
                >
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, { color: Colors[theme].text }]}>
                      {task.title}
                    </Text>
                    {renderTaskStatus(task.status)}
                  </View>
                  <Text style={[styles.taskAssignee, { color: Colors[theme].muted }]}>
                    {task.due_date ? \`Due: \${new Date(task.due_date).toLocaleDateString()}\` : 'No due date'}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: Colors[theme].muted }]}>
                No tasks added yet.
              </Text>
            )}
          </Card>

          <View style={styles.actions}>
            <Button 
              variant="outline"
              onPress={handleEditProject}
              style={{ flex: 1, marginRight: 10 }}
            >
              Edit Project
            </Button>
            <Button 
              onPress={handleAddTask}
              style={{ flex: 1 }}
            >
              Add Task
            </Button>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
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
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  card: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  memberItem: {
    marginBottom: 12,
    paddingBottom: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontWeight: '600',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberRole: {
    fontSize: 14,
  },
  taskItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskAssignee: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});`;

// Write the updated implementation to the file
fs.writeFileSync(projectDetailPath, updatedImplementation);

console.log('Project detail screen has been updated with Supabase integration!');
console.log('The implementation includes:');
console.log('- Real-time data fetching from Supabase');
console.log('- Proper loading and error states');
console.log('- Navigation to edit project and add tasks');
console.log('- Progress calculation based on completed tasks');
console.log('- Displaying project members and tasks from the database');

// Note: This is just a script to update the file. In a real scenario,
// you would want to also implement the edit project and add task screens.
console.log('\nNext steps:');
console.log('1. Implement the project edit screen at "/projects/[id]/edit"');
console.log('2. Implement the task creation screen at "/projects/[id]/tasks/new"');
console.log('3. Implement the task detail screen at "/projects/[id]/tasks/[taskId]"'); 