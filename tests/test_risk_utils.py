import unittest
import sys
import os

# Ensure lib is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../lib')))

from risk_utils import (
    calculate_position_size,
    validate_risk_parameters,
    kelly_fraction,
    half_kelly,
    fractional_kelly,
    parametric_var,
    historical_var,
    conditional_var,
    monte_carlo_equity,
    project_yearly_roi,
    find_optimal_strategy,
)


class TestRiskUtils(unittest.TestCase):
    def test_validate_risk_parameters_valid(self):
        """Test valid risk parameters"""
        self.assertTrue(validate_risk_parameters(0.1))
        self.assertTrue(validate_risk_parameters(0.0))
        self.assertTrue(validate_risk_parameters(1.0))

    def test_validate_risk_parameters_invalid(self):
        """Test invalid risk parameters"""
        self.assertFalse(validate_risk_parameters(-0.1))
        self.assertFalse(validate_risk_parameters(1.1))
        self.assertFalse(validate_risk_parameters(50.0))

    def test_validate_risk_parameters_type_error(self):
        """Test invalid type for risk parameters"""
        with self.assertRaises(TypeError):
            validate_risk_parameters("0.1")

    def test_calculate_position_size_nomimal(self):
        """Test nominal position size calculation"""
        self.assertEqual(calculate_position_size(1000.0, 0.1), 100.0)
        self.assertEqual(calculate_position_size(100.0, 0.5), 50.0)

    def test_calculate_position_size_zero_balance(self):
        """Test calculation with zero balance"""
        self.assertEqual(calculate_position_size(0.0, 0.1), 0.0)

    def test_calculate_position_size_negative_balance(self):
        """Test calculation with negative balance raises error"""
        with self.assertRaises(ValueError):
            calculate_position_size(-100.0, 0.1)

    def test_calculate_position_size_invalid_risk(self):
        """Test calculation with invalid risk raises error"""
        with self.assertRaises(ValueError):
            calculate_position_size(1000.0, 1.1)


class TestKellyCriterion(unittest.TestCase):
    def test_kelly_fair_coin_even_odds(self):
        """50/50 bet with even odds should yield zero edge"""
        f = kelly_fraction(0.5, 1.0, 1.0)
        self.assertAlmostEqual(f, 0.0, places=10)

    def test_kelly_positive_edge(self):
        """60% win rate with even odds → positive Kelly"""
        f = kelly_fraction(0.6, 1.0, 1.0)
        # f* = (0.6*1 - 0.4)/1 = 0.2
        self.assertAlmostEqual(f, 0.2, places=10)

    def test_kelly_negative_edge(self):
        """40% win rate with even odds → negative Kelly (no bet)"""
        f = kelly_fraction(0.4, 1.0, 1.0)
        self.assertLess(f, 0.0)

    def test_kelly_asymmetric_payoff(self):
        """55% win, 2:1 payout → significant edge"""
        f = kelly_fraction(0.55, 2.0, 1.0)
        # f* = (0.55*2 - 0.45)/2 = (1.1 - 0.45)/2 = 0.325
        self.assertAlmostEqual(f, 0.325, places=10)

    def test_kelly_invalid_prob(self):
        """Boundary probabilities should raise"""
        with self.assertRaises(ValueError):
            kelly_fraction(0.0, 1.0)
        with self.assertRaises(ValueError):
            kelly_fraction(1.0, 1.0)

    def test_kelly_invalid_mult(self):
        """Non-positive multipliers should raise"""
        with self.assertRaises(ValueError):
            kelly_fraction(0.5, 0.0)
        with self.assertRaises(ValueError):
            kelly_fraction(0.5, 1.0, 0.0)

    def test_half_kelly(self):
        """Half-Kelly should be half of full Kelly (clamped to 0)"""
        hk = half_kelly(0.6, 1.0)
        self.assertAlmostEqual(hk, 0.1, places=10)

    def test_half_kelly_no_edge(self):
        """Half-Kelly with no edge returns 0"""
        hk = half_kelly(0.4, 1.0)
        self.assertEqual(hk, 0.0)

    def test_fractional_kelly_quarter(self):
        """Quarter-Kelly check"""
        fk = fractional_kelly(0.6, 1.0, 1.0, 0.25)
        # full kelly = 0.2, quarter = 0.05
        self.assertAlmostEqual(fk, 0.05, places=10)

    def test_fractional_kelly_full(self):
        """Fractional Kelly with fraction=1.0 equals full Kelly"""
        fk = fractional_kelly(0.6, 1.0, 1.0, 1.0)
        self.assertAlmostEqual(fk, 0.2, places=10)

    def test_fractional_kelly_invalid_fraction(self):
        """Invalid fraction values should raise"""
        with self.assertRaises(ValueError):
            fractional_kelly(0.6, 1.0, 1.0, 0.0)
        with self.assertRaises(ValueError):
            fractional_kelly(0.6, 1.0, 1.0, 1.5)


