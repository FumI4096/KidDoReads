const GenerateSpeech = {
    input: "",
    setInput(input){
        this.input = input
    },

    getInput(){
        return this.input
    },

    clearInput(){
        this.input = ""
    }
}

export default GenerateSpeech;