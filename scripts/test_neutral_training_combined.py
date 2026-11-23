"""Run the existing training matrix against combined.html, including entry UI.
XP remains fixture-injected; this is not earned-XP or old-save acceptance.
Build with scripts/build_combined_preview.py before running.
"""
import ast
from pathlib import Path

SOURCE = Path(__file__).with_name('test_neutral_training_browser.py')

def enter_release(page):
    entry = page.locator('#pa-entry')
    if entry.count() != 1:
        raise AssertionError('Expected the combined release entry screen')
    if entry.is_visible():
        page.locator('#pa-enter').click()
        if entry.is_visible():
            raise AssertionError('Release entry did not close')

class ReleaseTarget(ast.NodeTransformer):
    def __init__(self):
        self.targets = 0
        self.navigations = 0

    def visit_Constant(self, node):
        if node.value == '/arms-hero.html':
            self.targets += 1
            return ast.copy_location(ast.Constant('/combined.html'), node)
        if node.value == 'test-results/neutral-training-browser':
            return ast.copy_location(ast.Constant('test-results/neutral-training-combined'), node)
        return node

    def visit_Expr(self, node):
        node = self.generic_visit(node)
        call = node.value
        if (isinstance(call, ast.Call) and isinstance(call.func, ast.Attribute)
                and isinstance(call.func.value, ast.Name)
                and call.func.value.id == 'page'
                and call.func.attr in ('goto', 'reload')):
            self.navigations += 1
            check = ast.Expr(ast.Call(func=ast.Name(id='enter_release', ctx=ast.Load()),
                                     args=[ast.Name(id='page', ctx=ast.Load())], keywords=[]))
            return [node, ast.copy_location(check, node)]
        return node

def main():
    if not Path('preview/combined.html').is_file():
        raise SystemExit('Build preview/combined.html first')
    transformer = ReleaseTarget()
    tree = transformer.visit(ast.parse(SOURCE.read_text(encoding='utf-8'), filename=str(SOURCE)))
    if transformer.targets != 1 or transformer.navigations != 3:
        raise SystemExit('Training harness changed: review release adapter before running')
    ast.fix_missing_locations(tree)
    scope = {'__name__': '__main__', '__file__': str(SOURCE), 'enter_release': enter_release}
    exec(compile(tree, str(SOURCE), 'exec'), scope)

if __name__ == '__main__':
    main()
