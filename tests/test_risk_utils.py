import unittest
import sys
import os

# Ensure lib is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../lib')))

from risk_utils import calculate_position_size, validate_risk_parameters

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

if __name__ == '__main__':
    unittest.main()
