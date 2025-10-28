export const NavigationManager = {
    stack: [],
    
    pushState(state) {
        this.stack.push({
            level: state.level,
            data: state.data,
            headerHTML: state.headerHTML,
            tableHeaderHTML: state.tableHeaderHTML,
            tableBodyHTML: state.tableBodyHTML,
            timestamp: Date.now()
        });
    },
    
    popState() {
        return this.stack.pop();
    },
    
    hasPreviousState() {
        return this.stack.length > 0;
    },
    
    clearStack() {
        this.stack = [];
    },
    
    getCurrentLevel() {
        return this.stack.length > 0 ? this.stack[this.stack.length - 1].level : 0;
    }
};

export default NavigationManager;
