"""
Explainer Agent
Provides explanations for AI decisions
"""

class ExplainerAgent:
    def explain_deal(self, deal, score):
        """Explain why something is a deal"""
        # TODO: Generate human-readable explanation
        return f"This is a deal because the price is {score*100}% below average."
    
    def explain_recommendation(self, recommendation, factors):
        """Explain why something was recommended"""
        # TODO: Generate explanation based on factors
        return "Recommended based on your preferences."

