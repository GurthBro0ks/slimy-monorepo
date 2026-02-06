"""
Risk Management Utilities per Phase 8B.2 requirements.
Pure functions only. No external dependencies (stdlib math/random only).

Implements:
  - Kelly Criterion (full + fractional)
  - Value at Risk (VaR) via historical & parametric methods
  - Monte Carlo simulation for portfolio/strategy ROI projection
  - Position sizing with configurable risk models

Target: $1k+ yearly ROI on Polymarket-style binary prediction markets.
"""

import math
import random

# ---------------------------------------------------------------------------
# Core validators
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Kelly Criterion
# ---------------------------------------------------------------------------

def kelly_fraction(win_prob: float, win_mult: float, loss_mult: float = 1.0) -> float:
    """
    Full Kelly Criterion for binary outcomes.

    f* = (p * b - q) / b

    where:
        p   = probability of winning
        q   = 1 - p  (probability of losing)
        b   = net odds (win_mult / loss_mult)

    Args:
        win_prob:  Probability of a winning trade (0 < p < 1)
        win_mult:  Multiplier on a win  (e.g. 1.0 means +100 %)
        loss_mult: Multiplier on a loss (e.g. 1.0 means lose entire stake)

    Returns:
        Optimal fraction of bankroll to wager (can be negative = no edge).
    """
    if not (0.0 < win_prob < 1.0):
        raise ValueError("win_prob must be between 0 and 1 (exclusive)")
    if win_mult <= 0:
        raise ValueError("win_mult must be positive")
    if loss_mult <= 0:
        raise ValueError("loss_mult must be positive")

    b = win_mult / loss_mult
    q = 1.0 - win_prob
    return (win_prob * b - q) / b


def half_kelly(win_prob: float, win_mult: float, loss_mult: float = 1.0) -> float:
    """
    Half-Kelly sizing — a common risk-averse variant.

    Returns max(0, kelly_fraction / 2).
    """
    f = kelly_fraction(win_prob, win_mult, loss_mult)
    return max(0.0, f / 2.0)


def fractional_kelly(
    win_prob: float,
    win_mult: float,
    loss_mult: float = 1.0,
    fraction: float = 0.25,
) -> float:
    """
    General fractional Kelly.

    Args:
        fraction: Fraction of Kelly to use (0.25 = quarter-Kelly).
                  Must be in (0, 1].

    Returns:
        max(0, kelly_fraction * fraction)
    """
    if not (0.0 < fraction <= 1.0):
        raise ValueError("fraction must be in (0, 1]")
    f = kelly_fraction(win_prob, win_mult, loss_mult)
    return max(0.0, f * fraction)


# ---------------------------------------------------------------------------
# Value at Risk (VaR)
# ---------------------------------------------------------------------------

def parametric_var(
    mean_return: float,
    std_return: float,
    confidence: float = 0.95,
    portfolio_value: float = 1000.0,
) -> float:
    """
    Parametric (Gaussian) Value at Risk.

    VaR = portfolio_value * (mean - z * std)

    Uses the inverse-normal approximation (Beasley-Springer-Moro).

    Args:
        mean_return: Expected daily/periodic return (e.g. 0.002 = 0.2 %)
        std_return:  Standard deviation of returns
        confidence:  Confidence level (e.g. 0.95, 0.99)
        portfolio_value: Current portfolio value in dollars

    Returns:
        Dollar VaR (positive number = potential loss).
    """
    if not (0.0 < confidence < 1.0):
        raise ValueError("confidence must be between 0 and 1 (exclusive)")
    if std_return < 0:
        raise ValueError("std_return must be non-negative")
    if portfolio_value < 0:
        raise ValueError("portfolio_value must be non-negative")

    z = _norm_ppf(confidence)
    var_pct = -(mean_return - z * std_return)
    return max(0.0, portfolio_value * var_pct)


def historical_var(returns: list, confidence: float = 0.95) -> float:
    """
    Historical VaR from a list of past returns.

    Sorts returns and picks the percentile loss.

    Args:
        returns:    List of periodic returns (e.g. daily P&L percentages).
        confidence: Confidence level (e.g. 0.95).

    Returns:
        VaR as a positive number (magnitude of loss at the given percentile).
    """
    if not returns:
        raise ValueError("returns list must not be empty")
    if not (0.0 < confidence < 1.0):
        raise ValueError("confidence must be between 0 and 1 (exclusive)")

    sorted_returns = sorted(returns)
    index = int(math.floor((1.0 - confidence) * len(sorted_returns)))
    index = max(0, min(index, len(sorted_returns) - 1))
    return -sorted_returns[index] if sorted_returns[index] < 0 else 0.0


