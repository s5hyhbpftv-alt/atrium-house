"""Regressions for the deployed first frame, before portfolio JavaScript runs."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'build-github-pages.py'
spec = importlib.util.spec_from_file_location('pages', SCRIPT)
pages = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pages)
BASE = '/atrium-house/'


class ResponsiveImagesTest(unittest.TestCase):
    def test_static_first_frame_includes_large_candidate(self):
        html = (SCRIPT.parent.parent / 'sheerwood-site/doma/index.html').read_text()
        built = pages.rewrite_urls(html, BASE)
        self.assertIn('srcset="/atrium-house/images/portfolio/sosnovy-dvor/view-1-small.webp 960w, /atrium-house/images/portfolio/sosnovy-dvor/view-1.webp 1920w"', built)

    def test_all_candidates_and_preloads_are_rewritten(self):
        html = '''<img srcset="/small.webp 480w,/medium.webp 960w,
          /large.webp 1920w"><link imagesrcset='/one.webp 1x, /two.webp 2x'>'''
        built = pages.rewrite_urls(html, BASE)
        for name in ('small', 'medium', 'large', 'one', 'two'):
            self.assertIn(f'/atrium-house/{name}.webp', built)
        self.assertEqual(built, pages.rewrite_urls(built, BASE))

    def test_external_relative_and_data_urls_are_preserved(self):
        html = '<img srcset="data:image/png;base64,/abc 1x, //cdn.test/a.webp 2x, https://cdn.test/b.webp 3x, local.webp 4x">'
        self.assertEqual(html, pages.rewrite_urls(html, BASE))

    def test_validator_catches_broken_second_candidate(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            current = output / 'index.html'
            (output / 'small.webp').touch()
            validator = pages.Links(current, output, BASE)
            validator.feed('<img src="/atrium-house/small.webp" srcset="/atrium-house/small.webp 480w, /large.webp 1920w">')
            self.assertEqual(len(validator.errors), 1)
            self.assertIn('outside project path /large.webp', validator.errors[0])

    def test_validator_checks_preload_candidates_exist(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            validator = pages.Links(output / 'index.html', output, BASE)
            validator.feed('<link imagesrcset="/atrium-house/missing.webp 1x">')
            self.assertEqual(len(validator.errors), 1)
            self.assertIn('missing /atrium-house/missing.webp', validator.errors[0])


if __name__ == '__main__':
    unittest.main()
