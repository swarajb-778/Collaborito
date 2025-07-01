import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  ActivityIndicator,
  RefreshControl,
  Animated,
  Alert,
  Share,
  Platform
} from 'react-native';
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
import { useAuth } from '@/src/contexts/OptimizedAuthContext';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = colorScheme || 'light';
  const { user } = useAuth();
  
  // Validate that id exists and is a string
  if (!id || Array.isArray(id)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid project ID</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }
  
  // State variables
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<(ProjectMember & { profile: Profile })[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  const titleScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  
  // Animated values for card entrance
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(50)).current;
  
  // Function to fetch project data
  const fetchProjectData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
        
      if (projectError) {
        throw new Error(`Error fetching project: ${projectError.message}`);
      }
      
      setProject(projectData);
      
      // Fetch project members with profiles
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('project_id', id);
        
      if (memberError) {
        console.error('Error fetching members:', memberError.message);
        // Don't throw here, continue with partial data
      } else {
        setMembers(memberData as any[]);
        
        // Determine user's role in this project
        if (user) {
          const currentUserMember = memberData.find(m => m.user_id === user.id);
          if (currentUserMember) {
            setUserRole(currentUserMember.role as any);
          }
        }
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
      
      // Start card animation once data is loaded
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
      
    } catch (err: any) {
      console.error('Error loading project:', err);
      setError(err.message || 'Failed to load project');
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    if (!id) return;
    fetchProjectData();
  }, [id]);
  
  // Handle pull-to-refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProjectData(false);
  };
  
  // UI action handlers
  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleEditProject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/projects/${id}/edit`);
  };
  
  const handleAddTask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/projects/${id}/tasks/new`);
  };
  
  const handleShareProject = async () => {
    if (!project) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await Share.share({
        title: project.name,
        message: `Check out my project: ${project.name}\n${project.description || ''}\nShared from Collaborito`,
      });
    } catch (error: any) {
      Alert.alert('Error', 'Could not share project');
    }
  };
  
  const handleInviteMember = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/projects/${id}/invite`);
  };
  
  const handleChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/projects/${id}/chat`);
  };
  
  // Render task status badge
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
          {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

  // Check if user is owner or admin
  const canManageProject = userRole === 'owner' || userRole === 'admin';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Animated.View style={[{ opacity: headerOpacity }]}>
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
            <Animated.Text 
              style={[
                styles.headerTitle, 
                { color: Colors[theme].text, transform: [{ scale: titleScale }] }
              ]}
            >
              Project Details
            </Animated.Text>
            <Pressable style={styles.shareButton} onPress={handleShareProject}>
              <FontAwesome5 
                name="share-alt" 
                size={18} 
                color={Colors[theme].text}
              />
            </Pressable>
          </LinearGradient>
        </Animated.View>

        <Animated.ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors[theme].text}
              colors={[Colors[theme].primary]}
            />
          }
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          <View style={styles.titleContainer}>
            <Text style={[styles.projectTitle, { color: Colors[theme].text }]}>
              {project.name}
            </Text>
            <View style={[
              styles.categoryBadge, 
              project.status === 'completed' ? styles.completedBadge : 
              project.status === 'archived' ? styles.archivedBadge : 
              styles.activeBadge
            ]}>
              <Text style={[
                styles.categoryText,
                project.status === 'completed' ? styles.completedText : 
                project.status === 'archived' ? styles.archivedText : 
                styles.activeText
              ]}>
                {project.status}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressLabelContainer}>
              <Text style={[styles.progressText, { color: Colors[theme].text }]}>
                Progress: {progressPercentage}%
              </Text>
              <Text style={[styles.taskCountText, { color: Colors[theme].muted }]}>
                {completedTasks} of {tasks.length} tasks completed
              </Text>
            </View>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { width: `${progressPercentage}%` }
                ]} 
              />
            </View>
          </View>

          <Animated.View style={[
            styles.animatedCard,
            { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }
          ]}>
            <Card style={styles.card}>
              <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>
                Description
              </Text>
              <Text style={[styles.description, { color: Colors[theme].muted }]}>
                {project.description || 'No description provided.'}
              </Text>
            </Card>
          </Animated.View>

          <Animated.View style={[
            styles.animatedCard,
            { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }
          ]}>
            <Card style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>
                  Team Members ({members.length})
                </Text>
                <Pressable onPress={handleInviteMember} style={styles.addButton}>
                  <FontAwesome5 name="user-plus" size={14} color={Colors[theme].primary} />
                  <Text style={[styles.addButtonText, { color: Colors[theme].primary }]}>
                    Invite
                  </Text>
                </Pressable>
              </View>
              {members.length > 0 ? (
                members.map(member => (
                  <View key={member.id} style={styles.memberItem}>
                    <View style={styles.memberInfo}>
                      <View style={[
                        styles.avatar,
                        { backgroundColor: getAvatarColor(member.profile.full_name) }
                      ]}>
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
          </Animated.View>

          <Animated.View style={[
            styles.animatedCard,
            { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }
          ]}>
            <Card style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>
                  Tasks ({tasks.length})
                </Text>
                <Pressable onPress={handleAddTask} style={styles.addButton}>
                  <FontAwesome5 name="plus" size={14} color={Colors[theme].primary} />
                  <Text style={[styles.addButtonText, { color: Colors[theme].primary }]}>
                    Add
                  </Text>
                </Pressable>
              </View>
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <Pressable
                    key={task.id}
                    style={styles.taskItem}
                    onPress={() => router.push(`/projects/${id}/tasks/${task.id}`)}
                  >
                    <View style={styles.taskInfo}>
                      <Text style={[styles.taskTitle, { color: Colors[theme].text }]}>
                        {task.title}
                      </Text>
                      {renderTaskStatus(task.status)}
                    </View>
                    <Text style={[styles.taskAssignee, { color: Colors[theme].muted }]}>
                      {task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : 'No due date'}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: Colors[theme].muted }]}>
                  No tasks added yet.
                </Text>
              )}
            </Card>
          </Animated.View>

          <View style={styles.actionCards}>
            <Pressable 
              style={[styles.actionCard, { backgroundColor: Colors[theme].card }]}
              onPress={handleChat}
            >
              <FontAwesome5 name="comment-alt" size={20} color={Colors[theme].primary} />
              <Text style={[styles.actionCardTitle, { color: Colors[theme].text }]}>
                Project Chat
              </Text>
              <Text style={[styles.actionCardSubtitle, { color: Colors[theme].muted }]}>
                Discuss with team
              </Text>
            </Pressable>
            
            <Pressable 
              style={[styles.actionCard, { backgroundColor: Colors[theme].card }]}
              onPress={() => router.push(`/projects/${id}/files`)}
            >
              <FontAwesome5 name="file-alt" size={20} color={Colors[theme].primary} />
              <Text style={[styles.actionCardTitle, { color: Colors[theme].text }]}>
                Files
              </Text>
              <Text style={[styles.actionCardSubtitle, { color: Colors[theme].muted }]}>
                View shared files
              </Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            {canManageProject && (
              <Button 
                variant="outline"
                onPress={handleEditProject}
                style={{ flex: 1, marginRight: 10 }}
              >
                Edit Project
              </Button>
            )}
            <Button 
              onPress={handleAddTask}
              style={{ flex: 1 }}
            >
              Add Task
            </Button>
          </View>
        </Animated.ScrollView>
      </View>
    </>
  );
}

// Helper function to generate consistent avatar colors based on name
function getAvatarColor(name: string): string {
  const colors = [
    '#4CAF50', '#2196F3', '#9C27B0', '#F44336', 
    '#FF9800', '#3F51B5', '#E91E63', '#009688'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
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
  shareButton: {
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: '#e0f2ff',
  },
  completedBadge: {
    backgroundColor: '#ddf4e8',
  },
  archivedBadge: {
    backgroundColor: '#f0f0f0',
  },
  categoryText: {
    fontWeight: '600',
    fontSize: 12,
  },
  activeText: {
    color: '#0077cc',
  },
  completedText: {
    color: '#2a9d63',
  },
  archivedText: {
    color: '#666666',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressText: {
    fontSize: 14,
  },
  taskCountText: {
    fontSize: 12,
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
  animatedCard: {
    marginBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
  actionCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
});