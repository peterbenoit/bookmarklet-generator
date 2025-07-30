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
		// Update bookmarklet display with new name in real-time
		const code = this.codeEditor.getValue();
		if (code.trim()) {
			// Regenerate bookmarklet with new name
			this.generateBookmarklet(code);
		} else {
			// Even without code, we can show the name change in the placeholder
			this.showPlaceholder();
		}
	}

	generateBookmarklet(code) {
		const name = this.nameInput.getEffectiveName();
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

/**
 * CodeEditor class provides enhanced code editing functionality with error display
 * and real-time validation for JavaScript code input using a textarea-based approach.
 */
class CodeEditor {
	constructor(elementId) {
		this.element = document.getElementById(elementId);
		this.changeCallback = null;
		this.debounceTimer = null;
		this.debounceDelay = 300; // 300ms debounce as specified
		this.currentErrors = [];

		if (!this.element) {
			throw new Error(`CodeEditor: Element with id '${elementId}' not found`);
		}

		this.init();
	}

	/**
	 * Initialize the code editor with enhanced functionality
	 */
	init() {
		// Set up event listeners
		this.setupEventListeners();

		// Apply initial styling
		this.applyEditorStyling();
	}

	/**
	 * Sets up event listeners for the code editor
	 */
	setupEventListeners() {
		// Input event with debouncing for real-time validation
		this.element.addEventListener('input', (e) => {
			this.handleCodeChange(e.target.value);
		});

		// Additional events for better UX
		this.element.addEventListener('paste', (e) => {
			// Handle paste with slight delay to get the pasted content
			setTimeout(() => {
				this.handleCodeChange(this.element.value);
			}, 10);
		});

		// Handle tab key for proper indentation
		this.element.addEventListener('keydown', (e) => {
			this.handleKeyDown(e);
		});
	}

	/**
	 * Applies enhanced styling to the editor
	 */
	applyEditorStyling() {
		// Add enhanced editor class
		this.element.classList.add('enhanced-code-editor');

		// Set monospace font and other code-specific styles
		this.element.style.fontFamily = "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace";
		this.element.style.fontSize = '14px';
		this.element.style.lineHeight = '1.5';
		this.element.style.tabSize = '2';
	}

	/**
	 * Handles code changes with debouncing
	 * @param {string} code - The current code content
	 */
	handleCodeChange(code) {
		// Clear existing debounce timer
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		// Set up new debounced callback
		this.debounceTimer = setTimeout(() => {
			if (this.changeCallback) {
				this.changeCallback(code);
			}
		}, this.debounceDelay);
	}

	/**
	 * Handles special key combinations for better code editing
	 * @param {KeyboardEvent} e - The keyboard event
	 */
	handleKeyDown(e) {
		// Handle Tab key for indentation
		if (e.key === 'Tab') {
			e.preventDefault();

			const start = this.element.selectionStart;
			const end = this.element.selectionEnd;
			const value = this.element.value;

			if (e.shiftKey) {
				// Shift+Tab: Remove indentation
				this.handleUnindent(start, end, value);
			} else {
				// Tab: Add indentation
				this.handleIndent(start, end, value);
			}
		}

		// Handle Enter key for auto-indentation
		else if (e.key === 'Enter') {
			this.handleAutoIndent(e);
		}
	}

	/**
	 * Handles tab indentation
	 * @param {number} start - Selection start position
	 * @param {number} end - Selection end position
	 * @param {string} value - Current textarea value
	 */
	handleIndent(start, end, value) {
		const indent = '  '; // 2 spaces

		if (start === end) {
			// No selection: insert tab at cursor
			this.element.value = value.substring(0, start) + indent + value.substring(end);
			this.element.selectionStart = this.element.selectionEnd = start + indent.length;
		} else {
			// Selection: indent all selected lines
			const beforeSelection = value.substring(0, start);
			const selectedText = value.substring(start, end);
			const afterSelection = value.substring(end);

			const indentedText = selectedText.split('\n').map(line => indent + line).join('\n');

			this.element.value = beforeSelection + indentedText + afterSelection;
			this.element.selectionStart = start;
			this.element.selectionEnd = start + indentedText.length;
		}

		// Trigger change event
		this.element.dispatchEvent(new Event('input', { bubbles: true }));
	}

	/**
	 * Handles shift+tab unindentation
	 * @param {number} start - Selection start position
	 * @param {number} end - Selection end position
	 * @param {string} value - Current textarea value
	 */
	handleUnindent(start, end, value) {
		const indent = '  '; // 2 spaces

		if (start === end) {
			// No selection: remove indentation at cursor line
			const lineStart = value.lastIndexOf('\n', start - 1) + 1;
			const lineEnd = value.indexOf('\n', start);
			const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
			const line = value.substring(lineStart, actualLineEnd);

			if (line.startsWith(indent)) {
				const newLine = line.substring(indent.length);
				this.element.value = value.substring(0, lineStart) + newLine + value.substring(actualLineEnd);
				this.element.selectionStart = this.element.selectionEnd = Math.max(lineStart, start - indent.length);
			}
		} else {
			// Selection: unindent all selected lines
			const beforeSelection = value.substring(0, start);
			const selectedText = value.substring(start, end);
			const afterSelection = value.substring(end);

			const unindentedText = selectedText.split('\n').map(line => {
				return line.startsWith(indent) ? line.substring(indent.length) : line;
			}).join('\n');

			this.element.value = beforeSelection + unindentedText + afterSelection;
			this.element.selectionStart = start;
			this.element.selectionEnd = start + unindentedText.length;
		}

		// Trigger change event
		this.element.dispatchEvent(new Event('input', { bubbles: true }));
	}

	/**
	 * Handles auto-indentation on Enter key
	 * @param {KeyboardEvent} e - The keyboard event
	 */
	handleAutoIndent(e) {
		const start = this.element.selectionStart;
		const value = this.element.value;

		// Find the current line
		const lineStart = value.lastIndexOf('\n', start - 1) + 1;
		const currentLine = value.substring(lineStart, start);

		// Calculate current indentation
		const indentMatch = currentLine.match(/^(\s*)/);
		const currentIndent = indentMatch ? indentMatch[1] : '';

		// Check if we need extra indentation (after opening braces)
		const needsExtraIndent = /[{(\[]$/.test(currentLine.trim());
		const extraIndent = needsExtraIndent ? '  ' : '';

		// Insert newline with proper indentation
		setTimeout(() => {
			const newStart = this.element.selectionStart;
			const newValue = this.element.value;
			const insertIndent = '\n' + currentIndent + extraIndent;

			this.element.value = newValue.substring(0, newStart) + insertIndent + newValue.substring(newStart);
			this.element.selectionStart = this.element.selectionEnd = newStart + insertIndent.length;

			// Trigger change event
			this.element.dispatchEvent(new Event('input', { bubbles: true }));
		}, 0);
	}

	/**
	 * Highlights syntax errors in the code
	 * @param {Array} errors - Array of error objects with line/column info
	 */
	highlightErrors(errors) {
		this.currentErrors = errors || [];

		if (!errors || errors.length === 0) {
			this.clearErrorHighlighting();
			return;
		}

		// Add error highlighting class to editor
		this.element.classList.add('has-errors');
	}

	/**
	 * Clears error highlighting from the editor
	 */
	clearErrors() {
		this.currentErrors = [];
		this.clearErrorHighlighting();
	}

	/**
	 * Clears visual error highlighting
	 */
	clearErrorHighlighting() {
		this.element.classList.remove('has-errors');
	}

	/**
	 * Gets the current code value
	 * @returns {string} - Current code content
	 */
	getValue() {
		return this.element.value;
	}

	/**
	 * Sets the code value
	 * @param {string} code - Code to set
	 */
	setValue(code) {
		this.element.value = code || '';

		// Trigger change event if there's a callback
		if (this.changeCallback) {
			this.handleCodeChange(this.element.value);
		}
	}

	/**
	 * Registers a callback for code changes
	 * @param {Function} callback - Callback function to call on code changes
	 */
	onCodeChange(callback) {
		this.changeCallback = callback;
	}

	/**
	 * Sets focus to the code editor
	 */
	focus() {
		this.element.focus();
	}

	/**
	 * Gets the current cursor position
	 * @returns {Object} - Object with start and end positions
	 */
	getCursorPosition() {
		return {
			start: this.element.selectionStart,
			end: this.element.selectionEnd
		};
	}

	/**
	 * Sets the cursor position
	 * @param {number} start - Start position
	 * @param {number} end - End position (optional, defaults to start)
	 */
	setCursorPosition(start, end = start) {
		this.element.selectionStart = start;
		this.element.selectionEnd = end;
		this.element.focus();
	}

	/**
	 * Inserts text at the current cursor position
	 * @param {string} text - Text to insert
	 */
	insertText(text) {
		const start = this.element.selectionStart;
		const end = this.element.selectionEnd;
		const value = this.element.value;

		this.element.value = value.substring(0, start) + text + value.substring(end);
		this.element.selectionStart = this.element.selectionEnd = start + text.length;

		// Trigger change event
		this.element.dispatchEvent(new Event('input', { bubbles: true }));
	}

	/**
	 * Gets the selected text
	 * @returns {string} - Currently selected text
	 */
	getSelectedText() {
		const start = this.element.selectionStart;
		const end = this.element.selectionEnd;
		return this.element.value.substring(start, end);
	}

	/**
	 * Replaces the selected text
	 * @param {string} text - Text to replace selection with
	 */
	replaceSelectedText(text) {
		const start = this.element.selectionStart;
		const end = this.element.selectionEnd;
		const value = this.element.value;

		this.element.value = value.substring(0, start) + text + value.substring(end);
		this.element.selectionStart = start;
		this.element.selectionEnd = start + text.length;

		// Trigger change event
		this.element.dispatchEvent(new Event('input', { bubbles: true }));
	}

	/**
	 * Destroys the code editor and cleans up resources
	 */
	destroy() {
		// Clear debounce timer
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		// Remove added classes
		this.element.classList.remove('enhanced-code-editor', 'has-errors');

		// Clean up references
		this.changeCallback = null;
		this.currentErrors = [];
	}
}

/**
 * NameInput class manages bookmarklet naming with real-time updates
 * and provides default name fallback functionality
 */
class NameInput {
	constructor(elementId) {
		this.element = document.getElementById(elementId);
		this.changeCallback = null;
		this.defaultName = 'Custom Bookmarklet';

		if (!this.element) {
			throw new Error(`NameInput: Element with id '${elementId}' not found`);
		}

		this.init();
	}

	/**
	 * Initialize the name input component
	 */
	init() {
		this.setupEventListeners();
		this.setPlaceholder(this.defaultName);
	}

	/**
	 * Sets up event listeners for the name input
	 */
	setupEventListeners() {
		// Input event for real-time updates
		this.element.addEventListener('input', (e) => {
			this.handleNameChange(e.target.value);
		});

		// Additional events for better UX
		this.element.addEventListener('blur', (e) => {
			this.handleNameBlur(e.target.value);
		});

		this.element.addEventListener('focus', (e) => {
			this.handleNameFocus();
		});
	}

	/**
	 * Handles name input changes with real-time callback
	 * @param {string} name - The current name value
	 */
	handleNameChange(name) {
		if (this.changeCallback) {
			// Always pass the effective name (with fallback) to the callback
			const effectiveName = this.getEffectiveName(name);
			this.changeCallback(effectiveName);
		}
	}

	/**
	 * Handles name input blur event
	 * @param {string} name - The current name value
	 */
	handleNameBlur(name) {
		// Trim whitespace on blur
		const trimmedName = name.trim();
		if (trimmedName !== name) {
			this.element.value = trimmedName;
			this.handleNameChange(trimmedName);
		}
	}

	/**
	 * Handles name input focus event
	 */
	handleNameFocus() {
		// Select all text when focused for easy replacement
		this.element.select();
	}

	/**
	 * Gets the current name value from the input
	 * @returns {string} - Current name value
	 */
	getValue() {
		return this.element.value.trim();
	}

	/**
	 * Gets the effective name with default fallback
	 * @param {string} name - Optional name to check, uses current value if not provided
	 * @returns {string} - Effective name with fallback applied
	 */
	getEffectiveName(name) {
		const currentName = name !== undefined ? name : this.getValue();
		return currentName.trim() || this.defaultName;
	}

	/**
	 * Sets the name value
	 * @param {string} name - Name to set
	 */
	setValue(name) {
		this.element.value = name || '';

		// Trigger change event if there's a callback
		if (this.changeCallback) {
			this.handleNameChange(this.element.value);
		}
	}

	/**
	 * Sets the placeholder text for the input
	 * @param {string} text - Placeholder text
	 */
	setPlaceholder(text) {
		this.element.placeholder = text || this.defaultName;
	}

	/**
	 * Registers a callback for name changes
	 * @param {Function} callback - Callback function to call on name changes
	 */
	onNameChange(callback) {
		this.changeCallback = callback;
	}

	/**
	 * Sets the default name fallback
	 * @param {string} defaultName - Default name to use when input is empty
	 */
	setDefaultName(defaultName) {
		this.defaultName = defaultName || 'Custom Bookmarklet';
		this.setPlaceholder(this.defaultName);
	}

	/**
	 * Gets the current default name
	 * @returns {string} - Current default name
	 */
	getDefaultName() {
		return this.defaultName;
	}

	/**
	 * Clears the name input
	 */
	clear() {
		this.setValue('');
	}

	/**
	 * Sets focus to the name input
	 */
	focus() {
		this.element.focus();
	}

	/**
	 * Validates the name input
	 * @param {string} name - Optional name to validate, uses current value if not provided
	 * @returns {Object} - Validation result with isValid and message
	 */
	validateName(name) {
		const currentName = name !== undefined ? name : this.getValue();
		const effectiveName = this.getEffectiveName(currentName);

		// Basic validation rules
		if (effectiveName.length > 100) {
			return {
				isValid: false,
				message: 'Bookmarklet name is too long (maximum 100 characters)'
			};
		}

		// Check for potentially problematic characters in bookmarklet names
		const problematicChars = /[<>'"&]/;
		if (problematicChars.test(effectiveName)) {
			return {
				isValid: false,
				message: 'Bookmarklet name contains characters that may cause issues'
			};
		}

		return {
			isValid: true,
			message: null
		};
	}

	/**
	 * Destroys the name input and cleans up resources
	 */
	destroy() {
		// Clean up references
		this.changeCallback = null;
	}
}

/**
 * OutputDisplay class manages the display of generated bookmarklets with draggable functionality
 * and provides visual feedback for successful generation and error states
 */
class OutputDisplay {
	constructor(elementId) {
		this.element = document.getElementById(elementId);
		this.currentBookmarklet = null;

		if (!this.element) {
			throw new Error(`OutputDisplay: Element with id '${elementId}' not found`);
		}

		this.init();
	}

	/**
	 * Initialize the output display component
	 */
	init() {
		// Set initial state
		this.showPlaceholder();
	}

	/**
	 * Updates the display with a generated bookmarklet
	 * @param {Object} bookmarklet - Bookmarklet object with name, url, isValid, etc.
	 */
	updateBookmarklet(bookmarklet) {
		if (!bookmarklet || !bookmarklet.isValid) {
			this.currentBookmarklet = null;
			this.showError('Unable to generate bookmarklet');
			return;
		}

		this.currentBookmarklet = bookmarklet;
		this.displaySuccessState(bookmarklet);
	}

	/**
	 * Displays the successful bookmarklet generation state
	 * @param {Object} bookmarklet - Valid bookmarklet object
	 */
	displaySuccessState(bookmarklet) {
		// Clear any error states
		this.element.classList.remove('has-error');
		this.element.classList.add('has-content');

		// Create the bookmarklet display HTML
		const displayHtml = this.createBookmarkletDisplay(bookmarklet);
		this.element.innerHTML = displayHtml;

		// Set up drag functionality for the bookmarklet link
		this.setupDragFunctionality();

		// Add visual feedback for successful generation
		this.showSuccessFeedback();
	}

	/**
	 * Creates the HTML display for a bookmarklet
	 * @param {Object} bookmarklet - Bookmarklet object
	 * @returns {string} - HTML string for the bookmarklet display
	 */
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

	/**
	 * Gets length display information for the bookmarklet
	 * @param {Object} bookmarklet - Bookmarklet object
	 * @returns {Object} - Display information with HTML and status
	 */
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

	/**
	 * Creates a warning display for length or compatibility issues
	 * @param {string} warning - Warning message
	 * @returns {string} - HTML for warning display
	 */
	createWarningDisplay(warning) {
		return `
			<div class="bookmarklet-warning">
				<div class="warning-icon">⚠️</div>
				<div class="warning-message">${this.escapeHtml(warning)}</div>
			</div>
		`;
	}

	/**
	 * Sets up drag functionality for the bookmarklet link
	 */
	setupDragFunctionality() {
		const bookmarkletLink = this.element.querySelector('.bookmarklet-link');
		if (!bookmarkletLink) return;

		// Handle drag start
		bookmarkletLink.addEventListener('dragstart', (e) => {
			// Set the drag data for the bookmarklet
			const bookmarkletName = bookmarkletLink.getAttribute('data-bookmarklet-name');
			const bookmarkletUrl = bookmarkletLink.href;

			// Set drag data in multiple formats for better compatibility
			e.dataTransfer.setData('text/uri-list', bookmarkletUrl);
			e.dataTransfer.setData('text/plain', bookmarkletUrl);
			e.dataTransfer.setData('text/html', `<a href="${bookmarkletUrl}">${bookmarkletName}</a>`);

			// Set drag effect
			e.dataTransfer.effectAllowed = 'copy';

			// Add visual feedback during drag
			bookmarkletLink.classList.add('dragging');

			// Show drag instructions
			this.showDragFeedback();
		});

		// Handle drag end
		bookmarkletLink.addEventListener('dragend', (e) => {
			bookmarkletLink.classList.remove('dragging');
			this.hideDragFeedback();
		});

		// Prevent default click behavior when dragging
		bookmarkletLink.addEventListener('click', (e) => {
			// Only prevent default if this is likely a drag operation
			// (user clicked and held for a short time)
			if (bookmarkletLink.classList.contains('dragging')) {
				e.preventDefault();
			}
		});

		// Add context menu support for copying
		bookmarkletLink.addEventListener('contextmenu', (e) => {
			// Let the browser handle the context menu
			// Users can right-click to bookmark or copy link
		});
	}

	/**
	 * Shows visual feedback during drag operations
	 */
	showDragFeedback() {
		// Add a temporary drag instruction overlay
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

	/**
	 * Hides drag feedback overlay
	 */
	hideDragFeedback() {
		const overlay = this.element.querySelector('.drag-overlay');
		if (overlay) {
			overlay.remove();
		}
	}

	/**
	 * Shows visual feedback for successful bookmarklet generation
	 */
	showSuccessFeedback() {
		// Add a subtle animation or highlight to indicate success
		this.element.classList.add('generation-success');

		// Remove the success class after animation
		setTimeout(() => {
			this.element.classList.remove('generation-success');
		}, 1000);
	}

	/**
	 * Shows an error state with the provided message
	 * @param {string} message - Error message to display
	 */
	showError(message) {
		// Don't clear currentBookmarklet here - we might want to restore it later

		// Set error state classes
		this.element.classList.remove('has-content', 'generation-success');
		this.element.classList.add('has-error');

		// Display error message
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

	/**
	 * Clears any error state and returns to normal display
	 */
	clearError() {
		this.element.classList.remove('has-error');

		// If we have a current bookmarklet, redisplay it
		if (this.currentBookmarklet && this.currentBookmarklet.isValid) {
			this.displaySuccessState(this.currentBookmarklet);
		} else {
			this.showPlaceholder();
		}
	}

	/**
	 * Shows the placeholder state when no bookmarklet is generated
	 */
	showPlaceholder() {
		this.currentBookmarklet = null;

		// Clear all state classes
		this.element.classList.remove('has-content', 'has-error', 'generation-success');

		// Display placeholder content
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

	/**
	 * Gets the currently displayed bookmarklet
	 * @returns {Object|null} - Current bookmarklet object or null
	 */
	getCurrentBookmarklet() {
		return this.currentBookmarklet;
	}

	/**
	 * Checks if the display is currently showing an error
	 * @returns {boolean} - True if in error state
	 */
	isShowingError() {
		return this.element.classList.contains('has-error');
	}

	/**
	 * Checks if the display has content (valid bookmarklet)
	 * @returns {boolean} - True if showing valid content
	 */
	hasContent() {
		return this.element.classList.contains('has-content');
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

	/**
	 * Destroys the output display and cleans up resources
	 */
	destroy() {
		// Remove any event listeners and clean up
		const bookmarkletLink = this.element.querySelector('.bookmarklet-link');
		if (bookmarkletLink) {
			// Event listeners will be automatically removed when element is removed
		}

		// Clear references
		this.currentBookmarklet = null;

		// Reset element state
		this.element.classList.remove('has-content', 'has-error', 'generation-success');
		this.showPlaceholder();
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
