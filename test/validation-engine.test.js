import { describe, it, expect, beforeEach } from 'vitest';

// Import the ValidationEngine class
// Since we're testing a class from script.js, we need to load it
import fs from 'fs';
import path from 'path';

// Read and evaluate the script.js file to get the ValidationEngine class
const scriptContent = fs.readFileSync(path.join(process.cwd(), 'script.js'), 'utf8');

// Extract just the ValidationEngine class for testing
const validationEngineMatch = scriptContent.match(/class ValidationEngine \{[\s\S]*?\n\}/);
if (!validationEngineMatch) {
	throw new Error('ValidationEngine class not found in script.js');
}

// Create a safe evaluation context
const ValidationEngine = eval(`(${validationEngineMatch[0]})`);

describe('ValidationEngine', () => {
	let validationEngine;

	beforeEach(() => {
		validationEngine = new ValidationEngine();
	});

	describe('validateSyntax', () => {
		it('should return valid for empty code', () => {
			const result = validationEngine.validateSyntax('');
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('should return valid for whitespace-only code', () => {
			const result = validationEngine.validateSyntax('   \n\t  ');
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('should validate simple valid JavaScript', () => {
			const validCode = 'console.log("Hello World");';
			const result = validationEngine.validateSyntax(validCode);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('should validate complex valid JavaScript', () => {
			const validCode = `
        function greet(name) {
          return "Hello, " + name + "!";
        }
        const message = greet("World");
        console.log(message);
      `;
			const result = validationEngine.validateSyntax(validCode);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('should validate arrow functions', () => {
			const validCode = 'const add = (a, b) => a + b;';
			const result = validationEngine.validateSyntax(validCode);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('should validate async/await syntax', () => {
			const validCode = `
        async function fetchData() {
          const response = await fetch('/api/data');
          return response.json();
        }
      `;
			const result = validationEngine.validateSyntax(validCode);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('should detect syntax errors - missing semicolon', () => {
			const invalidCode = 'console.log("Hello") console.log("World");';
			const result = validationEngine.validateSyntax(invalidCode);
			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].type).toBe('syntax');
		});

		it('should detect syntax errors - unmatched brackets', () => {
			const invalidCode = 'function test() { console.log("test");';
			const result = validationEngine.validateSyntax(invalidCode);
			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].type).toBe('syntax');
		});

		it('should detect syntax errors - invalid function syntax', () => {
			const invalidCode = 'function () { console.log("test"); }';
			const result = validationEngine.validateSyntax(invalidCode);
			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(1);
		});

		it('should detect syntax errors - unexpected token', () => {
			const invalidCode = 'const x = ;';
			const result = validationEngine.validateSyntax(invalidCode);
			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].type).toBe('syntax');
		});

		it('should handle multiple syntax errors', () => {
			const invalidCode = 'function test( { console.log("test") console.log("test2");';
			const result = validationEngine.validateSyntax(invalidCode);
			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(1); // Function constructor typically reports first error
		});
	});

	describe('parseError', () => {
		it('should parse basic error information', () => {
			const error = new SyntaxError('Unexpected token }');
			const result = validationEngine.parseError(error, 'console.log("test"}');

			expect(result.message).toContain('Unexpected token');
			expect(result.type).toBe('syntax');
		});

		it('should extract line information when available', () => {
			const error = new SyntaxError('Unexpected token } at line 2');
			const code = 'console.log("test");\nconsole.log("test"}';
			const result = validationEngine.parseError(error, code);

			expect(result.line).toBe(2);
			expect(result.context).toBe('console.log("test"}');
		});

		it('should handle errors without line information', () => {
			const error = new SyntaxError('Unexpected end of input');
			const result = validationEngine.parseError(error, 'function test() {');

			expect(result.line).toBeNull();
			expect(result.message).toContain('Unexpected end of input');
		});
	});

	describe('getErrorType', () => {
		it('should classify syntax errors', () => {
			const syntaxError = new SyntaxError('Unexpected token');
			const type = validationEngine.getErrorType(syntaxError);
			expect(type).toBe('syntax');
		});

		it('should classify reference errors', () => {
			const referenceError = new ReferenceError('undefined is not defined');
			const type = validationEngine.getErrorType(referenceError);
			expect(type).toBe('reference');
		});

		it('should classify type errors', () => {
			const typeError = new TypeError('Cannot read property');
			const type = validationEngine.getErrorType(typeError);
			expect(type).toBe('type');
		});

		it('should classify unexpected token as syntax error', () => {
			const error = new Error('Unexpected token }');
			const type = validationEngine.getErrorType(error);
			expect(type).toBe('syntax');
		});

		it('should default to general for unknown error types', () => {
			const error = new Error('Some unknown error');
			const type = validationEngine.getErrorType(error);
			expect(type).toBe('general');
		});
	});

	describe('cleanErrorMessage', () => {
		it('should clean up technical details', () => {
			const message = 'Unexpected token } in function anonymous at line 1 column 5';
			const cleaned = validationEngine.cleanErrorMessage(message);
			expect(cleaned).not.toContain('in function anonymous');
			expect(cleaned).not.toContain('at line 1 column 5');
		});

		it('should capitalize first letter', () => {
			const message = 'unexpected token }';
			const cleaned = validationEngine.cleanErrorMessage(message);
			expect(cleaned.charAt(0)).toBe('U');
		});

		it('should add period if missing', () => {
			const message = 'Unexpected token }';
			const cleaned = validationEngine.cleanErrorMessage(message);
			expect(cleaned.endsWith('.')).toBe(true);
		});

		it('should not add period if already present', () => {
			const message = 'Unexpected token }.';
			const cleaned = validationEngine.cleanErrorMessage(message);
			expect(cleaned.endsWith('..')).toBe(false);
		});
	});

	describe('formatErrors', () => {
		it('should return empty string for no errors', () => {
			const result = validationEngine.formatErrors([]);
			expect(result).toBe('');
		});

		it('should format single error', () => {
			const errors = [{
				message: 'Unexpected token }',
				type: 'syntax',
				line: 1,
				column: 5,
				context: 'console.log("test"}'
			}];

			const result = validationEngine.formatErrors(errors);
			expect(result).toContain('SYNTAX');
			expect(result).toContain('Unexpected token }');
			expect(result).toContain('Line 1');
			expect(result).toContain('console.log(&quot;test&quot;}');
		});

		it('should format multiple errors', () => {
			const errors = [
				{
					message: 'Unexpected token }',
					type: 'syntax',
					line: 1
				},
				{
					message: 'Missing semicolon',
					type: 'syntax',
					line: 2
				}
			];

			const result = validationEngine.formatErrors(errors);
			expect(result).toContain('Unexpected token }');
			expect(result).toContain('Missing semicolon');
		});

		it('should handle errors without line information', () => {
			const errors = [{
				message: 'General syntax error',
				type: 'syntax',
				line: null,
				column: null,
				context: null
			}];

			const result = validationEngine.formatErrors(errors);
			expect(result).toContain('General syntax error');
			expect(result).not.toContain('Line');
		});
	});

	describe('escapeHtml', () => {
		it('should escape HTML characters', () => {
			const text = '<script>alert("xss")</script>';
			const escaped = validationEngine.escapeHtml(text);
			expect(escaped).not.toContain('<script>');
			expect(escaped).toContain('&lt;script&gt;');
		});

		it('should handle ampersands', () => {
			const text = 'Tom & Jerry';
			const escaped = validationEngine.escapeHtml(text);
			expect(escaped).toContain('&amp;');
		});

		it('should handle quotes', () => {
			const text = 'He said "Hello"';
			const escaped = validationEngine.escapeHtml(text);
			expect(escaped).toContain('&quot;');
		});
	});

	describe('Real-world bookmarklet code validation', () => {
		it('should validate typical bookmarklet code', () => {
			const bookmarkletCode = `
        (function() {
          var links = document.querySelectorAll('a');
          for (var i = 0; i < links.length; i++) {
            links[i].style.backgroundColor = 'yellow';
          }
        })();
      `;

			const result = validationEngine.validateSyntax(bookmarkletCode);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('should validate DOM manipulation code', () => {
			const code = `
        document.body.style.backgroundColor = 'lightblue';
        var h1 = document.createElement('h1');
        h1.textContent = 'Hello from bookmarklet!';
        document.body.appendChild(h1);
      `;

			const result = validationEngine.validateSyntax(code);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('should validate code with external API calls', () => {
			const code = `
        fetch('https://api.example.com/data')
          .then(response => response.json())
          .then(data => console.log(data))
          .catch(error => console.error('Error:', error));
      `;

			const result = validationEngine.validateSyntax(code);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});
	});
});
