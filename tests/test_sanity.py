import unittest

class TestSanity(unittest.TestCase):
    def test_truth(self):
        """Always passes to prove runner is working"""
        self.assertTrue(True)

    def test_math_sanity(self):
        """Sanity check for basic math"""
        self.assertEqual(2 + 2, 4)

if __name__ == '__main__':
    unittest.main()
