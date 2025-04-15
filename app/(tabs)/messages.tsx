import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { TextInput } from '@/components/ui/TextInput';
import { useAuth } from '@/src/contexts/AuthContext';

// Define message type
interface Sender {
  id: string;
  name: string;
  avatar: string;
}

interface Message {
  id: string;
  sender: Sender;
  project: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

// Placeholder messages data
const MESSAGES: Message[] = [
  {
    id: '1',
    sender: {
      id: 'user1',
      name: 'Jane Cooper',
      avatar: 'https://randomuser.me/api/portraits/women/11.jpg',
    },
    project: 'Mobile App Redesign',
    lastMessage: 'I just sent you the latest mockups for the dashboard view.',
    timestamp: '10:32 AM',
    unread: 2,
  },
  {
    id: '2',
    sender: {
      id: 'user2',
      name: 'Esther Howard',
      avatar: 'https://randomuser.me/api/portraits/women/63.jpg',
    },
    project: 'Website Development',
    lastMessage: 'Can we schedule a call to discuss the timeline?',
    timestamp: 'Yesterday',
    unread: 0,
  },
  {
    id: '3',
    sender: {
      id: 'user3',
      name: 'Guy Hawkins',
      avatar: 'https://randomuser.me/api/portraits/men/90.jpg',
    },
    project: 'Brand Guidelines',
    lastMessage: 'The client approved all the color variations we sent!',
    timestamp: 'Yesterday',
    unread: 1,
  },
  {
    id: '4',
    sender: {
      id: 'user4',
      name: 'Jacob Jones',
      avatar: 'https://randomuser.me/api/portraits/men/43.jpg',
    },
    project: 'Marketing Campaign',
    lastMessage: "Let's finalize the copy for the social media posts.",
    timestamp: 'Mon',
    unread: 0,
  },
  {
    id: '5',
    sender: {
      id: 'user5',
      name: 'Kristin Watson',
      avatar: 'https://randomuser.me/api/portraits/women/50.jpg',
    },
    project: 'Product Launch',
    lastMessage: 'The team is ready for the presentation tomorrow.',
    timestamp: 'Sun',
    unread: 0,
  },
];

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Message[]>(MESSAGES);
  const { user } = useAuth();

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMessages(MESSAGES);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = MESSAGES.filter(
        (message) =>
          message.sender.name.toLowerCase().includes(lowerCaseQuery) ||
          message.project.toLowerCase().includes(lowerCaseQuery) ||
          message.lastMessage.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredMessages(filtered);
    }
  }, [searchQuery]);

  const renderMessageItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => console.log(`Navigate to message with ${item.sender.name}`)}
    >
      <Image source={{ uri: item.sender.avatar }} style={styles.avatar} />
      
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={[styles.senderName, { color: colors.text }]}>
            {item.sender.name}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        
        <Text style={styles.projectName}>{item.project}</Text>
        
        <Text
          style={[
            styles.messageText,
            { color: item.unread > 0 ? colors.text : colors.muted },
          ]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
      
      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Get the user's display name
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user?.email) {
      return user.email.split('@')[0]; // Extract username from email
    }
    return 'Messages';
  };

  // Get the user's profile image
  const getUserProfileImage = () => {
    return user?.profileImage || 'https://randomuser.me/api/portraits/lego/1.jpg';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {user && (
              <Image
                source={{ uri: getUserProfileImage() }}
                style={styles.userAvatar}
              />
            )}
            <Text style={styles.headerTitle}>
              {user ? `${getUserDisplayName()}'s Chats` : 'Messages'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.newMessageButton}
            onPress={() => console.log('Navigate to new message')}
          >
            <FontAwesome5 name="edit" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<FontAwesome5 name="search" size={16} color="#666" />}
          style={styles.searchInput}
        />
      </View>
      
      {/* Messages List */}
      {filteredMessages.length > 0 ? (
        <FlatList
          data={filteredMessages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
        />
      ) : (
        <View style={styles.emptyState}>
          <FontAwesome5
            name="inbox"
            size={50}
            color={colors.muted}
            style={styles.emptyIcon}
          />
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            {searchQuery
              ? 'No messages matching your search'
              : 'No messages yet'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={[styles.startChatButton, { backgroundColor: colors.primary }]}
              onPress={() => console.log('Navigate to new message')}
            >
              <Text style={styles.startChatText}>Start a new chat</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  headerTitle: {
    fontSize: 24,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchInput: {
    marginBottom: 0,
  },
  messagesList: {
    paddingHorizontal: 20,
  },
  messageItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  projectName: {
    fontSize: 14,
    color: '#4361EE',
    marginBottom: 4,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 14,
  },
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4361EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    alignSelf: 'center',
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  startChatButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  startChatText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 