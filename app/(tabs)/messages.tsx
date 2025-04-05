import React from 'react';
import { View, StyleSheet, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { TextInput } from '@/components/ui/TextInput';

// Placeholder data for messages
const MESSAGES = [
  {
    id: '1',
    sender: {
      name: 'Sarah Johnson',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=0D8ABC&color=fff',
    },
    project: 'Mobile App Development',
    lastMessage: 'Can you review the latest wireframes?',
    timestamp: '10:30 AM',
    unread: 2,
  },
  {
    id: '2',
    sender: {
      name: 'Alex Chen',
      avatar: 'https://ui-avatars.com/api/?name=Alex+Chen&background=6366F1&color=fff',
    },
    project: 'Website Redesign',
    lastMessage: 'The client approved the color palette changes!',
    timestamp: 'Yesterday',
    unread: 0,
  },
  {
    id: '3',
    sender: {
      name: 'Marketing Team',
      avatar: 'https://ui-avatars.com/api/?name=Marketing+Team&background=10B981&color=fff',
    },
    project: 'Marketing Campaign',
    lastMessage: 'Meeting scheduled for tomorrow at 2pm',
    timestamp: 'Wed',
    unread: 1,
  },
  {
    id: '4',
    sender: {
      name: 'David Wilson',
      avatar: 'https://ui-avatars.com/api/?name=David+Wilson&background=F59E0B&color=fff',
    },
    project: 'Mobile App Development',
    lastMessage: 'Just pushed some updates to the repo, can you check?',
    timestamp: 'Tue',
    unread: 0,
  },
];

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [searchQuery, setSearchQuery] = React.useState('');

  const renderMessageItem = ({ item }: { item: typeof MESSAGES[0] }) => {
    return (
      <TouchableOpacity 
        style={[
          styles.messageItem, 
          { borderBottomColor: colors.border }
        ]}
        onPress={() => console.log(`Navigate to chat ${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.sender.avatar }} style={styles.avatar} />
          {item.unread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadCount}>{item.unread}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text 
              style={[
                styles.senderName, 
                { color: colors.text, fontWeight: item.unread > 0 ? '700' : '600' }
              ]}
            >
              {item.sender.name}
            </Text>
            <Text style={[styles.timestamp, { color: colors.muted }]}>{item.timestamp}</Text>
          </View>
          
          <Text style={[styles.projectName, { color: colors.muted }]}>
            {item.project}
          </Text>
          
          <Text 
            style={[
              styles.lastMessage, 
              { 
                color: item.unread > 0 ? colors.text : colors.muted,
                fontWeight: item.unread > 0 ? '500' : 'normal'
              }
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, colorScheme === 'dark' ? colors.background : colors.secondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <FontAwesome5 name="edit" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>
      
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<FontAwesome5 name="search" size={16} color={colors.muted} />}
        />
      </View>
      
      <FlatList
        data={MESSAGES}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="comment-dots" size={50} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No messages yet
            </Text>
          </View>
        }
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  newMessageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  messagesList: {
    paddingBottom: 20,
  },
  messageItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
  },
  projectName: {
    fontSize: 13,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
}); 