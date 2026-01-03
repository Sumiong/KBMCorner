// Supabase-first data management with cross-device sync
// Always uses Supabase as source of truth

import { createClient } from '../utils/supabase/client';

const supabase = createClient();

// Check if Supabase tables are set up
let supabaseReady: boolean | null = null;

export function resetSupabaseCheck() {
  supabaseReady = null;
}

export async function checkSupabaseSetup(forceCheck: boolean = false): Promise<boolean> {
  if (!forceCheck && supabaseReady !== null) return supabaseReady;
  
  try {
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    // If there's any error (table not found, etc), database is not ready
    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        // Table doesn't exist - this is expected before setup
        supabaseReady = false;
      } else {
        console.log('Database error:', error.code, error.message);
        supabaseReady = false;
      }
      return false;
    }
    
    supabaseReady = true;
    return true;
  } catch (err) {
    console.error('Supabase check error:', err);
    supabaseReady = false;
    return false;
  }
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'committee' | 'tutor';
  membershipLevel: number;
  verified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  membershipExpiry?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  level: number;
  paymentMethod: string;
  referenceNumber?: string;
  status: string;
  paidAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  venue?: string;
  sessionCode?: string;
  createdBy: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  eventId?: string;
  eventTitle?: string;
  sessionCode?: string;
  className?: string;
  type?: 'event' | 'class';
  checkedInAt: string;
}

export interface RSVP {
  id: string;
  userId: string;
  eventId: string;
  rsvpedAt: string;
}

// ============================================================================
// User Profile Management
// ============================================================================

export const saveUserProfile = async (userId: string, profile: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      membership_level: profile.membershipLevel,
      membership_expiry: profile.membershipExpiry,
      verified: profile.verified,
      verification_status: profile.verificationStatus,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    membershipLevel: data.membership_level,
    membershipExpiry: data.membership_expiry,
    verified: data.verified,
    verificationStatus: data.verification_status,
    createdAt: data.created_at,
  };
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((user: any) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    membershipLevel: user.membership_level,
    membershipExpiry: user.membership_expiry,
    verified: user.verified,
    verificationStatus: user.verification_status,
    createdAt: user.created_at,
  }));
};

export const deleteUser = async (userId: string) => {
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId);

  if (error) throw error;
};

// ============================================================================
// Payment Management
// ============================================================================

export const savePayment = async (userId: string, payment: Payment) => {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      id: payment.id,
      user_id: userId,
      amount: payment.amount,
      level: payment.level,
      payment_method: payment.paymentMethod,
      reference_number: payment.referenceNumber,
      status: payment.status,
      paid_at: payment.paidAt,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPayments = async (userId: string): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('paid_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((payment: any) => ({
    id: payment.id,
    userId: payment.user_id,
    amount: payment.amount,
    level: payment.level,
    paymentMethod: payment.payment_method,
    referenceNumber: payment.reference_number,
    status: payment.status,
    paidAt: payment.paid_at,
  }));
};

export const getAllPayments = async (): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('paid_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((payment: any) => ({
    id: payment.id,
    userId: payment.user_id,
    amount: payment.amount,
    level: payment.level,
    paymentMethod: payment.payment_method,
    referenceNumber: payment.reference_number,
    status: payment.status,
    paidAt: payment.paid_at,
  }));
};

// ============================================================================
// Event Management
// ============================================================================

export const saveEvent = async (event: Event) => {
  const { data, error } = await supabase
    .from('events')
    .insert({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      venue: event.location,
      session_code: event.sessionCode,
      created_by: event.createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEvent = async (eventId: string, updates: Partial<Event>) => {
  const updateData: any = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.date !== undefined) updateData.date = updates.date;
  if (updates.location !== undefined) {
    updateData.location = updates.location;
    updateData.venue = updates.location;
  }
  if (updates.sessionCode !== undefined) updateData.session_code = updates.sessionCode;

  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEvent = async (eventId: string) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
};

export const getAllEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw error;

  return (data || []).map((event: any) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location || event.venue,
    venue: event.venue || event.location,
    sessionCode: event.session_code,
    createdBy: event.created_by,
    createdAt: event.created_at,
  }));
};

export const getEvent = async (eventId: string): Promise<Event | null> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    date: data.date,
    location: data.location || data.venue,
    venue: data.venue || data.location,
    sessionCode: data.session_code,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
};

// ============================================================================
// Attendance Management
// ============================================================================

export const saveAttendance = async (attendance: Attendance) => {
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      id: attendance.id,
      user_id: attendance.userId,
      event_id: attendance.eventId,
      event_title: attendance.eventTitle,
      session_code: attendance.sessionCode,
      class_name: attendance.className,
      type: attendance.type,
      checked_in_at: attendance.checkedInAt,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserAttendance = async (userId: string): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .order('checked_in_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((record: any) => ({
    id: record.id,
    userId: record.user_id,
    eventId: record.event_id,
    eventTitle: record.event_title,
    sessionCode: record.session_code,
    className: record.class_name,
    type: record.type,
    checkedInAt: record.checked_in_at,
  }));
};

export const getAllAttendance = async (): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .order('checked_in_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((record: any) => ({
    id: record.id,
    userId: record.user_id,
    eventId: record.event_id,
    eventTitle: record.event_title,
    sessionCode: record.session_code,
    className: record.class_name,
    type: record.type,
    checkedInAt: record.checked_in_at,
  }));
};

export const getEventAttendance = async (eventId: string): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((record: any) => ({
    id: record.id,
    userId: record.user_id,
    eventId: record.event_id,
    eventTitle: record.event_title,
    sessionCode: record.session_code,
    className: record.class_name,
    type: record.type,
    checkedInAt: record.checked_in_at,
  }));
};

// ============================================================================
// RSVP Management
// ============================================================================

export const saveRSVP = async (rsvp: RSVP) => {
  const { data, error } = await supabase
    .from('rsvps')
    .insert({
      id: rsvp.id,
      user_id: rsvp.userId,
      event_id: rsvp.eventId,
      rsvped_at: rsvp.rsvpedAt,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteRSVP = async (userId: string, eventId: string) => {
  const { error } = await supabase
    .from('rsvps')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId);

  if (error) throw error;
};

export const getUserRSVPs = async (userId: string): Promise<RSVP[]> => {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('user_id', userId)
    .order('rsvped_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((rsvp: any) => ({
    id: rsvp.id,
    userId: rsvp.user_id,
    eventId: rsvp.event_id,
    rsvpedAt: rsvp.rsvped_at,
  }));
};

export const getEventRSVPs = async (eventId: string): Promise<RSVP[]> => {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('event_id', eventId)
    .order('rsvped_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((rsvp: any) => ({
    id: rsvp.id,
    userId: rsvp.user_id,
    eventId: rsvp.event_id,
    rsvpedAt: rsvp.rsvped_at,
  }));
};

export const getAllRSVPs = async (): Promise<RSVP[]> => {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .order('rsvped_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((rsvp: any) => ({
    id: rsvp.id,
    userId: rsvp.user_id,
    eventId: rsvp.event_id,
    rsvpedAt: rsvp.rsvped_at,
  }));
};

export const isUserRSVPed = async (userId: string, eventId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('rsvps')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return false;
    throw error;
  }

  return !!data;
};

// ============================================================================
// Utility Functions
// ============================================================================

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const clearAllData = async () => {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    alert('Please use Supabase dashboard to manage database data for safety.');
  }
};