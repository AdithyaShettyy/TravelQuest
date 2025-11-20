import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.39:3000';

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('global');
  const [socket, setSocket] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [userSquad, setUserSquad] = useState(null);

  // Initialize Socket.IO
  useEffect(() => {
    const socketInstance = io(API_URL, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to leaderboard socket');
      socketInstance.emit('subscribe_leaderboard', { type: selectedTab });
    });

    socketInstance.on('leaderboard_updated', (data) => {
      console.log('📊 Leaderboard updated:', data);
      fetchLeaderboard();
    });

    socketInstance.on('points_earned', (data) => {
      console.log('⭐ Points earned:', data);
      if (user && data.userId === user.id) {
        // User's points updated, refresh rank
        fetchUserRank();
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from socket');
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.emit('unsubscribe_leaderboard', { type: selectedTab });
        socketInstance.disconnect();
      }
    };
  }, []);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    try {
      let endpoint;
      if (selectedTab === 'global') {
        endpoint = `${API_URL}/api/leaderboard/global?limit=100`;
      } else if (selectedTab === 'weekly') {
        endpoint = `${API_URL}/api/leaderboard/weekly?limit=100`;
      } else if (selectedTab === 'city') {
        endpoint = `${API_URL}/api/leaderboard/city/mangalore?limit=50`;
      } else if (selectedTab === 'friends') {
        if (!user) return;
        endpoint = `${API_URL}/api/leaderboard/friends/${user.id}?type=weekly`;
      } else if (selectedTab === 'squads') {
        endpoint = `${API_URL}/api/leaderboard/squads?limit=50&type=weekly`;
      }

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTab, user]);

  // Fetch user's rank
  const fetchUserRank = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/api/leaderboard/rank/${user.id}`);
      const data = await response.json();

      if (data.success) {
        setUserRank(data);
      }
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchLeaderboard();
    fetchUserRank();
    if (user) {
      fetchFriendRequests();
      fetchUserSquad();
    }
  }, [fetchLeaderboard, fetchUserRank]);

  // Fetch friend requests
  const fetchFriendRequests = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/friends/pending/${user.id}`);
      const data = await response.json();
      setFriendRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  // Fetch user's squad
  const fetchUserSquad = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/squads/user/${user.id}`);
      const data = await response.json();
      setUserSquad(data.squad);
    } catch (error) {
      console.error('Error fetching user squad:', error);
    }
  };

  // Accept friend request
  const handleAcceptFriend = async (friendId) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/api/friends/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, friendId })
      });
      fetchFriendRequests();
      if (selectedTab === 'friends') {
        fetchLeaderboard();
      }
    } catch (error) {
      console.error('Error accepting friend:', error);
    }
  };

  // Reject friend request
  const handleRejectFriend = async (friendId) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/api/friends/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, friendId })
      });
      fetchFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend:', error);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    if (socket) {
      socket.emit('unsubscribe_leaderboard', { type: selectedTab });
      socket.emit('subscribe_leaderboard', { type: tab });
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
    fetchUserRank();
  };

  // Render squad item
  const renderSquadItem = ({ item }) => {
    const isTopThree = item.rank <= 3;
    const isUserSquad = userSquad && item.id === userSquad.id;

    const getRankIcon = (rank) => {
      switch (rank) {
        case 1:
          return { icon: 'trophy', color: '#FFD700' };
        case 2:
          return { icon: 'trophy', color: '#C0C0C0' };
        case 3:
          return { icon: 'trophy', color: '#CD7F32' };
        default:
          return null;
      }
    };

    const rankIcon = getRankIcon(item.rank);

    return (
      <View
        style={[
          styles.leaderboardItem,
          isUserSquad && styles.currentUserItem,
          isTopThree && styles.topThreeItem,
        ]}
      >
        <View style={styles.rankContainer}>
          {rankIcon ? (
            <Ionicons name={rankIcon.icon} size={24} color={rankIcon.color} />
          ) : (
            <Text style={styles.rankText}>#{item.rank}</Text>
          )}
        </View>

        <View style={styles.avatarContainer}>
          <View style={[styles.avatarPlaceholder, styles.squadAvatar]}>
            <Ionicons name="shield" size={24} color="#2563eb" />
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username} numberOfLines={1}>
            {item.name}
            {isUserSquad && (
              <Text style={styles.youBadge}> (Your Squad)</Text>
            )}
          </Text>
          <View style={styles.userStats}>
            <Ionicons name="people" size={14} color="#8b5cf6" />
            <Text style={styles.statsText}>{item.memberCount} members</Text>
            <Ionicons
              name="person"
              size={14}
              color="#666"
              style={{ marginLeft: 8 }}
            />
            <Text style={styles.statsText}>{item.leader?.username}</Text>
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.pointsText}>
            {item.weeklyPoints?.toLocaleString() || item.totalPoints?.toLocaleString()}
          </Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  // Render leaderboard item
  const renderLeaderboardItem = ({ item }) => {
    // If rendering squads, use squad renderer
    if (selectedTab === 'squads') {
      return renderSquadItem({ item });
    }

    const isCurrentUser = user && item.id === user.id;
    const isTopThree = item.rank <= 3;

    const getRankIcon = (rank) => {
      switch (rank) {
        case 1:
          return { icon: 'trophy', color: '#FFD700' }; // Gold
        case 2:
          return { icon: 'trophy', color: '#C0C0C0' }; // Silver
        case 3:
          return { icon: 'trophy', color: '#CD7F32' }; // Bronze
        default:
          return null;
      }
    };

    const rankIcon = getRankIcon(item.rank);

    return (
      <View
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem,
          isTopThree && styles.topThreeItem,
        ]}
      >
        <View style={styles.rankContainer}>
          {rankIcon ? (
            <Ionicons name={rankIcon.icon} size={24} color={rankIcon.color} />
          ) : (
            <Text style={styles.rankText}>#{item.rank}</Text>
          )}
        </View>

        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#666" />
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username} numberOfLines={1}>
            {item.displayName || item.username}
            {isCurrentUser && (
              <Text style={styles.youBadge}> (You)</Text>
            )}
          </Text>
          <View style={styles.userStats}>
            <Ionicons name="flash" size={14} color="#8b5cf6" />
            <Text style={styles.statsText}>Level {item.level}</Text>
            {item.currentStreak > 0 && (
              <>
                <Ionicons
                  name="flame"
                  size={14}
                  color="#f97316"
                  style={{ marginLeft: 8 }}
                />
                <Text style={styles.statsText}>{item.currentStreak} days</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.pointsText}>
            {selectedTab === 'weekly' 
              ? (item.weeklyPoints || 0).toLocaleString()
              : (item.totalPoints || 0).toLocaleString()}
          </Text>
          <Text style={styles.pointsLabel}>points</Text>
          {selectedTab === 'weekly' && item.rankChange && (
            <View style={[
              styles.rankChangeBadge,
              item.rankChange > 0 ? styles.rankUp : styles.rankDown
            ]}>
              <Ionicons 
                name={item.rankChange > 0 ? "arrow-up" : "arrow-down"} 
                size={12} 
                color={item.rankChange > 0 ? "#22c55e" : "#ef4444"} 
              />
              <Text style={[
                styles.rankChangeText,
                item.rankChange > 0 ? styles.rankUpText : styles.rankDownText
              ]}>
                {Math.abs(item.rankChange)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with user rank */}
      {userRank && (
        <View style={styles.userRankCard}>
          <View style={styles.rankBadge}>
            <Ionicons name="trophy" size={32} color="#2563eb" />
          </View>
          <View style={styles.userRankInfo}>
            <Text style={styles.yourRankLabel}>Your Rank</Text>
            <View style={styles.rankRow}>
              <Text style={styles.rankNumber}>#{userRank.rank}</Text>
              <View style={styles.percentileBadge}>
                <Text style={styles.percentileText}>Top {userRank.percentile}%</Text>
              </View>
            </View>
            <View style={styles.userRankStats}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.userPoints}>
                {userRank.user.totalPoints.toLocaleString()} points
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'global' && styles.activeTab]}
          onPress={() => handleTabChange('global')}
        >
          <Ionicons
            name="globe"
            size={18}
            color={selectedTab === 'global' ? '#2563eb' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'global' && styles.activeTabText,
            ]}
          >
            Global
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'weekly' && styles.activeTab]}
          onPress={() => handleTabChange('weekly')}
        >
          <Ionicons
            name="calendar"
            size={18}
            color={selectedTab === 'weekly' ? '#2563eb' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'weekly' && styles.activeTabText,
            ]}
          >
            Weekly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'city' && styles.activeTab]}
          onPress={() => handleTabChange('city')}
        >
          <Ionicons
            name="location"
            size={18}
            color={selectedTab === 'city' ? '#2563eb' : '#666'}
          />
          <Text
            style={[styles.tabText, selectedTab === 'city' && styles.activeTabText]}
          >
            City
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'friends' && styles.activeTab]}
          onPress={() => handleTabChange('friends')}
        >
          <Ionicons
            name="people"
            size={18}
            color={selectedTab === 'friends' ? '#2563eb' : '#666'}
          />
          <Text
            style={[styles.tabText, selectedTab === 'friends' && styles.activeTabText]}
          >
            Friends
          </Text>
          {friendRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{friendRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'squads' && styles.activeTab]}
          onPress={() => handleTabChange('squads')}
        >
          <Ionicons
            name="shield"
            size={18}
            color={selectedTab === 'squads' ? '#2563eb' : '#666'}
          />
          <Text
            style={[styles.tabText, selectedTab === 'squads' && styles.activeTabText]}
          >
            Squads
          </Text>
        </TouchableOpacity>
      </View>

      {/* Friend Requests Banner */}
      {selectedTab === 'friends' && friendRequests.length > 0 && (
        <View style={styles.requestsBanner}>
          <Text style={styles.requestsTitle}>
            {friendRequests.length} Friend Request{friendRequests.length > 1 ? 's' : ''}
          </Text>
          {friendRequests.slice(0, 2).map((request) => (
            <View key={request.id} style={styles.requestItem}>
              <Text style={styles.requestUsername}>{request.user.username}</Text>
              <View style={styles.requestButtons}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptFriend(request.userId)}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleRejectFriend(request.userId)}
                >
                  <Text style={styles.rejectButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Squad Info Banner */}
      {selectedTab === 'squads' && userSquad && (
        <View style={styles.squadBanner}>
          <View style={styles.squadInfo}>
            <Text style={styles.squadName}>{userSquad.name}</Text>
            <Text style={styles.squadStats}>
              {userSquad.memberCount} members • {userSquad.weeklyPoints} pts this week
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </View>
      )}

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="trophy-outline"
              size={64}
              color="#ccc"
            />
            <Text style={styles.emptyText}>No data available</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  userRankCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rankBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userRankInfo: {
    flex: 1,
  },
  yourRankLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  percentileBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  percentileText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  userRankStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userPoints: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  leaderboardItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currentUserItem: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  topThreeItem: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  youBadge: {
    color: '#2563eb',
    fontWeight: '700',
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  rankChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  rankUp: {
    backgroundColor: '#dcfce7',
  },
  rankDown: {
    backgroundColor: '#fee2e2',
  },
  rankChangeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  rankUpText: {
    color: '#22c55e',
  },
  rankDownText: {
    color: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  requestsBanner: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  requestsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  requestUsername: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  squadBanner: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  squadInfo: {
    flex: 1,
  },
  squadName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  squadStats: {
    fontSize: 14,
    color: '#64748b',
  },
  squadAvatar: {
    backgroundColor: '#eff6ff',
  },
});
