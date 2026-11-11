import { GenerationAnswers, ParsedVariable } from '../types';

/**
 * Regex to match questions enclosed in square brackets: [Question for the user]
 * Also supports optional preceding (variable_name) for backward compatibility:
 * e.g. [What is your name?] or (name) [What is your name?]
 */
export const QUESTION_REGEX = /(?:\([a-zA-Z0-9_]+\)\s*)?\[([^\]]+)\]/g;

/**
 * Parses the meta paragraph and returns an ordered list of unique questions.
 * The question text itself is the variable!
 */
export function parseMetaParagraph(metaParagraph: string): ParsedVariable[] {
  if (!metaParagraph) return [];

  const variables: ParsedVariable[] = [];
  const seenQuestions = new Set<string>();

  const regex = new RegExp(QUESTION_REGEX);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(metaParagraph)) !== null) {
    const questionText = match[1].trim();

    if (questionText && !seenQuestions.has(questionText)) {
      seenQuestions.add(questionText);
      variables.push({
        name: questionText, // The question itself is the variable
        question: questionText,
      });
    }
  }

  // Backward compatibility: If no [...] was found, check for legacy {{var_name}}
  if (variables.length === 0) {
    const legacyRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    let legacyMatch: RegExpExecArray | null;
    while ((legacyMatch = legacyRegex.exec(metaParagraph)) !== null) {
      const varName = legacyMatch[1].trim();
      const formattedQ = formatLegacyQuestion(varName);
      if (!seenQuestions.has(formattedQ)) {
        seenQuestions.add(formattedQ);
        variables.push({
          name: varName,
          question: formattedQ,
        });
      }
    }
  }

  return variables;
}

function formatLegacyQuestion(varName: string): string {
  const readable = varName
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return `What is your ${readable.toLowerCase()}?`;
}

export interface MetaParagraphValidationResult {
  isValid: boolean;
  variables: ParsedVariable[];
  errors: string[];
  warnings: string[];
}

/**
 * Validates the meta paragraph for syntax correctness.
 */
export function validateMetaParagraph(text: string): MetaParagraphValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!text || !text.trim()) {
    return {
      isValid: false,
      variables: [],
      errors: ['Meta paragraph cannot be empty.'],
      warnings: [],
    };
  }

  const variables = parseMetaParagraph(text);

  if (variables.length === 0) {
    errors.push(
      'No questions detected. Use square brackets like [What is your name?] wherever you want a question in the prompt.'
    );
  }

  // Check for empty brackets []
  if (/\[\s*\]/.test(text)) {
    warnings.push('Detected empty brackets []. Please write the question inside the brackets.');
  }

  return {
    isValid: errors.length === 0,
    variables,
    errors,
    warnings,
  };
}

export interface PromptConstructionResult {
  completedPrompt: string;
  missingRequired: string[];
  totalVariables: number;
}

/**
 * Deterministically constructs the completed prompt by replacing every [Question]
 * marker with the user's answer.
 *
 * CRITICAL REQUIREMENTS:
 * - The answer replaces the entire [Question] marker.
 * - All surrounding text, spacing, paragraphs, and punctuation are preserved 100%.
 * - If the same question appears multiple times, the same answer is inserted everywhere.
 * - Uses string replacement functions to prevent regex special character ($1, $&) collisions.
 */
export function constructPrompt(
  metaParagraph: string,
  answers: GenerationAnswers
): PromptConstructionResult {
  const variables = parseMetaParagraph(metaParagraph);
  const missingRequired: string[] = [];

  // Check which questions have not been answered
  variables.forEach(v => {
    // Check both by question text (new) and legacy var name
    const answer = answers[v.question] ?? answers[v.name];
    if (answer === undefined || answer === null || answer.trim() === '') {
      missingRequired.push(v.question);
    }
  });

  if (missingRequired.length > 0) {
    return {
      completedPrompt: metaParagraph,
      missingRequired,
      totalVariables: variables.length,
    };
  }

  // Replace all [Question] markers (and optional preceding (var) if present)
  let output = metaParagraph.replace(QUESTION_REGEX, (_fullMatch, questionText) => {
    const qKey = questionText.trim();
    const answer = answers[qKey] ?? answers[qKey.toLowerCase()] ?? '';
    return answer;
  });

  // Backward compatibility: replace legacy {{varName}}
  variables.forEach(v => {
    const legacyToken = `{{${v.name}}}`;
    const answer = answers[v.question] ?? answers[v.name] ?? '';
    if (output.includes(legacyToken)) {
      output = output.split(legacyToken).join(answer);
    }
  });

  return {
    completedPrompt: output,
    missingRequired: [],
    totalVariables: variables.length,
  };
}

/**
 * Helper to ensure a Category object has a valid metaParagraph string.
 */
export function getCategoryMetaParagraph(cat: {
  metaParagraph?: string;
  masterPrompt?: string;
  variables?: any[];
}): string {
  if (cat.metaParagraph && cat.metaParagraph.trim()) {
    return cat.metaParagraph;
  }

  if (cat.masterPrompt) {
    let result = cat.masterPrompt;
    if (cat.variables && Array.isArray(cat.variables)) {
      cat.variables.forEach((v: any) => {
        if (v.name && v.question) {
          const oldToken = `{{${v.name}}}`;
          const newToken = `[${v.question}]`;
          result = result.split(oldToken).join(newToken);
        }
      });
    }
    // Also convert any (var) [question] to just [question]
    result = result.replace(/\([a-zA-Z0-9_]+\)\s*\[([^\]]+)\]/g, '[$1]');
    return result;
  }

  return '';
}
