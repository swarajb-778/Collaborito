import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Project status types
type ProjectStatus = 'active' | 'completed' | 'archived';

// Project data type
interface Project {
  id: string;
  name: string;
  description: string;
  image: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
  members: { id: string; name: string; avatar: string }[];
  tasks: { total: number; completed: number };
}

// Sample project data
const PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Mobile App Redesign',
    description: 'Redesign the mobile app UI/UX for better user experience',
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'active',
    progress: 65,
    dueDate: '2023-08-15',
    members: [
      { id: '1', name: 'Alex Johnson', avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=0D8ABC&color=fff' },
      { id: '2', name: 'Sarah Chen', avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=10B981&color=fff' },
      { id: '3', name: 'Michael Wu', avatar: 'https://ui-avatars.com/api/?name=Michael+Wu&background=6366F1&color=fff' },
    ],
    tasks: { total: 24, completed: 16 },
  },
  {
    id: '2',
    name: 'Website Development',
    description: 'Build a responsive website for client with modern technologies',
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'active',
    progress: 40,
    dueDate: '2023-09-30',
    members: [
      { id: '2', name: 'Sarah Chen', avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=10B981&color=fff' },
      { id: '4', name: 'David Park', avatar: 'https://ui-avatars.com/api/?name=David+Park&background=F59E0B&color=fff' },
    ],
    tasks: { total: 40, completed: 16 },
  },
  {
    id: '3',
    name: 'Marketing Campaign',
    description: 'Q3 marketing campaign for product launch',
    image: 'https://images.unsplash.com/photo-1533750516845-250ce0df2851?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'completed',
    progress: 100,
    dueDate: '2023-06-30',
    members: [
      { id: '1', name: 'Alex Johnson', avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=0D8ABC&color=fff' },
      { id: '5', name: 'Jessica Kim', avatar: 'https://ui-avatars.com/api/?name=Jessica+Kim&background=DB2777&color=fff' },
    ],
    tasks: { total: 18, completed: 18 },
  },
  {
    id: '4',
    name: 'Product Design',
    description: 'Create wireframes and prototypes for new product features',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'active',
    progress: 80,
    dueDate: '2023-07-20',
    members: [
      { id: '3', name: 'Michael Wu', avatar: 'https://ui-avatars.com/api/?name=Michael+Wu&background=6366F1&color=fff' },
      { id: '5', name: 'Jessica Kim', avatar: 'https://ui-avatars.com/api/?name=Jessica+Kim&background=DB2777&color=fff' },
      { id: '6', name: 'Robert Lee', avatar: 'https://ui-avatars.com/api/?name=Robert+Lee&background=4F46E5&color=fff' },
    ],
    tasks: { total: 32, completed: 26 },
  },
  {
    id: '5',
    name: 'Content Strategy',
    description: 'Develop content strategy for social media channels',
    image: 'https://images.unsplash.com/photo-1523726491678-bf852e717f6a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'archived',
    progress: 100,
    dueDate: '2023-05-15',
    members: [
      { id: '2', name: 'Sarah Chen', avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=10B981&color=fff' },
      { id: '5', name: 'Jessica Kim', avatar: 'https://ui-avatars.com/api/?name=Jessica+Kim&background=DB2777&color=fff' },
    ],
    tasks: { total: 15, completed: 15 },
  },
];

export default function ProjectsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // State for filtering and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  
  // Filter projects based on search query and status filter
  const filteredProjects = PROJECTS.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Function to get status color
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'active':
        return '#10B981'; // green
      case 'completed':
        return '#4361EE'; // blue
      case 'archived':
        return '#9CA3AF'; // gray
      default:
        return colors.text;
    }
  };
  
  // Render project card
  const renderProjectCard = ({ item }: { item: Project }) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <Animated.View entering={FadeInDown.delay(100 * parseInt(item.id)).duration(400)}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => console.log(`Navigate to project ${item.id}`)}
        >
          <Card style={styles.projectCard}>
            <Image 
              source={{ uri: item.image }} 
              style={styles.projectImage}
              resizeMode="cover"
            />
            
            <View style={styles.projectContent}>
              <View style={styles.projectHeader}>
                <Text style={[styles.projectName, { color: colors.text }]}>{item.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.projectDescription, { color: colors.muted }]} numberOfLines={2}>
                {item.description}
              </Text>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${item.progress}%`, 
                        backgroundColor: statusColor 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.muted }]}>
                  {item.progress}%
                </Text>
              </View>
              
              <View style={styles.projectFooter}>
                <View style={styles.avatarsContainer}>
                  {item.members.slice(0, 3).map((member, index) => (
                    <Image 
                      key={member.id}
                      source={{ uri: member.avatar }}
                      style={[
                        styles.memberAvatar,
                        { marginLeft: index > 0 ? -10 : 0 }
                      ]}
                    />
                  ))}
                  
                  {item.members.length > 3 && (
                    <View style={styles.extraMembersContainer}>
                      <Text style={styles.extraMembersText}>
                        +{item.members.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.taskContainer}>
                  <FontAwesome5 name="tasks" size={14} color={colors.muted} />
                  <Text style={[styles.taskText, { color: colors.muted }]}>
                    {item.tasks.completed}/{item.tasks.total}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, colorScheme === 'dark' ? colors.background : colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Projects</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => console.log('Add new project')}
          >
            <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search projects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<FontAwesome5 name="search" size={16} color={colors.muted} />}
          style={styles.searchInput}
        />
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollableTabs
          tabs={[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'completed', label: 'Completed' },
            { id: 'archived', label: 'Archived' }
          ]}
          selectedTab={statusFilter}
          onSelectTab={(id) => setStatusFilter(id as any)}
          colors={colors}
        />
      </View>
      
      <FlatList
        data={filteredProjects}
        renderItem={renderProjectCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="folder-open" size={50} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No projects found
            </Text>
            <Button
              onPress={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              variant="secondary"
              style={styles.resetButton}
            >
              Reset Filters
            </Button>
          </View>
        }
      />
    </View>
  );
}

// Scrollable tabs component for filters
interface Tab {
  id: string;
  label: string;
}

function ScrollableTabs({ 
  tabs, 
  selectedTab, 
  onSelectTab,
  colors
}: { 
  tabs: Tab[]; 
  selectedTab: string; 
  onSelectTab: (id: string) => void;
  colors: any;
}) {
  return (
    <View style={styles.tabsContainer}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            selectedTab === tab.id && [styles.selectedTab, { borderColor: colors.primary }]
          ]}
          onPress={() => onSelectTab(tab.id)}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: colors.text },
              selectedTab === tab.id && { color: colors.primary, fontWeight: 'bold' }
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterContainer: {
    paddingHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTab: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  tabText: {
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  projectCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  projectImage: {
    width: '100%',
    height: 120,
  },
  projectContent: {
    padding: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  projectDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    marginRight: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  extraMembersContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  extraMembersText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  taskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  resetButton: {
    paddingHorizontal: 20,
  },
}); 