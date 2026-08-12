/**
 * Server-side question bank for skill assessments.
 *
 * Each skill maps to an array of 5 MCQ objects:
 *   { q: string, options: string[], correct: number }
 *
 * `correct` is the 0-based index of the right answer in the
 * canonical `options` array.  This value NEVER leaves the server.
 *
 * The frontend receives options in this canonical order, shuffles
 * them for display, but maps the user's selection back to the
 * canonical index before submitting.
 */

const QUESTION_BANK = {
  React: [
    { q: 'What hook manages component state in React?', options: ['useState', 'useEffect', 'useRef', 'useMemo'], correct: 0 },
    { q: 'Which lifecycle is equivalent to componentDidMount?', options: ['useEffect(fn, [])', 'useEffect(fn)', 'useMemo(fn, [])', 'useCallback(fn)'], correct: 0 },
    { q: 'What does the key prop help React with?', options: ['Efficient list reconciliation', 'CSS styling', 'Event binding', 'Server rendering'], correct: 0 },
    { q: 'Which statement about React props is true?', options: ['They flow parent → child', 'They are mutable', 'They flow child → parent', 'They require Redux'], correct: 0 },
    { q: 'What is the Virtual DOM?', options: ['An in-memory representation of the real DOM', 'A browser API', 'A CSS engine', 'A bundler plugin'], correct: 0 },
  ],

  'Node.js': [
    { q: 'What module system does Node.js primarily use?', options: ['CommonJS (require)', 'AMD', 'SystemJS', 'UMD'], correct: 0 },
    { q: 'Which method reads a file asynchronously?', options: ['fs.readFile', 'fs.readFileSync', 'fs.open', 'path.read'], correct: 0 },
    { q: 'What is the event loop responsible for?', options: ['Non-blocking I/O handling', 'Garbage collection', 'Module loading', 'Memory allocation'], correct: 0 },
    { q: 'Which tool manages Node.js packages?', options: ['npm / yarn', 'pip', 'cargo', 'gem'], correct: 0 },
    { q: 'What does process.env give you?', options: ['Environment variables', 'Process arguments', 'System PATH', 'File descriptors'], correct: 0 },
  ],

  'UI/UX Design': [
    { q: 'What does UX stand for?', options: ['User Experience', 'Universal Exchange', 'Unified Extension', 'User Execution'], correct: 0 },
    { q: 'Which principle improves readability in UI design?', options: ['Visual hierarchy', 'Maximising colour count', 'Using all-caps everywhere', 'Removing whitespace'], correct: 0 },
    { q: 'What is a wireframe?', options: ['A low-fidelity layout sketch', 'A CSS framework', 'A testing tool', 'A deployment pipeline'], correct: 0 },
    { q: 'Which is a common usability heuristic?', options: ['Visibility of system status', 'Maximise user effort', 'Hide navigation', 'Use jargon freely'], correct: 0 },
    { q: 'What does responsive design ensure?', options: ['Content adapts to screen size', 'Faster server response', 'Better SEO ranking', 'Reduced file size'], correct: 0 },
  ],

  Photoshop: [
    { q: 'What file format preserves layers in Photoshop?', options: ['PSD', 'JPEG', 'PNG', 'GIF'], correct: 0 },
    { q: 'Which tool selects areas by colour similarity?', options: ['Magic Wand', 'Brush', 'Pen', 'Gradient'], correct: 0 },
    { q: 'What does a layer mask do?', options: ['Non-destructively hides parts of a layer', 'Deletes the layer', 'Duplicates the layer', 'Merges all layers'], correct: 0 },
    { q: 'What colour mode is used for print?', options: ['CMYK', 'RGB', 'HSL', 'Grayscale'], correct: 0 },
    { q: 'What does DPI measure?', options: ['Dots per inch (print resolution)', 'Download speed', 'Display port interface', 'Data packets inbound'], correct: 0 },
  ],

  SEO: [
    { q: 'What does SEO stand for?', options: ['Search Engine Optimization', 'Secure Element Output', 'Site Engagement Order', 'Server Error Output'], correct: 0 },
    { q: 'Which tag is most important for on-page SEO?', options: ['<title>', '<meta name="keywords">', '<h5>', '<footer>'], correct: 0 },
    { q: 'What is a backlink?', options: ['A link from another site to yours', 'An internal nav link', 'A CSS anchor', 'A broken link'], correct: 0 },
    { q: 'What does a 301 redirect signal to search engines?', options: ['Permanent move', 'Temporary move', 'Not found', 'Server error'], correct: 0 },
    { q: 'Which metric measures page load performance?', options: ['Core Web Vitals', 'Bounce rate alone', 'Session duration', 'Click-through rate'], correct: 0 },
  ],

  Python: [
    { q: 'Which keyword defines a function in Python?', options: ['def', 'function', 'fn', 'func'], correct: 0 },
    { q: 'What does len() return?', options: ['The number of items in a collection', 'The last item', 'The first item', 'A boolean'], correct: 0 },
    { q: 'Which data structure is immutable?', options: ['Tuple', 'List', 'Dictionary', 'Set'], correct: 0 },
    { q: 'What does PEP 8 define?', options: ['Python coding style guidelines', 'A package manager', 'A testing framework', 'A web framework'], correct: 0 },
    { q: 'What is a list comprehension?', options: ['A concise way to create lists', 'A sorting algorithm', 'A debugging tool', 'A file reader'], correct: 0 },
  ],

  'Data Analysis': [
    { q: 'Which Python library is primary for tabular data?', options: ['pandas', 'Flask', 'Django', 'Tkinter'], correct: 0 },
    { q: 'What does a box plot visualise?', options: ['Distribution quartiles and outliers', 'Correlation coefficients', 'Time series trends', 'Category proportions'], correct: 0 },
    { q: 'What is a null hypothesis?', options: ['A default assumption of no effect', 'The expected outcome', 'A rejected theory', 'A confirmed result'], correct: 0 },
    { q: 'Which chart best shows part-to-whole relationships?', options: ['Pie chart', 'Scatter plot', 'Line chart', 'Box plot'], correct: 0 },
    { q: 'What does ETL stand for?', options: ['Extract, Transform, Load', 'Encode, Transfer, Log', 'Edit, Test, Launch', 'Export, Tabulate, Link'], correct: 0 },
  ],

  Copywriting: [
    { q: 'What is the primary goal of copywriting?', options: ['Persuade the reader to take action', 'Write long essays', 'Correct grammar errors', 'Design layouts'], correct: 0 },
    { q: 'What is a CTA?', options: ['Call To Action', 'Click Through Average', 'Content Type Attribute', 'Creative Text Alternative'], correct: 0 },
    { q: 'Which headline technique uses numbers?', options: ['Listicle format ("7 Ways to…")', 'Passive voice', 'All lowercase', 'No punctuation'], correct: 0 },
    { q: 'What does A/B testing in copy measure?', options: ['Which version converts better', 'Word count differences', 'Grammar accuracy', 'Reading speed'], correct: 0 },
    { q: 'What tone works best for B2C marketing?', options: ['Conversational and benefit-focused', 'Formal and academic', 'Passive and vague', 'Technical jargon-heavy'], correct: 0 },
  ],

  'Video Editing': [
    { q: 'What does a J-cut do?', options: ['Audio from next clip starts before video', 'Jumps to the last frame', 'Joins two clips instantly', 'Jitters the footage'], correct: 0 },
    { q: 'Which frame rate is standard for film?', options: ['24 fps', '10 fps', '60 fps', '120 fps'], correct: 0 },
    { q: 'What is colour grading?', options: ['Adjusting colours for mood and consistency', 'Sorting clips alphabetically', 'Adding subtitles', 'Exporting in 4K'], correct: 0 },
    { q: 'What does a keyframe define?', options: ['A point where a property value is set for animation', 'The first frame of a clip', 'A thumbnail', 'A scene marker'], correct: 0 },
    { q: 'Which codec is commonly used for web delivery?', options: ['H.264', 'ProRes', 'DNxHR', 'Cineform'], correct: 0 },
  ],

  WordPress: [
    { q: 'What language are WordPress themes built with?', options: ['PHP', 'Python', 'Ruby', 'Java'], correct: 0 },
    { q: 'What is a WordPress hook?', options: ['A way to run custom code at specific points', 'A CSS selector', 'A database table', 'A page template'], correct: 0 },
    { q: 'Which file is required in every WordPress theme?', options: ['style.css', 'app.js', 'config.json', 'routes.php'], correct: 0 },
    { q: 'What does a plugin extend?', options: ['WordPress functionality without modifying core', 'The database schema', 'The server OS', 'The PHP version'], correct: 0 },
    { q: 'What is the WordPress loop?', options: ['PHP code that displays posts', 'A CSS animation', 'A cron job', 'A redirect chain'], correct: 0 },
  ],
};

