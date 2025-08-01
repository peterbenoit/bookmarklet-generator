# Bookmarklet Generator

A modern, web-based tool for creating custom bookmarklets from JavaScript code.
Transform your JavaScript snippets into powerful browser bookmarks that can be
executed on any webpage.

🌐 **Live Demo:** [bookmarkletr.vercel.app](https://bookmarkletr.vercel.app)

## Features

- **Real-time Code Editor**: Syntax-highlighted JavaScript editor powered by
  CodeMirror
- **External Library Support**: Load JavaScript and CSS libraries before your
  code executes
- **Instant Preview**: See your bookmarklet generated in real-time as you type
- **Drag & Drop Installation**: Simply drag the generated bookmarklet to your
  bookmarks bar
- **Code Validation**: Built-in syntax checking to catch errors before
  generation
- **Copy to Clipboard**: One-click copying of generated bookmarklet code
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support

## What are Bookmarklets?

Bookmarklets are small JavaScript programs stored as bookmarks in your browser.
When clicked, they execute JavaScript code on the current webpage, allowing you
to:

- Modify page content and styling
- Extract data from websites
- Add new functionality to existing sites
- Automate repetitive tasks
- Debug and inspect web pages

## Quick Start

1. Visit [bookmarkletr.vercel.app](https://bookmarkletr.vercel.app)
2. Enter your JavaScript code in the editor
3. Optionally add external libraries (jQuery, etc.)
4. Give your bookmarklet a name
5. Drag the generated blue link to your bookmarks bar
6. Click the bookmark on any webpage to run your code!

## Example Bookmarklets

### Highlight All Links

```javascript
document.querySelectorAll("a").forEach((link) => {
	link.style.backgroundColor = "yellow";
	link.style.border = "2px solid red";
});
```

### Extract All Images

```javascript
const images = Array.from(document.images);
const urls = images.map((img) => img.src);
console.log("Found images:", urls);
alert(`Found ${images.length} images. Check console for URLs.`);
```

### Dark Mode Toggle

```javascript
if (document.body.style.filter === "invert(1)") {
	document.body.style.filter = "";
} else {
	document.body.style.filter = "invert(1)";
}
```

### Page Word Count

```javascript
const text = document.body.innerText;
const words = text.split(/\s+/).filter((word) => word.length > 0);
alert(`This page contains approximately ${words.length} words.`);
```

## Using External Libraries

The generator supports loading external JavaScript and CSS libraries. Simply add
the URLs in the "External Libraries" field, one per line:

```
https://code.jquery.com/jquery-3.6.0.min.js
https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
```

Your code will execute after all libraries are loaded:

```javascript
// This will work because jQuery is loaded first
$("p").css("color", "red");
```

## Local Development

### Prerequisites

- Node.js 14+ (for running tests)
- Python 3 (for local server)

### Setup

```bash
# Clone the repository
git clone https://github.com/peterbenoit/bookmarklet-generator.git
cd bookmarklet-generator

# Install dependencies (for testing)
npm install

# Start local development server
npm run dev
# or
python3 -m http.server 3000
```

Visit `http://localhost:3000` to see the application.

### Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run start` - Start production server on port 8080
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run deploy` - Deploy to Vercel

## Project Structure

```
bookmarklet-generator/
├── index.html          # Main application page
├── script.js           # Core application logic
├── styles.css          # Application styles
├── package.json        # Project configuration
├── vercel.json         # Vercel deployment config
├── vitest.config.js    # Test configuration
└── test/               # Test files
    ├── bookmarklet-generator.test.js
    ├── output-display.test.js
    ├── validation-engine.test.js
    └── setup.js
```

## Technical Details

### Core Technologies

- **Vanilla JavaScript** - No framework dependencies
- **CodeMirror 5** - Code editor with syntax highlighting
- **CSS Grid & Flexbox** - Modern responsive layout
- **Web APIs** - Clipboard API, DOM manipulation

### Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Key Features Implementation

**Code Validation**: Uses `new Function()` to validate JavaScript syntax before
generation.

**Library Loading**: Implements Promise-based dynamic script and stylesheet
loading with error handling.

**Bookmarklet Generation**: Properly encodes JavaScript code with
`encodeURIComponent()` and wraps in IIFE.

**Accessibility**: Full ARIA labels, keyboard navigation, and screen reader
support.

## Security Considerations

- All user input is properly escaped to prevent XSS
- External libraries are loaded from user-specified URLs (verify sources)
- Generated bookmarklets run in the context of the target page
- No server-side code execution or data storage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major
changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Maintain vanilla JavaScript (no frameworks)
2. Ensure accessibility compliance
3. Add tests for new features
4. Follow existing code style
5. Update documentation as needed

## Testing

The project includes comprehensive tests using Vitest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

The application is deployed on Vercel and automatically deploys from the main
branch.

For manual deployment:

```bash
npm run deploy
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## Acknowledgments

- [CodeMirror](https://codemirror.net/) for the excellent code editor
- [Vercel](https://vercel.com/) for hosting
- The JavaScript community for bookmarklet inspiration

## Support

If you encounter any issues or have questions:

1. Check the
   [Issues](https://github.com/peterbenoit/bookmarklet-generator/issues) page
2. Create a new issue with detailed information
3. Visit the live demo at
   [bookmarkletr.vercel.app](https://bookmarkletr.vercel.app)

---

**Happy bookmarkleting!** 🔖✨
