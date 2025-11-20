const express = require('express');
const router = express.Router();
const { User, Squad, SquadMember, sequelize } = require('../models');
const { Op } = require('sequelize');

// Create a new squad
router.post('/create', async (req, res) => {
  try {
    const { userId, name, type = 'open', maxMembers = 20, region } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    // Check if user is already in a squad
    const existingMembership = await SquadMember.findOne({
      where: { userId }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already in a squad' });
    }

    // Create squad
    const squad = await Squad.create({
      name,
      leaderId: userId,
      type,
      maxMembers,
      region,
      memberCount: 1,
      totalPoints: 0,
      weeklyPoints: 0
    });

    // Add creator as leader
    await SquadMember.create({
      squadId: squad.id,
      userId,
      role: 'leader',
      pointsContributed: 0,
      weeklyPointsContributed: 0
    });

    res.json({
      message: 'Squad created successfully',
      squad
    });
  } catch (error) {
    console.error('Error creating squad:', error);
    res.status(500).json({ error: 'Failed to create squad' });
  }
});

// Join a squad
router.post('/:squadId/join', async (req, res) => {
  try {
    const { squadId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if user is already in a squad
    const existingMembership = await SquadMember.findOne({
      where: { userId }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already in a squad' });
    }

    // Get squad
    const squad = await Squad.findByPk(squadId);
    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    // Check if squad is full
    if (squad.memberCount >= squad.maxMembers) {
      return res.status(400).json({ error: 'Squad is full' });
    }

    // Check if squad is invite-only
    if (squad.type === 'invite_only') {
      return res.status(403).json({ error: 'This squad is invite-only' });
    }

    // For region-locked squads, check user's location
    if (squad.type === 'region_locked' && squad.region) {
      const user = await User.findByPk(userId);
      if (user.city !== squad.region) {
        return res.status(403).json({ error: 'This squad is region-locked' });
      }
    }

    // Add user to squad
    await SquadMember.create({
      squadId,
      userId,
      role: 'member',
      pointsContributed: 0,
      weeklyPointsContributed: 0
    });

    // Update squad member count
    squad.memberCount += 1;
    await squad.save();

    res.json({
      message: 'Joined squad successfully',
      squad
    });
  } catch (error) {
    console.error('Error joining squad:', error);
    res.status(500).json({ error: 'Failed to join squad' });
  }
});

// Leave a squad
router.post('/:squadId/leave', async (req, res) => {
  try {
    const { squadId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const membership = await SquadMember.findOne({
      where: { squadId, userId }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Not a member of this squad' });
    }

    // Don't allow leader to leave if there are other members
    const squad = await Squad.findByPk(squadId);
    if (membership.role === 'leader' && squad.memberCount > 1) {
      return res.status(400).json({ error: 'Leader must transfer leadership or disband squad' });
    }

    // Remove member
    await membership.destroy();

    // Update squad member count
    squad.memberCount -= 1;

    // Delete squad if no members left
    if (squad.memberCount === 0) {
      await squad.destroy();
      return res.json({ message: 'Squad disbanded' });
    }

    await squad.save();

    res.json({ message: 'Left squad successfully' });
  } catch (error) {
    console.error('Error leaving squad:', error);
    res.status(500).json({ error: 'Failed to leave squad' });
  }
});

// Get squad details
router.get('/:squadId', async (req, res) => {
  try {
    const { squadId } = req.params;

    const squad = await Squad.findByPk(squadId, {
      include: [
        {
          model: User,
          as: 'leader',
          attributes: ['id', 'username', 'totalPoints', 'level', 'profilePicture']
        },
        {
          model: SquadMember,
          as: 'members',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'totalPoints', 'weeklyPoints', 'level', 'profilePicture']
            }
          ]
        }
      ]
    });

    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    res.json({ squad });
  } catch (error) {
    console.error('Error getting squad:', error);
    res.status(500).json({ error: 'Failed to get squad' });
  }
});

// Get user's squad
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const membership = await SquadMember.findOne({
      where: { userId },
      include: [
        {
          model: Squad,
          as: 'squad',
          include: [
            {
              model: User,
              as: 'leader',
              attributes: ['id', 'username', 'level', 'profilePicture']
            }
          ]
        }
      ]
    });

    if (!membership) {
      return res.json({ squad: null });
    }

    res.json({ squad: membership.squad, role: membership.role });
  } catch (error) {
    console.error('Error getting user squad:', error);
    res.status(500).json({ error: 'Failed to get user squad' });
  }
});

// Search squads
router.get('/search', async (req, res) => {
  try {
    const { query, type, region } = req.query;

    const where = {};
    
    if (query) {
      where.name = { [Op.iLike]: `%${query}%` };
    }

    if (type) {
      where.type = type;
    }

    if (region) {
      where.region = region;
    }

    const squads = await Squad.findAll({
      where,
      include: [
        {
          model: User,
          as: 'leader',
          attributes: ['id', 'username', 'level', 'profilePicture']
        }
      ],
      order: [['totalPoints', 'DESC']],
      limit: 50
    });

    res.json({ squads });
  } catch (error) {
    console.error('Error searching squads:', error);
    res.status(500).json({ error: 'Failed to search squads' });
  }
});

