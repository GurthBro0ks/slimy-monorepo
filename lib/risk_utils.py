"""
Risk Management Utilities per Phase 8B.2 requirements.
Pure functions only. No external dependencies.
"""

def validate_risk_parameters(risk_pct: float) -> bool:
    """
    Validates if the risk percentage is within acceptable bounds (0.0 to 1.0).
    """
    if not isinstance(risk_pct, (int, float)):
        raise TypeError("Risk percentage must be a number")
    return 0.0 <= risk_pct <= 1.0

def calculate_position_size(balance: float, risk_pct: float) -> float:
    """
    Calculates position size based on balance and risk percentage.
    
    Args:
        balance: Account balance (must be non-negative)
        risk_pct: Risk percentage (0.0 to 1.0)
        
    Returns:
        float: Calculated position size
        
    Raises:
        ValueError: If inputs are invalid
    """
    if balance < 0:
        raise ValueError("Balance cannot be negative")
    
    if not validate_risk_parameters(risk_pct):
        raise ValueError("Risk percentage must be between 0.0 and 1.0")
        
    return balance * risk_pct
