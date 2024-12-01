const CONFIG = {
    SYSTEM_PROMPT: `Keep the response in markdown format`
};
  
class AISession {
    static session = null;
    static async create() {
    if (!this.session) {
        this.session = await chrome.aiOriginTrial.languageModel.create({
        systemPrompt: CONFIG.SYSTEM_PROMPT,
        });
    }
    return this.session;
    }

    static async destroy() {
    if (this.session) {
        await this.session.destroy();
        this.session = null;
    }
    }

    static async prompt(promptText) {
        console.log('promptText', promptText); 
        try {
            if(!this.session){
                this.session = await this.create();
            }
            return this.session.prompt(promptText);
        } catch (error) {
            console.error('AI Prompt failed:', error);
            await this.destroy();
            throw error;
        }
    }
}

class Translator {
    static async translate(promptText, targetLanguage) {
        const session = await ai.translator.create({
            sourceLanguage: 'en',
            targetLanguage: targetLanguage,
            });
        const translated = await session.translate(promptText);
        await session.destroy();
        return translated;
    }
}

export { AISession, Translator };