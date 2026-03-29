import datetime
from googleapiclient.discovery import build
from app.services.google_auth import get_google_credentials

class CalendarService:
    """
    Handles robust calendar reading/writing using the authorized Google Token.
    """
    def __init__(self):
        self.creds = get_google_credentials()
        self.service = build('calendar', 'v3', credentials=self.creds)

    def book_meeting(self, summary: str, description: str, start_time_iso: str, end_time_iso: str, attendee_emails: list):
        """
        Creates an event strictly using the provided ISO 8601 UTC strings.
        """
        print(f"📅 CalendarService: Requesting event creation for {summary}...")
        
        event = {
            'summary': summary,
            'description': description,
            'start': {
                'dateTime': start_time_iso,
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_time_iso,
                'timeZone': 'UTC',
            },
            'attendees': [{'email': email} for email in attendee_emails],
            'reminders': {
                'useDefault': True,
            },
        }

        try:
            event_result = self.service.events().insert(calendarId='primary', body=event).execute()
            print(f"✅ Event successfully booked! Link: {event_result.get('htmlLink')}")
            return event_result
        except Exception as e:
            print(f"❌ Failed to book event: {e}")
            raise e