class TestValueAtRisk(unittest.TestCase):
    def test_parametric_var_basic(self):
        """Parametric VaR with known inputs"""
        var = parametric_var(
            mean_return=0.001,
            std_return=0.02,
            confidence=0.95,
            portfolio_value=10000.0,
        )
        self.assertGreater(var, 0)
        # At 95% confidence with 2% std, VaR should be meaningful
        self.assertLess(var, 10000.0)

    def test_parametric_var_zero_std(self):
        """Zero volatility → VaR depends on mean"""
        var = parametric_var(
            mean_return=0.01,
            std_return=0.0,
            confidence=0.95,
            portfolio_value=1000.0,
        )
        # With positive mean and zero vol, loss is unlikely
        self.assertEqual(var, 0.0)

    def test_parametric_var_invalid_confidence(self):
        with self.assertRaises(ValueError):
            parametric_var(0.001, 0.02, confidence=0.0)
        with self.assertRaises(ValueError):
            parametric_var(0.001, 0.02, confidence=1.0)

    def test_historical_var_basic(self):
        """Historical VaR from a known loss distribution"""
        # 20 returns: 5% of 20 = 1 data point at index floor(0.05*20)=1
        # sorted[0]=-0.10, sorted[1]=-0.05 → VaR at index 1 = 0.05
        returns = [-0.10, -0.05, -0.03, -0.02, -0.01,
                   0.0, 0.01, 0.01, 0.02, 0.02,
                   0.03, 0.03, 0.04, 0.04, 0.05,
                   0.05, 0.06, 0.07, 0.08, 0.10]
        var = historical_var(returns, confidence=0.95)
        self.assertAlmostEqual(var, 0.05, places=2)

    def test_historical_var_all_positive(self):
        """All positive returns → VaR = 0"""
        returns = [0.01, 0.02, 0.03, 0.04, 0.05]
        var = historical_var(returns, confidence=0.95)
        self.assertEqual(var, 0.0)

    def test_historical_var_empty(self):
        with self.assertRaises(ValueError):
            historical_var([], confidence=0.95)

    def test_conditional_var_basic(self):
        """CVaR should be >= VaR"""
        returns = [-0.10, -0.08, -0.05, -0.03, -0.01,
                   0.0, 0.01, 0.02, 0.03, 0.04,
                   0.05, 0.06, 0.07, 0.08, 0.09,
                   0.10, 0.11, 0.12, 0.13, 0.15]
        var = historical_var(returns, confidence=0.95)
        cvar = conditional_var(returns, confidence=0.95)
        self.assertGreaterEqual(cvar, var)

    def test_conditional_var_empty(self):
        with self.assertRaises(ValueError):
            conditional_var([], confidence=0.95)


