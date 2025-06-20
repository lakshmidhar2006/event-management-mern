import Models from '../models/Event.js';
import User from '../models/User.js';
import sendMail from '../util/mail.js';

const { Event, Scholarship } = Models;

export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, maxParticipants, organizerId, category, paymentType, evaluationMarkers } = req.body;

    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return res.status(400).json({ message: 'Event date cannot be in the past' });
    }

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      maxParticipants,
      category,
      paymentType,
      organizer: organizerId,
      evaluationMarkers: evaluationMarkers || []
    });

    await newEvent.save();
    res.status(201).json({ message: 'Event created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
};

export const createScholarship = async (req, res) => {
  try {
    const { title, degrees, courses, nationalities, funding, deadline, organizerId } = req.body;

    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deadlineDate < today) {
      return res.status(400).json({ message: 'Scholarship deadline cannot be in the past' });
    }

    const newScholarship = new Scholarship({
      title,
      degrees,
      courses,
      nationalities,
      funding,
      deadline,
      organizer: organizerId
    });

    await newScholarship.save();
    res.status(201).json({ message: 'Scholarship created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating scholarship', error: err.message });
  }
};

export const getRegisteredEvents = async (req, res) => {
  try {
    const { userId } = req.params;
    const events = await Event.find({ participants: userId }).populate('organizer', 'name email');
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching registered events', error: err.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { organizer: { $ne: userId } } : {};
    const events = await Event.find(query).populate('organizer', 'name email');
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
};

export const getAllScholarship = async (req, res) => {
  try {
    const scholarships = await Scholarship.find().populate('organizer', 'name email');
    res.status(200).json(scholarships);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching scholarships', error: err.message });
  }
};

export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizer.toString() === userId) return res.status(403).json({ message: 'Organizers cannot register for their own event' });
    if (event.participants.includes(userId)) return res.status(409).json({ message: 'User already registered' });
    if (event.participants.length >= event.maxParticipants) return res.status(409).json({ message: 'Event is full' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    event.participants.push(userId);
    await event.save();

    await sendMail({
      email: user.email,
      subject: `Registration Successful for Event: ${event.title}`,
      message: `Hi ${user.name},

Thank you for registering for "${event.title}".
Date: ${event.date}
Location: ${event.location}

Best regards,  
Event Management Team`
    });

    res.status(200).json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

export const registerForScholarship = async (req, res) => {
  try {
    const { ScholarshipId } = req.params;
    const { userId } = req.body;

    const scholarship = await Scholarship.findById(ScholarshipId);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });
    if (scholarship.organizer.toString() === userId) return res.status(403).json({ message: 'Organizers cannot register for their own scholarship' });
    if (scholarship.participants.includes(userId)) return res.status(409).json({ message: 'User already registered' });

    scholarship.participants.push(userId);
    await scholarship.save();

    res.status(200).json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, date, location, maxParticipants, category, paymentType, organizerId, evaluationMarkers } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizer.toString() !== organizerId) return res.status(403).json({ message: 'Only the organizer can update this event' });

    const newDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate < today) return res.status(400).json({ message: 'Event date cannot be in the past' });

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { title, description, date, location, maxParticipants, category, paymentType, evaluationMarkers },
      { new: true }
    ).populate('organizer', 'name email');

    res.status(200).json(updatedEvent);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update event', error: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await Event.findByIdAndDelete(eventId);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event', error: err.message });
  }
};

export const deleteScholarship = async (req, res) => {
  try {
    const { ScholarshipId } = req.params;
    const scholarship = await Scholarship.findById(ScholarshipId);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });

    await Scholarship.findByIdAndDelete(ScholarshipId);
    res.status(200).json({ message: 'Scholarship deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete scholarship', error: err.message });
  }
};

export const cancelRegistration = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const index = event.participants.indexOf(userId);
    if (index === -1) return res.status(409).json({ message: 'User is not registered for this event' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    event.participants.splice(index, 1);
    await event.save();

    await sendMail({
      email: user.email,
      subject: `Registration Cancelled: ${event.title}`,
      message: `Hi ${user.name},

Your registration for "${event.title}" has been cancelled.

Best regards,  
Event Management Team`
    });

    res.status(200).json({ message: 'Registration cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel registration', error: err.message });
  }
};

export const removeParticipant = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, organizerId, reason } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizer.toString() !== organizerId) return res.status(403).json({ message: 'Only the organizer can remove participants' });

    const index = event.participants.indexOf(userId);
    if (index === -1) return res.status(400).json({ message: 'User is not a participant' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    event.participants.splice(index, 1);
    await event.save();

    await sendMail({
      email: user.email,
      subject: `Removed from Event: ${event.title}`,
      message: `Hi ${user.name},

You have been removed from "${event.title}" due to: ${reason}.

Best regards,  
Event Management Team`
    });

    res.status(200).json({ message: 'Participant removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove participant', error: err.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId)
      .populate('organizer', 'name email')
      .populate('participants', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });

    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event details', error: err.message });
  }
};

export const getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).populate('participants', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json(event.participants);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching participants', error: err.message });
  }
};

export const getScholarshipParticipants = async (req, res) => {
  try {
    const { ScholarshipId } = req.params;
    const scholarship = await Scholarship.findById(ScholarshipId).populate('participants', 'name email');
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });
    res.status(200).json(scholarship.participants);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching participants', error: err.message });
  }
};

export const getAllEventsByOrganizer = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.params.organizerId }).populate('participants', 'name email');
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events by organizer', error: err.message });
  }
};

export const getAllScholarshipByOrganizer = async (req, res) => {
  try {
    const scholarships = await Scholarship.find({ organizer: req.params.organizerId }).populate('participants', 'name email');
    res.status(200).json(scholarships);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching scholarships by organizer', error: err.message });
  }
};

export const deleteEvent_org = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { organizerId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizer.toString() !== organizerId) return res.status(403).json({ message: 'Only the organizer can delete this event' });

    await Event.findByIdAndDelete(eventId);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event', error: err.message });
  }
};
