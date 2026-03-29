from app.models.workflow import PrivacySafeContext, AgentDecision, ActionType, WorkflowStage
from app.agents.secretary import SecretaryAgent
import json

class Orchestrator:
    """
    The Orchestrator Agent limits access to raw data.
    It receives the privacy-scrubbed context and makes high-level decisions 
    or delegates to sub-agents (e.g., SecretaryAgent).
    """

    def __init__(self):
        # Initialize our AI models
        self.secretary = SecretaryAgent()

    def decide_next_action(self, context: PrivacySafeContext) -> AgentDecision:
        """
        Takes purely metadata and determines the next step.
        """
        # Hardcoded Rule Engine (Safety Layer)
        if context.is_weekend_or_holiday:
            return AgentDecision(
                confidence_score=1.0,
                proposed_action=ActionType.WAIT,
                reasoning="Rule 1: Never automate during weekends/holidays.",
                is_safe_to_automate=True
            )

        if context.current_stage == WorkflowStage.CONTRACT_PENDING:
            if context.days_in_stage > 5:
                # Escalation threshold met
                return AgentDecision(
                    confidence_score=0.95,
                    proposed_action=ActionType.ESCALATE_TO_HUMAN,
                    reasoning=f"Critical threshold reached: {context.days_in_stage} days pending on contract.",
                    is_safe_to_automate=False # Because this triggers a human alert directly
                )
            elif context.days_in_stage == 3:
                # Polite Follow-up via LLM Generation
                draft = self.secretary.draft_follow_up_email(context)
                return AgentDecision(
                    confidence_score=0.90,
                    proposed_action=ActionType.DRAFT_EMAIL,
                    draft_content=draft,
                    reasoning="Wait time reaches 3 days, standard follow-up is required.",
                    is_safe_to_automate=True # Standard follow ups are safely automated
                )

        if context.current_stage == WorkflowStage.LEGAL_REVIEW:
            if context.requested_changes_count and context.requested_changes_count > 0:
                # Any legal changes go directly to a human context layer
                return AgentDecision(
                    confidence_score=0.9,
                    proposed_action=ActionType.ESCALATE_TO_HUMAN,
                    reasoning=f"Found {context.requested_changes_count} changes. Must involve human approval. AI lacks legal authority.",
                    is_safe_to_automate=False
                )

        # Default fallback to human if we aren't highly confident
        return AgentDecision(
            confidence_score=0.4,
            proposed_action=ActionType.ESCALATE_TO_HUMAN,
            reasoning="Current state is ambiguous, escalating to human control.",
            is_safe_to_automate=False
        )
