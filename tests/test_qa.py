"""Verification maths: SSIM behaves sanely and coverage metrics are correct."""
import io

from PIL import Image

from figma_to_react.qa.engine import compute_metrics, ssim_score


def _png(color, size=(120, 200)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()


def test_ssim_identical_images_scores_high():
    img = _png((30, 90, 200))
    score, height_ratio = ssim_score(img, img)
    assert score > 0.99
    assert height_ratio == 1.0


def test_ssim_reports_height_ratio_for_shorter_page():
    design = _png((255, 255, 255), (120, 400))
    app = _png((255, 255, 255), (120, 200))
    _, height_ratio = ssim_score(design, app)
    assert 0.4 < height_ratio < 0.6


def test_compute_metrics_counts_missing_screens(tmp_path):
    (tmp_path / "src" / "screens").mkdir(parents=True)
    (tmp_path / "src" / "screens" / "Home.jsx").write_text("export default function Home(){}", encoding="utf-8")

    figma_screens = [{"name": "Home"}, {"name": "About"}]
    written = ["src/screens/Home.jsx"]
    m = compute_metrics(figma_screens, [], written, tmp_path)

    assert m["screens"]["recall"] == 0.5
    assert m["screens"]["missedFigmaScreens"] == ["About"]
    assert m["screens"]["precision"] == 1.0
