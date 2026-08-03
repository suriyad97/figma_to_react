"""A generated project with a dangling import must be reported as broken."""
from figma_to_react.api.projects import check_health


def _scaffold(root):
    (root / "package.json").write_text("{}", encoding="utf-8")
    (root / "index.html").write_text("<html></html>", encoding="utf-8")
    (root / "src").mkdir(parents=True, exist_ok=True)
    (root / "src" / "main.jsx").write_text("import App from './App.jsx'", encoding="utf-8")


def test_health_ok_when_imports_resolve(tmp_path):
    _scaffold(tmp_path)
    (tmp_path / "src" / "App.jsx").write_text("export default function App(){}", encoding="utf-8")
    assert check_health(tmp_path)["ok"] is True


def test_health_flags_missing_module(tmp_path):
    _scaffold(tmp_path)
    (tmp_path / "src" / "App.jsx").write_text(
        "import Home from './screens/Home.jsx'\nexport default function App(){}", encoding="utf-8")
    health = check_health(tmp_path)
    assert health["ok"] is False
    assert any("Home.jsx" in m for m in health["missing"])
