# PI-11 Test Document: Additional Markdown Symbols

This test document contains various markdown elements to verify PI-11 implementation.

## Code Blocks

### JavaScript Example

Here's a JavaScript code block:

```javascript
function greet(name) {
    console.log(`Hello, ${name}!`);
    return true;
}

// This # is not a heading
greet("World");
```

### Python Example

```python
def greet(name):
    # This comment has a hash, but it's not a heading
    print(f"Hello, {name}!")
    return True

greet("World")
```

### Bash Example

```bash
# This is a bash comment
echo "Installing dependencies..."
npm install
npm run build
```

## Quote Blocks

### Simple Quote

> This is a simple quote block that spans a single line.

### Multi-line Quote

> This is the first line of a multi-line quote.
> This is the second line.
> And this is the third line of the quote.

### Nested Quote

> Level 1 quote
>> Level 2 nested quote
> Back to level 1

## Images

### Inline Images

![Logo](images/logo.png)

![Screenshot of the application](screenshots/app-screenshot.png)

### Image Without Alt Text

![](diagram.svg)

## Mixed Content

### Code with Explanation

Here's how to use the function:

```typescript
const result = processData(input);
console.log(result);
```

> **Note**: Make sure to handle errors properly!

![Result visualization](images/result.png)

### Quick Reference

| Feature | Status |
|---------|--------|
| Headings | ✅ |
| Code Blocks | ✅ |
| Quotes | ✅ |
| Images | ✅ |

## Conclusion

This document tests all the PI-11 additional symbols:
- Code blocks with various languages
- Quote blocks (single and multi-line)
- Images (with and without alt text)

The outline should show all these elements nested under their respective headings.
