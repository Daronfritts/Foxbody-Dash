"""Host-only timing checks; no ECU or pyserial installation required."""
import importlib.util
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
spec = importlib.util.spec_from_file_location("cadence_reader", ROOT / "microsquirt.py")
reader_module = importlib.util.module_from_spec(spec)
with patch.dict(sys.modules, {"serial": types.SimpleNamespace()}):
    spec.loader.exec_module(reader_module)


class ReaderCadenceTest(unittest.TestCase):
    def exercise(self, transfer_time):
        reader = reader_module.MicroSquirtReader()
        clock = [0.0]
        starts, sleeps = [], []
        reader.running = True

        def read():
            starts.append(clock[0])
            clock[0] += transfer_time
            if len(starts) == 3:
                reader.running = False

        def sleep(seconds):
            sleeps.append(seconds)
            clock[0] += seconds

        with patch.object(reader, "read_once", side_effect=read), \
             patch.object(reader, "disconnect"), \
             patch.object(reader_module.time, "monotonic", side_effect=lambda: clock[0]), \
             patch.object(reader_module.time, "sleep", side_effect=sleep):
            reader._run()
        return starts, sleeps

    def test_serial_transfer_counts_toward_twenty_hz_interval(self):
        starts, sleeps = self.exercise(0.018)
        for actual, expected in zip(starts, [0, 0.05, 0.10]):
            self.assertAlmostEqual(actual, expected)
        for seconds in sleeps:
            self.assertAlmostEqual(seconds, 0.032)

    def test_slow_serial_transfer_does_not_add_delay_or_queue_requests(self):
        starts, sleeps = self.exercise(0.080)
        self.assertEqual(sleeps, [])
        for actual, expected in zip(starts, [0, 0.08, 0.16]):
            self.assertAlmostEqual(actual, expected)


if __name__ == "__main__":
    unittest.main()
