from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, List, Any

class WorkflowStage(str, Enum):
    ONBOARDING_INITIAL_CONTACT = "ONBOARDING_INITIAL_CONTACT"
    SCHEDULING = "SCHEDULING"
    POST_MEETING = "POST_MEETING"
    CONTRACT_PENDING = "CONTRACT_PENDING"
    LEGAL_REVIEW = "LEGAL_REVIEW"
    COMPLETED = "COMPLETED"

class ActionType(str, Enum):
    DRAFT_EMAIL = "DRAFT_EMAIL"
    SCHEDULE_MEETING = "SCHEDULE_MEETING"
    ESCALATE_TO_HUMAN = "ESCALATE_TO_HUMAN"
    UPDATE_CRM = "UPDATE_CRM"
    WAIT = "WAIT"

class PrivacySafeContext(BaseModel):
    """
    Data Minimization Layer.
    This is all the AI is allowed to see. It strips out actual company names, 
    pricing, signatures, or contract text.
    """
    tenant_id: str = Field(description="Anonymous ID of the client (Tenant Isolation).")
    interaction_id: str = Field(description="Anonymous ID of the external partner.")
    current_stage: WorkflowStage = Field(description="The current state of the workflow.")
    days_in_stage: int = Field(description="How many days the workflow has been stuck in this stage.")
    last_human_action: Optional[str] = Field(default=None, description="The last recorded action by a human.")
    requested_changes_count: Optional[int] = Field(default=0, description="Number of standard changes requested (no actual text).")
    is_weekend_or_holiday: bool = Field(default=False, description="Whether it is currently outside business hours.")

class AgentDecision(BaseModel):
    """
    The structured output we demand from our AI agents.
    It forces the AI to output deterministic actions.
    """
    confidence_score: float = Field(..., ge=0, le=1.0, description="How confident the AI is (0 to 1). If <0.8, we escalate.")
    proposed_action: ActionType
    reasoning: str = Field(description="Why the agent chose this action.")
    draft_content: Optional[str] = Field(default=None, description="The drafted email or content, if applicable.")
    is_safe_to_automate: bool = Field(default=False, description="True ONLY IF action has zero committal consequence.")
