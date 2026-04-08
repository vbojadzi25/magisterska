const express = require('express');
const { Op } = require('sequelize');
const { Contact, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Sync contacts
router.post('/sync', authenticate, async (req, res) => {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts)) {
      return res.status(400).json({ error: 'Contacts must be an array' });
    }

    const syncedContacts = [];
    const onDenarContacts = [];

    for (const contact of contacts) {
      const { name, phoneNumber } = contact;

      if (!name || !phoneNumber) {
        continue;
      }

      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

      // Check if this phone number belongs to a Denar user
      const existingUser = await User.findOne({
        where: { phoneNumber: `+389${cleanPhoneNumber}` }
      });

      // Save or update contact
      const [savedContact, created] = await Contact.findOrCreate({
        where: {
          userId: req.user.id,
          phoneNumber: cleanPhoneNumber
        },
        defaults: {
          contactName: name,
          matchedUserId: existingUser ? existingUser.id : null
        }
      });

      if (!created) {
        await savedContact.update({
          contactName: name,
          matchedUserId: existingUser ? existingUser.id : null
        });
      }

      const contactData = {
        id: savedContact.id,
        name,
        phoneNumber: cleanPhoneNumber,
        isOnDenar: !!existingUser,
        userId: existingUser ? existingUser.id : null
      };

      syncedContacts.push(contactData);

      if (existingUser) {
        onDenarContacts.push({
          ...contactData,
          user: {
            id: existingUser.id,
            name: `${existingUser.firstName} ${existingUser.lastName}`.trim(),
            profileImageUrl: existingUser.profileImageUrl
          }
        });
      }
    }

    res.json({
      message: 'Contacts synced successfully',
      totalContacts: syncedContacts.length,
      onDenarCount: onDenarContacts.length,
      contacts: syncedContacts,
      onDenarContacts
    });
  } catch (error) {
    console.error('Error syncing contacts:', error);
    res.status(500).json({ error: 'Failed to sync contacts' });
  }
});

// Get synced contacts
router.get('/', authenticate, async (req, res) => {
  try {
    const contacts = await Contact.findAll({
      where: { userId: req.user.id },
      include: [{
        model: User,
        as: 'matchedUser',
        attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'profileImageUrl'],
        required: false
      }],
      order: [['contactName', 'ASC']]
    });

    const formattedContacts = contacts.map(contact => ({
      id: contact.id,
      name: contact.contactName,
      phoneNumber: contact.phoneNumber,
      isOnDenar: !!contact.matchedUser,
      userId: contact.matchedUser ? contact.matchedUser.id : null,
      user: contact.matchedUser ? {
        id: contact.matchedUser.id,
        name: `${contact.matchedUser.firstName} ${contact.matchedUser.lastName}`.trim(),
        phoneNumber: contact.matchedUser.phoneNumber,
        profileImageUrl: contact.matchedUser.profileImageUrl
      } : null,
      invited: !!contact.invitedAt
    }));

    res.json({ contacts: formattedContacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Search contacts by name or phone number
router.get('/search', authenticate, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const contacts = await Contact.findAll({
      where: {
        userId: req.user.id,
        [Op.or]: [
          { contactName: { [Op.iLike]: `%${query}%` } },
          { phoneNumber: { [Op.iLike]: `%${query}%` } }
        ]
      },
      include: [{
        model: User,
        as: 'matchedUser',
        attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'profileImageUrl'],
        required: false
      }],
      limit: 20
    });

    const results = contacts.map(contact => ({
      id: contact.id,
      name: contact.contactName,
      phoneNumber: contact.phoneNumber,
      isOnDenar: !!contact.matchedUser,
      userId: contact.matchedUser ? contact.matchedUser.id : null,
      user: contact.matchedUser ? {
        id: contact.matchedUser.id,
        name: `${contact.matchedUser.firstName} ${contact.matchedUser.lastName}`.trim(),
        profileImageUrl: contact.matchedUser.profileImageUrl
      } : null
    }));

    res.json({ results });
  } catch (error) {
    console.error('Error searching contacts:', error);
    res.status(500).json({ error: 'Failed to search contacts' });
  }
});

// Invite contact to Denar
router.post('/:contactId/invite', authenticate, async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findOne({
      where: {
        id: contactId,
        userId: req.user.id
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (contact.matchedUserId) {
      return res.status(400).json({ error: 'Contact is already on Denar' });
    }

    if (contact.invitedAt) {
      return res.status(400).json({ error: 'Contact has already been invited' });
    }

    await contact.update({
      invitedAt: new Date()
    });

    // In a real app, you would send an SMS invitation here
    console.log(`Sending invitation SMS to ${contact.phoneNumber}`);

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error inviting contact:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Delete contact
router.delete('/:contactId', authenticate, async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findOne({
      where: {
        id: contactId,
        userId: req.user.id
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await contact.destroy();

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

module.exports = router;