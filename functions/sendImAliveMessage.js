import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

try { initializeApp(); } catch (e) { /* already initialized */ }
const db = getFirestore();

/**
 * Send "I'm Alive" SMS messages to pre-designated contacts.
 * Uses Twilio for SMS delivery.
 */
export const sendImAliveMessage = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const uid = request.auth.uid;
  const { contacts, message } = request.data;

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    throw new HttpsError('invalid-argument', 'At least one contact is required.');
  }

  if (contacts.length > 5) {
    throw new HttpsError('invalid-argument', 'Maximum 5 contacts allowed.');
  }

  // Get user info for the message
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();
  const senderName = userData?.displayName || userData?.email || 'A ReadyBlock user';

  const defaultMessage = `${senderName} has marked themselves as safe via ReadyBlock. This is an automated safety notification.`;
  const finalMessage = message || defaultMessage;

  // Attempt Twilio SMS delivery
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  const results = [];

  for (const contact of contacts) {
    if (!contact.phone) continue;

    try {
      if (accountSid && authToken && fromNumber) {
        // Real Twilio delivery
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: contact.phone,
            From: fromNumber,
            Body: finalMessage,
          }),
        });
        const data = await response.json();
        results.push({
          phone: contact.phone,
          delivered: response.ok,
          sid: data.sid || null,
          timestamp: new Date().toISOString(),
        });
      } else {
        // No Twilio config — log but mark as pending
        results.push({
          phone: contact.phone,
          delivered: false,
          reason: 'sms-not-configured',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      results.push({
        phone: contact.phone,
        delivered: false,
        reason: 'delivery-failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  const deliveredCount = results.filter((r) => r.delivered).length;

  // Audit log
  await db.collection('auditLogs').add({
    action: 'imAlive.sent',
    actorUid: uid,
    actorRole: userData?.role || 'unknown',
    targetCollection: 'users',
    targetDocId: uid,
    timestamp: FieldValue.serverTimestamp(),
    details: {
      contactCount: contacts.length,
      deliveredCount,
      results,
    },
  });

  return {
    success: true,
    data: { deliveredCount, totalCount: contacts.length, results },
  };
});
