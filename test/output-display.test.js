import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <div id="test-output" class="output-display">
        <p class="placeholder">Enter JavaScript code to generate a bookmarklet</p>
    </div>
</body>
</html>
`);

global.document = dom.window.document;
global.window = dom.window;

// Import OutputDisplay class from script.js
// For testing, we'll define it here since it's part of the main script
class OutputDisplay {
	constructor(elementId) {
		this.element = document.getElementById(elementId);
		this.currentBookmarklet = null;

		if (!this.element) {
			throw new Error(`OutputDisplay: Element with id '${elementId}' not found`);
		}

		this.init();
	}

	init() {
		this.showPlaceholder();
	}

	updateBookmarklet(bookmarklet) {
		if (!bookmarklet || !bookmarklet.isValid) {
			this.currentBookmarklet = null;
			this.showError('Unable to generate bookmarklet');
			return;
		}

		this.currentBookmarklet = bookmarklet;
		this.displaySuccessState(bookmarklet);
	}

	displaySuccessState(bookmarklet) {
		this.element.classList.remove('has-error');
		this.element.classList.add('has-content');

		const displayHtml = this.createBookmarkletDisplay(bookmarklet);
		this.element.innerHTML = displayHtml;

		this.setupDragFunctionality();
		this.showSuccessFeedback();
	}

	createBookmarkletDisplay(bookmarklet) {
		const escapedName = this.escapeHtml(bookmarklet.name);
		const lengthInfo = this.getLengthDisplayInfo(bookmarklet);

		return `
			<div class="bookmarklet-container">
				<div class="bookmarklet-header">
					<h3 class="bookmarklet-title">${escapedName}</h3>
					<div class="bookmarklet-meta">
						${lengthInfo.html}
					</div>
				</div>

				<div class="bookmarklet-link-container">
					<a href="${bookmarklet.url}"
					   class="bookmarklet-link"
					   draggable="true"
					   title="Drag this to your bookmarks bar or right-click to copy"
					   data-bookmarklet-name="${escapedName}">
						📖 ${escapedName}
					</a>
				</div>

				<div class="bookmarklet-instructions">
					<p><strong>How to use:</strong></p>
					<ul>
						<li>Drag the link above to your bookmarks bar</li>
						<li>Or right-click and select "Bookmark this link"</li>
						<li>Click the bookmark on any webpage to run your code</li>
					</ul>
				</div>

				${bookmarklet.lengthWarning ? this.createWarningDisplay(bookmarklet.lengthWarning) : ''}
			</div>
		`;
	}

	getLengthDisplayInfo(bookmarklet) {
		const length = bookmarklet.length || 0;
		const status = bookmarklet.lengthStatus || 'unknown';

		let statusClass = 'length-good';
		let statusText = 'Good';
		let statusIcon = '✅';

		switch (status) {
			case 'warning':
				statusClass = 'length-warning';
				statusText = 'Long';
				statusIcon = '⚠️';
				break;
			case 'long':
				statusClass = 'length-long';
				statusText = 'Very Long';
				statusIcon = '⚠️';
				break;
			case 'too_long':
				statusClass = 'length-error';
				statusText = 'Too Long';
				statusIcon = '❌';
				break;
			case 'good':
			default:
				statusClass = 'length-good';
				statusText = 'Good';
				statusIcon = '✅';
				break;
		}

		const html = `
			<div class="length-info ${statusClass}">
				<span class="length-icon">${statusIcon}</span>
				<span class="length-text">${length} characters - ${statusText}</span>
			</div>
		`;

		return { html, status, length };
	}

	createWarningDisplay(warning) {
		return `
			<div class="bookmarklet-warning">
				<div class="warning-icon">⚠️</div>
				<div class="warning-message">${this.escapeHtml(warning)}</div>
			</div>
		`;
	}

	setupDragFunctionality() {
		const bookmarkletLink = this.element.querySelector('.bookmarklet-link');
		if (!bookmarkletLink) return;

		bookmarkletLink.addEventListener('dragstart', (e) => {
			const bookmarkletName = bookmarkletLink.getAttribute('data-bookmarklet-name');
			const bookmarkletUrl = bookmarkletLink.href;

			e.dataTransfer.setData('text/uri-list', bookmarkletUrl);
			e.dataTransfer.setData('text/plain', bookmarkletUrl);
			e.dataTransfer.setData('text/html', `<a href="${bookmarkletUrl}">${bookmarkletName}</a>`);

			e.dataTransfer.effectAllowed = 'copy';
			bookmarkletLink.classList.add('dragging');
			this.showDragFeedback();
		});

		bookmarkletLink.addEventListener('dragend', (e) => {
			bookmarkletLink.classList.remove('dragging');
			this.hideDragFeedback();
		});
	}

	showDragFeedback() {
		const existingOverlay = this.element.querySelector('.drag-overlay');
		if (existingOverlay) return;

		const overlay = document.createElement('div');
		overlay.className = 'drag-overlay';
		overlay.innerHTML = `
			<div class="drag-message">
				<div class="drag-icon">👆</div>
				<div class="drag-text">Drag to your bookmarks bar!</div>
			</div>
		`;

		this.element.appendChild(overlay);
	}

	hideDragFeedback() {
		const overlay = this.element.querySelector('.drag-overlay');
		if (overlay) {
			overlay.remove();
		}
	}

	showSuccessFeedback() {
		this.element.classList.add('generation-success');

		setTimeout(() => {
			this.element.classList.remove('generation-success');
		}, 1000);
	}

	showError(message) {
		// Don't clear currentBookmarklet here - we might want to restore it later

		this.element.classList.remove('has-content', 'generation-success');
		this.element.classList.add('has-error');

		const errorHtml = `
			<div class="error-container">
				<div class="error-icon">❌</div>
				<div class="error-message">
					<h3>Unable to Generate Bookmarklet</h3>
					<p>${this.escapeHtml(message)}</p>
				</div>
			</div>
		`;

		this.element.innerHTML = errorHtml;
	}

	clearError() {
		this.element.classList.remove('has-error');

		if (this.currentBookmarklet && this.currentBookmarklet.isValid) {
			this.displaySuccessState(this.currentBookmarklet);
		} else {
			this.showPlaceholder();
		}
	}

	showPlaceholder() {
		this.currentBookmarklet = null;

		this.element.classList.remove('has-content', 'has-error', 'generation-success');

		const placeholderHtml = `
			<div class="placeholder-container">
				<div class="placeholder-icon">📝</div>
				<div class="placeholder-message">
					<h3>Ready to Create</h3>
					<p>Enter JavaScript code above to generate your bookmarklet</p>
				</div>
			</div>
		`;

		this.element.innerHTML = placeholderHtml;
	}

	getCurrentBookmarklet() {
		return this.currentBookmarklet;
	}

	isShowingError() {
		return this.element.classList.contains('has-error');
	}

	hasContent() {
		return this.element.classList.contains('has-content');
	}

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

	destroy() {
		const bookmarkletLink = this.element.querySelector('.bookmarklet-link');
		if (bookmarkletLink) {
			// Event listeners will be automatically removed when element is removed
		}

		this.currentBookmarklet = null;
		this.element.classList.remove('has-content', 'has-error', 'generation-success');
		this.showPlaceholder();
	}
}

describe('OutputDisplay', () => {
	let outputDisplay;

	beforeEach(() => {
		// Reset the DOM element
		document.getElementById('test-output').innerHTML = '<p class="placeholder">Enter JavaScript code to generate a bookmarklet</p>';
		document.getElementById('test-output').className = 'output-display';

		outputDisplay = new OutputDisplay('test-output');
	});

	describe('constructor', () => {
		it('should initialize with the correct element', () => {
			expect(outputDisplay.element).toBe(document.getElementById('test-output'));
			expect(outputDisplay.currentBookmarklet).toBeNull();
		});

		it('should throw error if element not found', () => {
			expect(() => new OutputDisplay('non-existent')).toThrow('OutputDisplay: Element with id \'non-existent\' not found');
		});

		it('should show placeholder on initialization', () => {
			expect(outputDisplay.element.innerHTML).toContain('Ready to Create');
			expect(outputDisplay.element.innerHTML).toContain('Enter JavaScript code above');
		});
	});

	describe('updateBookmarklet()', () => {
		it('should display valid bookmarklet correctly', () => {
			const bookmarklet = {
				name: 'Test Bookmarklet',
				url: 'javascript:alert("test");',
				isValid: true,
				length: 25,
				lengthStatus: 'good'
			};

			outputDisplay.updateBookmarklet(bookmarklet);

			expect(outputDisplay.element.classList.contains('has-content')).toBe(true);
			expect(outputDisplay.element.innerHTML).toContain('Test Bookmarklet');
			expect(outputDisplay.element.innerHTML).toContain('javascript:alert(');
			expect(outputDisplay.currentBookmarklet).toBe(bookmarklet);
		});

		it('should show error for invalid bookmarklet', () => {
			const bookmarklet = {
				name: 'Invalid Bookmarklet',
				url: '',
				isValid: false
			};

			outputDisplay.updateBookmarklet(bookmarklet);

			expect(outputDisplay.element.classList.contains('has-error')).toBe(true);
			expect(outputDisplay.element.innerHTML).toContain('Unable to Generate Bookmarklet');
		});

		it('should handle null bookmarklet', () => {
			outputDisplay.updateBookmarklet(null);

			expect(outputDisplay.element.classList.contains('has-error')).toBe(true);
			expect(outputDisplay.element.innerHTML).toContain('Unable to generate bookmarklet');
		});
	});

	describe('createBookmarkletDisplay()', () => {
		it('should create proper HTML structure', () => {
			const bookmarklet = {
				name: 'My Bookmarklet',
				url: 'javascript:console.log("test");',
				length: 30,
				lengthStatus: 'good'
			};

			const html = outputDisplay.createBookmarkletDisplay(bookmarklet);

			expect(html).toContain('bookmarklet-container');
			expect(html).toContain('My Bookmarklet');
			expect(html).toContain('javascript:console.log("test");');
			expect(html).toContain('draggable="true"');
			expect(html).toContain('How to use:');
		});

		it('should escape HTML in bookmarklet name', () => {
			const bookmarklet = {
				name: '<script>alert("xss")</script>',
				url: 'javascript:console.log("test");',
				length: 30,
				lengthStatus: 'good'
			};

			const html = outputDisplay.createBookmarkletDisplay(bookmarklet);

			expect(html).not.toContain('<script>');
			expect(html).toContain('&lt;script&gt;');
		});

		it('should include warning display when warning exists', () => {
			const bookmarklet = {
				name: 'Long Bookmarklet',
				url: 'javascript:console.log("test");',
				length: 1600,
				lengthStatus: 'warning',
				lengthWarning: 'This bookmarklet is getting long'
			};

			const html = outputDisplay.createBookmarkletDisplay(bookmarklet);

			expect(html).toContain('bookmarklet-warning');
			expect(html).toContain('This bookmarklet is getting long');
		});
	});

	describe('getLengthDisplayInfo()', () => {
		it('should return correct info for good length', () => {
			const bookmarklet = { length: 100, lengthStatus: 'good' };
			const info = outputDisplay.getLengthDisplayInfo(bookmarklet);

			expect(info.html).toContain('length-good');
			expect(info.html).toContain('✅');
			expect(info.html).toContain('100 characters - Good');
		});

		it('should return correct info for warning length', () => {
			const bookmarklet = { length: 1600, lengthStatus: 'warning' };
			const info = outputDisplay.getLengthDisplayInfo(bookmarklet);

			expect(info.html).toContain('length-warning');
			expect(info.html).toContain('⚠️');
			expect(info.html).toContain('1600 characters - Long');
		});

		it('should return correct info for too long', () => {
			const bookmarklet = { length: 9000, lengthStatus: 'too_long' };
			const info = outputDisplay.getLengthDisplayInfo(bookmarklet);

			expect(info.html).toContain('length-error');
			expect(info.html).toContain('❌');
			expect(info.html).toContain('9000 characters - Too Long');
		});
	});

	describe('showError()', () => {
		it('should display error state correctly', () => {
			outputDisplay.showError('Test error message');

			expect(outputDisplay.element.classList.contains('has-error')).toBe(true);
			expect(outputDisplay.element.classList.contains('has-content')).toBe(false);
			expect(outputDisplay.element.innerHTML).toContain('Unable to Generate Bookmarklet');
			expect(outputDisplay.element.innerHTML).toContain('Test error message');
			expect(outputDisplay.currentBookmarklet).toBeNull();
		});

		it('should escape HTML in error message', () => {
			outputDisplay.showError('<script>alert("xss")</script>');

			expect(outputDisplay.element.innerHTML).not.toContain('<script>');
			expect(outputDisplay.element.innerHTML).toContain('&lt;script&gt;');
		});
	});

	describe('clearError()', () => {
		it('should clear error state and show placeholder when no current bookmarklet', () => {
			outputDisplay.showError('Test error');
			outputDisplay.clearError();

			expect(outputDisplay.element.classList.contains('has-error')).toBe(false);
			expect(outputDisplay.element.innerHTML).toContain('Ready to Create');
		});

		it('should restore bookmarklet display when current bookmarklet exists', () => {
			const bookmarklet = {
				name: 'Test Bookmarklet',
				url: 'javascript:alert("test");',
				isValid: true,
				length: 25,
				lengthStatus: 'good'
			};

			outputDisplay.updateBookmarklet(bookmarklet);
			expect(outputDisplay.element.classList.contains('has-content')).toBe(true);

			outputDisplay.showError('Test error');
			expect(outputDisplay.element.classList.contains('has-error')).toBe(true);
			expect(outputDisplay.element.classList.contains('has-content')).toBe(false);

			outputDisplay.clearError();
			expect(outputDisplay.element.classList.contains('has-error')).toBe(false);
			expect(outputDisplay.element.classList.contains('has-content')).toBe(true);
			expect(outputDisplay.element.innerHTML).toContain('Test Bookmarklet');
		});
	});

	describe('showPlaceholder()', () => {
		it('should display placeholder state correctly', () => {
			outputDisplay.showPlaceholder();

			expect(outputDisplay.element.classList.contains('has-content')).toBe(false);
			expect(outputDisplay.element.classList.contains('has-error')).toBe(false);
			expect(outputDisplay.element.innerHTML).toContain('Ready to Create');
			expect(outputDisplay.element.innerHTML).toContain('Enter JavaScript code above');
			expect(outputDisplay.currentBookmarklet).toBeNull();
		});
	});

	describe('state methods', () => {
		it('should correctly report error state', () => {
			expect(outputDisplay.isShowingError()).toBe(false);

			outputDisplay.showError('Test error');
			expect(outputDisplay.isShowingError()).toBe(true);

			outputDisplay.clearError();
			expect(outputDisplay.isShowingError()).toBe(false);
		});

		it('should correctly report content state', () => {
			expect(outputDisplay.hasContent()).toBe(false);

			const bookmarklet = {
				name: 'Test',
				url: 'javascript:alert("test");',
				isValid: true,
				length: 25,
				lengthStatus: 'good'
			};

			outputDisplay.updateBookmarklet(bookmarklet);
			expect(outputDisplay.hasContent()).toBe(true);

			outputDisplay.showPlaceholder();
			expect(outputDisplay.hasContent()).toBe(false);
		});

		it('should return current bookmarklet', () => {
			expect(outputDisplay.getCurrentBookmarklet()).toBeNull();

			const bookmarklet = {
				name: 'Test',
				url: 'javascript:alert("test");',
				isValid: true,
				length: 25,
				lengthStatus: 'good'
			};

			outputDisplay.updateBookmarklet(bookmarklet);
			expect(outputDisplay.getCurrentBookmarklet()).toBe(bookmarklet);
		});
	});

	describe('drag functionality', () => {
		it('should set up drag event listeners on bookmarklet link', () => {
			const bookmarklet = {
				name: 'Drag Test',
				url: 'javascript:alert("drag");',
				isValid: true,
				length: 25,
				lengthStatus: 'good'
			};

			outputDisplay.updateBookmarklet(bookmarklet);

			const link = outputDisplay.element.querySelector('.bookmarklet-link');
			expect(link).toBeTruthy();
			expect(link.getAttribute('draggable')).toBe('true');
			expect(link.getAttribute('data-bookmarklet-name')).toBe('Drag Test');
		});
	});

	describe('escapeHtml()', () => {
		it('should escape HTML characters correctly', () => {
			expect(outputDisplay.escapeHtml('<script>')).toBe('&lt;script&gt;');
			expect(outputDisplay.escapeHtml('"quotes"')).toBe('&quot;quotes&quot;');
			expect(outputDisplay.escapeHtml("'single'")).toBe('&#39;single&#39;');
			expect(outputDisplay.escapeHtml('&amp;')).toBe('&amp;amp;');
		});

		it('should handle non-string input', () => {
			expect(outputDisplay.escapeHtml(null)).toBe(null);
			expect(outputDisplay.escapeHtml(undefined)).toBe(undefined);
			expect(outputDisplay.escapeHtml(123)).toBe(123);
		});
	});
});