// Update squad member points (called when user earns points)
router.post('/:squadId/update-points', async (req, res) => {
  try {
    const { squadId } = req.params;
    const { userId, points, isWeekly = false } = req.body;

    if (!userId || points === undefined) {
      return res.status(400).json({ error: 'userId and points are required' });
    }

    const membership = await SquadMember.findOne({
      where: { squadId, userId }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Not a member of this squad' });
    }

    const squad = await Squad.findByPk(squadId);

    // Update member contributions
    membership.pointsContributed += points;
    if (isWeekly) {
      membership.weeklyPointsContributed += points;
    }
    await membership.save();

    // Update squad points
    squad.totalPoints += points;
    if (isWeekly) {
      squad.weeklyPoints += points;
    }
    await squad.save();

    res.json({
      message: 'Squad points updated',
      squad,
      membership
    });
  } catch (error) {
    console.error('Error updating squad points:', error);
    res.status(500).json({ error: 'Failed to update squad points' });
  }
});

// Promote member to admin
router.post('/:squadId/promote', async (req, res) => {
  try {
    const { squadId } = req.params;
    const { leaderId, memberId } = req.body;

    // Verify leader
    const leaderMembership = await SquadMember.findOne({
      where: { squadId, userId: leaderId, role: 'leader' }
    });

    if (!leaderMembership) {
      return res.status(403).json({ error: 'Only the leader can promote members' });
    }

    // Find member to promote
    const membership = await SquadMember.findOne({
      where: { squadId, userId: memberId }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (membership.role === 'leader') {
      return res.status(400).json({ error: 'Cannot promote the leader' });
    }

    membership.role = 'admin';
    await membership.save();

    res.json({ message: 'Member promoted to admin', membership });
  } catch (error) {
    console.error('Error promoting member:', error);
    res.status(500).json({ error: 'Failed to promote member' });
  }
});

// Transfer leadership
router.post('/:squadId/transfer-leadership', async (req, res) => {
  try {
    const { squadId } = req.params;
    const { leaderId, newLeaderId } = req.body;

    // Verify current leader
    const leaderMembership = await SquadMember.findOne({
      where: { squadId, userId: leaderId, role: 'leader' }
    });

    if (!leaderMembership) {
      return res.status(403).json({ error: 'Only the leader can transfer leadership' });
    }

    // Find new leader
    const newLeaderMembership = await SquadMember.findOne({
      where: { squadId, userId: newLeaderId }
    });

    if (!newLeaderMembership) {
      return res.status(404).json({ error: 'New leader not found in squad' });
    }

    // Update squad leaderId
    const squad = await Squad.findByPk(squadId);
    squad.leaderId = newLeaderId;
    await squad.save();

    // Update roles
    leaderMembership.role = 'member';
    await leaderMembership.save();

    newLeaderMembership.role = 'leader';
    await newLeaderMembership.save();

    res.json({ message: 'Leadership transferred successfully', squad });
  } catch (error) {
    console.error('Error transferring leadership:', error);
    res.status(500).json({ error: 'Failed to transfer leadership' });
  }
});

// Kick member (leader/admin only)
router.post('/:squadId/kick', async (req, res) => {
  try {
    const { squadId } = req.params;
    const { requesterId, memberId } = req.body;

    // Verify requester is leader or admin
    const requesterMembership = await SquadMember.findOne({
      where: { squadId, userId: requesterId }
    });

    if (!requesterMembership || !['leader', 'admin'].includes(requesterMembership.role)) {
      return res.status(403).json({ error: 'Only leaders and admins can kick members' });
    }

    // Cannot kick yourself
    if (requesterId === memberId) {
      return res.status(400).json({ error: 'Cannot kick yourself. Use leave instead.' });
    }

    // Find member to kick
    const membership = await SquadMember.findOne({
      where: { squadId, userId: memberId }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Cannot kick leader
    if (membership.role === 'leader') {
      return res.status(403).json({ error: 'Cannot kick the leader' });
    }

    // Admins cannot kick other admins
    if (requesterMembership.role === 'admin' && membership.role === 'admin') {
      return res.status(403).json({ error: 'Admins cannot kick other admins' });
    }

    // Remove member
    await membership.destroy();

    // Update squad member count
    const squad = await Squad.findByPk(squadId);
    squad.memberCount -= 1;
    await squad.save();

    res.json({ message: 'Member kicked successfully' });
  } catch (error) {
    console.error('Error kicking member:', error);
    res.status(500).json({ error: 'Failed to kick member' });
  }
});

module.exports = router;
