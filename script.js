// Bookmarklet Generator Application
// Main application initialization and component management

class BookmarkletApp {
	constructor() {
		this.codeEditor = null;
		this.nameInput = null;
		this.outputDisplay = null;
		this.validationEngine = null;
		this.bookmarkletGenerator = null;

		this.init();
	}

	init() {
		// Wait for DOM to be ready
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
		} else {
			this.initializeComponents();
		}
	}

	initializeComponents() {
		// Initialize core components
		this.validationEngine = new ValidationEngine();
		this.bookmarkletGenerator = new BookmarkletGenerator();

		// Initialize UI components
		this.codeEditor = new CodeEditor('code-editor');
		this.nameInput = new NameInput('bookmarklet-name');
		this.outputDisplay = new OutputDisplay('bookmarklet-output');

		// Set up event handlers
		this.setupEventHandlers();

		console.log('Bookmarklet Generator initialized');
	}

	setupEventHandlers() {
		// Code editor change handler with debouncing
		let debounceTimer;
		this.codeEditor.onCodeChange((code) => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				this.handleCodeChange(code);
			}, 300);
		});

		// Name input change handler
		this.nameInput.onNameChange((name) => {
			this.handleNameChange(name);
		});
	}

	handleCodeChange(code) {
		// Validate code and update display
		const validation = this.validationEngine.validateSyntax(code);

		if (validation.isValid && code.trim()) {
			this.generateBookmarklet(code);
		} else if (validation.errors.length > 0) {
			this.displayErrors(validation.errors);
		} else {
			this.showPlaceholder();
		}
	}

	handleNameChange(name) {
		// Update bookmarklet display with new name
		const code = this.codeEditor.getValue();
		if (code.trim()) {
			this.generateBookmarklet(code);
		}
	}

	generateBookmarklet(code) {
		const name = this.nameInput.getValue() || 'Custom Bookmarklet';
		const bookmarklet = this.bookmarkletGenerator.generate(code, name);

		this.outputDisplay.updateBookmarklet(bookmarklet);
		this.clearErrors();
	}

	displayErrors(errors) {
		const errorDisplay = document.getElementById('error-display');
		const formattedErrors = this.validationEngine.formatErrors(errors);

		errorDisplay.innerHTML = formattedErrors;
		errorDisplay.classList.remove('hidden');

		this.outputDisplay.showError('Fix syntax errors to generate bookmarklet');
	}

	clearErrors() {
		const errorDisplay = document.getElementById('error-display');
		errorDisplay.classList.add('hidden');
		this.outputDisplay.clearError();
	}

	showPlaceholder() {
		this.outputDisplay.showPlaceholder();
		this.clearErrors();
	}
}

// Placeholder classes for components (to be implemented in later tasks)
class CodeEditor {
	constructor(elementId) {
		this.element = document.getElementById(elementId);
		this.changeCallback = null;
	}

	getValue() {
		return this.element.value;
	}

	setValue(code) {
		this.element.value = code;
	}

	onCodeChange(callback) {
		this.changeCallback = callback;
		this.element.addEventListener('input', (e) => {
			if (this.changeCallback) {
				this.changeCallback(e.target.value);
			}
		});
	}
}

class NameInput {
	constructor(elementId) {
		this.element = document.getElementById(elementId);
		this.changeCallback = null;
	}

	getValue() {
		return this.element.value;
	}

	setValue(name) {
		this.element.value = name;
	}

	onNameChange(callback) {
		this.changeCallback = callback;
		this.element.addEventListener('input', (e) => {
			if (this.changeCallback) {
				this.changeCallback(e.target.value);
			}
		});
	}
}

class OutputDisplay {
	constructor(elementId) {
		this.element = document.getElementById(elementId);
	}

	updateBookmarklet(bookmarklet) {
		// Placeholder implementation
		this.element.innerHTML = `<p>Bookmarklet ready: ${bookmarklet.name}</p>`;
	}

	showError(message) {
		this.element.innerHTML = `<p class="error">${message}</p>`;
	}

	clearError() {
		// Will be implemented in later tasks
	}

	showPlaceholder() {
		this.element.innerHTML = '<p class="placeholder">Enter JavaScript code to generate a bookmarklet</p>';
	}
}

class ValidationEngine {
	/**
	 * Validates JavaScript syntax using the Function constructor
	 * @param {string} code - JavaScript code to validate
	 * @returns {Object} - {isValid: boolean, errors: Array}
	 */
	validateSyntax(code) {
		// Return valid for empty code
		if (!code || !code.trim()) {
			return { isValid: true, errors: [] };
		}

		const errors = [];
		let isValid = true;

		try {
			// Wrap code in an immediately invoked function expression
			// This allows for statements and declarations that wouldn't be valid in Function constructor
			const wrappedCode = `(function() { ${code} })`;

			// Use Function constructor to check syntax
			new Function(wrappedCode);
		} catch (error) {
			isValid = false;
			const parsedError = this.parseError(error, code);
			errors.push(parsedError);
		}

		return { isValid, errors };
	}

