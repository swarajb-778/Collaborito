import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  SlideInRight,
  FadeInDown,
} from 'react-native-reanimated';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useAuth } from '../../src/contexts/OptimizedAuthContext';
import { Card } from '../../components/ui/Card';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

// Mock data for projects
const MOCK_PROJECTS = [
  {
    id: '1',
    title: 'Mobile App Redesign',
    description: 'Redesigning the user interface of our flagship mobile application with new features and improved UX.',
    progress: 68,
    dueDate: '2023-05-28',
    category: 'design',
    members: [
      { id: '1', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
      { id: '2', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
      { id: '3', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
    ],
    tasks: { total: 12, completed: 8 },
  },
  {
    id: '2',
    title: 'Brand Identity Guidelines',
    description: 'Creating comprehensive brand guidelines document with logo usage, typography, and color specifications.',
    progress: 45,
    dueDate: '2023-06-15',
    category: 'marketing',
    members: [
      { id: '4', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
      { id: '5', avatar: 'https://randomuser.me/api/portraits/women/3.jpg' },
    ],
    tasks: { total: 8, completed: 3 },
  },
  {
    id: '3',
    title: 'Backend API Development',
    description: 'Building RESTful APIs for the new customer management system with authentication and authorization.',
    progress: 82,
    dueDate: '2023-05-10',
    category: 'development',
    members: [
      { id: '6', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
      { id: '7', avatar: 'https://randomuser.me/api/portraits/women/4.jpg' },
      { id: '8', avatar: 'https://randomuser.me/api/portraits/men/4.jpg' },
      { id: '9', avatar: 'https://randomuser.me/api/portraits/women/5.jpg' },
    ],
    tasks: { total: 16, completed: 13 },
  },
  {
    id: '4',
    title: 'Content Marketing Strategy',
    description: 'Developing a comprehensive content marketing strategy including blog posts, videos, and social media.',
    progress: 25,
    dueDate: '2023-07-05',
    category: 'marketing',
    members: [
      { id: '10', avatar: 'https://randomuser.me/api/portraits/women/6.jpg' },
      { id: '11', avatar: 'https://randomuser.me/api/portraits/men/5.jpg' },
    ],
    tasks: { total: 10, completed: 2 },
  },
  {
    id: '5',
    title: 'E-commerce Platform Integration',
    description: 'Integrating payment gateways and shipping providers with our e-commerce platform.',
    progress: 55,
    dueDate: '2023-06-30',
    category: 'development',
    members: [
      { id: '12', avatar: 'https://randomuser.me/api/portraits/men/6.jpg' },
      { id: '13', avatar: 'https://randomuser.me/api/portraits/women/7.jpg' },
      { id: '14', avatar: 'https://randomuser.me/api/portraits/men/7.jpg' },
    ],
    tasks: { total: 14, completed: 7 },
  },
];

// Categories
const CATEGORIES = [
  { id: 'all', label: 'All Projects', icon: 'layer-group' },
  { id: 'design', label: 'Design', icon: 'paint-brush' },
  { id: 'development', label: 'Development', icon: 'code' },
  { id: 'marketing', label: 'Marketing', icon: 'bullhorn' },
];

export default function ProjectsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const searchScale = useSharedValue(0.9);
  const categoryTranslateY = useSharedValue(100);
  
  useEffect(() => {
    // Animate header
    headerOpacity.value = withTiming(1, { duration: 800 });
    
    // Animate search
    searchScale.value = withDelay(300, withSpring(1, { damping: 12 }));
    
    // Animate categories
    categoryTranslateY.value = withDelay(600, withSpring(0, { damping: 14 }));
  }, []);
  
  // Filter projects based on search query and category
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      let filteredProjects = [...MOCK_PROJECTS];
      
      // Apply category filter
      if (selectedCategory !== 'all') {
        filteredProjects = filteredProjects.filter(
          (project) => project.category === selectedCategory
        );
      }
      
      // Apply search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filteredProjects = filteredProjects.filter(
          (project) =>
            project.title.toLowerCase().includes(query) ||
            project.description.toLowerCase().includes(query)
        );
      }
      
      setProjects(filteredProjects);
      setLoading(false);
    }, 500);
  }, [searchQuery, selectedCategory]);
  
  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));
  
  const searchAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));
  
  const categoryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: categoryTranslateY.value }],
  }));
  
  // Handler for category selection
  const handleCategorySelect = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId);
  };
  
  // Handler for project press
  const handleProjectPress = (projectId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/(tabs)/projects/${projectId}` as any);
  };
  
  // Component for category item
  const CategoryItem = ({ item, isSelected }: { item: typeof CATEGORIES[0], isSelected: boolean }) => {
    const scale = useSharedValue(1);
    
    const onPressIn = () => {
      scale.value = withTiming(0.95, { duration: 100 });
    };
    
    const onPressOut = () => {
      scale.value = withTiming(1, { duration: 200 });
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
    
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleCategorySelect(item.id)}
          style={[
            styles.categoryItem,
            {
              backgroundColor: isSelected
                ? colors.primary
                : colorScheme === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <FontAwesome5
            name={item.icon}
            size={14}
            color={isSelected ? '#FFFFFF' : colors.text}
            style={styles.categoryIcon}
          />
          <Text
            style={[
              styles.categoryLabel,
              { color: isSelected ? '#FFFFFF' : colors.text },
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Component for project card
  const ProjectCard = ({ item, index }: { item: typeof MOCK_PROJECTS[0], index: number }) => {
    const scale = useSharedValue(1);
    
    const onPressIn = () => {
      scale.value = withTiming(0.97, { duration: 100 });
    };
    
    const onPressOut = () => {
      scale.value = withTiming(1, { duration: 200 });
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
    
    const getTaskStatusColor = () => {
      const ratio = item.tasks.completed / item.tasks.total;
      if (ratio >= 0.8) return colors.success;
      if (ratio >= 0.5) return colors.warning;
      return colors.error;
    };
    
    const getCategoryColor = () => {
      switch (item.category) {
        case 'design':
          return '#8B5CF6'; // Purple
        case 'development':
          return '#3F83F8'; // Blue
        case 'marketing':
          return '#F59E0B'; // Yellow
        default:
          return colors.primary;
      }
    };
    
    // Calculate days left for the project
    const getDaysLeft = () => {
      const dueDate = new Date(item.dueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };
    
    const daysLeft = getDaysLeft();
    
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={animatedStyle}
      >
        <TouchableOpacity
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleProjectPress(item.id)}
          activeOpacity={0.9}
        >
          <Card style={[styles.projectCard, { backgroundColor: colors.card }]}>
            <View style={styles.projectHeader}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: getCategoryColor() + '30' },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: getCategoryColor() },
                  ]}
                >
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </Text>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressTextContainer}>
                  <Text style={[styles.progressText, { color: colors.text }]}>{item.progress}%</Text>
                </View>
                <View
                  style={[
                    styles.progressBackground,
                    { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${item.progress}%`,
                        backgroundColor: getCategoryColor(),
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
            
            <Text style={[styles.projectTitle, { color: colors.text }]}>{item.title}</Text>
            <Text
              style={[styles.projectDescription, { color: colors.muted }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
            
            <View style={styles.projectFooter}>
              <View style={styles.membersContainer}>
                {item.members.slice(0, 3).map((member, memberIndex) => (
                  <Image
                    key={member.id}
                    source={{ uri: member.avatar }}
                    style={[
                      styles.memberAvatar,
                      { marginLeft: memberIndex > 0 ? -8 : 0 },
                    ]}
                  />
                ))}
                {item.members.length > 3 && (
                  <View style={[styles.memberMore, { backgroundColor: colors.primary }]}>
                    <Text style={styles.memberMoreText}>+{item.members.length - 3}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.projectStats}>
                <View style={styles.projectStat}>
                  <FontAwesome5 name="tasks" size={12} color={getTaskStatusColor()} />
                  <Text style={[styles.projectStatText, { color: colors.muted }]}>
                    {item.tasks.completed}/{item.tasks.total} tasks
                  </Text>
                </View>
                
                <View
                  style={[
                    styles.projectStat,
                    { marginLeft: 12 },
                  ]}
                >
                  <FontAwesome5
                    name="calendar-day"
                    size={12}
                    color={daysLeft <= 0 ? colors.error : daysLeft <= 3 ? colors.warning : colors.muted}
                  />
                  <Text
                    style={[
                      styles.projectStatText,
                      {
                        color:
                          daysLeft <= 0
                            ? colors.error
                            : daysLeft <= 3
                            ? colors.warning
                            : colors.muted,
                      },
                    ]}
                  >
                    {daysLeft <= 0
                      ? 'Overdue'
                      : daysLeft === 1
                      ? '1 day left'
                      : `${daysLeft} days left`}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Render empty state if no projects found
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <FontAwesome5 name="folder-open" size={50} color={colors.muted} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No projects found
      </Text>
      <Text style={[styles.emptyStateDescription, { color: colors.muted }]}>
        {searchQuery.trim() !== '' ? 
          'Try changing your search query' : 
          'Create a new project to get started'}
      </Text>
    </View>
  );
  
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Projects</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(tabs)/projects/new' as any);
              }}
            >
              <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
      
      {/* Search Bar */}
      <Animated.View style={[styles.searchContainer, searchAnimatedStyle]}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <FontAwesome5
            name="search"
            size={16}
            color={colors.muted}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search projects..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <FontAwesome5 name="times-circle" size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      
      {/* Categories */}
      <Animated.View style={[styles.categoriesContainer, categoryAnimatedStyle]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <CategoryItem
              key={category.id}
              item={category}
              isSelected={selectedCategory === category.id}
            />
          ))}
        </ScrollView>
      </Animated.View>
      
      {/* Projects List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={({ item, index }) => <ProjectCard item={item} index={index} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.projectsContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    height: 150,
  },
  headerGradient: {
    flex: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectsContent: {
    padding: 16,
    paddingBottom: 80,
    gap: 16,
  },
  projectCard: {
    borderRadius: 16,
    padding: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    flex: 1,
    marginLeft: 12,
  },
  progressTextContainer: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'white',
  },
  memberMore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: 'white',
  },
  memberMoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  projectStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectStatText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 