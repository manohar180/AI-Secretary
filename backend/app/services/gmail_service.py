import base64
from email.message import EmailMessage
from googleapiclient.discovery import build
from app.services.google_auth import get_google_credentials
from datetime import datetime, timedelta, timezone

class GmailService:
    """
    Handles robust background email sending using the authorized Google Token.
    """
    def __init__(self):
        self.creds = get_google_credentials()
        self.service = build('gmail', 'v1', credentials=self.creds)
        self.calendar_service = build('calendar', 'v3', credentials=self.creds)

    def get_upcoming_availability(self, days: int = 7):
        """
        Calculates EXACT available 30-minute slots natively in Python 
        by subtracting busy calendar events from the 10:00 AM - 7:00 PM IST working hours array.
        """
        print(f"📅 CalendarService: Calculating exactly GUARANTEED free slots for next {days} days...")
        try:
            now_utc = datetime.utcnow()
            end_time_utc = now_utc + timedelta(days=days)
            
            # 1. Fetch all events
            events_result = self.calendar_service.events().list(
                calendarId='primary', timeMin=now_utc.isoformat() + 'Z', timeMax=end_time_utc.isoformat() + 'Z',
                singleEvents=True, orderBy='startTime'
            ).execute()
            events = events_result.get('items', [])
            
            ist_tz = timezone(timedelta(hours=5, minutes=30), name="IST")
            now_ist = now_utc.replace(tzinfo=timezone.utc).astimezone(ist_tz)
            
            # 2. Build Busy Intervals (in IST)
            busy_intervals = []
            for event in events:
                start_raw = event['start'].get('dateTime')
                end_raw = event['end'].get('dateTime')
                if start_raw and end_raw:
                    dt_start = datetime.fromisoformat(start_raw.replace('Z', '+00:00')).astimezone(ist_tz)
                    dt_end = datetime.fromisoformat(end_raw.replace('Z', '+00:00')).astimezone(ist_tz)
                    busy_intervals.append((dt_start, dt_end))
                elif event['start'].get('date'):
                    # All day event
                    dt_start = datetime.strptime(event['start']['date'], '%Y-%m-%d').replace(tzinfo=ist_tz)
                    dt_end = datetime.strptime(event['end']['date'], '%Y-%m-%d').replace(tzinfo=ist_tz)
                    # For all day events, shift the end to the next day 00:00 correctly
                    dt_end += timedelta(days=1)
                    busy_intervals.append((dt_start, dt_end))
            
            # 3. Generate candidate slots (10 AM to 7 PM IST)
            available_slots = []
            # Start algorithm from today at 10 AM
            current_day = now_ist.replace(hour=10, minute=0, second=0, microsecond=0)
            
            for _ in range(days):
                slot_start = current_day
                slot_end = current_day + timedelta(hours=9) # 10 AM to 7 PM IST
                
                curr_slot = slot_start
                if curr_slot.date() == now_ist.date():
                    # If it's today, we can't schedule in the past. Push `curr_slot` ahead of `now_ist`
                    if now_ist > curr_slot:
                        minutes_to_next = 30 - (now_ist.minute % 30)
                        curr_slot = now_ist + timedelta(minutes=minutes_to_next)
                        curr_slot = curr_slot.replace(second=0, microsecond=0)
                
                # Check 30-min intervals
                while curr_slot + timedelta(minutes=30) <= slot_end:
                    candidate_end = curr_slot + timedelta(minutes=30)
                    overlap = False
                    for b_start, b_end in busy_intervals:
                        # Standard math: if max(start1, start2) < min(end1, end2), they overlap
                        if max(curr_slot, b_start) < min(candidate_end, b_end):
                            overlap = True
                            break
                    if not overlap:
                        # Found a 100% free slot!
                        iso_val = curr_slot.isoformat()
                        human_val = curr_slot.strftime("%A, %B %d %Y at %I:%M %p")
                        available_slots.append(f"[{iso_val}] {human_val}")
                        # Removed the cap entirely so the AI can see the entire 7 days.
                            
                    curr_slot += timedelta(minutes=30)
                
                current_day += timedelta(days=1)
                
            if not available_slots:
                return "CRITICAL ERROR: No available slots found in the next 7 days."
                
            return "\n".join(available_slots)
        except Exception as e:
            print(f"❌ Failed to precisely calculate slots: {e}")
            return "Could not determine calendar availability."

    def create_google_meet(self, guest_email: str, start_iso: str, duration_minutes: int = 30):
        """
        Physically creates a Calendar Event with a native Google Meet Room and invites the guest.
        """
        print(f"🎥 CalendarService: Generating Google Meet for {guest_email} at {start_iso}")
        try:
            # The LLM outputs ISO formatted strings. We safely parse them.
            start_dt = datetime.fromisoformat(start_iso.replace('Z', '+00:00'))
            end_dt = start_dt + timedelta(minutes=duration_minutes)
            
            event = {
                'summary': f'Sync: {guest_email.split("@")[0]}',
                'description': 'Automatically scheduled via CoordAI Secretary.',
                'start': {
                    'dateTime': start_dt.isoformat(),
                    'timeZone': 'Asia/Kolkata',
                },
                'end': {
                    'dateTime': end_dt.isoformat(),
                    'timeZone': 'Asia/Kolkata',
                },
                'attendees': [
                    {'email': guest_email},
                ],
                'conferenceData': {
                    'createRequest': {
                        'requestId': f"coordai-{start_dt.timestamp()}",
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                    }
                }
            }
            
            # conferenceDataVersion=1 is legally required by Google to create the Meet Link
            result = self.calendar_service.events().insert(
                calendarId='primary',
                body=event,
                conferenceDataVersion=1,
                sendUpdates='all' # Send an official calendar invite locally to their inbox
            ).execute()
            
            meet_link = result.get('hangoutLink')
            print(f"✅ Executed Meet Creation! Link: {meet_link}")
            return meet_link
        except Exception as e:
            print(f"❌ Failed to create Google Meet Room: {e}")
            return None

    def block_calendar_time(self, start_iso: str, end_iso: str, title: str = "Busy (AI Blocked)"):
        """
        Creates a generic 'Busy' event in the calendar to block out requested time.
        """
        print(f"📅 CalendarService: Blocking time from {start_iso} to {end_iso} for '{title}'")
        try:
            start_dt = datetime.fromisoformat(start_iso.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_iso.replace('Z', '+00:00'))
            
            event = {
                'summary': title,
                'description': 'Time blocked natively by CoordAI Assistant.',
                'start': {
                    'dateTime': start_dt.isoformat(),
                    'timeZone': 'Asia/Kolkata',
                },
                'end': {
                    'dateTime': end_dt.isoformat(),
                    'timeZone': 'Asia/Kolkata',
                }
            }
            
            result = self.calendar_service.events().insert(
                calendarId='primary',
                body=event
            ).execute()
            
            print(f"✅ Executed Calendar Block! Event Id: {result.get('id')}")
            return True
        except Exception as e:
            print(f"❌ Failed to block calendar time: {e}")
            return False

    def read_unread_emails(self, max_results: int = 3):
        """
        Polls the user's inbox for recent messages.
        Returns a rich list of parsed subjects, sender addresses, thread IDs, and body excerpts.
        """
        print(f"📥 GmailService: Polling for {max_results} unread emails...")
        try:
            # Bulletproof native label ID filter for strict unread delivery
            results = self.service.users().messages().list(userId='me', labelIds=['UNREAD', 'INBOX'], maxResults=max_results).execute()
            messages = results.get('messages', [])
            
            parsed_emails = []
            for msg in messages:
                msg_id = msg['id']
                thread_id = msg['threadId']
                msg_obj = self.service.users().messages().get(userId='me', id=msg_id, format='full').execute()
                
                payload = msg_obj.get('payload', {})
                headers = payload.get('headers', [])
                
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), "No Subject")
                sender = next((h['value'] for h in headers if h['name'] == 'From'), "Unknown Sender")
                message_id_header = next((h['value'] for h in headers if h['name'] == 'Message-ID'), "")
                
                # Best effort body parsing (simplified for plain text)
                body = "Could not parse plain text body."
                if 'parts' in payload:
                    for part in payload['parts']:
                        if part['mimeType'] == 'text/plain':
                            data = part['body'].get('data')
                            if data:
                                body = base64.urlsafe_b64decode(data).decode('utf-8')
                            break
                elif 'body' in payload and 'data' in payload['body']:
                    body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')

                parsed_emails.append({
                    "id": msg_id,
                    "thread_id": thread_id,
                    "message_id_header": message_id_header,
                    "subject": subject,
                    "sender": sender,
                    "body": body[:500] # Limit to 500 chars for prompt safety
                })
            
            return parsed_emails
        except Exception as e:
            print(f"❌ Failed to fetch emails: {e}")
            return []

    def send_email(self, to_email: str, subject: str, body_text: str, thread_id: str = None, message_id_header: str = None):
        """
        Constructs and securely dispatches an email. Supports full HTML to render interactive UI buttons.
        """
        print(f"📧 GmailService: Dispatching HTML email to {to_email} (Thread: {thread_id})...")
        
        message = EmailMessage()
        message.add_alternative(body_text.replace('\n', '<br>'), subtype='html')
        message['To'] = to_email
        message['From'] = "me"
        message['Subject'] = subject
        
        if thread_id and message_id_header:
            message['In-Reply-To'] = message_id_header
            message['References'] = message_id_header

        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        payload = {'raw': encoded_message}
        if thread_id:
            payload['threadId'] = thread_id

        try:
            result = self.service.users().messages().send(userId="me", body=payload).execute()
            
            # Optional: Mark the original email as read so we don't process it again
            if thread_id:
                pass # self.service.users().threads().modify(userId='me', id=thread_id, body={'removeLabelIds': ['UNREAD']}).execute()
            
            print(f"✅ Email sent successfully! Message Id: {result['id']}")
            return result
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            raise e

    def trash_email(self, msg_id: str):
        """
        Moves a specific email thread into the Gmail Trash folder permanently.
        """
        print(f"🗑️ GmailService: Moving message {msg_id} to Trash...")
        try:
            self.service.users().messages().trash(userId='me', id=msg_id).execute()
            print(f"✅ Trashed {msg_id} natively.")
            return True
        except Exception as e:
            print(f"❌ Failed to trash email {msg_id}: {e}")
            return False