	/**
	 * Parses JavaScript errors into a structured format
	 * @param {Error} error - The caught error object
	 * @param {string} code - Original code for context
	 * @returns {Object} - Structured error object
	 */
	parseError(error, code) {
		const errorObj = {
			message: error.message,
			type: this.getErrorType(error),
			line: null,
			column: null,
			context: null
		};

		// Try to extract line and column information from error message
		const lineMatch = error.message.match(/line (\d+)/i);
		const columnMatch = error.message.match(/column (\d+)/i);

		if (lineMatch) {
			errorObj.line = parseInt(lineMatch[1], 10);
		}

		if (columnMatch) {
			errorObj.column = parseInt(columnMatch[1], 10);
		}

		// Add context if we have line information
		if (errorObj.line && code) {
			const lines = code.split('\n');
			const lineIndex = errorObj.line - 1;
			if (lineIndex >= 0 && lineIndex < lines.length) {
				errorObj.context = lines[lineIndex].trim();
			}
		}

		// Clean up error message for better user experience
		errorObj.message = this.cleanErrorMessage(error.message);

		return errorObj;
	}

	/**
	 * Determines the type of JavaScript error
	 * @param {Error} error - The error object
	 * @returns {string} - Error type classification
	 */
	getErrorType(error) {
		const message = error.message.toLowerCase();
		const errorName = error.constructor.name.toLowerCase();

		// Check error constructor name first
		if (errorName.includes('syntaxerror') || message.includes('syntax')) {
			return 'syntax';
		} else if (errorName.includes('referenceerror') || message.includes('reference')) {
			return 'reference';
		} else if (errorName.includes('typeerror') || message.includes('type')) {
			return 'type';
		} else if (message.includes('unexpected')) {
			return 'syntax';
		} else {
			return 'general';
		}
	}

	/**
	 * Cleans up error messages for better user readability
	 * @param {string} message - Raw error message
	 * @returns {string} - Cleaned error message
	 */
	cleanErrorMessage(message) {
		// Remove technical details that aren't helpful to users
		let cleaned = message
			.replace(/in function anonymous/gi, '')
			.replace(/at line \d+ column \d+/gi, '')
			.replace(/\s+/g, ' ')
			.trim();

		// Capitalize first letter
		if (cleaned.length > 0) {
			cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
		}

		// Ensure message ends with a period
		if (cleaned && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
			cleaned += '.';
		}

		return cleaned;
	}

	/**
	 * Formats validation errors for display in the UI
	 * @param {Array} errors - Array of error objects
	 * @returns {string} - HTML formatted error messages
	 */
	formatErrors(errors) {
		if (!errors || errors.length === 0) {
			return '';
		}

		return errors.map(error => {
			let errorHtml = `<div class="error-item">`;

			// Error type badge
			errorHtml += `<span class="error-type error-type-${error.type}">${error.type.toUpperCase()}</span>`;

			// Error message
			errorHtml += `<span class="error-message">${this.escapeHtml(error.message)}</span>`;

			// Line and column info if available
			if (error.line) {
				errorHtml += `<span class="error-location">Line ${error.line}`;
				if (error.column) {
					errorHtml += `, Column ${error.column}`;
				}
				errorHtml += `</span>`;
			}

			// Code context if available
			if (error.context) {
				errorHtml += `<div class="error-context"><code>${this.escapeHtml(error.context)}</code></div>`;
			}

			errorHtml += `</div>`;
			return errorHtml;
		}).join('');
	}

	/**
	 * Escapes HTML characters to prevent XSS
	 * @param {string} text - Text to escape
	 * @returns {string} - HTML-escaped text
	 */
	escapeHtml(text) {
		if (typeof text !== 'string') {
			return text;
		}

		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}
}

class BookmarkletGenerator {
	/**
	 * Generates a bookmarklet object from JavaScript code and name
	 * @param {string} code - JavaScript code to convert
	 * @param {string} name - Name for the bookmarklet
	 * @returns {Object} - Bookmarklet object with name, code, url, and isValid properties
	 */
	generate(code, name) {
		if (!code || typeof code !== 'string') {
			return {
				name: name || 'Custom Bookmarklet',
				code: '',
				url: '',
				isValid: false,
				error: 'No code provided'
			};
		}

		if (!name || typeof name !== 'string') {
			name = 'Custom Bookmarklet';
		}

		try {
			// Create the bookmarklet URL with proper formatting
			const bookmarkletUrl = this.createBookmarkletUrl(code);

			return {
				name: name.trim(),
				code: code,
				url: bookmarkletUrl,
				isValid: true,
				error: null
			};
		} catch (error) {
			return {
				name: name.trim(),
				code: code,
				url: '',
				isValid: false,
				error: error.message
			};
		}
	}

