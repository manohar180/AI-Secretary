from groq import Groq
from pydantic import BaseModel
from app.core.config import settings
from app.models.workflow import PrivacySafeContext

class SecretaryAgent:
    """
    The Specialized Secretary Agent.
    Strictly handles fine-tuned professional communications using the Free Groq API.
    """
    def __init__(self):
        # We use the native Groq client for precise compatibility, enforcing strip() to prevent hidden \r\n characters
        self.client = Groq(api_key=settings.GROQ_API_KEY.strip())
        self.model = "llama-3.1-8b-instant" # Fast, smart, capable of excellent tones

    def draft_follow_up_email(self, context: PrivacySafeContext) -> str:
        """
        Drafts a professional, context-aware email using the LLM.
        Note: The LLM gets NO sensitive data. It just gets metadata.
        """
        prompt = f"""
        You are an elite, highly professional Executive Assistant managing B2B coordination.
        Your tone is warm, extremely polite, concise, and proactive.
        
        Current workflow state: {context.current_stage.value}
        Days pending: {context.days_in_stage}
        
        Task: Draft a short, frictionless follow-up email.
        Do NOT invent company names, pricing, or terms. Keep placeholders like [Company Name] where needed.
        
        Draft the email body now:
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional AI Secretary."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=250,
                temperature=0.3 # Low temperature for more predictable, professional answers
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            # --- MOCK LLM FALLBACK FOR HACKATHON OFFLINE MODE ---
            # If the API key is missing or invalid, we gracefully fallback to mock data
            # so the dashboard/VC demo still works perfectly.
            print(f"⚠️ Warning: LLM API Error ({str(e)}). Using Mock Mode.")
            return f"Hi [Name],\n\nI'm following up regarding the [Document] we sent over recently. Please let me know if you have any questions or if there is anything we can do to help move this forward.\n\nBest regards,\n[Company] Team"
