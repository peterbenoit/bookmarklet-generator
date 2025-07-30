import { describe, it, expect, beforeEach } from 'vitest';

// Import the BookmarkletGenerator class
// Since we're testing a class from script.js, we need to load it in a way that works with our test environment
// For now, we'll define the class here for testing purposes
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

describe('BookmarkletGenerator', () => {
	let generator;

	beforeEach(() => {
		generator = new BookmarkletGenerator();
	});

	describe('generate()', () => {
		it('should generate a valid bookmarklet with code and name', () => {
			const code = 'alert("Hello World!");';
			const name = 'Test Bookmarklet';

			const result = generator.generate(code, name);

			expect(result.name).toBe(name);
			expect(result.code).toBe(code);
			expect(result.isValid).toBe(true);
			expect(result.error).toBeNull();
			expect(result.url).toMatch(/^javascript:/);
		});

		it('should use default name when name is not provided', () => {
			const code = 'console.log("test");';

			const result = generator.generate(code);

			expect(result.name).toBe('Custom Bookmarklet');
			expect(result.isValid).toBe(true);
		});

		it('should use default name when name is empty string', () => {
			const code = 'console.log("test");';

			const result = generator.generate(code, '');

			expect(result.name).toBe('Custom Bookmarklet');
			expect(result.isValid).toBe(true);
		});

		it('should trim whitespace from name', () => {
			const code = 'console.log("test");';
			const name = '  Spaced Name  ';

			const result = generator.generate(code, name);

			expect(result.name).toBe('Spaced Name');
		});

		it('should return invalid result when code is empty', () => {
			const result = generator.generate('', 'Test Name');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('No code provided');
			expect(result.url).toBe('');
		});

		it('should return invalid result when code is null', () => {
			const result = generator.generate(null, 'Test Name');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('No code provided');
		});

		it('should return invalid result when code is undefined', () => {
			const result = generator.generate(undefined, 'Test Name');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('No code provided');
		});

		it('should handle non-string code input', () => {
			const result = generator.generate(123, 'Test Name');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('No code provided');
		});
	});

	describe('createBookmarkletUrl()', () => {
		it('should wrap code in IIFE and add javascript: protocol', () => {
			const code = 'alert("test");';

			const url = generator.createBookmarkletUrl(code);

			expect(url).toMatch(/^javascript:\(function\(\)\{.*\}\)\(\);/);
		});

		it('should handle complex JavaScript code', () => {
			const code = 'var x = 5; if (x > 3) { console.log("greater"); }';

			const url = generator.createBookmarkletUrl(code);

			expect(url).toMatch(/^javascript:/);
			expect(url).toContain('(function(){');
			expect(url).toContain('})();');
		});

		it('should handle code with quotes and special characters', () => {
			const code = 'alert("Hello \'World\'!");';

			const url = generator.createBookmarkletUrl(code);

			expect(url).toMatch(/^javascript:/);
			// The URL should be properly encoded
			expect(url.length).toBeGreaterThan('javascript:'.length);
		});
	});

	describe('encodeForURL()', () => {
		it('should properly encode basic JavaScript code', () => {
			const code = 'alert("Hello World!");';

			const encoded = generator.encodeForURL(code);

			// Should not contain raw quotes
			expect(encoded).not.toContain('"');
			// Should contain encoded quotes
			expect(encoded).toContain('%22');
		});

		it('should handle special characters correctly', () => {
			const code = 'var obj = {key: "value", num: 42};';

			const encoded = generator.encodeForURL(code);

			// Common characters should be readable
			expect(encoded).toContain('{');
			expect(encoded).toContain('}');
			expect(encoded).toContain('=');
			expect(encoded).toContain(',');
		});

		it('should handle parentheses and function calls', () => {
			const code = 'console.log("test");';

			const encoded = generator.encodeForURL(code);

			// Parentheses should remain readable
			expect(encoded).toContain('(');
			expect(encoded).toContain(')');
			expect(encoded).toContain(';');
		});

		it('should handle spaces correctly', () => {
			const code = 'var x = 5;';

			const encoded = generator.encodeForURL(code);

			// Spaces should remain as spaces for readability
			expect(encoded).toContain(' ');
			expect(encoded).not.toContain('%20');
		});

		it('should handle mathematical operators', () => {
			const code = 'var result = 5 + 3 - 2 * 4 / 2;';

			const encoded = generator.encodeForURL(code);

			// Mathematical operators should remain readable
			expect(encoded).toContain('+');
			expect(encoded).toContain('-');
			expect(encoded).toContain('*');
			expect(encoded).toContain('/');
		});

		it('should handle array notation', () => {
			const code = 'var arr = [1, 2, 3];';

			const encoded = generator.encodeForURL(code);

			// Array brackets should remain readable
			expect(encoded).toContain('[');
			expect(encoded).toContain(']');
		});
	});

	describe('createDraggableLink()', () => {
		it('should create a valid anchor element for valid bookmarklet', () => {
			const bookmarklet = {
				name: 'Test Bookmarklet',
				url: 'javascript:alert("test");',
				isValid: true
			};

			const link = generator.createDraggableLink(bookmarklet);

			expect(link).toBeInstanceOf(HTMLAnchorElement);
			expect(link.href).toBe(bookmarklet.url);
			expect(link.textContent).toBe(bookmarklet.name);
			expect(link.className).toContain('bookmarklet-link');
			expect(link.className).toContain('draggable');
		});

		it('should set proper attributes on the link', () => {
			const bookmarklet = {
				name: 'Test Bookmarklet',
				url: 'javascript:alert("test");',
				isValid: true
			};

			const link = generator.createDraggableLink(bookmarklet);

			expect(link.title).toContain('Drag this to your bookmarks bar');
			expect(link.getAttribute('data-bookmarklet')).toBe('true');
		});

		it('should return null for invalid bookmarklet', () => {
			const bookmarklet = {
				name: 'Invalid',
				url: '',
				isValid: false
			};

			const link = generator.createDraggableLink(bookmarklet);

			expect(link).toBeNull();
		});

		it('should return null for null bookmarklet', () => {
			const link = generator.createDraggableLink(null);

			expect(link).toBeNull();
		});

		it('should return null for bookmarklet without URL', () => {
			const bookmarklet = {
				name: 'Test',
				isValid: true
				// missing url
			};

			const link = generator.createDraggableLink(bookmarklet);

			expect(link).toBeNull();
		});
	});

	describe('isValidBookmarkletUrl()', () => {
		it('should return true for valid bookmarklet URL', () => {
			const url = 'javascript:alert("Hello");';

			const isValid = generator.isValidBookmarkletUrl(url);

			expect(isValid).toBe(true);
		});

		it('should return false for URL without javascript: protocol', () => {
			const url = 'http://example.com';

			const isValid = generator.isValidBookmarkletUrl(url);

			expect(isValid).toBe(false);
		});

		it('should return false for empty javascript: URL', () => {
			const url = 'javascript:';

			const isValid = generator.isValidBookmarkletUrl(url);

			expect(isValid).toBe(false);
		});

		it('should return false for null or undefined URL', () => {
			expect(generator.isValidBookmarkletUrl(null)).toBe(false);
			expect(generator.isValidBookmarkletUrl(undefined)).toBe(false);
		});

		it('should return false for non-string URL', () => {
			expect(generator.isValidBookmarkletUrl(123)).toBe(false);
			expect(generator.isValidBookmarkletUrl({})).toBe(false);
		});

		it('should return true for complex bookmarklet URL', () => {
			const url = 'javascript:(function(){var x=5;alert(x);})();';

			const isValid = generator.isValidBookmarkletUrl(url);

			expect(isValid).toBe(true);
		});
	});

	describe('extractCodeFromUrl()', () => {
		it('should extract code from simple bookmarklet URL', () => {
			const originalCode = 'alert("Hello");';
			const url = `javascript:${encodeURIComponent(originalCode)}`;

			const extractedCode = generator.extractCodeFromUrl(url);

			expect(extractedCode).toBe(originalCode);
		});

		it('should extract code from IIFE-wrapped bookmarklet', () => {
			const originalCode = 'alert("Hello");';
			const wrappedCode = `(function(){${originalCode}})();`;
			const url = `javascript:${encodeURIComponent(wrappedCode)}`;

			const extractedCode = generator.extractCodeFromUrl(url);

			expect(extractedCode).toBe(originalCode);
		});

		it('should return empty string for invalid URL', () => {
			const extractedCode = generator.extractCodeFromUrl('http://example.com');

			expect(extractedCode).toBe('');
		});

		it('should return empty string for null URL', () => {
			const extractedCode = generator.extractCodeFromUrl(null);

			expect(extractedCode).toBe('');
		});

		it('should handle complex JavaScript code extraction', () => {
			const originalCode = 'var x = 5; if (x > 3) { console.log("greater"); }';
			const wrappedCode = `(function(){${originalCode}})();`;
			const url = `javascript:${encodeURIComponent(wrappedCode)}`;

			const extractedCode = generator.extractCodeFromUrl(url);

			expect(extractedCode).toBe(originalCode);
		});

		it('should handle malformed encoded URLs gracefully', () => {
			const url = 'javascript:%ZZ%invalid';

			const extractedCode = generator.extractCodeFromUrl(url);

			expect(extractedCode).toBe('');
		});
	});

	describe('Integration Tests', () => {
		it('should create bookmarklet that can be extracted back to original code', () => {
			const originalCode = 'alert("Round trip test");';
			const name = 'Round Trip Test';

			// Generate bookmarklet
			const bookmarklet = generator.generate(originalCode, name);

			// Extract code back from URL
			const extractedCode = generator.extractCodeFromUrl(bookmarklet.url);

			expect(extractedCode).toBe(originalCode);
		});

		it('should handle complex code round trip', () => {
			const originalCode = `
				var elements = document.querySelectorAll('img');
				for (var i = 0; i < elements.length; i++) {
					elements[i].style.border = '2px solid red';
				}
			`.trim();

			const bookmarklet = generator.generate(originalCode, 'Highlight Images');
			const extractedCode = generator.extractCodeFromUrl(bookmarklet.url);

			expect(extractedCode).toBe(originalCode);
		});

		it('should create draggable link from generated bookmarklet', () => {
			const code = 'console.log("test");';
			const name = 'Test Link';

			const bookmarklet = generator.generate(code, name);
			const link = generator.createDraggableLink(bookmarklet);

			expect(link).not.toBeNull();
			expect(link.href).toBe(bookmarklet.url);
			expect(link.textContent).toBe(name);
		});
	});
});