	/**
	 * Creates a properly formatted bookmarklet URL from JavaScript code
	 * @param {string} code - JavaScript code to wrap
	 * @returns {string} - Complete bookmarklet URL
	 */
	createBookmarkletUrl(code) {
		// Wrap the code in an immediately invoked function expression (IIFE)
		// This ensures the code runs in its own scope and doesn't pollute the global namespace
		const wrappedCode = `(function(){${code}})();`;

		// Encode the code for URL compatibility
		const encodedCode = this.encodeForURL(wrappedCode);

		// Return the complete bookmarklet URL with javascript: protocol
		return `javascript:${encodedCode}`;
	}

	/**
	 * Encodes JavaScript code for URL compatibility with proper special character handling
	 * @param {string} code - JavaScript code to encode
	 * @returns {string} - URL-encoded JavaScript code
	 */
	encodeForURL(code) {
		// First, handle any existing encoded characters to avoid double-encoding
		let processedCode = code;

		// Use encodeURIComponent for proper URL encoding
		// This handles all special characters including spaces, quotes, etc.
		let encoded = encodeURIComponent(processedCode);

		// Additional processing for bookmarklet-specific requirements
		// Some browsers have issues with certain encoded characters in bookmarklets
		encoded = encoded
			// Replace encoded spaces with actual spaces for better readability
			.replace(/%20/g, ' ')
			// Handle parentheses which are common in JavaScript
			.replace(/%28/g, '(')
			.replace(/%29/g, ')')
			// Handle semicolons
			.replace(/%3B/g, ';')
			// Handle curly braces
			.replace(/%7B/g, '{')
			.replace(/%7D/g, '}')
			// Handle square brackets
			.replace(/%5B/g, '[')
			.replace(/%5D/g, ']')
			// Handle common operators
			.replace(/%3D/g, '=')
			.replace(/%2B/g, '+')
			.replace(/%2D/g, '-')
			.replace(/%2A/g, '*')
			.replace(/%2F/g, '/')
			// Handle dots and commas
			.replace(/%2E/g, '.')
			.replace(/%2C/g, ',');

		return encoded;
	}

	/**
	 * Creates a draggable DOM element for the bookmarklet
	 * @param {Object} bookmarklet - Bookmarklet object with name and url
	 * @returns {HTMLElement} - Draggable anchor element
	 */
	createDraggableLink(bookmarklet) {
		if (!bookmarklet || !bookmarklet.isValid || !bookmarklet.url) {
			return null;
		}

		// Create the anchor element
		const link = document.createElement('a');

		// Set the href to the bookmarklet URL
		link.href = bookmarklet.url;

		// Set the display text to the bookmarklet name
		link.textContent = bookmarklet.name;

		// Add CSS classes for styling
		link.className = 'bookmarklet-link draggable';

		// Add attributes to make it clear this is a bookmarklet
		link.title = `Drag this to your bookmarks bar: ${bookmarklet.name}`;
		link.setAttribute('data-bookmarklet', 'true');

		// Prevent default click behavior to avoid executing the bookmarklet
		// when clicked in the generator interface
		link.addEventListener('click', (e) => {
			e.preventDefault();
			// Optionally show a message about dragging to bookmark bar
			console.log('Drag this link to your bookmark bar to save it');
		});

		return link;
	}

	/**
	 * Validates that a bookmarklet URL is properly formatted
	 * @param {string} url - URL to validate
	 * @returns {boolean} - True if URL is a valid bookmarklet
	 */
	isValidBookmarkletUrl(url) {
		if (!url || typeof url !== 'string') {
			return false;
		}

		// Check if it starts with javascript: protocol
		if (!url.startsWith('javascript:')) {
			return false;
		}

		// Check if there's actual code after the protocol
		const code = url.substring(11); // Remove 'javascript:' prefix
		if (!code || code.trim().length === 0) {
			return false;
		}

		return true;
	}

	/**
	 * Extracts JavaScript code from a bookmarklet URL
	 * @param {string} bookmarkletUrl - Complete bookmarklet URL
	 * @returns {string} - Extracted and decoded JavaScript code
	 */
	extractCodeFromUrl(bookmarkletUrl) {
		if (!this.isValidBookmarkletUrl(bookmarkletUrl)) {
			return '';
		}

		// Remove the javascript: protocol
		const encodedCode = bookmarkletUrl.substring(11);

		try {
			// Decode the URL-encoded code
			const decodedCode = decodeURIComponent(encodedCode);

			// If the code is wrapped in an IIFE, extract the inner code
			const iifePattern = /^\(function\(\)\{(.*)\}\)\(\);?$/s;
			const match = decodedCode.match(iifePattern);

			if (match) {
				return match[1];
			}

			return decodedCode;
		} catch (error) {
			console.error('Error decoding bookmarklet URL:', error);
			return '';
		}
	}
}

// Initialize the application
new BookmarkletApp();