// Fallback questions for any skill not in the bank
const DEFAULT_QUESTIONS = [
  { q: 'What is the primary purpose of this skill?', options: ['Produce deliverables', 'Write documentation', 'Attend meetings', 'File reports'], correct: 0 },
  { q: 'Which best practice is most important in this domain?', options: ['Version control', 'Skipping tests', 'Ignoring feedback', 'Avoiding tools'], correct: 0 },
  { q: 'How do you handle client revision requests?', options: ['Discuss scope then revise', 'Ignore them', 'Charge triple', 'Quit the project'], correct: 0 },
  { q: 'What makes a deliverable "complete"?', options: ['It meets the agreed spec', 'It looks nice', 'You ran out of time', 'Client stopped responding'], correct: 0 },
  { q: 'Which is the correct approach for a tight deadline?', options: ['Communicate early & prioritize', 'Overcommit silently', 'Miss the deadline', 'Blame tooling'], correct: 0 },
];

/**
 * Returns the full question set (WITH correct answers) for server-side grading.
 * @param {string} skillName
 * @returns {{ q: string, options: string[], correct: number }[]}
 */
function getQuestionsForGrading(skillName) {
  return QUESTION_BANK[skillName] || DEFAULT_QUESTIONS;
}

/**
 * Returns questions safe to send to the client (correct answers stripped).
 * @param {string} skillName
 * @returns {{ q: string, options: string[] }[]}
 */
function getQuestionsForClient(skillName) {
  const questions = getQuestionsForGrading(skillName);
  return questions.map(({ q, options }) => ({ q, options }));
}

module.exports = { getQuestionsForGrading, getQuestionsForClient };