def conditional_var(returns: list, confidence: float = 0.95) -> float:
    """
    Conditional VaR (Expected Shortfall / CVaR).

    Average of losses beyond the VaR threshold.

    Args:
        returns:    List of periodic returns.
        confidence: Confidence level.

    Returns:
        CVaR as a positive number.
    """
    if not returns:
        raise ValueError("returns list must not be empty")
    if not (0.0 < confidence < 1.0):
        raise ValueError("confidence must be between 0 and 1 (exclusive)")

    sorted_returns = sorted(returns)
    cutoff = int(math.floor((1.0 - confidence) * len(sorted_returns)))
    cutoff = max(1, cutoff)
    tail = sorted_returns[:cutoff]
    avg_tail = sum(tail) / len(tail)
    return -avg_tail if avg_tail < 0 else 0.0


# ---------------------------------------------------------------------------
# Monte Carlo Simulation
# ---------------------------------------------------------------------------

def monte_carlo_equity(
    initial_balance: float,
    win_prob: float,
    win_mult: float,
    loss_mult: float,
    bet_fraction: float,
    num_trades: int,
    num_simulations: int = 1000,
    seed: int | None = None,
) -> dict:
    """
    Monte Carlo simulation of equity curves for a binary betting strategy.

    Each simulation runs *num_trades* sequential bets, each risking
    *bet_fraction* of current equity.

    Args:
        initial_balance:  Starting bankroll ($).
        win_prob:         Probability of each trade winning.
        win_mult:         Return multiplier on a win (1.0 = double your stake).
        loss_mult:        Fraction of stake lost on a loss (1.0 = full loss).
        bet_fraction:     Fraction of equity wagered each trade.
        num_trades:       Number of trades per simulation.
        num_simulations:  Number of Monte Carlo paths.
        seed:             Optional RNG seed for reproducibility.

    Returns:
        dict with keys:
            mean_final:      Mean ending equity across all paths.
            median_final:    Median ending equity.
            p5_final:        5th percentile (worst-case).
            p95_final:       95th percentile (best-case).
            mean_roi:        Mean ROI = (mean_final - initial) / initial.
            median_roi:      Median ROI.
            ruin_probability: Fraction of paths where equity drops below 1 % of initial.
            paths_positive:  Fraction of paths that end above initial balance.
    """
    if initial_balance <= 0:
        raise ValueError("initial_balance must be positive")
    if not (0.0 < win_prob < 1.0):
        raise ValueError("win_prob must be between 0 and 1 (exclusive)")
    if win_mult <= 0:
        raise ValueError("win_mult must be positive")
    if loss_mult <= 0:
        raise ValueError("loss_mult must be positive")
    if not (0.0 < bet_fraction <= 1.0):
        raise ValueError("bet_fraction must be in (0, 1]")
    if num_trades < 1:
        raise ValueError("num_trades must be >= 1")
    if num_simulations < 1:
        raise ValueError("num_simulations must be >= 1")

    rng = random.Random(seed)
    finals = []
    ruin_threshold = initial_balance * 0.01

    for _ in range(num_simulations):
        equity = initial_balance
        for _ in range(num_trades):
            if equity <= ruin_threshold:
                break
            stake = equity * bet_fraction
            if rng.random() < win_prob:
                equity += stake * win_mult
            else:
                equity -= stake * loss_mult
        finals.append(equity)

    finals.sort()
    n = len(finals)
    mean_final = sum(finals) / n
    median_final = finals[n // 2]
    p5_final = finals[max(0, int(n * 0.05))]
    p95_final = finals[min(n - 1, int(n * 0.95))]
    ruin_count = sum(1 for f in finals if f <= ruin_threshold)
    positive_count = sum(1 for f in finals if f > initial_balance)

    return {
        "mean_final": round(mean_final, 2),
        "median_final": round(median_final, 2),
        "p5_final": round(p5_final, 2),
        "p95_final": round(p95_final, 2),
        "mean_roi": round((mean_final - initial_balance) / initial_balance, 4),
        "median_roi": round((median_final - initial_balance) / initial_balance, 4),
        "ruin_probability": round(ruin_count / n, 4),
        "paths_positive": round(positive_count / n, 4),
    }


def project_yearly_roi(
    initial_balance: float,
    win_prob: float,
    avg_odds: float,
    trades_per_week: int = 10,
    kelly_fraction_pct: float = 0.25,
    weeks: int = 52,
    num_simulations: int = 2000,
    seed: int | None = None,
) -> dict:
    """
    Project annualized ROI for a Polymarket-style prediction market strategy.

    Wraps monte_carlo_equity with sensible defaults for binary markets.

    The Polymarket payout structure:
      - You buy a contract at price p (e.g. 0.60 for 60-cent contract).
      - If correct, you receive $1.00 → profit = (1.0 - p) / p per dollar risked.
      - If wrong, you lose your stake → loss_mult = 1.0.

    Args:
        initial_balance:    Starting bankroll.
        win_prob:           Your estimated true probability of winning.
        avg_odds:           Average market price you buy at (e.g. 0.55).
        trades_per_week:    Average number of trades per week.
        kelly_fraction_pct: Fraction of Kelly to bet (default 0.25 = quarter-Kelly).
        weeks:              Number of weeks to simulate (default 52 = 1 year).
        num_simulations:    Number of Monte Carlo paths.
        seed:               Optional RNG seed.

    Returns:
        dict with projected stats (see monte_carlo_equity) plus kelly_bet_pct.
    """
    if not (0.0 < avg_odds < 1.0):
        raise ValueError("avg_odds must be between 0 and 1 (the contract price)")

    # Polymarket win multiplier: profit per dollar risked
    win_mult = (1.0 - avg_odds) / avg_odds
    loss_mult = 1.0

    # Compute Kelly fraction for this edge
    kf = fractional_kelly(win_prob, win_mult, loss_mult, kelly_fraction_pct)
    # Clamp to sensible max (never bet more than 15% per trade)
    bet_fraction = min(kf, 0.15)
    # Ensure minimum if there is a positive edge
    if kf > 0 and bet_fraction < 0.005:
        bet_fraction = 0.005

    total_trades = trades_per_week * weeks

    result = monte_carlo_equity(
        initial_balance=initial_balance,
        win_prob=win_prob,
        win_mult=win_mult,
        loss_mult=loss_mult,
        bet_fraction=bet_fraction,
        num_trades=total_trades,
        num_simulations=num_simulations,
        seed=seed,
    )

    result["kelly_bet_pct"] = round(bet_fraction * 100, 2)
    result["total_trades"] = total_trades
    result["edge_pct"] = round((win_prob - avg_odds) * 100, 2)

    return result


# ---------------------------------------------------------------------------
# Optimal strategy finder
# ---------------------------------------------------------------------------

def find_optimal_strategy(
    initial_balance: float = 500.0,
    target_roi_dollars: float = 1000.0,
    win_prob_range: tuple = (0.55, 0.70),
    odds_range: tuple = (0.45, 0.60),
    step: float = 0.05,
    seed: int = 42,
) -> list:
    """
    Sweep parameter space to find strategies meeting the $1k+ ROI target.

    Returns a list of dicts sorted by median_roi (descending), each containing
    the parameter combination and projected stats.
    """
    results = []
    wp = win_prob_range[0]
    while wp <= win_prob_range[1] + 1e-9:
        odds = odds_range[0]
        while odds <= odds_range[1] + 1e-9:
            if wp <= odds:
                odds += step
                continue
            try:
                proj = project_yearly_roi(
                    initial_balance=initial_balance,
                    win_prob=wp,
                    avg_odds=odds,
                    trades_per_week=10,
                    kelly_fraction_pct=0.25,
                    weeks=52,
                    num_simulations=500,
                    seed=seed,
                )
                dollar_roi = proj["median_final"] - initial_balance
                results.append({
                    "win_prob": round(wp, 2),
                    "avg_odds": round(odds, 2),
                    "edge_pct": proj["edge_pct"],
                    "kelly_bet_pct": proj["kelly_bet_pct"],
                    "median_final": proj["median_final"],
                    "mean_final": proj["mean_final"],
                    "dollar_roi": round(dollar_roi, 2),
                    "median_roi": proj["median_roi"],
                    "ruin_probability": proj["ruin_probability"],
                    "meets_target": dollar_roi >= target_roi_dollars,
                })
            except ValueError:
                pass
            odds += step
        wp += step

    results.sort(key=lambda x: x["median_roi"], reverse=True)
    return results


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _norm_ppf(p: float) -> float:
    """
    Approximate inverse normal CDF (percent-point function).
    Uses the rational approximation from Abramowitz & Stegun (26.2.23)
    for 0.5 < p < 1.  Accurate to ~4.5e-4.
    """
    if p <= 0.0 or p >= 1.0:
        raise ValueError("p must be in (0, 1)")

    if p < 0.5:
        return -_norm_ppf(1.0 - p)

    # Coefficients
    t = math.sqrt(-2.0 * math.log(1.0 - p))
    c0 = 2.515517
    c1 = 0.802853
    c2 = 0.010328
    d1 = 1.432788
    d2 = 0.189269
    d3 = 0.001308

    return t - (c0 + c1 * t + c2 * t * t) / (1.0 + d1 * t + d2 * t * t + d3 * t * t * t)