class TestMonteCarlo(unittest.TestCase):
    def test_monte_carlo_deterministic(self):
        """Same seed should produce identical results"""
        r1 = monte_carlo_equity(1000, 0.55, 1.0, 1.0, 0.05, 100, 100, seed=42)
        r2 = monte_carlo_equity(1000, 0.55, 1.0, 1.0, 0.05, 100, 100, seed=42)
        self.assertEqual(r1["mean_final"], r2["mean_final"])
        self.assertEqual(r1["median_final"], r2["median_final"])

    def test_monte_carlo_positive_edge_grows(self):
        """Strong positive edge should grow equity on average"""
        result = monte_carlo_equity(
            initial_balance=1000,
            win_prob=0.6,
            win_mult=1.0,
            loss_mult=1.0,
            bet_fraction=0.05,
            num_trades=200,
            num_simulations=500,
            seed=42,
        )
        self.assertGreater(result["mean_final"], 1000)
        self.assertGreater(result["mean_roi"], 0)
        self.assertGreater(result["paths_positive"], 0.5)

    def test_monte_carlo_no_edge_flat(self):
        """No edge should roughly preserve capital (with some variance)"""
        result = monte_carlo_equity(
            initial_balance=1000,
            win_prob=0.5,
            win_mult=1.0,
            loss_mult=1.0,
            bet_fraction=0.02,
            num_trades=100,
            num_simulations=500,
            seed=42,
        )
        # With no edge, should stay roughly around initial
        self.assertAlmostEqual(result["mean_final"], 1000, delta=200)

    def test_monte_carlo_output_keys(self):
        """Verify all expected output keys are present"""
        result = monte_carlo_equity(1000, 0.55, 1.0, 1.0, 0.05, 50, 50, seed=1)
        expected_keys = [
            "mean_final", "median_final", "p5_final", "p95_final",
            "mean_roi", "median_roi", "ruin_probability", "paths_positive",
        ]
        for key in expected_keys:
            self.assertIn(key, result)

    def test_monte_carlo_validation(self):
        """Invalid inputs should raise ValueError"""
        with self.assertRaises(ValueError):
            monte_carlo_equity(-1, 0.5, 1.0, 1.0, 0.05, 10)
        with self.assertRaises(ValueError):
            monte_carlo_equity(1000, 0.0, 1.0, 1.0, 0.05, 10)
        with self.assertRaises(ValueError):
            monte_carlo_equity(1000, 0.5, 1.0, 1.0, 0.0, 10)
        with self.assertRaises(ValueError):
            monte_carlo_equity(1000, 0.5, 1.0, 1.0, 0.05, 0)


class TestProjectYearlyROI(unittest.TestCase):
    def test_yearly_roi_positive_edge(self):
        """Strategy with meaningful edge should project positive ROI"""
        result = project_yearly_roi(
            initial_balance=500,
            win_prob=0.60,
            avg_odds=0.50,
            trades_per_week=10,
            kelly_fraction_pct=0.25,
            weeks=52,
            num_simulations=500,
            seed=42,
        )
        self.assertGreater(result["mean_roi"], 0)
        self.assertIn("kelly_bet_pct", result)
        self.assertIn("total_trades", result)
        self.assertIn("edge_pct", result)
        self.assertEqual(result["total_trades"], 520)
        self.assertAlmostEqual(result["edge_pct"], 10.0, places=1)

    def test_yearly_roi_invalid_odds(self):
        with self.assertRaises(ValueError):
            project_yearly_roi(500, 0.6, 0.0)
        with self.assertRaises(ValueError):
            project_yearly_roi(500, 0.6, 1.0)

    def test_yearly_roi_1k_target(self):
        """Verify a strong-edge strategy can reach $1k+ ROI from $500"""
        result = project_yearly_roi(
            initial_balance=500,
            win_prob=0.65,
            avg_odds=0.50,
            trades_per_week=12,
            kelly_fraction_pct=0.25,
            weeks=52,
            num_simulations=1000,
            seed=42,
        )
        # With 65% win rate at 50-cent contracts and quarter-Kelly,
        # median should clear $1500 (=$1k ROI) over a year
        self.assertGreater(result["median_final"], 1000,
                           f"Median final ${result['median_final']} below $1000 target")


class TestFindOptimalStrategy(unittest.TestCase):
    def test_find_optimal_returns_results(self):
        """Should return a non-empty list of strategies"""
        results = find_optimal_strategy(
            initial_balance=500,
            target_roi_dollars=1000,
            win_prob_range=(0.55, 0.65),
            odds_range=(0.45, 0.55),
            step=0.10,
            seed=42,
        )
        self.assertIsInstance(results, list)
        self.assertGreater(len(results), 0)

    def test_find_optimal_sorted_by_roi(self):
        """Results should be sorted by median_roi descending"""
        results = find_optimal_strategy(
            initial_balance=500,
            target_roi_dollars=1000,
            win_prob_range=(0.55, 0.65),
            odds_range=(0.45, 0.55),
            step=0.10,
            seed=42,
        )
        for i in range(len(results) - 1):
            self.assertGreaterEqual(results[i]["median_roi"], results[i + 1]["median_roi"])

    def test_find_optimal_has_target_flag(self):
        """Each result should have meets_target boolean"""
        results = find_optimal_strategy(
            initial_balance=500,
            target_roi_dollars=1000,
            win_prob_range=(0.60, 0.65),
            odds_range=(0.45, 0.50),
            step=0.05,
            seed=42,
        )
        for r in results:
            self.assertIn("meets_target", r)
            self.assertIsInstance(r["meets_target"], bool)


if __name__ == '__main__':
    unittest.main()
