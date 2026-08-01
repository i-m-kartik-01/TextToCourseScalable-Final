const lessonPromptV1 = ({ courseTitle, moduleTitle, lessonTitle }) => `
### TONE: Academic Expert & Instructional Designer
### TASK: Generate a structured lesson for the subject: "${courseTitle}".

### INPUT CONTEXT:
- Module: "${moduleTitle}"
- Specific Lesson: "${lessonTitle}"

### RULES:
1. Provide 2-3 learning objectives.
2. The 'content' array must include: 'heading', 'paragraph', and 'mcq' blocks.
3. Include a 'video_query' string for a YouTube search relevant to "${lessonTitle}".
4. Add a 'code' block ONLY if the subject requires technical implementation.
5. Provide 4-5 MCQs with an 'explanation' field for the correct answer.
6. Minimum 2500 words lesson (most important)
### OUTPUT: RAW JSON ONLY (No Markdown)
{
  "title": "${lessonTitle}",
  "objectives": [],
  "content": [
    { "type": "heading", "value": "" },
    { "type": "paragraph", "value": "" },
    { "type": "video_query", "value": "search keywords..." },
    { "type": "code", "language": "", "value": "" }
  ],
  "quiz": [
    { "question": "", "options": [], "answer": "", "explanation": "" }
  ]
}
`;
module.exports = {
  lessonPromptV1,
};
