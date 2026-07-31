import re
import sys

with open(r'd:\Apex\apex\src\app\modules\organization\components\create-organization\create-organization.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace input heights
content = content.replace('h-14', 'h-11')

# Replace padding and margins
content = content.replace('p-10', 'p-6')
content = content.replace('gap-y-6 mt-6', 'gap-y-4 mt-4')
content = content.replace('mb-8', 'mb-5')
content = content.replace('pb-28', 'pb-6')
content = content.replace('py-10', 'py-6')

# Remove min height constraint that forces scroll
content = content.replace('min-h-[400px]', '')

# Move sticky footer to be a static footer inside the card
# The sticky footer starts at <!-- Sticky Action Footer -->
footer_pattern = re.compile(r'<!-- Sticky Action Footer -->\s*<div\s*class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 z-\[100\] shadow-\[0_-4px_24px_rgba\(0,0,0,0\.02\)\]">\s*<div class="max-w-5xl mx-auto flex items-center justify-between px-4 lg:px-0">(.*?)</div>\s*</div>', re.DOTALL)

def footer_replacement(match):
    inner_buttons = match.group(1)
    return f'''
          <!-- Action Footer inside form -->
          <div class="bg-gray-50 border-t border-gray-100 p-4 flex items-center justify-between px-6">
            {inner_buttons}
          </div>
'''

content = footer_pattern.sub(footer_replacement, content)

# Remove the footer from outside the form, wait the regex already matched it.
# Now insert the new footer inside the form, just before </form>
if '<!-- Action Footer inside form -->' in content:
    # We need to move it inside the form
    # The regex replaced the outer footer. Let's find the newly replaced footer and move it.
    footer_block = re.search(r'          <!-- Action Footer inside form -->.*?\s*</div>\s*', content, re.DOTALL)
    if footer_block:
        footer_str = footer_block.group(0)
        content = content.replace(footer_str, '')
        content = content.replace('</form>', footer_str + '</form>')

with open(r'd:\Apex\apex\src\app\modules\organization\components\create-organization\create-organization.html', 'w', encoding='utf-8') as f:
    f.write(content)
