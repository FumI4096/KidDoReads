export default class ScoreEvaluator {
    /**
     * Evaluates a score and returns category, message, emoji, speech, and styling
     * @param {number} score - The achieved score
     * @param {number} total - The total possible score
     * @returns {Object} - { category, message, emoji, speech, color, backgroundColor }
     */
    static evaluate(score, total) {
        const percentage = (score / total) * 100;
        console.log(percentage)

        // Perfect Score (100%)
        if (percentage === 100) {
            return {
                category: "perfect",
            };
        }
        // Great (70-99%)
        else if (percentage >= 70) {
            return {
                category: "great",
            };
        }
        // Good (40-69%)
        else if (percentage >= 40) {
            return {
                category: "good",
            };
        }
        // Bad (0-39%)
        else {
            return {
                category: "bad",

            };
        }
    }

    /**
     * Get just the category name
     * @param {number} score
     * @param {number} total
     * @returns {string} - Category name
     */
    static getCategory(score, total) {
        return this.evaluate(score, total).category;
    }

    static getFormattedScore(score, total) {
        const result = this.evaluate(score, total);
        return `${result.emoji} ${result.message} - ${score}/${total}`;
    }
}