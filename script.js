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
		this.bookmarkletGenerator = new BookmarkletGenerator({
			legacySupport: false,
			targetBrowser: 'modern'
		});

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

	/**
	 * Toggles legacy browser support mode
	 * @param {boolean} enabled - Whether to enable legacy support
	 */
	setLegacySupport(enabled) {
		this.bookmarkletGenerator.updateOptions({ legacySupport: enabled });

		// Regenerate current bookmarklet if there's code
		const code = this.codeEditor.getValue();
		if (code.trim()) {
			this.generateBookmarklet(code);
		}

		console.log(`Legacy support ${enabled ? 'enabled' : 'disabled'}`);
	}

	/**
	 * Sets the target browser compatibility level
	 * @param {string} target - 'legacy', 'safe', or 'modern'
	 */
	setTargetBrowser(target) {
		this.bookmarkletGenerator.updateOptions({ targetBrowser: target });

		// Regenerate current bookmarklet if there's code
		const code = this.codeEditor.getValue();
		if (code.trim()) {
			this.generateBookmarklet(code);
		}

		console.log(`Target browser set to: ${target}`);
	}

	/**
	 * Gets current generator configuration
	 * @returns {Object} - Current configuration options
	 */
	getGeneratorConfig() {
		return {
			...this.bookmarkletGenerator.options,
			effectiveLimits: this.bookmarkletGenerator.effectiveLimits
		};
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
	constructor(options = {}) {
		// Browser-specific length limits for bookmarklets
		this.LENGTH_LIMITS = {
			// Legacy browser support (IE, old mobile browsers)
			LEGACY_SAFE: 1000,     // Ultra-safe for ancient browsers
			LEGACY_MAX: 2083,      // Internet Explorer absolute limit

			// Modern browser support (Chrome, Firefox, Safari, Edge)
			MODERN_WARNING: 4000,  // Start showing warnings for modern browsers
			MODERN_SAFE: 8192,     // Safe limit for modern browsers
			MODERN_MAX: 65536,     // Theoretical limit (but impractical)

			// Display thresholds
			WARNING_THRESHOLD: 1500 // When to start showing length warnings
		};

		// Configuration options
		this.options = {
			legacySupport: options.legacySupport || false,
			targetBrowser: options.targetBrowser || 'modern', // 'legacy', 'modern'
			...options
		};

		// Set effective limits based on configuration
		this.effectiveLimits = this.calculateEffectiveLimits();
	}

	/**
	 * Calculates effective length limits based on configuration
	 * @returns {Object} - Effective limits for current configuration
	 */
	calculateEffectiveLimits() {
		if (this.options.legacySupport || this.options.targetBrowser === 'legacy') {
			return {
				WARNING: 1200,
				SAFE: 1800,
				MAX: this.LENGTH_LIMITS.LEGACY,
				TARGET: 'legacy browsers (IE, old Safari)'
			};
		}

		if (this.options.targetBrowser === 'safe') {
			return {
				WARNING: this.LENGTH_LIMITS.WARNING,
				SAFE: this.LENGTH_LIMITS.SAFE,
				MAX: this.LENGTH_LIMITS.SAFE + 500,
				TARGET: 'maximum compatibility'
			};
		}

		// Modern browsers (default)
		return {
			WARNING: this.LENGTH_LIMITS.WARNING,
			SAFE: this.LENGTH_LIMITS.SAFE,
			MAX: this.LENGTH_LIMITS.MODERN,
			TARGET: 'modern browsers'
		};
	}

	/**
	 * Updates the generator configuration
	 * @param {Object} newOptions - New configuration options
	 */
	updateOptions(newOptions) {
		this.options = { ...this.options, ...newOptions };
		this.effectiveLimits = this.calculateEffectiveLimits();
	}

	/**
	 * Sets whether to enforce legacy browser compatibility
	 * @param {boolean} enabled - Whether to enable legacy support mode
	 */
	setLegacySupport(enabled) {
		this.legacySupport = Boolean(enabled);
	}

	/**
	 * Gets the current legacy support setting
	 * @returns {boolean} - Whether legacy support is enabled
	 */
	isLegacySupportEnabled() {
		return this.legacySupport;
	}

	/**
	 * Gets the effective length limit based on current settings
	 * @returns {number} - Maximum allowed length
	 */
	getEffectiveLengthLimit() {
		return this.legacySupport ? this.LENGTH_LIMITS.IE_LEGACY : this.LENGTH_LIMITS.MODERN;
	}

	/**
	 * Generates a bookmarklet object from JavaScript code and name
	 * @param {string} code - JavaScript code to convert
	 * @param {string} name - Name for the bookmarklet
	 * @returns {Object} - Bookmarklet object with name, code, url, isValid, and length info
	 */
	generate(code, name) {
		if (!code || typeof code !== 'string') {
			return {
				name: name || 'Custom Bookmarklet',
				code: '',
				url: '',
				isValid: false,
				error: 'No code provided',
				length: 0,
				lengthStatus: 'empty'
			};
		}

		if (!name || typeof name !== 'string') {
			name = 'Custom Bookmarklet';
		}

		try {
			// Create the bookmarklet URL with proper formatting
			const bookmarkletUrl = this.createBookmarkletUrl(code);

			// Validate length and get status
			const lengthInfo = this.validateLength(bookmarkletUrl);

			return {
				name: name.trim(),
				code: code,
				url: bookmarkletUrl,
				isValid: lengthInfo.isValid,
				error: lengthInfo.error,
				length: lengthInfo.length,
				lengthStatus: lengthInfo.status,
				lengthWarning: lengthInfo.warning
			};
		} catch (error) {
			return {
				name: name.trim(),
				code: code,
				url: '',
				isValid: false,
				error: error.message,
				length: 0,
				lengthStatus: 'error'
			};
		}
	}

	/**
	 * Validates the length of a bookmarklet URL against browser limits
	 * @param {string} url - Complete bookmarklet URL to validate
	 * @returns {Object} - Length validation result with status and warnings
	 */
	validateLength(url) {
		const length = url.length;
		const limits = this.effectiveLimits;

		if (length === 0) {
			return {
				length: 0,
				status: 'empty',
				isValid: false,
				error: 'Empty bookmarklet URL',
				warning: null,
				target: limits.TARGET
			};
		}

		if (length > limits.MAX) {
			return {
				length,
				status: 'too_long',
				isValid: false,
				error: `Bookmarklet is too long (${length} characters). Maximum length for ${limits.TARGET} is ${limits.MAX} characters.`,
				warning: null,
				target: limits.TARGET
			};
		}

		if (length > limits.SAFE) {
			return {
				length,
				status: 'long',
				isValid: true,
				error: null,
				warning: `Bookmarklet is ${length} characters long. May not work reliably with ${limits.TARGET}. Consider shortening for better compatibility.`,
				target: limits.TARGET
			};
		}

		if (length > limits.WARNING) {
			return {
				length,
				status: 'warning',
				isValid: true,
				error: null,
				warning: `Bookmarklet is ${length} characters long. Still within safe limits for ${limits.TARGET} but consider keeping it shorter.`,
				target: limits.TARGET
			};
		}

		return {
			length,
			status: 'good',
			isValid: true,
			error: null,
			warning: null,
			target: limits.TARGET
		};
	}

	/**
	 * Gets length status information for display purposes
	 * @param {number} length - Length of the bookmarklet URL
	 * @returns {Object} - Status information with color and message
	 */
	getLengthStatusInfo(length) {
		const limits = this.effectiveLimits;

		if (length === 0) {
			return {
				color: 'gray',
				message: 'No bookmarklet generated',
				target: limits.TARGET
			};
		}

		if (length > limits.MAX) {
			return {
				color: 'red',
				message: `Too long for ${limits.TARGET}`,
				target: limits.TARGET
			};
		}

		if (length > limits.SAFE) {
			return {
				color: 'orange',
				message: `Long - may not work with ${limits.TARGET}`,
				target: limits.TARGET
			};
		}

		if (length > limits.WARNING) {
			return {
				color: 'yellow',
				message: 'Getting long - consider shortening',
				target: limits.TARGET
			};
		}

		return {
			color: 'green',
			message: `Good length for ${limits.TARGET}`,
			target: limits.TARGET
		};
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

	/**
	 * Suggests optimizations to reduce bookmarklet length
	 * @param {string} code - JavaScript code to analyze
	 * @returns {Object} - Optimization suggestions and estimated savings
	 */
	suggestOptimizations(code) {
		if (!code || typeof code !== 'string') {
			return { suggestions: [], estimatedSavings: 0 };
		}

		const suggestions = [];
		let estimatedSavings = 0;

		// Check for common optimization opportunities

		// 1. Long variable names
		const longVarMatches = code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]{8,}\b/g);
		if (longVarMatches && longVarMatches.length > 0) {
			const uniqueLongVars = [...new Set(longVarMatches)];
			const savings = uniqueLongVars.reduce((total, varName) => {
				const occurrences = (code.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
				return total + (varName.length - 1) * occurrences; // Assume shortening to 1 char
			}, 0);

			suggestions.push({
				type: 'variable_names',
				message: `Shorten ${uniqueLongVars.length} long variable name(s)`,
				details: `Variables like: ${uniqueLongVars.slice(0, 3).join(', ')}${uniqueLongVars.length > 3 ? '...' : ''}`,
				savings: savings
			});
			estimatedSavings += savings;
		}

		// 2. Unnecessary whitespace
		const whitespaceCount = (code.match(/\s+/g) || []).join('').length;
		const minifiedWhitespace = code.replace(/\s+/g, ' ').replace(/\s*([{}();,])\s*/g, '$1').length;
		const whitespaceSavings = code.length - minifiedWhitespace;

		if (whitespaceSavings > 10) {
			suggestions.push({
				type: 'whitespace',
				message: 'Remove unnecessary whitespace',
				details: 'Minify spacing around operators and brackets',
				savings: whitespaceSavings
			});
			estimatedSavings += whitespaceSavings;
		}

		// 3. Repeated strings
		const stringMatches = code.match(/"[^"]{4,}"|'[^']{4,}'/g);
		if (stringMatches) {
			const stringCounts = {};
			stringMatches.forEach(str => {
				stringCounts[str] = (stringCounts[str] || 0) + 1;
			});

			const repeatedStrings = Object.entries(stringCounts).filter(([str, count]) => count > 1);
			if (repeatedStrings.length > 0) {
				const savings = repeatedStrings.reduce((total, [str, count]) => {
					return total + (str.length - 1) * (count - 1); // Save by using variable
				}, 0);

				suggestions.push({
					type: 'repeated_strings',
					message: `Extract ${repeatedStrings.length} repeated string(s) to variables`,
					details: `Strings repeated: ${repeatedStrings.map(([str]) => str.substring(0, 20) + '...').join(', ')}`,
					savings: savings
				});
				estimatedSavings += savings;
			}
		}

		// 4. Long method chains
		const chainMatches = code.match(/\.[a-zA-Z_$][a-zA-Z0-9_$]*\.[a-zA-Z_$][a-zA-Z0-9_$]*\.[a-zA-Z_$][a-zA-Z0-9_$]*/g);
		if (chainMatches && chainMatches.length > 0) {
			suggestions.push({
				type: 'method_chains',
				message: 'Consider breaking long method chains',
				details: 'Store intermediate results in short variables',
				savings: Math.min(50, chainMatches.length * 10) // Estimated
			});
			estimatedSavings += Math.min(50, chainMatches.length * 10);
		}

		// 5. Console.log statements (often not needed in bookmarklets)
		const consoleMatches = code.match(/console\.(log|warn|error|info)\([^)]*\);?/g);
		if (consoleMatches && consoleMatches.length > 0) {
			const savings = consoleMatches.reduce((total, match) => total + match.length, 0);
			suggestions.push({
				type: 'console_statements',
				message: `Remove ${consoleMatches.length} console statement(s)`,
				details: 'Console statements are often unnecessary in bookmarklets',
				savings: savings
			});
			estimatedSavings += savings;
		}

		return {
			suggestions: suggestions.sort((a, b) => b.savings - a.savings), // Sort by potential savings
			estimatedSavings,
			currentLength: this.createBookmarkletUrl(code).length
		};
	}
}

// Initialize the application
new BookmarkletApp();
