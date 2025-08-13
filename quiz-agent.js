/**
 * QuizeraAgent - A class to interact with the Quizera backend agent
 * This handles PDF uploads and quiz generation
 */
class QuizeraAgent {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
    }

    /**
     * Generate a quiz from a PDF file
     * @param {File} pdfFile - The PDF file to generate a quiz from
     * @param {string} quizType - The type of quiz to generate (1-6)
     * @param {string} difficulty - The difficulty level (1-3)
     * @param {number} numQuestions - The number of questions to generate
     * @returns {Promise<Object>} - The generated quiz data
     */
    async generateQuiz(pdfFile, quizType = '1', difficulty = '2', numQuestions = 5) {
        const formData = new FormData();
        formData.append('pdf', pdfFile);
        formData.append('quiz_type', quizType);
        formData.append('difficulty', difficulty);
        formData.append('num_questions', numQuestions);

        try {
            const response = await fetch(`${this.baseUrl}/api/generate-quiz`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const quizData = await response.json();
            return quizData;
        } catch (error) {
            console.error('Error generating quiz:', error);
            throw error;
        }
    }

    /**
     * Get quiz type description
     * @param {string} quizTypeId - The quiz type ID (1-6)
     * @returns {string} - The quiz type description
     */
    getQuizTypeDescription(quizTypeId) {
        const quizTypes = {
            "1": "Multiple Choice Questions (MCQs)",
            "2": "Fill in the blanks",
            "3": "True/False questions",
            "4": "Short answer questions",
            "5": "Long answer questions",
            "6": "Mix of all question types"
        };
        return quizTypes[quizTypeId] || quizTypes["1"];
    }

    /**
     * Get difficulty level description
     * @param {string} difficultyId - The difficulty ID (1-3)
     * @returns {string} - The difficulty description
     */
    getDifficultyDescription(difficultyId) {
        const difficulties = {
            "1": "Easy",
            "2": "Medium",
            "3": "Hard"
        };
        return difficulties[difficultyId] || difficulties["2"];
    }
}

// Create a global instance of the agent
window.quizeraAgent = new QuizeraAgent();
