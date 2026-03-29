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
        Fetches the user's primary calendar events to generate a 'Free/Busy' matrix
        for the LLM contextual injection prompt.
        """
        print(f"📅 CalendarService: Fetching availability for next {days} days...")
        try:
            now = datetime.utcnow().isoformat() + 'Z'
            end_time = (datetime.utcnow() + timedelta(days=days)).isoformat() + 'Z'
            
            events_result = self.calendar_service.events().list(
                calendarId='primary', timeMin=now, timeMax=end_time,
                singleEvents=True, orderBy='startTime'
            ).execute()
            events = events_result.get('items', [])
            
            if not events:
                return "The user has no calendar events. They are completely free."
                
            busy_blocks = []
            ist_tz = timezone(timedelta(hours=5, minutes=30), name="IST")
            
            for event in events:
                # Handle both dateTime (standard) and date (all-day) formats
                start_raw = event['start'].get('dateTime', event['start'].get('date'))
                end_raw = event['end'].get('dateTime', event['end'].get('date'))
                summary = event.get('summary', 'Busy')
                
                try:
                    # If it's a specific time (not all-day)
                    if 'T' in start_raw:
                        # Safely parse ISO string with Timezone offsets
                        dt_start = datetime.fromisoformat(start_raw.replace('Z', '+00:00')).astimezone(ist_tz)
                        dt_end = datetime.fromisoformat(end_raw.replace('Z', '+00:00')).astimezone(ist_tz)
                        
                        start_clean = dt_start.strftime("%A (%B %d) at %I:%M %p")
                        end_clean = dt_end.strftime("%A (%B %d) at %I:%M %p")
                        busy_blocks.append(f"- Busy Block: {start_clean} to {end_clean}")
                    else:
                        busy_blocks.append(f"- All-day busy on {start_raw}")
                except Exception:
                    busy_blocks.append(f"- Busy: {start_raw} to {end_raw}")
                
            return "\n".join(busy_blocks)
        except Exception as e:
            print(f"❌ Failed to fetch calendar: {e}")
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
        Constructs and securely dispatches an email. If thread_id is provided, replies in-thread.
        """
        print(f"📧 GmailService: Dispatching email to {to_email} (Thread: {thread_id})...")
        
        message = EmailMessage()
        message.set_content(body_text)
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
