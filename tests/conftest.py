import json
from pathlib import Path

import pytest

FIXTURES = Path(__file__).resolve().parents[1] / "data" / "fixtures"


@pytest.fixture
def sample_design():
    return json.loads((FIXTURES / "sample_design.json").read_text(encoding="utf-8"))
