import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# If modifying these scopes, delete the file token.json.
# We need access to send emails and read/write calendar events.
# Include gmail.modify to allow READING inbox and SENDING emails
SCOPES = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar.events'
]

def get_google_credentials():
    """
    Shows basic usage of the Gmail API and Calendar API.
    Prints the user's email address by listing labels.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    token_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'token.json')
    creds_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'credentials.json')
    
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing expired Google token...")
            creds.refresh(Request())
        else:
            if not os.path.exists(creds_path):
                raise FileNotFoundError(f"Missing {creds_path}! Google Login will fail.")
            
            print("🚀 OPENING BROWSER FOR GOOGLE LOGIN...")
            print("Please check your web browser and click 'Continue' to authorize the AI Secretary.")
            
            flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
            creds = flow.run_local_server(port=0)
            
        # Save the credentials for the next run
        with open(token_path, 'w') as token:
            token.write(creds.to_json())
            print("✅ Successfully generated and saved token.json!")
            
    return creds

if __name__ == '__main__':
    # Run this file directly to generate the token.json
    print("Pre-warming Google Authentication...")
    get_google_credentials()
